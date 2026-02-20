"use client";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
export function PageHeader({ title, subtitle, backHref, action }) {
  const router = useRouter();
  return (
    <header className="sticky top-0 z-40 px-4 py-3 backdrop-blur-md" style={{backgroundColor: "color-mix(in srgb, var(--bg-primary) 85%, transparent)"}}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {backHref && <button onClick={() => router.push(backHref)} className="p-1 -ml-2 rounded-xl active:scale-95 transition-transform" style={{color: "var(--text-secondary)"}}><ChevronLeft size={28} /></button>}
          <div>
            <h1 className="text-xl font-bold" style={{color: "var(--text-primary)"}}>{title}</h1>
            {subtitle && <p className="text-sm" style={{color: "var(--text-secondary)"}}>{subtitle}</p>}
          </div>
        </div>
        {action && <div>{action}</div>}
      </div>
    </header>
  );
}
