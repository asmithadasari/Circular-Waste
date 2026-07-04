const STYLES = {
  COLLECTED: "bg-moss-50 text-moss-700",
  CLASSIFIED: "bg-moss-50 text-moss-700",
  BATCH_CREATED: "bg-moss-100 text-moss-800",
  MATCHED: "bg-clay-400/20 text-clay-500",
  PICKUP_SCHEDULED: "bg-clay-400/20 text-clay-500",
  RECEIVED: "bg-moss-200 text-moss-800",
  RECYCLED: "bg-moss-600 text-white",
  high: "bg-moss-100 text-moss-700",
  medium: "bg-clay-400/20 text-clay-600",
  low: "bg-red-100 text-red-600",
};

export default function StatusBadge({ value }) {
  const style = STYLES[value] || "bg-ink/10 text-ink/70";
  return <span className={`badge ${style}`}>{value?.replace(/_/g, " ")}</span>;
}
