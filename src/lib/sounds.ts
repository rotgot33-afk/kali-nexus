// Sound & Haptics Manager - no assets, Web Audio API only
let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch { return null; }
  }
  if (ctx.state === 'suspended') ctx.resume().catch(()=>{});
  return ctx;
}

function tone(freq: number, duration: number, type: OscillatorType = 'sine', gain = 0.15, slideTo?: number) {
  const c = getCtx();
  if (!c) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.value = freq;
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, c.currentTime + duration);
  g.gain.value = gain;
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
  o.connect(g).connect(c.destination);
  o.start();
  o.stop(c.currentTime + duration);
}

export const sounds = {
  click: () => tone(800, 0.08, 'sine', 0.12),
  hover: () => tone(1200, 0.05, 'sine', 0.06),
  open: () => { tone(600, 0.12, 'sine', 0.15); setTimeout(()=> tone(900, 0.15, 'sine', 0.12), 80); },
  close: () => { tone(900, 0.08, 'sine', 0.1); setTimeout(()=> tone(500, 0.12, 'sine', 0.08), 60); },
  minimize: () => tone(500, 0.2, 'triangle', 0.08, 300),
  maximize: () => tone(300, 0.2, 'triangle', 0.08, 800),
  notification: () => { tone(880, 0.12, 'sine', 0.15); setTimeout(()=> tone(1320, 0.2, 'sine', 0.15), 120); },
  unlock: () => { tone(400, 0.15, 'sine', 0.15, 800); setTimeout(()=> tone(1200, 0.3, 'sine', 0.18), 150); },
  boot: () => { [200,400,600,800].forEach((f,i)=> setTimeout(()=> tone(f, 0.4, 'sine', 0.12), i*120)); },
  error: () => tone(150, 0.3, 'square', 0.08),
  success: () => { tone(600, 0.1, 'sine', 0.12); setTimeout(()=> tone(800, 0.15, 'sine', 0.12), 100); setTimeout(()=> tone(1200, 0.2, 'sine', 0.14), 200); },
};

export const haptics = {
  light: () => { try { navigator.vibrate?.(20); } catch {} },
  medium: () => { try { navigator.vibrate?.(40); } catch {} },
  heavy: () => { try { navigator.vibrate?.([30,20,50]); } catch {} },
  success: () => { try { navigator.vibrate?.([20,30,20,50]); } catch {} },
};
