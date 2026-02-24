"use client";
import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";

const ADMIN_EMAILS = ["dwightm94@msn.com"];
const DEFAULT = { plan: "free", planName: "Free", usage: {}, features: {}, limits: {} };
const PRO = { plan: "pro", planName: "Pro", usage: {}, features: {}, limits: {} };

export function usePlan() {
  const { user } = useAuth();
  const email = user?.email || "";
  const isAdmin = ADMIN_EMAILS.includes(email.toLowerCase());
  const isPro = isAdmin;
  const isFree = !isPro;
  const plan = isPro ? PRO : DEFAULT;
  const canDo = () => ({ allowed: true });
  const refresh = () => {};
  return { plan, loading: false, isPro, isFree, canDo, refresh, planName: plan.planName };
}
