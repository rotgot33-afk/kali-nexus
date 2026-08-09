import { motion } from 'framer-motion';
import type { AppWindow } from './types';

interface DockProps {
  apps: AppWindow[];
  onAppClick: (id: string) => void;
}

const dockApps = [
  { id: 'realterminal', icon: '◼', name: 'Real Shell', color: '#0a0a0a', accent: '#00ff41' },
  { id: 'terminal', icon: '▣', name: 'Terminal', color: '#0f1a0f', accent: '#00ff88' },
  { id: 'files', icon: '⬢', name: 'Files', color: '#0f1420', accent: '#00aaff' },
  { id: 'nmap', icon: '⬣', name: 'Nmap', color: '#1a0f2e', accent: '#a855f7' },
  { id: 'metasploit', icon: '⬔', name: 'Metasploit', color: '#1a0f0f', accent: '#ff3344' },
  { id: 'burpsuite', icon: '⬓', name: 'Burp Suite', color: '#1a130f', accent: '#ff6633' },
  { id: 'wireshark', icon: '⬔', name: 'Wireshark', color: '#0f1a1e', accent: '#06b6d4' },
  { id: 'settings', icon: '⬡', name: 'Settings', color: '#141414', accent: '#888888' },
];

export default function Dock({ apps, onAppClick }: DockProps) {
  return (
    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-40">
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1, type: 'spring', damping: 20 }}
        className="relative px-2 py-2 flex items-end gap-1.5 rounded-[20px] border border-white/10"
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.08)',
        }}
      >
        {/* Top highlight */}
        <div className="absolute inset-x-2 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent rounded-full" />
        
        {dockApps.map((app, i) => {
          const isOpen = apps.some(a => a.id === app.id && !a.minimized);
          const isActive = apps.some(a => a.id === app.id && !a.minimized);
          return (
            <motion.button
              key={app.id}
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 1 + i * 0.04, type: 'spring', stiffness: 300, damping: 20 }}
              whileHover={{ scale: 1.15, y: -8, transition: { type: 'spring', stiffness: 400, damping: 15 } }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onAppClick(app.id)}
              className="group relative flex flex-col items-center"
            >
              <div className="relative">
                <div
                  className="w-[48px] h-[48px] md:w-[52px] md:h-[52px] rounded-[14px] flex items-center justify-center text-[22px] relative overflow-hidden"
                  style={{
                    background: `radial-gradient(120% 120% at 30% 20%, ${app.accent}30, transparent 60%), linear-gradient(135deg, ${app.color}, #000)`,
                    border: `1px solid ${isActive ? app.accent + '60' : 'rgba(255,255,255,0.08)'}`,
                    boxShadow: isActive
                      ? `0 0 20px ${app.accent}80, 0 8px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)`
                      : '0 8px 20px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
                  }}
                >
                  {/* Inner gloss */}
                  <div className="absolute inset-0 rounded-[14px] bg-gradient-to-b from-white/10 via-transparent to-transparent pointer-events-none" />
                  {/* Icon */}
                  <span className="relative z-10 drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)] group-hover:drop-shadow-[0_0_8px_currentColor]" style={{ color: app.accent }}>
                    {app.icon}
                  </span>
                  {/* Active shine */}
                  {isActive && (
                    <motion.div
                      layoutId={`glow-${app.id}`}
                      className="absolute inset-0 rounded-[14px] opacity-60"
                      style={{ background: `radial-gradient(80% 80% at 50% 0%, ${app.accent}20, transparent)` }}
                    />
                  )}
                </div>

                {/* Active dot */}
                {isOpen && (
                  <motion.div
                    layoutId={`dot-${app.id}`}
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                    style={{ background: app.accent, boxShadow: `0 0 6px ${app.accent}` }}
                  />
                )}

                {/* Notification badge for demo */}
                {(app.id === 'nmap' || app.id === 'realterminal') && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-black shadow-lg">
                    {app.id === 'nmap' ? '3' : '!'}
                  </div>
                )}
              </div>

              {/* Tooltip */}
              <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 px-2.5 py-1.5 bg-[#0a0a0f]/90 backdrop-blur-xl text-white text-[11px] rounded-lg opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none border border-white/10 shadow-xl translate-y-1 group-hover:translate-y-0 transition-all duration-200">
                <div className="font-medium">{app.name}</div>
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#0a0a0f] border-r border-b border-white/10 rotate-45" />
              </div>
            </motion.button>
          );
        })}

        {/* Separator + trash */}
        <div className="w-px h-8 bg-white/10 mx-1 self-center" />
        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors">
          🗑️
        </motion.button>
      </motion.div>

      {/* Reflection */}
      <div className="absolute -bottom-6 left-2 right-2 h-6 bg-gradient-to-b from-white/[0.04] to-transparent blur-[1px] rounded-full pointer-events-none" />
    </div>
  );
}
