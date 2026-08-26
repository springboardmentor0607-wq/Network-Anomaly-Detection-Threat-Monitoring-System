import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e5e7eb] flex flex-col">
      <header className="w-full border-b border-[#1f2937]">
        <div className="mx-auto flex h-16 max-w-5xl items-center px-6">
          <span className="font-mono text-sm font-semibold tracking-[0.2em] text-[#2dd4bf]">
            NETSHIELD AI
          </span>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-6">
        <div className="max-w-2xl text-center">
          <span className="inline-flex items-center rounded-full border border-[#1f2937] bg-[#111827] px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-[#2dd4bf]">
            Network anomaly detection · threat monitoring
          </span>

          <h1 className="mt-8 text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
            One quiet host is all it takes.
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-[#9ca3af]">
            NetShield AI watches every packet across your network, learns what normal looks like, and surfaces the one connection that doesn&apos;t — before it becomes an incident your SOC team hears about the hard way.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/register"
              className="rounded-md bg-[#2dd4bf] px-6 py-3 text-sm font-semibold text-[#0a0a0a] transition-opacity hover:opacity-90"
            >
              Get started
            </Link>

            <Link
              href="/login"
              className="rounded-md border border-[#374151] bg-[#111827] px-6 py-3 text-sm font-semibold text-[#e5e7eb] transition-colors hover:border-[#4b5563] hover:bg-[#1f2937]"
            >
              I already have an account
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
