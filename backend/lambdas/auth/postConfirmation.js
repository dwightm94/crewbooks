const { db } = require("../../lib/dynamodb");
exports.handler = async (event) => {
  const { sub, email, name, phone_number } = event.request.userAttributes;
  await db.put(process.env.USERS_TABLE, { PK: `USER#${sub}`, SK: "PROFILE", userId: sub, email, name: name || "", phone: phone_number || "", companyName: "", trade: "", plan: "free", createdAt: new Date().toISOString() });
  return event;
};
