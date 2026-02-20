"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getPublicInvoice } from "@/lib/api";
import { moneyExact } from "@/lib/utils";
import { Hammer, CheckCircle2 } from "lucide-react";

export default function PublicInvoicePage() {
  const { invoiceId } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { getPublicInvoice(invoiceId).then(setInvoice).catch(() => {}).finally(() => setLoading(false)); }, [invoiceId]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-10 h-10 border-4 rounded-full animate-spin" style={{ borderColor: "#F59E0B", borderTopColor: "transparent" }} /></div>;
  if (!invoice) return <div className="min-h-screen flex items-center justify-center text-center p-6"><p className="text-xl font-bold text-gray-600">Invoice not found</p></div>;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-md mx-auto bg-white rounded-3xl shadow-xl overflow-hidden">
        <div className="bg-amber-500 p-6 text-center text-white">
          <Hammer size={32} className="mx-auto mb-2" />
          <h1 className="text-2xl font-extrabold">CrewBooks Invoice</h1>
        </div>
        <div className="p-6">
          <div className="text-center mb-6">
            <p className="text-sm text-gray-500">Amount Due</p>
            <p className="text-5xl font-extrabold text-gray-900 mt-1">{moneyExact(invoice.amount)}</p>
            {invoice.status === "paid" && <div className="flex items-center justify-center gap-2 mt-3 text-green-600 font-bold"><CheckCircle2 size={20} />PAID</div>}
          </div>
          <div className="space-y-3 text-sm">
            {invoice.jobName && <Row label="Job" value={invoice.jobName} />}
            {invoice.clientName && <Row label="Bill To" value={invoice.clientName} />}
            {invoice.dueDate && <Row label="Due Date" value={new Date(invoice.dueDate).toLocaleDateString()} />}
            {invoice.sentAt && <Row label="Sent" value={new Date(invoice.sentAt).toLocaleDateString()} />}
          </div>
          {invoice.lineItems?.length > 0 && (
            <div className="mt-6">
              <p className="font-bold text-sm text-gray-700 mb-2">Line Items</p>
              {invoice.lineItems.map((item, i) => (
                <div key={i} className="flex justify-between py-2 border-t border-gray-100"><span className="text-gray-600">{item.description}</span><span className="font-bold">{moneyExact(item.amount)}</span></div>
              ))}
            </div>
          )}
          {invoice.notes && <div className="mt-6 p-4 bg-gray-50 rounded-xl text-sm text-gray-600">{invoice.notes}</div>}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return <div className="flex justify-between py-2 border-b border-gray-100"><span className="text-gray-500">{label}</span><span className="font-semibold text-gray-900">{value}</span></div>;
}
