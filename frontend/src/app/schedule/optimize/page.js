"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { getAssignments, getJobs } from "@/lib/api";
import { Navigation, MapPin, Clock, RotateCcw, CheckCircle2, AlertCircle, Loader2, ExternalLink } from "lucide-react";

const toKey = (d) => d.toISOString().split("T")[0];
const fmt = (d, opts) => new Intl.DateTimeFormat("en-US", opts).format(d);

export default function OptimizeRoutePage() {
  const router = useRouter();
  const params = useSearchParams();
  const { user } = useAuth();
  const [stops, setStops] = useState([]);
  const [optimizedStops, setOptimizedStops] = useState(null);
  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);
  const [error, setError] = useState(null);
  const [totalTime, setTotalTime] = useState(null);
  const [totalDist, setTotalDist] = useState(null);
  const [savings, setSavings] = useState(null);

  const dateStr = params.get("date") || toKey(new Date());
  const dateObj = new Date(dateStr + "T00:00:00");

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      try {
        const [assignments, allJobs] = await Promise.all([getAssignments(dateStr), getJobs()]);
        const jobMap = {};
        (allJobs || []).forEach((j) => (jobMap[j.id || j.jobId] = j));
        const mapped = (assignments || []).map((a) => {
          const job = jobMap[a.jobId] || {};
          return { id: a.id || a.assignmentId || a.jobId, jobId: a.jobId, title: job.title || job.name || "Untitled", address: job.address || job.location || "", clientName: job.clientName || "", status: job.status || "scheduled" };
        }).filter((s) => s.address);
        setStops(mapped);
      } catch (err) { setError("Failed to load assignments."); }
      finally { setLoading(false); }
    };
    load();
  }, [user, dateStr]);

  const handleOptimize = useCallback(async () => {
    if (stops.length < 2) return;
    setOptimizing(true); setError(null);
    try {
      const BASE = process.env.NEXT_PUBLIC_API_URL || "";
      const stored = localStorage.getItem("crewbooks_tokens");
      const tokens = stored ? JSON.parse(stored) : {};
      const token = tokens?.idToken || tokens?.IdToken || tokens?.token;
      const res = await fetch(BASE + "/route/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({ stops: stops.map((s) => ({ address: s.address, id: s.id })), date: dateStr }),
      });
      if (!res.ok) throw new Error("Optimization failed");
      const data = await res.json();
      if (data.data?.optimizedOrder) {
        const reordered = data.data.optimizedOrder.map((id) => stops.find((s) => s.id === id)).filter(Boolean);
        setOptimizedStops(reordered);
        setTotalTime(data.data.totalDuration || null);
        setTotalDist(data.data.totalDistance || null);
        setSavings(data.data.timeSaved || null);
      }
    } catch (err) {
      setError("Route optimization failed. Showing current order.");
      setOptimizedStops(stops);
    } finally { setOptimizing(false); }
  }, [stops, dateStr]);

  const openInGoogleMaps = () => {
    const list = optimizedStops || stops;
    if (!list.length) return;
    const origin = encodeURIComponent(list[0].address);
    const dest = encodeURIComponent(list[list.length - 1].address);
    const waypoints = list.slice(1, -1).map((s) => encodeURIComponent(s.address)).join("|");
    window.open(`https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}${waypoints ? "&waypoints=" + waypoints : ""}&travelmode=driving`, "_blank");
  };

  if (!user) return null;

  return (
    <AppShell title="Optimize My Day" subtitle={fmt(dateObj, { weekday: "long", month: "short", day: "numeric" })} back="/schedule">
      <div className="py-4 space-y-4">
        {optimizedStops && (totalTime || totalDist) && (
          <div className="flex items-center justify-between p-4 rounded-2xl" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center gap-4">
              {totalTime && <div className="text-center"><p className="text-lg font-bold" style={{ color: "var(--text)" }}>{totalTime}</p><p className="text-[10px] font-semibold uppercase" style={{ color: "var(--text3)" }}>Drive Time</p></div>}
              {totalDist && <div className="text-center"><p className="text-lg font-bold" style={{ color: "var(--text)" }}>{totalDist}</p><p className="text-[10px] font-semibold uppercase" style={{ color: "var(--text3)" }}>Distance</p></div>}
            </div>
            {savings && <div className="text-right"><p className="text-lg font-bold" style={{ color: "#16A34A" }}>-{savings}</p><p className="text-[10px] font-semibold uppercase" style={{ color: "#16A34A" }}>Saved</p></div>}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 size={28} className="animate-spin" style={{ color: "var(--brand)" }} />
            <p className="text-sm" style={{ color: "var(--text2)" }}>Loading today's jobs…</p>
          </div>
        ) : stops.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "var(--bg2)" }}><Navigation size={24} style={{ color: "var(--text3)" }} /></div>
            <p className="font-semibold" style={{ color: "var(--text)" }}>No stops with addresses</p>
            <p className="text-sm" style={{ color: "var(--text3)" }}>Add addresses to your jobs to optimize your route.</p>
          </div>
        ) : (
          <>
            {error && <div className="flex items-center gap-2 p-3 rounded-xl text-sm" style={{ background: "#FEF3C7", color: "#92400E" }}><AlertCircle size={16} /><span>{error}</span></div>}
            <div className="space-y-1">
              {(optimizedStops || stops).map((stop, i) => (
                <div key={stop.id} className="flex items-stretch gap-3">
                  <div className="flex flex-col items-center" style={{ width: 28 }}>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: optimizedStops ? "var(--brand)" : "var(--bg2)", color: optimizedStops ? "#FFF" : "var(--text2)" }}>{i + 1}</div>
                    {i < (optimizedStops || stops).length - 1 && <div className="flex-1 w-0.5 my-1" style={{ background: "var(--border)" }} />}
                  </div>
                  <button onClick={() => stop.jobId && router.push(`/jobs/${stop.jobId}`)} className="flex-1 text-left p-3 rounded-xl mb-1 active:scale-[0.99] transition-transform" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                    <p className="text-sm font-bold" style={{ color: "var(--text)" }}>{stop.title}</p>
                    {stop.clientName && <p className="text-xs mt-0.5" style={{ color: "var(--text2)" }}>{stop.clientName}</p>}
                    <div className="flex items-center gap-1 mt-1"><MapPin size={12} style={{ color: "var(--text3)" }} /><p className="text-xs truncate" style={{ color: "var(--text3)" }}>{stop.address}</p></div>
                  </button>
                </div>
              ))}
            </div>

            <div className="space-y-3 pt-2">
              {!optimizedStops ? (
                <button onClick={handleOptimize} disabled={optimizing || stops.length < 2}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold active:scale-[0.98]"
                  style={{ background: "var(--brand)", color: "#FFF", opacity: optimizing || stops.length < 2 ? 0.5 : 1 }}>
                  {optimizing ? <Loader2 size={18} className="animate-spin" /> : <Navigation size={18} />}
                  {optimizing ? "Optimizing…" : stops.length < 2 ? "Need at least 2 stops" : "Optimize Route"}
                </button>
              ) : (
                <>
                  <button onClick={openInGoogleMaps} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold active:scale-[0.98]" style={{ background: "var(--brand)", color: "#FFF" }}>
                    <ExternalLink size={18} /> Open in Google Maps
                  </button>
                  <button onClick={() => { setOptimizedStops(null); setTotalTime(null); setTotalDist(null); setSavings(null); }}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold active:scale-[0.98]" style={{ background: "var(--bg2)", color: "var(--text)" }}>
                    <RotateCcw size={16} /> Reset Order
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
