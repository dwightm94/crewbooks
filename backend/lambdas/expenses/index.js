const { randomUUID } = require("crypto");
const { db } = require("../../lib/dynamodb");
const { success, error, created } = require("../../lib/response");
const { validateExpense, getUserId } = require("../../lib/validators");

const EXP = process.env.EXPENSES_TABLE;
const JOBS = process.env.JOBS_TABLE;

exports.handler = async (event) => {
  const userId = getUserId(event);
  if (!userId) return error("Unauthorized", 401);
  const jobId = event.pathParameters?.jobId;
  if (!jobId) return error("Job ID required");

  try {
    if (event.httpMethod === "POST") {
      const data = JSON.parse(event.body || "{}");
      const errs = validateExpense(data);
      if (errs.length) return error(errs.join("; "));

      const job = await db.get(JOBS, `USER#${userId}`, `JOB#${jobId}`);
      if (!job) return error("Job not found", 404);

      const expenseId = randomUUID();
      const now = new Date().toISOString();
      const expense = {
        PK: `JOB#${jobId}`, SK: `EXPENSE#${expenseId}`,
        expenseId, jobId, userId,
        category: data.category || "other",
        description: (data.description || "").trim(),
        amount: parseFloat(data.amount),
        date: data.date || now.split("T")[0],
        receiptUrl: data.receiptUrl || "",
        notes: data.notes || "",
        createdAt: now,
      };
      await db.put(EXP, expense);

      // Recalculate job cost
      const all = await db.query(EXP, `JOB#${jobId}`, "EXPENSE#");
      const total = all.reduce((s, e) => s + (e.amount || 0), 0) + expense.amount;
      await db.update(JOBS, `USER#${userId}`, `JOB#${jobId}`, { actualCost: total, updatedAt: now });

      const { PK, SK, ...rest } = expense;
      return created(rest);
    }

    if (event.httpMethod === "GET") {
      const job = await db.get(JOBS, `USER#${userId}`, `JOB#${jobId}`);
      if (!job) return error("Job not found", 404);
      const expenses = await db.query(EXP, `JOB#${jobId}`, "EXPENSE#", { ascending: true });
      const total = expenses.reduce((s, e) => s + (e.amount || 0), 0);
      return success({
        expenses: expenses.map(({ PK, SK, ...r }) => r),
        total,
        budget: job.bidAmount || 0,
        remaining: (job.bidAmount || 0) - total,
      });
    }

    if (event.httpMethod === "DELETE") {
      const expenseId = event.pathParameters?.expenseId;
      if (!expenseId) return error("Expense ID required");
      await db.delete(EXP, `JOB#${jobId}`, `EXPENSE#${expenseId}`);
      const expenses = await db.query(EXP, `JOB#${jobId}`, "EXPENSE#");
      const total = expenses.reduce((s, e) => s + (e.amount || 0), 0);
      await db.update(JOBS, `USER#${userId}`, `JOB#${jobId}`, { actualCost: total, updatedAt: new Date().toISOString() });
      return success({ deleted: true, expenseId });
    }

    return error("Method not allowed", 405);
  } catch (err) {
    console.error(err);
    return error("Internal server error", 500);
  }
};
