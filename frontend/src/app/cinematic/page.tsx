"use client";

import Link from "next/link";
import { Shield, Search, User, Play, ChevronLeft, ChevronRight, Calendar } from "lucide-react";

export default function CinematicHome() {
    return (
        <div className="min-h-screen w-full bg-black text-white relative font-sans flex flex-col selection:bg-white/20 overflow-hidden">
            {/* Background Video */}
            <video
                src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260406_094145_4a271a6c-3869-4f1c-8aa7-aeb0cb227994.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-80"
            />
            
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-black/60 pointer-events-none" />

            {/* Header Navigation */}
            <header className="relative z-10 w-full px-8 py-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Shield className="w-7 h-7 text-white" />
                    <span className="text-xl font-bold tracking-widest uppercase">NETSHIELD</span>
                </div>

                <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-300">
                    <Link href="/dashboard-cinematic" className="hover:text-white transition-colors">Traffic Monitoring</Link>
                    <Link href="/dashboard-cinematic" className="hover:text-white transition-colors">Anomaly Detection</Link>
                    <Link href="/dashboard-cinematic" className="hover:text-white transition-colors">Intrusion Prediction</Link>
                    <Link href="/dashboard-cinematic" className="hover:text-white transition-colors">Threat Intelligence</Link>
                    <Link href="/dashboard-cinematic" className="hover:text-white transition-colors">SOC Alerts</Link>
                </nav>

                <div className="flex items-center gap-6">
                    <button className="flex items-center gap-2 text-sm font-medium text-gray-300 hover:text-white transition-colors px-4 py-2 rounded-full border border-white/20 bg-black/20 backdrop-blur-md">
                        <Search className="w-4 h-4" />
                        Search
                    </button>
                    <button className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center bg-black/20 backdrop-blur-md hover:bg-white/10 transition-colors">
                        <User className="w-5 h-5 text-gray-300" />
                    </button>
                </div>
            </header>

            {/* Main Hero Content */}
            <main className="relative z-10 flex-1 flex items-end pb-24 px-8 md:px-16 lg:px-24">
                <div className="max-w-3xl animate-blur-fade-up">
                    <div className="flex items-center gap-4 mb-6 text-sm font-medium">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-green-500/30 bg-green-500/10 text-green-400 backdrop-blur-md">
                            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                            AI Core Operational
                        </div>
                        <div className="flex items-center gap-2 text-gray-300">
                            <Calendar className="w-4 h-4" />
                            April, 2025
                        </div>
                    </div>

                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-6 leading-tight">
                        AI-Powered Network Anomaly Detection.
                    </h1>

                    <p className="text-base md:text-lg text-gray-400 mb-10 max-w-2xl leading-relaxed">
                        Continuously monitor network traffic, identify suspicious behavior, and neutralize potential intrusions before they escalate into security incidents.
                    </p>

                    <div className="flex flex-wrap items-center gap-4">
                        <Link href="/login-cinematic" className="flex items-center gap-2 px-8 py-4 bg-white text-black rounded-full font-semibold hover:bg-gray-200 transition-colors">
                            <Play className="w-5 h-5 fill-black" />
                            Launch Console
                        </Link>
                        <Link href="/dashboard-cinematic" className="flex items-center gap-2 px-8 py-4 bg-black/40 border border-white/20 text-white rounded-full font-semibold backdrop-blur-md hover:bg-white/10 transition-colors">
                            Live Telemetry
                        </Link>
                    </div>
                </div>
            </main>

        </div>
    );
}
