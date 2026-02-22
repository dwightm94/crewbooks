const { db } = require("../../lib/dynamodb");
const { success, error } = require("../../lib/response");
const { getUserId } = require("../../lib/validators");

const JOBS = process.env.JOBS_TABLE;
const INV = process.env.INVOICES_TABLE;

exports.handler = async (event) => {
  const userId = getUserId(event);
  if (!userId) return error("Unauthorized", 401);

  try {
    const rawJobs = await db.query(JOBS, `USER#${userId}`, "JOB#");
    // Filter out ghost entries (photos, logs stored with same PK)
    const jobs = rawJobs.filter(j => j.jobName && j.status);
    const invoices = await db.query(INV, `USER#${userId}`, "INVSTATUS#", { indexName: "GSI1" }).catch(() => []);

    const active = jobs.filter(j => j.status === "active");
    const complete = jobs.filter(j => j.status === "complete");
    const paid = jobs.filter(j => j.status === "paid");

    // Total owed = complete jobs (not yet paid) bid amounts + unpaid invoices
    const owedFromJobs = complete.reduce((s, j) => s + (j.bidAmount || 0), 0);
    const unpaidInvoices = invoices.filter(i => i.status === "sent" || i.status === "viewed");
    const owedFromInvoices = unpaidInvoices.reduce((s, i) => s + (i.amount || 0), 0);
    const totalOwed = owedFromJobs + owedFromInvoices;

    // Total earned = paid jobs bid amounts + paid invoices
    const earnedFromJobs = paid.reduce((s, j) => s + (j.bidAmount || 0), 0);
    const earnedFromInvoices = invoices.filter(i => i.status === "paid").reduce((s, i) => s + (i.amount || 0), 0);
    const totalEarned = earnedFromJobs || earnedFromInvoices;

    // This month
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const paidJobsThisMonth = paid.filter(j => j.updatedAt >= monthStart).reduce((s, j) => s + (j.bidAmount || 0), 0);
    const paidInvoicesThisMonth = invoices.filter(i => i.status === "paid" && i.paidAt >= monthStart).reduce((s, i) => s + (i.amount || 0), 0);
    const paidThisMonth = paidJobsThisMonth || paidInvoicesThisMonth;

    // Overdue invoices
    const today = now.toISOString().split("T")[0];
    const overdue = unpaidInvoices.filter(i => i.dueDate && i.dueDate < today).map(i => {
      const days = Math.floor((now - new Date(i.dueDate)) / 86400000);
      return { invoiceId: i.invoiceId, jobId: i.jobId, jobName: i.jobName,
        clientName: i.clientName, amount: i.amount, dueDate: i.dueDate, daysOverdue: days };
    }).sort((a, b) => b.daysOverdue - a.daysOverdue);
    const totalOverdue = overdue.reduce((s, i) => s + (i.amount || 0), 0);

    // Profitability (active + complete jobs)
    const workingJobs = jobs.filter(j => ["active", "complete"].includes(j.status));
    const totalBid = workingJobs.reduce((s, j) => s + (j.bidAmount || 0), 0);
    const totalCost = workingJobs.reduce((s, j) => s + (j.actualCost || 0), 0);

    // Avg margin across all jobs with bid > 0
    const jobsWithBid = jobs.filter(j => j.bidAmount > 0);
    const avgMargin = jobsWithBid.length > 0
      ? jobsWithBid.reduce((s, j) => s + ((j.bidAmount - (j.actualCost || 0)) / j.bidAmount * 100), 0) / jobsWithBid.length
      : 0;

    const recentJobs = jobs.sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""))
      .slice(0, 5).map(j => ({
        jobId: j.jobId, jobName: j.jobName, clientName: j.clientName, status: j.status,
        bidAmount: j.bidAmount, actualCost: j.actualCost, totalExpenses: j.totalExpenses || j.actualCost || 0,
        updatedAt: j.updatedAt,
        margin: j.bidAmount ? ((j.bidAmount - (j.actualCost || 0)) / j.bidAmount * 100).toFixed(1) : null,
      }));

    return success({
      totalOwed, totalOverdue, paidThisMonth, totalEarned,
      counts: { bidding: jobs.filter(j => j.status === "bidding").length, active: active.length,
        complete: complete.length, paid: paid.length, total: jobs.length },
      profitability: { totalBidValue: totalBid, totalActualCost: totalCost,
        totalMargin: totalBid - totalCost, avgMargin: avgMargin.toFixed(1),
        marginPercent: totalBid ? ((totalBid - totalCost) / totalBid * 100).toFixed(1) : 0 },
      overdueInvoices: overdue, recentJobs,
    });
  } catch (err) { console.error(err); return error("Internal server error", 500); }
};
