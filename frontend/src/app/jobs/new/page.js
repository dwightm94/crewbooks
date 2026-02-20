"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { useJobs } from "@/hooks/useJobs";
export default function NewJobPage() {
  const [form, setForm] = useState({ jobName:"", clientName:"", clientPhone:"", clientEmail:"", address:"", bidAmount:"", notes:"" });
  const { createJob, loading, error } = useJobs();
  const router = useRouter();
  const update = (f) => (e) => setForm({...form, [f]: e.target.value});
  const handleSubmit = async (e) => { e.preventDefault(); const job = await createJob({...form, bidAmount: parseFloat(form.bidAmount) || 0}); if (job) router.replace(`/jobs/${job.jobId}`); };
  return (
    <div className="px-4 max-w-lg mx-auto">
      <PageHeader title="New Job" backHref="/jobs" />
      {error && <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm mt-4">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4 mt-4 mb-8">
        <div><label className="block text-sm text-navy-300 mb-1.5">Job Name *</label><input type="text" value={form.jobName} onChange={update("jobName")} placeholder="Kitchen remodel..." className="input-field" required /></div>
        <div><label className="block text-sm text-navy-300 mb-1.5">Client Name *</label><input type="text" value={form.clientName} onChange={update("clientName")} placeholder="John Smith" className="input-field" required /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="block text-sm text-navy-300 mb-1.5">Phone</label><input type="tel" value={form.clientPhone} onChange={update("clientPhone")} placeholder="(555) 123-4567" className="input-field" /></div>
          <div><label className="block text-sm text-navy-300 mb-1.5">Email</label><input type="email" value={form.clientEmail} onChange={update("clientEmail")} placeholder="john@email.com" className="input-field" /></div>
        </div>
        <div><label className="block text-sm text-navy-300 mb-1.5">Job Address</label><input type="text" value={form.address} onChange={update("address")} placeholder="123 Oak St, Clifton NJ" className="input-field" /></div>
        <div><label className="block text-sm text-navy-300 mb-1.5">Bid Amount ($)</label><input type="number" value={form.bidAmount} onChange={update("bidAmount")} placeholder="8000" className="input-field" min="0" step="0.01" /></div>
        <div><label className="block text-sm text-navy-300 mb-1.5">Notes</label><textarea value={form.notes} onChange={update("notes")} placeholder="Details..." className="input-field min-h-[80px]" rows={3} /></div>
        <button type="submit" disabled={loading} className="btn-primary w-full text-lg mt-6">{loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Create Job"}</button>
      </form>
    </div>
  );
}
