"use client";
import { create } from "zustand";
import * as api from "@/lib/api";
export const useJobs = create((set, get) => ({
  jobs: [], currentJob: null, expenses: null, loading: false, error: null,
  fetchJobs: async (status) => { set({ loading: true }); try { const jobs = await api.getJobs(status); set({ jobs, loading: false }); } catch (e) { set({ error: e.message, loading: false }); } },
  fetchJob: async (id) => { set({ loading: true }); try { const job = await api.getJob(id); set({ currentJob: job, loading: false }); return job; } catch (e) { set({ error: e.message, loading: false }); return null; } },
  createJob: async (data) => { set({ loading: true }); try { const job = await api.createJob(data); set(s => ({ jobs: [job, ...s.jobs], loading: false })); return job; } catch (e) { set({ error: e.message, loading: false }); return null; } },
  updateJob: async (id, data) => { set({ loading: true }); try { const u = await api.updateJob(id, data); set(s => ({ jobs: s.jobs.map(j => j.jobId === id ? u : j), currentJob: s.currentJob?.jobId === id ? u : s.currentJob, loading: false })); return u; } catch (e) { set({ error: e.message, loading: false }); return null; } },
  deleteJob: async (id) => { try { await api.deleteJob(id); set(s => ({ jobs: s.jobs.filter(j => j.jobId !== id) })); return true; } catch (e) { set({ error: e.message }); return false; } },
  fetchExpenses: async (id) => { try { const d = await api.getExpenses(id); set({ expenses: d }); return d; } catch (e) { set({ error: e.message }); return null; } },
  addExpense: async (id, data) => { try { await api.createExpense(id, data); get().fetchExpenses(id); } catch (e) { set({ error: e.message }); } },
  removeExpense: async (jId, eId) => { try { await api.deleteExpense(jId, eId); get().fetchExpenses(jId); } catch (e) { set({ error: e.message }); } },
  clearError: () => set({ error: null }),
}));
