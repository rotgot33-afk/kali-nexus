import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Desktop from './components/kali/Desktop';
import LockScreen from './components/kali/LockScreen';
import AuthScreen from './components/auth/AuthScreen';
import { useAuth } from './hooks/useAuth';

export default function App() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [stage, setStage] = useState<'boot'|'lock'|'desktop'>('boot');
  const [bootStage, setBootStage] = useState(0);
  const [bootLines, setBootLines] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);

  const bootMessages = [
    '[    0.000000] Booting NEXUS OS ULTRA • Quantum Edition',
    '[    0.000000] Linux version 6.6.9-amd64 (devel@kali.org) #1 SMP PREEMPT_DYNAMIC',
    '[    0.123456] BIOS-provided physical RAM map: 16384MB • 4 NUMA nodes',
    '[    0.234567] PCI: Using configuration type 1 [0xcf8:0xcff] • 32 devices',
    '[    0.456789] cryptd: max_cpu_qlen set to 1000 • AES-NI enabled',
    '[    0.678901] Mounting NEXUS filesystem [OK] • NVMe 3.2GB/s',
    '[    0.890123] systemd[1]: Starting Kali Linux Rolling • [OK]',
    '[    1.000000] nvidia: loading out-of-tree module taints kernel • RTX 4090',
    '[    1.045678] network: eth0 • 1000Mbps full duplex • [OK]',
    '[    1.123456] Initializing quantum neural engine • 128 cores [OK]',
    '[    1.234567] Starting NEXUS AI daemon • GPT-4 Turbo [OK]',
    '[    1.345678] Reached target Multi-User System [OK]',
    '[    1.567890] gdm: Starting NEXUS compositor • 144Hz [OK]',
    '[ OK ] Started GNOME Display Manager.',
    '[ OK ] Reached target Graphical Interface • 4K HDR',
  ];

  useEffect(() => {
    if (stage !== 'boot') return;
    if (bootStage >= bootMessages.length) {
      const t = setTimeout(() => setStage('lock'), 400);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      setBootLines(l => [...l, bootMessages[bootStage]]);
      setBootStage(s => s + 1);
      setProgress(((bootStage + 1) / bootMessages.length) * 100);
    }, bootStage < 5 ? 40 : 60);
    return () => clearTimeout(t);
  }, [bootStage, stage]);

  // Loading screen while checking auth
  if (authLoading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-[#00ff41] font-mono text-sm flex items-center gap-3">
          <div className="w-4 h-4 border-2 border-[#00ff41] border-t-transparent rounded-full animate-spin" />
          Initializing NEXUS...
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden bg-black select-none">
      <AnimatePresence mode="wait">
        {/* Auth gate — if not authenticated, show AuthScreen after boot */}
        {stage === 'boot' && (
          <motion.div
            key="boot"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, filter: 'blur(20px)', scale: 1.02 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 bg-black overflow-hidden"
          >
            <div className="absolute inset-0">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full opacity-20 blur-[100px]" style={{ background: 'radial-gradient(circle, rgba(0,255,65,0.35), transparent 70%)' }} />
            </div>

            <div className="absolute inset-0 p-4 md:p-8 font-mono text-[#00ff41] text-[10px] md:text-xs overflow-hidden flex flex-col">
              <div className="flex-1 overflow-hidden">
                <pre className="whitespace-pre-wrap break-all leading-relaxed">
                  {bootLines.join('\n')}
                  {bootStage < bootMessages.length && <span className="inline-block w-2 h-3 bg-[#00ff41] animate-pulse ml-1 align-middle" />}
                </pre>
              </div>

              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between text-[10px] tracking-widest">
                  <span className="text-white/40 flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#00ff41] animate-pulse" /> NEXUS ULTRA • BOOTING QUANTUM CORE</span>
                  <span className="text-[#00ff41] font-bold font-mono">{Math.round(progress)}%</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                  <motion.div className="h-full bg-gradient-to-r from-[#00ff41] via-[#00ffff] to-[#00ff41]" style={{ width: `${progress}%` }} transition={{ duration: 0.15 }} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-white/30 font-mono">
                    {progress < 25 ? '► Loading quantum kernel...' : progress < 50 ? '► Initializing NEXUS AI...' : progress < 75 ? '► Waking neural engine...' : progress < 90 ? '► Calibrating holograms...' : '► Unlocking...'}
                  </span>
                  <button
                    onClick={() => { setBootLines(bootMessages); setBootStage(bootMessages.length); setProgress(100); }}
                    className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 text-[11px] transition-colors backdrop-blur-xl"
                  >
                    تخطي → Skip
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* If not authenticated → AuthScreen */}
        {stage === 'lock' && !isAuthenticated && (
          <AuthScreen key="auth" />
        )}

        {/* If authenticated → LockScreen (biometric) → Desktop */}
        {stage === 'lock' && isAuthenticated && (
          <LockScreen key="lock" onUnlock={() => setStage('desktop')} />
        )}

        {stage === 'desktop' && (
          <motion.div key="desktop" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} className="absolute inset-0">
            <Desktop />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
