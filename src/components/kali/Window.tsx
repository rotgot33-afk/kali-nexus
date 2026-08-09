import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { AppWindow } from './types';
import TerminalApp from './apps/TerminalApp';
import RealTerminal from './apps/RealTerminal';
import FilesApp from './apps/FilesApp';
import BrowserApp from './apps/BrowserApp';
import NmapApp from './apps/NmapApp';
import MetasploitApp from './apps/MetasploitApp';
import BurpSuiteApp from './apps/BurpSuiteApp';
import WiresharkApp from './apps/WiresharkApp';
import SettingsApp from './apps/SettingsApp';

interface WindowProps {
  app: AppWindow;
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  onFocus: () => void;
}

export default function Window({ app, onClose, onMinimize, onMaximize, onFocus }: WindowProps) {
  const [pos, setPos] = useState({ x: app.x, y: app.y });
  const [size, setSize] = useState({ width: app.width, height: app.height });
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, wx: 0, wy: 0 });
  const resizeStart = useRef({ x: 0, y: 0, w: 0, h: 0 });

  useEffect(() => {
    const onMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
      if (dragging) {
        setPos({
          x: dragStart.current.wx + (clientX - dragStart.current.x),
          y: Math.max(32, dragStart.current.wy + (clientY - dragStart.current.y)),
        });
      }
      if (resizing) {
        setSize({
          width: Math.max(320, resizeStart.current.w + (clientX - resizeStart.current.x)),
          height: Math.max(240, resizeStart.current.h + (clientY - resizeStart.current.y)),
        });
      }
    };
    const onUp = () => { setDragging(false); setResizing(false); };
    if (dragging || resizing) {
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
      window.addEventListener('touchmove', onMove);
      window.addEventListener('touchend', onUp);
      return () => {
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
        window.removeEventListener('touchmove', onMove);
        window.removeEventListener('touchend', onUp);
      };
    }
  }, [dragging, resizing]);

  const renderContent = () => {
    switch (app.content) {
      case 'terminal': return <TerminalApp />;
      case 'realterminal': return <RealTerminal />;
      case 'files': return <FilesApp />;
      case 'browser': return <BrowserApp />;
      case 'nmap': return <NmapApp />;
      case 'metasploit': return <MetasploitApp />;
      case 'burpsuite': return <BurpSuiteApp />;
      case 'wireshark': return <WiresharkApp />;
      case 'settings': return <SettingsApp />;
      default: return <div className="p-4 text-white">App not found</div>;
    }
  };

  const accent = app.id === 'realterminal' ? '#00ff41' :
                 app.id === 'nmap' ? '#a855f7' :
                 app.id === 'metasploit' ? '#ff3344' :
                 app.id === 'burpsuite' ? '#ff6633' :
                 app.id === 'wireshark' ? '#06b6d4' : '#00ff41';

  if (app.maximized) {
    return (
      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        style={{ zIndex: app.zIndex, left: 0, top: 32, width: '100vw', height: 'calc(100vh - 32px - 76px)' }}
        className="absolute flex flex-col overflow-hidden select-none"
        onMouseDown={onFocus}
      >
        <div className="absolute inset-0 bg-[#0a0a0f]/95 backdrop-blur-2xl" />
        <div className="absolute inset-0 border border-white/10" />
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="relative flex flex-col h-full">
          <WindowHeader app={app} accent={accent} onClose={onClose} onMinimize={onMinimize} onMaximize={onMaximize} onDragStart={() => {}} />
          <div className="flex-1 overflow-hidden bg-black/40 backdrop-blur-xl">{renderContent()}</div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ scale: 0.92, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.92, opacity: 0, y: 10 }}
      transition={{ type: 'spring', damping: 22, stiffness: 280 }}
      style={{
        zIndex: app.zIndex,
        left: pos.x,
        top: pos.y,
        width: size.width,
        height: size.height,
        boxShadow: `0 25px 80px rgba(0,0,0,0.8), 0 0 0 1px ${accent}20, 0 0 40px ${accent}15`,
      }}
      className="absolute rounded-[16px] overflow-hidden select-none flex flex-col"
      onMouseDown={onFocus}
    >
      {/* Window background */}
      <div className="absolute inset-0 bg-[#0a0a0f]/90 backdrop-blur-2xl" />
      <div className="absolute inset-0 rounded-[16px] border border-white/10" />
      <div className="absolute inset-0 rounded-[16px]" style={{ background: `linear-gradient(135deg, ${accent}08, transparent 40%)` }} />
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

      <div className="relative flex flex-col h-full rounded-[16px] overflow-hidden">
        <WindowHeader app={app} accent={accent} onClose={onClose} onMinimize={onMinimize} onMaximize={onMaximize}
          onDragStart={(e: any) => {
            const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
            const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
            setDragging(true);
            dragStart.current = { x: clientX, y: clientY, wx: pos.x, wy: pos.y };
          }}
        />
        <div className="flex-1 overflow-hidden bg-black/30">{renderContent()}</div>
      </div>

      {/* Resize handle */}
      <div
        className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize flex items-end justify-end p-1.5 group"
        onMouseDown={(e) => {
          e.stopPropagation();
          setResizing(true);
          resizeStart.current = { x: e.clientX, y: e.clientY, w: size.width, h: size.height };
        }}
        onTouchStart={(e) => {
          e.stopPropagation();
          setResizing(true);
          resizeStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, w: size.width, h: size.height };
        }}
      >
        <div className="w-3 h-3 opacity-40 group-hover:opacity-100 transition-opacity">
          <div className="absolute bottom-1 right-1 w-2 h-2 border-r-[1.5px] border-b-[1.5px] rounded-br-sm" style={{ borderColor: accent }} />
          <div className="absolute bottom-1 right-1 w-1 h-1 border-r-[1.5px] border-b-[1.5px] rounded-br-sm translate-x-[-3px] translate-y-[-3px]" style={{ borderColor: accent, opacity: 0.5 }} />
        </div>
      </div>
    </motion.div>
  );
}

function WindowHeader({ app, accent, onClose, onMinimize, onMaximize, onDragStart }: any) {
  return (
    <div
      className="h-9 px-3 flex items-center gap-3 cursor-move select-none relative flex-shrink-0 border-b border-white/5"
      style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.01))' }}
      onMouseDown={onDragStart}
      onTouchStart={onDragStart}
      onDoubleClick={onMaximize}
    >
      {/* Traffic lights */}
      <div className="flex items-center gap-1.5">
        <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="group w-3.5 h-3.5 rounded-full bg-[#ff5f56] border border-[#e0443e] flex items-center justify-center hover:brightness-110 active:scale-90 transition-all">
          <span className="text-[7px] opacity-0 group-hover:opacity-100 text-black/60">✕</span>
        </button>
        <button onClick={(e) => { e.stopPropagation(); onMinimize(); }} className="group w-3.5 h-3.5 rounded-full bg-[#ffbd2e] border border-[#dea123] flex items-center justify-center hover:brightness-110 active:scale-90 transition-all">
          <span className="text-[7px] opacity-0 group-hover:opacity-100 text-black/60">—</span>
        </button>
        <button onClick={(e) => { e.stopPropagation(); onMaximize(); }} className="group w-3.5 h-3.5 rounded-full bg-[#27c93f] border border-[#1aab29] flex items-center justify-center hover:brightness-110 active:scale-90 transition-all">
          <span className="text-[6px] opacity-0 group-hover:opacity-100 text-black/60">□</span>
        </button>
      </div>

      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] border border-white/10" style={{ background: `${accent}15`, color: accent }}>
          {app.icon}
        </div>
        <span className="text-xs text-white/90 truncate font-medium tracking-wide">{app.title}</span>
        <span className="hidden md:inline text-[10px] px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-white/40">◼ {app.content}</span>
      </div>

      <div className="flex items-center gap-1">
        <div className="hidden md:flex items-center gap-1 px-2 py-1 rounded-full bg-black/20 border border-white/5">
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: accent, boxShadow: `0 0 6px ${accent}` }} />
          <span className="text-[10px] text-white/50">LIVE</span>
        </div>
        <button onClick={(e) => { e.stopPropagation(); onMinimize(); }} className="w-6 h-6 rounded-md hover:bg-white/5 flex items-center justify-center text-white/40 hover:text-white/80 transition-colors">—</button>
        <button onClick={(e) => { e.stopPropagation(); onMaximize(); }} className="w-6 h-6 rounded-md hover:bg-white/5 flex items-center justify-center text-white/40 hover:text-white/80 transition-colors text-[10px]">□</button>
        <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="w-6 h-6 rounded-md hover:bg-red-500/20 flex items-center justify-center text-white/40 hover:text-red-400 transition-colors">✕</button>
      </div>
    </div>
  );
}
