const { randomUUID } = require("crypto");
const { db } = require("../../lib/dynamodb");
const { success, error, created } = require("../../lib/response");
const { getUserId } = require("../../lib/validators");
const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");

const INV = process.env.INVOICES_TABLE;
const JOBS = process.env.JOBS_TABLE;
const ses = new SESClient({ region: process.env.REGION });

exports.handler = async (event) => {
  const path = event.resource || event.path || "";
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

    // List invoices for a job
    if (method === "GET" && jobId && !invoiceId) {
      const items = await db.query(INV, `JOB#${jobId}`);
      const invoices = (items || []).filter(i => i.userId === userId);
      return success({ invoices });
    }

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
      const job = await db.get(JOBS, `USER#${userId}`, `JOB#${jobId}`).catch(() => null);
      const clientEmail = job?.clientEmail || inv.clientEmail;
      const clientName = job?.clientName || inv.clientName;
      const jobName = job?.jobName || inv.jobName;
      const now = new Date().toISOString();
      if (clientEmail) {
        const payLink = `https://master.dlw0zhxk42vjk.amplifyapp.com/pay/${invoiceId}`;
        const emailHtml = `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
            <div style="background:#FDB241;border-radius:12px;padding:16px;text-align:center;margin-bottom:24px;">
              <h1 style="margin:0;color:#0F172A;font-size:20px;">CrewBooks Invoice</h1>
            </div>
            <p style="font-size:16px;color:#0F172A;">Hi ${clientName},</p>
            <p style="color:#64748B;">You have an invoice for <b>${jobName}</b>.</p>
            <div style="background:#F8FAFC;border:2px solid #E2E8F0;border-radius:12px;padding:24px;text-align:center;margin:24px 0;">
              <p style="margin:0;color:#94A3B8;font-size:12px;font-weight:bold;">AMOUNT DUE</p>
              <p style="margin:8px 0 0;font-size:40px;font-weight:900;color:#0F172A;">$${inv.amount.toFixed(2)}</p>
              ${inv.dueDate ? `<p style="margin:8px 0 0;color:#94A3B8;font-size:13px;">Due by ${inv.dueDate}</p>` : ""}
            </div>
            <a href="${payLink}" style="display:block;background:#635BFF;color:white;text-align:center;padding:16px;border-radius:12px;font-size:16px;font-weight:bold;text-decoration:none;">
              Pay Now
            </a>
            <p style="text-align:center;color:#94A3B8;font-size:11px;margin-top:16px;">Secure payment powered by Stripe</p>
          </div>`;
        try {
          await ses.send(new SendEmailCommand({
            Source: "Dwightm94@msn.com",
            Destination: { ToAddresses: [clientEmail] },
            Message: {
              Subject: { Data: `Invoice: ${jobName} - $${inv.amount.toFixed(2)}` },
              Body: { Html: { Data: emailHtml } },
            },
          }));
        } catch (e) { console.warn("Email failed:", e.message); }
      } else {
        console.warn("No client email on file for job", jobId);
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

    // Delete invoice
    if (method === "DELETE" && invoiceId) {
      const inv = await db.get(INV, `JOB#${jobId}`, `INVOICE#${invoiceId}`);
      if (!inv || inv.userId !== userId) return error("Invoice not found", 404);
      await db.delete(INV, `JOB#${jobId}`, `INVOICE#${invoiceId}`);
      return success({ deleted: true, invoiceId });
    }

    return error("Method not allowed", 405);
  } catch (err) {
    console.error(err);
    return error("Internal server error", 500);
  }
};
