"use client";
import { useEffect } from "react";
import { useTheme } from "@/hooks/useTheme";
export function ThemeInit() {
  const init = useTheme((s) => s.init);
  useEffect(() => { init(); }, [init]);
  return null;
}
