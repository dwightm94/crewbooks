const { randomUUID } = require("crypto");
const { db } = require("../../lib/dynamodb");
const { success, error, created } = require("../../lib/response");
const { getUserId } = require("../../lib/validators");

const ESTIMATES_TABLE = process.env.ESTIMATES_TABLE;
const JOBS_TABLE = process.env.JOBS_TABLE;

exports.handler = async (event) => {
  const method = event.httpMethod;
  const path = event.resource;

  // Public: client views estimate
  if (path === "/estimate-view/{token}" && method === "GET") return await publicView(event);
  // Public: client approves estimate
  if (path === "/estimate-view/{token}/approve" && method === "POST") return await publicApprove(event);

  const userId = getUserId(event);
  if (!userId) return error("Unauthorized", 401);

  try {
    const estimateId = event.pathParameters?.estimateId;
    switch (method) {
      case "POST":
        if (path.includes("/convert")) return await convertToJob(userId, estimateId);
        if (path.includes("/send")) return await sendEstimate(userId, estimateId, event);
        return await createEstimate(userId, event);
      case "GET":
        if (estimateId) return await getEstimate(userId, estimateId);
        return await listEstimates(userId);
      case "PUT": return await updateEstimate(userId, estimateId, event);
      case "DELETE": return await deleteEstimate(userId, estimateId);
      default: return error("Method not allowed", 405);
    }
  } catch (err) { console.error(err); return error("Internal server error", 500); }
};

async function createEstimate(userId, event) {
  const data = JSON.parse(event.body || "{}");
  if (!data.clientName) return error("clientName is required");

  const estimateId = randomUUID(), now = new Date().toISOString();
  const token = randomUUID().replace(/-/g, "").slice(0, 16);
  const lineItems = (data.lineItems || []).map((item, i) => ({
    id: item.id || `item-${i}`, description: item.description || "",
    quantity: Number(item.quantity) || 1, unitPrice: Number(item.unitPrice) || 0,
    total: (Number(item.quantity) || 1) * (Number(item.unitPrice) || 0),
  }));
  const subtotal = lineItems.reduce((s, i) => s + i.total, 0);
  const markupPct = Number(data.markupPercent) || 0;
  const markup = subtotal * (markupPct / 100);
  const taxPct = Number(data.taxPercent) || 0;
  const tax = (subtotal + markup) * (taxPct / 100);
  const total = subtotal + markup + tax;

  const estimate = {
    PK: `USER#${userId}`, SK: `EST#${estimateId}`,
    GSI1PK: `TOKEN#${token}`, GSI1SK: `EST#${estimateId}`,
    estimateId, userId, token,
    clientName: data.clientName, clientEmail: data.clientEmail || "",
    clientPhone: data.clientPhone || "", clientAddress: data.clientAddress || "",
    jobDescription: data.jobDescription || "", notes: data.notes || "",
    lineItems, subtotal, markupPercent: markupPct, markup,
    taxPercent: taxPct, tax, total,
    status: "draft", // draft | sent | viewed | approved | declined
    validUntil: data.validUntil || "",
    approvedAt: null, approvedSignature: null,
    convertedJobId: null,
    createdAt: now, updatedAt: now,
  };

  await db.put(ESTIMATES_TABLE, estimate);
  const { PK, SK, GSI1PK, GSI1SK, ...rest } = estimate;
  return created(rest);
}

async function listEstimates(userId) {
  const items = await db.query(ESTIMATES_TABLE, `USER#${userId}`, "EST#");
  const estimates = items.map(({ PK, SK, GSI1PK, GSI1SK, ...rest }) => rest);
  estimates.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return success({ estimates });
}

async function getEstimate(userId, estimateId) {
  const item = await db.get(ESTIMATES_TABLE, `USER#${userId}`, `EST#${estimateId}`);
  if (!item) return error("Estimate not found", 404);
  const { PK, SK, GSI1PK, GSI1SK, ...rest } = item;
  return success(rest);
}

async function updateEstimate(userId, estimateId, event) {
  const existing = await db.get(ESTIMATES_TABLE, `USER#${userId}`, `EST#${estimateId}`);
  if (!existing) return error("Estimate not found", 404);
  const data = JSON.parse(event.body || "{}");

  const lineItems = (data.lineItems || existing.lineItems).map((item, i) => ({
    id: item.id || `item-${i}`, description: item.description || "",
    quantity: Number(item.quantity) || 1, unitPrice: Number(item.unitPrice) || 0,
    total: (Number(item.quantity) || 1) * (Number(item.unitPrice) || 0),
  }));
  const subtotal = lineItems.reduce((s, i) => s + i.total, 0);
  const markupPct = data.markupPercent !== undefined ? Number(data.markupPercent) : existing.markupPercent;
  const markup = subtotal * (markupPct / 100);
  const taxPct = data.taxPercent !== undefined ? Number(data.taxPercent) : existing.taxPercent;
  const tax = (subtotal + markup) * (taxPct / 100);

  const updates = {
    clientName: data.clientName || existing.clientName,
    clientEmail: data.clientEmail !== undefined ? data.clientEmail : existing.clientEmail,
    clientPhone: data.clientPhone !== undefined ? data.clientPhone : existing.clientPhone,
    jobDescription: data.jobDescription !== undefined ? data.jobDescription : existing.jobDescription,
    notes: data.notes !== undefined ? data.notes : existing.notes,
    lineItems, subtotal, markupPercent: markupPct, markup, taxPercent: taxPct, tax,
    total: subtotal + markup + tax,
    validUntil: data.validUntil !== undefined ? data.validUntil : existing.validUntil,
    updatedAt: new Date().toISOString(),
  };
  await db.update(ESTIMATES_TABLE, `USER#${userId}`, `EST#${estimateId}`, updates);
  return success({ ...existing, ...updates });
}

async function deleteEstimate(userId, estimateId) {
  await db.delete(ESTIMATES_TABLE, `USER#${userId}`, `EST#${estimateId}`);
  return success({ deleted: true });
}

async function sendEstimate(userId, estimateId, event) {
  const item = await db.get(ESTIMATES_TABLE, `USER#${userId}`, `EST#${estimateId}`);
  if (!item) return error("Estimate not found", 404);
  await db.update(ESTIMATES_TABLE, `USER#${userId}`, `EST#${estimateId}`, {
    status: "sent", updatedAt: new Date().toISOString(),
  });
  // Return the token so frontend can build the share link
  return success({ sent: true, token: item.token, status: "sent" });
}

async function convertToJob(userId, estimateId) {
  const est = await db.get(ESTIMATES_TABLE, `USER#${userId}`, `EST#${estimateId}`);
  if (!est) return error("Estimate not found", 404);
  if (est.convertedJobId) return error("Already converted to job");

  const jobId = randomUUID(), now = new Date().toISOString();
  const job = {
    PK: `USER#${userId}`, SK: `JOB#${jobId}`,
    jobId, userId, jobName: est.jobDescription || `${est.clientName} Job`,
    clientName: est.clientName, clientEmail: est.clientEmail,
    clientPhone: est.clientPhone, address: est.clientAddress,
    bidAmount: est.total, actualCost: 0, status: "active",
    startDate: now.split("T")[0], endDate: "", notes: est.notes,
    estimateId: est.estimateId, createdAt: now, updatedAt: now,
  };
  await db.put(JOBS_TABLE, job);
  await db.update(ESTIMATES_TABLE, `USER#${userId}`, `EST#${estimateId}`, {
    convertedJobId: jobId, status: "approved", updatedAt: now,
  });
  const { PK, SK, ...rest } = job;
  return success({ job: rest, converted: true });
}

async function publicView(event) {
  const token = event.pathParameters?.token;
  if (!token) return error("Token required");
  const items = await db.query(ESTIMATES_TABLE, `TOKEN#${token}`, "EST#", { indexName: "GSI1" });
  if (!items.length) return error("Estimate not found", 404);
  const est = items[0];
  // Mark as viewed if sent
  if (est.status === "sent") {
    await db.update(ESTIMATES_TABLE, est.PK, est.SK, { status: "viewed", updatedAt: new Date().toISOString() });
  }
  const { PK, SK, GSI1PK, GSI1SK, userId, ...rest } = est;
  return success({ ...rest, status: est.status === "sent" ? "viewed" : est.status });
}

async function publicApprove(event) {
  const token = event.pathParameters?.token;
  const data = JSON.parse(event.body || "{}");
  const items = await db.query(ESTIMATES_TABLE, `TOKEN#${token}`, "EST#", { indexName: "GSI1" });
  if (!items.length) return error("Estimate not found", 404);
  const est = items[0];
  if (est.status === "approved") return success({ alreadyApproved: true });

  await db.update(ESTIMATES_TABLE, est.PK, est.SK, {
    status: "approved", approvedAt: new Date().toISOString(),
    approvedSignature: data.signature || "Approved digitally",
    updatedAt: new Date().toISOString(),
  });
  return success({ approved: true });
}
