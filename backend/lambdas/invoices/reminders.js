const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, ScanCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");

const client = new DynamoDBClient({ region: process.env.REGION });
const doc = DynamoDBDocumentClient.from(client);
const ses = new SESClient({ region: process.env.REGION });
const TABLE = process.env.INVOICES_TABLE;

exports.handler = async () => {
  const { Items: invoices } = await doc.send(new ScanCommand({
    TableName: TABLE,
    FilterExpression: "#s = :sent",
    ExpressionAttributeNames: { "#s": "status" },
    ExpressionAttributeValues: { ":sent": "sent" },
  }));
  if (!invoices?.length) return { statusCode: 200, body: "No reminders needed" };

  const now = new Date();
  let sent = 0;
  for (const inv of invoices) {
    const days = Math.floor((now - new Date(inv.sentAt)) / 86400000);
    let type = null;
    if (days === 7) type = "friendly";
    else if (days === 14) type = "followup";
    else if (days === 30) type = "overdue";
    else continue;
    if (inv.lastReminderType === type) continue;

    const msgs = {
      friendly: `Reminder: Invoice of $${inv.amount?.toFixed(2)} for "${inv.jobName}" is outstanding.`,
      followup: `Follow-up: Invoice of $${inv.amount?.toFixed(2)} for "${inv.jobName}" is 14 days old.`,
      overdue: `PAST DUE: Invoice of $${inv.amount?.toFixed(2)} for "${inv.jobName}" is 30 days overdue.`,
    };

    if (inv.clientEmail) {
      try {
        await ses.send(new SendEmailCommand({
          Source: "reminders@crewbooks.app",
          Destination: { ToAddresses: [inv.clientEmail] },
          Message: { Subject: { Data: `Payment ${type}: ${inv.jobName}` }, Body: { Text: { Data: msgs[type] } } },
        }));
        sent++;
      } catch (e) { console.warn("Email failed:", e.message); }
    }
    await doc.send(new UpdateCommand({
      TableName: TABLE, Key: { PK: inv.PK, SK: inv.SK },
      UpdateExpression: "SET lastReminderType = :t, lastReminderAt = :a",
      ExpressionAttributeValues: { ":t": type, ":a": now.toISOString() },
    }));
  }
  return { statusCode: 200, body: `Sent ${sent} reminders` };
};
