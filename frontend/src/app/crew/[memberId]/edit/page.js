"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { getCrewMember, updateCrewMember } from "@/lib/api";
const ROLES = ["Electrician", "Plumber", "Carpenter", "Laborer", "Foreman", "Apprentice", "HVAC Tech", "Painter", "Mason", "Roofer", "Other"];
export default function EditCrewMemberPage() {
  const { memberId } = useParams();
  const [form, setForm] = useState({ name: "", phone: "", role: "", hourlyRate: "" });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();
  useEffect(() => {
    async function load() {
      try {
        const res = await getCrewMember(memberId);
        const m = res.data || res;
        setForm({
          name: m.name || "",
          phone: m.phone || "",
          role: m.role || "",
          hourlyRate: m.hourlyRate ? String(m.hourlyRate) : ""
        });
      } catch (e) { setError("Could not load crew member"); }
      setLoading(false);
    }
    load();
  }, [memberId]);
  const up = (f) => (e) => setForm({ ...form, [f]: e.target.value });
  const submit = async (e) => {
    e.preventDefault(); setError(null); setSaving(true);
    try {
      await updateCrewMember(memberId, { ...form, hourlyRate: Number(form.hourlyRate) || 0 });
      router.replace("/crew");
    } catch (e) { setError(e.message); setSaving(false); }
  };
  if (loading) return <AppShell title="Edit Crew Member" back="/crew"><div className="mt-10 text-center" style={{ color: "var(--text2)" }}>Loading...</div></AppShell>;
  return (
    <AppShell title="Edit Crew Member" back="/crew">
      <form onSubmit={submit} className="mt-4 space-y-5">
        {error && <div className="rounded-2xl p-4 text-sm font-semibold" style={{ background: "var(--red-bg)", color: "var(--red)" }}>{error}</div>}
        <section>
          <h3 className="section-title">Person</h3>
          <div className="space-y-3">
            <div><label className="field-label">Name *</label><input value={form.name} onChange={up("name")} placeholder="Mike Johnson" className="field" required /></div>
            <div><label className="field-label">Phone</label><input type="tel" value={form.phone} onChange={up("phone")} placeholder="(555) 123-4567" className="field" /></div>
          </div>
        </section>
        <section>
          <h3 className="section-title">Role & Pay</h3>
          <div className="space-y-3">
            <div>
              <label className="field-label">Role</label>
              <div className="grid grid-cols-3 gap-2">
                {ROLES.map(r => (
                  <button type="button" key={r} onClick={() => setForm({ ...form, role: r })}
                    className="card text-center py-3 transition-all text-sm"
                    style={{ borderColor: form.role === r ? "var(--brand)" : "var(--border)", borderWidth: "2px" }}>
                    <span className="font-bold" style={{ color: form.role === r ? "var(--brand)" : "var(--text2)" }}>{r}</span>
                  </button>
                ))}
              </div>
            </div>
            <div><label className="field-label">Hourly Rate ($)</label><input type="number" inputMode="decimal" value={form.hourlyRate} onChange={up("hourlyRate")} placeholder="25.00" className="field text-xl font-bold" /></div>
          </div>
        </section>
        <button type="submit" disabled={saving} className="btn btn-brand w-full text-lg">
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </AppShell>
  );
}
