// ===============================================================
//  AuthScreen — Login / Signup screen
// ===============================================================
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';

type Mode = 'login' | 'signup' | 'magic';

export default function AuthScreen() {
  const { signIn, signUp, sendMagicLink, signInWithOAuth } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      if (mode === 'login') {
        await signIn(email, password);
        setInfo('✓ تم تسجيل الدخول بنجاح');
      } else if (mode === 'signup') {
        if (password.length < 6) throw new Error('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
        await signUp(email, password, username || undefined);
        setInfo('✓ تم إنشاء الحساب! تحقق من بريدك لتأكيد الحساب.');
      } else if (mode === 'magic') {
        await sendMagicLink(email);
        setInfo('✨ تم إرسال رابط سحري إلى بريدك. اضغط عليه لتسجيل الدخول.');
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ ما');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 z-[300] bg-black flex items-center justify-center overflow-hidden"
    >
      {/* Background particles */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-20 blur-[100px]" style={{ background: 'radial-gradient(circle, rgba(0,255,65,0.4), transparent 70%)' }} />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `linear-gradient(rgba(0,255,65,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,65,0.3) 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />
      </div>

      {/* Auth card */}
      <motion.div
        initial={{ y: 30, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ type: 'spring', damping: 25 }}
        className="relative z-10 w-[92%] max-w-[420px] rounded-3xl overflow-hidden border border-white/10"
        style={{ background: 'rgba(10,15,12,0.85)', backdropFilter: 'blur(30px)', boxShadow: '0 30px 80px rgba(0,0,0,0.8)' }}
      >
        {/* Header */}
        <div className="p-6 pb-4 text-center border-b border-white/5">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00ff41] to-[#00aa2a] text-black text-3xl mb-3 shadow-[0_10px_30px_rgba(0,255,65,0.3)]">🐉</div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            <span className="text-white">KALI</span> <span className="bg-gradient-to-r from-[#00ff41] to-[#00ffff] bg-clip-text text-transparent">NEXUS</span>
          </h1>
          <p className="text-xs text-white/50 mt-1">سجّل الدخول لحفظ تقدمك وأوامرك</p>
        </div>

        {/* Tabs */}
        <div className="flex p-3 gap-2 border-b border-white/5">
          {[
            { id: 'login' as Mode, label: 'دخول' },
            { id: 'signup' as Mode, label: 'حساب جديد' },
            { id: 'magic' as Mode, label: 'رابط سحري' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => { setMode(t.id); setError(null); setInfo(null); }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                mode === t.id
                  ? 'bg-[#00ff41]/20 text-[#00ff41] border border-[#00ff41]/30'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-3">
          {mode === 'signup' && (
            <div>
              <label className="block text-[10px] tracking-widest text-white/40 uppercase mb-1.5">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="hacker_42"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 outline-none text-white text-sm focus:border-[#00ff41]/40 focus:bg-black/60 transition-colors"
              />
            </div>
          )}

          <div>
            <label className="block text-[10px] tracking-widest text-white/40 uppercase mb-1.5">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 outline-none text-white text-sm focus:border-[#00ff41]/40 focus:bg-black/60 transition-colors"
            />
          </div>

          {mode !== 'magic' && (
            <div>
              <label className="block text-[10px] tracking-widest text-white/40 uppercase mb-1.5">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 outline-none text-white text-sm focus:border-[#00ff41]/40 focus:bg-black/60 transition-colors"
              />
            </div>
          )}

          {error && (
            <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              ⚠️ {error}
            </motion.div>
          )}

          {info && (
            <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-[#00ff41] bg-[#00ff41]/10 border border-[#00ff41]/20 rounded-lg px-3 py-2">
              {info}
            </motion.div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[#00ff41] text-black font-bold text-sm hover:bg-[#00ff41]/90 transition-all shadow-[0_10px_30px_rgba(0,255,65,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin" />
                جاري المعالجة...
              </span>
            ) : mode === 'login' ? '→ دخول' : mode === 'signup' ? '→ إنشاء حساب' : '✨ إرسال الرابط السحري'}
          </button>
        </form>

        {/* OAuth */}
        <div className="px-6 pb-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-[10px] text-white/40 uppercase tracking-widest">أو</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => signInWithOAuth('github').catch(e => setError(e.message))}
              className="py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors flex items-center justify-center gap-2 text-xs text-white/80"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12c0 5.3 3.4 9.8 8.2 11.4.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.3-1.8-1.3-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2 0-.4-.5-1.6.1-3.2 0 0 1-.3 3.3 1.2 1-.3 2-.4 3-.4s2 .1 3 .4c2.3-1.5 3.3-1.2 3.3-1.2.6 1.6.1 2.8.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6 4.8-1.6 8.2-6.1 8.2-11.4C24 5.4 18.6 0 12 0z"/></svg>
              GitHub
            </button>
            <button
              onClick={() => signInWithOAuth('google').catch(e => setError(e.message))}
              className="py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors flex items-center justify-center gap-2 text-xs text-white/80"
            >
              <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#EA4335" d="M5.3 14.5L4.5 17.4l-2.8.1c-.8-1.5-1.3-3.3-1.3-5.2 0-1.8.5-3.5 1.3-5l2.5.5 1.1 2.5c-.2.6-.3 1.3-.3 2 0 .7.1 1.3.3 2z" transform="translate(1 0)"/><path fill="#4285F4" d="M23 12.2c0-.8-.1-1.6-.2-2.3H12v4.5h6.2c-.3 1.5-1.1 2.7-2.4 3.6v3h3.9c2.3-2.1 3.6-5.2 3.6-8.8z"/><path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1C3.4 21.4 7.4 24 12 24z"/><path fill="#FBBC05" d="M5.4 14.4c-.2-.7-.4-1.5-.4-2.2 0-.8.1-1.5.4-2.2V6.9H1.4C.5 8.6 0 10.2 0 12.2c0 1.9.5 3.6 1.4 5.3l4-3.1z"/></svg>
              Google
            </button>
          </div>
        </div>

        <div className="px-6 pb-6 text-center">
          <p className="text-[10px] text-white/30">
            بالمتابعة، أنت توافق على شروط الاستخدام.<br/>
            استخدم الأدوات بشكل أخلاقي وقانوني فقط.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
