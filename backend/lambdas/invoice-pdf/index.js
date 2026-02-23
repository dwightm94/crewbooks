const { db } = require("../../lib/dynamodb");
const { success, error } = require("../../lib/response");

const JOBS_TABLE = process.env.JOBS_TABLE;
const INVOICES_TABLE = process.env.INVOICES_TABLE;
const USERS_TABLE = process.env.USERS_TABLE;

exports.handler = async (event) => {
  const invoiceId = event.pathParameters?.invoiceId;
  if (!invoiceId) return error("Invoice ID required");

  try {
    // Find the invoice across all jobs (scan since we don't know the job)
    const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
    const { DynamoDBDocumentClient, ScanCommand } = require("@aws-sdk/lib-dynamodb");
    const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));

    const scan = await client.send(new ScanCommand({
      TableName: INVOICES_TABLE,
      FilterExpression: "invoiceId = :id",
      ExpressionAttributeValues: { ":id": invoiceId },
    }));

    const invoice = scan.Items?.[0];
    if (!invoice) return error("Invoice not found", 404);

    // Get job details
    const jobId = invoice.jobId || invoice.PK?.replace("JOB#", "");
    const userId = invoice.userId;
    const job = await db.get(JOBS_TABLE, `USER#${userId}`, `JOB#${jobId}`).catch(() => null);

    // Get user profile for company info
    const profile = await db.get(USERS_TABLE, `USER#${userId}`, `PROFILE#${userId}`).catch(() => null);

    const companyName = profile?.companyName || "CrewBooks User";
    const companyEmail = profile?.email || "";
    const companyPhone = profile?.phone || "";

    const clientName = job?.clientName || invoice.clientName || "Client";
    const clientEmail = job?.clientEmail || "";
    const clientPhone = job?.clientPhone || "";
    const jobName = job?.jobName || "Service";
    const jobAddress = job?.address || "";

    const amount = invoice.amount || job?.bidAmount || 0;
    const lineItems = invoice.lineItems || [{ description: jobName, amount }];
    const invoiceNumber = `INV-${invoiceId.slice(0, 8).toUpperCase()}`;
    const invoiceDate = invoice.createdAt ? new Date(invoice.createdAt).toLocaleDateString("en-US") : new Date().toLocaleDateString("en-US");
    const dueDate = invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString("en-US") : "";
    const status = invoice.status || "draft";

    // Generate HTML invoice
    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1A1A1A; padding: 40px; max-width: 800px; margin: 0 auto; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
  .company { flex: 1; }
  .company h1 { font-size: 24px; font-weight: 800; margin-bottom: 4px; }
  .company p { font-size: 13px; color: #666; }
  .invoice-badge { text-align: right; }
  .invoice-badge h2 { font-size: 32px; font-weight: 900; color: #F59E0B; }
  .invoice-badge p { font-size: 13px; color: #666; margin-top: 4px; }
  .status { display: inline-block; padding: 4px 12px; border-radius: 6px; font-size: 12px; font-weight: 700; text-transform: uppercase; }
  .status-paid { background: #DEF7EC; color: #03543F; }
  .status-sent { background: #FEF3C7; color: #92400E; }
  .status-draft { background: #F3F4F6; color: #6B7280; }
  .details { display: flex; justify-content: space-between; margin-bottom: 32px; }
  .details-section h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #999; margin-bottom: 6px; }
  .details-section p { font-size: 14px; line-height: 1.5; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  th { text-align: left; padding: 12px 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #999; border-bottom: 2px solid #E5E7EB; }
  th:last-child { text-align: right; }
  td { padding: 14px 8px; font-size: 14px; border-bottom: 1px solid #F3F4F6; }
  td:last-child { text-align: right; font-weight: 600; }
  .total-row { border-top: 2px solid #1A1A1A; }
  .total-row td { font-size: 18px; font-weight: 800; padding-top: 16px; }
  .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #E5E7EB; text-align: center; }
  .footer p { font-size: 12px; color: #999; }
  .pay-link { display: inline-block; margin-top: 16px; padding: 12px 32px; background: #F59E0B; color: white; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px; }
  @media print { body { padding: 20px; } .pay-link { display: none; } }
</style>
</head>
<body>
  <div class="header">
    <div class="company">
      <h1>${escHtml(companyName)}</h1>
      ${companyEmail ? `<p>${escHtml(companyEmail)}</p>` : ""}
      ${companyPhone ? `<p>${escHtml(companyPhone)}</p>` : ""}
    </div>
    <div class="invoice-badge">
      <h2>INVOICE</h2>
      <p>${invoiceNumber}</p>
      <p>${invoiceDate}</p>
      <span class="status status-${status}">${status}</span>
    </div>
  </div>

  <div class="details">
    <div class="details-section">
      <h3>Bill To</h3>
      <p><strong>${escHtml(clientName)}</strong></p>
      ${clientEmail ? `<p>${escHtml(clientEmail)}</p>` : ""}
      ${clientPhone ? `<p>${escHtml(clientPhone)}</p>` : ""}
    </div>
    <div class="details-section" style="text-align: right;">
      <h3>Job Details</h3>
      <p>${escHtml(jobName)}</p>
      ${jobAddress ? `<p>${escHtml(jobAddress)}</p>` : ""}
      ${dueDate ? `<p>Due: ${dueDate}</p>` : ""}
    </div>
  </div>

  <table>
    <thead>
      <tr><th>Description</th><th>Amount</th></tr>
    </thead>
    <tbody>
      ${lineItems.map(item => `
        <tr>
          <td>${escHtml(item.description || jobName)}</td>
          <td>$${Number(item.amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
        </tr>
      `).join("")}
      <tr class="total-row">
        <td>Total</td>
        <td>$${Number(amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
      </tr>
    </tbody>
  </table>

  <div class="footer">
    <p>Thank you for your business!</p>
    <p>${escHtml(companyName)} • Powered by CrewBooks</p>
  </div>
</body>
</html>`;

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "text/html",
        "Access-Control-Allow-Origin": "*",
      },
      body: html,
    };
  } catch (err) {
    console.error(err);
    return error("Internal server error", 500);
  }
};

function escHtml(str) {
  return String(str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
