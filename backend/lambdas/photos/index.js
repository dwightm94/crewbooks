const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { randomUUID } = require("crypto");
const { success, error } = require("../../lib/response");
const { getUserId } = require("../../lib/validators");

const s3 = new S3Client({ region: process.env.REGION });
const BUCKET = process.env.PHOTOS_BUCKET;

exports.handler = async (event) => {
  const userId = getUserId(event);
  if (!userId) return error("Unauthorized", 401);
  try {
    const { jobId, contentType } = JSON.parse(event.body || "{}");
    if (!contentType) return error("Content type required");
    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowed.includes(contentType)) return error("Invalid content type");
    const ext = contentType.split("/")[1] === "jpeg" ? "jpg" : contentType.split("/")[1];
    const key = jobId ? `${userId}/${jobId}/${randomUUID()}.${ext}` : `${userId}/receipts/${randomUUID()}.${ext}`;
    const url = await getSignedUrl(s3, new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: contentType }), { expiresIn: 300 });
    return success({ uploadUrl: url, key, fileUrl: `https://${BUCKET}.s3.amazonaws.com/${key}` });
  } catch (err) { console.error(err); return error("Internal server error", 500); }
};
