import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SpotlightProps {
  open: boolean;
  onClose: () => void;
  onSelect: (id: string) => void;
}

const items = [
  { id: 'realterminal', name: 'Real Shell', desc: 'PTY • WebSocket • Live', icon: '◼', cat: 'System' },
  { id: 'terminal', name: 'Terminal', desc: 'Execute real commands', icon: '▣', cat: 'System' },
  { id: 'files', name: 'Files', desc: 'Real filesystem browser', icon: '⬢', cat: 'System' },
  { id: 'nmap', name: 'Nmap Scanner', desc: 'Network discovery', icon: '⬣', cat: 'Security' },
  { id: 'metasploit', name: 'Metasploit', desc: 'Exploitation framework', icon: '⬔', cat: 'Exploit' },
  { id: 'burpsuite', name: 'Burp Suite', desc: 'Web security testing', icon: '⬓', cat: 'Web' },
  { id: 'wireshark', name: 'Wireshark', desc: 'Packet analyzer', icon: '⬔', cat: 'Network' },
  { id: 'settings', name: 'Settings', desc: 'System preferences', icon: '⬡', cat: 'System' },
  { id: 'cmd-nmap', name: 'nmap -sV 192.168.1.1', desc: 'Run nmap on local network', icon: '→', cat: 'Command' },
  { id: 'cmd-ps', name: 'ps aux', desc: 'Show processes', icon: '→', cat: 'Command' },
  { id: 'cmd-ifconfig', name: 'ifconfig', desc: 'Network interfaces', icon: '→', cat: 'Command' },
];

export default function Spotlight({ open, onClose, onSelect }: SpotlightProps) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const filtered = query
    ? items.filter(i => i.name.toLowerCase().includes(query.toLowerCase()) || i.desc.toLowerCase().includes(query.toLowerCase()))
    : items.slice(0, 6);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s+1, filtered.length-1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(s => Math.max(s-1, 0)); }
    if (e.key === 'Enter') {
      const item = filtered[selected];
      if (item) {
        if (item.cat === 'Command') {
          onSelect('terminal');
        } else {
          onSelect(item.id);
        }
        onClose();
      }
    }
    if (e.key === 'Escape') onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-xl z-[100]" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 400 }}
            className="fixed top-[20%] left-1/2 -translate-x-1/2 w-[92%] max-w-[640px] z-[101]"
          >
            <div className="rounded-[20px] overflow-hidden border border-white/10" style={{ background: 'rgba(15,15,20,0.95)', backdropFilter: 'blur(40px)', boxShadow: '0 30px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05)' }}>
              <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5">
                <div className="w-8 h-8 rounded-xl bg-[#00ff41]/15 border border-[#00ff41]/20 flex items-center justify-center text-[#00ff41]">⌕</div>
                <input
                  ref={inputRef}
                  value={query}
                  onChange={e => { setQuery(e.target.value); setSelected(0); }}
                  onKeyDown={handleKey}
                  placeholder="Search apps, commands, files…"
                  className="flex-1 bg-transparent outline-none text-white placeholder:text-white/30 text-[15px]"
                />
                <span className="hidden md:flex items-center gap-1 text-[10px] text-white/30 border border-white/10 rounded px-1.5 py-1">ESC</span>
              </div>

              <div className="p-2 max-h-[340px] overflow-y-auto scrollbar-thin">
                {filtered.length === 0 ? (
                  <div className="py-12 text-center text-white/30 text-sm">No results for “{query}”</div>
                ) : filtered.map((item, i) => (
                  <div
                    key={item.id}
                    onClick={() => { onSelect(item.id.startsWith('cmd-') ? 'terminal' : item.id); onClose(); }}
                    onMouseEnter={() => setSelected(i)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${i===selected ? 'bg-[#00ff41]/10 border border-[#00ff41]/20' : 'border border-transparent hover:bg-white/5'}`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-[16px] border ${i===selected ? 'bg-[#00ff41]/15 border-[#00ff41]/30 text-[#00ff41]' : 'bg-white/5 border-white/5 text-white/60'}`}>
                      {item.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-[13px] font-medium truncate ${i===selected ? 'text-white' : 'text-white/80'}`}>{item.name}</div>
                      <div className="text-[11px] text-white/40 truncate">{item.desc}</div>
                    </div>
                    <span className={`text-[10px] px-2 py-1 rounded-full border ${i===selected ? 'bg-[#00ff41]/15 text-[#00ff41] border-[#00ff41]/20' : 'bg-white/5 text-white/30 border-white/5'}`}>{item.cat}</span>
                  </div>
                ))}
              </div>

              <div className="px-4 py-2.5 bg-black/20 border-t border-white/5 flex items-center justify-between text-[10px] text-white/30">
                <span className="flex items-center gap-2"><span>↵</span> Open <span className="hidden md:inline">• ↑↓ Navigate</span></span>
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#00ff41] animate-pulse" /> NEXUS AI</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
