"use client";
import { PlanProvider } from "@/hooks/usePlan";

export function Providers({ children }) {
  return (
    <PlanProvider>
      {children}
    </PlanProvider>
  );
}
