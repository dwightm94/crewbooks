"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { getClients, createClient, updateClient, deleteClient, getJobs } from "@/lib/api";
import { usePlan } from "@/hooks/usePlan";
import { ProGate } from "@/components/ProGate";
import { Users, Phone, Mail, MapPin, Clock, Plus, X, Edit2, Trash2, ChevronDown, ChevronUp, Search, UserPlus } from "lucide-react";

const AVATAR_COLORS = [
  { bg: "linear-gradient(135deg, #FFF0CC, #FFE0A0)", color: "#C47D0A" },
  { bg: "#DBEAFE", color: "#2563EB" },
  { bg: "#DCFCE7", color: "#16A34A" },
  { bg: "#F3E8FF", color: "#9333EA" },
  { bg: "#FFE4E6", color: "#E11D48" },
];

function getAvatarStyle(name = "") {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

export default function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [expanded, setExpanded] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [saving, setSaving] = useState(false);
  const [allJobs, setAllJobs] = useState([]);
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "", city: "", state: "", zip: "", notes: "" });
  const { features } = usePlan();

  useEffect(() => { load(); }, []);

  const load = () => {
    setLoading(true);
    Promise.all([getClients(), getJobs()])
      .then(([cls, jobs]) => { setClients(cls); setAllJobs(jobs || []); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const openAdd = () => {
    setForm({ name: "", phone: "", email: "", address: "", city: "", state: "", zip: "", notes: "" });
    setEditingClient(null);
    setShowForm(true);
  };

  const openEdit = (c) => {
    setForm({ name: c.name, phone: c.phone || "", email: c.email || "", address: c.address || "", city: c.city || "", state: c.state || "", zip: c.zip || "", notes: c.notes || "" });
    setEditingClient(c);
    setShowForm(true);
  };

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

  const totalOutstanding = allJobs.filter(j => j.status !== "paid").reduce((s, j) => s + (Number(j.bidAmount) || 0), 0);
  const totalCollected = allJobs.filter(j => j.status === "paid").reduce((s, j) => s + (Number(j.bidAmount) || 0), 0);

  if (!features.clientCRM) return (
    <AppShell title="Clients">
      <ProGate feature="Client CRM" title="Manage Your Clients" description="Keep track of all your clients, contact info, and job history. Upgrade to Pro to unlock." />
    </AppShell>
  );

  return (
    <AppShell
      title="Clients"
      subtitle={`${clients.length} client${clients.length !== 1 ? "s" : ""}`}
      action={
        <button onClick={openAdd} style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 14px", borderRadius:10, background:"var(--text)", color:"#fff", fontSize:13, fontWeight:700, border:"none", cursor:"pointer", fontFamily:"inherit" }}>
          <Plus size={14} strokeWidth={2.5} />Add Client
        </button>
      }
    >
      {/* Stats strip */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginTop:16, marginBottom:12 }}>
        {[
          { label: "Clients", val: clients.length, color: "var(--text)" },
          { label: "Outstanding", val: "$" + (totalOutstanding >= 1000 ? (totalOutstanding/1000).toFixed(1)+"k" : totalOutstanding.toLocaleString()), color: "var(--brand)" },
          { label: "Collected", val: "$" + (totalCollected >= 1000 ? (totalCollected/1000).toFixed(1)+"k" : totalCollected.toLocaleString()), color: "var(--green)" },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding:"10px 12px", textAlign:"center" }}>
            <p style={{ fontSize:18, fontWeight:800, color:s.color, letterSpacing:"-0.02em" }}>{s.val}</p>
            <p style={{ fontSize:10, fontWeight:600, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"0.05em", marginTop:2 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search row */}
      <div style={{ display:"flex", gap:8, marginBottom:14 }}>
        <div style={{ flex:1, position:"relative" }}>
          <Search size={14} style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"var(--muted)" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search clients…" className="input" style={{ width:"100%", paddingLeft:36, fontSize:13 }} />
        </div>
        <select value={filter} onChange={e => setFilter(e.target.value)} className="input" style={{ width:"auto", fontSize:13 }}>
          <option value="all">All</option>
          <option value="followup">Follow-up</option>
        </select>
      </div>

      {/* List */}
      {loading ? (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height:72 }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ marginTop:64, textAlign:"center" }}>
          <Users size={40} style={{ color:"var(--muted)", margin:"0 auto" }} />
          <h2 style={{ fontSize:22, fontWeight:800, color:"var(--text)", marginTop:16, marginBottom:6 }}>
            {clients.length === 0 ? "No clients yet" : "No results"}
          </h2>
          <p style={{ color:"var(--text2)", fontSize:14 }}>
            {clients.length === 0 ? "Add your first client to get started." : "Try a different search."}
          </p>
          {clients.length === 0 && (
            <button onClick={openAdd} className="btn btn-brand" style={{ margin:"20px auto 0" }}>
              <Plus size={18} />Add First Client
            </button>
          )}
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {filtered.map((c) => {
            const days = daysSince(c.updatedAt);
            const needsFollowUp = days !== null && days > 90;
            const isExpanded = expanded === c.clientId;
            const av = getAvatarStyle(c.name);
            const clientJobs = allJobs.filter(j => j.clientId === c.clientId || j.clientName === c.name);
            const outstanding = clientJobs.reduce((s, j) => s + (j.status !== "paid" && j.bidAmount ? Number(j.bidAmount) : 0), 0);
            const totalEarned = clientJobs.filter(j => j.status === "paid").reduce((s, j) => s + (Number(j.bidAmount) || 0), 0);

            return (
              <div key={c.clientId} style={{ background:"var(--card)", borderRadius:18, border:"1px solid var(--border)", overflow:"hidden", boxShadow:"0 1px 4px rgba(0,0,0,0.05)", borderLeft: needsFollowUp ? "3px solid var(--brand)" : undefined }}>
                <div style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 14px" }}>
                  <div style={{ width:46, height:46, borderRadius:14, background:av.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, fontWeight:800, color:av.color, flexShrink:0 }}>
                    {c.name[0]?.toUpperCase()}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontWeight:800, fontSize:15, color:"var(--text)", letterSpacing:"-0.01em" }}>{c.name}</p>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginTop:5 }}>
                      {c.phone && (
                        <a href={`tel:${c.phone}`} style={{ display:"inline-flex", alignItems:"center", gap:4, fontSize:11, fontWeight:600, color:"var(--blue)", background:"rgba(37,99,235,0.08)", padding:"3px 8px", borderRadius:20, textDecoration:"none" }}>
                          <Phone size={10} />{c.phone}
                        </a>
                      )}
                      {c.email && (
                        <a href={`mailto:${c.email}`} style={{ display:"inline-flex", alignItems:"center", gap:4, fontSize:11, fontWeight:600, color:"var(--blue)", background:"rgba(37,99,235,0.08)", padding:"3px 8px", borderRadius:20, textDecoration:"none" }}>
                          <Mail size={10} />{c.email}
                        </a>
                      )}
                      {c.address && (
                        <span style={{ display:"inline-flex", alignItems:"center", gap:4, fontSize:11, fontWeight:500, color:"var(--text2)", background:"var(--input)", padding:"3px 8px", borderRadius:20 }}>
                          <MapPin size={10} />{c.address}
                        </span>
                      )}
                      {needsFollowUp && (
                        <span style={{ display:"inline-flex", alignItems:"center", gap:4, fontSize:10, fontWeight:700, color:"#92400E", background:"#FEF3C7", padding:"3px 8px", borderRadius:20 }}>
                          ⏰ {days}d — follow up
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:5, flexShrink:0 }}>
                    <button onClick={() => openEdit(c)} style={{ width:32, height:32, borderRadius:9, background:"var(--input)", border:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"var(--text2)" }}>
                      <Edit2 size={13} />
                    </button>
                    <button onClick={() => remove(c.clientId)} style={{ width:32, height:32, borderRadius:9, background:"var(--input)", border:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"var(--red)" }}>
                      <Trash2 size={13} />
                    </button>
                    <button onClick={() => setExpanded(isExpanded ? null : c.clientId)} style={{ width:32, height:32, borderRadius:9, background: isExpanded ? "var(--brand-light)" : "var(--input)", border: isExpanded ? "1px solid rgba(245,166,35,0.3)" : "1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color: isExpanded ? "var(--brand)" : "var(--text2)" }}>
                      {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div style={{ borderTop:"1px solid var(--border)", padding:14, background:"var(--input)" }}>
                    {c.notes && (
                      <div style={{ marginBottom:10, padding:"8px 10px", borderRadius:10, background:"var(--card)", border:"1px solid var(--border)", fontSize:13, color:"var(--text2)" }}>
                        📝 {c.notes}
                      </div>
                    )}
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12 }}>
                      <div style={{ padding:"10px 12px", borderRadius:12, background:"var(--card)", border:"1px solid var(--border)" }}>
                        <p style={{ fontSize:10, fontWeight:600, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"0.04em" }}>Total Earned</p>
                        <p style={{ fontSize:18, fontWeight:800, color:"var(--green)", marginTop:2 }}>${totalEarned.toLocaleString()}</p>
                      </div>
                      <div style={{ padding:"10px 12px", borderRadius:12, background: outstanding > 0 ? "rgba(220,38,38,0.06)" : "var(--card)", border:"1px solid var(--border)" }}>
                        <p style={{ fontSize:10, fontWeight:600, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"0.04em" }}>Outstanding</p>
                        <p style={{ fontSize:18, fontWeight:800, color: outstanding > 0 ? "var(--red)" : "var(--text2)", marginTop:2 }}>${outstanding.toLocaleString()}</p>
                      </div>
                    </div>
                    {clientJobs.length > 0 && (
                      <>
                        <p style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", color:"var(--muted)", marginBottom:6 }}>Job History ({clientJobs.length})</p>
                        <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                          {clientJobs.map(j => (
                            <div key={j.jobId} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 10px", borderRadius:10, background:"var(--card)", border:"1px solid var(--border)" }}>
                              <div>
                                <p style={{ fontSize:12, fontWeight:700, color:"var(--text)" }}>{j.jobName}</p>
                                <span style={{ fontSize:10, fontWeight:700, padding:"1px 6px", borderRadius:20, background: j.status==="paid" ? "var(--green-bg)" : j.status==="active"||j.status==="in_progress" ? "rgba(37,99,235,0.1)" : "rgba(156,163,175,0.15)", color: j.status==="paid" ? "var(--green)" : j.status==="active"||j.status==="in_progress" ? "var(--blue)" : "var(--text2)" }}>
                                  {j.status}
                                </span>
                              </div>
                              <p style={{ fontSize:13, fontWeight:800, color:"var(--text)" }}>${(j.bidAmount||0).toLocaleString()}</p>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL */}
      {showForm && (
        <div style={{ position:"fixed", inset:0, zIndex:100, display:"flex", alignItems:"flex-end", justifyContent:"center", background:"rgba(0,0,0,0.55)", backdropFilter:"blur(6px)" }}
          onClick={e => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div style={{ width:"100%", maxWidth:480, background:"var(--card)", borderRadius:"28px 28px 0 0", maxHeight:"92vh", display:"flex", flexDirection:"column", boxShadow:"0 -8px 40px rgba(0,0,0,0.2)" }}>
            <div style={{ width:40, height:5, background:"var(--border)", borderRadius:3, margin:"12px auto 0", flexShrink:0 }} />
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 20px 14px", borderBottom:"1px solid var(--border)", flexShrink:0 }}>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ width:44, height:44, borderRadius:13, background:"linear-gradient(135deg, var(--brand), #C47D0A)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 4px 14px rgba(245,166,35,0.35)" }}>
                  <UserPlus size={20} color="white" strokeWidth={2} />
                </div>
                <div>
                  <p style={{ fontSize:19, fontWeight:800, color:"var(--text)", letterSpacing:"-0.02em" }}>{editingClient ? "Edit Client" : "New Client"}</p>
                  <p style={{ fontSize:12, color:"var(--muted)", marginTop:1 }}>Fill in the details below</p>
                </div>
              </div>
              <button onClick={() => setShowForm(false)} style={{ width:34, height:34, borderRadius:10, background:"var(--input)", border:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"var(--text2)", fontSize:18, fontFamily:"sans-serif" }}>×</button>
            </div>
            <div style={{ padding:"18px 20px", overflowY:"auto", flex:1 }}>
              <div style={{ marginBottom:14 }}>
                <label style={{ fontSize:11, fontWeight:700, letterSpacing:"0.06em", textTransform:"uppercase", color:"var(--muted)", display:"block", marginBottom:6 }}>Client Name <span style={{ color:"var(--red)" }}>*</span></label>
                <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. John Smith" className="input" style={{ width:"100%", fontSize:14, padding:"13px 15px", borderRadius:13, border:"1.5px solid var(--border)", background:"var(--input)", outline:"none" }} />
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:10, margin:"4px 0 14px" }}>
                <div style={{ flex:1, height:1, background:"var(--border)" }} /><span style={{ fontSize:10, fontWeight:700, letterSpacing:"0.07em", textTransform:"uppercase", color:"var(--muted)" }}>Contact</span><div style={{ flex:1, height:1, background:"var(--border)" }} />
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
                <div>
                  <label style={{ fontSize:11, fontWeight:700, letterSpacing:"0.06em", textTransform:"uppercase", color:"var(--muted)", display:"block", marginBottom:6 }}>Phone</label>
                  <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="(555) 000-0000" type="tel" className="input" style={{ width:"100%", fontSize:14, padding:"13px 15px", borderRadius:13, border:"1.5px solid var(--border)", background:"var(--input)", outline:"none" }} />
                </div>
                <div>
                  <label style={{ fontSize:11, fontWeight:700, letterSpacing:"0.06em", textTransform:"uppercase", color:"var(--muted)", display:"block", marginBottom:6 }}>Email</label>
                  <input value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="email@example.com" type="email" className="input" style={{ width:"100%", fontSize:14, padding:"13px 15px", borderRadius:13, border:"1.5px solid var(--border)", background:"var(--input)", outline:"none" }} />
                </div>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:10, margin:"4px 0 14px" }}>
                <div style={{ flex:1, height:1, background:"var(--border)" }} /><span style={{ fontSize:10, fontWeight:700, letterSpacing:"0.07em", textTransform:"uppercase", color:"var(--muted)" }}>Address</span><div style={{ flex:1, height:1, background:"var(--border)" }} />
              </div>
              <div style={{ marginBottom:10 }}>
                <label style={{ fontSize:11, fontWeight:700, letterSpacing:"0.06em", textTransform:"uppercase", color:"var(--muted)", display:"block", marginBottom:6 }}>Street</label>
                <input value={form.address} onChange={e => setForm({...form, address: e.target.value})} placeholder="123 Main St" className="input" style={{ width:"100%", fontSize:14, padding:"13px 15px", borderRadius:13, border:"1.5px solid var(--border)", background:"var(--input)", outline:"none" }} />
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1.6fr 0.9fr 1fr", gap:8, marginBottom:14 }}>
                <div>
                  <label style={{ fontSize:11, fontWeight:700, letterSpacing:"0.06em", textTransform:"uppercase", color:"var(--muted)", display:"block", marginBottom:6 }}>City</label>
                  <input value={form.city} onChange={e => setForm({...form, city: e.target.value})} placeholder="City" className="input" style={{ width:"100%", fontSize:14, padding:"13px 15px", borderRadius:13, border:"1.5px solid var(--border)", background:"var(--input)", outline:"none" }} />
                </div>
                <div>
                  <label style={{ fontSize:11, fontWeight:700, letterSpacing:"0.06em", textTransform:"uppercase", color:"var(--muted)", display:"block", marginBottom:6 }}>State</label>
                  <input value={form.state} onChange={e => setForm({...form, state: e.target.value})} placeholder="NJ" maxLength={2} className="input" style={{ width:"100%", fontSize:14, padding:"13px 15px", borderRadius:13, border:"1.5px solid var(--border)", background:"var(--input)", outline:"none" }} />
                </div>
                <div>
                  <label style={{ fontSize:11, fontWeight:700, letterSpacing:"0.06em", textTransform:"uppercase", color:"var(--muted)", display:"block", marginBottom:6 }}>Zip</label>
                  <input value={form.zip} onChange={e => setForm({...form, zip: e.target.value})} placeholder="07001" maxLength={10} className="input" style={{ width:"100%", fontSize:14, padding:"13px 15px", borderRadius:13, border:"1.5px solid var(--border)", background:"var(--input)", outline:"none" }} />
                </div>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:10, margin:"4px 0 14px" }}>
                <div style={{ flex:1, height:1, background:"var(--border)" }} /><span style={{ fontSize:10, fontWeight:700, letterSpacing:"0.07em", textTransform:"uppercase", color:"var(--muted)" }}>Notes</span><div style={{ flex:1, height:1, background:"var(--border)" }} />
              </div>
              <div>
                <label style={{ fontSize:11, fontWeight:700, letterSpacing:"0.06em", textTransform:"uppercase", color:"var(--muted)", display:"block", marginBottom:6 }}>Notes</label>
                <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="e.g. Slow payer, referred by John, prefers texts…" rows={3} className="input" style={{ width:"100%", fontSize:14, padding:"13px 15px", borderRadius:13, resize:"none", lineHeight:1.55, border:"1.5px solid var(--border)", background:"var(--input)", outline:"none" }} />
              </div>
            </div>
            <div style={{ padding:"14px 20px calc(96px + env(safe-area-inset-bottom, 16px))", borderTop:"1px solid var(--border)", display:"flex", gap:10, flexShrink:0 }}>
              <button onClick={() => setShowForm(false)} style={{ flex:1, padding:15, borderRadius:14, background:"var(--input)", border:"1.5px solid var(--border)", fontSize:14, fontWeight:700, color:"var(--text2)", cursor:"pointer", fontFamily:"inherit" }}>Cancel</button>
              <button onClick={save} disabled={saving} style={{ flex:2, padding:15, borderRadius:14, background: saving ? "var(--muted)" : "linear-gradient(135deg, var(--brand), #C47D0A)", border:"none", fontSize:14, fontWeight:700, color:"#fff", cursor: saving ? "not-allowed" : "pointer", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:7, boxShadow: saving ? "none" : "0 4px 16px rgba(245,166,35,0.4)" }}>
                <UserPlus size={16} strokeWidth={2} />
                {saving ? "Saving…" : editingClient ? "Save Changes" : "Add Client"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
