const { randomUUID } = require("crypto");
const { db } = require("../../lib/dynamodb");
const { success, error, created } = require("../../lib/response");
const { validateJob, getUserId } = require("../../lib/validators");
const TABLE = process.env.JOBS_TABLE;

exports.handler = async (event) => {
  const method = event.httpMethod;
  const userId = getUserId(event);
  if (!userId) return error("Unauthorized", 401);
  try {
    switch (method) {
      case "POST": return await createJob(userId, event);
      case "GET": return event.pathParameters?.jobId
        ? await getJob(userId, event.pathParameters.jobId)
        : await listJobs(userId, event);
      case "PUT": return await updateJob(userId, event);
      case "DELETE": return await deleteJob(userId, event);
      default: return error("Method not allowed", 405);
    }
  } catch (err) { console.error(err); return error("Internal server error", 500); }
};

async function createJob(userId, event) {
  const data = JSON.parse(event.body || "{}");
  const errs = validateJob(data);
  if (errs.length) return error(errs.join("; "));
  const jobId = randomUUID(), now = new Date().toISOString();
  const job = {
    PK: `USER#${userId}`, SK: `JOB#${jobId}`,
    GSI1PK: `USER#${userId}`, GSI1SK: `STATUS#${data.status || "bidding"}#DATE#${now}`,
    jobId, userId, jobName: data.jobName.trim(), clientName: data.clientName.trim(),
    clientPhone: data.clientPhone || "", clientEmail: data.clientEmail || "",
    address: data.address || "", status: data.status || "bidding",
    bidAmount: data.bidAmount || 0, actualCost: 0,
    startDate: data.startDate || "", endDate: data.endDate || "",
    notes: data.notes || "", createdAt: now, updatedAt: now,
  };
  await db.put(TABLE, job);
  return created(strip(job));
}

async function getJob(userId, jobId) {
  const job = await db.get(TABLE, `USER#${userId}`, `JOB#${jobId}`);
  return job ? success(strip(job)) : error("Job not found", 404);
}

async function listJobs(userId, event) {
  const status = event.queryStringParameters?.status;
  const jobs = status
    ? await db.query(TABLE, `USER#${userId}`, `STATUS#${status}`, { indexName: "GSI1" })
    : await db.query(TABLE, `USER#${userId}`, "JOB#");
  return success(jobs.map(strip));
}

async function updateJob(userId, event) {
  const jobId = event.pathParameters?.jobId;
  if (!jobId) return error("Job ID required");
  const data = JSON.parse(event.body || "{}");
  const now = new Date().toISOString();
  const updates = { updatedAt: now };
  ["jobName","clientName","clientPhone","clientEmail","address","status","bidAmount","actualCost","startDate","endDate","notes"]
    .forEach(f => { if (data[f] !== undefined) updates[f] = data[f]; });
  if (data.status) updates.GSI1SK = `STATUS#${data.status}#DATE#${now}`;
  const updated = await db.update(TABLE, `USER#${userId}`, `JOB#${jobId}`, updates);
  return updated ? success(strip(updated)) : error("Job not found", 404);
}

async function deleteJob(userId, event) {
  const jobId = event.pathParameters?.jobId;
  await db.delete(TABLE, `USER#${userId}`, `JOB#${jobId}`);
  return success({ deleted: true, jobId });
}

function strip(item) {
  if (!item) return null;
  const { PK, SK, GSI1PK, GSI1SK, ...rest } = item;
  return rest;
}
