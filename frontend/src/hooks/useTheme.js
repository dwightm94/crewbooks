"use client";
import { create } from "zustand";

export const useTheme = create((set) => ({
  dark: false,
  init: () => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem("crewbooks-theme");
    const isDark = saved === "dark";
    document.documentElement.classList.toggle("dark", isDark);
    set({ dark: isDark });
  },
  toggle: () => {
    set((state) => {
      const next = !state.dark;
      document.documentElement.classList.toggle("dark", next);
      localStorage.setItem("crewbooks-theme", next ? "dark" : "light");
      return { dark: next };
    });
  },
}));
