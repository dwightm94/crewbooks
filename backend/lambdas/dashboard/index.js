const { db } = require("../../lib/dynamodb");
const { success, error } = require("../../lib/response");
const { getUserId } = require("../../lib/validators");

const JOBS = process.env.JOBS_TABLE;
const INV = process.env.INVOICES_TABLE;

exports.handler = async (event) => {
  const userId = getUserId(event);
  if (!userId) return error("Unauthorized", 401);

  try {
    const jobs = await db.query(JOBS, `USER#${userId}`, "JOB#");
    const invoices = await db.query(INV, `USER#${userId}`, "INVSTATUS#", { indexName: "GSI1" });

    const active = jobs.filter(j => j.status === "active");
    const unpaid = invoices.filter(i => i.status === "sent" || i.status === "viewed");
    const totalOwed = unpaid.reduce((s, i) => s + (i.amount || 0), 0);

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const paidThisMonth = invoices.filter(i => i.status === "paid" && i.paidAt >= monthStart)
      .reduce((s, i) => s + (i.amount || 0), 0);
    const totalEarned = invoices.filter(i => i.status === "paid")
      .reduce((s, i) => s + (i.amount || 0), 0);

    const today = now.toISOString().split("T")[0];
    const overdue = unpaid.filter(i => i.dueDate && i.dueDate < today).map(i => {
      const days = Math.floor((now - new Date(i.dueDate)) / 86400000);
      return { invoiceId: i.invoiceId, jobId: i.jobId, jobName: i.jobName,
        clientName: i.clientName, amount: i.amount, dueDate: i.dueDate, daysOverdue: days };
    }).sort((a, b) => b.daysOverdue - a.daysOverdue);

    const totalOverdue = overdue.reduce((s, i) => s + (i.amount || 0), 0);
    const totalBid = jobs.filter(j => ["active","complete"].includes(j.status)).reduce((s, j) => s + (j.bidAmount || 0), 0);
    const totalCost = jobs.filter(j => ["active","complete"].includes(j.status)).reduce((s, j) => s + (j.actualCost || 0), 0);

    const recentJobs = jobs.sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""))
      .slice(0, 5).map(j => ({
        jobId: j.jobId, jobName: j.jobName, clientName: j.clientName, status: j.status,
        bidAmount: j.bidAmount, actualCost: j.actualCost,
        margin: j.bidAmount ? ((j.bidAmount - j.actualCost) / j.bidAmount * 100).toFixed(1) : null,
      }));

    return success({
      totalOwed, totalOverdue, paidThisMonth, totalEarned,
      counts: { bidding: jobs.filter(j=>j.status==="bidding").length, active: active.length,
        complete: jobs.filter(j=>j.status==="complete").length, total: jobs.length },
      profitability: { totalBidValue: totalBid, totalActualCost: totalCost,
        totalMargin: totalBid - totalCost,
        marginPercent: totalBid ? ((totalBid - totalCost) / totalBid * 100).toFixed(1) : 0 },
      overdueInvoices: overdue, recentJobs,
    });
  } catch (err) { console.error(err); return error("Internal server error", 500); }
};
