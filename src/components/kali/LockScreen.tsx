import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { sounds, haptics } from '../../lib/sounds';
import { lazy, Suspense } from 'react';

// Lazy load Scene3D to avoid blocking initial paint
const Scene3D = lazy(() => import('../Scene3D'));

export default function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  const [time, setTime] = useState(new Date());

  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<'idle'|'scanning'|'success'>('idle');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [use3D, setUse3D] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Particle field behind lock
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let raf = 0;
    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      ctx.setTransform(dpr,0,0,dpr,0,0);
    };
    resize();
    window.addEventListener('resize', resize);
    const dots = Array.from({length: 60}, () => ({
      x: Math.random()*window.innerWidth,
      y: Math.random()*window.innerHeight,
      vx: (Math.random()-0.5)*0.3,
      vy: (Math.random()-0.5)*0.3,
      r: Math.random()*1.5+0.5,
    }));
    let t = 0;
    const draw = () => {
      t += 0.01;
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.fillRect(0,0,window.innerWidth, window.innerHeight);
      dots.forEach(d => {
        d.x += d.vx; d.y += d.vy;
        if (d.x<0||d.x>window.innerWidth) d.vx*=-1;
        if (d.y<0||d.y>window.innerHeight) d.vy*=-1;
        ctx.fillStyle = `rgba(0,255,65,${0.3 + Math.sin(t + d.x*0.01)*0.2})`;
        ctx.beginPath(); ctx.arc(d.x,d.y,d.r,0,Math.PI*2); ctx.fill();
      });
      // connections
      ctx.strokeStyle = 'rgba(0,255,65,0.05)';
      for(let i=0;i<dots.length;i++) for(let j=i+1;j<dots.length;j++){
        const dx=dots[i].x-dots[j].x, dy=dots[i].y-dots[j].y;
        const dist=Math.sqrt(dx*dx+dy*dy);
        if(dist<100){ ctx.globalAlpha=(1-dist/100)*0.15; ctx.beginPath(); ctx.moveTo(dots[i].x,dots[i].y); ctx.lineTo(dots[j].x,dots[j].y); ctx.stroke(); ctx.globalAlpha=1; }
      }
      raf=requestAnimationFrame(draw);
    };
    draw();
    return ()=> { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);

  const startUnlock = () => {
    if (stage !== 'idle') return;
    setStage('scanning');
    sounds.boot();
    haptics.medium();
    let p = 0;
    const iv = setInterval(() => {
      p += Math.random()*18 + 4;
      if (p >= 100) {
        p = 100;
        clearInterval(iv);
        setStage('success');
        sounds.unlock();
        haptics.success();
        setTimeout(onUnlock, 700);
      }
      setProgress(p);
    }, 90);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05, filter: 'blur(20px)' }}
      transition={{ duration: 0.6 }}
      className="absolute inset-0 z-[200] overflow-hidden bg-black flex flex-col"
      onClick={() => { if(stage==='idle') startUnlock(); }}
    >
      {use3D ? (
        <div className="absolute inset-0 opacity-60">
          <Suspense fallback={<canvas ref={canvasRef} className="absolute inset-0" />}>
            <Scene3D asBackground />
          </Suspense>
        </div>
      ) : (
        <canvas ref={canvasRef} className="absolute inset-0" />
      )}
      {/* Gradient orbs */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full opacity-20 blur-[80px]" style={{ background: 'radial-gradient(circle, rgba(0,255,65,0.4), transparent 70%)' }} />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full opacity-10 blur-[80px]" style={{ background: 'radial-gradient(circle, rgba(0,255,255,0.5), transparent 70%)' }} />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full opacity-10 blur-[80px]" style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.4), transparent 70%)' }} />
      </div>

      {/* Top bar */}
      <div className="relative z-10 h-8 flex items-center justify-between px-6 text-[11px] text-white/60">
        <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_#00ff41]" /> NEXUS OS • ENCRYPTED</span>
        <span className="hidden md:flex items-center gap-3">
          <button
            onClick={(e) => { e.stopPropagation(); setUse3D(v => !v); }}
            className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] hover:bg-white/10 transition-colors"
            title="Toggle 3D background"
          >
            {use3D ? '◉ 3D' : '○ 3D'}
          </button>
          <span>🔋 87%</span>
          <span>📶</span>
          <span className="font-mono text-white">{time.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
        </span>
      </div>

      {/* Center */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center">
        {/* Time */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="font-orbitron text-[56px] md:text-[84px] font-black tracking-tighter leading-none text-white" style={{ textShadow: '0 0 40px rgba(0,255,65,0.3), 0 0 80px rgba(0,255,65,0.15)' }}>
            {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
          </div>
          <div className="text-white/60 text-sm md:text-base tracking-[0.3em] mt-1">
            {time.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </div>
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] text-white/70 backdrop-blur-xl">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00ff41] animate-pulse" />
            {(() => {
              try {
                const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
                const offset = -new Date().getTimezoneOffset() / 60;
                const offsetStr = (offset >= 0 ? '+' : '') + offset;
                return `${tz.replace('_', ' ')} • GMT${offsetStr}`;
              } catch { return 'Local Time'; }
            })()}
          </div>
        </motion.div>

        {/* Biometric */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4, type: 'spring', damping: 20 }}
          className="relative"
        >
          <div className="relative w-[160px] h-[160px] md:w-[180px] md:h-[180px]">
            {/* Outer rings */}
            <div className="absolute inset-0 rounded-full border border-[#00ff41]/20 animate-pulse" />
            <div className="absolute inset-2 rounded-full border border-[#00ff41]/10" style={{ animation: 'pulse-glow 3s infinite' }} />
            <div className="absolute inset-4 rounded-full border border-dashed border-[#00ff41]/15" style={{ animation: 'spin 12s linear infinite' } as any} />
            {/* Scan line */}
            {stage === 'scanning' && (
              <motion.div
                initial={{ top: '10%' }}
                animate={{ top: '85%' }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                className="absolute left-4 right-4 h-[2px] bg-gradient-to-r from-transparent via-[#00ff41] to-transparent shadow-[0_0_10px_#00ff41] z-10"
              />
            )}
            {/* Inner face */}
            <div
              onClick={(e) => { e.stopPropagation(); startUnlock(); }}
              className="absolute inset-6 rounded-full bg-gradient-to-br from-[#0a0f0a] to-black border border-[#00ff41]/30 flex flex-col items-center justify-center cursor-pointer overflow-hidden group hover:border-[#00ff41]/60 transition-colors"
              style={{ boxShadow: stage === 'success' ? '0 0 40px rgba(0,255,65,0.6), inset 0 0 20px rgba(0,255,65,0.1)' : '0 20px 60px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.05)' }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#00ff41]/10 via-transparent to-[#00ffff]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              {stage === 'success' ? (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-4xl">✓</motion.div>
              ) : stage === 'scanning' ? (
                <div className="text-center">
                  <div className="text-2xl animate-pulse">◉</div>
                  <div className="text-[10px] tracking-widest text-[#00ff41] mt-1 font-mono">{Math.round(progress)}%</div>
                </div>
              ) : (
                <>
                  <div className="text-3xl group-hover:scale-110 transition-transform">⬢</div>
                  <div className="text-[10px] tracking-[0.2em] text-white/60 mt-1 font-mono">TOUCH ID</div>
                  <div className="text-[9px] text-[#00ff41]/60">اضغط للفتح</div>
                </>
              )}
              {/* Progress ring */}
              <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="48" fill="none" stroke="rgba(0,255,65,0.1)" strokeWidth="1" />
                <motion.circle
                  cx="50" cy="50" r="48" fill="none" stroke="#00ff41" strokeWidth="2"
                  strokeLinecap="round"
                  strokeDasharray={301.6}
                  strokeDashoffset={301.6 - (301.6 * progress / 100)}
                  style={{ filter: 'drop-shadow(0 0 6px #00ff41)' }}
                />
              </svg>
            </div>
            {/* Corner markers */}
            {[
              'top-0 left-0 border-t-2 border-l-2 rounded-tl-2xl',
              'top-0 right-0 border-t-2 border-r-2 rounded-tr-2xl',
              'bottom-0 left-0 border-b-2 border-l-2 rounded-bl-2xl',
              'bottom-0 right-0 border-b-2 border-r-2 rounded-br-2xl',
            ].map((c, i) => (
              <div key={i} className={`absolute w-6 h-6 border-[#00ff41]/40 ${c}`} />
            ))}
          </div>

          <div className="mt-4 text-center">
            <div className="text-sm font-bold text-white tracking-wide">
              {stage === 'idle' ? 'المس للفتح • Tap to unlock' : stage === 'scanning' ? 'جاري المسح...' : 'تم ✓'}
            </div>
            <div className="text-[11px] text-white/40 font-mono">
              {stage === 'idle' ? 'Face ID • Fingerprint • Passcode' : stage === 'scanning' ? 'Quantum encryption • Verifying...' : 'Welcome, root'}
            </div>
          </div>
        </motion.div>

        {/* Notifications */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 w-full max-w-[360px] space-y-2"
        >
          {[
            { icon: '🛡️', title: 'Threat blocked', desc: 'SQL injection from 185.220.101.47 • Blocked', time: 'now' },
            { icon: '⬣', title: 'Nmap scan complete', desc: '127.0.0.1 — 3 open ports found', time: '2m' },
          ].map((n, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.06] backdrop-blur-xl border border-white/10 text-left">
              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-sm">{n.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-white">{n.title}</div>
                <div className="text-[11px] text-white/50 truncate">{n.desc}</div>
              </div>
              <span className="text-[10px] text-white/30">{n.time}</span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Bottom */}
      <div className="relative z-10 p-6 flex items-center justify-between">
        <button className="w-10 h-10 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white/60">🔦</button>
        <div className="flex flex-col items-center gap-2">
          <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 1.5, repeat: Infinity }} className="text-white/40 text-xs">⌃ اسحب للأعلى للفتح</motion.div>
          <div className="w-32 h-1 rounded-full bg-white/20" />
        </div>
        <button className="w-10 h-10 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white/60">📷</button>
      </div>
    </motion.div>
  );
}
