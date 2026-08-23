import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./LandingPage.css";

function ParticleCanvas() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let animId;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);
    const particles = Array.from({ length: 90 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      r: Math.random() * 2 + 1,
    }));
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(0,180,255,${0.15 * (1 - dist / 150)})`;
            ctx.lineWidth = 0.6;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
      particles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0,200,255,0.7)";
        ctx.fill();
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
      });
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={canvasRef} className="lp-canvas" />;
}

function HexGrid() {
  const hexes = Array.from({ length: 18 }, (_, i) => i);
  return (
    <div className="lp-hexgrid" aria-hidden="true">
      {hexes.map((i) => (
        <div key={i} className={`lp-hex lp-hex-${i % 6}`} style={{ "--i": i }} />
      ))}
    </div>
  );
}

function BinaryRain() {
  const strips = ["01001101", "110100", "01010011", "10110011", "00101101"];
  return (
    <div className="lp-binary" aria-hidden="true">
      {strips.map((b, i) => (
        <span key={i} className="lp-binary-strip" style={{ "--delay": `${i * 1.4}s`, "--left": `${8 + i * 18}%` }}>
          {b}
        </span>
      ))}
    </div>
  );
}

function AIShield() {
  return (
    <div className="lp-shield-wrap">
      <div className="lp-shield-glow" />
      <svg className="lp-shield-svg" viewBox="0 0 120 140" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="shieldGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#00c8ff" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
          <filter id="glowF">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <path d="M60 8 L104 28 L104 72 C104 98 60 128 60 128 C60 128 16 98 16 72 L16 28 Z"
          stroke="url(#shieldGrad)" strokeWidth="3" fill="rgba(0,80,140,0.3)" filter="url(#glowF)" />
        <line x1="60" y1="50" x2="60" y2="30" stroke="#00c8ff" strokeWidth="1" opacity="0.6" />
        <line x1="40" y1="70" x2="80" y2="70" stroke="#00c8ff" strokeWidth="1" opacity="0.6" />
        <line x1="45" y1="55" x2="75" y2="55" stroke="#00c8ff" strokeWidth="0.8" opacity="0.4" />
        <line x1="35" y1="80" x2="85" y2="80" stroke="#00c8ff" strokeWidth="0.8" opacity="0.4" />
        <circle cx="60" cy="70" r="18" stroke="#00c8ff" strokeWidth="1.5" fill="none" opacity="0.8" filter="url(#glowF)" />
        <circle cx="60" cy="70" r="10" stroke="#a855f7" strokeWidth="1" fill="rgba(0,100,200,0.3)" opacity="0.9" />
        <text x="60" y="75" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="bold" fontFamily="Orbitron, sans-serif" filter="url(#glowF)">AI</text>
      </svg>
      <div className="lp-circuit-left" />
      <div className="lp-circuit-right" />
    </div>
  );
}

function LockChip() {
  return (
    <div className="lp-lockchip">
      <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="5" y="5" width="50" height="50" rx="6" stroke="#00c8ff" strokeWidth="2" fill="rgba(0,60,120,0.5)" />
        {[15, 25, 35, 45].map((x) => (<line key={x} x1={x} y1="5" x2={x} y2="0" stroke="#00c8ff" strokeWidth="2" />))}
        {[15, 25, 35, 45].map((x) => (<line key={x + 100} x1={x} y1="55" x2={x} y2="60" stroke="#00c8ff" strokeWidth="2" />))}
        <path d="M23 28 C23 23 37 23 37 28 L37 36 L23 36 Z" stroke="#00c8ff" strokeWidth="1.5" fill="rgba(0,80,180,0.5)" />
        <rect x="27" y="36" width="6" height="8" rx="2" fill="#00c8ff" />
        <circle cx="30" cy="40" r="2" fill="#0a1628" />
      </svg>
      <p className="lp-lockchip-label">NETWORK SECURITY</p>
    </div>
  );
}

function FloatingLabels() {
  return (
    <>
      <div className="lp-label lp-label-threat-top">AI THREAT DETECTION</div>
      <div className="lp-label lp-label-threat-right">AI THREAT DETECTION</div>
      <div className="lp-label lp-label-realtime">REAL-TIME PROTECTION</div>
      <div className="lp-label lp-label-network">NETWORK PATEMETIK</div>
      <div className="lp-label lp-label-threatred">THREAT</div>
    </>
  );
}

function WorldMap() {
  return (
    <div className="lp-worldmap" aria-hidden="true">
      <svg viewBox="0 0 400 200" fill="none" xmlns="http://www.w3.org/2000/svg" opacity="0.18">
        <ellipse cx="200" cy="100" rx="190" ry="90" stroke="#00c8ff" strokeWidth="0.5" strokeDasharray="4 4" />
        <ellipse cx="200" cy="100" rx="130" ry="90" stroke="#00c8ff" strokeWidth="0.5" strokeDasharray="3 5" />
        <ellipse cx="200" cy="100" rx="60" ry="90" stroke="#00c8ff" strokeWidth="0.5" strokeDasharray="3 5" />
        <line x1="10" y1="100" x2="390" y2="100" stroke="#00c8ff" strokeWidth="0.5" strokeDasharray="4 4" />
        <line x1="200" y1="10" x2="200" y2="190" stroke="#00c8ff" strokeWidth="0.5" strokeDasharray="4 4" />
        <ellipse cx="120" cy="80" rx="40" ry="30" fill="#00c8ff" opacity="0.3" />
        <ellipse cx="240" cy="85" rx="55" ry="35" fill="#00c8ff" opacity="0.25" />
        <ellipse cx="300" cy="110" rx="35" ry="25" fill="#00c8ff" opacity="0.2" />
        <ellipse cx="180" cy="130" rx="25" ry="20" fill="#00c8ff" opacity="0.2" />
        <circle cx="310" cy="120" r="4" fill="#ff3b3b" opacity="0.9" />
        <circle cx="310" cy="120" r="8" fill="none" stroke="#ff3b3b" strokeWidth="1" opacity="0.5" />
      </svg>
    </div>
  );
}

const LandingPage = () => {
  const navigate = useNavigate();
  return (
    <div className="lp-root">
      <ParticleCanvas />
      <HexGrid />
      <BinaryRain />
      <WorldMap />
      <AIShield />
      <LockChip />
      <FloatingLabels />
      <header className="lp-header">
        <div className="lp-logo">
          <svg className="lp-logo-icon" viewBox="0 0 32 36" fill="none">
            <path d="M16 2 L30 9 L30 22 C30 30 16 36 16 36 C16 36 2 30 2 22 L2 9 Z" stroke="#00c8ff" strokeWidth="2" fill="rgba(0,80,140,0.4)" />
            <circle cx="16" cy="20" r="6" stroke="#00c8ff" strokeWidth="1.5" fill="rgba(0,100,200,0.3)" />
            <text x="16" y="24" textAnchor="middle" fill="#fff" fontSize="6" fontWeight="bold" fontFamily="Orbitron,sans-serif">AI</text>
          </svg>
          <span className="lp-logo-text">NetShield AI</span>
        </div>
        <nav className="lp-nav">
          <button className="lp-btn-login" onClick={() => navigate("/login")}>Login</button>
          <button className="lp-btn-signup" onClick={() => navigate("/register")}>Signup</button>
        </nav>
      </header>
    </div>
  );
};

export default LandingPage;
