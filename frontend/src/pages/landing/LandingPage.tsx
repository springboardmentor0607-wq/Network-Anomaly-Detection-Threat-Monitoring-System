import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Radio, Zap, Target, Lock, BarChart3, Database, ChevronRight, ArrowRight, Activity, Terminal } from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Canvas animation for connected network nodes & packet flow
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Nodes definition
    const numNodes = 45;
    const nodes = Array.from({ length: numNodes }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.6,
      radius: Math.random() * 2 + 1.5,
      isThreat: Math.random() < 0.15,
    }));

    const packets = Array.from({ length: 15 }, () => ({
      from: Math.floor(Math.random() * numNodes),
      to: Math.floor(Math.random() * numNodes),
      progress: Math.random(),
      speed: 0.005 + Math.random() * 0.01,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw faint background grid
      ctx.strokeStyle = 'rgba(31, 41, 55, 0.25)';
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Update & draw nodes
      nodes.forEach((node) => {
        node.x += node.vx;
        node.y += node.vy;
        if (node.x < 0 || node.x > width) node.vx *= -1;
        if (node.y < 0 || node.y > height) node.vy *= -1;

        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = node.isThreat ? '#EF4444' : '#06B6D4';
        ctx.fill();

        if (node.isThreat) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius * 3, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.2)';
          ctx.stroke();
        }
      });

      // Connect close nodes
      for (let i = 0; i < numNodes; i++) {
        for (let j = i + 1; j < numNodes; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 140) {
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            const isThreatLink = nodes[i].isThreat || nodes[j].isThreat;
            ctx.strokeStyle = isThreatLink
              ? `rgba(239, 68, 68, ${0.35 * (1 - dist / 140)})`
              : `rgba(6, 182, 212, ${0.2 * (1 - dist / 140)})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      // Draw moving packets
      packets.forEach((p) => {
        p.progress += p.speed;
        if (p.progress >= 1) {
          p.progress = 0;
          p.from = Math.floor(Math.random() * numNodes);
          p.to = Math.floor(Math.random() * numNodes);
        }
        const n1 = nodes[p.from];
        const n2 = nodes[p.to];
        const px = n1.x + (n2.x - n1.x) * p.progress;
        const py = n1.y + (n2.y - n1.y) * p.progress;

        ctx.beginPath();
        ctx.arc(px, py, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = '#38BDF8';
        ctx.shadowColor = '#0284C7';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const features = [
    {
      title: 'AI-Powered Anomaly Detection',
      description: 'Continuous real-time evaluation of packet flows using Isolation Forest and XGBoost ensemble algorithms.',
      icon: <Radio className="w-6 h-6 text-cyan-400" />,
    },
    {
      title: 'Real-Time Threat Monitoring',
      description: 'Instant visualization of network telemetry, protocol distributions, and active connections across edge gateways.',
      icon: <Activity className="w-6 h-6 text-emerald-400" />,
    },
    {
      title: 'Intrusion Prediction Engine',
      description: 'Predictive attack probability modeling calculating risk scores (0–100) before lateral movement occurs.',
      icon: <Zap className="w-6 h-6 text-amber-400" />,
    },
    {
      title: 'Threat Intelligence Feeds',
      description: 'Ingestion of known malicious IPs, command & control nodes, and TOR exit relays for instant IOC correlation.',
      icon: <Target className="w-6 h-6 text-red-400" />,
    },
    {
      title: 'Incident Management Board',
      description: 'Structured analyst response pipeline for converting high-risk alerts into trackable SOC incident tickets.',
      icon: <Lock className="w-6 h-6 text-purple-400" />,
    },
    {
      title: 'Security Analytics & Reports',
      description: 'Automated executive summaries, false positive auditing, and downloadable PDF/CSV security reporting.',
      icon: <BarChart3 className="w-6 h-6 text-blue-400" />,
    },
  ];

  return (
    <div className="min-h-screen bg-[#070A11] text-gray-100 relative overflow-x-hidden selection:bg-cyan-500 selection:text-black">
      {/* Background Interactive Node Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none opacity-60" />

      {/* Top Header Navbar */}
      <header className="relative z-10 max-w-7xl mx-auto px-6 h-20 flex items-center justify-between border-b border-[#1E293B]/50">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/')}>
          <div className="p-2.5 bg-cyan-950/80 border border-cyan-500/40 rounded-xl text-cyan-400 shadow-lg shadow-cyan-950/50">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <span className="font-bold text-lg text-white tracking-tight">NETSHIELD AI</span>
            <span className="block text-[10px] text-cyan-400 font-semibold uppercase tracking-widest">Enterprise SOC Platform</span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 text-xs font-semibold text-gray-300 hover:text-white transition"
          >
            Sign In
          </button>
          <button
            onClick={() => navigate('/')}
            className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/25 transition transform hover:-translate-y-0.5 flex items-center space-x-2"
          >
            <span>Launch SOC Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 bg-cyan-950/70 border border-cyan-500/30 rounded-full text-xs font-semibold text-cyan-300 mb-8">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>NETSHIELD AI v2.4 RELEASED • NEXT-GEN THREAT INTELLIGENCE</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight leading-tight">
          NETSHIELD AI
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-blue-500 mt-2">
            Network Anomaly Detection & Threat Monitoring System
          </span>
        </h1>

        <p className="mt-6 text-lg md:text-xl text-gray-300 max-w-3xl mx-auto font-normal leading-relaxed">
          "AI-powered network intelligence for detecting anomalies, predicting intrusions, classifying threats, and accelerating security response."
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="w-full sm:w-auto px-8 py-4 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-sm rounded-xl shadow-xl shadow-cyan-500/30 transition transform hover:-translate-y-0.5 flex items-center justify-center space-x-3"
          >
            <span>Launch SOC Dashboard</span>
            <ChevronRight className="w-5 h-5" />
          </button>
          <a
            href="#features"
            className="w-full sm:w-auto px-8 py-4 bg-[#111827] hover:bg-[#1E293B] border border-[#1F2937] text-white font-semibold text-sm rounded-xl transition flex items-center justify-center space-x-2"
          >
            <span>Explore Platform</span>
          </a>
        </div>
      </section>

      {/* Platform Features Grid */}
      <section id="features" className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight">Enterprise Cybersecurity Capabilities</h2>
          <p className="mt-3 text-gray-400 text-sm max-w-xl mx-auto">
            Engineered for Security Operations Centers (SOC), network engineers, and threat analysts.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl bg-[#0F172A]/80 border border-[#1F2937] hover:border-cyan-500/40 backdrop-blur-md transition group duration-200"
            >
              <div className="p-3 bg-[#131C2E] border border-[#1F2937] rounded-xl w-fit mb-4 group-hover:scale-110 transition transform">
                {feat.icon}
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-cyan-400 transition">{feat.title}</h3>
              <p className="mt-2 text-xs text-gray-400 leading-relaxed">{feat.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Architecture & Workflow Diagram Section */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 py-16">
        <div className="p-8 rounded-3xl bg-[#0B0F17] border border-[#1F2937] text-center shadow-2xl">
          <h3 className="text-xl font-bold text-white mb-6">End-to-End Threat Monitoring Pipeline</h3>
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-semibold">
            {['Network Traffic', 'Feature Extraction', 'ML Anomaly Detection', 'Intrusion Prediction', 'Risk Scoring (0-100)', 'Threat Alerts', 'Incident Response'].map((step, idx) => (
              <React.Fragment key={idx}>
                <span className="px-3 py-2 bg-[#131C2E] border border-[#1F2937] rounded-xl text-cyan-300">{step}</span>
                {idx < 6 && <span className="text-gray-600">→</span>}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[#1E293B] py-8 text-center text-xs text-gray-500">
        <p>NetShield AI © 2026 • Network Anomaly Detection & Threat Monitoring Platform</p>
      </footer>
    </div>
  );
};
