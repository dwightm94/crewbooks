"use client";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
const PUBLIC = ["/auth/login", "/auth/signup", "/invoice"];
export function AuthGuard({ children }) {
  const { user, loading, init } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  useEffect(() => { init(); }, [init]);
  if (loading) return <div className="min-h-screen bg-navy-900 flex items-center justify-center"><div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (PUBLIC.some(p => pathname.startsWith(p))) return <>{children}</>;
  if (!user) { if (typeof window !== "undefined") router.replace("/auth/login"); return null; }
  return <>{children}</>;
}
