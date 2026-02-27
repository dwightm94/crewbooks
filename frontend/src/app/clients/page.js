"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { getClients, createClient, updateClient, deleteClient } from "@/lib/api";
import { usePlan } from "@/hooks/usePlan";
import { ProGate } from "@/components/ProGate";
import { Users, Phone, Mail, MapPin, Clock, Plus, X, Edit2, Trash2, ChevronDown, ChevronUp, Search } from "lucide-react";

export default function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [expanded, setExpanded] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "", notes: "" });
  const { features } = usePlan();

  useEffect(() => { load(); }, []);

  const load = () => {
    setLoading(true);
    getClients().then(setClients).catch(console.error).finally(() => setLoading(false));
  };

  const openAdd = () => { setForm({ name: "", phone: "", email: "", address: "", notes: "" }); setEditingClient(null); setShowForm(true); };
  const openEdit = (c) => { setForm({ name: c.name, phone: c.phone || "", email: c.email || "", address: c.address || "", notes: c.notes || "" }); setEditingClient(c); setShowForm(true); };

  const save = async () => {
    if (!form.name.trim()) return alert("Client name is required");
    setSaving(true);
    try {
      if (editingClient) { await updateClient(editingClient.clientId, form); }
      else { await createClient(form); }
      setShowForm(false);
      load();
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  };

  const remove = async (clientId) => {
    if (!confirm("Delete this client?")) return;
    await deleteClient(clientId);
    load();
  };

  const daysSince = (dateStr) => {
    if (!dateStr) return null;
    return Math.floor((new Date() - new Date(dateStr)) / 86400000);
  };

  const filtered = clients.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone && c.phone.includes(search)) ||
      (c.email && c.email.toLowerCase().includes(search.toLowerCase()));
    if (filter === "followup") return matchSearch && (daysSince(c.updatedAt) > 90);
    return matchSearch;
  });

  if (!features.clientCRM) return (
    <AppShell title="Clients">
      <ProGate feature="Client CRM" title="Manage Your Clients" description="Keep track of all your clients, contact info, and job history. Upgrade to Pro to unlock." />
    </AppShell>
  );

  return (
    <AppShell title="Clients" subtitle={`${clients.length} clients`}
      action={<button onClick={openAdd} className="btn-primary flex items-center gap-1"><Plus size={16} />Add Client</button>}>
      <div className="flex gap-2 mt-4">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text2)" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search clients..." className="input w-full pl-8 text-sm" />
        </div>
        <select value={filter} onChange={e => setFilter(e.target.value)} className="input text-sm" style={{ width: "auto" }}>
          <option value="all">All</option>
          <option value="followup">Needs Follow-up</option>
        </select>
      </div>
      {loading ? (
        <div className="space-y-3 mt-4">{[1,2,3].map(i => <div key={i} className="skeleton h-20" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="mt-16 text-center">
          <Users size={40} style={{ color: "var(--muted)", margin: "0 auto" }} />
          <h2 className="text-2xl font-extrabold mb-2 mt-4" style={{ color: "var(--text)" }}>{clients.length === 0 ? "No clients yet" : "No results"}</h2>
          <p style={{ color: "var(--text2)" }}>{clients.length === 0 ? "Add your first client to get started." : "Try a different search."}</p>
        </div>
      ) : (
        <div className="space-y-3 mt-4">
          {filtered.map(c => {
            const days = daysSince(c.updatedAt);
            const needsFollowUp = days !== null && days > 90;
            const isExpanded = expanded === c.clientId;
            return (
              <div key={c.clientId} className="card" style={needsFollowUp ? { borderLeft: "4px solid var(--brand)" } : {}}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style={{ background: "var(--brand)" }}>
                      {c.name[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold truncate" style={{ color: "var(--text)" }}>{c.name}</p>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        {c.phone && <a href={`tel:${c.phone}`} className="flex items-center gap-1 text-xs font-semibold" style={{ color: "var(--blue)" }}><Phone size={11} />{c.phone}</a>}
                        {c.email && <a href={`mailto:${c.email}`} className="flex items-center gap-1 text-xs font-semibold" style={{ color: "var(--blue)" }}><Mail size={11} />{c.email}</a>}
                        {c.address && <span className="flex items-center gap-1 text-xs" style={{ color: "var(--text2)" }}><MapPin size={11} />{c.address}</span>}
                      </div>
                      {needsFollowUp && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full mt-1 inline-block" style={{ background: "rgba(251,191,36,0.15)", color: "var(--brand)" }}>
                          <Clock size={10} className="inline mr-1" />{days}d since last activity — follow up!
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg" style={{ background: "var(--input)", color: "var(--text2)" }}><Edit2 size={14} /></button>
                    <button onClick={() => remove(c.clientId)} className="p-1.5 rounded-lg" style={{ background: "var(--input)", color: "var(--red)" }}><Trash2 size={14} /></button>
                    <button onClick={() => setExpanded(isExpanded ? null : c.clientId)} className="p-1.5 rounded-lg" style={{ background: "var(--input)", color: "var(--text2)" }}>
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>
                </div>
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t" style={{ borderColor: "var(--border)" }}>
                    {c.notes && <div className="mb-3 p-2 rounded-lg text-sm" style={{ background: "var(--input)", color: "var(--text2)" }}>📝 {c.notes}</div>}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="p-2 rounded-lg" style={{ background: "var(--input)" }}>
                        <p className="text-xs" style={{ color: "var(--text2)" }}>Added</p>
                        <p className="font-semibold" style={{ color: "var(--text)" }}>{new Date(c.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="p-2 rounded-lg" style={{ background: "var(--input)" }}>
                        <p className="text-xs" style={{ color: "var(--text2)" }}>Last Updated</p>
                        <p className="font-semibold" style={{ color: "var(--text)" }}>{new Date(c.updatedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-lg rounded-t-2xl p-6 pb-8" style={{ background: "var(--card)" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-extrabold" style={{ color: "var(--text)" }}>{editingClient ? "Edit Client" : "Add Client"}</h2>
              <button onClick={() => setShowForm(false)}><X size={20} style={{ color: "var(--text2)" }} /></button>
            </div>
            <div className="space-y-3">
              <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Client name *" className="input w-full" />
              <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="Phone number" className="input w-full" type="tel" />
              <input value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="Email address" className="input w-full" type="email" />
              <input value={form.address} onChange={e => setForm({...form, address: e.target.value})} placeholder="Address" className="input w-full" />
              <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Notes (e.g. slow payer, referred by John...)" className="input w-full" rows={3} />
            </div>
            <button onClick={save} disabled={saving} className="btn-primary w-full mt-4">{saving ? "Saving..." : editingClient ? "Save Changes" : "Add Client"}</button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
