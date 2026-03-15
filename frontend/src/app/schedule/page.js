"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { getAssignments, getCrew, getJobs } from "@/lib/api";
import { Calendar, ChevronLeft, ChevronRight, MapPin, Users, Navigation, List, Clock } from "lucide-react";

// ─── Date helpers ───────────────────────────────────────────────────────────
const DAY_MS = 86400000;
const fmt = (d, opts) => { try { return new Intl.DateTimeFormat("en-US", opts).format(d); } catch { return ""; } };
const toKey = (d) => { try { return d.toISOString().split("T")[0]; } catch { return "1970-01-01"; } };
const isSameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const getWeekDays = (anchor) => {
  const start = new Date(anchor);
  start.setDate(start.getDate() - start.getDay());
  return Array.from({ length: 7 }, (_, i) => new Date(+start + i * DAY_MS));
};

const getMonthDays = (year, month) => {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startDay = first.getDay();
  const days = [];
  for (let i = startDay - 1; i >= 0; i--)
    days.push({ date: new Date(year, month, -i), outside: true });
  for (let d = 1; d <= last.getDate(); d++)
    days.push({ date: new Date(year, month, d), outside: false });
  const remaining = 7 - (days.length % 7);
  if (remaining < 7)
    for (let i = 1; i <= remaining; i++)
      days.push({ date: new Date(year, month + 1, i), outside: true });
  return days;
};

// ─── Status config ──────────────────────────────────────────────────────────
const STATUS_STYLES = {
  scheduled: { bg: "#EEF2FF", color: "#4F46E5", label: "Scheduled" },
  in_progress: { bg: "#FFF7ED", color: "#EA580C", label: "In Progress" },
  active: { bg: "#FFF7ED", color: "#EA580C", label: "Active" },
  bidding: { bg: "#FFFBEB", color: "#D97706", label: "Bidding" },
  completed: { bg: "#F0FDF4", color: "#16A34A", label: "Completed" },
  complete: { bg: "#F0FDF4", color: "#16A34A", label: "Complete" },
  paid: { bg: "#ECFDF5", color: "#059669", label: "Paid" },
  invoiced: { bg: "#EFF6FF", color: "#2563EB", label: "Invoiced" },
  default: { bg: "#F3F4F6", color: "#6B7280", label: "Open" },
};
const getStatusStyle = (s) => STATUS_STYLES[s?.toLowerCase()] || STATUS_STYLES.default;

// ─── JobCard ────────────────────────────────────────────────────────────────
function JobCard({ assignment, job, crewMap, onClick }) {
  const status = getStatusStyle(job?.status || assignment?.status);
  const crewNames = (assignment?.crewIds || assignment?.memberIds || [])
    .map((id) => crewMap[id]?.name || "Unassigned")
    .filter(Boolean)
    .join(", ");
  const memberName = assignment?.memberName || (assignment?.memberId && crewMap[assignment.memberId]?.name);

  const timeStr = assignment?.startTime
    ? fmt(new Date(assignment.startTime), { hour: "numeric", minute: "2-digit" })
    : null;

  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "stretch", width: "100%",
        background: "var(--card, #FFF)", border: "1px solid var(--border, #E5E7EB)",
        borderRadius: 12, padding: 0, cursor: "pointer", textAlign: "left",
        transition: "box-shadow 0.15s, transform 0.1s", overflow: "hidden",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; }}
    >
      <div style={{ width: 4, flexShrink: 0, background: status.color, borderRadius: "12px 0 0 12px" }} />
      <div style={{ flex: 1, padding: "14px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          {timeStr && (
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text2, #6B7280)", display: "flex", alignItems: "center", gap: 4 }}>
              <Clock size={13} /> {timeStr}
            </span>
          )}
          <span style={{
            fontSize: 11, fontWeight: 600, color: status.color, background: status.bg,
            padding: "3px 10px", borderRadius: 100, letterSpacing: "0.02em", textTransform: "uppercase",
            marginLeft: "auto",
          }}>
            {status.label}
          </span>
        </div>

        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text, #111827)", marginBottom: 4, lineHeight: 1.3 }}>
          {job?.title || job?.name || assignment?.jobTitle || "Untitled Job"}
        </div>

        {job?.clientName && (
          <div style={{ fontSize: 13, color: "var(--text2, #6B7280)", marginBottom: 6 }}>{job.clientName}</div>
        )}

        {(job?.address || job?.location) && (
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: "var(--text3, #9CA3AF)", marginBottom: 6 }}>
            <MapPin size={13} />
            <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {job?.address || job?.location}
            </span>
          </div>
        )}

        {(crewNames || memberName) && (
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--text3, #9CA3AF)" }}>
            <Users size={13} />
            <span>{crewNames || memberName}</span>
          </div>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", padding: "0 12px", color: "var(--border, #D1D5DB)" }}>
        <ChevronRight size={16} />
      </div>
    </button>
  );
}

// ─── Horizontal Week Strip (mobile) ─────────────────────────────────────────
function WeekStrip({ selectedDate, onSelectDate, dateCounts }) {
  const weekDays = useMemo(() => getWeekDays(selectedDate), [selectedDate]);
  const today = new Date();

  const shift = (n) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + n);
    onSelectDate(d);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, padding: "0 4px" }}>
        <button onClick={() => shift(-7)} className="cal-nav-btn"><ChevronLeft size={18} /></button>
        <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>
          {fmt(selectedDate, { month: "long", year: "numeric" })}
        </span>
        <button onClick={() => shift(7)} className="cal-nav-btn"><ChevronRight size={18} /></button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
        {weekDays.map((day) => {
          const isToday = isSameDay(day, today);
          const isSel = isSameDay(day, selectedDate);
          const key = toKey(day);
          const count = dateCounts[key] || 0;
          return (
            <button key={key} onClick={() => onSelectDate(new Date(day))} style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
              padding: "8px 4px 10px", borderRadius: 12, border: "none", cursor: "pointer",
              background: isSel ? "var(--brand, #111827)" : isToday ? "var(--bg2, #F3F4F6)" : "transparent",
              transition: "background 0.15s",
            }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text3, #9CA3AF)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {fmt(day, { weekday: "short" })}
              </span>
              <span style={{ fontSize: 18, fontWeight: 700, color: isSel ? "#FFF" : isToday ? "var(--text)" : "var(--text, #374151)", lineHeight: 1.2 }}>
                {day.getDate()}
              </span>
              <div style={{
                width: 6, height: 6, borderRadius: "50%", marginTop: 1,
                background: count > 0 ? (isSel ? "#60A5FA" : "var(--brand, #4F46E5)") : "transparent",
              }} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Full Month Calendar (desktop) ──────────────────────────────────────────
function MonthCalendar({ selectedDate, onSelectDate, dateCounts }) {
  const [viewMonth, setViewMonth] = useState(selectedDate.getMonth());
  const [viewYear, setViewYear] = useState(selectedDate.getFullYear());
  const today = new Date();

  useEffect(() => {
    setViewMonth(selectedDate.getMonth());
    setViewYear(selectedDate.getFullYear());
  }, [selectedDate]);

  const days = useMemo(() => getMonthDays(viewYear, viewMonth), [viewYear, viewMonth]);

  const goPrev = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); } else setViewMonth(viewMonth - 1); };
  const goNext = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); } else setViewMonth(viewMonth + 1); };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <button onClick={goPrev} className="cal-nav-btn"><ChevronLeft size={18} /></button>
        <span style={{ fontSize: 16, fontWeight: 700, color: "var(--text)" }}>
          {fmt(new Date(viewYear, viewMonth), { month: "long", year: "numeric" })}
        </span>
        <button onClick={goNext} className="cal-nav-btn"><ChevronRight size={18} /></button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, textAlign: "center" }}>
        {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
          <div key={d} style={{ fontSize: 11, fontWeight: 600, color: "var(--text3)", padding: "6px 0", textTransform: "uppercase", letterSpacing: "0.06em" }}>{d}</div>
        ))}
        {days.map(({ date, outside }, i) => {
          const isToday = isSameDay(date, today);
          const isSel = isSameDay(date, selectedDate);
          const key = toKey(date);
          const count = dateCounts[key] || 0;
          return (
            <button key={i} onClick={() => onSelectDate(new Date(date))} style={{
              padding: "8px 4px 6px", borderRadius: 10, border: "none", cursor: "pointer",
              opacity: outside ? 0.3 : 1,
              background: isSel ? "var(--brand, #111827)" : isToday ? "var(--bg2, #F3F4F6)" : "transparent",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 3, transition: "background 0.12s",
            }}>
              <span style={{ fontSize: 14, fontWeight: isToday || isSel ? 700 : 500, color: isSel ? "#FFF" : "var(--text, #374151)" }}>
                {date.getDate()}
              </span>
              {count > 0 && (
                <div style={{ display: "flex", gap: 2 }}>
                  {Array.from({ length: Math.min(count, 3) }).map((_, j) => (
                    <div key={j} style={{ width: 5, height: 5, borderRadius: "50%", background: isSel ? "#60A5FA" : "var(--brand, #4F46E5)" }} />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Schedule Page ─────────────────────────────────────────────────────
export default function SchedulePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [assignmentsByDate, setAssignmentsByDate] = useState({});
  const [crew, setCrew] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState("day");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Fetch crew + jobs once
  useEffect(() => {
    if (!user) return;
    Promise.all([getCrew(), getJobs()])
      .then(([c, j]) => { setCrew(Array.isArray(c) ? c : (c?.members || [])); setJobs(Array.isArray(j) ? j : (j?.jobs || [])); })
      .catch((err) => console.error("Failed to load crew/jobs:", err));
  }, [user]);

  // Fetch assignments for visible date range
  useEffect(() => {
    if (!user) return;
    const fetchRange = async () => {
      setLoading(true);
      setError(null);
      try {
        const dates = [];
        if (viewMode === "day") {
          // Fetch the full week around selected date for the calendar dots
          const weekStart = new Date(selectedDate);
          weekStart.setDate(weekStart.getDate() - weekStart.getDay());
          for (let i = 0; i < 7; i++) dates.push(new Date(+weekStart + i * DAY_MS));
        } else {
          // List view: fetch 14 days from selected date
          for (let i = 0; i < 14; i++) dates.push(new Date(+selectedDate + i * DAY_MS));
        }

        const results = await Promise.all(
          dates.map(async (d) => {
            const key = toKey(d);
            try {
              const raw = await getAssignments(key);
              const data = Array.isArray(raw) ? raw : (raw?.assignments || []);
              return { key, data };
            } catch {
              return { key, data: [] };
            }
          })
        );

        const grouped = {};
        results.forEach(({ key, data }) => { grouped[key] = data; });
        setAssignmentsByDate((prev) => ({ ...prev, ...grouped }));
      } catch (err) {
        console.error("Schedule fetch error:", err);
        setError("Failed to load schedule.");
      } finally {
        setLoading(false);
      }
    };
    fetchRange();
  }, [user, selectedDate, viewMode]);

  // Lookup maps
  const crewMap = useMemo(() => {
    const m = {};
    crew.forEach((c) => (m[c.id || c.crewId || c.memberId] = c));
    return m;
  }, [crew]);

  const jobMap = useMemo(() => {
    const m = {};
    jobs.forEach((j) => (m[j.id || j.jobId] = j));
    return m;
  }, [jobs]);

  // Date counts for calendar dots
  const dateCounts = useMemo(() => {
    const counts = {};
    Object.entries(assignmentsByDate).forEach(([key, arr]) => {
      counts[key] = arr.length;
    });
    return counts;
  }, [assignmentsByDate]);

  // Cards for current view
  const dayAssignments = useMemo(() => {
    const key = toKey(selectedDate);
    const arr = assignmentsByDate[key] || [];
    return [...arr].sort((a, b) => {
      const tA = a.startTime ? new Date(a.startTime).getTime() : 0;
      const tB = b.startTime ? new Date(b.startTime).getTime() : 0;
      return tA - tB;
    });
  }, [selectedDate, assignmentsByDate]);

  const listGroups = useMemo(() => {
    if (viewMode !== "list") return [];
    const groups = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date(+selectedDate + i * DAY_MS);
      const key = toKey(d);
      const items = assignmentsByDate[key] || [];
      if (items.length > 0) {
        groups.push({
          dateLabel: d,
          items: [...items].sort((a, b) => {
            const tA = a.startTime ? new Date(a.startTime).getTime() : 0;
            const tB = b.startTime ? new Date(b.startTime).getTime() : 0;
            return tA - tB;
          }),
        });
      }
    }
    return groups;
  }, [viewMode, selectedDate, assignmentsByDate]);

  const handleCardClick = (assignment) => {
    const jobId = assignment.jobId || assignment.id;
    if (jobId) router.push(`/jobs/${jobId}`);
  };

  if (!user) return null;

  return (
    <AppShell>
      <style>{`
        .cal-nav-btn {
          display: flex; align-items: center; justify-content: center;
          width: 36px; height: 36px; border-radius: 10px;
          border: 1px solid var(--border, #E5E7EB); background: var(--card, #FFF);
          cursor: pointer; color: var(--text, #374151);
        }
        .cal-nav-btn:hover { background: var(--bg2, #F3F4F6); }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
      `}</style>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: isMobile ? "16px" : "24px 32px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", margin: 0, letterSpacing: "-0.02em" }}>Schedule</h1>
            <p style={{ fontSize: 13, color: "var(--text3, #9CA3AF)", margin: "4px 0 0" }}>
              {fmt(selectedDate, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            </p>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {/* Today */}
            <button onClick={() => setSelectedDate(new Date())} style={{
              padding: "8px 16px", fontSize: 13, fontWeight: 600, borderRadius: 10,
              border: "1px solid var(--border)", background: "var(--card)", color: "var(--text)", cursor: "pointer",
            }}>Today</button>

            {/* Day/List toggle */}
            <div style={{ display: "flex", background: "var(--bg2, #F3F4F6)", borderRadius: 10, padding: 3 }}>
              {[
                { key: "day", icon: <Calendar size={14} />, label: "Day" },
                { key: "list", icon: <List size={14} />, label: "List" },
              ].map(({ key, icon, label }) => (
                <button key={key} onClick={() => setViewMode(key)} style={{
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "7px 14px", fontSize: 13, fontWeight: 600, borderRadius: 8, border: "none", cursor: "pointer",
                  background: viewMode === key ? "var(--card, #FFF)" : "transparent",
                  color: viewMode === key ? "var(--text)" : "var(--text2, #6B7280)",
                  boxShadow: viewMode === key ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                  transition: "all 0.15s",
                }}>
                  {icon} {label}
                </button>
              ))}
            </div>

            {/* Route Optimization placeholder */}
            <button
              onClick={() => router.push(`/schedule/optimize?date=${toKey(selectedDate)}`)}
              title="Optimize route"
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "8px 14px", fontSize: 13, fontWeight: 600, borderRadius: 10,
                border: "1px solid var(--border)", background: "var(--card)", color: "var(--text)", cursor: "pointer",
              }}
            >
              <Navigation size={15} />
              {!isMobile && <span>Optimize Route</span>}
            </button>
          </div>
        </div>

        {/* Layout: Calendar + Cards */}
        <div style={{
          display: isMobile ? "flex" : "grid", flexDirection: "column",
          gridTemplateColumns: isMobile ? "1fr" : "320px 1fr",
          gap: isMobile ? 20 : 28, alignItems: "start",
        }}>
          {/* Calendar panel */}
          <div style={{
            background: "var(--card, #FFF)", borderRadius: 16,
            border: "1px solid var(--border, #E5E7EB)", padding: isMobile ? 16 : 20,
            position: isMobile ? "relative" : "sticky", top: isMobile ? undefined : 24,
          }}>
            {isMobile ? (
              <WeekStrip selectedDate={selectedDate} onSelectDate={setSelectedDate} dateCounts={dateCounts} />
            ) : (
              <MonthCalendar selectedDate={selectedDate} onSelectDate={setSelectedDate} dateCounts={dateCounts} />
            )}
          </div>

          {/* Cards panel */}
          <div style={{ minHeight: 200 }}>
            {loading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[1,2,3].map((i) => (
                  <div key={i} style={{
                    height: 96, borderRadius: 12,
                    background: "linear-gradient(90deg, var(--bg2,#F3F4F6) 25%, var(--border,#E5E7EB) 50%, var(--bg2,#F3F4F6) 75%)",
                    backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite",
                  }} />
                ))}
              </div>
            ) : error ? (
              <div style={{ padding: 32, textAlign: "center", color: "#EF4444", background: "#FEF2F2", borderRadius: 12, fontSize: 14 }}>
                {error}
              </div>
            ) : viewMode === "day" ? (
              dayAssignments.length === 0 ? (
                <EmptyState message={`No jobs scheduled for ${fmt(selectedDate, { month: "short", day: "numeric" })}`} />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text3, #9CA3AF)", padding: "0 2px 4px", letterSpacing: "0.02em" }}>
                    {dayAssignments.length} job{dayAssignments.length !== 1 ? "s" : ""}
                  </div>
                  {dayAssignments.map((a, i) => (
                    <JobCard
                      key={a.id || a.assignmentId || a.memberId || i}
                      assignment={a}
                      job={jobMap[a.jobId] || {}}
                      crewMap={crewMap}
                      onClick={() => handleCardClick(a)}
                    />
                  ))}
                </div>
              )
            ) : (
              listGroups.length === 0 ? (
                <EmptyState message="No upcoming jobs in the next 14 days" />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  {listGroups.map((group, gi) => (
                    <div key={gi}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, padding: "0 2px" }}>
                        <span style={{
                          fontSize: 14, fontWeight: 700,
                          color: isSameDay(group.dateLabel, new Date()) ? "var(--brand, #4F46E5)" : "var(--text)",
                        }}>
                          {isSameDay(group.dateLabel, new Date()) ? "Today" : fmt(group.dateLabel, { weekday: "short", month: "short", day: "numeric" })}
                        </span>
                        <div style={{ flex: 1, height: 1, background: "var(--border, #E5E7EB)" }} />
                        <span style={{ fontSize: 12, color: "var(--text3, #9CA3AF)", fontWeight: 600 }}>
                          {group.items.length} job{group.items.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {group.items.map((a, i) => (
                          <JobCard
                            key={a.id || a.assignmentId || a.memberId || i}
                            assignment={a}
                            job={jobMap[a.jobId] || {}}
                            crewMap={crewMap}
                            onClick={() => handleCardClick(a)}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

// ─── Empty state ────────────────────────────────────────────────────────────
function EmptyState({ message }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px", textAlign: "center" }}>
      <div style={{
        width: 56, height: 56, borderRadius: 16, background: "var(--bg2, #F3F4F6)",
        display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16,
      }}>
        <Calendar size={24} color="var(--text3, #9CA3AF)" />
      </div>
      <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text, #374151)", margin: 0 }}>{message}</p>
      <p style={{ fontSize: 13, color: "var(--text3, #9CA3AF)", marginTop: 6 }}>Jobs will appear here once scheduled.</p>
    </div>
  );
}
