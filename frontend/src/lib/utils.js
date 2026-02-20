export const money = (n) => {
  const num = Number(n) || 0;
  return num >= 1000 ? `$${(num / 1).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : `$${num.toFixed(2)}`;
};

export const moneyExact = (n) => `$${(Number(n) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const moneyCompact = (n) => {
  const num = Number(n) || 0;
  if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `$${(num / 1000).toFixed(num >= 10000 ? 0 : 1)}K`;
  return `$${num.toFixed(0)}`;
};

export const STATUS_MAP = {
  bidding: { label: "Bidding", badge: "badge badge-blue", color: "var(--blue)" },
  active: { label: "Active", badge: "badge badge-green", color: "var(--green)" },
  complete: { label: "Complete", badge: "badge badge-yellow", color: "var(--yellow)" },
  paid: { label: "Paid", badge: "badge badge-purple", color: "var(--purple)" },
};

export const statusBadge = (s) => STATUS_MAP[s]?.badge || "badge";
export const statusLabel = (s) => STATUS_MAP[s]?.label || s;
export const statusColor = (s) => STATUS_MAP[s]?.color || "var(--muted)";

export const INVOICE_STATUS = {
  draft: { label: "Draft", badge: "badge badge-blue" },
  sent: { label: "Sent", badge: "badge badge-yellow" },
  viewed: { label: "Viewed", badge: "badge badge-purple" },
  paid: { label: "Paid", badge: "badge badge-green" },
  overdue: { label: "Overdue", badge: "badge badge-red" },
};

export const EXPENSE_CATEGORIES = [
  { value: "materials", label: "Materials", icon: "🧱" },
  { value: "labor", label: "Labor", icon: "👷" },
  { value: "equipment", label: "Equipment", icon: "🔧" },
  { value: "permits", label: "Permits", icon: "📋" },
  { value: "transport", label: "Transport", icon: "🚛" },
  { value: "other", label: "Other", icon: "📦" },
];

export const overdueSeverity = (days) => {
  if (days >= 30) return { level: "critical", color: "var(--red)", bg: "var(--red-bg)", label: "Past Due" };
  if (days >= 15) return { level: "warning", color: "var(--yellow)", bg: "var(--yellow-bg)", label: "Overdue" };
  return { level: "mild", color: "var(--blue)", bg: "var(--blue-bg)", label: "Due Soon" };
};

export const margin = (bid, spent) => {
  const b = Number(bid) || 0, s = Number(spent) || 0;
  if (b === 0) return { amount: 0, percent: 0 };
  return { amount: b - s, percent: Math.round(((b - s) / b) * 100) };
};

export const marginColor = (pct) => {
  if (pct >= 30) return "var(--green)";
  if (pct >= 15) return "var(--yellow)";
  return "var(--red)";
};

export const relDate = (d) => {
  if (!d) return "";
  const now = new Date(), date = new Date(d);
  const days = Math.floor((now - date) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

export const daysBetween = (a, b) => Math.floor((new Date(b) - new Date(a)) / 86400000);
