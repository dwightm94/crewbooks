"use client";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { getCrew, getJobs, getAssignments, createAssignment, deleteAssignment, notifyCrew, getTracker } from "@/lib/api";
import { money } from "@/lib/utils";
import { Calendar, MapPin, Clock, Send, UserPlus, Trash2, CheckCircle2, XCircle, ChevronLeft, ChevronRight, Users, Briefcase } from "lucide-react";

function getDateStr(offset = 0) {
  const d = new Date(); d.setDate(d.getDate() + offset);
  return d.toISOString().split("T")[0];
}
function formatDate(str) {
  const d = new Date(str + "T12:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export default function SchedulePage() {
  const [tab, setTab] = useState("schedule");
  const [dateOffset, setDateOffset] = useState(1); // default tomorrow
  const [crew, setCrew] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [tracker, setTracker] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [notifying, setNotifying] = useState(false);
  const [notifyResult, setNotifyResult] = useState(null);

  const date = getDateStr(dateOffset);

  const load = async () => {
    setLoading(true);
    try {
      const [c, j, a] = await Promise.all([
        getCrew().catch(() => ({ members: [] })),
        getJobs().catch(() => []),
        getAssignments(date).catch(() => ({ assignments: [] })),
      ]);
      setCrew(c.members || c || []);
      const jobList = j.jobs || (Array.isArray(j) ? j : []);
      setJobs(jobList.filter(job => job.status === "active" || job.status === "complete"));
      setAssignments(a.assignments || a || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const loadTracker = async () => {
    try { const t = await getTracker(); setTracker(t.crew || t || []); } catch { }
  };

  useEffect(() => { load(); }, [dateOffset]);
  useEffect(() => { if (tab === "tracker") loadTracker(); }, [tab]);

  const doAssign = async (memberId, jobId, startTime) => {
    await createAssignment({ memberId, jobId, date, startTime });
    setShowAssignModal(false); load();
  };

  const doRemove = async (memberId) => {
    if (confirm("Remove this assignment?")) { await deleteAssignment(date, memberId); load(); }
  };

  const doNotify = async () => {
    setNotifying(true);
    try { const r = await notifyCrew(date); setNotifyResult(r.notified || r); }
    catch (e) { setNotifyResult([{ name: "Error", sent: false, reason: e.message }]); }
    setNotifying(false);
  };

  const assigned = assignments.map(a => a.memberId);
  const unassigned = crew.filter(m => !assigned.includes(m.memberId) && m.status === "active");

  return (
    <AppShell title="Schedule">
      {/* Tabs */}
      <div className="flex gap-1 mt-4 p-1 rounded-xl" style={{ background: "var(--input)" }}>
        {["schedule", "tracker"].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="flex-1 py-2.5 rounded-lg text-sm font-bold transition-all capitalize"
            style={{ background: tab === t ? "var(--card)" : "transparent", color: tab === t ? "var(--text)" : "var(--muted)", boxShadow: tab === t ? "0 1px 3px rgba(0,0,0,0.1)" : "none" }}>
            {t === "schedule" ? "Schedule" : "Live Tracker"}
          </button>
        ))}
      </div>

      {tab === "schedule" ? (
        <>
          {/* Date picker */}
          <div className="flex items-center justify-between mt-4">
            <button onClick={() => setDateOffset(dateOffset - 1)} className="p-2 rounded-xl" style={{ color: "var(--text2)" }}><ChevronLeft size={24} /></button>
            <div className="text-center">
              <p className="text-lg font-extrabold" style={{ color: "var(--text)" }}>{formatDate(date)}</p>
              <p className="text-xs" style={{ color: "var(--muted)" }}>
                {dateOffset === 0 ? "Today" : dateOffset === 1 ? "Tomorrow" : dateOffset === -1 ? "Yesterday" : ""}
              </p>
            </div>
            <button onClick={() => setDateOffset(dateOffset + 1)} className="p-2 rounded-xl" style={{ color: "var(--text2)" }}><ChevronRight size={24} /></button>
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-4">
            <button onClick={() => setShowAssignModal(true)} className="btn btn-brand flex-1" disabled={unassigned.length === 0 || jobs.length === 0}>
              <UserPlus size={18} />Assign Crew
            </button>
            {assignments.length > 0 && (
              <button onClick={doNotify} disabled={notifying} className="btn btn-outline flex-1">
                <Send size={18} />{notifying ? "Sending..." : "Notify All"}
              </button>
            )}
          </div>

          {/* Notify results */}
          {notifyResult && (
            <div className="card mt-3">
              <h3 className="section-title">Notification Results</h3>
              {notifyResult.map((r, i) => (
                <div key={i} className="flex items-center gap-2 py-1">
                  {r.sent ? <CheckCircle2 size={16} style={{ color: "var(--green)" }} /> : <XCircle size={16} style={{ color: "var(--red)" }} />}
                  <span className="text-sm" style={{ color: "var(--text)" }}>{r.name}</span>
                  {!r.sent && <span className="text-xs" style={{ color: "var(--muted)" }}>({r.reason})</span>}
                </div>
              ))}
            </div>
          )}

          {/* Assignments list */}
          {loading ? (
            <div className="space-y-3 mt-4">{[1,2,3].map(i => <div key={i} className="skeleton h-20" />)}</div>
          ) : assignments.length === 0 ? (
            <div className="mt-12 text-center">
              <div className="empty-icon"><Calendar size={40} style={{ color: "var(--muted)" }} /></div>
              <p className="font-bold" style={{ color: "var(--text)" }}>No assignments for {formatDate(date)}</p>
              <p className="text-sm mt-1" style={{ color: "var(--text2)" }}>Tap "Assign Crew" to schedule your team</p>
            </div>
          ) : (
            <div className="space-y-3 mt-4">
              {assignments.map(a => (
                <div key={a.memberId} className="card">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center text-base font-bold text-white" style={{ background: a.clockIn ? "var(--green)" : "var(--blue)" }}>
                        {a.memberName?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold" style={{ color: "var(--text)" }}>{a.memberName}</p>
                        <div className="flex items-center gap-2 text-xs mt-1">
                          <span className="flex items-center gap-1" style={{ color: "var(--text2)" }}><Briefcase size={12} />{a.jobName}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs mt-0.5">
                          {a.jobAddress && <span className="flex items-center gap-1" style={{ color: "var(--muted)" }}><MapPin size={12} />{a.jobAddress}</span>}
                          <span className="flex items-center gap-1" style={{ color: "var(--muted)" }}><Clock size={12} />{a.startTime}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {a.clockIn && <span className="badge badge-green text-[10px]">Clocked In</span>}
                      {a.clockOut && <span className="badge badge-purple text-[10px]">{a.hoursWorked}h</span>}
                      <button onClick={() => doRemove(a.memberId)} style={{ color: "var(--red)" }}><Trash2 size={14} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        /* Live Tracker */
        <div className="mt-4">
          <button onClick={loadTracker} className="btn btn-outline w-full mb-4">Refresh Tracker</button>
          {tracker.length === 0 ? (
            <div className="mt-12 text-center">
              <div className="empty-icon"><Users size={40} style={{ color: "var(--muted)" }} /></div>
              <p className="font-bold" style={{ color: "var(--text)" }}>No crew assigned today</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tracker.map(t => (
                <div key={t.memberId} className="card">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ background: t.clockIn && !t.clockOut ? "var(--green)" : t.clockOut ? "var(--muted)" : "var(--yellow)" }} />
                      <div>
                        <p className="font-bold" style={{ color: "var(--text)" }}>{t.memberName}</p>
                        <p className="text-xs" style={{ color: "var(--text2)" }}>{t.jobName}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {t.clockIn && !t.clockOut && <span className="badge badge-green">On Site</span>}
                      {t.clockOut && <span className="badge badge-purple">{t.hoursWorked}h</span>}
                      {!t.clockIn && <span className="badge badge-yellow">Not Started</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Assign Modal */}
      {showAssignModal && (
        <AssignModal crew={unassigned} jobs={jobs} onAssign={doAssign} onClose={() => setShowAssignModal(false)} />
      )}
    </AppShell>
  );
}

function AssignModal({ crew, jobs, onAssign, onClose }) {
  const [memberId, setMemberId] = useState("");
  const [jobId, setJobId] = useState("");
  const [startTime, setStartTime] = useState("7:00 AM");
  const times = ["6:00 AM", "6:30 AM", "7:00 AM", "7:30 AM", "8:00 AM", "8:30 AM", "9:00 AM", "10:00 AM"];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" style={{ background: "var(--bg)" }}>
      <div className="w-full max-w-lg mx-auto p-6 pb-24">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-extrabold" style={{ color: "var(--text)" }}>Assign Crew</h2>
          <button onClick={onClose} className="text-sm font-bold" style={{ color: "var(--brand)" }}>Cancel</button>
        </div>

        <div className="space-y-5">
          <div>
            <label className="field-label">Crew Member</label>
            <div className="space-y-2">
              {crew.map(m => (
                <button key={m.memberId} onClick={() => setMemberId(m.memberId)}
                  className="card w-full text-left transition-all"
                  style={{ borderColor: memberId === m.memberId ? "var(--brand)" : "var(--border)", borderWidth: "2px" }}>
                  <p className="font-bold" style={{ color: memberId === m.memberId ? "var(--brand)" : "var(--text)" }}>{m.name}</p>
                  <p className="text-xs" style={{ color: "var(--text2)" }}>{m.role} {m.hourlyRate ? `• $${m.hourlyRate}/hr` : ""}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="field-label">Job Site</label>
            <div className="space-y-2">
              {jobs.map(j => (
                <button key={j.jobId} onClick={() => setJobId(j.jobId)}
                  className="card w-full text-left transition-all"
                  style={{ borderColor: jobId === j.jobId ? "var(--brand)" : "var(--border)", borderWidth: "2px" }}>
                  <p className="font-bold" style={{ color: jobId === j.jobId ? "var(--brand)" : "var(--text)" }}>{j.jobName}</p>
                  {j.address && <p className="text-xs" style={{ color: "var(--text2)" }}><MapPin size={12} className="inline" /> {j.address}</p>}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="field-label">Start Time</label>
            <div className="grid grid-cols-4 gap-2">
              {times.map(t => (
                <button key={t} onClick={() => setStartTime(t)}
                  className="card text-center py-2 text-sm font-bold transition-all"
                  style={{ borderColor: startTime === t ? "var(--brand)" : "var(--border)", borderWidth: "2px", color: startTime === t ? "var(--brand)" : "var(--text2)" }}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          <button onClick={() => memberId && jobId && onAssign(memberId, jobId, startTime)}
            disabled={!memberId || !jobId}
            className="btn btn-brand w-full text-lg">
            Assign
          </button>
        </div>
      </div>
    </div>
  );
}
