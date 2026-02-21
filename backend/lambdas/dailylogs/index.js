const { randomUUID } = require("crypto");
const { db } = require("../../lib/dynamodb");
const { success, error, created } = require("../../lib/response");
const { getUserId } = require("../../lib/validators");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const JOBS_TABLE = process.env.JOBS_TABLE;
const PHOTOS_BUCKET = process.env.PHOTOS_BUCKET;
const s3 = new S3Client({ region: process.env.REGION });

// We'll store daily logs in the Jobs table with SK prefix DLOG#
exports.handler = async (event) => {
  const method = event.httpMethod;
  const userId = getUserId(event);
  if (!userId) return error("Unauthorized", 401);
  const { jobId } = event.pathParameters || {};
  if (!jobId) return error("Job ID required");

  try {
    switch (method) {
      case "POST": {
        // Check if it's a photo upload request or daily log creation
        const path = event.resource;
        if (path.includes("/photos")) return await addPhoto(userId, jobId, event);
        return await createLog(userId, jobId, event);
      }
      case "GET": {
        const path = event.resource;
        if (path.includes("/photos")) return await listPhotos(userId, jobId, event);
        return await listLogs(userId, jobId);
      }
      default: return error("Method not allowed", 405);
    }
  } catch (err) { console.error(err); return error("Internal server error", 500); }
};

async function createLog(userId, jobId, event) {
  // Verify job ownership
  const job = await db.get(JOBS_TABLE, `USER#${userId}`, `JOB#${jobId}`);
  if (!job) return error("Job not found", 404);

  const data = JSON.parse(event.body || "{}");
  const logId = randomUUID();
  const now = new Date().toISOString();
  const date = data.date || now.split("T")[0];

  const log = {
    PK: `USER#${userId}`, SK: `JOB#${jobId}#DLOG#${date}`,
    logId, jobId, userId, date,
    notes: data.notes || "",
    weather: data.weather || "",
    crewOnSite: data.crewOnSite || [],
    workPerformed: data.workPerformed || "",
    materialsUsed: data.materialsUsed || "",
    issues: data.issues || "",
    photos: data.photos || [],
    hoursWorked: data.hoursWorked || 0,
    createdAt: now, updatedAt: now,
    locked: false, // Lock after 24 hours
  };

  await db.put(JOBS_TABLE, log);
  const { PK, SK, ...rest } = log;
  return created(rest);
}

async function listLogs(userId, jobId) {
  const items = await db.query(JOBS_TABLE, `USER#${userId}`, `JOB#${jobId}#DLOG#`);
  const logs = items.map(({ PK, SK, ...rest }) => rest);
  // Sort newest first
  logs.sort((a, b) => b.date.localeCompare(a.date));
  return success({ logs });
}

async function addPhoto(userId, jobId, event) {
  const job = await db.get(JOBS_TABLE, `USER#${userId}`, `JOB#${jobId}`);
  if (!job) return error("Job not found", 404);

  const data = JSON.parse(event.body || "{}");
  const { fileName, contentType, category } = data;
  if (!fileName || !contentType) return error("fileName and contentType required");

  const photoId = randomUUID();
  const ext = fileName.split(".").pop() || "jpg";
  const key = `${userId}/${jobId}/photos/${category || "general"}/${photoId}.${ext}`;

  const url = await getSignedUrl(s3, new PutObjectCommand({
    Bucket: PHOTOS_BUCKET,
    Key: key,
    ContentType: contentType,
  }), { expiresIn: 300 });

  // Store photo metadata in jobs table
  const now = new Date().toISOString();
  const photo = {
    PK: `USER#${userId}`, SK: `JOB#${jobId}#PHOTO#${photoId}`,
    photoId, jobId, userId, key, fileName,
    category: category || "general",
    contentType, uploadedAt: now,
    url: `https://${PHOTOS_BUCKET}.s3.amazonaws.com/${key}`,
  };
  await db.put(JOBS_TABLE, photo);

  return success({ uploadUrl: url, photoId, key, viewUrl: photo.url });
}

async function listPhotos(userId, jobId) {
  const items = await db.query(JOBS_TABLE, `USER#${userId}`, `JOB#${jobId}#PHOTO#`);
  const photos = items.map(({ PK, SK, ...rest }) => rest);
  photos.sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
  return success({ photos });
}
