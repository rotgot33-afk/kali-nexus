import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function Loader() {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setTimeout(() => setLoading(false), 500);
          return 100;
        }
        return p + 2;
      });
    }, 30);
    return () => clearInterval(interval);
  }, []);

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center"
        >
          <motion.div
            animate={{
              rotate: 360,
              scale: [1, 1.2, 1],
            }}
            transition={{
              rotate: { duration: 2, repeat: Infinity, ease: 'linear' },
              scale: { duration: 1.5, repeat: Infinity },
            }}
            className="text-8xl mb-8"
            style={{ filter: 'drop-shadow(0 0 30px #00ffff)' }}
          >
            ◈
          </motion.div>

          <h1 className="text-4xl font-bold gradient-text mb-4 neon-glow">
            NEXUS
          </h1>
          <p className="text-gray-400 mb-8 text-sm tracking-widest">
            تهيئة البيئة ثلاثية الأبعاد
          </p>

          <div className="w-80 h-1 bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-cyan-400 via-pink-400 to-yellow-400"
              style={{ width: `${progress}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
          <div className="text-cyan-400 mt-2 font-mono text-sm">
            {progress}%
          </div>

          <div className="mt-8 text-xs text-gray-500 font-mono">
            <motion.div
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              {progress < 30 && '> تحميل المكتبات...'}
              {progress >= 30 && progress < 60 && '> تهيئة WebGL...'}
              {progress >= 60 && progress < 90 && '> بناء المشهد...'}
              {progress >= 90 && '> جاهز للإطلاق'}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
