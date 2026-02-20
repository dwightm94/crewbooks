"use client";
import { create } from "zustand";
import { signIn, signUp, signOut, getSession, getCurrentUser, confirmSignUp } from "@/lib/auth";
export const useAuth = create((set) => ({
  user: null, session: null, loading: true, error: null,
  init: async () => {
    try { const s = await getSession(); if (s) { const u = await getCurrentUser(); set({ user: u, session: s, loading: false }); } else set({ user: null, session: null, loading: false }); }
    catch { set({ user: null, session: null, loading: false }); }
  },
  login: async (email, pw) => {
    set({ loading: true, error: null });
    try { const s = await signIn(email, pw); const u = await getCurrentUser(); set({ user: u, session: s, loading: false }); return true; }
    catch (e) { set({ loading: false, error: e.message }); return false; }
  },
  register: async ({ email, password, name, phone }) => {
    set({ loading: true, error: null });
    try { await signUp({ email, password, name, phone }); set({ loading: false }); return true; }
    catch (e) { set({ loading: false, error: e.message }); return false; }
  },
  confirm: async (email, code) => {
    set({ loading: true, error: null });
    try { await confirmSignUp(email, code); set({ loading: false }); return true; }
    catch (e) { set({ loading: false, error: e.message }); return false; }
  },
  logout: () => { signOut(); set({ user: null, session: null }); },
  clearError: () => set({ error: null }),
}));
