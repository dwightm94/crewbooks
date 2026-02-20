"use client";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Hammer, DollarSign, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
const tabs = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/jobs", label: "Jobs", icon: Hammer },
  { href: "/money", label: "Money", icon: DollarSign },
  { href: "/settings", label: "Settings", icon: Settings },
];
export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  if (!user || pathname.startsWith("/auth")) return null;
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-navy-800 border-t border-navy-700 z-50" style={{paddingBottom:"max(0.5rem, env(safe-area-inset-bottom))"}}>
      <div className="flex justify-around items-center max-w-lg mx-auto">
        {tabs.map(tab => {
          const active = pathname.startsWith(tab.href);
          const Icon = tab.icon;
          return (
            <button key={tab.href} onClick={() => router.push(tab.href)} className={cn("nav-tab flex-1", active && "nav-tab-active")}>
              <Icon size={24} strokeWidth={active ? 2.5 : 1.5} />
              <span className="text-xs mt-1 font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
