"use client";

import { CurrentUser } from "../lib/auth-context";

const ROLE_LABEL: Record<string, string> = {
  security_analyst: "Security Analyst",
  security_administrator: "Security Administrator",
};

export default function TopBar({
  user,
  onLogout,
  title = "Overview",
  subtitle = "Live status across monitored network segments",
}: {
  user: CurrentUser;
  onLogout: () => void;
  title?: string;
  subtitle?: string;
}) {
  return (
    <header className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)]/60 px-6 py-4">
      <div>
        <p className="font-display text-lg font-semibold text-[var(--color-text)]">
          {title}
        </p>
        <p className="text-xs text-[var(--color-text-muted)]">{subtitle}</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm text-[var(--color-text)]">{user.username}</p>
          <span className="inline-block rounded-full border border-[var(--color-signal)]/40 bg-[var(--color-signal)]/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-[var(--color-signal)]">
            {ROLE_LABEL[user.role] ?? user.role}
          </span>
        </div>
        <button
          onClick={onLogout}
          className="rounded-md border border-[var(--color-border)] px-3 py-1.5 text-sm text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-critical)]/50 hover:text-[var(--color-critical)]"
        >
          Log out
        </button>
      </div>
    </header>
  );
}
