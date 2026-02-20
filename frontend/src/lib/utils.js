import { clsx } from "clsx";
export function cn(...inputs) { return clsx(inputs); }
export function formatMoney(a) { if (a == null) return "$0.00"; return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(a); }
export function formatMoneyCompact(a) { if (!a) return "$0"; if (a >= 1000) return `$${(a/1000).toFixed(1)}K`; return formatMoney(a); }
export function formatDate(d) { if (!d) return ""; return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }
export function statusBadge(s) { const m = { bidding:"badge-bidding", active:"badge-active", complete:"badge-complete", paid:"badge-paid", overdue:"badge-overdue", sent:"badge-active", draft:"badge-bidding" }; return `badge ${m[s]||"badge-bidding"}`; }
export function statusLabel(s) { const m = { bidding:"Bidding", active:"Active", complete:"Complete", paid:"Paid", overdue:"Overdue", sent:"Sent", draft:"Draft" }; return m[s]||s; }
export function calcMargin(bid, actual) { if (!bid) return 0; return ((bid-actual)/bid)*100; }
export function marginColor(p) { if (p >= 20) return "text-green-400"; if (p >= 10) return "text-amber-400"; return "text-red-400"; }
export function overdueSeverity(days) { if (days > 30) return { color:"text-red-500", bg:"bg-red-500/10", label:"Critical" }; if (days > 14) return { color:"text-amber-500", bg:"bg-amber-500/10", label:"Warning" }; return { color:"text-yellow-400", bg:"bg-yellow-400/10", label:"Overdue" }; }
export function formatPhone(p) { if (!p) return ""; const d = p.replace(/\D/g,""); if (d.length===10) return `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`; return p; }
export const categoryIcons = { materials:"🧱", labor:"👷", equipment:"🔧", subcontractor:"🤝", permits:"📋", other:"📦" };
