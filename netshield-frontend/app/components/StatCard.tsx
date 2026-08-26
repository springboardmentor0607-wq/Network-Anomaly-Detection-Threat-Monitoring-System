export default function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <p className="font-mono text-[11px] uppercase tracking-widest text-[var(--color-text-muted)]">
        {label}
      </p>
      <p className="mt-2 font-display text-2xl font-semibold text-[var(--color-text)]">
        {value}
      </p>
      {hint && (
        <p className="mt-1 text-xs text-[var(--color-text-muted)]">{hint}</p>
      )}
    </div>
  );
}
