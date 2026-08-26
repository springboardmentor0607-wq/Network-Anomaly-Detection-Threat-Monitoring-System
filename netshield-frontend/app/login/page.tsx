"use client";

import Link from "next/link";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL, useAuth } from "../lib/auth-context";

export default function Login() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      // Connect to the existing FastAPI backend
      const res = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.detail || data.message || "Invalid email or password."
        );
      }

      // Save the JWT token and load the current user's details
      await login(data.access_token);

      // Redirect to dashboard after successful login
      router.push("/dashboard");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not connect to the server. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0a] text-[#e5e7eb]">
      {/* Header */}
      <header className="w-full border-b border-[#1f2937]">
        <div className="mx-auto flex h-16 max-w-5xl items-center px-6">
          <Link
            href="/"
            className="font-mono text-sm font-semibold tracking-[0.2em] text-[#2dd4bf] transition-opacity hover:opacity-80"
          >
            NETSHIELD AI
          </Link>
        </div>
      </header>

      {/* Login */}
      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-md rounded-xl border border-[#1f2937] bg-[#111827] p-8 shadow-2xl sm:p-10">
          {/* Title */}
          <div className="mb-8 text-center">
            <span className="font-mono text-sm font-semibold tracking-[0.2em] text-[#2dd4bf]">
              NETSHIELD AI
            </span>

            <h1 className="mt-6 text-2xl font-semibold tracking-tight text-white">
              Welcome back
            </h1>

            <p className="mt-2 text-sm text-[#9ca3af]">
              Log in to access your NetShield AI security dashboard.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-[#e5e7eb]"
              >
                Email
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                className="w-full rounded-lg border border-[#374151] bg-[#0a0a0a] px-4 py-3 text-sm text-white placeholder-[#6b7280] outline-none transition-colors focus:border-[#2dd4bf] focus:ring-1 focus:ring-[#2dd4bf]"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-[#e5e7eb]"
              >
                Password
              </label>

              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full rounded-lg border border-[#374151] bg-[#0a0a0a] px-4 py-3 text-sm text-white placeholder-[#6b7280] outline-none transition-colors focus:border-[#2dd4bf] focus:ring-1 focus:ring-[#2dd4bf]"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-lg border border-red-900/50 bg-red-900/20 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            )}

            {/* Login button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#2dd4bf] px-4 py-3 text-sm font-semibold text-[#0a0a0a] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Logging in..." : "Log in"}
            </button>
          </form>

          {/* Register link */}
          <div className="mt-8 text-center text-sm text-[#9ca3af]">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-medium text-[#2dd4bf] transition-opacity hover:opacity-80"
            >
              Create an account
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
