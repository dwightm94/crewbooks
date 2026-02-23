"use client";
import { useState } from "react";
const DEFAULT = { plan: "free", planName: "Free", usage: {}, features: {}, limits: {} };
export function usePlan() {
  const [plan] = useState(DEFAULT);
  const isPro = false;
  const isFree = true;
  const canDo = () => ({ allowed: true });
  const refresh = () => {};
  return { plan, loading: false, isPro, isFree, canDo, refresh };
}
