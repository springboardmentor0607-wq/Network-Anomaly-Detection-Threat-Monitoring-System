import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

// Full-page network field. Static by default — only moves when the user
// scrolls (same direction, with momentum that eases out), plus mouse repulsion.
const NetworkField = () => {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const lastScrollRef = useRef(typeof window !== 'undefined' ? window.scrollY : 0);
  const scrollVelocityRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationId;
    const nodeCount = 60;
    const nodes = [];

    const resize = () => {
      canvas.width = window.innerWidth * window.devicePixelRatio;
      canvas.height = window.innerHeight * window.devicePixelRatio;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    const init = () => {
      nodes.length = 0;
      for (let i = 0; i < nodeCount; i++) {
        nodes.push({
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          pulse: Math.random() * Math.PI * 2,
        });
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      const mouse = mouseRef.current;

      // connections
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist < 130) {
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.06 * (1 - dist / 130)})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      nodes.forEach((n) => {
        // movement only from scroll momentum — no autonomous drift
        n.y += scrollVelocityRef.current;
        n.pulse += 0.02;

        // mouse repulsion
        const dx = n.x - mouse.x;
        const dy = n.y - mouse.y;
        const distToMouse = Math.hypot(dx, dy);
        let glow = 1.2 + Math.sin(n.pulse) * 0.5;
        if (distToMouse < 120) {
          const force = (120 - distToMouse) / 120;
          n.x += (dx / distToMouse) * force * 1.5;
          n.y += (dy / distToMouse) * force * 1.5;
          glow += force * 2;
        }

        if (n.x < -20) n.x = window.innerWidth + 20;
        if (n.x > window.innerWidth + 20) n.x = -20;
        if (n.y < -20) n.y = window.innerHeight + 20;
        if (n.y > window.innerHeight + 20) n.y = -20;

        ctx.beginPath();
        ctx.arc(n.x, n.y, glow, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.fill();
      });

      // momentum eases out after scrolling stops, instead of running forever
      scrollVelocityRef.current *= 0.9;
      if (Math.abs(scrollVelocityRef.current) < 0.01) scrollVelocityRef.current = 0;

      animationId = requestAnimationFrame(draw);
    };

    const handleMouseMove = (e) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleScroll = () => {
      const current = window.scrollY;
      const delta = current - lastScrollRef.current;
      lastScrollRef.current = current;
      const next = scrollVelocityRef.current + delta * 0.15;
      scrollVelocityRef.current = Math.max(-6, Math.min(6, next));
    };

    resize();
    init();
    draw();

    window.addEventListener('resize', () => { resize(); init(); });
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
};

// Fades + slides an element up into view as it enters the viewport.
const Reveal = ({ children, className = '' }) => {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.opacity = '1';
          el.style.transform = 'translateY(0)';
          observer.unobserve(el);
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: 0,
        transform: 'translateY(24px)',
        transition: 'opacity 0.7s ease, transform 0.7s ease',
      }}
    >
      {children}
    </div>
  );
};

const Landing = () => {
  const features = [
    {
      title: 'Traffic monitoring',
      desc: 'Every packet crossing your network is logged and streamed to the dashboard in real time.',
    },
    {
      title: 'Anomaly detection',
      desc: 'Models trained on CICIDS2017 and UNSW-NB15 compare live traffic against known-normal patterns.',
    },
    {
      title: 'Intrusion prediction',
      desc: 'Flags traffic that matches the early signature of an attack, before it fully develops.',
    },
    {
      title: 'Threat intelligence',
      desc: 'Alerts are ranked by severity and routed to the analyst on duty, with full context attached.',
    },
  ];

  const steps = [
    { n: '01', title: 'Capture', desc: 'Network traffic is captured continuously and normalized into structured flow records.' },
    { n: '02', title: 'Analyze', desc: 'Each flow is scored by a model trained on real intrusion datasets to detect deviations from normal behavior.' },
    { n: '03', title: 'Alert', desc: 'Flagged traffic becomes a ranked alert on the analyst dashboard, with the evidence attached.' },
  ];

  return (
   <div id="top" className="bg-[#0A0A0B] text-[#F2F2F0] min-h-screen relative">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
        html { scroll-behavior: smooth; }
        * { font-family: 'Inter', sans-serif; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
      `}</style>

      <NetworkField />

      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 backdrop-blur-xl bg-[#0A0A0B]/70 border-b border-white/[0.07]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
         <a href="#top" className="flex items-center gap-2.5 cursor-pointer">
        <div className="w-1.5 h-1.5 rounded-full bg-white" />
        <span className="font-semibold tracking-tight text-[15px]">NetShield AI</span>
        </a>
          <div className="hidden md:flex items-center gap-8 text-[13px] text-[#9A9A97]">
            <a href="#how" className="hover:text-white transition-colors">How it works</a>
            <a href="#features" className="hover:text-white transition-colors">Capabilities</a>
          </div>
          <div className="flex items-center gap-5">
            <Link to="/login" className="text-[13px] font-medium text-[#D6D6D3] hover:text-white transition-colors">
              Log in
            </Link>
            <Link
              to="/register"
              className="text-[13px] font-medium bg-white text-[#0A0A0B] px-4 py-1.5 rounded-full hover:bg-[#E5E5E2] transition-colors"
            >
              Register
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 min-h-screen flex items-center pt-16">
        <div className="max-w-6xl mx-auto px-6 w-full">
          <div className="max-w-2xl">
            <h1 className="font-semibold tracking-tight text-[52px] md:text-[64px] leading-[1.05] mb-6">
              A monitoring system that reads your network the way an analyst would.
            </h1>
            <p className="text-[17px] text-[#9A9A97] leading-relaxed mb-10 max-w-lg">
              NetShield AI ingests live network traffic, scores it against machine
              learning models trained on real intrusion data, and surfaces the
              alerts that actually matter — before an anomaly becomes an incident.
            </p>
            <div className="flex items-center gap-4">
              <Link
                to="/register"
                className="bg-white text-[#0A0A0B] text-[14px] font-medium px-6 py-3 rounded-full hover:bg-[#E5E5E2] transition-colors"
              >
                Get started
              </Link>
              <a
                href="#how"
                className="text-[14px] font-medium text-white border border-white/20 px-6 py-3 rounded-full hover:bg-white/5 transition-colors"
              >
                See how it works
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="relative z-10 max-w-6xl mx-auto px-6 py-28 border-t border-white/[0.07]">
        <Reveal className="max-w-xl mb-16">
          <h2 className="font-semibold text-[32px] tracking-tight mb-4">How it works</h2>
          <p className="text-[#9A9A97] text-[15px] leading-relaxed">
            Three stages, running continuously, from raw packets to a ranked alert.
          </p>
        </Reveal>

        <div className="grid md:grid-cols-3 gap-10">
          {steps.map((s) => (
            <Reveal key={s.n}>
              <span className="font-mono text-[13px] text-[#5C5C59]">{s.n}</span>
              <h3 className="font-medium text-[18px] mt-3 mb-2">{s.title}</h3>
              <p className="text-[#9A9A97] text-[14px] leading-relaxed">{s.desc}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 max-w-6xl mx-auto px-6 py-28 border-t border-white/[0.07]">
        <Reveal className="max-w-xl mb-16">
          <h2 className="font-semibold text-[32px] tracking-tight mb-4">
            Built for the security operations center.
          </h2>
          <p className="text-[#9A9A97] text-[15px] leading-relaxed">
            Every module reads from the same live traffic stream — no switching between disconnected tools.
          </p>
        </Reveal>

        <div className="grid md:grid-cols-2 gap-px bg-white/[0.07] rounded-2xl overflow-hidden border border-white/[0.07]">
          {features.map((f, index) => (
            <Reveal key={index} className="bg-[#0A0A0B] p-8 hover:bg-[#111112] transition-colors">
              <h3 className="font-medium text-[17px] mb-2">{f.title}</h3>
              <p className="text-[#9A9A97] text-[14px] leading-relaxed">{f.desc}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.07]">
        <div className="max-w-6xl mx-auto px-6 py-10 flex items-center justify-between text-[13px] text-[#9A9A97]">
          <span>NetShield AI &middot; Network Anomaly Detection & Threat Monitoring System</span>
        </div>
      </footer>
    </div>
  );
};

export default Landing;