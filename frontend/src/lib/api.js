import { cognitoGetUser } from "./auth";

const BASE = process.env.NEXT_PUBLIC_API_URL || "";

async function api(path, options = {}) {
  const user = await cognitoGetUser();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${user.token}`,
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error || json.message || `API error ${res.status}`);
  }
  // Backend wraps responses: { success: true, data: {...} }
  return json.data !== undefined ? json.data : json;
}

// Dashboard
export const getDashboard = () => api("/dashboard");

// Jobs
export const getJobs = (status) => api(`/jobs${status ? `?status=${status}` : ""}`);
export const getJob = (id) => api(`/jobs/${id}`);
export const createJob = (data) => api("/jobs", { method: "POST", body: data });
export const updateJob = (id, data) => api(`/jobs/${id}`, { method: "PUT", body: data });
export const deleteJob = (id) => api(`/jobs/${id}`, { method: "DELETE" });

// Expenses
export const getExpenses = (jobId) => api(`/jobs/${jobId}/expenses`);
export const createExpense = (jobId, data) => api(`/jobs/${jobId}/expenses`, { method: "POST", body: data });
export const deleteExpense = (jobId, expenseId) => api(`/jobs/${jobId}/expenses/${expenseId}`, { method: "DELETE" });

// Invoices
export const createInvoice = (jobId, data) => api(`/jobs/${jobId}/invoices`, { method: "POST", body: data });
export const sendInvoice = (jobId, invoiceId) => api(`/jobs/${jobId}/invoices/${invoiceId}/send`, { method: "POST" });
export const markInvoicePaid = (jobId, invoiceId) => api(`/jobs/${jobId}/invoices/${invoiceId}/pay`, { method: "PUT" });

// Photos
export const getUploadUrl = (jobId, fileName, contentType) =>
  api("/photos/upload-url", { method: "POST", body: { jobId, fileName, contentType } });

// Public invoice (no auth)
export async function getPublicInvoice(invoiceId) {
  const res = await fetch(`${BASE}/invoices/${invoiceId}`);
  if (!res.ok) throw new Error("Invoice not found");
  return res.json();
}

// === PHASE 2: Crew & Scheduling ===

// Crew Members
export const getCrew = () => api("/crew");
export const getCrewMember = (id) => api(`/crew/${id}`);
export const createCrewMember = (data) => api("/crew", { method: "POST", body: data });
export const updateCrewMember = (id, data) => api(`/crew/${id}`, { method: "PUT", body: data });
export const deleteCrewMember = (id) => api(`/crew/${id}`, { method: "DELETE" });

// Assignments
export const getAssignments = (date) => api(`/assignments?date=${date}`);
export const createAssignment = (data) => api("/assignments", { method: "POST", body: data });
export const deleteAssignment = (date, memberId) => api(`/assignments?date=${date}&memberId=${memberId}`, { method: "DELETE" });
export const notifyCrew = (date) => api("/assignments/notify", { method: "POST", body: { date } });
export const getTracker = () => api("/assignments/tracker");
