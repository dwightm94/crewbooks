"use client";
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { getJob, getExpenses, updateJob, createExpense, deleteExpense, createInvoice, sendInvoice, markInvoicePaid, getJobPhotos, uploadJobPhoto, deleteJobPhoto, getJobLogs, createJobLog } from "@/lib/api";
import { money, moneyExact, statusBadge, statusLabel, margin, marginColor, EXPENSE_CATEGORIES, relDate, INVOICE_STATUS } from "@/lib/utils";
import { Edit3, Trash2, Plus, Receipt, FileText, Camera, CheckCircle2, Send, DollarSign, MapPin, Phone, Mail, X, Image, ClipboardList, Sun, Cloud, CloudRain, Snowflake } from "lucide-react";

const TABS = ["overview", "expenses", "photos", "logs", "invoices"];

export default function JobDetailPage() {
  const { jobId } = useParams();
  const [job, setJob] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [logs, setLogs] = useState([]);
  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showLogForm, setShowLogForm] = useState(false);
  const router = useRouter();

  const load = async () => {
    try {
      const [j, e] = await Promise.all([getJob(jobId), getExpenses(jobId).catch(() => ({ expenses: [] }))]);
      const jobData = j.job || j;
      setJob(jobData);
      setExpenses(e.expenses || e || []);
      setInvoices(jobData.invoices || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const loadPhotos = async () => {
    try { const p = await getJobPhotos(jobId); setPhotos(p.photos || p || []); } catch {}
  };
  const loadLogs = async () => {
    try { const l = await getJobLogs(jobId); setLogs(l.logs || l || []); } catch {}
  };

  useEffect(() => { load(); }, [jobId]);
  useEffect(() => { if (tab === "photos") loadPhotos(); }, [tab]);
  useEffect(() => { if (tab === "logs") loadLogs(); }, [tab]);

  if (loading) return <AppShell title="Loading..."><div className="space-y-4 mt-4">{[1,2,3].map(i=><div key={i} className="skeleton h-24" />)}</div></AppShell>;
  if (!job) return <AppShell title="Job not found" back="/jobs"><p className="mt-8 text-center" style={{color:"var(--text2)"}}>This job doesn't exist.</p></AppShell>;

  const totalExpenses = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const m = margin(job.bidAmount, totalExpenses);
  const mPct = m.percent || 0;

  const markComplete = async () => { await updateJob(jobId, { ...job, status: "complete" }); load(); };
  const markPaid = async () => { await updateJob(jobId, { ...job, status: "paid" }); load(); };
  const genInvoice = async () => {
    try {
      const inv = await createInvoice(jobId, { amount: job.bidAmount, lineItems: [{ description: job.jobName, amount: job.bidAmount }] });
      setInvoices(prev => [...prev, inv]);
      setTab("invoices");
    } catch(e) { alert(e.message); }
  };

  return (
    <AppShell title={job.jobName} subtitle={job.clientName} back="/jobs"
      action={
        <div className="flex gap-2">
          {job.status === "active" && <button onClick={markComplete} className="btn btn-brand btn-sm"><CheckCircle2 size={16} />Complete</button>}
          {job.status === "complete" && <button onClick={markPaid} className="btn btn-brand btn-sm"><DollarSign size={16} />Paid</button>}
        </div>
      }>

      {/* Financial Summary Bar */}
      <div className="card mt-4">
        <div className="grid grid-cols-3 text-center divide-x" style={{ borderColor: "var(--border)" }}>
          <div className="py-2">
            <p className="text-xs font-semibold" style={{ color: "var(--muted)" }}>Bid</p>
            <p className="text-lg font-extrabold" style={{ color: "var(--text)" }}>{money(job.bidAmount)}</p>
          </div>
          <div className="py-2">
            <p className="text-xs font-semibold" style={{ color: "var(--muted)" }}>Spent</p>
            <p className="text-lg font-extrabold" style={{ color: "var(--red)" }}>{money(totalExpenses)}</p>
          </div>
          <div className="py-2">
            <p className="text-xs font-semibold" style={{ color: "var(--muted)" }}>Margin</p>
            <p className="text-lg font-extrabold" style={{ color: marginColor(mPct) }}>{mPct}%</p>
          </div>
        </div>
        <div className="mt-2 h-2 rounded-full" style={{ background: "var(--input)" }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, job.bidAmount > 0 ? (totalExpenses / job.bidAmount) * 100 : 0)}%`, background: "var(--brand)" }} />
        </div>
        <p className="text-xs mt-1 text-center" style={{ color: "var(--muted)" }}>{money(Math.max(0, (job.bidAmount || 0) - totalExpenses))} remaining of {money(job.bidAmount)} bid</p>
      </div>

      {/* Status */}
      <div className="flex items-center gap-2 mt-4">
        <span className={statusBadge(job.status)}>{statusLabel(job.status)}</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-0.5 mt-4 p-1 rounded-xl overflow-x-auto" style={{ background: "var(--input)" }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="flex-1 py-2 rounded-lg text-xs font-bold transition-all capitalize whitespace-nowrap px-2"
            style={{ background: tab === t ? "var(--card)" : "transparent", color: tab === t ? "var(--text)" : "var(--muted)", boxShadow: tab === t ? "0 1px 3px rgba(0,0,0,0.1)" : "none" }}>
            {t === "expenses" ? `Costs (${expenses.length})` : t === "photos" ? `Photos (${photos.length})` : t === "logs" ? `Logs (${logs.length})` : t}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mt-4">
        {tab === "overview" && <OverviewTab job={job} />}
        {tab === "expenses" && <ExpensesTab expenses={expenses} jobId={jobId} onAdd={() => setShowExpenseForm(true)} onRefresh={load} />}
        {tab === "photos" && <PhotosTab photos={photos} jobId={jobId} onRefresh={loadPhotos} />}
        {tab === "logs" && <LogsTab logs={logs} jobId={jobId} onAdd={() => setShowLogForm(true)} />}
        {tab === "invoices" && <InvoicesTab invoices={invoices} job={job} jobId={jobId} onGenerate={genInvoice} onRefresh={load} />}
      </div>

      {showExpenseForm && <ExpenseFormModal jobId={jobId} onClose={() => setShowExpenseForm(false)} onSaved={() => { setShowExpenseForm(false); load(); }} />}
      {showLogForm && <DailyLogModal jobId={jobId} onClose={() => setShowLogForm(false)} onSaved={() => { setShowLogForm(false); loadLogs(); }} />}
    </AppShell>
  );
}

// ===== OVERVIEW TAB =====
function OverviewTab({ job }) {
  return (
    <div className="space-y-4">
      {job.address && (
        <div className="card">
          <div className="flex items-start gap-3">
            <MapPin size={18} style={{ color: "var(--brand)", marginTop: 2 }} />
            <div>
              <p className="font-bold" style={{ color: "var(--text)" }}>{job.address}</p>
              <a href={`https://maps.google.com/?q=${encodeURIComponent(job.address)}`} target="_blank" className="text-sm" style={{ color: "var(--blue)" }}>Open in Maps →</a>
            </div>
          </div>
        </div>
      )}
      <div className="card">
        <h3 className="section-title">Client Info</h3>
        <div className="space-y-2">
          <p className="font-bold" style={{ color: "var(--text)" }}>{job.clientName}</p>
          {job.clientPhone && <a href={`tel:${job.clientPhone}`} className="flex items-center gap-2 text-sm" style={{ color: "var(--blue)" }}><Phone size={14} />{job.clientPhone}</a>}
          {job.clientEmail && <a href={`mailto:${job.clientEmail}`} className="flex items-center gap-2 text-sm" style={{ color: "var(--blue)" }}><Mail size={14} />{job.clientEmail}</a>}
        </div>
      </div>
      {job.notes && <div className="card"><h3 className="section-title">Notes</h3><p className="text-sm" style={{ color: "var(--text2)" }}>{job.notes}</p></div>}
    </div>
  );
}

// ===== EXPENSES TAB =====
function ExpensesTab({ expenses, jobId, onAdd, onRefresh }) {
  const byCategory = expenses.reduce((a, e) => { a[e.category] = (a[e.category] || 0) + Number(e.amount); return a; }, {});
  const total = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const doDelete = async (expenseId) => { if (confirm("Delete this expense?")) { await deleteExpense(jobId, expenseId); onRefresh(); } };

  return (
    <div className="space-y-4">
      <button onClick={onAdd} className="btn btn-brand w-full"><Plus size={18} />Add Expense</button>
      {Object.keys(byCategory).length > 0 && (
        <div className="card">
          <h3 className="section-title">Breakdown</h3>
          <div className="space-y-3">
            {EXPENSE_CATEGORIES.filter(c => byCategory[c.value]).map(cat => {
              const amt = byCategory[cat.value];
              const pct = total > 0 ? (amt / total) * 100 : 0;
              return (
                <div key={cat.value}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium" style={{ color: "var(--text)" }}>{cat.icon} {cat.label}</span>
                    <span className="font-bold" style={{ color: "var(--text)" }}>{money(amt)}</span>
                  </div>
                  <div className="h-2 rounded-full mt-1" style={{ background: "var(--input)" }}>
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "var(--brand)" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {expenses.length === 0 ? (
        <div className="text-center py-8"><DollarSign size={40} style={{ color: "var(--muted)", margin: "0 auto" }} /><p className="mt-2 font-medium" style={{ color: "var(--text2)" }}>No expenses yet</p></div>
      ) : (
        expenses.map(e => (
          <div key={e.expenseId || e.SK} className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold" style={{ color: "var(--text)" }}>{money(e.amount)}</p>
                <p className="text-sm" style={{ color: "var(--text2)" }}>{e.description || e.category}</p>
                <p className="text-xs" style={{ color: "var(--muted)" }}>{e.date}</p>
              </div>
              <button onClick={() => doDelete(e.expenseId)} style={{ color: "var(--red)" }}><Trash2 size={16} /></button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ===== PHOTOS TAB =====
const PHOTO_CATEGORIES = [
  { value: "before", label: "Before", icon: "📸" },
  { value: "during", label: "During", icon: "🔨" },
  { value: "after", label: "After", icon: "✅" },
  { value: "issues", label: "Issues", icon: "⚠️" },
];

function PhotosTab({ photos, jobId, onRefresh }) {
  const [uploading, setUploading] = useState(false);
  const [category, setCategory] = useState("during");
  const fileRef = useRef(null);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadJobPhoto(jobId, file.name, file.type, category);
      await fetch(res.uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
      onRefresh();
    } catch (err) { alert("Upload failed: " + err.message); }
    setUploading(false);
    e.target.value = "";
  };

  const doDeletePhoto = async (photoId) => {
    if (confirm("Delete this photo?")) {
      try { await deleteJobPhoto(jobId, photoId); onRefresh(); }
      catch (err) { alert("Delete failed: " + err.message); }
    }
  };

  const grouped = PHOTO_CATEGORIES.map(cat => ({
    ...cat,
    photos: photos.filter(p => p.category === cat.value),
  }));

  return (
    <div className="space-y-4">
      {/* Category selector */}
      <div className="grid grid-cols-4 gap-2">
        {PHOTO_CATEGORIES.map(cat => (
          <button key={cat.value} onClick={() => setCategory(cat.value)}
            className="card text-center py-2 transition-all"
            style={{ borderColor: category === cat.value ? "var(--brand)" : "var(--border)", borderWidth: "2px" }}>
            <span className="text-lg block">{cat.icon}</span>
            <span className="text-[10px] font-bold" style={{ color: category === cat.value ? "var(--brand)" : "var(--text2)" }}>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Upload button */}
      <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleUpload} className="hidden" />
      <button onClick={() => fileRef.current?.click()} disabled={uploading} className="btn btn-brand w-full">
        <Camera size={18} />{uploading ? "Uploading..." : `Add ${PHOTO_CATEGORIES.find(c => c.value === category)?.label} Photo`}
      </button>

      {/* Photo grid by category */}
      {grouped.filter(g => g.photos.length > 0).map(group => (
        <div key={group.value}>
          <h3 className="section-title">{group.icon} {group.label} ({group.photos.length})</h3>
          <div className="grid grid-cols-3 gap-2">
            {group.photos.map(p => (
              <div key={p.photoId} className="relative aspect-square rounded-xl overflow-hidden" style={{ background: "var(--input)" }}>
                <a href={p.url} target="_blank"><img src={p.url} alt="" className="w-full h-full object-cover" loading="lazy" /></a>
                <button onClick={() => doDeletePhoto(p.photoId)}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(0,0,0,0.6)" }}>
                  <X size={14} color="white" />
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      {photos.length === 0 && (
        <div className="text-center py-8">
          <Image size={40} style={{ color: "var(--muted)", margin: "0 auto" }} />
          <p className="mt-2 font-medium" style={{ color: "var(--text2)" }}>No photos yet</p>
          <p className="text-sm" style={{ color: "var(--muted)" }}>Tap the camera to document this job</p>
        </div>
      )}
    </div>
  );
}

// ===== DAILY LOGS TAB =====
function LogsTab({ logs, jobId, onAdd }) {
  const WEATHER_ICONS = { sunny: <Sun size={14} />, cloudy: <Cloud size={14} />, rainy: <CloudRain size={14} />, snowy: <Snowflake size={14} /> };

  return (
    <div className="space-y-4">
      <button onClick={onAdd} className="btn btn-brand w-full"><ClipboardList size={18} />Add Daily Log</button>
      {logs.length === 0 ? (
        <div className="text-center py-8">
          <ClipboardList size={40} style={{ color: "var(--muted)", margin: "0 auto" }} />
          <p className="mt-2 font-medium" style={{ color: "var(--text2)" }}>No daily logs yet</p>
          <p className="text-sm" style={{ color: "var(--muted)" }}>Document work performed each day</p>
        </div>
      ) : (
        logs.map(log => (
          <div key={log.logId || log.date} className="card">
            <div className="flex items-center justify-between mb-2">
              <p className="font-bold" style={{ color: "var(--text)" }}>
                {new Date(log.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
              </p>
              <div className="flex items-center gap-2">
                {log.weather && <span className="flex items-center gap-1 text-xs" style={{ color: "var(--text2)" }}>{WEATHER_ICONS[log.weather]}{log.weather}</span>}
                {log.hoursWorked > 0 && <span className="badge badge-blue text-[10px]">{log.hoursWorked}h</span>}
              </div>
            </div>
            {log.workPerformed && <p className="text-sm" style={{ color: "var(--text)" }}>{log.workPerformed}</p>}
            {log.materialsUsed && <p className="text-xs mt-1" style={{ color: "var(--text2)" }}>Materials: {log.materialsUsed}</p>}
            {log.issues && <p className="text-xs mt-1 font-semibold" style={{ color: "var(--red)" }}>⚠️ {log.issues}</p>}
            {log.crewOnSite?.length > 0 && <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>Crew: {log.crewOnSite.join(", ")}</p>}
          </div>
        ))
      )}
    </div>
  );
}

// ===== DAILY LOG FORM =====
function DailyLogModal({ jobId, onClose, onSaved }) {
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    weather: "sunny", workPerformed: "", materialsUsed: "",
    issues: "", hoursWorked: "", notes: "",
  });
  const [saving, setSaving] = useState(false);
  const up = (f) => (e) => setForm({ ...form, [f]: e.target.value });

  const submit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await createJobLog(jobId, { ...form, hoursWorked: Number(form.hoursWorked) || 0 });
      onSaved();
    } catch (err) { alert(err.message); setSaving(false); }
  };

  const weathers = [
    { value: "sunny", icon: "☀️", label: "Sunny" },
    { value: "cloudy", icon: "☁️", label: "Cloudy" },
    { value: "rainy", icon: "🌧️", label: "Rainy" },
    { value: "snowy", icon: "❄️", label: "Snowy" },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" style={{ background: "var(--bg)" }}>
      <div className="w-full max-w-lg mx-auto p-6 pb-24">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-extrabold" style={{ color: "var(--text)" }}>Daily Log</h2>
          <button onClick={onClose} className="text-sm font-bold" style={{ color: "var(--brand)" }}>Cancel</button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1"><label className="field-label">Date</label><input type="date" value={form.date} onChange={up("date")} className="field" /></div>
            <div className="w-20"><label className="field-label">Hours</label><input type="number" inputMode="decimal" value={form.hoursWorked} onChange={up("hoursWorked")} placeholder="8" className="field" /></div>
          </div>
          <div>
            <label className="field-label">Weather</label>
            <div className="grid grid-cols-4 gap-2">
              {weathers.map(w => (
                <button type="button" key={w.value} onClick={() => setForm({ ...form, weather: w.value })}
                  className="card text-center py-2 transition-all"
                  style={{ borderColor: form.weather === w.value ? "var(--brand)" : "var(--border)", borderWidth: "2px" }}>
                  <span className="text-lg block">{w.icon}</span>
                  <span className="text-[10px] font-bold" style={{ color: form.weather === w.value ? "var(--brand)" : "var(--text2)" }}>{w.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div><label className="field-label">Work Performed *</label><textarea value={form.workPerformed} onChange={up("workPerformed")} placeholder="What was done today?" className="field" rows={3} required /></div>
          <div><label className="field-label">Materials Used</label><input value={form.materialsUsed} onChange={up("materialsUsed")} placeholder="Lumber, copper pipe, etc." className="field" /></div>
          <div><label className="field-label">Issues / Concerns</label><textarea value={form.issues} onChange={up("issues")} placeholder="Any problems encountered?" className="field" rows={2} /></div>
          <button type="submit" disabled={saving} className="btn btn-brand w-full text-lg">{saving ? "Saving..." : "Save Daily Log"}</button>
        </form>
      </div>
    </div>
  );
}

// ===== INVOICES TAB =====
function InvoicesTab({ invoices, job, jobId, onGenerate, onRefresh }) {
  const doSend = async (invoiceId) => { try { await sendInvoice(jobId, invoiceId); onRefresh(); } catch(e) { alert(e.message); } };
  const doPay = async (invoiceId) => { try { await markInvoicePaid(jobId, invoiceId); onRefresh(); } catch(e) { alert(e.message); } };
  return (
    <div className="space-y-4">
      {job.status === "complete" && invoices.length === 0 && (
        <button onClick={onGenerate} className="btn btn-brand w-full"><FileText size={18} />Generate Invoice</button>
      )}
      {invoices.length === 0 ? (
        <div className="text-center py-8">
          <FileText size={40} style={{ color: "var(--muted)", margin: "0 auto" }} />
          <p className="mt-2 font-medium" style={{ color: "var(--text2)" }}>No invoices yet</p>
          <p className="text-sm" style={{ color: "var(--muted)" }}>Mark the job as complete to generate one</p>
        </div>
      ) : (
        invoices.map(inv => {
          const st = INVOICE_STATUS[inv.status] || INVOICE_STATUS.draft;
          return (
            <div key={inv.invoiceId} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-lg" style={{ color: "var(--text)" }}>{money(inv.amount)}</p>
                  <span className={st.badge + " mt-1"}>{st.label}</span>
                  {inv.dueDate && <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>Due: {inv.dueDate}</p>}
                </div>
                <div className="flex gap-2">
                  {inv.status === "draft" && <button onClick={() => doSend(inv.invoiceId)} className="btn btn-brand btn-sm"><Send size={14} />Send</button>}
                  {inv.status === "sent" && <button onClick={() => doPay(inv.invoiceId)} className="btn btn-brand btn-sm"><DollarSign size={14} />Mark Paid</button>}
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

// ===== EXPENSE FORM MODAL =====
function ExpenseFormModal({ jobId, onClose, onSaved }) {
  const [form, setForm] = useState({ description: "", amount: "", category: "materials", date: new Date().toISOString().split("T")[0] });
  const [saving, setSaving] = useState(false);
  const up = (f) => (e) => setForm({ ...form, [f]: e.target.value });

  const submit = async (e) => {
    e.preventDefault(); setSaving(true);
    try { await createExpense(jobId, { ...form, amount: Number(form.amount) }); onSaved(); }
    catch { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" style={{ background: "var(--bg)" }} onClick={e => e.stopPropagation()}>
      <div className="w-full max-w-lg mx-auto p-6 pb-24">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-extrabold" style={{ color: "var(--text)" }}>Add Expense</h2>
          <button onClick={onClose} className="p-2 rounded-xl" style={{ color: "var(--muted)" }}><X size={24} /></button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div><label className="field-label">Amount ($) *</label><input type="number" inputMode="decimal" value={form.amount} onChange={up("amount")} placeholder="0.00" className="field text-2xl font-bold" required autoFocus /></div>
          <div><label className="field-label">Category</label>
            <div className="grid grid-cols-3 gap-2">
              {EXPENSE_CATEGORIES.map(cat => (
                <button type="button" key={cat.value} onClick={() => setForm({ ...form, category: cat.value })}
                  className="card text-center py-3 transition-all"
                  style={{ borderColor: form.category === cat.value ? "var(--brand)" : "var(--border)", borderWidth: "2px" }}>
                  <span className="text-xl block">{cat.icon}</span>
                  <span className="text-xs font-bold" style={{ color: form.category === cat.value ? "var(--brand)" : "var(--text2)" }}>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div><label className="field-label">Description</label><input value={form.description} onChange={up("description")} placeholder="What was it for?" className="field" /></div>
          <div><label className="field-label">Date</label><input type="date" value={form.date} onChange={up("date")} className="field" /></div>
          <button type="submit" disabled={saving} className="btn btn-brand w-full text-lg">{saving ? "Saving..." : "Add Expense"}</button>
        </form>
      </div>
    </div>
  );
}
