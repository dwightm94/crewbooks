const { db } = require("../../lib/dynamodb");
const { success, error } = require("../../lib/response");
const { getUserId } = require("../../lib/validators");

const INVOICES_TABLE = process.env.INVOICES_TABLE;
const JOBS_TABLE = process.env.JOBS_TABLE;
const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY;
const FRONTEND_URL = process.env.FRONTEND_URL || "https://master.dlw0zhxk42vjk.amplifyapp.com";

let stripe;
function getStripe() {
  if (!stripe) stripe = require("stripe")(STRIPE_SECRET);
  return stripe;
}

exports.handler = async (event) => {
  const method = event.httpMethod;
  const path = event.resource;

  try {
    // Public: create checkout session for invoice payment
    if (path === "/pay/{invoiceId}" && method === "POST") return await createCheckout(event);
    // Public: get invoice for payment page
    if (path === "/pay/{invoiceId}" && method === "GET") return await getInvoiceForPayment(event);
    // Webhook from Stripe
    if (path === "/stripe-webhook" && method === "POST") return await handleWebhook(event);

    return error("Not found", 404);
  } catch (err) { console.error(err); return error("Internal server error", 500); }
};

async function getInvoiceForPayment(event) {
  const invoiceId = event.pathParameters?.invoiceId;
  if (!invoiceId) return error("Invoice ID required");

  // Scan for the invoice by invoiceId
  const result = await db.scan(INVOICES_TABLE, {
    FilterExpression: "invoiceId = :id",
    ExpressionAttributeValues: { ":id": invoiceId },
  });
  if (!result.length) return error("Invoice not found", 404);
  const inv = result[0];
  
  return success({
    invoiceId: inv.invoiceId, amount: inv.amount, jobName: inv.jobName,
    clientName: inv.clientName, dueDate: inv.dueDate, status: inv.status,
    companyName: inv.companyName || "CrewBooks",
  });
}

async function createCheckout(event) {
  const invoiceId = event.pathParameters?.invoiceId;
  if (!invoiceId) return error("Invoice ID required");

  // Find invoice
  const result = await db.scan(INVOICES_TABLE, {
    FilterExpression: "invoiceId = :id",
    ExpressionAttributeValues: { ":id": invoiceId },
  });
  if (!result.length) return error("Invoice not found", 404);
  const inv = result[0];

  if (inv.status === "paid") return error("Invoice already paid");

  const s = getStripe();
  const session = await s.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [{
      price_data: {
        currency: "usd",
        product_data: {
          name: `Invoice: ${inv.jobName || "Service"}`,
          description: `Invoice for ${inv.clientName || "Client"}`,
        },
        unit_amount: Math.round((inv.amount || 0) * 100), // cents
      },
      quantity: 1,
    }],
    mode: "payment",
    success_url: `${FRONTEND_URL}/pay-success?invoice=${invoiceId}`,
    cancel_url: `${FRONTEND_URL}/pay/${invoiceId}?cancelled=true`,
    metadata: { invoiceId, PK: inv.PK, SK: inv.SK },
  });

  return success({ sessionId: session.id, url: session.url });
}

async function handleWebhook(event) {
  const s = getStripe();
  const sig = event.headers["Stripe-Signature"] || event.headers["stripe-signature"];
  let webhookEvent;

  try {
    // For now, parse without signature verification (add webhook secret later)
    webhookEvent = JSON.parse(event.body);
  } catch (e) { return error("Invalid payload", 400); }

  if (webhookEvent.type === "checkout.session.completed") {
    const session = webhookEvent.data.object;
    const { invoiceId, PK, SK } = session.metadata || {};

    if (invoiceId && PK && SK) {
      await db.update(INVOICES_TABLE, PK, SK, {
        status: "paid",
        paidAt: new Date().toISOString(),
        stripeSessionId: session.id,
        stripePaymentIntent: session.payment_intent,
      });

      // Also update GSI1 status
      const now = new Date().toISOString();
      try {
        await db.update(INVOICES_TABLE, PK, SK, {
          GSI1SK: `INVSTATUS#paid#${now}`,
        });
      } catch (e) { /* GSI update optional */ }
    }
  }

  return success({ received: true });
}
