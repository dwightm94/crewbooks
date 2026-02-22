const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, ScanCommand } = require("@aws-sdk/lib-dynamodb");
const { db } = require("../../lib/dynamodb");
const { success, error } = require("../../lib/response");

const INVOICES_TABLE = process.env.INVOICES_TABLE;
const USERS_TABLE = process.env.USERS_TABLE;
const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY;
const FRONTEND_URL = process.env.FRONTEND_URL || "https://master.dlw0zhxk42vjk.amplifyapp.com";
const PLATFORM_FEE_PERCENT = 2.5; // 2.5% flat fee

const client = new DynamoDBClient({ region: process.env.REGION || "us-east-1" });
const docClient = DynamoDBDocumentClient.from(client, { marshallOptions: { removeUndefinedValues: true } });

let stripe;
function getStripe() {
  if (!stripe) stripe = require("stripe")(STRIPE_SECRET);
  return stripe;
}

async function findInvoice(invoiceId) {
  const { Items } = await docClient.send(new ScanCommand({
    TableName: INVOICES_TABLE,
    FilterExpression: "invoiceId = :id",
    ExpressionAttributeValues: { ":id": invoiceId },
  }));
  return Items && Items.length > 0 ? Items[0] : null;
}

exports.handler = async (event) => {
  const method = event.httpMethod;
  const path = event.resource;
  const userId = event.requestContext?.authorizer?.claims?.sub;

  try {
    // Authenticated routes
    if (path === "/payments/connect" && method === "POST") return await createConnectAccount(event, userId);
    if (path === "/payments/connect/status" && method === "GET") return await getConnectStatus(event, userId);
    if (path === "/payments/connect/dashboard" && method === "GET") return await getConnectDashboard(event, userId);
    if (path === "/payments/connect/onboard" && method === "POST") return await createOnboardLink(event, userId);

    // Public routes (no auth)
    if (path === "/pay/{invoiceId}" && method === "GET") return await getInvoiceForPayment(event);
    if (path === "/pay/{invoiceId}" && method === "POST") return await createCheckout(event);
    if (path === "/stripe-webhook" && method === "POST") return await handleWebhook(event);

    return error("Not found", 404);
  } catch (err) { console.error(err); return error("Internal server error", 500); }
};

// ===== STRIPE CONNECT: Create account for contractor =====
async function createConnectAccount(event, userId) {
  if (!userId) return error("Unauthorized", 401);
  const s = getStripe();
  const body = JSON.parse(event.body || "{}");

  // Check if user already has a connect account
  const user = await db.get(USERS_TABLE, `USER#${userId}`, `PROFILE#${userId}`);
  if (user?.stripeAccountId) {
    return success({ accountId: user.stripeAccountId, alreadyExists: true });
  }

  // Create Express connect account
  const account = await s.accounts.create({
    type: "express",
    country: "US",
    email: body.email,
    capabilities: { card_payments: { requested: true }, transfers: { requested: true } },
    business_type: "individual",
    metadata: { userId, platform: "crewbooks" },
  });

  // Save to user profile
  await db.update(USERS_TABLE, `USER#${userId}`, `PROFILE#${userId}`, {
    stripeAccountId: account.id,
    stripeOnboarded: false,
    updatedAt: new Date().toISOString(),
  });

  return success({ accountId: account.id });
}

// ===== STRIPE CONNECT: Generate onboarding link =====
async function createOnboardLink(event, userId) {
  if (!userId) return error("Unauthorized", 401);
  const s = getStripe();

  const user = await db.get(USERS_TABLE, `USER#${userId}`, `PROFILE#${userId}`);
  if (!user?.stripeAccountId) return error("No Stripe account. Create one first.");

  const link = await s.accountLinks.create({
    account: user.stripeAccountId,
    refresh_url: `${FRONTEND_URL}/settings?stripe=refresh`,
    return_url: `${FRONTEND_URL}/settings?stripe=complete`,
    type: "account_onboarding",
  });

  return success({ url: link.url });
}

// ===== STRIPE CONNECT: Check account status =====
async function getConnectStatus(event, userId) {
  if (!userId) return error("Unauthorized", 401);
  const s = getStripe();

  const user = await db.get(USERS_TABLE, `USER#${userId}`, `PROFILE#${userId}`);
  if (!user?.stripeAccountId) return success({ connected: false });

  const account = await s.accounts.retrieve(user.stripeAccountId);
  const ready = account.charges_enabled && account.payouts_enabled;

  // Update onboarded status
  if (ready && !user.stripeOnboarded) {
    await db.update(USERS_TABLE, `USER#${userId}`, `PROFILE#${userId}`, {
      stripeOnboarded: true, updatedAt: new Date().toISOString(),
    });
  }

  return success({
    connected: true, accountId: user.stripeAccountId,
    chargesEnabled: account.charges_enabled, payoutsEnabled: account.payouts_enabled,
    onboarded: ready, details: account.details_submitted,
  });
}

// ===== STRIPE CONNECT: Dashboard link =====
async function getConnectDashboard(event, userId) {
  if (!userId) return error("Unauthorized", 401);
  const s = getStripe();

  const user = await db.get(USERS_TABLE, `USER#${userId}`, `PROFILE#${userId}`);
  if (!user?.stripeAccountId) return error("No Stripe account");

  const link = await s.accounts.createLoginLink(user.stripeAccountId);
  return success({ url: link.url });
}

// ===== PUBLIC: Get invoice for payment page =====
async function getInvoiceForPayment(event) {
  const invoiceId = event.pathParameters?.invoiceId;
  if (!invoiceId) return error("Invoice ID required");
  const inv = await findInvoice(invoiceId);
  if (!inv) return error("Invoice not found", 404);
  return success({
    invoiceId: inv.invoiceId, amount: inv.amount, jobName: inv.jobName,
    clientName: inv.clientName, dueDate: inv.dueDate, status: inv.status,
  });
}

// ===== PUBLIC: Create Stripe Checkout with Connect =====
async function createCheckout(event) {
  const invoiceId = event.pathParameters?.invoiceId;
  if (!invoiceId) return error("Invoice ID required");
  const inv = await findInvoice(invoiceId);
  if (!inv) return error("Invoice not found", 404);
  if (inv.status === "paid") return error("Invoice already paid");

  const s = getStripe();
  const amountCents = Math.round((inv.amount || 0) * 100);
  const platformFee = Math.round(amountCents * PLATFORM_FEE_PERCENT / 100);

  // Find the contractor's Stripe Connect account
  const pk = inv.PK || "";
  // PK could be JOB#jobId — need to find the user who owns this job
  let stripeAccountId = null;
  if (pk.startsWith("JOB#")) {
    const jobId = pk.replace("JOB#", "");
    // Scan jobs table for this job to find the user
    const { Items: jobItems } = await docClient.send(new ScanCommand({
      TableName: process.env.JOBS_TABLE,
      FilterExpression: "jobId = :jid",
      ExpressionAttributeValues: { ":jid": jobId },
    }));
    if (jobItems?.length) {
      const jobUserId = jobItems[0].PK?.replace("USER#", "");
      if (jobUserId) {
        const user = await db.get(USERS_TABLE, `USER#${jobUserId}`, `PROFILE#${jobUserId}`);
        stripeAccountId = user?.stripeAccountId;
      }
    }
  }

  const sessionParams = {
    payment_method_types: ["card"],
    line_items: [{
      price_data: {
        currency: "usd",
        product_data: {
          name: "Invoice: " + (inv.jobName || "Service"),
          description: "Invoice for " + (inv.clientName || "Client"),
        },
        unit_amount: amountCents,
      },
      quantity: 1,
    }],
    mode: "payment",
    success_url: FRONTEND_URL + "/pay-success?invoice=" + invoiceId,
    cancel_url: FRONTEND_URL + "/pay/" + invoiceId + "?cancelled=true",
    metadata: { invoiceId: invoiceId, PK: inv.PK, SK: inv.SK },
  };

  // If contractor has Stripe Connect, use it with platform fee
  if (stripeAccountId) {
    sessionParams.payment_intent_data = {
      application_fee_amount: platformFee,
      transfer_data: { destination: stripeAccountId },
    };
  }

  const session = await s.checkout.sessions.create(sessionParams);
  return success({ sessionId: session.id, url: session.url });
}

// ===== WEBHOOK: Handle payment completion =====
async function handleWebhook(event) {
  let webhookEvent;
  try { webhookEvent = JSON.parse(event.body); } catch (e) { return error("Invalid payload", 400); }

  if (webhookEvent.type === "checkout.session.completed") {
    const session = webhookEvent.data.object;
    const meta = session.metadata || {};
    if (meta.invoiceId && meta.PK && meta.SK) {
      await db.update(INVOICES_TABLE, meta.PK, meta.SK, {
        status: "paid", paidAt: new Date().toISOString(),
        stripeSessionId: session.id, stripePaymentIntent: session.payment_intent,
        amountPaid: session.amount_total ? session.amount_total / 100 : null,
      });
    }
  }

  // Handle Connect account updates
  if (webhookEvent.type === "account.updated") {
    const account = webhookEvent.data.object;
    const userId = account.metadata?.userId;
    if (userId && account.charges_enabled) {
      await db.update(USERS_TABLE, `USER#${userId}`, `PROFILE#${userId}`, {
        stripeOnboarded: true, updatedAt: new Date().toISOString(),
      });
    }
  }

  return success({ received: true });
}
