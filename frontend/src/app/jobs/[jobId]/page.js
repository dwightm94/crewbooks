"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { DollarSign, Plus, Send, CheckCircle, Trash2, MapPin, Phone, Mail } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { useJobs } from "@/hooks/useJobs";
import { createInvoice, sendInvoice, markInvoicePaid } from "@/lib/api";
import { formatMoney, statusBadge, statusLabel, calcMargin, marginColor, categoryIcons, formatPhone } from "@/lib/utils";

export default function JobDetailPage() {
  const { jobId } = useParams(); const router = useRouter();
  const { currentJob: job, expenses, loading, fetchJob, fetchExpenses, updateJob, addExpense, removeExpense } = useJobs();
  const [showForm, setShowForm] = useState(false);
  const [expForm, setExpForm] = useState({ description:"", amount:"", category:"materials" });
  const [busy, setBusy] = useState(false);

  useEffect(() => { fetchJob(jobId); fetchExpenses(jobId); }, [jobId]);

  if (loading && !job) return <div className="px-4 max-w-lg mx-auto"><PageHeader title="Loading..." backHref="/jobs" /><div className="space-y-4 mt-4">{[1,2,3].map(i=><div key={i} className="skeleton h-24 rounded-2xl" />)}</div></div>;
  if (!job) return <div className="px-4 max-w-lg mx-auto"><PageHeader title="Not Found" backHref="/jobs" /></div>;

  const margin = calcMargin(job.bidAmount, job.actualCost);
  const remaining = (job.bidAmount || 0) - (job.actualCost || 0);

  async function handleStatus(s) { setBusy(true); await updateJob(jobId, { status: s }); setBusy(false); }
  async function handleInvoice() { setBusy(true); try { const inv = await createInvoice(jobId, { amount: job.bidAmount }); await sendInvoice(jobId, inv.invoiceId); alert("Invoice sent!"); } catch (e) { alert(e.message); } setBusy(false); }
  async function handlePaid() { setBusy(true); try { const inv = await createInvoice(jobId, { amount: job.bidAmount }); await markInvoicePaid(jobId, inv.invoiceId); alert("Marked paid!"); } catch (e) { alert(e.message); } setBusy(false); }
  async function handleAddExp(e) { e.preventDefault(); await addExpense(jobId, {...expForm, amount: parseFloat(expForm.amount)}); setExpForm({ description:"", amount:"", category:"materials" }); setShowForm(false); }

  return (
    <div className="px-4 max-w-lg mx-auto">
      <PageHeader title={job.jobName} subtitle={job.clientName} backHref="/jobs" />
      {/* Status + contact */}
      <div className="card mt-4">
        <div className="flex items-center justify-between mb-3"><span className={statusBadge(job.status)}>{statusLabel(job.status)}</span>{job.address && <span className="text-xs text-navy-400 flex items-center gap-1"><MapPin size={12} />{job.address}</span>}</div>
        <div className="flex gap-3">{job.clientPhone && <a href={`tel:${job.clientPhone}`} className="btn-secondary text-sm flex-1"><Phone size={16} />{formatPhone(job.clientPhone)}</a>}{job.clientEmail && <a href={`mailto:${job.clientEmail}`} className="btn-secondary text-sm flex-1"><Mail size={16} />Email</a>}</div>
      </div>
      {/* Financials */}
      <div className="card mt-4">
        <h3 className="text-sm font-semibold text-navy-400 uppercase tracking-wider mb-3">Financials</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div><p className="text-xs text-navy-400">Bid</p><p className="text-lg font-bold text-white">{formatMoney(job.bidAmount)}</p></div>
          <div><p className="text-xs text-navy-400">Spent</p><p className="text-lg font-bold text-red-400">{formatMoney(job.actualCost)}</p></div>
          <div><p className="text-xs text-navy-400">Left</p><p className={`text-lg font-bold ${remaining >= 0 ? "text-green-400" : "text-red-400"}`}>{formatMoney(remaining)}</p></div>
        </div>
        {job.bidAmount > 0 && <div className="mt-4"><div className="flex justify-between text-xs mb-1"><span className="text-navy-400">Budget used</span><span className={marginColor(margin)}>{margin.toFixed(1)}%</span></div><div className="h-3 bg-navy-700 rounded-full overflow-hidden"><div className={`h-full rounded-full ${margin >= 20 ? "bg-green-500" : margin >= 10 ? "bg-amber-500" : "bg-red-500"}`} style={{width: `${Math.min(100, (job.actualCost/job.bidAmount)*100)}%`}} /></div></div>}
      </div>
      {/* Actions */}
      <div className="grid grid-cols-2 gap-3 mt-4">
        {job.status === "bidding" && <button onClick={() => handleStatus("active")} disabled={busy} className="btn-primary"><CheckCircle size={18} />Start Job</button>}
        {job.status === "active" && <button onClick={() => handleStatus("complete")} disabled={busy} className="btn-primary"><CheckCircle size={18} />Complete</button>}
        {["active","complete"].includes(job.status) && <button onClick={handleInvoice} disabled={busy} className="btn-primary"><Send size={18} />Send Invoice</button>}
        {["active","complete"].includes(job.status) && <button onClick={handlePaid} disabled={busy} className="btn-secondary"><DollarSign size={18} />Mark Paid</button>}
      </div>
      {/* Expenses */}
      <div className="mt-6 mb-8">
        <div className="flex items-center justify-between mb-3"><h3 className="text-lg font-bold text-white">Expenses</h3><button onClick={() => setShowForm(!showForm)} className="text-brand-500 text-sm font-semibold flex items-center gap-1"><Plus size={16} />Add</button></div>
        {showForm && <form onSubmit={handleAddExp} className="card mb-3 space-y-3"><input type="text" value={expForm.description} onChange={e=>setExpForm({...expForm, description:e.target.value})} placeholder="What?" className="input-field" required /><div className="flex gap-3"><input type="number" value={expForm.amount} onChange={e=>setExpForm({...expForm, amount:e.target.value})} placeholder="$ Amount" className="input-field flex-1" required min="0.01" step="0.01" /><select value={expForm.category} onChange={e=>setExpForm({...expForm, category:e.target.value})} className="input-field flex-1"><option value="materials">🧱 Materials</option><option value="labor">👷 Labor</option><option value="equipment">🔧 Equipment</option><option value="subcontractor">🤝 Sub</option><option value="permits">📋 Permits</option><option value="other">📦 Other</option></select></div><button type="submit" className="btn-primary w-full">Add Expense</button></form>}
        {expenses?.expenses?.length > 0 ? <div className="space-y-2">{expenses.expenses.map(exp => (<div key={exp.expenseId} className="card flex items-center justify-between"><div className="flex items-center gap-3"><span className="text-xl">{categoryIcons[exp.category]||"📦"}</span><div><p className="font-medium text-white text-sm">{exp.description}</p><p className="text-xs text-navy-400 capitalize">{exp.category}</p></div></div><div className="flex items-center gap-2"><p className="font-bold text-white">{formatMoney(exp.amount)}</p><button onClick={() => removeExpense(jobId, exp.expenseId)} className="text-navy-500 p-1"><Trash2 size={14} /></button></div></div>))}<div className="card bg-navy-700/50 flex justify-between"><span className="text-navy-300 font-medium">Total</span><span className="font-bold text-white">{formatMoney(expenses.total)}</span></div></div> : <div className="text-center py-8 text-navy-400"><p>No expenses yet</p></div>}
      </div>
    </div>
  );
}
