"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import { getAssignments, getCrew, getJobs } from "../utils/api";

// ─── Date helpers ───────────────────────────────────────────────────────────
const DAY_MS = 86400000;
const fmt = (d, opts) => new Intl.DateTimeFormat("en-US", opts).format(d);
const isSameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const getWeekDays = (anchor) => {
  const start = new Date(anchor);
  start.setDate(start.getDate() - start.getDay()); // Sunday
  return Array.from({ length: 7 }, (_, i) => new Date(+start + i * DAY_MS));
};

const getMonthDays = (year, month) => {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startDay = first.getDay();
  const days = [];
  // pad start
  for (let i = startDay - 1; i >= 0; i--) {
    days.push({ date: new Date(year, month, -i), outside: true });
  }
  for (let d = 1; d <= last.getDate(); d++) {
    days.push({ date: new Date(year, month, d), outside: false });
  }
  // pad end
  const remaining = 7 - (days.length % 7);
  if (remaining < 7) {
    for (let i = 1; i <= remaining; i++) {
      days.push({ date: new Date(year, month + 1, i), outside: true });
    }
  }
  return days;
};

// ─── Status badge config ────────────────────────────────────────────────────
const STATUS_STYLES = {
  scheduled: { bg: "#EEF2FF", color: "#4F46E5", label: "Scheduled" },
  in_progress: { bg: "#FFF7ED", color: "#EA580C", label: "In Progress" },
  completed: { bg: "#F0FDF4", color: "#16A34A", label: "Completed" },
  paid: { bg: "#ECFDF5", color: "#059669", label: "Paid" },
  invoiced: { bg: "#EFF6FF", color: "#2563EB", label: "Invoiced" },
  default: { bg: "#F3F4F6", color: "#6B7280", label: "Open" },
};

const getStatusStyle = (status) =>
  STATUS_STYLES[status?.toLowerCase()] || STATUS_STYLES.default;

// ─── JobCard ────────────────────────────────────────────────────────────────
function JobCard({ assignment, job, crewMap, onClick }) {
  const status = getStatusStyle(job?.status || assignment?.status);
  const crewNames = (assignment?.crewIds || [])
    .map((id) => crewMap[id]?.name || "Unassigned")
    .join(", ");

  const timeStr = assignment?.startTime
    ? fmt(new Date(assignment.startTime), { hour: "numeric", minute: "2-digit" })
    : "No time set";

  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "stretch",
        width: "100%",
        background: "#FFFFFF",
        border: "1px solid #E5E7EB",
        borderRadius: 12,
        padding: 0,
        cursor: "pointer",
        textAlign: "left",
        transition: "box-shadow 0.15s, border-color 0.15s, transform 0.1s",
        overflow: "hidden",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";
        e.currentTarget.style.borderColor = "#D1D5DB";
        e.currentTarget.style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.borderColor = "#E5E7EB";
        e.currentTarget.style.transform = "none";
      }}
    >
      {/* Color accent bar */}
      <div
        style={{
          width: 4,
          flexShrink: 0,
          background: status.color,
          borderRadius: "12px 0 0 12px",
        }}
      />
      <div style={{ flex: 1, padding: "14px 16px" }}>
        {/* Top row: time + status */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 6,
          }}
        >
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "#6B7280",
              letterSpacing: "0.01em",
            }}
          >
            {timeStr}
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: status.color,
              background: status.bg,
              padding: "3px 10px",
              borderRadius: 100,
              letterSpacing: "0.02em",
              textTransform: "uppercase",
            }}
          >
            {status.label}
          </span>
        </div>

        {/* Job title */}
        <div
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: "#111827",
            marginBottom: 4,
            lineHeight: 1.3,
          }}
        >
          {job?.title || assignment?.title || "Untitled Job"}
        </div>

        {/* Client name */}
        {job?.clientName && (
          <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 6 }}>
            {job.clientName}
          </div>
        )}

        {/* Address */}
        {(job?.address || assignment?.address) && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              fontSize: 13,
              color: "#9CA3AF",
              marginBottom: 6,
            }}
          >
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {job?.address || assignment?.address}
            </span>
          </div>
        )}

        {/* Crew chips */}
        {crewNames && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              fontSize: 12,
              color: "#9CA3AF",
            }}
          >
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>{crewNames}</span>
          </div>
        )}
      </div>

      {/* Chevron */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "0 12px",
          color: "#D1D5DB",
        }}
      >
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <path d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  );
}

// ─── Horizontal Week Strip ──────────────────────────────────────────────────
function WeekStrip({ selectedDate, onSelectDate, assignmentsByDate }) {
  const weekDays = useMemo(() => getWeekDays(selectedDate), [selectedDate]);
  const today = new Date();

  const goPrevWeek = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 7);
    onSelectDate(d);
  };
  const goNextWeek = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 7);
    onSelectDate(d);
  };

  return (
    <div>
      {/* Month label + nav */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
          padding: "0 4px",
        }}
      >
        <button onClick={goPrevWeek} style={navBtnStyle}>
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>
          {fmt(selectedDate, { month: "long", year: "numeric" })}
        </span>
        <button onClick={goNextWeek} style={navBtnStyle}>
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Day cells */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 4,
        }}
      >
        {weekDays.map((day) => {
          const isToday = isSameDay(day, today);
          const isSelected = isSameDay(day, selectedDate);
          const dateKey = day.toISOString().split("T")[0];
          const count = (assignmentsByDate[dateKey] || []).length;

          return (
            <button
              key={dateKey}
              onClick={() => onSelectDate(new Date(day))}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
                padding: "8px 4px 10px",
                borderRadius: 12,
                border: "none",
                cursor: "pointer",
                background: isSelected
                  ? "#111827"
                  : isToday
                  ? "#F3F4F6"
                  : "transparent",
                transition: "background 0.15s",
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: isSelected ? "#9CA3AF" : "#9CA3AF",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {fmt(day, { weekday: "short" })}
              </span>
              <span
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: isSelected ? "#FFFFFF" : isToday ? "#111827" : "#374151",
                  lineHeight: 1.2,
                }}
              >
                {day.getDate()}
              </span>
              {/* Dot indicator for jobs */}
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: count > 0 ? (isSelected ? "#60A5FA" : "#4F46E5") : "transparent",
                  marginTop: 1,
                }}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Full Month Calendar (desktop) ──────────────────────────────────────────
function MonthCalendar({ selectedDate, onSelectDate, assignmentsByDate }) {
  const [viewMonth, setViewMonth] = useState(selectedDate.getMonth());
  const [viewYear, setViewYear] = useState(selectedDate.getFullYear());
  const today = new Date();

  useEffect(() => {
    setViewMonth(selectedDate.getMonth());
    setViewYear(selectedDate.getFullYear());
  }, [selectedDate]);

  const days = useMemo(() => getMonthDays(viewYear, viewMonth), [viewYear, viewMonth]);
  const weekHeaders = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const goPrev = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  };
  const goNext = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <button onClick={goPrev} style={navBtnStyle}>
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M15 19l-7-7 7-7" /></svg>
        </button>
        <span style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>
          {fmt(new Date(viewYear, viewMonth), { month: "long", year: "numeric" })}
        </span>
        <button onClick={goNext} style={navBtnStyle}>
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, textAlign: "center" }}>
        {weekHeaders.map((d) => (
          <div key={d} style={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", padding: "6px 0", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            {d}
          </div>
        ))}
        {days.map(({ date, outside }, i) => {
          const isToday = isSameDay(date, today);
          const isSelected = isSameDay(date, selectedDate);
          const dateKey = date.toISOString().split("T")[0];
          const count = (assignmentsByDate[dateKey] || []).length;
          return (
            <button
              key={i}
              onClick={() => onSelectDate(new Date(date))}
              style={{
                padding: "8px 4px 6px",
                borderRadius: 10,
                border: "none",
                cursor: "pointer",
                opacity: outside ? 0.3 : 1,
                background: isSelected ? "#111827" : isToday ? "#F3F4F6" : "transparent",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 3,
                transition: "background 0.12s",
              }}
            >
              <span style={{ fontSize: 14, fontWeight: isToday || isSelected ? 700 : 500, color: isSelected ? "#FFF" : "#374151" }}>
                {date.getDate()}
              </span>
              {count > 0 && (
                <div style={{ display: "flex", gap: 2 }}>
                  {Array.from({ length: Math.min(count, 3) }).map((_, j) => (
                    <div key={j} style={{ width: 5, height: 5, borderRadius: "50%", background: isSelected ? "#60A5FA" : "#4F46E5" }} />
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

// ─── Shared styles ──────────────────────────────────────────────────────────
const navBtnStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 36,
  height: 36,
  borderRadius: 10,
  border: "1px solid #E5E7EB",
  background: "#FFF",
  cursor: "pointer",
  color: "#374151",
};

// ─── Main Schedule Page ─────────────────────────────────────────────────────
export default function SchedulePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [crew, setCrew] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState("day"); // "day" | "list"
  const [isMobile, setIsMobile] = useState(false);
  const scrollRef = useRef(null);

  // Responsive detection
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Data fetching
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [aData, cData, jData] = await Promise.all([
          getAssignments(user),
          getCrew(user),
          getJobs(user),
        ]);
        setAssignments(aData || []);
        setCrew(cData || []);
        setJobs(jData || []);
      } catch (err) {
        console.error("Schedule fetch error:", err);
        setError("Failed to load schedule data.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  // Build lookup maps
  const crewMap = useMemo(() => {
    const m = {};
    crew.forEach((c) => (m[c.id || c.crewId] = c));
    return m;
  }, [crew]);

  const jobMap = useMemo(() => {
    const m = {};
    jobs.forEach((j) => (m[j.id || j.jobId] = j));
    return m;
  }, [jobs]);

  // Group assignments by date key
  const assignmentsByDate = useMemo(() => {
    const groups = {};
    assignments.forEach((a) => {
      const d = a.date || a.startTime || a.scheduledDate;
      if (!d) return;
      const key = new Date(d).toISOString().split("T")[0];
      if (!groups[key]) groups[key] = [];
      groups[key].push(a);
    });
    // Sort each day's assignments by time
    Object.values(groups).forEach((arr) =>
      arr.sort((a, b) => {
        const tA = a.startTime ? new Date(a.startTime).getTime() : 0;
        const tB = b.startTime ? new Date(b.startTime).getTime() : 0;
        return tA - tB;
      })
    );
    return groups;
  }, [assignments]);

  // Cards for current view
  const visibleAssignments = useMemo(() => {
    if (viewMode === "day") {
      const key = selectedDate.toISOString().split("T")[0];
      return assignmentsByDate[key] || [];
    }
    // List view: show next 14 days from selected date
    const result = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date(+selectedDate + i * DAY_MS);
      const key = d.toISOString().split("T")[0];
      const dayAssignments = assignmentsByDate[key] || [];
      if (dayAssignments.length > 0) {
        result.push({ dateLabel: d, items: dayAssignments });
      }
    }
    return result;
  }, [viewMode, selectedDate, assignmentsByDate]);

  const goToToday = () => setSelectedDate(new Date());

  const handleCardClick = (assignment) => {
    const jobId = assignment.jobId || assignment.id;
    if (jobId) router.push(`/jobs/${jobId}`);
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  if (!user) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh", color: "#6B7280" }}>
        Please log in to view your schedule.
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: 1100,
        margin: "0 auto",
        padding: isMobile ? "16px" : "24px 32px",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      }}
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#111827", margin: 0, letterSpacing: "-0.02em" }}>
            Schedule
          </h1>
          <p style={{ fontSize: 13, color: "#9CA3AF", margin: "4px 0 0" }}>
            {fmt(selectedDate, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
          </p>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {/* Today button */}
          <button
            onClick={goToToday}
            style={{
              padding: "8px 16px",
              fontSize: 13,
              fontWeight: 600,
              borderRadius: 10,
              border: "1px solid #E5E7EB",
              background: "#FFF",
              color: "#374151",
              cursor: "pointer",
              transition: "border-color 0.15s",
            }}
          >
            Today
          </button>

          {/* Day/List toggle */}
          <div
            style={{
              display: "flex",
              background: "#F3F4F6",
              borderRadius: 10,
              padding: 3,
            }}
          >
            {["day", "list"].map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                style={{
                  padding: "7px 16px",
                  fontSize: 13,
                  fontWeight: 600,
                  borderRadius: 8,
                  border: "none",
                  cursor: "pointer",
                  background: viewMode === mode ? "#FFFFFF" : "transparent",
                  color: viewMode === mode ? "#111827" : "#6B7280",
                  boxShadow: viewMode === mode ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                  transition: "all 0.15s",
                  textTransform: "capitalize",
                }}
              >
                {mode === "day" ? "Day" : "List"}
              </button>
            ))}
          </div>

          {/* Route Optimization placeholder */}
          <button
            onClick={() => alert("Route optimization coming soon!")}
            title="Optimize route"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              fontSize: 13,
              fontWeight: 600,
              borderRadius: 10,
              border: "1px solid #E5E7EB",
              background: "#FFF",
              color: "#374151",
              cursor: "pointer",
              transition: "border-color 0.15s, background 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#F9FAFB";
              e.currentTarget.style.borderColor = "#D1D5DB";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#FFF";
              e.currentTarget.style.borderColor = "#E5E7EB";
            }}
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            {!isMobile && <span>Optimize Route</span>}
          </button>
        </div>
      </div>

      {/* ── Layout: Calendar + Cards ───────────────────────────────────────── */}
      <div
        style={{
          display: isMobile ? "flex" : "grid",
          flexDirection: "column",
          gridTemplateColumns: isMobile ? "1fr" : "320px 1fr",
          gap: isMobile ? 20 : 28,
          alignItems: "start",
        }}
      >
        {/* Calendar panel */}
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: 16,
            border: "1px solid #E5E7EB",
            padding: isMobile ? 16 : 20,
            position: isMobile ? "relative" : "sticky",
            top: isMobile ? undefined : 24,
          }}
        >
          {isMobile ? (
            <WeekStrip
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              assignmentsByDate={assignmentsByDate}
            />
          ) : (
            <MonthCalendar
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              assignmentsByDate={assignmentsByDate}
            />
          )}
        </div>

        {/* Cards panel */}
        <div ref={scrollRef} style={{ minHeight: 200 }}>
          {loading ? (
            <LoadingSkeleton />
          ) : error ? (
            <div
              style={{
                padding: 32,
                textAlign: "center",
                color: "#EF4444",
                background: "#FEF2F2",
                borderRadius: 12,
                fontSize: 14,
              }}
            >
              {error}
            </div>
          ) : viewMode === "day" ? (
            /* ── Day View ──────────────────────────────────────────────── */
            visibleAssignments.length === 0 ? (
              <EmptyState
                message={`No jobs scheduled for ${fmt(selectedDate, { month: "short", day: "numeric" })}`}
              />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#9CA3AF",
                    padding: "0 2px 4px",
                    letterSpacing: "0.02em",
                  }}
                >
                  {visibleAssignments.length} job{visibleAssignments.length !== 1 ? "s" : ""}
                </div>
                {visibleAssignments.map((a, i) => (
                  <JobCard
                    key={a.id || a.assignmentId || i}
                    assignment={a}
                    job={jobMap[a.jobId] || {}}
                    crewMap={crewMap}
                    onClick={() => handleCardClick(a)}
                  />
                ))}
              </div>
            )
          ) : (
            /* ── List View (next 14 days) ──────────────────────────────── */
            visibleAssignments.length === 0 ? (
              <EmptyState message="No upcoming jobs in the next 14 days" />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {visibleAssignments.map((group, gi) => (
                  <div key={gi}>
                    {/* Date header */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        marginBottom: 10,
                        padding: "0 2px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: isSameDay(group.dateLabel, new Date()) ? "#4F46E5" : "#111827",
                        }}
                      >
                        {isSameDay(group.dateLabel, new Date())
                          ? "Today"
                          : fmt(group.dateLabel, { weekday: "short", month: "short", day: "numeric" })}
                      </span>
                      <div style={{ flex: 1, height: 1, background: "#E5E7EB" }} />
                      <span style={{ fontSize: 12, color: "#9CA3AF", fontWeight: 600 }}>
                        {group.items.length} job{group.items.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {group.items.map((a, i) => (
                        <JobCard
                          key={a.id || a.assignmentId || i}
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
  );
}

// ─── Empty state ────────────────────────────────────────────────────────────
function EmptyState({ message }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px 20px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          background: "#F3F4F6",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 16,
        }}
      >
        <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#9CA3AF" strokeWidth="1.5">
          <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
      <p style={{ fontSize: 15, fontWeight: 600, color: "#374151", margin: 0 }}>{message}</p>
      <p style={{ fontSize: 13, color: "#9CA3AF", marginTop: 6 }}>
        Jobs will appear here once scheduled.
      </p>
    </div>
  );
}

// ─── Loading skeleton ───────────────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            height: 96,
            borderRadius: 12,
            background: "linear-gradient(90deg, #F3F4F6 25%, #E5E7EB 50%, #F3F4F6 75%)",
            backgroundSize: "200% 100%",
            animation: "shimmer 1.5s infinite",
          }}
        />
      ))}
      <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
    </div>
  );
}
