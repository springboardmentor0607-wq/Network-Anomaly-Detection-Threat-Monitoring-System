import React, { useEffect, useRef } from 'react';

// Shared network-node background. Static by default — only moves when the
// user scrolls (same direction, with momentum that eases out), plus mouse repulsion.
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
        n.y += scrollVelocityRef.current;
        n.pulse += 0.02;

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
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
};

export default NetworkField;