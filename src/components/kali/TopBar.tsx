import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';

export default function TopBar({ onOpenControl, onOpenNotif }: { onOpenControl?: () => void; onOpenNotif?: () => void }) {
  const [time, setTime] = useState(new Date());
  const [showMenu, setShowMenu] = useState<string | null>(null);
  const [threatLevel] = useState<'LOW'|'MED'|'HIGH'>('MED');
  const cpuRef = useRef<HTMLCanvasElement>(null);
  const netRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Mini CPU graph
  useEffect(() => {
    const canvas = cpuRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const data: number[] = Array.from({length: 20}, () => 20 + Math.random()*60);
    let raf = 0;
    const draw = () => {
      data.shift();
      data.push(20 + Math.random()*60 + Math.sin(Date.now()*0.002)*10);
      ctx.clearRect(0,0,canvas.width,canvas.height);
      ctx.strokeStyle = '#00ff41';
      ctx.lineWidth = 1;
      ctx.beginPath();
      data.forEach((v,i) => {
        const x = (i / (data.length-1)) * canvas.width;
        const y = canvas.height - (v/100)*canvas.height;
        if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
      });
      ctx.stroke();
      ctx.fillStyle = 'rgba(0,255,65,0.1)';
      ctx.lineTo(canvas.width, canvas.height);
      ctx.lineTo(0, canvas.height);
      ctx.closePath();
      ctx.fill();
      raf = requestAnimationFrame(() => setTimeout(draw, 200));
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const canvas = netRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const data = Array.from({length: 20}, () => Math.random()*40);
    let raf = 0;
    const draw = () => {
      data.shift();
      data.push(Math.random()*40 + Math.sin(Date.now()*0.005)*15);
      ctx.clearRect(0,0,canvas.width,canvas.height);
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      data.forEach((v,i) => {
        const x = (i / (data.length-1)) * canvas.width;
        const y = canvas.height/2 + (v-20)*0.4;
        if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
      });
      ctx.stroke();
      raf = requestAnimationFrame(() => setTimeout(draw, 150));
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  const menus = [
    { id: 'activities', label: 'Activities' },
    { id: 'applications', label: 'Applications' },
    { id: 'places', label: 'Places' },
  ];

  return (
    <div className="absolute top-0 left-0 right-0 h-8 bg-[#050507]/90 backdrop-blur-2xl border-b border-[#00ff41]/20 flex items-center px-3 z-50 text-xs text-gray-300">
      {/* Glow line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00ff41]/50 to-transparent" />
      
      {/* Left */}
      <div className="flex items-center gap-1">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#00ff41] to-[#00aa2a] flex items-center justify-center text-black font-black text-[10px] mr-2 shadow-[0_0_10px_rgba(0,255,65,0.5)]">⬢</div>
        {menus.map((m) => (
          <button
            key={m.id}
            onClick={() => setShowMenu(showMenu === m.id ? null : m.id)}
            className={`px-3 py-1 rounded-md text-[11px] font-medium tracking-wide transition-all ${showMenu === m.id ? 'bg-[#00ff41]/15 text-[#00ff41] border border-[#00ff41]/30' : 'hover:bg-white/5'}`}
          >
            {m.label}
          </button>
        ))}
        <div className="hidden md:flex items-center gap-1 ml-3 pl-3 border-l border-white/10">
          <span className="text-[10px] text-white/50">THREAT</span>
          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
            threatLevel==='LOW' ? 'bg-green-500/20 text-green-400' :
            threatLevel==='MED' ? 'bg-yellow-500/20 text-yellow-400' :
            'bg-red-500/20 text-red-400'
          }`}>{threatLevel}</span>
        </div>
      </div>

      {/* Center */}
      <div className="flex-1 flex items-center justify-center gap-3">
        <div className="hidden md:flex items-center gap-2">
          <canvas ref={cpuRef} width={40} height={16} className="opacity-70" />
          <span className="text-[9px] text-white/40">CPU</span>
        </div>
        <div className="font-mono-kali text-[#00ff41] text-[11px] tracking-widest px-3 py-0.5 rounded-full bg-[#00ff41]/10 border border-[#00ff41]/20">
          root@kali: ~#
        </div>
        <div className="hidden md:flex items-center gap-2">
          <span className="text-[9px] text-white/40">NET</span>
          <canvas ref={netRef} width={40} height={16} className="opacity-70" />
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-1">
        <button onClick={onOpenNotif} className="hidden md:flex items-center gap-1 px-2 py-1 hover:bg-white/5 rounded-lg cursor-pointer">
          <span className="text-[11px]">🔔</span>
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
        </button>
        <button onClick={onOpenControl} className="hidden lg:flex items-center gap-0.5 px-2 py-1 rounded-full bg-white/5 border border-white/5 hover:bg-white/10">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shadow-[0_0_6px_#00ff41]" />
          <span className="text-[10px]">VPN</span>
          <span className="text-white/20 mx-1">•</span>
          <span className="text-[10px] font-mono">192.168.1.105</span>
        </button>
        <button onClick={onOpenControl} className="hidden md:flex items-center gap-1 px-2 py-1 hover:bg-white/5 rounded-lg cursor-pointer">
          <span className="text-[11px]">🌐</span>
          <span className="w-1 h-1 rounded-full bg-green-400 animate-pulse" />
        </button>
        <button onClick={onOpenControl} className="hidden md:flex items-center gap-1 px-2 py-1 hover:bg-white/5 rounded-lg cursor-pointer text-[11px]">🔋 87%</button>
        <div className="h-4 w-px bg-white/10 mx-1 hidden md:block" />
        <div className="text-right leading-none cursor-pointer hover:opacity-80">
          <div className="text-[11px] font-mono text-white">{time.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
          <div className="text-[9px] text-[#00ff41] font-mono">{time.toLocaleTimeString('en-US', { hour12: false })}</div>
        </div>
        <button onClick={onOpenControl} className="w-7 h-7 rounded-full bg-gradient-to-br from-[#1a1a1f] to-[#0a0a0f] border border-[#00ff41]/20 flex items-center justify-center ml-2 hover:border-[#00ff41]/40 transition-colors">
          <span className="text-[11px]">⚙️</span>
        </button>
      </div>

      {showMenu && (
        <motion.div
          initial={{ opacity: 0, y: -8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="absolute top-9 left-2 bg-[#0a0a0f]/95 backdrop-blur-2xl border border-[#00ff41]/20 rounded-xl shadow-2xl min-w-[240px] py-2 overflow-hidden"
          style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(0,255,65,0.1)' }}
        >
          <div className="px-3 py-2 text-[#00ff41] text-[10px] tracking-[0.2em] font-orbitron border-b border-[#00ff41]/10 flex items-center justify-between">
            <span>{showMenu.toUpperCase()}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#00ff41] animate-pulse" />
          </div>
          {showMenu === 'applications' && (
            <div className="py-1 max-h-[60vh] overflow-y-auto scrollbar-thin">
              {[
                '01 — Information Gathering',
                '02 — Vulnerability Analysis',
                '03 — Web Application Analysis',
                '04 — Database Assessment',
                '05 — Password Attacks',
                '06 — Wireless Attacks',
                '07 — Reverse Engineering',
                '08 — Exploitation Tools',
                '09 — Sniffing & Spoofing',
                '10 — Post Exploitation',
                '11 — Forensics',
                '12 — Reporting Tools',
              ].map(item => (
                <div key={item} className="px-3 py-1.5 hover:bg-[#00ff41]/10 cursor-pointer text-[11px] flex items-center gap-2 group">
                  <span className="w-1 h-1 rounded-full bg-[#00ff41]/50 group-hover:bg-[#00ff41] group-hover:shadow-[0_0_6px_#00ff41]" />
                  {item}
                </div>
              ))}
            </div>
          )}
          {showMenu === 'places' && (
            <div className="py-1">
              {['🏠 Home', '📁 Documents', '⬇️ Downloads', '🖼️ Pictures', '💽 File System'].map(i => (
                <div key={i} className="px-3 py-1.5 hover:bg-[#00ff41]/10 cursor-pointer text-[11px]">{i}</div>
              ))}
            </div>
          )}
          {showMenu === 'activities' && (
            <div className="py-1">
              {['🔍 Search', '📊 System Monitor', '⚙️ Settings', '🎯 Threat Map'].map(i => (
                <div key={i} className="px-3 py-1.5 hover:bg-[#00ff41]/10 cursor-pointer text-[11px]">{i}</div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {showMenu && <div className="fixed inset-0 z-[-1]" onClick={() => setShowMenu(null)} />}
    </div>
  );
}
