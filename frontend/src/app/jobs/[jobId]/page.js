"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { getJob, getExpenses, updateJob, deleteJob, createExpense, deleteExpense, createInvoice, sendInvoice, markInvoicePaid } from "@/lib/api";
import { money, moneyExact, statusBadge, statusLabel, margin, marginColor, EXPENSE_CATEGORIES, relDate, INVOICE_STATUS } from "@/lib/utils";
import { Edit3, Trash2, Plus, Receipt, FileText, Camera, CheckCircle2, Send, DollarSign, MapPin, Phone, Mail, X } from "lucide-react";

const TABS = ["overview", "expenses", "invoices"];

export default function JobDetailPage() {
  const { jobId } = useParams();
  const [job, setJob] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
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
  useEffect(() => { load(); }, [jobId]);

  if (loading) return <AppShell title="Loading..."><div className="space-y-4 mt-4">{[1,2,3].map(i=><div key={i} className="skeleton h-24" />)}</div></AppShell>;
  if (!job) return <AppShell title="Job not found" back="/jobs"><p className="mt-8 text-center" style={{color:"var(--text2)"}}>This job doesn't exist.</p></AppShell>;

  const totalExpenses = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const m = margin(job.bidAmount, totalExpenses);

  const markComplete = async () => { await updateJob(jobId, { ...job, status: "complete" }); load(); };
  const markPaid = async () => { await updateJob(jobId, { ...job, status: "paid" }); load(); };
  const changeStatus = async (newStatus) => { await updateJob(jobId, { ...job, status: newStatus }); load(); };
  const doDeleteJob = async () => {
    if (confirm("Are you sure you want to delete this job? This will also delete all expenses and invoices for this job. This cannot be undone.")) {
      try { await deleteJob(jobId); router.replace("/jobs"); } catch(e) { alert(e.message); }
    }
  };
  const FREE_INVOICE_LIMIT = 3;
  const genInvoice = async () => {
    if (invoices.length >= FREE_INVOICE_LIMIT) { alert("Free plan allows 3 invoices/month. Upgrade to Pro for unlimited."); return; }
    try {
      // Build line items: service + all expenses
      const lineItems = [{ description: job.jobName, amount: job.bidAmount || 0 }];
      if (expenses.length > 0) {
        expenses.forEach(e => {
          lineItems.push({ description: (e.category || "Expense") + (e.description ? " — " + e.description : ""), amount: e.amount || 0 });
        });
      }
      const totalAmount = lineItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
      const notes = prompt("Add notes or description for the invoice (optional):", "") || "";
      const inv = await createInvoice(jobId, { amount: totalAmount, lineItems, notes });
      setInvoices(prev => [...prev, inv]);
      setTab("invoices");
    } catch(e) { alert(e.message); }
  };

  return (
    <AppShell title={job.jobName} subtitle={job.clientName} back="/jobs"
      action={
        <div className="flex items-center gap-2">
          <button onClick={() => router.push(`/jobs/${jobId}/edit`)} className="p-2 rounded-lg" style={{ color: "var(--brand)" }}><Edit3 size={20} /></button>
          <button onClick={doDeleteJob} className="p-2 rounded-lg" style={{ color: "var(--red)" }}><Trash2 size={20} /></button>
          <select value={job.status} onChange={e => changeStatus(e.target.value)}
            className="field text-sm font-bold py-1 px-2" style={{ minWidth: 110, color: "var(--text)" }}>
            <option value="bid">Bid</option>
            <option value="active">Active</option>
            <option value="complete">Complete</option>
            <option value="paid">Paid</option>
          </select>
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
            <p className="text-lg font-extrabold" style={{ color: marginColor(m.percent) }}>{m.percent}%</p>
          </div>
        </div>
        {/* Progress bar */}
        <div className="mt-3 h-3 rounded-full overflow-hidden" style={{ background: "var(--input)" }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${Math.min((totalExpenses / (job.bidAmount || 1)) * 100, 100)}%`, background: marginColor(m.percent) }} />
        </div>
        <p className="text-xs mt-2 text-center font-semibold" style={{ color: "var(--text2)" }}>
          {money(m.amount)} remaining of {money(job.bidAmount)} bid
        </p>
      </div>

      {/* Status + Quick Actions */}
      <div className="flex items-center gap-2 mt-4">
        <span className={statusBadge(job.status)}>{statusLabel(job.status)}</span>
        {job.status === "complete" && (
          <button onClick={genInvoice} className="btn btn-outline btn-sm ml-auto"><FileText size={16} />Generate Invoice</button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mt-4 p-1 rounded-xl" style={{ background: "var(--input)" }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="flex-1 py-2.5 rounded-lg text-sm font-bold transition-all capitalize"
            style={{ background: tab === t ? "var(--card)" : "transparent", color: tab === t ? "var(--text)" : "var(--muted)", boxShadow: tab === t ? "0 1px 3px rgba(0,0,0,0.1)" : "none" }}>
            {t} {t === "expenses" ? `(${expenses.length})` : ""}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mt-4">
        {tab === "overview" && <OverviewTab job={job} />}
        {tab === "expenses" && <ExpensesTab expenses={expenses} jobId={jobId} onAdd={() => setShowExpenseForm(true)} onRefresh={load} />}
        {tab === "invoices" && <InvoicesTab invoices={invoices} job={job} jobId={jobId} onGenerate={genInvoice} onRefresh={load} />}
      </div>

      {/* Expense Form Modal */}
      {showExpenseForm && <ExpenseFormModal jobId={jobId} onClose={() => setShowExpenseForm(false)} onSaved={() => { setShowExpenseForm(false); load(); }} />}
    </AppShell>
  );
}

function OverviewTab({ job }) {
  return (
    <div className="space-y-4">
      {job.address && (
        <div className="card">
          <div className="flex items-start gap-3">
            <MapPin size={18} style={{ color: "var(--brand)", marginTop: 2 }} />
            <div>
              <p className="text-xs font-semibold" style={{ color: "var(--muted)" }}>Address</p>
              <p className="font-semibold" style={{ color: "var(--text)" }}>{job.address}</p>
            </div>
          </div>
        </div>
      )}
      <div className="card">
        <h3 className="section-title">Client</h3>
        <p className="font-bold text-lg" style={{ color: "var(--text)" }}>{job.clientName}</p>
        {job.clientPhone && <a href={`tel:${job.clientPhone}`} className="flex items-center gap-2 mt-2 font-medium" style={{ color: "var(--blue)" }}><Phone size={16} />{job.clientPhone}</a>}
        {job.clientEmail && <a href={`mailto:${job.clientEmail}`} className="flex items-center gap-2 mt-2 font-medium" style={{ color: "var(--blue)" }}><Mail size={16} />{job.clientEmail}</a>}
      </div>
      {job.notes && (
        <div className="card">
          <h3 className="section-title">Notes</h3>
          <p className="whitespace-pre-wrap" style={{ color: "var(--text2)" }}>{job.notes}</p>
        </div>
      )}
      {job.startDate && (
        <div className="card">
          <h3 className="section-title">Schedule</h3>
          <p style={{ color: "var(--text)" }}>Started: {new Date(job.startDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
        </div>
      )}
    </div>
  );
}

function ExpensesTab({ expenses, jobId, onAdd, onRefresh }) {
  const byCategory = expenses.reduce((a, e) => {
    const cat = e.category || "other";
    a[cat] = (a[cat] || 0) + (Number(e.amount) || 0);
    return a;
  }, {});
  const total = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const doDelete = async (expenseId) => { if (confirm("Delete this expense?")) { await deleteExpense(jobId, expenseId); onRefresh(); } };

  return (
    <div className="space-y-4">
      <button onClick={onAdd} className="btn btn-brand w-full"><Plus size={18} />Add Expense</button>

      {/* Category breakdown */}
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

      {/* Expense list */}
      {expenses.length === 0 ? (
        <div className="text-center py-8">
          <Receipt size={40} style={{ color: "var(--muted)", margin: "0 auto" }} />
          <p className="mt-2 font-medium" style={{ color: "var(--text2)" }}>No expenses yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {expenses.map(exp => {
            const cat = EXPENSE_CATEGORIES.find(c => c.value === exp.category) || EXPENSE_CATEGORIES[5];
            return (
              <div key={exp.expenseId || exp.SK} className="card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{cat.icon}</span>
                    <div>
                      <p className="font-semibold" style={{ color: "var(--text)" }}>{exp.description || cat.label}</p>
                      <p className="text-xs" style={{ color: "var(--muted)" }}>{relDate(exp.date || exp.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-bold" style={{ color: "var(--text)" }}>{money(exp.amount)}</p>
                    <button onClick={() => doDelete(exp.expenseId || exp.SK?.split("#")[1])} style={{ color: "var(--red)" }}><Trash2 size={16} /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

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
                  <button onClick={() => window.open(process.env.NEXT_PUBLIC_API_URL + "/invoice-pdf/" + inv.invoiceId)} className="btn btn-outline btn-sm"><FileText size={14} />PDF</button>
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
