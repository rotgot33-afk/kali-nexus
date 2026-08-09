import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

const initialNotifications = [
  { id: 1, app: 'Nmap', icon: '⬣', title: 'Scan completed', desc: '127.0.0.1 — 3 ports open (22, 80, 443)', time: 'now', color: '#a855f7' },
  { id: 2, app: 'Firewall', icon: '🛡️', title: 'Intrusion blocked', desc: 'SQLi attempt from 185.220.101.47', time: '2m ago', color: '#ff3b30' },
  { id: 3, app: 'System', icon: '⚙️', title: 'Update available', desc: 'NEXUS OS 4.0.2 • 42 MB', time: '1h ago', color: '#00ff41' },
  { id: 4, app: 'Wireshark', icon: '⬔', title: 'Capture finished', desc: '1,247 packets • 12.4 MB', time: '3h ago', color: '#06b6d4' },
];

export default function NotificationCenter({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [notifications, setNotifications] = useState(initialNotifications);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/20 z-[90]" onClick={onClose} />
          <motion.div
            initial={{ x: -380, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -380, opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed top-9 left-2 md:left-4 w-[92%] max-w-[360px] max-h-[80vh] overflow-hidden z-[91] rounded-[20px] border border-white/10 flex flex-col"
            style={{ background: 'rgba(12,12,16,0.92)', backdropFilter: 'blur(40px)', boxShadow: '0 30px 80px rgba(0,0,0,0.7)' }}
          >
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <h2 className="font-orbitron text-xs tracking-[0.2em] text-white/60">NOTIFICATIONS</h2>
              <div className="flex items-center gap-2">
                <span className="text-[11px] px-2 py-1 rounded-full bg-[#00ff41]/15 text-[#00ff41] border border-[#00ff41]/20">{notifications.length}</span>
                <button onClick={() => setNotifications([])} className="text-[11px] text-white/40 hover:text-white">Clear</button>
                <button onClick={onClose} className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60">✕</button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin">
              <AnimatePresence>
                {notifications.map(n => (
                  <motion.div
                    key={n.id}
                    layout
                    initial={{ opacity: 0, scale: 0.96, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, x: -20 }}
                    className="p-3 rounded-2xl border border-white/5 flex gap-3 group hover:border-white/10 transition-colors"
                    style={{ background: `linear-gradient(135deg, ${n.color}08, transparent)` }}
                  >
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm border shrink-0" style={{ background: `${n.color}15`, borderColor: `${n.color}30`, color: n.color }}>{n.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{n.title}</span>
                        <span className="text-[10px] text-white/30 ml-auto">{n.time}</span>
                      </div>
                      <div className="text-[11px] text-white/50 leading-relaxed">{n.desc}</div>
                      <div className="text-[10px] text-white/30 mt-1">{n.app} • {n.time}</div>
                    </div>
                    <button onClick={() => setNotifications(s => s.filter(x => x.id !== n.id))} className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white text-xs transition-all">✕</button>
                  </motion.div>
                ))}
              </AnimatePresence>
              {notifications.length === 0 && (
                <div className="py-16 text-center">
                  <div className="text-3xl mb-2">✨</div>
                  <div className="text-sm text-white/60">All caught up!</div>
                  <div className="text-xs text-white/30">No new notifications</div>
                </div>
              )}
            </div>

            <div className="p-3 border-t border-white/5">
              <div className="rounded-2xl p-3 border border-[#00ff41]/20" style={{ background: 'linear-gradient(135deg, rgba(0,255,65,0.06), transparent)' }}>
                <div className="flex items-center gap-2 text-xs font-bold text-[#00ff41]"><span className="w-1.5 h-1.5 rounded-full bg-[#00ff41] animate-pulse" /> FOCUS MODE</div>
                <div className="text-[11px] text-white/60 mt-1">Notifications silenced • 2h remaining</div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
