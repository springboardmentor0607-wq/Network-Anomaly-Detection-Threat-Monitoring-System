import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

// Full-page network field. Moves on scroll with momentum + mouse repulsion.
const NetworkField = ({ isDark }) => {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const lastScrollRef = useRef(typeof window !== 'undefined' ? window.scrollY : 0);
  const scrollVelocityRef = useRef(0);
  
  // Use a ref for the theme so the animation loop can read it without restarting
  const themeRef = useRef(isDark);
  useEffect(() => {
    themeRef.current = isDark;
  }, [isDark]);

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
      const rgb = themeRef.current ? '255, 255, 255' : '10, 10, 11'; // White for dark mode, dark for light mode

      // connections
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist < 130) {
            ctx.strokeStyle = `rgba(${rgb}, ${0.08 * (1 - dist / 130)})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      nodes.forEach((n) => {
        // movement only from scroll momentum
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
        ctx.fillStyle = `rgba(${rgb}, 0.6)`;
        ctx.fill();
      });

      // momentum eases out
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
      className="fixed inset-0 pointer-events-none transition-opacity duration-500"
      style={{ zIndex: 0 }}
    />
  );
};

// Intersection Observer Reveal
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
        transition: 'opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {children}
    </div>
  );
};

const Landing = () => {
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('theme') !== 'light';
  });

  useEffect(() => {
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

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

  // Dynamic Theme Colors
  const bgMain = isDark ? 'bg-[#0A0A0B]' : 'bg-[#F9F9F8]';
  const textMain = isDark ? 'text-[#F2F2F0]' : 'text-[#0A0A0B]';
  const textMuted = isDark ? 'text-[#9A9A97]' : 'text-[#6B6B66]';
  const borderSubtle = isDark ? 'border-white/[0.07]' : 'border-black/[0.07]';
  const navBg = isDark ? 'bg-[#0A0A0B]/70' : 'bg-[#F9F9F8]/70';
  const btnPrimaryBg = isDark ? 'bg-white text-[#0A0A0B] hover:bg-[#E5E5E2]' : 'bg-[#0A0A0B] text-white hover:bg-[#222]';
  const btnSecondaryBorder = isDark ? 'border-white/20 text-white hover:bg-white/5' : 'border-black/20 text-[#0A0A0B] hover:bg-black/5';
  const cardGridBg = isDark ? 'bg-white/[0.07]' : 'bg-black/[0.05]';
  const cardBg = isDark ? 'bg-[#0A0A0B] hover:bg-[#111112]' : 'bg-[#F9F9F8] hover:bg-white';
  const dotColor = isDark ? 'bg-white' : 'bg-[#0A0A0B]';

  return (
   <div id="top" className={`${bgMain} ${textMain} min-h-screen relative transition-colors duration-500 ease-in-out`}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
        html { scroll-behavior: smooth; }
        * { font-family: 'Inter', sans-serif; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
      `}</style>

      <NetworkField isDark={isDark} />

      {/* Nav */}
      <nav className={`fixed top-0 inset-x-0 z-50 backdrop-blur-xl ${navBg} border-b ${borderSubtle} transition-colors duration-500`}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="#top" className="flex items-center gap-2.5 cursor-pointer">
            <div className={`w-1.5 h-1.5 rounded-full ${dotColor} transition-colors duration-500`} />
            <span className="font-semibold tracking-tight text-[15px]">NetShield AI</span>
          </a>
          
          <div className={`hidden md:flex items-center gap-8 text-[13px] ${textMuted}`}>
            <a href="#how" className={`hover:${textMain} transition-colors`}>How it works</a>
            <a href="#features" className={`hover:${textMain} transition-colors`}>Capabilities</a>
          </div>
          
          <div className="flex items-center gap-5">
            {/* Theme Toggle */}
            <button 
              onClick={() => setIsDark(!isDark)}
              className={`p-2 rounded-full ${textMuted} hover:${textMain} active:scale-90 transition-all`}
              aria-label="Toggle Theme"
            >
              {isDark ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
            <Link to="/login" className={`text-[13px] font-medium ${textMuted} hover:${textMain} transition-colors`}>
              Log in
            </Link>
            <Link
              to="/register"
              className={`text-[13px] font-medium px-4 py-1.5 rounded-full transition-all active:scale-[0.97] ${btnPrimaryBg}`}
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
            <p className={`text-[17px] ${textMuted} leading-relaxed mb-10 max-w-lg transition-colors duration-500`}>
              NetShield AI ingests live network traffic, scores it against machine
              learning models trained on real intrusion data, and surfaces the
              alerts that actually matter — before an anomaly becomes an incident.
            </p>
            <div className="flex items-center gap-4">
              <Link
                to="/register"
                className={`text-[14px] font-medium px-6 py-3 rounded-full transition-all active:scale-[0.97] ${btnPrimaryBg}`}
              >
                Get started
              </Link>
              <a
                href="#how"
                className={`text-[14px] font-medium border px-6 py-3 rounded-full transition-all active:scale-[0.97] ${btnSecondaryBorder}`}
              >
                See how it works
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className={`relative z-10 max-w-6xl mx-auto px-6 py-28 border-t ${borderSubtle} transition-colors duration-500`}>
        <Reveal className="max-w-xl mb-16">
          <h2 className="font-semibold text-[32px] tracking-tight mb-4">How it works</h2>
          <p className={`${textMuted} text-[15px] leading-relaxed transition-colors duration-500`}>
            Three stages, running continuously, from raw packets to a ranked alert.
          </p>
        </Reveal>

        <div className="grid md:grid-cols-3 gap-10">
          {steps.map((s) => (
            <Reveal key={s.n}>
              <span className="font-mono text-[13px] text-[#5C5C59]">{s.n}</span>
              <h3 className="font-medium text-[18px] mt-3 mb-2">{s.title}</h3>
              <p className={`${textMuted} text-[14px] leading-relaxed transition-colors duration-500`}>{s.desc}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className={`relative z-10 max-w-6xl mx-auto px-6 py-28 border-t ${borderSubtle} transition-colors duration-500`}>
        <Reveal className="max-w-xl mb-16">
          <h2 className="font-semibold text-[32px] tracking-tight mb-4">
            Built for the security operations center.
          </h2>
          <p className={`${textMuted} text-[15px] leading-relaxed transition-colors duration-500`}>
            Every module reads from the same live traffic stream — no switching between disconnected tools.
          </p>
        </Reveal>

        <div className={`grid md:grid-cols-2 gap-px ${cardGridBg} rounded-2xl overflow-hidden border ${borderSubtle} transition-colors duration-500`}>
          {features.map((f, index) => (
            <Reveal key={index} className={`${cardBg} p-8 transition-colors duration-300`}>
              <h3 className="font-medium text-[17px] mb-2">{f.title}</h3>
              <p className={`${textMuted} text-[14px] leading-relaxed transition-colors duration-500`}>{f.desc}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className={`relative z-10 border-t ${borderSubtle} transition-colors duration-500`}>
        <div className={`max-w-6xl mx-auto px-6 py-10 flex items-center justify-between text-[13px] ${textMuted} transition-colors duration-500`}>
          <span>NetShield AI &middot; Network Anomaly Detection & Threat Monitoring System</span>
        </div>
      </footer>
    </div>
  );
};

export default Landing;