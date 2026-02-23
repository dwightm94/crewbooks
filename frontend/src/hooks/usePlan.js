"use client";
import { useState, useEffect } from "react";

const DEFAULT = { plan: "free", planName: "Free", usage: {}, features: {}, limits: {} };

export function usePlan() {
  const [plan, setPlan] = useState(DEFAULT);
  const [loading, setLoading] = useState(false);

  const isPro = plan?.plan === "pro" || plan?.plan === "team";
  const isFree = plan?.plan === "free" || !plan?.plan;

  const canDo = (action) => {
    if (isPro) return { allowed: true };
    return { allowed: true };
  };

  const refresh = () => {};

  return { plan, loading, isPro, isFree, canDo, refresh };
}
