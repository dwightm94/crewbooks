"use client";
import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";

const ADMIN_EMAILS = ["dwightm94@msn.com"];

const FREE_LIMITS = { jobs: 3, crew: 3, invoices: 3, storageMB: 500 };
const PRO_LIMITS = { jobs: Infinity, crew: Infinity, invoices: Infinity, storageMB: 5120 };

const FREE_FEATURES = {
  scheduling: true, estimates: true, dailyLogs: true,
  compliance: false, clientCRM: false, invoicePDF: false,
  reports: false, paymentReminders: false, onlinePayments: false,
  quickbooksSync: false, prioritySupport: false,
};

const PRO_FEATURES = {
  scheduling: true, estimates: true, dailyLogs: true,
  compliance: true, clientCRM: true, invoicePDF: true,
  reports: true, paymentReminders: true, onlinePayments: true,
  quickbooksSync: false, prioritySupport: true,
};

export function usePlan() {
  const { user } = useAuth();
  const email = user?.email || "";
  const isAdmin = ADMIN_EMAILS.includes(email.toLowerCase());
  const isPro = isAdmin;
  const isFree = !isPro;
  const limits = isPro ? PRO_LIMITS : FREE_LIMITS;
  const features = isPro ? PRO_FEATURES : FREE_FEATURES;
  const plan = { plan: isPro ? "pro" : "free", planName: isPro ? "Pro" : "Free", limits, features };
  const canDo = (feature) => {
    if (isPro) return { allowed: true };
    const allowed = FREE_FEATURES[feature] !== false;
    return { allowed, reason: allowed ? null : "Upgrade to Pro to unlock this feature" };
  };
  const refresh = () => {};
  return { plan, loading: false, isPro, isFree, canDo, limits, features, refresh, planName: plan.planName };
}
