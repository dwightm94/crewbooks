const { db } = require("../../lib/dynamodb");
const { success, error } = require("../../lib/response");

const USERS_TABLE = process.env.USERS_TABLE;
const JOBS_TABLE = process.env.JOBS_TABLE;
const EXPENSES_TABLE = process.env.EXPENSES_TABLE;
const INVOICES_TABLE = process.env.INVOICES_TABLE;
const QB_CLIENT_ID = process.env.QB_CLIENT_ID || "";
const QB_CLIENT_SECRET = process.env.QB_CLIENT_SECRET || "";
const FRONTEND_URL = process.env.FRONTEND_URL || "https://master.dlw0zhxk42vjk.amplifyapp.com";

// QuickBooks OAuth URLs
const QB_AUTH_URL = "https://appcenter.intuit.com/connect/oauth2";
const QB_TOKEN_URL = "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer";
const QB_API_BASE = "https://quickbooks.api.intuit.com/v3/company";

exports.handler = async (event) => {
  const method = event.httpMethod;
  const path = event.resource;
  const userId = event.requestContext?.authorizer?.claims?.sub;

  try {
    if (path === "/quickbooks/connect" && method === "GET") return await startConnect(userId);
    if (path === "/quickbooks/callback" && method === "GET") return await handleCallback(event);
    if (path === "/quickbooks/status" && method === "GET") return await getStatus(userId);
    if (path === "/quickbooks/sync" && method === "POST") return await syncData(event, userId);
    if (path === "/quickbooks/disconnect" && method === "POST") return await disconnect(userId);
    return error("Not found", 404);
  } catch (err) { console.error(err); return error("Internal server error", 500); }
};

// Start QuickBooks OAuth flow
async function startConnect(userId) {
  if (!userId) return error("Unauthorized", 401);
  if (!QB_CLIENT_ID) return error("QuickBooks not configured. Add QB_CLIENT_ID to enable.");

  const state = Buffer.from(JSON.stringify({ userId })).toString("base64");
  const redirectUri = `${FRONTEND_URL}/quickbooks/callback`;
  const scope = "com.intuit.quickbooks.accounting";

  const url = `${QB_AUTH_URL}?client_id=${QB_CLIENT_ID}&response_type=code&scope=${scope}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;

  return success({ url });
}

// Handle OAuth callback
async function handleCallback(event) {
  const code = event.queryStringParameters?.code;
  const realmId = event.queryStringParameters?.realmId;
  const state = event.queryStringParameters?.state;

  if (!code || !state) return error("Missing code or state");

  let userId;
  try {
    const decoded = JSON.parse(Buffer.from(state, "base64").toString());
    userId = decoded.userId;
  } catch { return error("Invalid state"); }

  // Exchange code for tokens
  const https = require("https");
  const tokenData = await new Promise((resolve, reject) => {
    const postData = `grant_type=authorization_code&code=${code}&redirect_uri=${encodeURIComponent(`${FRONTEND_URL}/quickbooks/callback`)}`;
    const auth = Buffer.from(`${QB_CLIENT_ID}:${QB_CLIENT_SECRET}`).toString("base64");
    const req = https.request(QB_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${auth}`,
        Accept: "application/json",
      },
    }, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => resolve(JSON.parse(data)));
    });
    req.on("error", reject);
    req.write(postData);
    req.end();
  });

  if (tokenData.error) return error(`QuickBooks error: ${tokenData.error}`);

  // Store tokens
  await db.update(USERS_TABLE, `USER#${userId}`, `PROFILE#${userId}`, {
    qb_accessToken: tokenData.access_token,
    qb_refreshToken: tokenData.refresh_token,
    qb_realmId: realmId,
    qb_tokenExpiry: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
    qb_connected: true,
    qb_connectedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // Redirect back to settings
  return {
    statusCode: 302,
    headers: { Location: `${FRONTEND_URL}/settings?qb=connected` },
    body: "",
  };
}

// Get QuickBooks connection status
async function getStatus(userId) {
  if (!userId) return error("Unauthorized", 401);
  const profile = await db.get(USERS_TABLE, `USER#${userId}`, `PROFILE#${userId}`).catch(() => null);
  const configured = !!QB_CLIENT_ID;

  return success({
    configured,
    connected: profile?.qb_connected || false,
    realmId: profile?.qb_realmId || null,
    connectedAt: profile?.qb_connectedAt || null,
    lastSync: profile?.qb_lastSync || null,
  });
}

// Sync invoices and expenses to QuickBooks
async function syncData(event, userId) {
  if (!userId) return error("Unauthorized", 401);

  const profile = await db.get(USERS_TABLE, `USER#${userId}`, `PROFILE#${userId}`).catch(() => null);
  if (!profile?.qb_connected) return error("QuickBooks not connected");

  const body = JSON.parse(event.body || "{}");
  const syncType = body.type || "all"; // "invoices", "expenses", "all"
  const results = { invoices: 0, expenses: 0, errors: [] };

  // Get QB access token (refresh if expired)
  let accessToken = profile.qb_accessToken;
  const tokenExpiry = new Date(profile.qb_tokenExpiry || 0);
  if (tokenExpiry < new Date()) {
    // Refresh token
    try {
      const refreshed = await refreshQBToken(profile.qb_refreshToken);
      accessToken = refreshed.access_token;
      await db.update(USERS_TABLE, `USER#${userId}`, `PROFILE#${userId}`, {
        qb_accessToken: refreshed.access_token,
        qb_refreshToken: refreshed.refresh_token || profile.qb_refreshToken,
        qb_tokenExpiry: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
      });
    } catch (e) {
      return error("Failed to refresh QuickBooks token. Please reconnect.");
    }
  }

  const realmId = profile.qb_realmId;

  // Sync invoices
  if (syncType === "invoices" || syncType === "all") {
    const jobs = await db.query(JOBS_TABLE, `USER#${userId}`, "JOB#").catch(() => []);
    for (const job of jobs) {
      const invoices = await db.query(INVOICES_TABLE, `JOB#${job.jobId}`, "INVOICE#").catch(() => []);
      for (const inv of invoices) {
        if (inv.qb_synced) continue;
        try {
          // Create invoice in QB
          const qbInvoice = {
            Line: [{
              Amount: inv.amount,
              DetailType: "SalesItemLineDetail",
              SalesItemLineDetail: { ItemRef: { value: "1", name: "Services" } },
              Description: job.jobName || "Service",
            }],
            CustomerRef: { value: "1", name: inv.clientName || job.clientName },
          };

          await qbApiCall(accessToken, realmId, "invoice", "POST", qbInvoice);

          await db.update(INVOICES_TABLE, inv.PK, inv.SK, {
            qb_synced: true, qb_syncedAt: new Date().toISOString(),
          });
          results.invoices++;
        } catch (e) {
          results.errors.push(`Invoice ${inv.invoiceId}: ${e.message}`);
        }
      }
    }
  }

  // Sync expenses
  if (syncType === "expenses" || syncType === "all") {
    const jobs = await db.query(JOBS_TABLE, `USER#${userId}`, "JOB#").catch(() => []);
    for (const job of jobs) {
      const expenses = await db.query(EXPENSES_TABLE, `JOB#${job.jobId}`, "EXPENSE#").catch(() => []);
      for (const exp of expenses) {
        if (exp.qb_synced) continue;
        try {
          const qbExpense = {
            PaymentType: "Cash",
            Line: [{
              Amount: exp.amount,
              DetailType: "AccountBasedExpenseLineDetail",
              AccountBasedExpenseLineDetail: {
                AccountRef: { value: "1", name: "Expenses" },
              },
              Description: `${job.jobName} - ${exp.category || "expense"}${exp.description ? ": " + exp.description : ""}`,
            }],
          };

          await qbApiCall(accessToken, realmId, "purchase", "POST", qbExpense);

          await db.update(EXPENSES_TABLE, exp.PK, exp.SK, {
            qb_synced: true, qb_syncedAt: new Date().toISOString(),
          });
          results.expenses++;
        } catch (e) {
          results.errors.push(`Expense ${exp.expenseId}: ${e.message}`);
        }
      }
    }
  }

  // Update last sync time
  await db.update(USERS_TABLE, `USER#${userId}`, `PROFILE#${userId}`, {
    qb_lastSync: new Date().toISOString(),
  });

  return success(results);
}

// Disconnect QuickBooks
async function disconnect(userId) {
  if (!userId) return error("Unauthorized", 401);
  await db.update(USERS_TABLE, `USER#${userId}`, `PROFILE#${userId}`, {
    qb_connected: false,
    qb_accessToken: null,
    qb_refreshToken: null,
    qb_realmId: null,
    updatedAt: new Date().toISOString(),
  });
  return success({ disconnected: true });
}

// Helper: Refresh QB token
async function refreshQBToken(refreshToken) {
  const https = require("https");
  return new Promise((resolve, reject) => {
    const postData = `grant_type=refresh_token&refresh_token=${refreshToken}`;
    const auth = Buffer.from(`${QB_CLIENT_ID}:${QB_CLIENT_SECRET}`).toString("base64");
    const req = https.request(QB_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Authorization: `Basic ${auth}`, Accept: "application/json" },
    }, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => { const parsed = JSON.parse(data); parsed.error ? reject(new Error(parsed.error)) : resolve(parsed); });
    });
    req.on("error", reject);
    req.write(postData);
    req.end();
  });
}

// Helper: QB API call
async function qbApiCall(token, realmId, entity, method, body) {
  const https = require("https");
  const url = `${QB_API_BASE}/${realmId}/${entity}?minorversion=65`;
  return new Promise((resolve, reject) => {
    const req = https.request(url, {
      method,
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json" },
    }, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => { try { resolve(JSON.parse(data)); } catch { resolve(data); } });
    });
    req.on("error", reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}
