const { db } = require("../../lib/dynamodb");
const { success, error } = require("../../lib/response");
const { getUserId } = require("../../lib/validators");
const USERS = process.env.USERS_TABLE;

exports.handler = async (event) => {
  const userId = getUserId(event);
  if (!userId) return error("Unauthorized", 401);
  const method = event.httpMethod;

  if (method === "GET") {
    try {
      const user = await db.get(USERS, `USER#${userId}`, "PROFILE");
      return success({ companyName: user?.companyName || "", trade: user?.trade || "", name: user?.name || "", email: user?.email || "" });
    } catch (e) { return error(e.message); }
  }

  if (method === "PUT") {
    try {
      const body = JSON.parse(event.body || "{}");
      const { companyName, trade } = body;
      await db.update(USERS, `USER#${userId}`, "PROFILE", { companyName: companyName || "", trade: trade || "" });
      return success({ ok: true });
    } catch (e) { return error(e.message); }
  }

  return error("Method not allowed", 405);
};
