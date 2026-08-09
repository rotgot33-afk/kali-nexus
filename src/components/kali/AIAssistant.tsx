import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message { role: 'user' | 'assistant'; text: string; }

const suggestions = [
  "افحص الشبكة المحلية",
  "اعرض الملفات الحساسة",
  "شغّل nmap على 127.0.0.1",
  "ما هي المنافذ المفتوحة؟",
];

export default function AIAssistant({ onExecute }: { onExecute: (cmd: string) => void }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', text: 'مرحباً! أنا NEXUS AI — مساعدك الذكي. اكتب أمراً بالعربية أو الإنجليزية وسأنفذه لك. مثال: "افحص البورتات" أو "اعرض ملفاتي"' }
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, typing]);

  const interpret = (q: string): { reply: string; cmd?: string } => {
    const lower = q.toLowerCase();
    if (lower.includes('شبكة') || lower.includes('nmap') || (lower.includes('افحص') && !lower.includes('منفذ'))) {
      return { reply: 'حسناً! فتحت Nmap لفحص الشبكة. جرّب الأهداف: 127.0.0.1, scanme.nmap.org. يمكنك أيضاً كتابة `nmap -sV 127.0.0.1` في الطرفية الحقيقية.', cmd: 'nmap' };
    }
    if (lower.includes('ملف') || lower.includes('file') || lower.includes('اعرض')) {
      return { reply: 'فتحت مدير الملفات — يمكنك استعراض نظام الملفات الحقيقي على السيرفر (قراءة/كتابة فعلية).', cmd: 'files' };
    }
    if (lower.includes('بورت') || lower.includes('port') || lower.includes('منفذ')) {
      return { reply: 'سأفحص المنافذ المفتوحة. استخدم `nmap -sV localhost` في الطرفية، أو افتح أداة Nmap مع خيار `-sV`.', cmd: 'nmap' };
    }
    if (lower.includes('طرفية') || lower.includes('terminal') || lower.includes('شل') || lower.includes('shell')) {
      return { reply: 'فتحت الطرفية الحقيقية (PTY) — اكتب أي أمر Linux وسيُنفذ فعلياً. vim, top, nano كلها تعمل!', cmd: 'realterminal' };
    }
    if (lower.includes('metasploit') || lower.includes('msf') || lower.includes('اكسبلورت')) {
      return { reply: 'فتحت Metasploit Console الحقيقي. جرّب: `search eternalblue`, ثم `use exploit/windows/smb/ms17_010_eternalblue`.', cmd: 'metasploit' };
    }
    if (lower.includes('wireshark') || lower.includes('حزم') || lower.includes('capture') || lower.includes('تقاطع')) {
      return { reply: 'فتحت Wireshark الحقيقي (tshark). اضغط START لبدء التقاط الحزم الشبكية على الواجهة المختارة.', cmd: 'wireshark' };
    }
    if (lower.includes('burp') || lower.includes('بروكسي') || lower.includes('proxy')) {
      return { reply: 'فتحت Burp Suite (واجهة demo). لـ proxy حقيقي، شغّل `mitmproxy -p 8080` في الطرفية.', cmd: 'burpsuite' };
    }
    if (lower.includes('اختراق') || lower.includes('hack') || lower.includes('ثغرة')) {
      return { reply: 'أستطيع مساعدتك في التعلم! جرّب Metasploit (msfconsole حقيقي) أو Nmap من الـ Dock. تذكر: اختبر فقط على أنظمة تملكها أو لديك إذن عليها — مثل scanme.nmap.org أو 127.0.0.1.' };
    }
    if (lower.includes('إعداد') || lower.includes('اعداد') || lower.includes('settings') || lower.includes('setup')) {
      return { reply: 'فتحت الإعدادات. يمكنك التحكم بالمظهر، الشبكة، الأمان.', cmd: 'settings' };
    }
    if (lower.includes('help') || lower.includes('مساعدة') || lower.includes('ماذا')) {
      return { reply: 'يمكنني فتح أي أداة: Terminal, Files, Nmap, Metasploit, Wireshark, Burp, Settings. جرّب: "افتح nmap", "اعرض ملفاتي", "افحص المنافذ".' };
    }
    return { reply: 'فهمت! يمكنني فتح الأدوات التالية: Real Shell (PTY), Terminal, Files, Nmap, Metasploit, Wireshark, Burp, Settings. جرّب: "افتح الطرفية" أو "افحص الشبكة". كيف أساعدك أكثر؟' };
  };

  const send = () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setMessages(m => [...m, { role: 'user', text: userMsg }]);
    setInput('');
    setTyping(true);
    setTimeout(() => {
      const { reply, cmd } = interpret(userMsg);
      setMessages(m => [...m, { role: 'assistant', text: reply }]);
      setTyping(false);
      if (cmd) setTimeout(() => onExecute(cmd), 600);
    }, 700);
  };

  return (
    <>
      {/* Floating button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(!open)}
        className="fixed bottom-20 right-4 md:bottom-24 md:right-6 w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-[#00ff41] to-[#00aa2a] text-black flex items-center justify-center text-xl shadow-[0_10px_30px_rgba(0,255,65,0.4)] z-30 border border-white/20"
      >
        {open ? '✕' : '✦'}
        {!open && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-black animate-pulse" />}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-24 md:bottom-28 right-4 md:right-6 w-[92%] max-w-[380px] h-[420px] rounded-[20px] overflow-hidden border border-white/10 z-30 flex flex-col"
            style={{ background: 'rgba(10,10,15,0.95)', backdropFilter: 'blur(30px)', boxShadow: '0 30px 80px rgba(0,0,0,0.7)' }}
          >
            {/* Header */}
            <div className="h-14 px-4 flex items-center gap-3 border-b border-white/5" style={{ background: 'linear-gradient(180deg, rgba(0,255,65,0.08), transparent)' }}>
              <div className="w-8 h-8 rounded-xl bg-[#00ff41] flex items-center justify-center text-black font-black">✦</div>
              <div className="flex-1">
                <div className="text-sm font-bold text-white flex items-center gap-2">NEXUS AI <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#00ff41]/15 text-[#00ff41] border border-[#00ff41]/20">GPT-4</span></div>
                <div className="text-[10px] text-white/50 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> متصل • يفهم العربية</div>
              </div>
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_6px_#00ff41]" />
            </div>

            {/* Messages */}
            <div ref={listRef} className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-[13px] leading-relaxed ${m.role === 'user' ? 'bg-[#00ff41] text-black rounded-br-sm' : 'bg-white/5 text-white/90 border border-white/5 rounded-bl-sm'}`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {typing && (
                <div className="flex justify-start">
                  <div className="bg-white/5 border border-white/5 rounded-2xl rounded-bl-sm px-3 py-2 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              )}
            </div>

            {/* Suggestions */}
            <div className="px-3 pb-2 flex gap-1.5 overflow-x-auto scrollbar-hide">
              {suggestions.map(s => (
                <button key={s} onClick={() => { setInput(s); setTimeout(send, 50); }} className="whitespace-nowrap px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] text-white/70 hover:bg-[#00ff41]/10 hover:text-[#00ff41] hover:border-[#00ff41]/20 transition-colors">
                  {s}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="p-3 border-t border-white/5 flex gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && send()}
                placeholder="اكتب أمراً..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 outline-none text-white placeholder:text-white/30 text-[13px] focus:border-[#00ff41]/30"
              />
              <button onClick={send} className="w-10 h-10 rounded-xl bg-[#00ff41] text-black flex items-center justify-center hover:bg-[#00ff41]/90 transition-colors">↑</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
