"use client";
import { useEffect, useState } from "react";
import { Bell } from "lucide-react";

export function NotifBell() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const check = async () => {
      try {
        const stored = localStorage.getItem("crewbooks_tokens");
        if (!stored) return;
        const tokens = JSON.parse(stored);
        const token = tokens?.idToken || tokens?.IdToken || tokens?.token;
        if (!token) return;
        const BASE = process.env.NEXT_PUBLIC_API_URL || "";
        const res = await fetch(BASE + "/notifications", {
          headers: { Authorization: "Bearer " + token },
        });
        const json = await res.json();
        setCount(json.data?.unreadCount || 0);
      } catch { setCount(0); }
    };
    check();
    const interval = setInterval(check, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <button onClick={() => window.location.href = "/notifications"} className="relative p-2 rounded-xl" style={{ color: "var(--text2)" }}>
      <Bell size={22} />
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-bold text-white px-1"
          style={{ background: "#EF4444" }}>
          {count > 9 ? "9+" : count}
        </span>
      )}
    </button>
  );
}
