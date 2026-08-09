import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { sounds, haptics } from '../../lib/sounds';

export default function ControlCenter({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [brightness, setBrightness] = useState(85);
  const [volume, setVolume] = useState(60);
  const [toggles, setToggles] = useState({
    wifi: true, bluetooth: true, airdrop: false, vpn: true,
    focus: false, airplane: false,
  });
  const [theme, setTheme] = useState<'matrix'|'neon'|'midnight'|'cyber'>('matrix');

  const themes = [
    { id: 'matrix', name: 'Matrix', color: '#00ff41', bg: 'from-[#001a05] to-black' },
    { id: 'neon', name: 'Neon', color: '#00ffff', bg: 'from-[#001a1a] to-black' },
    { id: 'midnight', name: 'Midnight', color: '#a855f7', bg: 'from-[#0f0a1a] to-black' },
    { id: 'cyber', name: 'Cyber', color: '#ff0066', bg: 'from-[#1a0010] to-black' },
  ] as const;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[90]" onClick={onClose} />
          <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed top-9 right-2 md:right-4 w-[92%] max-w-[360px] max-h-[85vh] overflow-y-auto scrollbar-thin z-[91] rounded-[20px] border border-white/10 p-3 space-y-3"
            style={{ background: 'rgba(12,12,16,0.9)', backdropFilter: 'blur(40px)', boxShadow: '0 30px 80px rgba(0,0,0,0.7)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="font-orbitron text-xs tracking-[0.2em] text-white/60">CONTROL CENTER</h2>
              <button onClick={onClose} className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white">✕</button>
            </div>

            {/* Toggles grid */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { k: 'wifi', icon: '📶', label: 'Wi-Fi' },
                { k: 'bluetooth', icon: '◈', label: 'BT' },
                { k: 'airdrop', icon: '⬡', label: 'Drop' },
                { k: 'vpn', icon: '🛡️', label: 'VPN' },
                { k: 'focus', icon: '🌙', label: 'Focus' },
                { k: 'airplane', icon: '✈️', label: 'Flight' },
              ].map(item => {
                const active = (toggles as any)[item.k];
                return (
                  <button
                    key={item.k}
                    onClick={() => {
                      setToggles(s => ({ ...s, [item.k]: !(s as any)[item.k] }));
                      sounds.click(); haptics.light();
                    }}
                    className={`p-3 rounded-2xl border flex flex-col items-center gap-1 transition-all ${active ? 'bg-[#00ff41] text-black border-[#00ff41] shadow-[0_0_20px_rgba(0,255,65,0.3)] scale-[1.02]' : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'}`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span className="text-[10px] font-bold tracking-wide">{item.label}</span>
                    <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-black/40' : 'bg-white/20'}`} />
                  </button>
                );
              })}
              <div className="col-span-2 p-3 rounded-2xl bg-gradient-to-br from-[#00ff41]/15 to-transparent border border-[#00ff41]/20 flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#00ff41]/20 flex items-center justify-center">🔋</div>
                <div>
                  <div className="text-xs font-bold text-white">87% • Charging</div>
                  <div className="text-[10px] text-white/50">2h 14m remaining</div>
                </div>
              </div>
            </div>

            {/* Sliders */}
            <div className="space-y-2">
              <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-3">
                <span className="text-white/60">☀️</span>
                <input type="range" min={0} max={100} value={brightness} onChange={e => setBrightness(parseInt(e.target.value))} className="flex-1 accent-[#00ff41] h-1" />
                <span className="text-xs font-mono text-white w-8">{brightness}%</span>
              </div>
              <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-3">
                <span className="text-white/60">🔊</span>
                <input type="range" min={0} max={100} value={volume} onChange={e => setVolume(parseInt(e.target.value))} className="flex-1 accent-[#00ff41] h-1" />
                <span className="text-xs font-mono text-white w-8">{volume}%</span>
              </div>
            </div>

            {/* Themes */}
            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5">
              <div className="text-[10px] tracking-widest text-white/40 mb-2">THEME • QUANTUM EDITION</div>
              <div className="grid grid-cols-4 gap-2">
                {themes.map(t => (
                  <button
                    key={t.id}
                    onClick={() => { setTheme(t.id); document.documentElement.style.setProperty('--accent', t.color); sounds.click(); }}
                    className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${theme === t.id ? 'border-white/30 scale-105' : 'border-white/5 hover:border-white/15'}`}
                    style={{ background: theme === t.id ? t.color + '15' : 'rgba(255,255,255,0.03)' }}
                  >
                    <div className="w-8 h-8 rounded-full border-2" style={{ background: t.color, borderColor: 'rgba(255,255,255,0.2)', boxShadow: `0 0 12px ${t.color}` }} />
                    <span className="text-[10px] font-bold" style={{ color: theme === t.id ? t.color : 'rgba(255,255,255,0.6)' }}>{t.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Music */}
            <div className="p-3 rounded-2xl overflow-hidden relative border border-white/10" style={{ background: 'linear-gradient(135deg, rgba(0,255,65,0.08), rgba(0,0,0,0.6))' }}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#00ff41] to-[#00aaff] flex items-center justify-center text-xl">♫</div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-white truncate">Hack The Planet • The Prodigy</div>
                  <div className="text-[11px] text-white/50">NEXUS Radio • Live</div>
                  <div className="mt-1 h-1 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full w-[42%] bg-[#00ff41] rounded-full" />
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white">⏮</button>
                  <button className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center">⏸</button>
                  <button className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white">⏭</button>
                </div>
              </div>
            </div>

            {/* Focus */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-2xl bg-[#ff3b30]/10 border border-[#ff3b30]/20">
                <div className="text-[10px] tracking-widest text-[#ff3b30]">FOCUS • DEEP WORK</div>
                <div className="text-xs font-bold text-white mt-1">2h 00m • Pomodoro</div>
                <div className="text-[10px] text-white/50">Do Not Disturb • ON</div>
              </div>
              <div className="p-3 rounded-2xl bg-[#00ff41]/10 border border-[#00ff41]/20">
                <div className="text-[10px] tracking-widest text-[#00ff41]">SCREEN TIME</div>
                <div className="text-xs font-bold text-white mt-1">4h 22m today</div>
                <div className="text-[10px] text-white/50">-12% vs yesterday</div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
