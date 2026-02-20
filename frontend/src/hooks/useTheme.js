"use client";
import { create } from "zustand";
export const useTheme = create((set) => ({
  dark: false,
  init: () => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem("cb-theme");
    const isDark = saved === "dark";
    document.documentElement.classList.toggle("dark", isDark);
    set({ dark: isDark });
  },
  toggle: () => set((s) => {
    const next = !s.dark;
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("cb-theme", next ? "dark" : "light");
    return { dark: next };
  }),
}));
