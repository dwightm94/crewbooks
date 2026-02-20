const { randomUUID } = require("crypto");
const { db } = require("../../lib/dynamodb");
const { success, error, created } = require("../../lib/response");
const { getUserId } = require("../../lib/validators");
const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");

const INV = process.env.INVOICES_TABLE;
const JOBS = process.env.JOBS_TABLE;
const ses = new SESClient({ region: process.env.REGION });

exports.handler = async (event) => {
  const path = event.resource;
  const method = event.httpMethod;

  try {
    // Public invoice view (no auth)
    if (path === "/invoices/{invoiceId}" && method === "GET") {
      const invoiceId = event.pathParameters?.invoiceId;
      const jobId = event.queryStringParameters?.jobId;
      if (!jobId || !invoiceId) return error("Job ID and Invoice ID required");
      const inv = await db.get(INV, `JOB#${jobId}`, `INVOICE#${invoiceId}`);
      if (!inv) return error("Invoice not found", 404);
      if (inv.status === "sent") await db.update(INV, inv.PK, inv.SK, { viewedAt: new Date().toISOString() });
      const { PK, SK, GSI1PK, GSI1SK, userId, ...pub } = inv;
      return success(pub);
    }

    const userId = getUserId(event);
    if (!userId) return error("Unauthorized", 401);
    const { jobId, invoiceId } = event.pathParameters || {};

    // Create invoice
    if (method === "POST" && !path.includes("/send")) {
      if (!jobId) return error("Job ID required");
      const job = await db.get(JOBS, `USER#${userId}`, `JOB#${jobId}`);
      if (!job) return error("Job not found", 404);
      const data = JSON.parse(event.body || "{}");
      const id = randomUUID(), now = new Date().toISOString();
      const amount = data.amount || job.bidAmount || 0;
      const dueDate = data.dueDate || new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];
      const inv = {
        PK: `JOB#${jobId}`, SK: `INVOICE#${id}`,
        GSI1PK: `USER#${userId}`, GSI1SK: `INVSTATUS#draft#DATE#${now}`,
        invoiceId: id, jobId, userId, jobName: job.jobName,
        clientName: job.clientName, clientEmail: job.clientEmail, clientPhone: job.clientPhone,
        address: job.address, amount: parseFloat(amount), status: "draft", dueDate,
        lineItems: data.lineItems || [{ description: job.jobName, amount: parseFloat(amount) }],
        notes: data.notes || "", companyName: "",
        sentAt: null, viewedAt: null, paidAt: null, createdAt: now, updatedAt: now,
      };
      await db.put(INV, inv);
      const { PK, SK, GSI1PK, GSI1SK, ...rest } = inv;
      return created(rest);
    }

    // Send invoice
    if (method === "POST" && path.includes("/send")) {
      const inv = await db.get(INV, `JOB#${jobId}`, `INVOICE#${invoiceId}`);
      if (!inv || inv.userId !== userId) return error("Invoice not found", 404);
      const now = new Date().toISOString();
      if (inv.clientEmail) {
        try {
          await ses.send(new SendEmailCommand({
            Source: "invoices@crewbooks.app",
            Destination: { ToAddresses: [inv.clientEmail] },
            Message: {
              Subject: { Data: `Invoice: ${inv.jobName} - $${inv.amount.toFixed(2)}` },
              Body: { Html: { Data: `<p>Hi ${inv.clientName},</p><p>Invoice for <b>$${inv.amount.toFixed(2)}</b> is due by ${inv.dueDate}.</p>` } },
            },
          }));
        } catch (e) { console.warn("Email failed:", e.message); }
      }
      await db.update(INV, `JOB#${jobId}`, `INVOICE#${invoiceId}`, {
        status: "sent", sentAt: now, updatedAt: now, GSI1SK: `INVSTATUS#sent#DATE#${now}`,
      });
      return success({ sent: true, invoiceId });
    }

    // Mark paid
    if (method === "PUT" && path.includes("/pay")) {
      const inv = await db.get(INV, `JOB#${jobId}`, `INVOICE#${invoiceId}`);
      if (!inv || inv.userId !== userId) return error("Invoice not found", 404);
      const now = new Date().toISOString();
      await db.update(INV, `JOB#${jobId}`, `INVOICE#${invoiceId}`, {
        status: "paid", paidAt: now, updatedAt: now, GSI1SK: `INVSTATUS#paid#DATE#${now}`,
      });
      await db.update(JOBS, `USER#${userId}`, `JOB#${jobId}`, {
        status: "paid", updatedAt: now, GSI1SK: `STATUS#paid#DATE#${now}`,
      });
      return success({ paid: true, invoiceId, paidAt: now });
    }

    return error("Method not allowed", 405);
  } catch (err) {
    console.error(err);
    return error("Internal server error", 500);
  }
};
