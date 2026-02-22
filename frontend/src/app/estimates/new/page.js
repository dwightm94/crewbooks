"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { createEstimate } from "@/lib/api";
import { money } from "@/lib/utils";
import { Plus, Trash2 } from "lucide-react";

const emptyItem = () => ({ id: `item-${Date.now()}`, description: "", quantity: 1, unitPrice: 0 });

export default function NewEstimatePage() {
  const [form, setForm] = useState({
    clientName: "", clientEmail: "", clientPhone: "", clientAddress: "",
    jobDescription: "", notes: "", markupPercent: 0, taxPercent: 0, validUntil: "",
  });
  const [lineItems, setLineItems] = useState([emptyItem()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();
  const up = (f) => (e) => setForm({ ...form, [f]: e.target.value });

  const updateItem = (idx, field, value) => {
    const items = [...lineItems];
    items[idx] = { ...items[idx], [field]: value };
    setLineItems(items);
  };
  const removeItem = (idx) => setLineItems(lineItems.filter((_, i) => i !== idx));
  const addItem = () => setLineItems([...lineItems, emptyItem()]);

  const subtotal = lineItems.reduce((s, i) => s + (Number(i.quantity) || 0) * (Number(i.unitPrice) || 0), 0);
  const markup = subtotal * (Number(form.markupPercent) || 0) / 100;
  const tax = (subtotal + markup) * (Number(form.taxPercent) || 0) / 100;
  const total = subtotal + markup + tax;

  const submit = async (e) => {
    e.preventDefault(); setError(null); setSaving(true);
    try {
      await createEstimate({ ...form, lineItems });
      router.replace("/estimates");
    } catch (e) { setError(e.message); setSaving(false); }
  };

  return (
    <AppShell title="New Estimate" back="/estimates">
      <form onSubmit={submit} className="mt-4 space-y-5">
        {error && <div className="rounded-2xl p-4 text-sm font-semibold" style={{ background: "rgba(239,68,68,0.1)", color: "var(--red)" }}>{error}</div>}

        <section>
          <h3 className="section-title">Client Info</h3>
          <div className="space-y-3">
            <div><label className="field-label">Client Name *</label><input value={form.clientName} onChange={up("clientName")} placeholder="John Smith" className="field" required /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="field-label">Phone</label><input value={form.clientPhone} onChange={up("clientPhone")} placeholder="(555) 123-4567" className="field" type="tel" /></div>
              <div><label className="field-label">Email</label><input value={form.clientEmail} onChange={up("clientEmail")} placeholder="john@email.com" className="field" type="email" /></div>
            </div>
            <div><label className="field-label">Job Address</label><input value={form.clientAddress} onChange={up("clientAddress")} placeholder="123 Main St" className="field" /></div>
            <div><label className="field-label">Job Description</label><input value={form.jobDescription} onChange={up("jobDescription")} placeholder="Kitchen renovation, bathroom remodel..." className="field" /></div>
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between">
            <h3 className="section-title">Line Items</h3>
            <button type="button" onClick={addItem} className="text-sm font-bold flex items-center gap-1" style={{ color: "var(--brand)" }}><Plus size={14} />Add Item</button>
          </div>
          <div className="space-y-3">
            {lineItems.map((item, idx) => (
              <div key={item.id} className="card">
                <div className="flex items-start gap-2">
                  <div className="flex-1 space-y-2">
                    <input value={item.description} onChange={e => updateItem(idx, "description", e.target.value)}
                      placeholder="Describe work or materials..." className="field text-sm" />
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] font-bold" style={{ color: "var(--muted)" }}>QTY</label>
                        <input type="number" inputMode="decimal" value={item.quantity} onChange={e => updateItem(idx, "quantity", e.target.value)}
                          className="field text-sm text-center" min="0" step="any" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold" style={{ color: "var(--muted)" }}>PRICE</label>
                        <input type="number" inputMode="decimal" value={item.unitPrice} onChange={e => updateItem(idx, "unitPrice", e.target.value)}
                          className="field text-sm text-center" min="0" step="any" placeholder="$0" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold" style={{ color: "var(--muted)" }}>TOTAL</label>
                        <p className="field text-sm text-center font-bold" style={{ color: "var(--brand)" }}>
                          {money((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0))}
                        </p>
                      </div>
                    </div>
                  </div>
                  {lineItems.length > 1 && (
                    <button type="button" onClick={() => removeItem(idx)} className="p-2 mt-1" style={{ color: "var(--red)" }}><Trash2 size={16} /></button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h3 className="section-title">Pricing</h3>
          <div className="card space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: "var(--text2)" }}>Subtotal</span>
              <span className="font-bold" style={{ color: "var(--text)" }}>{money(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm" style={{ color: "var(--text2)" }}>Markup</span>
              <div className="flex items-center gap-2">
                <input type="number" inputMode="decimal" value={form.markupPercent} onChange={up("markupPercent")}
                  className="field w-24 text-sm text-center" min="0" step="any" />
                <span className="text-sm font-bold" style={{ color: "var(--text2)" }}>%</span>
                <span className="text-sm font-bold w-24 text-right" style={{ color: "var(--text)" }}>{money(markup)}</span>
              </div>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm" style={{ color: "var(--text2)" }}>Tax</span>
              <div className="flex items-center gap-2">
                <input type="number" inputMode="decimal" value={form.taxPercent} onChange={up("taxPercent")}
                  className="field w-24 text-sm text-center" min="0" step="any" />
                <span className="text-sm font-bold" style={{ color: "var(--text2)" }}>%</span>
                <span className="text-sm font-bold w-24 text-right" style={{ color: "var(--text)" }}>{money(tax)}</span>
              </div>
            </div>
            <div className="border-t pt-3 flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
              <span className="font-extrabold text-lg" style={{ color: "var(--text)" }}>Total</span>
              <span className="font-extrabold text-2xl" style={{ color: "var(--brand)" }}>{money(total)}</span>
            </div>
          </div>
        </section>

        <section>
          <h3 className="section-title">Additional</h3>
          <div className="space-y-3">
            <div><label className="field-label">Valid Until</label><input type="date" value={form.validUntil} onChange={up("validUntil")} className="field" /></div>
            <div><label className="field-label">Notes</label><textarea value={form.notes} onChange={up("notes")} placeholder="Payment terms, special conditions..." className="field" rows={3} /></div>
          </div>
        </section>

        <button type="submit" disabled={saving} className="btn btn-brand w-full text-lg">
          {saving ? "Creating..." : `Create Estimate — ${money(total)}`}
        </button>
      </form>
    </AppShell>
  );
}
