import { useEffect, useRef } from 'react';

export default function Wallpaper() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const overlay = overlayRef.current;
    if (!canvas || !overlay) return;
    const ctx = canvas.getContext('2d');
    const octx = overlay.getContext('2d');
    if (!ctx || !octx) return;

    let raf = 0;
    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      [canvas, overlay].forEach(c => {
        c.width = w * dpr;
        c.height = h * dpr;
        c.style.width = w + 'px';
        c.style.height = h + 'px';
      });
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      octx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    // Particles
    const particles: {x:number,y:number,vx:number,vy:number,size:number,alpha:number,hue:number}[] = [];
    const count = Math.min(120, Math.floor(window.innerWidth * window.innerHeight / 12000));
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.5 + 0.2,
        hue: 120 + Math.random() * 60, // green-cyan
      });
    }

    // Orbs
    const orbs = [
      { x: 0.2, y: 0.3, r: 300, c: 'rgba(0,255,65,0.08)' },
      { x: 0.8, y: 0.7, r: 400, c: 'rgba(0,255,255,0.06)' },
      { x: 0.5, y: 0.5, r: 600, c: 'rgba(120,0,255,0.04)' },
    ];

    let t = 0;
    const draw = () => {
      t += 0.005;
      const w = window.innerWidth;
      const h = window.innerHeight;

      // Clear
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, w, h);

      // Gradient base
      const g = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, Math.max(w,h));
      g.addColorStop(0, 'rgba(10,25,15,0.8)');
      g.addColorStop(0.5, 'rgba(0,10,5,0.9)');
      g.addColorStop(1, 'rgba(0,0,0,1)');
      ctx.fillStyle = g;
      ctx.fillRect(0,0,w,h);

      // Grid with perspective
      ctx.strokeStyle = 'rgba(0,255,65,0.06)';
      ctx.lineWidth = 0.5;
      const gridSize = 40;
      const offset = (t * 20) % gridSize;
      for (let x = -gridSize + offset; x < w + gridSize; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + 200, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Orbs with float
      orbs.forEach((orb, i) => {
        const ox = w * orb.x + Math.sin(t * 0.5 + i) * 30;
        const oy = h * orb.y + Math.cos(t * 0.3 + i) * 20;
        const grad = ctx.createRadialGradient(ox, oy, 0, ox, oy, orb.r);
        grad.addColorStop(0, orb.c);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(ox, oy, orb.r, 0, Math.PI * 2);
        ctx.fill();
      });

      // Particles and connections
      particles.forEach(p => {
        p.x += p.vx + Math.sin(t + p.x * 0.01) * 0.2;
        p.y += p.vy + Math.cos(t + p.y * 0.01) * 0.2;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        p.alpha = 0.3 + Math.sin(t * 2 + p.x * 0.01) * 0.2;

        ctx.fillStyle = `hsla(${p.hue}, 100%, 60%, ${p.alpha})`;
        ctx.shadowColor = `hsla(${p.hue}, 100%, 60%, 0.8)`;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Connections
      ctx.strokeStyle = 'rgba(0,255,65,0.08)';
      ctx.lineWidth = 0.5;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          if (dist < 120) {
            const alpha = (1 - dist / 120) * 0.15;
            ctx.strokeStyle = `rgba(0,255,65,${alpha})`;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Overlay: scanline
      octx.clearRect(0,0,w,h);
      // Vignette
      const vg = octx.createRadialGradient(w/2,h/2,0,w/2,h/2, Math.max(w,h)*0.8);
      vg.addColorStop(0, 'transparent');
      vg.addColorStop(0.7, 'transparent');
      vg.addColorStop(1, 'rgba(0,0,0,0.7)');
      octx.fillStyle = vg;
      octx.fillRect(0,0,w,h);

      // Scanline
      const scanY = (t * 80) % (h + 100) - 50;
      octx.fillStyle = 'rgba(0,255,65,0.04)';
      octx.fillRect(0, scanY, w, 2);
      octx.fillStyle = 'rgba(0,255,65,0.02)';
      octx.fillRect(0, scanY+2, w, 20);

      // Noise
      octx.fillStyle = 'rgba(255,255,255,0.015)';
      for (let i = 0; i < 50; i++) {
        const x = Math.random() * w;
        const y = Math.random() * h;
        octx.fillRect(x,y,1,1);
      }

      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden bg-black">
      <canvas ref={canvasRef} className="absolute inset-0" />
      <canvas ref={overlayRef} className="absolute inset-0 pointer-events-none" />
      {/* Center hologram */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative">
          <div className="absolute -inset-20 bg-gradient-to-r from-[#00ff41]/20 via-transparent to-[#00ffff]/20 blur-3xl animate-pulse-glow" />
          <div className="text-[180px] md:text-[320px] opacity-[0.03] select-none font-orbitron font-black animate-hologram" style={{ WebkitTextStroke: '1px rgba(0,255,65,0.3)' }}>
            ◈
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 md:w-48 md:h-48 rounded-full border border-[#00ff41]/10 animate-pulse-glow" style={{ boxShadow: '0 0 60px rgba(0,255,65,0.1), inset 0 0 40px rgba(0,255,65,0.05)' }} />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-48 h-48 md:w-72 md:h-72 rounded-full border border-[#00ff41]/5" />
          </div>
        </div>
      </div>
      {/* NEXUS watermark */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 pointer-events-none text-center">
        <div className="font-orbitron text-[10px] tracking-[0.8em] text-[#00ff41]/20">NEXUS OS • KALI LINUX</div>
        <div className="text-[8px] tracking-widest text-white/10 mt-1">QUANTUM EDITION • v4.0.1</div>
      </div>
    </div>
  );
}
