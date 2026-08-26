"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "../lib/auth-context";

type Role = "security_analyst" | "security_administrator";

export default function RegisterPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<Role>("security_analyst");

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError("");
    setMessage("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          email,
          password,
          role,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.detail || data.message || "Registration failed."
        );
      }

      setMessage("Account created successfully! Redirecting to login...");

      setTimeout(() => {
        router.push("/login");
      }, 1200);
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

      {/* Registration */}
      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-md rounded-xl border border-[#1f2937] bg-[#111827] p-8 shadow-2xl sm:p-10">
          {/* Title */}
          <div className="mb-8 text-center">
            <span className="font-mono text-sm font-semibold tracking-[0.2em] text-[#2dd4bf]">
              NETSHIELD AI
            </span>

            <h1 className="mt-6 text-2xl font-semibold tracking-tight text-white">
              Create an account
            </h1>

            <p className="mt-2 text-sm text-[#9ca3af]">
              Create your account to access the NetShield AI security platform.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleRegister} className="space-y-5">
            {/* Username */}
            <div>
              <label
                htmlFor="username"
                className="mb-2 block text-sm font-medium text-[#e5e7eb]"
              >
                Username
              </label>

              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
                className="w-full rounded-lg border border-[#374151] bg-[#0a0a0a] px-4 py-3 text-sm text-white placeholder-[#6b7280] outline-none transition-colors focus:border-[#2dd4bf] focus:ring-1 focus:ring-[#2dd4bf]"
              />
            </div>

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

            {/* Passwords */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-sm font-medium text-[#e5e7eb]"
                >
                  Confirm password
                </label>

                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-lg border border-[#374151] bg-[#0a0a0a] px-4 py-3 text-sm text-white placeholder-[#6b7280] outline-none transition-colors focus:border-[#2dd4bf] focus:ring-1 focus:ring-[#2dd4bf]"
                />
              </div>
            </div>

            {/* Role */}
            <div>
              <label className="mb-2 block text-sm font-medium text-[#e5e7eb]">
                Account role
              </label>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setRole("security_analyst")}
                  className={`rounded-lg border p-4 text-left transition-colors ${
                    role === "security_analyst"
                      ? "border-[#2dd4bf] bg-[#2dd4bf]/10"
                      : "border-[#374151] bg-[#0a0a0a] hover:border-[#4b5563]"
                  }`}
                >
                  <span
                    className={`block text-sm font-semibold ${
                      role === "security_analyst"
                        ? "text-[#2dd4bf]"
                        : "text-white"
                    }`}
                  >
                    Security Analyst
                  </span>

                  <span className="mt-1 block text-xs leading-relaxed text-[#9ca3af]">
                    Monitor traffic, investigate anomalies, and manage alerts.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole("security_administrator")}
                  className={`rounded-lg border p-4 text-left transition-colors ${
                    role === "security_administrator"
                      ? "border-[#2dd4bf] bg-[#2dd4bf]/10"
                      : "border-[#374151] bg-[#0a0a0a] hover:border-[#4b5563]"
                  }`}
                >
                  <span
                    className={`block text-sm font-semibold ${
                      role === "security_administrator"
                        ? "text-[#2dd4bf]"
                        : "text-white"
                    }`}
                  >
                    Security Administrator
                  </span>

                  <span className="mt-1 block text-xs leading-relaxed text-[#9ca3af]">
                    Manage security operations and registered team members.
                  </span>
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-lg border border-red-900/50 bg-red-900/20 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            )}

            {/* Success */}
            {message && (
              <div className="rounded-lg border border-[#2dd4bf]/30 bg-[#2dd4bf]/10 px-4 py-3 text-sm text-[#2dd4bf]">
                {message}
              </div>
            )}

            {/* Register button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#2dd4bf] px-4 py-3 text-sm font-semibold text-[#0a0a0a] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          {/* Login link */}
          <div className="mt-8 text-center text-sm text-[#9ca3af]">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-[#2dd4bf] transition-opacity hover:opacity-80"
            >
              Log in
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}