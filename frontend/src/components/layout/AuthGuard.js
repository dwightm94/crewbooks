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
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{backgroundColor: "var(--bg-primary)"}}>
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 border-4 rounded-full animate-spin" style={{borderColor: "var(--brand)", borderTopColor: "transparent"}} />
        <p style={{color: "var(--text-muted)"}} className="text-sm font-medium">Loading...</p>
      </div>
    </div>
  );
  if (PUBLIC.some(p => pathname.startsWith(p))) return <>{children}</>;
  if (!user) { if (typeof window !== "undefined") router.replace("/auth/login"); return null; }
  return <>{children}</>;
}
