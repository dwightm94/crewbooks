"use client";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
export function PageHeader({ title, subtitle, backHref, action }) {
  const router = useRouter();
  return (
    <header className="sticky top-0 bg-navy-900/95 backdrop-blur-sm z-40 px-4 py-3">
      <div className="flex items-center justify-between max-w-lg mx-auto">
        <div className="flex items-center gap-3">
          {backHref && <button onClick={() => router.push(backHref)} className="p-1 -ml-1 text-navy-300"><ChevronLeft size={28} /></button>}
          <div><h1 className="text-xl font-bold text-white">{title}</h1>{subtitle && <p className="text-sm text-navy-400">{subtitle}</p>}</div>
        </div>
        {action && <div>{action}</div>}
      </div>
    </header>
  );
}
