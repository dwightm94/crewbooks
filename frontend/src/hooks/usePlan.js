"use client";
import { useState, useEffect, useCallback } from "react";

const DEFAULT = { plan: "free", planName: "Free", usage: {}, features: {}, limits: {} };

export function usePlan() {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const tokens = typeof window !== "undefined" ? localStorage.getItem("crewbooks_tokens") : null;
      if (!tokens) { setPlan(DEFAULT); setLoading(false); return; }
      const { cognitoGetUser } = await import("@/lib/auth");
      const user = await cognitoGetUser();
      if (!user?.token) { setPlan(DEFAULT); setLoading(false); return; }
      const BASE = process.env.NEXT_PUBLIC_API_URL || "";
      const res = await fetch(BASE + "/subscription/status", {
        headers: { Authorization: "Bearer " + user.token },
      });
      const json = await res.json();
      setPlan(json.data || DEFAULT);
    } catch { setPlan(DEFAULT); }
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const isPro = plan?.plan === "pro" || plan?.plan === "team";
  const isFree = plan?.plan === "free" || !plan?.plan;

  const canDo = (action) => {
    if (isPro) return { allowed: true };
    const limits = plan?.limits || {};
    const usage = plan?.usage || {};
    if (action === "create_job") {
      const max = limits.maxActiveJobs || 3;
      const current = usage.activeJobs || 0;
      if (current >= max) return { allowed: false, message: "Free plan allows " + max + " active jobs. Upgrade to Pro for unlimited." };
    }
    if (action === "create_invoice") {
      const max = limits.maxInvoicesPerMonth || 3;
      const current = usage.monthlyInvoices || 0;
      if (current >= max) return { allowed: false, message: "Free plan allows " + max + " invoices/month. Upgrade to Pro for unlimited." };
    }
    if (action === "online_payment") {
      if (!limits.onlinePayments) return { allowed: false, message: "Online payments require Pro plan." };
    }
    if (action === "full_reports") {
      if (!limits.fullReports) return { allowed: false, message: "Full reports require Pro plan." };
    }
    if (action === "payment_reminders") {
      if (!limits.paymentReminders) return { allowed: false, message: "Payment reminders require Pro plan." };
    }
    return { allowed: true };
  };

  return { plan, loading, isPro, isFree, canDo, refresh };
}
