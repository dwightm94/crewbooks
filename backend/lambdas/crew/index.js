const { randomUUID } = require("crypto");
const { db } = require("../../lib/dynamodb");
const { success, error, created } = require("../../lib/response");
const { getUserId } = require("../../lib/validators");
const TABLE = process.env.CREW_TABLE;

exports.handler = async (event) => {
  const method = event.httpMethod;
  const userId = getUserId(event);
  if (!userId) return error("Unauthorized", 401);

  try {
    switch (method) {
      case "POST": return await createMember(userId, event);
      case "GET": return event.pathParameters?.memberId
        ? await getMember(userId, event.pathParameters.memberId)
        : await listMembers(userId);
      case "PUT": return await updateMember(userId, event);
      case "DELETE": return await deleteMember(userId, event);
      default: return error("Method not allowed", 405);
    }
  } catch (err) { console.error(err); return error("Internal server error", 500); }
};

async function createMember(userId, event) {
  const data = JSON.parse(event.body || "{}");
  if (!data.name) return error("Name is required");
  const memberId = randomUUID(), now = new Date().toISOString();
  const token = randomUUID().replace(/-/g, "").slice(0, 16); // short unique token for crew view link
  const member = {
    PK: `USER#${userId}`, SK: `CREW#${memberId}`,
    GSI1PK: `TOKEN#${token}`, GSI1SK: `CREW#${memberId}`,
    memberId, userId, name: data.name, phone: data.phone || "",
    role: data.role || "", hourlyRate: parseFloat(data.hourlyRate) || 0,
    status: "active", certifications: data.certifications || [],
    token, createdAt: now, updatedAt: now,
  };
  await db.put(TABLE, member);
  const { PK, SK, GSI1PK, GSI1SK, ...rest } = member;
  return created(rest);
}

async function listMembers(userId) {
  const items = await db.query(TABLE, `USER#${userId}`, "CREW#");
  const members = items.map(({ PK, SK, GSI1PK, GSI1SK, ...rest }) => rest);
  return success({ members });
}

async function getMember(userId, memberId) {
  const item = await db.get(TABLE, `USER#${userId}`, `CREW#${memberId}`);
  if (!item) return error("Member not found", 404);
  const { PK, SK, GSI1PK, GSI1SK, ...rest } = item;
  return success(rest);
}

async function updateMember(userId, event) {
  const memberId = event.pathParameters?.memberId;
  if (!memberId) return error("Member ID required");
  const existing = await db.get(TABLE, `USER#${userId}`, `CREW#${memberId}`);
  if (!existing) return error("Member not found", 404);
  const data = JSON.parse(event.body || "{}");
  const updates = {
    name: data.name || existing.name,
    phone: data.phone !== undefined ? data.phone : existing.phone,
    role: data.role !== undefined ? data.role : existing.role,
    hourlyRate: data.hourlyRate !== undefined ? parseFloat(data.hourlyRate) : existing.hourlyRate,
    status: data.status || existing.status,
    certifications: data.certifications || existing.certifications,
    updatedAt: new Date().toISOString(),
  };
  await db.update(TABLE, `USER#${userId}`, `CREW#${memberId}`, updates);
  return success({ ...existing, ...updates, PK: undefined, SK: undefined, GSI1PK: undefined, GSI1SK: undefined });
}

async function deleteMember(userId, event) {
  const memberId = event.pathParameters?.memberId;
  if (!memberId) return error("Member ID required");
  await db.delete(TABLE, `USER#${userId}`, `CREW#${memberId}`);
  return success({ deleted: true });
}
