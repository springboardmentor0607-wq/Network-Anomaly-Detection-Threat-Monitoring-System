export default function ComingSoon({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-start rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-8">
      <span className="font-mono text-[11px] uppercase tracking-widest text-[var(--color-alert)]">
        {eyebrow}
      </span>
      <h3 className="mt-2 font-display text-lg font-semibold text-[var(--color-text)]">
        {title}
      </h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-[var(--color-text-muted)]">
        {description}
      </p>
    </div>
  );
}
