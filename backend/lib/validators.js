const JOB_STATUSES = ["bidding", "active", "complete", "paid"];
const EXPENSE_CATEGORIES = ["materials", "labor", "equipment", "subcontractor", "permits", "other"];
function validateJob(d) { const e = []; if (!d.jobName?.trim()) e.push("Job name required"); if (!d.clientName?.trim()) e.push("Client name required"); return e; }
function validateExpense(d) { const e = []; if (!d.amount || isNaN(d.amount) || d.amount <= 0) e.push("Valid amount required"); return e; }
function getUserId(event) { return event.requestContext?.authorizer?.claims?.sub || null; }
module.exports = { validateJob, validateExpense, getUserId, JOB_STATUSES, EXPENSE_CATEGORIES };
