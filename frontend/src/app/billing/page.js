"use client";
import { usePlan } from "@/hooks/usePlan";
import { ProGate } from "@/components/ProGate";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { getJobs, getInvoices, createInvoice, sendInvoice, markInvoicePaid, deleteInvoice } from "@/lib/api";
import { money, statusBadge, statusLabel, INVOICE_STATUS } from "@/lib/utils";
import { DollarSign, CheckCircle2, Send, FileText, Trash2, Plus, Clock, Filter } from "lucide-react";

const FILTERS = ["all", "draft", "sent", "paid"];

export default function BillingPage() {
  const [jobs, setJobs] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const { features } = usePlan();
  const [showGenerate, setShowGenerate] = useState(false);
  const router = useRouter();

  const loadAll = async () => {
    try {
      const jobRes = await getJobs();
      const jobList = jobRes.jobs || jobRes || [];
      setJobs(jobList);
      // Fetch invoices for all jobs in parallel
      const invResults = await Promise.allSettled(
        jobList.map(j => getInvoices(j.jobId).then(r => (r.invoices || r || []).map(inv => ({ ...inv, jobName: inv.jobName || j.jobName, clientName: inv.clientName || j.clientName }))))
      );
      const allInv = invResults.flatMap(r => r.status === "fulfilled" ? r.value : []);
      // Sort by date, newest first
      allInv.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
      setInvoices(allInv);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { loadAll(); }, []);

  const filtered = filter === "all" ? invoices : invoices.filter(i => i.status === filter);

  const totalOwed = invoices.filter(i => i.status === "sent" || i.status === "draft" || i.status === "viewed").reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const totalPaid = invoices.filter(i => i.status === "paid").reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const totalDraft = invoices.filter(i => i.status === "draft").length;
  const totalSent = invoices.filter(i => i.status === "sent" || i.status === "viewed").length;

  const doSend = async (jobId, invoiceId) => {
    try { await sendInvoice(jobId, invoiceId); alert("Invoice sent!"); loadAll(); } catch(e) { alert("Send failed: " + e.message); }
  };
  const doPay = async (jobId, invoiceId) => {
    try { await markInvoicePaid(jobId, invoiceId); loadAll(); } catch(e) { alert(e.message); }
  };
  const doDelete = async (jobId, invoiceId) => {
    if (confirm("Delete this invoice? This cannot be undone.")) {
      try { await deleteInvoice(jobId, invoiceId); loadAll(); } catch(e) { alert(e.message); }
    }
  };
  const doGenerate = async (job) => {
    try {
      const notes = prompt("Add notes for the invoice (optional):", "") || "";
      await createInvoice(job.jobId, { amount: job.bidAmount, lineItems: [{ description: job.jobName, amount: job.bidAmount }], notes });
      setShowGenerate(false);
      loadAll();
    } catch(e) { alert(e.message); }
  };

  if (!features.invoicePDF) return (<AppShell title="Billing"><ProGate feature="Invoicing" title="Send Professional Invoices" description="Create PDF invoices, email them to clients, track payment status, and send reminders. Upgrade to Pro to unlock." /></AppShell>);

  return (
    <AppShell title="Billing" subtitle="Invoices & Payments">
      {/* Revenue Summary */}
      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="card text-center py-5">
          <DollarSign size={22} style={{ color: "var(--brand)", margin: "0 auto" }} />
          <p className="text-2xl font-extrabold mt-1" style={{ color: "var(--text)" }}>{money(totalOwed)}</p>
          <p className="text-xs font-semibold" style={{ color: "var(--muted)" }}>Outstanding</p>
          {totalDraft > 0 && <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>{totalDraft} draft · {totalSent} sent</p>}
        </div>
        <div className="card text-center py-5">
          <CheckCircle2 size={22} style={{ color: "var(--green)", margin: "0 auto" }} />
          <p className="text-2xl font-extrabold mt-1" style={{ color: "var(--text)" }}>{money(totalPaid)}</p>
          <p className="text-xs font-semibold" style={{ color: "var(--muted)" }}>Collected</p>
        </div>
      </div>

      {/* Quick Generate Button */}
      <button onClick={() => setShowGenerate(!showGenerate)} className="btn btn-brand w-full mt-4">
        <Plus size={18} />New Invoice
      </button>

      {/* Job Picker for Generate */}
      {showGenerate && (
        <div className="card mt-2 max-h-64 overflow-y-auto">
          <p className="text-xs font-bold mb-2" style={{ color: "var(--muted)" }}>SELECT A JOB</p>
          {jobs.filter(j => j.status !== "paid").length === 0 ? (
            <p className="text-sm py-4 text-center" style={{ color: "var(--text2)" }}>No unbilled jobs available</p>
          ) : (
            jobs.filter(j => j.status !== "paid").map(j => (
              <button key={j.jobId} onClick={() => doGenerate(j)} className="w-full text-left p-3 rounded-xl hover:bg-[var(--input)] transition-all flex justify-between items-center">
                <div>
                  <p className="font-bold text-sm" style={{ color: "var(--text)" }}>{j.jobName}</p>
                  <p className="text-xs" style={{ color: "var(--text2)" }}>{j.clientName}</p>
                </div>
                <p className="font-bold" style={{ color: "var(--brand)" }}>{money(j.bidAmount)}</p>
              </button>
            ))
          )}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 mt-4 p-1 rounded-xl" style={{ background: "var(--input)" }}>
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="flex-1 py-2 rounded-lg text-xs font-bold transition-all capitalize"
            style={{ background: filter === f ? "var(--card)" : "transparent", color: filter === f ? "var(--text)" : "var(--muted)", boxShadow: filter === f ? "0 1px 3px rgba(0,0,0,0.1)" : "none" }}>
            {f === "all" ? `All (${invoices.length})` : `${f} (${invoices.filter(i => i.status === f).length})`}
          </button>
        ))}
      </div>

      {/* Invoice List */}
      {loading ? (
        <div className="space-y-3 mt-4">{[1,2,3].map(i=><div key={i} className="skeleton h-24" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="mt-12 text-center">
          <FileText size={40} style={{ color: "var(--muted)", margin: "0 auto" }} />
          <p className="font-bold mt-2" style={{ color: "var(--text)" }}>{filter === "all" ? "No invoices yet" : `No ${filter} invoices`}</p>
          <p className="text-sm mt-1" style={{ color: "var(--text2)" }}>Tap "New Invoice" to create one</p>
        </div>
      ) : (
        <div className="space-y-2 mt-4">
          {filtered.map(inv => {
            const st = INVOICE_STATUS[inv.status] || INVOICE_STATUS.draft;
            return (
              <div key={inv.invoiceId} className="card">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-extrabold text-lg" style={{ color: "var(--text)" }}>{money(inv.amount)}</p>
                      <span className={st.badge}>{st.label}</span>
                    </div>
                    <p className="font-bold text-sm mt-1" style={{ color: "var(--text)" }}>{inv.clientName}</p>
                    <p className="text-xs" style={{ color: "var(--text2)" }}>{inv.jobName}</p>
                    <div className="flex flex-wrap gap-x-3 mt-1.5">
                      {inv.createdAt && <p className="text-xs" style={{ color: "var(--muted)" }}>Created: {new Date(inv.createdAt).toLocaleDateString()}</p>}
                      {inv.sentAt && <p className="text-xs" style={{ color: "var(--muted)" }}>Sent: {new Date(inv.sentAt).toLocaleDateString()}</p>}
                      {inv.paidAt && <p className="text-xs" style={{ color: "var(--green)" }}>Paid: {new Date(inv.paidAt).toLocaleDateString()}</p>}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 ml-2 shrink-0">
                    <button onClick={() => window.open(process.env.NEXT_PUBLIC_API_URL + "/invoice-pdf/" + inv.invoiceId)} className="btn btn-outline btn-sm"><FileText size={14} />PDF</button>
                    {inv.status === "draft" && <button onClick={() => doSend(inv.jobId, inv.invoiceId)} className="btn btn-brand btn-sm"><Send size={14} />Send</button>}
                    {inv.status === "sent" && <button onClick={() => doSend(inv.jobId, inv.invoiceId)} className="btn btn-outline btn-sm"><Send size={14} />Resend</button>}
                    {(inv.status === "sent" || inv.status === "viewed") && <button onClick={() => doPay(inv.jobId, inv.invoiceId)} className="btn btn-brand btn-sm"><DollarSign size={14} />Paid</button>}
                    <button onClick={() => doDelete(inv.jobId, inv.invoiceId)} className="btn btn-outline btn-sm" style={{ color: "var(--red)", borderColor: "var(--red)" }}><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
