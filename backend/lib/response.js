const H = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Content-Type,Authorization", "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS", "Content-Type": "application/json" };
const success = (data, s = 200) => ({ statusCode: s, headers: H, body: JSON.stringify({ success: true, data }) });
const error = (msg, s = 400) => ({ statusCode: s, headers: H, body: JSON.stringify({ success: false, error: msg }) });
const created = (data) => success(data, 201);
module.exports = { success, error, created };
