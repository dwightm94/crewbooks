const { randomUUID } = require("crypto");
const { db } = require("../../lib/dynamodb");
const { success, error, created } = require("../../lib/response");
const { getUserId } = require("../../lib/validators");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const COMPLIANCE_TABLE = process.env.COMPLIANCE_TABLE;
const PHOTOS_BUCKET = process.env.PHOTOS_BUCKET;
const s3 = new S3Client({ region: process.env.REGION });

exports.handler = async (event) => {
  const method = event.httpMethod;
  const userId = getUserId(event);
  if (!userId) return error("Unauthorized", 401);

  try {
    switch (method) {
      case "POST": return await createDoc(userId, event);
      case "GET": return event.pathParameters?.docId
        ? await getDoc(userId, event.pathParameters.docId)
        : await listDocs(userId);
      case "PUT": return await updateDoc(userId, event);
      case "DELETE": return await deleteDoc(userId, event);
      default: return error("Method not allowed", 405);
    }
  } catch (err) { console.error(err); return error("Internal server error", 500); }
};

function calcStatus(expirationDate) {
  if (!expirationDate) return "active";
  const now = new Date(), exp = new Date(expirationDate);
  const daysLeft = Math.ceil((exp - now) / 86400000);
  if (daysLeft < 0) return "expired";
  if (daysLeft <= 14) return "expiring";
  if (daysLeft <= 30) return "expiring-soon";
  return "active";
}

function daysUntil(expirationDate) {
  if (!expirationDate) return null;
  return Math.ceil((new Date(expirationDate) - new Date()) / 86400000);
}

async function createDoc(userId, event) {
  const data = JSON.parse(event.body || "{}");
  if (!data.docName || !data.docType) return error("docName and docType are required");

  const docId = randomUUID(), now = new Date().toISOString();
  const status = calcStatus(data.expirationDate);

  // If file upload requested, generate presigned URL
  let uploadUrl = null, fileUrl = null, fileKey = null;
  if (data.fileName && data.contentType) {
    const ext = data.fileName.split(".").pop() || "pdf";
    fileKey = `${userId}/compliance/${docId}.${ext}`;
    uploadUrl = await getSignedUrl(s3, new PutObjectCommand({
      Bucket: PHOTOS_BUCKET, Key: fileKey, ContentType: data.contentType,
    }), { expiresIn: 300 });
    fileUrl = `https://${PHOTOS_BUCKET}.s3.amazonaws.com/${fileKey}`;
  }

  const doc = {
    PK: `USER#${userId}`, SK: `DOC#${docId}`,
    GSI1PK: `USER#${userId}`, GSI1SK: `EXPIRES#${data.expirationDate || "9999-12-31"}`,
    docId, userId, docType: data.docType, docName: data.docName,
    issuer: data.issuer || "", number: data.number || "",
    expirationDate: data.expirationDate || "",
    fileUrl: fileUrl || "", fileKey: fileKey || "",
    reminderDays: data.reminderDays || [30, 14, 7],
    status, daysLeft: daysUntil(data.expirationDate),
    notes: data.notes || "", createdAt: now, updatedAt: now,
  };

  await db.put(COMPLIANCE_TABLE, doc);
  const { PK, SK, GSI1PK, GSI1SK, ...rest } = doc;
  return created({ ...rest, uploadUrl });
}

async function listDocs(userId) {
  const items = await db.query(COMPLIANCE_TABLE, `USER#${userId}`, "DOC#");
  const docs = items.map(({ PK, SK, GSI1PK, GSI1SK, ...rest }) => ({
    ...rest,
    status: calcStatus(rest.expirationDate),
    daysLeft: daysUntil(rest.expirationDate),
  }));
  // Sort: expired first, then expiring, then active
  const order = { expired: 0, expiring: 1, "expiring-soon": 2, active: 3 };
  docs.sort((a, b) => (order[a.status] || 3) - (order[b.status] || 3));
  return success({ docs });
}

async function getDoc(userId, docId) {
  const item = await db.get(COMPLIANCE_TABLE, `USER#${userId}`, `DOC#${docId}`);
  if (!item) return error("Document not found", 404);
  const { PK, SK, GSI1PK, GSI1SK, ...rest } = item;
  return success({ ...rest, status: calcStatus(rest.expirationDate), daysLeft: daysUntil(rest.expirationDate) });
}

async function updateDoc(userId, event) {
  const docId = event.pathParameters?.docId;
  if (!docId) return error("Doc ID required");
  const existing = await db.get(COMPLIANCE_TABLE, `USER#${userId}`, `DOC#${docId}`);
  if (!existing) return error("Document not found", 404);

  const data = JSON.parse(event.body || "{}");
  const updates = {
    docName: data.docName || existing.docName,
    docType: data.docType || existing.docType,
    issuer: data.issuer !== undefined ? data.issuer : existing.issuer,
    number: data.number !== undefined ? data.number : existing.number,
    expirationDate: data.expirationDate !== undefined ? data.expirationDate : existing.expirationDate,
    notes: data.notes !== undefined ? data.notes : existing.notes,
    updatedAt: new Date().toISOString(),
  };
  await db.update(COMPLIANCE_TABLE, `USER#${userId}`, `DOC#${docId}`, updates);
  return success({ ...existing, ...updates, status: calcStatus(updates.expirationDate), daysLeft: daysUntil(updates.expirationDate) });
}

async function deleteDoc(userId, event) {
  const docId = event.pathParameters?.docId;
  if (!docId) return error("Doc ID required");
  await db.delete(COMPLIANCE_TABLE, `USER#${userId}`, `DOC#${docId}`);
  return success({ deleted: true });
}
