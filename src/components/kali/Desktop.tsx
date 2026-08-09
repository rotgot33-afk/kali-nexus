import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Wallpaper from './Wallpaper';
import TopBar from './TopBar';
import Dock from './Dock';
import Window from './Window';
import Spotlight from './Spotlight';
import AIAssistant from './AIAssistant';
import ThreatMap from './ThreatMap';
import ControlCenter from './ControlCenter';
import NotificationCenter from './NotificationCenter';
import { sounds, haptics } from '../../lib/sounds';
import type { AppWindow } from './types';

const appConfigs: Record<string, { title: string; icon: string; content: string; w: number; h: number }> = {
  realterminal: { title: 'Real Shell — PTY • WebSocket', icon: '◼', content: 'realterminal', w: 860, h: 540 },
  terminal: { title: 'Terminal — NEXUS SHELL', icon: '▣', content: 'terminal', w: 720, h: 480 },
  files: { title: 'Files — NEXUS FS', icon: '⬢', content: 'files', w: 820, h: 520 },
  nmap: { title: 'Nmap — Network Scanner', icon: '⬣', content: 'nmap', w: 840, h: 580 },
  metasploit: { title: 'Metasploit — Framework 6.4', icon: '⬔', content: 'metasploit', w: 880, h: 580 },
  burpsuite: { title: 'Burp Suite — Professional', icon: '⬓', content: 'burpsuite', w: 920, h: 620 },
  wireshark: { title: 'Wireshark — Packet Analyzer', icon: '⬔', content: 'wireshark', w: 920, h: 620 },
  settings: { title: 'Settings — NEXUS OS', icon: '⬡', content: 'settings', w: 740, h: 540 },
};

const desktopIcons = [
  { id: 'realterminal', name: 'Real Shell', icon: '◼', desc: 'PTY • Live' },
  { id: 'terminal', name: 'Terminal', icon: '▣', desc: 'NEXUS SHELL' },
  { id: 'files', name: 'Files', icon: '⬢', desc: 'File System' },
  { id: 'nmap', name: 'Nmap', icon: '⬣', desc: 'Scanner' },
  { id: 'metasploit', name: 'Metasploit', icon: '⬔', desc: 'Exploit' },
  { id: 'burpsuite', name: 'Burp Suite', icon: '⬓', desc: 'Web Sec' },
  { id: 'wireshark', name: 'Wireshark', icon: '⬔', desc: 'Analyzer' },
  { id: 'settings', name: 'Settings', icon: '⬡', desc: 'System' },
];

export default function Desktop() {
  const [windows, setWindows] = useState<AppWindow[]>([]);
  const [zCounter, setZCounter] = useState(100);
  const [spotlightOpen, setSpotlightOpen] = useState(false);
  const [controlOpen, setControlOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [showWidgets, setShowWidgets] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => openApp('realterminal'), 1200);
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSpotlightOpen(o => !o);
      }
      if (e.key === 'Escape' && spotlightOpen) setSpotlightOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => { clearTimeout(t); window.removeEventListener('keydown', onKey); };
  }, [spotlightOpen]);

  useEffect(() => {
    setShowWidgets(windows.filter(w => !w.minimized).length === 0);
  }, [windows]);

  const openApp = (id: string) => {
    sounds.open(); haptics.light();
    const config = appConfigs[id];
    if (!config) return;
    const existing = windows.find(w => w.id === id);
    if (existing) {
      if (existing.minimized) {
        setWindows(ws => ws.map(w => w.id === id ? { ...w, minimized: false, zIndex: zCounter + 1 } : w));
        setZCounter(z => z + 1);
      } else {
        focusWindow(id);
      }
      return;
    }
    const offset = windows.length * 28;
    const isMobile = window.innerWidth < 768;
    const newWindow: AppWindow = {
      id,
      title: config.title,
      icon: config.icon,
      content: config.content,
      x: isMobile ? 8 : 90 + offset,
      y: isMobile ? 50 : 52 + offset,
      width: isMobile ? window.innerWidth - 16 : config.w,
      height: isMobile ? window.innerHeight - 140 : config.h,
      minimized: false,
      maximized: isMobile,
      zIndex: zCounter + 1,
    };
    setWindows(ws => [...ws, newWindow]);
    setZCounter(z => z + 1);
  };

  const closeWindow = (id: string) => { sounds.close(); haptics.light(); setWindows(ws => ws.filter(w => w.id !== id)); };
  const minimizeWindow = (id: string) => { sounds.minimize(); setWindows(ws => ws.map(w => w.id === id ? { ...w, minimized: true } : w)); };
  const maximizeWindow = (id: string) => { sounds.maximize(); haptics.light(); setWindows(ws => ws.map(w => w.id === id ? { ...w, maximized: !w.maximized } : w)); };
  const focusWindow = (id: string) => {
    setZCounter(z => {
      const nz = z + 1;
      setWindows(ws => ws.map(w => w.id === id ? { ...w, zIndex: nz } : w));
      return nz;
    });
  };

  return (
    <div className="absolute inset-0 overflow-hidden bg-black text-white" dir="ltr">
      <Wallpaper />
      <TopBar onOpenControl={() => setControlOpen(true)} onOpenNotif={() => setNotifOpen(true)} />

      {/* Desktop */}
      <div className="absolute top-8 left-0 right-0 bottom-0 flex">
        {/* Icons column */}
        <div className="w-[88px] md:w-[96px] p-2 md:p-3 flex flex-col gap-1.5 md:gap-2 z-10 overflow-y-auto scrollbar-hide">
          {desktopIcons.map((icon, i) => (
            <motion.button
              key={icon.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.05 }}
              whileHover={{ scale: 1.05, x: 2 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => openApp(icon.id)}
              onDoubleClick={() => openApp(icon.id)}
              className="group flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-white/[0.06] hover:backdrop-blur-xl border border-transparent hover:border-white/5 transition-all"
            >
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-[14px] flex items-center justify-center text-xl md:text-2xl relative overflow-hidden border border-white/10 group-hover:border-[#00ff41]/30 transition-colors"
                style={{ background: 'radial-gradient(120% 120% at 30% 20%, rgba(0,255,65,0.15), transparent 60%), linear-gradient(135deg, rgba(255,255,255,0.06), rgba(0,0,0,0.4))', boxShadow: '0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)' }}>
                <span className="relative z-10 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] group-hover:drop-shadow-[0_0_12px_rgba(0,255,65,0.6)] transition-all">{icon.icon}</span>
                <div className="absolute inset-0 bg-gradient-to-b from-white/[0.08] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="text-center">
                <div className="text-[10px] md:text-[11px] font-medium text-white/90 group-hover:text-white leading-none">{icon.name}</div>
                <div className="text-[8px] text-white/40 group-hover:text-[#00ff41]/60 hidden md:block">{icon.desc}</div>
              </div>
            </motion.button>
          ))}

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }} className="mt-2 p-2 rounded-xl bg-[#00ff41]/5 border border-[#00ff41]/10 hidden md:block">
            <div className="text-[9px] tracking-[0.15em] text-[#00ff41]/60 font-mono">QUICK ACTIONS</div>
            <button onClick={() => setSpotlightOpen(true)} className="mt-1.5 w-full text-left px-2 py-1 rounded-lg bg-black/20 border border-white/5 text-[11px] text-white/60 hover:text-white flex items-center gap-1.5">
              <span>⌘K</span> Search
            </button>
          </motion.div>
        </div>

        {/* Center - Widgets when no windows */}
        <div className="flex-1 relative p-3 md:p-6 overflow-hidden">
          <AnimatePresence>
            {showWidgets && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="h-full grid grid-rows-[auto_1fr] gap-4 max-w-[1100px] mx-auto"
              >
                {/* Hero */}
                <div className="rounded-[20px] overflow-hidden border border-white/10 relative" style={{ background: 'linear-gradient(135deg, rgba(0,255,65,0.08), rgba(0,255,255,0.04), rgba(0,0,0,0.6))', backdropFilter: 'blur(20px)' }}>
                  <div className="absolute inset-0 bg-gradient-to-br from-[#00ff41]/5 via-transparent to-[#00ffff]/5" />
                  <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                  <div className="relative p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 rounded-full bg-[#00ff41]/15 border border-[#00ff41]/30 text-[#00ff41] text-[10px] font-bold tracking-widest">● LIVE SYSTEM</span>
                        <span className="text-[10px] text-white/40">NEXUS OS v4.0 • QUANTUM EDITION</span>
                      </div>
                      <h1 className="font-orbitron text-2xl md:text-3xl font-black tracking-tight">
                        <span className="text-white">KALI</span> <span className="gradient-text">NEXUS</span>
                      </h1>
                      <p className="text-sm text-white/60 mt-1 max-w-[520px]">نظام اختبار الاختراق المتقدم — طرفية حقيقية، أدوات فعلية، ذكاء اصطناعي. اضغط <span className="text-[#00ff41]">⌘K</span> للبحث.</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => openApp('realterminal')} className="px-4 py-2.5 rounded-xl bg-[#00ff41] text-black font-bold text-sm hover:bg-[#00ff41]/90 transition-colors shadow-[0_10px_30px_rgba(0,255,65,0.3)]">▶ Real Shell</button>
                      <button onClick={() => setSpotlightOpen(true)} className="px-4 py-2.5 rounded-xl bg-white/10 border border-white/10 text-white font-medium text-sm hover:bg-white/15 transition-colors backdrop-blur-xl">⌕ Search</button>
                    </div>
                  </div>
                </div>

                {/* Widgets grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 min-h-0">
                  {/* Threat Map */}
                  <div className="md:col-span-2 rounded-[16px] overflow-hidden border border-white/10 p-3 flex flex-col" style={{ background: 'rgba(10,10,15,0.6)', backdropFilter: 'blur(20px)' }}>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xs font-bold tracking-widest text-white/80 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_#ff3333]" /> GLOBAL THREAT MAP</h3>
                      <span className="text-[10px] text-white/30">LIVE • 42 ATTACKS/MIN</span>
                    </div>
                    <div className="flex-1 min-h-[160px]"><ThreatMap compact /></div>
                  </div>

                  {/* System */}
                  <div className="rounded-[16px] border border-white/10 p-3 flex flex-col gap-3" style={{ background: 'rgba(10,10,15,0.6)', backdropFilter: 'blur(20px)' }}>
                    <h3 className="text-xs font-bold tracking-widest text-white/80 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#00ff41] animate-pulse shadow-[0_0_8px_#00ff41]" /> SYSTEM</h3>
                    
                    {[
                      { label: 'CPU', value: 42, color: '#00ff41' },
                      { label: 'RAM', value: 68, color: '#00aaff' },
                      { label: 'NET', value: 31, color: '#ffaa00' },
                    ].map(s => (
                      <div key={s.label} className="space-y-1">
                        <div className="flex justify-between text-[11px]"><span className="text-white/60">{s.label}</span><span className="font-mono" style={{ color: s.color }}>{s.value}%</span></div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${s.value}%` }} transition={{ delay: 1, duration: 1 }} className="h-full rounded-full" style={{ background: s.color, boxShadow: `0 0 10px ${s.color}` }} />
                        </div>
                      </div>
                    ))}

                    <div className="mt-auto grid grid-cols-3 gap-2 pt-3 border-t border-white/5">
                      {[
                        { k: 'UPTIME', v: '3d 14h' },
                        { k: 'PROCS', v: '247' },
                        { k: 'THREATS', v: '12' },
                      ].map(s => (
                        <div key={s.k} className="text-center p-2 rounded-xl bg-white/[0.03] border border-white/5">
                          <div className="text-[9px] tracking-widest text-white/30">{s.k}</div>
                          <div className="text-sm font-bold text-white font-mono">{s.v}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Quick tools */}
                  <div className="md:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-2">
                    {[
                      { id: 'nmap', icon: '⬣', name: 'Scan Network', desc: 'nmap -sV', color: '#a855f7' },
                      { id: 'terminal', icon: '▣', name: 'Run Command', desc: 'whoami, ls, ps', color: '#00ff41' },
                      { id: 'files', icon: '⬢', name: 'Browse Files', desc: 'Real FS', color: '#00aaff' },
                      { id: 'wireshark', icon: '⬔', name: 'Capture', desc: 'Wireshark', color: '#06b6d4' },
                    ].map(card => (
                      <button key={card.id} onClick={() => openApp(card.id)} className="group text-left p-3 rounded-[14px] border border-white/10 hover:border-white/20 transition-all hover:scale-[1.02] flex items-center gap-3" style={{ background: `linear-gradient(135deg, ${card.color}08, transparent)` }}>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg border border-white/10 group-hover:scale-110 transition-transform" style={{ background: `${card.color}15`, color: card.color, borderColor: `${card.color}20` }}>{card.icon}</div>
                        <div>
                          <div className="text-xs font-bold text-white group-hover:text-white">{card.name}</div>
                          <div className="text-[10px] text-white/40 font-mono">{card.desc}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Windows */}
          {windows.filter(w => !w.minimized).map(w => (
            <Window key={w.id} app={w} onClose={() => closeWindow(w.id)} onMinimize={() => minimizeWindow(w.id)} onMaximize={() => maximizeWindow(w.id)} onFocus={() => focusWindow(w.id)} />
          ))}

          {/* Minimized pills */}
          {windows.filter(w => w.minimized).length > 0 && (
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-2 z-30">
              {windows.filter(w => w.minimized).map(w => (
                <button key={w.id} onClick={() => { setWindows(ws => ws.map(win => win.id === w.id ? { ...win, minimized: false, zIndex: zCounter + 1 } : win)); setZCounter(z=>z+1); }} className="px-3 py-2 rounded-full bg-[#0a0a0f]/90 backdrop-blur-xl border border-white/10 text-xs flex items-center gap-2 hover:border-[#00ff41]/30 transition-colors shadow-xl">
                  <span>{w.icon}</span>
                  <span className="max-w-[100px] truncate">{w.title.split('—')[0]}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dock apps={windows} onAppClick={openApp} />
      <Spotlight open={spotlightOpen} onClose={() => setSpotlightOpen(false)} onSelect={openApp} />
      <ControlCenter open={controlOpen} onClose={() => setControlOpen(false)} />
      <NotificationCenter open={notifOpen} onClose={() => setNotifOpen(false)} />
      <AIAssistant onExecute={openApp} />

      {/* Hotkey hint */}
      <div className="fixed bottom-2 left-1/2 -translate-x-1/2 hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-xl border border-white/5 text-[10px] text-white/40 z-20">
        <span>⌘K Search</span>
        <span className="w-1 h-1 rounded-full bg-white/20" />
        <span>Drag windows • Resize from corner</span>
        <span className="w-1 h-1 rounded-full bg-white/20" />
        <span className="text-[#00ff41]">● Real Backend</span>
      </div>
    </div>
  );
}
