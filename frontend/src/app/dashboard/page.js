"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import {
  Plus, AlertTriangle, TrendingUp, Briefcase, DollarSign, Clock,
  ArrowRight, MapPin, Users, Play, CheckCircle, Send, Camera,
  FileText, AlertCircle, Phone, MessageSquare, Navigation
} from "lucide-react";
import { getDashboard } from "@/lib/api";
import { usePlan } from "@/hooks/usePlan";
import { UpgradePrompt } from "@/components/UpgradePrompt";
import { money, moneyCompact, statusBadge, statusLabel, overdueSeverity, margin, marginColor, relDate } from "@/lib/utils";

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [showUpgrade, setShowUpgrade] = useState(null);
  const [view, setView] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("cb_active_job");
      if (saved) return "job";
    }
    return "day";
  });
  const [seconds, setSeconds] = useState(() => {
    if (typeof window !== "undefined") {
      const start = localStorage.getItem("cb_job_start");
      if (start) return Math.floor((Date.now() - parseInt(start)) / 1000);
    }
    return 0;
  });
  const [activeJob, setActiveJob] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("cb_active_job");
      if (saved) try { return JSON.parse(saved); } catch {}
    }
    return null;
  });
  const timerRef = useRef(null);
  const router = useRouter();
  const { canDo } = usePlan();
  useEffect(() => {
    getDashboard()
      .then(setData)
      .catch(e => { console.error(e); setErr(e.message); })
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    if (view === "job" && activeJob) {
      if (!localStorage.getItem("cb_job_start")) {
        localStorage.setItem("cb_job_start", Date.now().toString());
      }
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        const start = parseInt(localStorage.getItem("cb_job_start") || Date.now());
        setSeconds(Math.floor((Date.now() - start) / 1000));
      }, 1000);
      return () => clearInterval(timerRef.current);
    }
  }, [view, activeJob]);
  const handleNewJob = () => {
    const check = canDo("create_job");
    if (!check.allowed) { setShowUpgrade(check.message); return; }
    router.push("/jobs/new");
  };
  const startJob = (job) => {
    localStorage.setItem("cb_active_job", JSON.stringify(job));
    localStorage.setItem("cb_job_start", Date.now().toString());
    setActiveJob(job);
    setView("job");
    setSeconds(0);
  };
  const completeJob = () => {
    clearInterval(timerRef.current);
    localStorage.removeItem("cb_active_job");
    localStorage.removeItem("cb_job_start");
    setView("done");
  };
  const backToDay = () => { setView("day"); setActiveJob(null); };

  const fmt = (s) => {
    const h = String(Math.floor(s/3600)).padStart(2,"0");
    const m = String(Math.floor((s%3600)/60)).padStart(2,"0");
    const sec = String(s%60).padStart(2,"0");
    return h+":"+m+":"+sec;
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const dayName = new Date().toLocaleDateString("en-US", { weekday:"long", month:"short", day:"numeric" });

  const addBtn = <button onClick={handleNewJob} className="btn btn-brand btn-sm"><Plus size={18}/>New Job</button>;

  return (
    <AppShell
      title={view === "day" ? "CrewBooks" : view === "job" ? "Active Job" : "Job Complete"}
      action={view === "day" ? addBtn : undefined}
      subtitle={view === "job" ? fmt(seconds) : undefined}
    >
      {showUpgrade && <UpgradePrompt message={showUpgrade} onClose={() => setShowUpgrade(null)} />}
      {loading ? (
        <div className="space-y-4 mt-4">{[1,2,3].map(i=><div key={i} className="skeleton h-28"/>)}</div>
      ) : err || !data ? (
        <EmptyState onNewJob={handleNewJob} />
      ) : (
        <>
          {view === "day" && <MyDay data={data} router={router} greeting={greeting} dayName={dayName} onStart={startJob} onNewJob={handleNewJob} />}
          {view === "job" && activeJob && <ActiveJob job={activeJob} secs={seconds} fmt={fmt} onComplete={completeJob} router={router} />}
          {view === "done" && activeJob && <JobDone job={activeJob} secs={seconds} fmt={fmt} data={data} onBack={backToDay} router={router} />}
        </>
      )}
    </AppShell>
  );
}

function EmptyState({ onNewJob }) {
  return (
    <div className="mt-16 text-center">
      <div className="empty-icon"><Briefcase size={40} style={{color:"var(--muted)"}}/></div>
      <h2 className="text-2xl font-extrabold mb-2" style={{color:"var(--text)"}}>No jobs yet</h2>
      <p className="mb-8 text-base" style={{color:"var(--text2)"}}>Create your first job to start tracking money.</p>
      <button onClick={onNewJob} className="btn btn-brand mx-auto"><Plus size={20}/>Create First Job</button>
    </div>
  );
}

function MyDay({ data, router, greeting, dayName, onStart, onNewJob }) {
  const { totalOwed=0, totalOverdue=0, totalEarned=0, paidThisMonth=0, counts={}, overdueInvoices=[], recentJobs:rawJobs=[], profitability={} } = data;
  const recentJobs = rawJobs.filter(j => j.jobName);
  const activeJobs = recentJobs.filter(j => j.status==="active" || j.status==="in_progress");
  const currentJob = activeJobs[0];
  const upcomingJobs = recentJobs.filter(j => j.jobId !== currentJob?.jobId).slice(0,4);

  return (
    <div className="mt-4 space-y-5">
      <div>
        <h2 className="text-2xl font-extrabold" style={{color:"var(--text)",letterSpacing:"-0.02em"}}>{greeting}</h2>
        <p className="text-sm mt-1" style={{color:"var(--muted)"}}>{dayName} · {recentJobs.length} job{recentJobs.length!==1?"s":""}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { val: moneyCompact(totalOwed), label: "Owed", color: "var(--brand)" },
          { val: moneyCompact(paidThisMonth), label: "Month", color: "var(--green)" },
          { val: counts.active||0, label: "Active", color: "var(--text)" },
          { val: (profitability?.avgMargin||profitability?.marginPercent||0)+"%", label: "Margin", color: "var(--text)" },
        ].map((s,i) => (
          <div key={i} className="card text-center py-3 px-2">
            <p className="text-lg font-extrabold" style={{color:s.color}}>{s.val}</p>
            <p className="text-[10px] font-bold uppercase" style={{color:"var(--muted)"}}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Current Job or Owed Card */}
      {currentJob ? (
        <div className="rounded-2xl p-5 relative overflow-hidden" style={{background:"var(--card)",border:"2px solid var(--brand)",boxShadow:"0 4px 20px rgba(224,138,13,0.1)"}}>
          <div style={{position:"absolute",top:-40,right:-40,width:120,height:120,borderRadius:"50%",background:"var(--brand-light)",opacity:0.5}}/>
          <div className="relative">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold text-white mb-3" style={{background:"var(--brand)"}}>
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"/> Up Next
            </div>
            <h3 className="text-xl font-extrabold" style={{color:"var(--text)"}}>{currentJob.jobName}</h3>
            <p className="text-sm mt-1" style={{color:"var(--text2)"}}>{currentJob.clientName}</p>
            <div className="flex items-center justify-between mt-4 pt-4" style={{borderTop:"1px solid var(--border)"}}>
              <p className="text-2xl font-extrabold" style={{color:"var(--text)"}}>{money(currentJob.bidAmount)}</p>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => onStart(currentJob)} className="btn btn-brand flex-1"><Play size={16}/> Start Job</button>
              <button onClick={() => router.push("/jobs/"+currentJob.jobId)} className="btn btn-outline flex-1">View Details</button>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-3xl p-6 text-center" style={{background:"linear-gradient(135deg, var(--brand), var(--brand-hover))"}}>
          <p className="text-sm font-bold uppercase tracking-wider text-white/80">You're Owed</p>
          <p className="text-5xl font-extrabold text-white mt-1 tracking-tight">{money(totalOwed)}</p>
          {totalOverdue > 0 && (
            <div className="flex items-center justify-center gap-1.5 mt-3 bg-white/20 rounded-full px-4 py-1.5 mx-auto w-fit">
              <AlertTriangle size={16} className="text-white"/><span className="text-sm font-bold text-white">{money(totalOverdue)} overdue</span>
            </div>
          )}
        </div>
      )}

      {/* Overdue */}
      {overdueInvoices.length > 0 && (
        <section>
          <h2 className="section-title flex items-center gap-2"><AlertTriangle size={14} style={{color:"var(--red)"}}/>Overdue</h2>
          <div className="space-y-2">
            {overdueInvoices.slice(0,2).map(inv => {
              const sev = overdueSeverity(inv.daysOverdue);
              return (
                <button key={inv.invoiceId} onClick={() => router.push("/jobs/"+inv.jobId)} className="card-hover w-full text-left">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-sm" style={{color:"var(--text)"}}>{inv.clientName}</p>
                      <span className="inline-flex items-center gap-1 text-xs font-bold mt-1" style={{color:sev.color}}><Clock size={11}/>{inv.daysOverdue}d overdue</span>
                    </div>
                    <p className="text-lg font-extrabold" style={{color:sev.color}}>{money(inv.amount)}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Upcoming Jobs */}
      {upcomingJobs.length > 0 && (
        <section>
          <div className="flex items-center justify-between">
            <h2 className="section-title">{currentJob ? "Other Jobs" : "Recent Jobs"}</h2>
            <button onClick={() => router.push("/jobs")} className="text-sm font-bold flex items-center gap-1" style={{color:"var(--brand)"}}>See All <ArrowRight size={14}/></button>
          </div>
          <div className="card overflow-hidden" style={{padding:0}}>
            {upcomingJobs.map((job,i) => (
              <button key={job.jobId} onClick={() => router.push("/jobs/"+job.jobId)}
                className="w-full text-left flex items-center gap-3 px-4 py-3 transition-colors hover:bg-[var(--bg2)]"
                style={{borderBottom:i<upcomingJobs.length-1?"1px solid var(--border)":"none"}}>
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{background:job.status==="active"||job.status==="in_progress"?"var(--green)":job.status==="bidding"?"var(--blue)":"var(--brand)"}}/>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate" style={{color:"var(--text)"}}>{job.jobName}</p>
                  <p className="text-xs truncate" style={{color:"var(--muted)"}}>{job.clientName}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-extrabold text-sm" style={{color:"var(--text)"}}>{money(job.bidAmount)}</p>
                  <span className={statusBadge(job.status)+" text-[10px] mt-0.5"}>{statusLabel(job.status)}</span>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function ActiveJob({ job, secs, fmt, onComplete, router }) {
  return (
    <div className="space-y-4 mt-4">
      <div className="card overflow-hidden" style={{padding:0}}>
        <div className="flex items-center justify-between px-5 py-3" style={{background:"var(--brand-light)"}}>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold text-white" style={{background:"var(--brand)"}}>
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"/> In Progress
          </span>
          <span className="text-lg font-extrabold" style={{color:"var(--text)",fontVariantNumeric:"tabular-nums"}}>{fmt(secs)}</span>
        </div>
        <div className="p-5">
          <h2 className="text-2xl font-extrabold" style={{color:"var(--text)",letterSpacing:"-0.02em"}}>{job.jobName}</h2>
          <p className="text-sm mt-1 mb-4" style={{color:"var(--text2)"}}>{job.clientName}</p>
          <div className="flex items-center justify-between pt-4" style={{borderTop:"1px solid var(--border)"}}>
            <span className="text-sm" style={{color:"var(--muted)"}}>Job Value</span>
            <span className="text-2xl font-extrabold" style={{color:"var(--text)"}}>{money(job.bidAmount)}</span>
          </div>
        </div>
      </div>

        <a href={job.clientPhone ? "tel:"+job.clientPhone : "#"} className="card flex items-center justify-center gap-2" style={{padding:"12px 8px",textDecoration:"none"}}>
          <Phone size={16} style={{color:"var(--text2)"}}/><span className="text-xs font-bold" style={{color:"var(--text)"}}>Call</span>
        </a>
        <a href={job.clientPhone ? "sms:"+job.clientPhone : "#"} className="card flex items-center justify-center gap-2" style={{padding:"12px 8px",textDecoration:"none"}}>
          <MessageSquare size={16} style={{color:"var(--text2)"}}/><span className="text-xs font-bold" style={{color:"var(--text)"}}>Text</span>
        </a>
        <a href={job.address ? "https://maps.google.com/?q="+encodeURIComponent(job.address) : "#"} target="_blank" className="card flex items-center justify-center gap-2" style={{padding:"12px 8px",textDecoration:"none"}}>
          <Navigation size={16} style={{color:"var(--text2)"}}/><span className="text-xs font-bold" style={{color:"var(--text)"}}>Navigate</span>
        </a>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => router.push("/jobs/"+job.jobId+"#photos")} className="card-hover text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background:"var(--brand-light)"}}><Camera size={20} style={{color:"var(--brand)"}}/></div>
            <div><p className="font-bold text-sm" style={{color:"var(--text)"}}>Photo</p><p className="text-xs" style={{color:"var(--muted)"}}>Log progress</p></div>
          </div>
        </button>
        <button onClick={() => router.push("/jobs/"+job.jobId)} className="card-hover text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background:"var(--green-bg)"}}><Clock size={20} style={{color:"var(--green)"}}/></div>
            <div><p className="font-bold text-sm" style={{color:"var(--text)"}}>Log Time</p><p className="text-xs" style={{color:"var(--muted)"}}>Track hours</p></div>
          </div>
        </button>
        <button onClick={() => router.push("/jobs/"+job.jobId)} className="card-hover text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background:"var(--blue-bg)"}}><FileText size={20} style={{color:"var(--blue)"}}/></div>
            <div><p className="font-bold text-sm" style={{color:"var(--text)"}}>Note</p><p className="text-xs" style={{color:"var(--muted)"}}>Add details</p></div>
          </div>
        </button>
        <button onClick={() => router.push("/jobs/"+job.jobId)} className="card-hover text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background:"var(--red-bg)"}}><AlertCircle size={20} style={{color:"var(--red)"}}/></div>
            <div><p className="font-bold text-sm" style={{color:"var(--text)"}}>Issue</p><p className="text-xs" style={{color:"var(--muted)"}}>Flag problem</p></div>
          </div>
        </button>
      </div>
      <button onClick={onComplete} className="btn w-full text-base font-bold" style={{background:"var(--green)",color:"#fff",boxShadow:"0 3px 12px rgba(47,142,62,0.2)"}}>
        <CheckCircle size={20}/> Mark Job Complete
      </button>
      <button onClick={() => router.push("/jobs/"+job.jobId)} className="btn btn-outline w-full">View Full Job Details</button>
    </div>
  );
}

function JobDone({ job, secs, data, onBack, router }) {
  const mins = Math.floor(secs/60);
  const hrs = Math.floor(secs/3600);
  const timeLabel = hrs > 0 ? hrs+"h "+(mins%60)+"m" : mins+"m";

  return (
    <div className="space-y-4 mt-4">
      <div className="text-center mb-2">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3" style={{background:"var(--green-bg)"}}><CheckCircle size={32} style={{color:"var(--green)"}}/></div>
        <h2 className="text-2xl font-extrabold" style={{color:"var(--text)"}}>Job Complete!</h2>
        <p className="text-sm mt-1" style={{color:"var(--muted)"}}>{job.jobName} · {timeLabel}</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {[
          {val:money(job.bidAmount),label:"Earned",color:"var(--green)"},
          {val:timeLabel,label:"Time",color:"var(--text)"},
          {val:money(data?.totalOwed||0),label:"Outstanding",color:"var(--brand)"},
          {val:moneyCompact(data?.paidThisMonth||0),label:"This Month",color:"var(--text)"},
        ].map((s,i)=>(
          <div key={i} className="card text-center py-4">
            <p className="text-2xl font-extrabold" style={{color:s.color}}>{s.val}</p>
            <p className="text-xs font-bold uppercase mt-1" style={{color:"var(--muted)"}}>{s.label}</p>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden" style={{padding:0}}>
        <div className="px-4 py-3 font-bold text-sm" style={{borderBottom:"1px solid var(--border)",color:"var(--text)"}}>Job Summary</div>
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <p className="font-bold text-sm" style={{color:"var(--text)"}}>{job.jobName}</p>
            <p className="text-xs" style={{color:"var(--muted)"}}>{job.clientName} · {money(job.bidAmount)}</p>
          </div>
          <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{background:"var(--green-bg)"}}><CheckCircle size={14} style={{color:"var(--green)"}}/></div>
        </div>
      </div>

      <button onClick={() => router.push("/jobs/"+job.jobId)} className="btn btn-brand w-full text-base"><Send size={18}/> Send Invoice — {money(job.bidAmount)}</button>
      <button onClick={onBack} className="btn btn-outline w-full">Back to My Day</button>
    </div>
  );
}
