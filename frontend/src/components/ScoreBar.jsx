export default function ScoreBar({ label, score, max }) {
  const pct = Math.max(0, Math.min(100, (score / max) * 100));
  return (
    <div>
      <div className="flex justify-between text-xs font-medium text-ink/70 mb-1">
        <span>{label}</span>
        <span>{score}/{max}</span>
      </div>
      <div className="h-2 rounded-full bg-moss-50 overflow-hidden">
        <div className="h-full rounded-full bg-moss-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
