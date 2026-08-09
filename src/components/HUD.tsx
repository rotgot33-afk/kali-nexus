import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

interface StatCardProps {
  title: string;
  value: string;
  icon: string;
  color: string;
  delay: number;
}

function StatCard({ title, value, icon, color, delay }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.6 }}
      className="glass rounded-2xl p-4 flex items-center gap-3 neon-box"
      style={{ borderColor: color }}
    >
      <div
        className="text-3xl animate-float"
        style={{ color, filter: `drop-shadow(0 0 10px ${color})` }}
      >
        {icon}
      </div>
      <div>
        <div className="text-xs text-gray-400 uppercase tracking-wider">{title}</div>
        <div className="text-xl font-bold" style={{ color }}>
          {value}
        </div>
      </div>
    </motion.div>
  );
}

export default function HUD() {
  const [time, setTime] = useState(new Date());
  const [coords, setCoords] = useState({ x: 0, y: 0, z: 0 });
  const [fps, setFps] = useState(60);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
      setCoords({
        x: Math.random() * 1000 - 500,
        y: Math.random() * 1000 - 500,
        z: Math.random() * 1000 - 500,
      });
      setFps(58 + Math.floor(Math.random() * 4));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between">
      {/* Top Bar */}
      <div className="flex justify-between items-start">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-4 pointer-events-auto"
        >
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse-glow" />
            <span className="text-sm font-semibold text-green-400">متصل</span>
            <span className="text-gray-400 text-xs">|</span>
            <span className="text-xs text-gray-300">
              {time.toLocaleTimeString('ar-EG')}
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-4 pointer-events-auto text-right"
        >
          <div className="text-xs text-gray-400 mb-1">نظام الإحداثيات</div>
          <div className="text-sm font-mono" style={{ color: '#00ffff' }}>
            X: {coords.x.toFixed(2)}
          </div>
          <div className="text-sm font-mono" style={{ color: '#ff00ff' }}>
            Y: {coords.y.toFixed(2)}
          </div>
          <div className="text-sm font-mono" style={{ color: '#ffff00' }}>
            Z: {coords.z.toFixed(2)}
          </div>
        </motion.div>
      </div>

      {/* Center Title - Hidden since we have 3D title */}
      <div className="flex-1" />

      {/* Bottom Section */}
      <div className="flex justify-between items-end gap-4">
        {/* Stats */}
        <div className="flex flex-col gap-3 pointer-events-auto">
          <StatCard
            title="معدل الإطارات"
            value={`${fps} FPS`}
            icon="⚡"
            color="#00ffff"
            delay={0.1}
          />
          <StatCard
            title="العناصر النشطة"
            value="12,847"
            icon="◆"
            color="#ff00ff"
            delay={0.2}
          />
          <StatCard
            title="المعالجة"
            value="98.7%"
            icon="◉"
            color="#00ff88"
            delay={0.3}
          />
        </div>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass rounded-2xl p-4 pointer-events-auto"
        >
          <div className="text-xs text-gray-400 mb-3 text-center">لوحة التحكم</div>
          <div className="flex flex-col gap-2">
            <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 text-cyan-300 text-sm hover:from-cyan-500/30 hover:to-blue-500/30 transition-all hover:scale-105">
              🚀 تشغيل العرض
            </button>
            <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-400/30 text-pink-300 text-sm hover:from-pink-500/30 hover:to-purple-500/30 transition-all hover:scale-105">
              ⚙️ الإعدادات
            </button>
            <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-400/30 text-yellow-300 text-sm hover:from-yellow-500/30 hover:to-orange-500/30 transition-all hover:scale-105">
              📊 التحليلات
            </button>
            <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/30 text-green-300 text-sm hover:from-green-500/30 hover:to-emerald-500/30 transition-all hover:scale-105">
              🌐 الشبكة
            </button>
          </div>
        </motion.div>
      </div>

      {/* Bottom Info Bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="absolute bottom-2 left-1/2 -translate-x-1/2 glass rounded-full px-6 py-2 text-xs text-gray-400 flex items-center gap-4"
      >
        <span>🖱️ اسحب للتدوير</span>
        <span className="text-cyan-400">•</span>
        <span>🔍 اسحب للتقريب</span>
        <span className="text-pink-400">•</span>
        <span>⌨️ ESC للخروج</span>
      </motion.div>
    </div>
  );
}
