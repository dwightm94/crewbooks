"use client";
import { create } from "zustand";
import { cognitoSignUp, cognitoConfirm, cognitoLogin, cognitoLogout, cognitoGetUser, cognitoForgotPassword, cognitoConfirmPassword, cognitoResendCode } from "@/lib/auth";

export const useAuth = create((set) => ({
  user: null, loading: true, error: null,
  clearError: () => set({ error: null }),
  init: async () => {
    try { const u = await cognitoGetUser(); set({ user: u, loading: false }); }
    catch { set({ user: null, loading: false }); }
  },
  register: async ({ email, password, name }) => {
    set({ loading: true, error: null });
    try { await cognitoSignUp(email, password, name); set({ loading: false }); return true; }
    catch (e) { set({ error: e.message, loading: false }); return false; }
  },
  confirm: async (email, code) => {
    set({ loading: true, error: null });
    try { await cognitoConfirm(email, code); set({ loading: false }); return true; }
    catch (e) { set({ error: e.message, loading: false }); return false; }
  },
  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      await cognitoLogin(email, password);
      const u = await cognitoGetUser();
      set({ user: u, loading: false }); return true;
    } catch (e) { set({ error: e.message, loading: false }); return false; }
  },
  logout: () => { cognitoLogout(); set({ user: null }); },
  forgotPassword: async (email) => {
    set({ loading: true, error: null });
    try { await cognitoForgotPassword(email); set({ loading: false }); return true; }
    catch (e) { set({ error: e.message, loading: false }); return false; }
  },
  resetPassword: async (email, code, password) => {
    set({ loading: true, error: null });
    try { await cognitoConfirmPassword(email, code, password); set({ loading: false }); return true; }
    catch (e) { set({ error: e.message, loading: false }); return false; }
  },
  resendCode: async (email) => {
    try { await cognitoResendCode(email); return true; } catch { return false; }
  },
}));
