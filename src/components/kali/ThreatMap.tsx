import { useEffect, useRef } from 'react';

export default function ThreatMap({ compact = false }: { compact?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    const w = canvas.width;
    const h = canvas.height;

    const nodes = [
      { x: 0.2, y: 0.3 }, { x: 0.8, y: 0.25 }, { x: 0.5, y: 0.5 },
      { x: 0.3, y: 0.7 }, { x: 0.7, y: 0.7 }, { x: 0.15, y: 0.5 },
      { x: 0.85, y: 0.5 }, { x: 0.5, y: 0.2 }, { x: 0.5, y: 0.8 },
    ];

    const attacks: { from: number; to: number; progress: number; speed: number }[] = [];

    const spawnAttack = () => {
      const from = Math.floor(Math.random() * nodes.length);
      let to = Math.floor(Math.random() * nodes.length);
      while (to === from) to = Math.floor(Math.random() * nodes.length);
      attacks.push({ from, to, progress: 0, speed: 0.015 + Math.random() * 0.02 });
    };

    let t = 0;
    const draw = () => {
      t += 0.01;
      ctx.clearRect(0, 0, w, h);

      // Grid
      ctx.strokeStyle = 'rgba(0,255,65,0.06)';
      ctx.lineWidth = 0.5;
      for (let x = 0; x < w; x += 20) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
      for (let y = 0; y < h; y += 20) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }

      // World outline (abstract)
      ctx.strokeStyle = 'rgba(0,255,65,0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(w/2, h/2, w*0.4, h*0.35, 0, 0, Math.PI*2);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(w/2, h/2, w*0.35, h*0.3, 0, 0, Math.PI*2);
      ctx.stroke();

      // Nodes
      nodes.forEach((n, i) => {
        const x = n.x * w;
        const y = n.y * h;
        const pulse = Math.sin(t*2 + i) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(0,255,65,${0.3 * pulse})`;
        ctx.shadowColor = '#00ff41';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI*2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = 'rgba(0,255,65,0.2)';
        ctx.beginPath();
        ctx.arc(x, y, 8 + pulse*2, 0, Math.PI*2);
        ctx.stroke();
      });

      // Spawn randomly
      if (Math.random() < 0.03) spawnAttack();

      // Attacks
      attacks.forEach((a, idx) => {
        a.progress += a.speed;
        if (a.progress >= 1) { attacks.splice(idx, 1); return; }
        const from = nodes[a.from];
        const to = nodes[a.to];
        const fx = from.x * w, fy = from.y * h;
        const tx = to.x * w, ty = to.y * h;
        // Arc
        const mx = (fx + tx) / 2;
        const my = (fy + ty) / 2 - 30 * Math.sin(a.progress * Math.PI);
        // Path
        ctx.strokeStyle = `rgba(255,50,50,${0.3 * (1 - a.progress)})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(fx, fy);
        ctx.quadraticCurveTo(mx, my, tx, ty);
        ctx.stroke();
        // Moving dot
        const x = fx + (tx - fx) * a.progress;
        const y = fy + (ty - fy) * a.progress - 30 * Math.sin(a.progress * Math.PI) * Math.sin(a.progress * Math.PI);
        ctx.fillStyle = `rgba(255,80,80,${1 - a.progress*0.5})`;
        ctx.shadowColor = '#ff3333';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI*2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  if (compact) {
    return (
      <div className="w-full h-full relative overflow-hidden rounded-xl bg-black/40 border border-white/5">
        <canvas ref={canvasRef} width={300} height={160} className="w-full h-full" />
        <div className="absolute top-2 left-2 text-[9px] tracking-widest text-[#00ff41] font-mono bg-black/60 px-2 py-1 rounded-full border border-[#00ff41]/20">● LIVE THREAT MAP</div>
        <div className="absolute bottom-2 left-2 right-2 flex justify-between text-[9px] text-white/40 font-mono">
          <span>ATTACKS: 1,247</span>
          <span>BLOCKED: 98.4%</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[200px] relative overflow-hidden rounded-xl bg-black/60 border border-[#00ff41]/10">
      <canvas ref={canvasRef} width={400} height={200} className="w-full h-full" />
      <div className="absolute inset-0 pointer-events-none border border-[#00ff41]/5 rounded-xl" />
    </div>
  );
}
