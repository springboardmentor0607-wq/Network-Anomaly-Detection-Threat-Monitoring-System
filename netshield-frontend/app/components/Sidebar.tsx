"use client";

import { Role } from "../lib/auth-context";

interface NavItem {
  label: string;
  key: string;
  minRole?: Role; // if set, only this role (or higher) sees the item
}

const NAV_ITEMS: NavItem[] = [
  { label: "Overview", key: "overview" },
  { label: "Traffic Monitor", key: "traffic" },
  { label: "Anomaly Detection", key: "anomalies" },
  { label: "Alerts", key: "alerts" },
  { label: "Threat Intelligence", key: "intel" },
  { label: "Team Management", key: "team", minRole: "security_administrator" },
];

export default function Sidebar({
  role,
  active,
  onSelect,
}: {
  role: Role;
  active: string;
  onSelect: (key: string) => void;
}) {
  const items = NAV_ITEMS.filter((item) => !item.minRole || item.minRole === role);

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-6 md:flex">
      <div className="mb-8 flex items-center gap-2 px-2">
        <span className="h-2 w-2 rounded-full bg-[var(--color-signal)]" />
        <span className="font-display text-sm font-semibold tracking-wide text-[var(--color-text)]">
          NETSHIELD AI
        </span>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {items.map((item) => (
          <button
            key={item.key}
            onClick={() => onSelect(item.key)}
            className={`rounded-md px-3 py-2 text-left text-sm transition-colors ${
              active === item.key
                ? "bg-[var(--color-surface-raised)] text-[var(--color-text)]"
                : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-text)]"
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="rounded-md border border-[var(--color-border)] px-3 py-2 font-mono text-[11px] text-[var(--color-text-muted)]">
        v0.1 &middot; milestone 1
      </div>
    </aside>
  );
}
