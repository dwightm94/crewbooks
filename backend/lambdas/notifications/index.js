const { db } = require("../../lib/dynamodb");
const { success, error } = require("../../lib/response");
const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");

const USERS_TABLE = process.env.USERS_TABLE;
const JOBS_TABLE = process.env.JOBS_TABLE;
const INVOICES_TABLE = process.env.INVOICES_TABLE;
const NOTIFICATIONS_TABLE = process.env.NOTIFICATIONS_TABLE || "crewbooks-notifications-dev";
const SES_FROM = process.env.SES_FROM_EMAIL || "noreply@crewbooks.app";
const ses = new SESClient({});

exports.handler = async (event) => {
  const method = event.httpMethod;
  const path = event.resource;
  const userId = event.requestContext?.authorizer?.claims?.sub;

  try {
    if (path === "/notifications" && method === "GET") return await getNotifications(userId);
    if (path === "/notifications" && method === "POST") return await createNotification(event, userId);
    if (path === "/notifications/read" && method === "PUT") return await markRead(event, userId);
    if (path === "/notifications/preferences" && method === "GET") return await getPreferences(userId);
    if (path === "/notifications/preferences" && method === "PUT") return await updatePreferences(event, userId);
    if (path === "/notifications/send-reminders" && method === "POST") return await sendPaymentReminders();
    return error("Not found", 404);
  } catch (err) { console.error(err); return error("Internal server error", 500); }
};

// Get user's notifications (last 50)
async function getNotifications(userId) {
  if (!userId) return error("Unauthorized", 401);
  const items = await db.query(NOTIFICATIONS_TABLE, `USER#${userId}`, "NOTIF#").catch(() => []);
  const sorted = items.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || "")).slice(0, 50);
  const unreadCount = sorted.filter(n => !n.read).length;
  return success({ notifications: sorted, unreadCount });
}

// Create a notification for a user
async function createNotification(event, userId) {
  if (!userId) return error("Unauthorized", 401);
  const body = JSON.parse(event.body || "{}");
  const { v4: uuid } = require("uuid");
  const notifId = uuid();

  await db.put(NOTIFICATIONS_TABLE, {
    PK: `USER#${userId}`,
    SK: `NOTIF#${notifId}`,
    notifId,
    userId,
    type: body.type || "info", // payment_received, invoice_sent, reminder, system
    title: body.title,
    message: body.message,
    jobId: body.jobId || null,
    invoiceId: body.invoiceId || null,
    read: false,
    createdAt: new Date().toISOString(),
  });

  return success({ notifId });
}

// Mark notifications as read
async function markRead(event, userId) {
  if (!userId) return error("Unauthorized", 401);
  const body = JSON.parse(event.body || "{}");
  const ids = body.notificationIds || [];

  for (const id of ids) {
    await db.update(NOTIFICATIONS_TABLE, `USER#${userId}`, `NOTIF#${id}`, {
      read: true, readAt: new Date().toISOString(),
    }).catch(() => {});
  }

  // If markAll flag, mark all
  if (body.markAll) {
    const all = await db.query(NOTIFICATIONS_TABLE, `USER#${userId}`, "NOTIF#").catch(() => []);
    for (const n of all.filter(n => !n.read)) {
      await db.update(NOTIFICATIONS_TABLE, `USER#${userId}`, `NOTIF#${n.notifId}`, {
        read: true, readAt: new Date().toISOString(),
      }).catch(() => {});
    }
  }

  return success({ updated: true });
}

// Get notification preferences
async function getPreferences(userId) {
  if (!userId) return error("Unauthorized", 401);
  const profile = await db.get(USERS_TABLE, `USER#${userId}`, `PROFILE#${userId}`).catch(() => null);
  return success({
    emailPaymentReceived: profile?.notif_emailPayment !== false,
    emailInvoiceSent: profile?.notif_emailInvoice !== false,
    emailReminders: profile?.notif_emailReminder !== false,
    pushEnabled: profile?.notif_push !== false,
  });
}

// Update notification preferences
async function updatePreferences(event, userId) {
  if (!userId) return error("Unauthorized", 401);
  const body = JSON.parse(event.body || "{}");
  await db.update(USERS_TABLE, `USER#${userId}`, `PROFILE#${userId}`, {
    notif_emailPayment: body.emailPaymentReceived !== false,
    notif_emailInvoice: body.emailInvoiceSent !== false,
    notif_emailReminder: body.emailReminders !== false,
    notif_push: body.pushEnabled !== false,
    updatedAt: new Date().toISOString(),
  });
  return success({ updated: true });
}

// Send payment reminders for overdue invoices (called by EventBridge scheduled rule)
async function sendPaymentReminders() {
  const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
  const { DynamoDBDocumentClient, ScanCommand } = require("@aws-sdk/lib-dynamodb");
  const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));
  const { v4: uuid } = require("uuid");

  // Find all sent (unpaid) invoices
  const scan = await client.send(new ScanCommand({
    TableName: INVOICES_TABLE,
    FilterExpression: "#s = :s",
    ExpressionAttributeNames: { "#s": "status" },
    ExpressionAttributeValues: { ":s": "sent" },
  }));

  const invoices = scan.Items || [];
  let sent = 0;

  for (const inv of invoices) {
    const userId = inv.userId;
    if (!userId) continue;

    // Check user preferences
    const profile = await db.get(USERS_TABLE, `USER#${userId}`, `PROFILE#${userId}`).catch(() => null);
    if (profile?.notif_emailReminder === false) continue;

    // Check if invoice is overdue (sent more than 7 days ago)
    const sentDate = new Date(inv.sentAt || inv.createdAt || "");
    const daysSinceSent = (Date.now() - sentDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceSent < 7) continue;

    // Check if already reminded in last 7 days
    if (inv.lastReminder) {
      const daysSinceReminder = (Date.now() - new Date(inv.lastReminder).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceReminder < 7) continue;
    }

    // Create in-app notification
    const notifId = uuid();
    await db.put(NOTIFICATIONS_TABLE, {
      PK: `USER#${userId}`,
      SK: `NOTIF#${notifId}`,
      notifId, userId, type: "reminder",
      title: "Overdue Invoice",
      message: `Invoice for $${inv.amount} to ${inv.clientName || "client"} is ${Math.floor(daysSinceSent)} days overdue.`,
      jobId: inv.jobId, invoiceId: inv.invoiceId,
      read: false, createdAt: new Date().toISOString(),
    });

    // Update last reminder timestamp
    await db.update(INVOICES_TABLE, inv.PK, inv.SK, {
      lastReminder: new Date().toISOString(),
    }).catch(() => {});

    sent++;
  }

  return success({ reminders_sent: sent });
}
