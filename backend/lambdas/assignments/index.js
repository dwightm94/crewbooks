const { randomUUID } = require("crypto");
const { db } = require("../../lib/dynamodb");
const { success, error, created } = require("../../lib/response");
const { getUserId } = require("../../lib/validators");
const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns");

const ASSIGN_TABLE = process.env.ASSIGNMENTS_TABLE;
const CREW_TABLE = process.env.CREW_TABLE;
const JOBS_TABLE = process.env.JOBS_TABLE;
const sns = new SNSClient({ region: process.env.REGION });

exports.handler = async (event) => {
  const method = event.httpMethod;
  const path = event.resource;

  // Public: crew member checks their assignment via token
  if (path === "/crew-view/{token}" && method === "GET") {
    return await getCrewView(event);
  }

  // Public: clock in/out
  if (path === "/crew-view/{token}/clock" && method === "POST") {
    return await clockInOut(event);
  }

  const userId = getUserId(event);
  if (!userId) return error("Unauthorized", 401);

  try {
    switch (method) {
      case "POST":
        if (path.includes("/notify")) return await notifyCrew(userId, event);
        return await createAssignment(userId, event);
      case "GET":
        if (path.includes("/tracker")) return await getTracker(userId);
        return await listAssignments(userId, event);
      case "DELETE": return await deleteAssignment(userId, event);
      default: return error("Method not allowed", 405);
    }
  } catch (err) { console.error(err); return error("Internal server error", 500); }
};

async function createAssignment(userId, event) {
  const data = JSON.parse(event.body || "{}");
  if (!data.memberId || !data.jobId || !data.date) return error("memberId, jobId, and date are required");

  const [member, job] = await Promise.all([
    db.get(CREW_TABLE, `USER#${userId}`, `CREW#${data.memberId}`),
    db.get(JOBS_TABLE, `USER#${userId}`, `JOB#${data.jobId}`),
  ]);
  if (!member) return error("Crew member not found", 404);
  if (!job) return error("Job not found", 404);

  const assignId = randomUUID(), now = new Date().toISOString();
  const assignment = {
    PK: `DATE#${data.date}`, SK: `USER#${userId}#CREW#${data.memberId}`,
    GSI1PK: `USER#${userId}`, GSI1SK: `DATE#${data.date}#CREW#${data.memberId}`,
    assignmentId: assignId, userId, memberId: data.memberId, memberName: member.name,
    memberPhone: member.phone, memberToken: member.token,
    jobId: data.jobId, jobName: job.jobName, jobAddress: job.address || "",
    startTime: data.startTime || "7:00 AM", endTime: data.endTime || "",
    clockIn: null, clockOut: null, clockInGps: null, clockOutGps: null,
    hoursWorked: null, hourlyRate: member.hourlyRate || 0,
    notes: data.notes || "", date: data.date, createdAt: now,
  };
  await db.put(ASSIGN_TABLE, assignment);
  const { PK, SK, GSI1PK, GSI1SK, ...rest } = assignment;
  return created(rest);
}

async function listAssignments(userId, event) {
  const date = event.queryStringParameters?.date;
  if (date) {
    // Get all assignments for a specific date
    const items = await db.query(ASSIGN_TABLE, `DATE#${date}`, `USER#${userId}#`);
    const assignments = items.map(({ PK, SK, GSI1PK, GSI1SK, ...rest }) => rest);
    return success({ assignments, date });
  }
  // Get recent assignments via GSI1
  const items = await db.query(ASSIGN_TABLE, `USER#${userId}`, "DATE#", { indexName: "GSI1" });
  const assignments = items.map(({ PK, SK, GSI1PK, GSI1SK, ...rest }) => rest);
  return success({ assignments });
}

async function deleteAssignment(userId, event) {
  const { date, memberId } = event.queryStringParameters || {};
  if (!date || !memberId) return error("date and memberId required");
  await db.delete(ASSIGN_TABLE, `DATE#${date}`, `USER#${userId}#CREW#${memberId}`);
  return success({ deleted: true });
}

async function notifyCrew(userId, event) {
  const data = JSON.parse(event.body || "{}");
  const date = data.date;
  if (!date) return error("date is required");

  const items = await db.query(ASSIGN_TABLE, `DATE#${date}`, `USER#${userId}#`);
  const results = [];

  for (const a of items) {
    if (!a.memberPhone) { results.push({ name: a.memberName, sent: false, reason: "no phone" }); continue; }
    const phone = a.memberPhone.replace(/\D/g, "");
    const fullPhone = phone.length === 10 ? `+1${phone}` : `+${phone}`;
    const msg = `Hey ${a.memberName.split(" ")[0]}, you're at ${a.jobAddress || a.jobName} tomorrow. Start ${a.startTime}. - CrewBooks`;
    try {
      await sns.send(new PublishCommand({ PhoneNumber: fullPhone, Message: msg }));
      results.push({ name: a.memberName, sent: true });
    } catch (e) {
      console.warn(`SMS failed for ${a.memberName}:`, e.message);
      results.push({ name: a.memberName, sent: false, reason: e.message });
    }
  }
  return success({ notified: results });
}

async function getCrewView(event) {
  const token = event.pathParameters?.token;
  if (!token) return error("Token required");

  // Find member by token via GSI1
  const members = await db.query(CREW_TABLE, `TOKEN#${token}`, "CREW#", { indexName: "GSI1" });
  if (!members.length) return error("Invalid link", 404);
  const member = members[0];

  // Get today and tomorrow's assignments
  const today = new Date().toISOString().split("T")[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];

  const [todayAssign, tomorrowAssign] = await Promise.all([
    db.query(ASSIGN_TABLE, `DATE#${today}`, `USER#${member.userId}#CREW#${member.memberId}`),
    db.query(ASSIGN_TABLE, `DATE#${tomorrow}`, `USER#${member.userId}#CREW#${member.memberId}`),
  ]);

  return success({
    memberName: member.name,
    today: todayAssign.map(({ PK, SK, GSI1PK, GSI1SK, userId, ...rest }) => rest),
    tomorrow: tomorrowAssign.map(({ PK, SK, GSI1PK, GSI1SK, userId, ...rest }) => rest),
  });
}

async function clockInOut(event) {
  const token = event.pathParameters?.token;
  const data = JSON.parse(event.body || "{}");
  const { action, lat, lng } = data; // action: "clockIn" | "clockOut"

  const members = await db.query(CREW_TABLE, `TOKEN#${token}`, "CREW#", { indexName: "GSI1" });
  if (!members.length) return error("Invalid link", 404);
  const member = members[0];

  const today = new Date().toISOString().split("T")[0];
  const assignments = await db.query(ASSIGN_TABLE, `DATE#${today}`, `USER#${member.userId}#CREW#${member.memberId}`);
  if (!assignments.length) return error("No assignment for today", 404);

  const a = assignments[0];
  const now = new Date().toISOString();

  if (action === "clockIn") {
    await db.update(ASSIGN_TABLE, a.PK, a.SK, {
      clockIn: now, clockInGps: lat && lng ? { lat, lng } : null,
    });
    return success({ clockedIn: true, time: now });
  } else if (action === "clockOut") {
    const clockIn = a.clockIn ? new Date(a.clockIn) : new Date();
    const hours = ((new Date(now) - clockIn) / 3600000).toFixed(2);
    await db.update(ASSIGN_TABLE, a.PK, a.SK, {
      clockOut: now, clockOutGps: lat && lng ? { lat, lng } : null,
      hoursWorked: parseFloat(hours),
    });
    return success({ clockedOut: true, time: now, hoursWorked: parseFloat(hours) });
  }

  return error("action must be clockIn or clockOut");
}

async function getTracker(userId) {
  const today = new Date().toISOString().split("T")[0];
  const items = await db.query(ASSIGN_TABLE, `DATE#${today}`, `USER#${userId}#`);
  const crew = items.map(({ PK, SK, GSI1PK, GSI1SK, ...rest }) => rest);
  return success({ date: today, crew });
}
