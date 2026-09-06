"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Mail, Lock, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function RegisterCinematicPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [role, setRole] = useState("analyst");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }
        setLoading(true);
        setError("");

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://52.66.252.155:8000'}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, role })
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.detail || "Registration failed");
            }

            // Immediately log them in after registration
            const formData = new URLSearchParams();
            formData.append('username', email);
            formData.append('password', password);

            const loginRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://52.66.252.155:8000'}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: formData.toString()
            });

            if (!loginRes.ok) {
                router.push("/login-cinematic");
                return;
            }

            const data = await loginRes.json();
            localStorage.setItem("netshield_token", data.access_token);
            
            login((data.role || role) as "admin" | "analyst");
            router.push("/dashboard-cinematic");
        } catch (err: any) {
            setError(err.message || "Registration failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-black text-white relative font-sans flex flex-col items-center justify-between selection:bg-white/20 overflow-hidden">
            {/* Background Video */}
            <video
                src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260406_094145_4a271a6c-3869-4f1c-8aa7-aeb0cb227994.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-40"
            />
            
            {/* Background Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none" />

            {/* Header */}
            <header className="relative z-10 w-full px-8 py-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg border border-white/20 flex items-center justify-center">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-white"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                    </div>
                    <span className="text-lg font-bold tracking-widest uppercase">NETSHIELD</span>
                </div>
                <Link href="/cinematic" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
                    ← Back to Cinematic Home
                </Link>
            </header>

            {/* Registration Card */}
            <div className="relative z-10 w-full max-w-md p-8 sm:p-10 rounded-3xl !bg-black/60 !backdrop-blur-2xl border border-white/10 shadow-2xl animate-blur-fade-up my-auto">
                <div className="flex flex-col items-center mb-8">
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Request Access</h1>
                    <p className="text-sm text-gray-400 text-center">Apply for clearance to the cinematic control center</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Access Level Toggle */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold tracking-wider text-gray-400 uppercase ml-1">Access Level</label>
                        <div className="flex p-1 bg-white/5 border border-white/10 rounded-xl">
                            <button
                                type="button"
                                onClick={() => setRole("analyst")}
                                className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
                                    role === "analyst" ? "bg-white/10 text-white shadow-sm" : "text-gray-500 hover:text-gray-300"
                                }`}
                            >
                                Security Analyst
                            </button>
                            <button
                                type="button"
                                onClick={() => setRole("admin")}
                                className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
                                    role === "admin" ? "bg-white/10 text-white shadow-sm" : "text-gray-500 hover:text-gray-300"
                                }`}
                            >
                                Administrator
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold tracking-wider text-gray-400 uppercase ml-1">Email Address</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Mail className="h-5 w-5 text-gray-500 group-focus-within:text-white transition-colors" />
                            </div>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="block w-full pl-11 pr-4 py-3.5 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30 transition-all text-sm"
                                placeholder="analyst@netshield.com"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between ml-1 mr-1">
                            <label className="text-[10px] font-bold tracking-wider text-gray-400 uppercase">Password</label>
                            <Link href="#" className="text-[10px] font-medium text-gray-500 hover:text-gray-300 transition-colors">Forgot password?</Link>
                        </div>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-gray-500 group-focus-within:text-white transition-colors" />
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="block w-full pl-11 pr-4 py-3.5 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30 transition-all text-sm"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold tracking-wider text-gray-400 uppercase ml-1">Confirm Password</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-gray-500 group-focus-within:text-white transition-colors" />
                            </div>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="block w-full pl-11 pr-4 py-3.5 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30 transition-all text-sm"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="text-red-400 text-sm text-center bg-red-950/40 border border-red-500/20 py-2 rounded-lg">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full relative group overflow-hidden rounded-xl bg-white text-black font-semibold text-sm py-4 transition-all hover:bg-gray-200 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
                    >
                        <span className="relative z-10 flex items-center justify-center gap-2">
                            {loading ? "Provisioning..." : "Request Access"}
                            {!loading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                        </span>
                    </button>
                </form>

                <div className="mt-8 text-center text-sm text-gray-400">
                    Already have an access clearance? <Link href="/login-cinematic" className="text-white font-medium hover:underline">Login</Link>
                </div>
            </div>

            {/* Footer */}
            <footer className="relative z-10 w-full px-8 py-6 flex items-center justify-between text-xs text-gray-500">
                <div className="w-8 h-8 rounded-full bg-black/50 border border-white/10 flex items-center justify-center">
                    <span className="font-bold text-gray-400">N</span>
                </div>
                <p>© 2026 NetShield Security Systems. All rights reserved.</p>
                <div className="w-8" /> {/* Spacer for centering */}
            </footer>
        </div>
    );
}
