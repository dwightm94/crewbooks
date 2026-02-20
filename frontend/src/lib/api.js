import { getToken } from "./auth";

const API = process.env.NEXT_PUBLIC_API_URL;

async function request(path, opts = {}) {
  const token = await getToken();
  if (!token && !opts.public) throw new Error("Not authenticated");
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", ...(token && { Authorization: token }), ...opts.headers },
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || `Request failed: ${res.status}`);
  return data.data;
}

// Dashboard
export const getDashboard = () => request("/dashboard");

// Jobs
export const getJobs = (status) => request(`/jobs${status ? `?status=${status}` : ""}`);
export const getJob = (jobId) => request(`/jobs/${jobId}`);
export const createJob = (data) => request("/jobs", { method: "POST", body: JSON.stringify(data) });
export const updateJob = (jobId, data) => request(`/jobs/${jobId}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteJob = (jobId) => request(`/jobs/${jobId}`, { method: "DELETE" });

// Expenses
export const getExpenses = (jobId) => request(`/jobs/${jobId}/expenses`);
export const createExpense = (jobId, data) => request(`/jobs/${jobId}/expenses`, { method: "POST", body: JSON.stringify(data) });
export const deleteExpense = (jobId, expenseId) => request(`/jobs/${jobId}/expenses/${expenseId}`, { method: "DELETE" });

// Invoices
export const createInvoice = (jobId, data = {}) => request(`/jobs/${jobId}/invoices`, { method: "POST", body: JSON.stringify(data) });
export const sendInvoice = (jobId, invoiceId) => request(`/jobs/${jobId}/invoices/${invoiceId}/send`, { method: "POST" });
export const markInvoicePaid = (jobId, invoiceId) => request(`/jobs/${jobId}/invoices/${invoiceId}/pay`, { method: "PUT" });

// Photos
export const getUploadUrl = (data) => request("/photos/upload-url", { method: "POST", body: JSON.stringify(data) });
export const uploadFile = async (file, jobId) => {
  const { uploadUrl, key, fileUrl } = await getUploadUrl({ jobId, contentType: file.type });
  await fetch(uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
  return { key, fileUrl };
};
