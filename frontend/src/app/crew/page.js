"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { getCrew, deleteCrewMember } from "@/lib/api";
import { money } from "@/lib/utils";
import { Plus, Users, Phone, Trash2, Edit3, Copy, Check, DollarSign } from "lucide-react";

export default function CrewPage() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(null);
  const router = useRouter();

  const load = () => { getCrew().then(r => setMembers(r.members || r || [])).catch(() => {}).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const doDelete = async (id, name) => {
    if (confirm(`Remove ${name} from your crew?`)) {
      await deleteCrewMember(id); load();
    }
  };

  const copyLink = (token, name) => {
    const url = `${window.location.origin}/crew-view/${token}`;
    navigator.clipboard.writeText(url);
    setCopied(token);
    setTimeout(() => setCopied(null), 2000);
  };

  const addBtn = <button onClick={() => router.push("/crew/new")} className="btn btn-brand btn-sm"><Plus size={18} />Add</button>;

  return (
    <AppShell title="My Crew" subtitle={`${members.length} members`} action={addBtn}>
      {loading ? (
        <div className="space-y-3 mt-4">{[1,2,3].map(i => <div key={i} className="skeleton h-24" />)}</div>
      ) : members.length === 0 ? (
        <div className="mt-16 text-center">
          <div className="empty-icon"><Users size={40} style={{ color: "var(--muted)" }} /></div>
          <h2 className="text-2xl font-extrabold mb-2" style={{ color: "var(--text)" }}>No crew yet</h2>
          <p className="mb-8" style={{ color: "var(--text2)" }}>Add your first crew member to start scheduling.</p>
          <button onClick={() => router.push("/crew/new")} className="btn btn-brand mx-auto"><Plus size={20} />Add Crew Member</button>
        </div>
      ) : (
        <div className="space-y-3 mt-4">
          {members.map(m => (
            <div key={m.memberId} className="card">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold text-white" style={{ background: m.status === "active" ? "var(--green)" : "var(--muted)" }}>
                    {m.name?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div>
                    <p className="font-bold text-base" style={{ color: "var(--text)" }}>{m.name}</p>
                    {m.role && <p className="text-sm" style={{ color: "var(--text2)" }}>{m.role}</p>}
                    <div className="flex items-center gap-3 mt-1">
                      {m.hourlyRate > 0 && (
                        <span className="flex items-center gap-1 text-xs font-bold" style={{ color: "var(--green)" }}>
                          <DollarSign size={12} />{m.hourlyRate}/hr
                        </span>
                      )}
                      {m.phone && (
                        <a href={`tel:${m.phone}`} className="flex items-center gap-1 text-xs" style={{ color: "var(--blue)" }}>
                          <Phone size={12} />{m.phone}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <button onClick={() => copyLink(m.token, m.name)} className="btn btn-outline btn-sm text-xs" title="Copy crew view link">
                    {copied === m.token ? <Check size={14} /> : <Copy size={14} />}
                    {copied === m.token ? "Copied!" : "Link"}
                  </button>
                  <button onClick={() => doDelete(m.memberId, m.name)} className="p-2 rounded-lg" style={{ color: "var(--red)" }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
