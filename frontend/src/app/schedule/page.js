"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { getAssignments, getCrew, getJobs } from "@/lib/api";
import {
  Calendar, ChevronLeft, ChevronRight, MapPin, Users, Navigation,
  List, Clock, Phone, MessageSquare, ExternalLink, Briefcase
} from "lucide-react";

/* ── helpers ──────────────────────────────────────────────────────── */
const DAY_MS = 86400000;
const safeFmt = (d, opts) => {
  try { return new Intl.DateTimeFormat("en-US", opts).format(d); }
  catch { return ""; }
};
const safeKey = (d) => {
  try { return d.toISOString().split("T")[0]; }
  catch { return "1970-01-01"; }
};
const isSameDay = (a, b) => {
  try { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }
  catch { return false; }
};
const isValidDate = (d) => d instanceof Date && !isNaN(d.getTime());
const getWeekDays = (anchor) => {
  const s = new Date(anchor); s.setDate(s.getDate() - s.getDay());
  return Array.from({ length: 7 }, (_, i) => new Date(+s + i * DAY_MS));
};
const getMonthDays = (y, m) => {
  const f = new Date(y, m, 1), l = new Date(y, m + 1, 0), days = [];
  for (let i = f.getDay() - 1; i >= 0; i--) days.push({ date: new Date(y, m, -i), out: true });
  for (let d = 1; d <= l.getDate(); d++) days.push({ date: new Date(y, m, d), out: false });
  const r = 7 - (days.length % 7); if (r < 7) for (let i = 1; i <= r; i++) days.push({ date: new Date(y, m + 1, i), out: true });
  return days;
};

/* ── time grid hours (Jobber-style) ───────────────────────────────── */
const HOURS = Array.from({ length: 14 }, (_, i) => i + 6); // 6am–7pm

/* ── status config ────────────────────────────────────────────────── */
const STATUS = {
  scheduled: { bg: "#EEF2FF", fg: "#4F46E5", label: "Scheduled" },
  in_progress: { bg: "#FFF7ED", fg: "#EA580C", label: "In Progress" },
  active: { bg: "#FFF7ED", fg: "#EA580C", label: "Active" },
  bidding: { bg: "#FFFBEB", fg: "#D97706", label: "Bidding" },
  completed: { bg: "#F0FDF4", fg: "#16A34A", label: "Complete" },
  complete: { bg: "#F0FDF4", fg: "#16A34A", label: "Complete" },
  paid: { bg: "#ECFDF5", fg: "#059669", label: "Paid" },
  invoiced: { bg: "#EFF6FF", fg: "#2563EB", label: "Invoiced" },
};
const st = (s) => STATUS[s?.toLowerCase()] || { bg: "#F3F4F6", fg: "#6B7280", label: s || "Open" };

/* ══════════════════════════════════════════════════════════════════ */
/*  JOB CARD — Jobber-style with accent bar + tap to navigate       */
/* ══════════════════════════════════════════════════════════════════ */
function JobCard({ assignment, job, crewMap, onClick, compact }) {
  const s = st(job?.status || assignment?.status);
  const crew = (assignment?.crewIds || assignment?.memberIds || [])
    .map((id) => crewMap[id]?.name).filter(Boolean).join(", ");
  const memberName = assignment?.memberName || (assignment?.memberId && crewMap[assignment.memberId]?.name);
  const displayCrew = crew || memberName || "";
  const time = assignment?.startTime ? safeFmt(new Date(assignment.startTime), { hour: "numeric", minute: "2-digit" }) : null;
  const title = job?.title || job?.name || assignment?.jobTitle || assignment?.title || "Untitled Job";
  const addr = job?.address || job?.location || "";

  return (
    <button onClick={onClick} className="w-full text-left group" style={{ display: "flex", borderRadius: 14, overflow: "hidden", background: "var(--card)", border: "1px solid var(--border)", transition: "box-shadow .15s, transform .1s" }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,.07)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; }}>
      {/* accent */}
      <div style={{ width: 5, flexShrink: 0, background: s.fg }} />
      <div style={{ flex: 1, padding: compact ? "10px 14px" : "14px 18px" }}>
        {/* top row */}
        <div className="flex items-center justify-between mb-1">
          {time && <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: "var(--text2)" }}><Clock size={12} />{time}</span>}
          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ml-auto" style={{ background: s.bg, color: s.fg }}>{s.label}</span>
        </div>
        {/* title */}
        <p className={`font-bold leading-tight ${compact ? "text-sm" : "text-[15px]"}`} style={{ color: "var(--text)" }}>{title}</p>
        {/* client */}
        {job?.clientName && <p className="text-xs mt-0.5" style={{ color: "var(--text2)" }}>{job.clientName}</p>}
        {/* address */}
        {addr && (
          <div className="flex items-center gap-1 mt-1.5">
            <MapPin size={12} style={{ color: "var(--text3)", flexShrink: 0 }} />
            <p className="text-xs truncate" style={{ color: "var(--text3)" }}>{addr}</p>
          </div>
        )}
        {/* crew */}
        {displayCrew && (
          <div className="flex items-center gap-1 mt-1">
            <Users size={12} style={{ color: "var(--text3)", flexShrink: 0 }} />
            <p className="text-xs" style={{ color: "var(--text3)" }}>{displayCrew}</p>
          </div>
        )}
      </div>
      <div className="flex items-center pr-3" style={{ color: "var(--text3)" }}>
        <ChevronRight size={18} className="opacity-40 group-hover:opacity-100 transition-opacity" />
      </div>
    </button>
  );
}

/* ══════════════════════════════════════════════════════════════════ */
/*  DESKTOP: DAY VIEW — Jobber-style time grid                      */
/* ══════════════════════════════════════════════════════════════════ */
function DayTimeGrid({ assignments, jobMap, crewMap, onCardClick }) {
  // place assignments into hour slots
  const slots = useMemo(() => {
    const m = {};
    HOURS.forEach(h => (m[h] = []));
    const unscheduled = [];
    (assignments || []).forEach(a => {
      if (a.startTime) {
        const d = new Date(a.startTime);
        if (isValidDate(d)) { const h = d.getHours(); if (m[h]) m[h].push(a); else if (h < 6) { if (!m[6]) m[6] = []; m[6].push(a); } else unscheduled.push(a); return; }
      }
      unscheduled.push(a);
    });
    return { hourly: m, unscheduled };
  }, [assignments]);

  return (
    <div>
      {/* Unscheduled */}
      {slots.unscheduled.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-bold uppercase tracking-wider mb-2 px-1" style={{ color: "var(--text3)" }}>Unscheduled</p>
          <div className="space-y-2">
            {slots.unscheduled.map((a, i) => (
              <JobCard key={a.id || a.assignmentId || i} assignment={a} job={jobMap[a.jobId] || {}} crewMap={crewMap} onClick={() => onCardClick(a)} compact />
            ))}
          </div>
        </div>
      )}
      {/* Time grid */}
      <div className="relative">
        {HOURS.map(h => {
          const items = slots.hourly[h] || [];
          const label = safeFmt(new Date(2020, 0, 1, h), { hour: "numeric" });
          return (
            <div key={h} className="flex" style={{ minHeight: items.length > 0 ? "auto" : 48, borderTop: "1px solid var(--border)" }}>
              <div className="flex-shrink-0 pr-3 pt-1.5 text-right" style={{ width: 56 }}>
                <span className="text-[11px] font-semibold" style={{ color: "var(--text3)" }}>{label}</span>
              </div>
              <div className="flex-1 py-1.5 space-y-1.5">
                {items.map((a, i) => (
                  <JobCard key={a.id || a.assignmentId || i} assignment={a} job={jobMap[a.jobId] || {}} crewMap={crewMap} onClick={() => onCardClick(a)} compact />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════ */
/*  LIST VIEW — Jobber-style chronological cards grouped by date    */
/* ══════════════════════════════════════════════════════════════════ */
function ListView({ assignmentsByDate, jobMap, crewMap, startDate, onCardClick }) {
  const today = new Date();
  const groups = useMemo(() => {
    const g = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date(+startDate + i * DAY_MS);
      const key = safeKey(d);
      const items = assignmentsByDate[key] || [];
      g.push({ date: d, key, items: [...items].sort((a, b) => {
        const tA = a.startTime ? new Date(a.startTime).getTime() : Infinity;
        const tB = b.startTime ? new Date(b.startTime).getTime() : Infinity;
        return tA - tB;
      })});
    }
    return g;
  }, [assignmentsByDate, startDate]);

  const totalJobs = groups.reduce((s, g) => s + g.items.length, 0);

  return (
    <div>
      <p className="text-xs font-semibold mb-3 px-1" style={{ color: "var(--text3)" }}>
        {totalJobs} job{totalJobs !== 1 ? "s" : ""} over next 14 days
      </p>
      <div className="space-y-5">
        {groups.map(g => {
          const isToday = isSameDay(g.date, today);
          const isPast = g.date < today && !isToday;
          return (
            <div key={g.key}>
              {/* date header */}
              <div className="flex items-center gap-3 mb-2 px-1">
                <div className={`flex items-center gap-2 ${isToday ? "font-bold" : ""}`} style={{ color: isToday ? "var(--brand)" : isPast ? "var(--text3)" : "var(--text)" }}>
                  {isToday && <div className="w-2 h-2 rounded-full" style={{ background: "var(--brand)" }} />}
                  <span className="text-sm">{isToday ? "Today" : safeFmt(g.date, { weekday: "short", month: "short", day: "numeric" })}</span>
                </div>
                <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
                <span className="text-[11px] font-semibold" style={{ color: "var(--text3)" }}>
                  {g.items.length > 0 ? `${g.items.length} job${g.items.length !== 1 ? "s" : ""}` : "—"}
                </span>
              </div>
              {/* cards */}
              {g.items.length > 0 ? (
                <div className="space-y-2">
                  {g.items.map((a, i) => (
                    <JobCard key={a.id || a.assignmentId || i} assignment={a} job={jobMap[a.jobId] || {}} crewMap={crewMap} onClick={() => onCardClick(a)} />
                  ))}
                </div>
              ) : (
                <div className="py-2 px-3 rounded-xl text-xs" style={{ color: "var(--text3)", background: "var(--bg2)", opacity: isPast ? 0.5 : 0.8 }}>
                  No jobs scheduled
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════ */
/*  MOBILE WEEK STRIP                                               */
/* ══════════════════════════════════════════════════════════════════ */
function WeekStrip({ selectedDate, onSelect, dateCounts }) {
  const week = useMemo(() => getWeekDays(selectedDate), [selectedDate]);
  const today = new Date();
  const shift = (n) => { const d = new Date(selectedDate); d.setDate(d.getDate() + n); onSelect(d); };

  return (
    <div className="px-1">
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => shift(-7)} className="p-1.5 rounded-lg active:scale-90" style={{ color: "var(--text2)" }}><ChevronLeft size={20} /></button>
        <span className="text-sm font-bold" style={{ color: "var(--text)" }}>{safeFmt(selectedDate, { month: "long", year: "numeric" })}</span>
        <button onClick={() => shift(7)} className="p-1.5 rounded-lg active:scale-90" style={{ color: "var(--text2)" }}><ChevronRight size={20} /></button>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {week.map(day => {
          const key = safeKey(day);
          const sel = isSameDay(day, selectedDate);
          const td = isSameDay(day, today);
          const cnt = dateCounts[key] || 0;
          return (
            <button key={key} onClick={() => onSelect(new Date(day))}
              className="flex flex-col items-center py-2 rounded-xl transition-colors active:scale-95"
              style={{ background: sel ? "var(--brand)" : td ? "var(--bg2)" : "transparent" }}>
              <span className="text-[10px] font-bold uppercase" style={{ color: sel ? "rgba(255,255,255,.7)" : "var(--text3)" }}>{safeFmt(day, { weekday: "narrow" })}</span>
              <span className="text-lg font-bold leading-none mt-0.5" style={{ color: sel ? "#FFF" : td ? "var(--text)" : "var(--text2)" }}>{day.getDate()}</span>
              <div className="mt-1 w-1.5 h-1.5 rounded-full" style={{ background: cnt > 0 ? (sel ? "rgba(255,255,255,.8)" : "var(--brand)") : "transparent" }} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════ */
/*  DESKTOP MONTH CALENDAR                                          */
/* ══════════════════════════════════════════════════════════════════ */
function MonthCal({ selectedDate, onSelect, dateCounts }) {
  const [vm, setVm] = useState(selectedDate.getMonth());
  const [vy, setVy] = useState(selectedDate.getFullYear());
  const today = new Date();
  useEffect(() => { setVm(selectedDate.getMonth()); setVy(selectedDate.getFullYear()); }, [selectedDate]);
  const days = useMemo(() => getMonthDays(vy, vm), [vy, vm]);
  const prev = () => { if (vm === 0) { setVm(11); setVy(vy - 1); } else setVm(vm - 1); };
  const next = () => { if (vm === 11) { setVm(0); setVy(vy + 1); } else setVm(vm + 1); };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button onClick={prev} className="p-1.5 rounded-lg hover:bg-black/5" style={{ color: "var(--text2)" }}><ChevronLeft size={18} /></button>
        <span className="text-sm font-bold" style={{ color: "var(--text)" }}>{safeFmt(new Date(vy, vm), { month: "long", year: "numeric" })}</span>
        <button onClick={next} className="p-1.5 rounded-lg hover:bg-black/5" style={{ color: "var(--text2)" }}><ChevronRight size={18} /></button>
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center">
        {["S","M","T","W","T","F","S"].map((d, i) => (
          <div key={i} className="text-[10px] font-bold uppercase py-1.5" style={{ color: "var(--text3)" }}>{d}</div>
        ))}
        {days.map(({ date, out }, i) => {
          const key = safeKey(date);
          const sel = isSameDay(date, selectedDate);
          const td = isSameDay(date, today);
          const cnt = dateCounts[key] || 0;
          return (
            <button key={i} onClick={() => onSelect(new Date(date))}
              className="flex flex-col items-center py-1.5 rounded-lg transition-colors hover:bg-black/5"
              style={{ opacity: out ? 0.25 : 1, background: sel ? "var(--brand)" : td ? "var(--bg2)" : "transparent" }}>
              <span className="text-xs font-semibold" style={{ color: sel ? "#FFF" : "var(--text)" }}>{date.getDate()}</span>
              {cnt > 0 && <div className="flex gap-0.5 mt-0.5">
                {Array.from({ length: Math.min(cnt, 3) }).map((_, j) => (
                  <div key={j} className="w-1 h-1 rounded-full" style={{ background: sel ? "rgba(255,255,255,.8)" : "var(--brand)" }} />
                ))}
              </div>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════ */
/*  MAIN SCHEDULE PAGE                                              */
/* ══════════════════════════════════════════════════════════════════ */
export default function SchedulePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [assignmentsByDate, setAssignmentsByDate] = useState({});
  const [crew, setCrew] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState("day"); // "day" | "list"
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check(); window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // fetch crew + jobs once
  useEffect(() => {
    if (!user) return;
    Promise.all([getCrew(), getJobs()])
      .then(([c, j]) => {
        setCrew(Array.isArray(c) ? c : (c?.members || []));
        setJobs(Array.isArray(j) ? j : (j?.jobs || []));
      }).catch(console.error);
  }, [user]);

  // fetch assignments for visible range
  useEffect(() => {
    if (!user) return;
    const run = async () => {
      setLoading(true);
      const dates = [];
      if (viewMode === "day") {
        // fetch full month for calendar dots + current week
        const s = new Date(selectedDate); s.setDate(1);
        const e = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
        for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) dates.push(new Date(d));
      } else {
        for (let i = 0; i < 14; i++) dates.push(new Date(+selectedDate + i * DAY_MS));
      }
      const results = await Promise.allSettled(
        dates.map(async d => {
          const key = safeKey(d);
          try {
            const raw = await getAssignments(key);
            return { key, data: Array.isArray(raw) ? raw : (raw?.assignments || []) };
          } catch { return { key, data: [] }; }
        })
      );
      const grouped = {};
      results.forEach(r => { if (r.status === "fulfilled") grouped[r.value.key] = r.value.data; });
      setAssignmentsByDate(prev => ({ ...prev, ...grouped }));
      setLoading(false);
    };
    run();
  }, [user, selectedDate, viewMode]);

  const crewMap = useMemo(() => { const m = {}; crew.forEach(c => (m[c.id || c.crewId || c.memberId] = c)); return m; }, [crew]);
  const jobMap = useMemo(() => { const m = {}; jobs.forEach(j => (m[j.id || j.jobId] = j)); return m; }, [jobs]);
  const dateCounts = useMemo(() => { const c = {}; Object.entries(assignmentsByDate).forEach(([k, v]) => { c[k] = v.length; }); return c; }, [assignmentsByDate]);

  const dayAssignments = useMemo(() => {
    const key = safeKey(selectedDate);
    return [...(assignmentsByDate[key] || [])].sort((a, b) => {
      const tA = a.startTime ? new Date(a.startTime).getTime() : Infinity;
      const tB = b.startTime ? new Date(b.startTime).getTime() : Infinity;
      return tA - tB;
    });
  }, [selectedDate, assignmentsByDate]);

  const onCardClick = (a) => { const id = a.jobId || a.id; if (id) router.push(`/jobs/${id}`); };

  if (!user) return null;

  const todayStr = safeFmt(selectedDate, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  const jobCount = dayAssignments.length;

  return (
    <AppShell>
      <style>{`
        @keyframes shimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }
        .skel { background: linear-gradient(90deg, var(--bg2,#F3F4F6) 25%, var(--border,#E5E7EB) 50%, var(--bg2,#F3F4F6) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 14px; }
      `}</style>

      <div className="w-full" style={{ padding: isMobile ? "12px 16px 100px" : "24px 40px 40px" }}>
        {/* ── HEADER ─────────────────────────────────────────── */}
        <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: "var(--text)" }}>Schedule</h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--text3)" }}>{todayStr}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Today */}
            <button onClick={() => setSelectedDate(new Date())}
              className="px-4 py-2 text-sm font-semibold rounded-xl border transition-colors hover:bg-black/5"
              style={{ borderColor: "var(--border)", color: "var(--text)", background: "var(--card)" }}>
              Today
            </button>
            {/* Day / List toggle */}
            <div className="flex rounded-xl p-0.5" style={{ background: "var(--bg2)" }}>
              {[{ k: "day", icon: Calendar, l: "Day" }, { k: "list", icon: List, l: "List" }].map(({ k, icon: I, l }) => (
                <button key={k} onClick={() => setViewMode(k)}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-[10px] transition-all"
                  style={{
                    background: viewMode === k ? "var(--card)" : "transparent",
                    color: viewMode === k ? "var(--text)" : "var(--text3)",
                    boxShadow: viewMode === k ? "0 1px 4px rgba(0,0,0,.06)" : "none",
                  }}>
                  <I size={15} /> {l}
                </button>
              ))}
            </div>
            {/* Optimize */}
            <button onClick={() => router.push(`/schedule/optimize?date=${safeKey(selectedDate)}`)}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl border transition-colors hover:bg-black/5"
              style={{ borderColor: "var(--border)", color: "var(--text)", background: "var(--card)" }}>
              <Navigation size={15} />
              {!isMobile && "Optimize Route"}
            </button>
          </div>
        </div>

        {/* ── BODY ───────────────────────────────────────────── */}
        {viewMode === "day" ? (
          /* ── DAY VIEW ──────────────────────────────────────── */
          <div className={isMobile ? "space-y-4" : "grid gap-7"} style={!isMobile ? { gridTemplateColumns: "280px 1fr" } : undefined}>
            {/* Calendar */}
            <div className="rounded-2xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)", ...(isMobile ? {} : { position: "sticky", top: 20, alignSelf: "start" }) }}>
              {isMobile
                ? <WeekStrip selectedDate={selectedDate} onSelect={setSelectedDate} dateCounts={dateCounts} />
                : <MonthCal selectedDate={selectedDate} onSelect={setSelectedDate} dateCounts={dateCounts} />
              }
            </div>

            {/* Day content */}
            <div>
              {/* Day subheader */}
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <button onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate() - 1); setSelectedDate(d); }}
                    className="p-1 rounded-lg hover:bg-black/5" style={{ color: "var(--text2)" }}><ChevronLeft size={18} /></button>
                  <span className="text-sm font-bold" style={{ color: "var(--text)" }}>
                    {isSameDay(selectedDate, new Date()) ? "Today" : safeFmt(selectedDate, { weekday: "short", month: "short", day: "numeric" })}
                  </span>
                  <button onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate() + 1); setSelectedDate(d); }}
                    className="p-1 rounded-lg hover:bg-black/5" style={{ color: "var(--text2)" }}><ChevronRight size={18} /></button>
                </div>
                <span className="text-xs font-semibold" style={{ color: "var(--text3)" }}>
                  {jobCount} job{jobCount !== 1 ? "s" : ""}
                </span>
              </div>

              {loading ? (
                <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="skel" style={{ height: 88 }} />)}</div>
              ) : jobCount === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: "var(--bg2)" }}>
                    <Briefcase size={24} style={{ color: "var(--text3)" }} />
                  </div>
                  <p className="font-semibold" style={{ color: "var(--text)" }}>No jobs on this day</p>
                  <p className="text-sm mt-1" style={{ color: "var(--text3)" }}>Select another date or create a new job.</p>
                </div>
              ) : isMobile ? (
                /* Mobile: simple card list */
                <div className="space-y-2">
                  {dayAssignments.map((a, i) => (
                    <JobCard key={a.id || a.assignmentId || i} assignment={a} job={jobMap[a.jobId] || {}} crewMap={crewMap} onClick={() => onCardClick(a)} />
                  ))}
                </div>
              ) : (
                /* Desktop: Jobber-style time grid */
                <DayTimeGrid assignments={dayAssignments} jobMap={jobMap} crewMap={crewMap} onCardClick={onCardClick} />
              )}
            </div>
          </div>
        ) : (
          /* ── LIST VIEW ─────────────────────────────────────── */
          <div className={isMobile ? "" : "grid gap-7"} style={!isMobile ? { gridTemplateColumns: "280px 1fr" } : undefined}>
            {!isMobile && (
              <div className="rounded-2xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)", position: "sticky", top: 20, alignSelf: "start" }}>
                <MonthCal selectedDate={selectedDate} onSelect={setSelectedDate} dateCounts={dateCounts} />
              </div>
            )}
            <div>
              {loading ? (
                <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="skel" style={{ height: 88 }} />)}</div>
              ) : (
                <ListView assignmentsByDate={assignmentsByDate} jobMap={jobMap} crewMap={crewMap} startDate={selectedDate} onCardClick={onCardClick} />
              )}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
