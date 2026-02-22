const { db } = require("../../lib/dynamodb");
const { success, error } = require("../../lib/response");
const { getUserId } = require("../../lib/validators");

const JOBS = process.env.JOBS_TABLE;
const EXP = process.env.EXPENSES_TABLE;
const INV = process.env.INVOICES_TABLE;
const ASSIGN = process.env.ASSIGNMENTS_TABLE;
const CREW = process.env.CREW_TABLE;

exports.handler = async (event) => {
  const userId = getUserId(event);
  if (!userId) return error("Unauthorized", 401);

  try {
    const rawJobs = await db.query(JOBS, `USER#${userId}`, "JOB#");
    const jobs = rawJobs.filter(j => j.jobName && j.status);
    const expenses_promises = jobs.map(j => db.query(EXP, `JOB#${j.jobId}`, "EXPENSE#").catch(() => []));
    const expenses = (await Promise.all(expenses_promises)).flat();
    // Invoices are stored under JOB#jobId, not USER#userId
    const invoicePromises = jobs.map(j => db.query(INV, `JOB#${j.jobId}`, "INVOICE#").catch(() => []));
    const invoiceResults = await Promise.all(invoicePromises);
    const invoices = invoiceResults.flat();
    const crew = await db.query(CREW, `USER#${userId}`, "CREW#").catch(() => []);
    const assignments = await db.query(ASSIGN, `USER#${userId}`, "ASSIGN#").catch(() => []);

    // === Revenue by month ===
    const revenueByMonth = {};
    jobs.filter(j => j.status === "paid").forEach(j => {
      const month = (j.updatedAt || j.createdAt || "").slice(0, 7); // YYYY-MM
      if (month) revenueByMonth[month] = (revenueByMonth[month] || 0) + (j.bidAmount || 0);
    });
    invoices.filter(i => i.status === "paid").forEach(i => {
      const month = (i.paidAt || i.updatedAt || "").slice(0, 7);
      if (month && !revenueByMonth[month]) revenueByMonth[month] = (revenueByMonth[month] || 0) + (i.amount || 0);
    });

    // === Expenses by month ===
    const expensesByMonth = {};
    expenses.forEach(e => {
      const month = (e.date || e.createdAt || "").slice(0, 7);
      if (month) expensesByMonth[month] = (expensesByMonth[month] || 0) + (e.amount || 0);
    });

    // === Expenses by category ===
    const expensesByCategory = {};
    expenses.forEach(e => {
      const cat = e.category || "Other";
      expensesByCategory[cat] = (expensesByCategory[cat] || 0) + (e.amount || 0);
    });

    // === Job profitability ranking ===
    const jobProfitability = jobs.filter(j => j.bidAmount > 0).map(j => {
      const cost = j.actualCost || j.totalExpenses || 0;
      const profit = j.bidAmount - cost;
      const margin = (profit / j.bidAmount * 100);
      return {
        jobId: j.jobId, jobName: j.jobName, clientName: j.clientName,
        status: j.status, bidAmount: j.bidAmount, cost, profit,
        margin: Math.round(margin * 10) / 10,
      };
    }).sort((a, b) => b.margin - a.margin);

    // === Monthly trends (last 6 months) ===
    const now = new Date();
    const monthlyTrends = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toISOString().slice(0, 7);
      const monthLabel = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      monthlyTrends.push({
        month: key, label: monthLabel,
        revenue: revenueByMonth[key] || 0,
        expenses: expensesByMonth[key] || 0,
        profit: (revenueByMonth[key] || 0) - (expensesByMonth[key] || 0),
      });
    }

    // === Job status breakdown ===
    const statusCounts = { bidding: 0, active: 0, complete: 0, paid: 0 };
    jobs.forEach(j => { if (statusCounts[j.status] !== undefined) statusCounts[j.status]++; });

    // === Crew stats ===
    const crewCount = crew.length;
    const totalAssignments = assignments.length;

    // === Summary stats ===
    const totalRevenue = Object.values(revenueByMonth).reduce((s, v) => s + v, 0);
    const totalExpenses = Object.values(expensesByMonth).reduce((s, v) => s + v, 0);
    const totalProfit = totalRevenue - totalExpenses;
    const avgJobValue = jobs.length > 0 ? totalRevenue / jobs.filter(j => j.bidAmount > 0).length : 0;

    // === Client summary ===
    const clientMap = {};
    jobs.forEach(j => {
      if (!j.clientName) return;
      if (!clientMap[j.clientName]) {
        clientMap[j.clientName] = { name: j.clientName, email: j.clientEmail || "", phone: j.clientPhone || "",
          jobCount: 0, totalValue: 0, lastJob: "", lastJobDate: "", jobIds: [], latestJobId: "" };
      }
      clientMap[j.clientName].jobCount++;
      clientMap[j.clientName].totalValue += j.bidAmount || 0;
      clientMap[j.clientName].jobIds.push(j.jobId);
      const dt = j.updatedAt || j.createdAt || "";
      if (dt > clientMap[j.clientName].lastJobDate) {
        clientMap[j.clientName].lastJobDate = dt;
        clientMap[j.clientName].lastJob = j.jobName;
        clientMap[j.clientName].latestJobId = j.jobId;
      }
    });
    // Add latest invoice per client
    invoices.forEach(inv => {
      const client = Object.values(clientMap).find(c => c.jobIds.includes(inv.jobId));
      if (client && (!client.latestInvoiceId || (inv.createdAt || "") > (client.latestInvoiceDate || ""))) {
        client.latestInvoiceId = inv.invoiceId;
        client.latestInvoiceDate = inv.createdAt || "";
        client.latestInvoiceStatus = inv.status;
      }
    });
    const clients = Object.values(clientMap).sort((a, b) => b.totalValue - a.totalValue);

    return success({
      summary: { totalRevenue, totalExpenses, totalProfit, totalJobs: jobs.length,
        avgJobValue: Math.round(avgJobValue), crewCount, totalAssignments },
      monthlyTrends, jobProfitability, statusCounts,
      expensesByCategory, clients,
    });
  } catch (err) { console.error(err); return error("Internal server error", 500); }
};
