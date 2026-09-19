export function VerdictBadge({ verdict }: { verdict: string }) {
  const v = (verdict || "UNKNOWN").toUpperCase();
  const color =
    v === "ACTIVE"
      ? "text-moss border-moss"
      : v === "DORMANT"
        ? "text-amber border-amber"
        : v === "ABANDONED"
          ? "text-abandon border-abandon"
          : "text-muted border-line";
  return (
    <span
      className={`inline-flex items-center gap-2 border px-2 py-1 font-mono text-xs tracking-widest ${color}`}
      role="status"
      aria-label={`Verdict: ${v}`}
    >
      <span aria-hidden="true">{v === "ACTIVE" ? "◆" : v === "ABANDONED" ? "×" : v === "DORMANT" ? "·" : "?"}</span>
      {v}
    </span>
  );
}
