"use client";
import { useState, useEffect } from "react";

const DEFAULT = { plan: "free", planName: "Free", usage: {}, features: {}, limits: {} };

export function usePlan() {
  const [plan, setPlan] = useState(DEFAULT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const stored = localStorage.getItem("crewbooks_tokens");
        if (!stored) { setLoading(false); return; }
        const tokens = JSON.parse(stored);
        const token = tokens?.idToken || tokens?.IdToken || tokens?.token;
        if (!token) { setLoading(false); return; }
        const BASE = process.env.NEXT_PUBLIC_API_URL || "";
        const res = await fetch(BASE + "/subscription/status", {
          headers: { Authorization: "Bearer " + token },
        });
        const json = await res.json();
        if (json.data) setPlan(json.data);
      } catch {}
      setLoading(false);
    };
    fetchPlan();
  }, []);

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

  const refresh = () => window.location.reload();

  return { plan, loading, isPro, isFree, canDo, refresh };
}
