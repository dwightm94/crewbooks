const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, ScanCommand } = require("@aws-sdk/lib-dynamodb");
const { db } = require("../../lib/dynamodb");
const { success, error } = require("../../lib/response");

const INVOICES_TABLE = process.env.INVOICES_TABLE;
const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY;
const FRONTEND_URL = process.env.FRONTEND_URL || "https://master.dlw0zhxk42vjk.amplifyapp.com";

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
  try {
    if (path === "/pay/{invoiceId}" && method === "GET") return await getInvoiceForPayment(event);
    if (path === "/pay/{invoiceId}" && method === "POST") return await createCheckout(event);
    if (path === "/stripe-webhook" && method === "POST") return await handleWebhook(event);
    return error("Not found", 404);
  } catch (err) { console.error(err); return error("Internal server error", 500); }
};

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

async function createCheckout(event) {
  const invoiceId = event.pathParameters?.invoiceId;
  if (!invoiceId) return error("Invoice ID required");
  const inv = await findInvoice(invoiceId);
  if (!inv) return error("Invoice not found", 404);
  if (inv.status === "paid") return error("Invoice already paid");

  const s = getStripe();
  const session = await s.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [{
      price_data: {
        currency: "usd",
        product_data: {
          name: "Invoice: " + (inv.jobName || "Service"),
          description: "Invoice for " + (inv.clientName || "Client"),
        },
        unit_amount: Math.round((inv.amount || 0) * 100),
      },
      quantity: 1,
    }],
    mode: "payment",
    success_url: FRONTEND_URL + "/pay-success?invoice=" + invoiceId,
    cancel_url: FRONTEND_URL + "/pay/" + invoiceId + "?cancelled=true",
    metadata: { invoiceId: invoiceId, PK: inv.PK, SK: inv.SK },
  });
  return success({ sessionId: session.id, url: session.url });
}

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
      });
    }
  }
  return success({ received: true });
}
