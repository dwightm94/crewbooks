const { db } = require("../../lib/dynamodb");
const { success, error } = require("../../lib/response");

const USERS_TABLE = process.env.USERS_TABLE;
const JOBS_TABLE = process.env.JOBS_TABLE;
const INVOICES_TABLE = process.env.INVOICES_TABLE;
const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY;
const FRONTEND_URL = process.env.FRONTEND_URL || "https://master.dlw0zhxk42vjk.amplifyapp.com";

// Plan definitions
const PLANS = {
  free: {
    name: "Free", price: 0, maxActiveJobs: 3, maxInvoicesPerMonth: 3,
    onlinePayments: false, fullReports: false, paymentReminders: false,
    maxCrew: 3, maxPhotoStorage: 500, // MB
  },
  pro: {
    name: "Pro", price: 3900, // cents ($39/mo)
    priceDisplay: "$39/mo",
    maxActiveJobs: Infinity, maxInvoicesPerMonth: Infinity,
    onlinePayments: true, fullReports: true, paymentReminders: true,
    maxCrew: Infinity, maxPhotoStorage: 5120, // 5GB
  },
  team: {
    name: "Team", price: 7900, // cents ($79/mo)
    priceDisplay: "$79/mo",
    maxActiveJobs: Infinity, maxInvoicesPerMonth: Infinity,
    onlinePayments: true, fullReports: true, paymentReminders: true,
    maxCrew: Infinity, maxPhotoStorage: 25600, // 25GB
    maxUsers: 10, comingSoon: true,
  },
};

let stripe;
function getStripe() {
  if (!stripe) stripe = require("stripe")(STRIPE_SECRET);
  return stripe;
}

exports.handler = async (event) => {
  const method = event.httpMethod;
  const path = event.resource;
  const userId = event.requestContext?.authorizer?.claims?.sub;

  try {
    if (path === "/subscription/status" && method === "GET") return await getStatus(userId);
    if (path === "/subscription/check" && method === "POST") return await checkLimit(event, userId);
    if (path === "/subscription/checkout" && method === "POST") return await createCheckout(event, userId);
    if (path === "/subscription/portal" && method === "POST") return await createPortal(event, userId);
    if (path === "/subscription/webhook" && method === "POST") return await handleWebhook(event);
    if (path === "/subscription/plans" && method === "GET") return await getPlans();
    return error("Not found", 404);
  } catch (err) { console.error(err); return error("Internal server error", 500); }
};

// === Get current subscription status ===
async function getStatus(userId) {
  if (!userId) return error("Unauthorized", 401);

  const profile = await db.get(USERS_TABLE, `USER#${userId}`, `PROFILE#${userId}`).catch(() => null);
  const plan = profile?.subscriptionPlan || "free";
  const planDetails = PLANS[plan] || PLANS.free;

  // Count current usage
  const jobs = await db.query(JOBS_TABLE, `USER#${userId}`, "JOB#").catch(() => []);
  const activeJobs = jobs.filter(j => j.status === "active" || j.status === "bidding").length;

  // Count invoices this month
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const allInvoices = [];
  for (const j of jobs) {
    const invs = await db.query(INVOICES_TABLE, `JOB#${j.jobId}`, "INVOICE#").catch(() => []);
    allInvoices.push(...invs);
  }
  const monthlyInvoices = allInvoices.filter(i => (i.createdAt || "") >= monthStart).length;

  return success({
    plan,
    planName: planDetails.name,
    price: planDetails.price,
    priceDisplay: planDetails.priceDisplay || "Free",
    stripeSubscriptionId: profile?.stripeSubscriptionId || null,
    stripeCustomerId: profile?.stripeCustomerId || null,
    subscribedAt: profile?.subscribedAt || null,
    usage: {
      activeJobs,
      maxActiveJobs: planDetails.maxActiveJobs === Infinity ? "Unlimited" : planDetails.maxActiveJobs,
      monthlyInvoices,
      maxInvoicesPerMonth: planDetails.maxInvoicesPerMonth === Infinity ? "Unlimited" : planDetails.maxInvoicesPerMonth,
    },
    features: {
      onlinePayments: planDetails.onlinePayments,
      fullReports: planDetails.fullReports,
      paymentReminders: planDetails.paymentReminders,
      maxCrew: planDetails.maxCrew === Infinity ? "Unlimited" : planDetails.maxCrew,
    },
    limits: planDetails,
  });
}

// === Check if user can perform an action ===
async function checkLimit(event, userId) {
  if (!userId) return error("Unauthorized", 401);
  const body = JSON.parse(event.body || "{}");
  const action = body.action; // "create_job", "create_invoice", "online_payment"

  const profile = await db.get(USERS_TABLE, `USER#${userId}`, `PROFILE#${userId}`).catch(() => null);
  const plan = profile?.subscriptionPlan || "free";
  const limits = PLANS[plan] || PLANS.free;

  if (action === "create_job") {
    const jobs = await db.query(JOBS_TABLE, `USER#${userId}`, "JOB#").catch(() => []);
    const activeJobs = jobs.filter(j => j.status === "active" || j.status === "bidding").length;
    if (activeJobs >= limits.maxActiveJobs) {
      return success({ allowed: false, reason: "job_limit", current: activeJobs, max: limits.maxActiveJobs,
        message: `Free plan allows ${limits.maxActiveJobs} active jobs. Upgrade to Pro for unlimited jobs.` });
    }
  }

  if (action === "create_invoice") {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const jobs = await db.query(JOBS_TABLE, `USER#${userId}`, "JOB#").catch(() => []);
    let monthlyCount = 0;
    for (const j of jobs) {
      const invs = await db.query(INVOICES_TABLE, `JOB#${j.jobId}`, "INVOICE#").catch(() => []);
      monthlyCount += invs.filter(i => (i.createdAt || "") >= monthStart).length;
    }
    if (monthlyCount >= limits.maxInvoicesPerMonth) {
      return success({ allowed: false, reason: "invoice_limit", current: monthlyCount, max: limits.maxInvoicesPerMonth,
        message: `Free plan allows ${limits.maxInvoicesPerMonth} invoices/month. Upgrade to Pro for unlimited invoicing.` });
    }
  }

  if (action === "online_payment" && !limits.onlinePayments) {
    return success({ allowed: false, reason: "feature_locked", feature: "online_payments",
      message: "Online payments require Pro plan. Upgrade to accept payments online." });
  }

  if (action === "full_reports" && !limits.fullReports) {
    return success({ allowed: false, reason: "feature_locked", feature: "full_reports",
      message: "Full reports require Pro plan. Upgrade for complete analytics." });
  }

  if (action === "payment_reminders" && !limits.paymentReminders) {
    return success({ allowed: false, reason: "feature_locked", feature: "payment_reminders",
      message: "Payment reminders require Pro plan. Upgrade to auto-remind clients." });
  }

  return success({ allowed: true });
}

// === Create Stripe Checkout for Pro subscription ===
async function createCheckout(event, userId) {
  if (!userId) return error("Unauthorized", 401);
  const s = getStripe();
  const body = JSON.parse(event.body || "{}");
  const planKey = body.plan || "pro";

  if (planKey === "team") return error("Team plan coming soon!");
  if (planKey !== "pro") return error("Invalid plan");

  const profile = await db.get(USERS_TABLE, `USER#${userId}`, `PROFILE#${userId}`).catch(() => null);
  let customerId = profile?.stripeCustomerId;

  // Create Stripe customer if needed
  if (!customerId) {
    const email = event.requestContext?.authorizer?.claims?.email;
    const customer = await s.customers.create({
      email, metadata: { userId, platform: "crewbooks" },
    });
    customerId = customer.id;
    await db.update(USERS_TABLE, `USER#${userId}`, `PROFILE#${userId}`, {
      stripeCustomerId: customerId, updatedAt: new Date().toISOString(),
    });
  }

  // Create checkout session for subscription
  const session = await s.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ["card"],
    line_items: [{
      price_data: {
        currency: "usd",
        product_data: { name: "CrewBooks Pro", description: "Unlimited jobs, invoicing, online payments & full reports" },
        unit_amount: PLANS.pro.price,
        recurring: { interval: "month" },
      },
      quantity: 1,
    }],
    mode: "subscription",
    success_url: `${FRONTEND_URL}/settings?upgraded=true`,
    cancel_url: `${FRONTEND_URL}/upgrade?cancelled=true`,
    metadata: { userId, plan: "pro" },
  });

  return success({ sessionId: session.id, url: session.url });
}

// === Create Stripe Customer Portal (manage/cancel) ===
async function createPortal(event, userId) {
  if (!userId) return error("Unauthorized", 401);
  const s = getStripe();

  const profile = await db.get(USERS_TABLE, `USER#${userId}`, `PROFILE#${userId}`).catch(() => null);
  if (!profile?.stripeCustomerId) return error("No subscription found");

  const session = await s.billingPortal.sessions.create({
    customer: profile.stripeCustomerId,
    return_url: `${FRONTEND_URL}/settings`,
  });

  return success({ url: session.url });
}

// === Handle Stripe webhooks ===
async function handleWebhook(event) {
  let webhookEvent;
  try { webhookEvent = JSON.parse(event.body); } catch (e) { return error("Invalid payload", 400); }

  const type = webhookEvent.type;
  const obj = webhookEvent.data?.object;

  // Subscription created or updated
  if (type === "customer.subscription.created" || type === "customer.subscription.updated") {
    const userId = obj.metadata?.userId;
    const status = obj.status; // active, past_due, canceled, etc.
    if (userId) {
      const plan = status === "active" ? (obj.metadata?.plan || "pro") : "free";
      await db.update(USERS_TABLE, `USER#${userId}`, `PROFILE#${userId}`, {
        subscriptionPlan: plan,
        stripeSubscriptionId: obj.id,
        subscriptionStatus: status,
        subscribedAt: status === "active" ? new Date().toISOString() : undefined,
        updatedAt: new Date().toISOString(),
      });
    }
  }

  // Subscription canceled
  if (type === "customer.subscription.deleted") {
    const userId = obj.metadata?.userId;
    if (userId) {
      await db.update(USERS_TABLE, `USER#${userId}`, `PROFILE#${userId}`, {
        subscriptionPlan: "free",
        subscriptionStatus: "canceled",
        updatedAt: new Date().toISOString(),
      });
    }
  }

  // Checkout completed (subscription)
  if (type === "checkout.session.completed" && obj.mode === "subscription") {
    const userId = obj.metadata?.userId;
    const plan = obj.metadata?.plan || "pro";
    if (userId) {
      await db.update(USERS_TABLE, `USER#${userId}`, `PROFILE#${userId}`, {
        subscriptionPlan: plan,
        stripeCustomerId: obj.customer,
        stripeSubscriptionId: obj.subscription,
        subscriptionStatus: "active",
        subscribedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  }

  return success({ received: true });
}

// === Get available plans ===
async function getPlans() {
  return success({
    plans: [
      { key: "free", name: "Free", price: 0, priceDisplay: "Free", features: [
        "3 active jobs", "3 invoices/month", "Crew management", "Photo documentation",
        "Daily logs", "Compliance tracking", "Estimates & bidding", "Basic reports",
      ]},
      { key: "pro", name: "Pro", price: 3900, priceDisplay: "$39/mo", popular: true, features: [
        "Everything in Free, plus:", "Unlimited active jobs", "Unlimited invoicing",
        "Accept online payments", "Full reports & analytics", "Payment reminders",
        "Priority support",
      ]},
      { key: "team", name: "Team", price: 7900, priceDisplay: "$79/mo", comingSoon: true, features: [
        "Everything in Pro, plus:", "Up to 10 users", "Unlimited crew members",
        "25GB photo storage", "QuickBooks sync", "Priority support",
      ]},
    ],
  });
}
