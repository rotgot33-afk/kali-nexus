import { useState, useRef, useEffect } from 'react';
import { executeCommand, fetchSystemInfo, type SystemInfo } from '../../../lib/api';
import { sounds } from '../../../lib/sounds';

interface HistoryLine { type: 'input' | 'output' | 'error' | 'success'; content: string; }

const AI_SUGGESTIONS: Record<string, string[]> = {
  'n': ['nmap -sV 127.0.0.1', 'nmap -sS 192.168.1.1', 'nmap -A scanme.nmap.org'],
  'p': ['ping google.com', 'ping 8.8.8.8 -c 4', 'ps aux | grep -i kali'],
  'l': ['ls -la', 'ls -lh /etc', 'lsof -i :80'],
  'c': ['cat /etc/passwd', 'curl -I https://example.com', 'cat ~/.bashrc'],
  'if': ['ifconfig', 'ifconfig eth0'],
  'who': ['whoami', 'whois google.com'],
  'net': ['netstat -tulpn', 'netstat -an'],
  'ss': ['ss -tulpn', 'ssh root@192.168.1.1'],
};

export default function TerminalApp() {
  const [history, setHistory] = useState<HistoryLine[]>([
    { type: 'success', content: '┌────────────────────────────────────────────┐' },
    { type: 'success', content: '│  NEXUS SHELL • AI-POWERED • REAL MODE  │' },
    { type: 'success', content: '└────────────────────────────────────────────┘' },
    { type: 'output', content: '' },
    { type: 'output', content: '  ✨ AI autocomplete enabled • Type to see suggestions' },
    { type: 'output', content: '  Try: nmap, ping, ls, cat, ps, ifconfig' },
    { type: 'output', content: '' },
  ]);
  const [input, setInput] = useState('');
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [cwd, setCwd] = useState<string>('~');
  const [sysInfo, setSysInfo] = useState<SystemInfo | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) containerRef.current.scrollTop = containerRef.current.scrollHeight;
  }, [history]);

  useEffect(() => {
    inputRef.current?.focus();
    fetchSystemInfo().then((info) => {
      if (info) {
        setSysInfo(info);
        setCwd(info.homeDir);
        setHistory((h) => [
          ...h,
          { type: 'success', content: `✓ Quantum link established • ${info.distro}` },
          { type: 'output', content: `  User: ${info.username}@${info.hostname} • ${info.platform} • ${info.cpus} cores` },
          { type: 'output', content: `  Home: ${info.homeDir} • Try AI: "افحص الشبكة"` },
          { type: 'output', content: '' },
        ]);
      } else {
        setHistory((h) => [
          ...h,
          { type: 'success', content: '✓ Demo mode • Backend not connected' },
          { type: 'output', content: '  Run: node server/index.js for real execution' },
          { type: 'output', content: '' },
        ]);
      }
    });
  }, []);

  useEffect(() => {
    if (!input.trim()) { setSuggestions([]); return; }
    const lower = input.toLowerCase();
    let sug: string[] = [];
    for (const [k, v] of Object.entries(AI_SUGGESTIONS)) {
      if (lower.startsWith(k)) sug.push(...v);
    }
    // Filter by contains
    sug = sug.filter(s => s.toLowerCase().includes(lower) || lower.split(' ').some(w => s.includes(w))).slice(0, 4);
    // Generic
    if (sug.length === 0 && lower.length >= 1) {
      const all = ['ls -la', 'pwd', 'whoami', 'cat /etc/hosts', 'ps aux', 'df -h', 'free -h', 'uname -a', 'nmap -sV 127.0.0.1', 'ping 8.8.8.8'];
      sug = all.filter(s => s.includes(lower)).slice(0, 4);
    }
    setSuggestions(sug);
    setSelectedSuggestion(0);
  }, [input]);

  const execute = async (cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;
    setCommandHistory((h) => [...h, trimmed]);
    setHistoryIdx(-1);
    setSuggestions([]);
    sounds.click();
    const newHistory: HistoryLine[] = [...history, { type: 'input', content: `root@nexus:${cwd}# ${trimmed}` }];

    if (trimmed === 'clear') { setHistory([]); return; }
    if (trimmed === 'exit') { newHistory.push({ type: 'success', content: 'logout' }); setHistory(newHistory); return; }
    if (trimmed.startsWith('cd ')) {
      const target = trimmed.slice(3).trim();
      const newPath = target === '..' ? cwd.split('/').slice(0, -1).join('/') || '/' : target.startsWith('/') ? target : `${cwd}/${target}`;
      setCwd(newPath);
      setHistory(newHistory);
      return;
    }
    if (trimmed === 'cd') { setCwd(sysInfo?.homeDir || '~'); setHistory(newHistory); return; }

    // Arabic AI
    if (/[\u0600-\u06FF]/.test(trimmed)) {
      if (trimmed.includes('شبكة') || trimmed.includes('افحص') || trimmed.includes('nmap')) {
        newHistory.push({ type: 'success', content: '🤖 NEXUS AI → افتح Nmap أو اكتب: nmap -sV 127.0.0.1' });
        setHistory(newHistory);
        return;
      }
      if (trimmed.includes('ملف')) {
        newHistory.push({ type: 'success', content: '🤖 NEXUS AI → افتح Files من الـ Dock' });
        setHistory(newHistory);
        return;
      }
    }

    const result = await executeCommand(trimmed, cwd);
    if (result.stdout) newHistory.push({ type: 'output', content: result.stdout });
    if (result.stderr) newHistory.push({ type: 'error', content: result.stderr });
    if (!result.success && !result.stderr) newHistory.push({ type: 'error', content: `Exit code: ${result.code || 'unknown'}` });
    newHistory.push({ type: 'output', content: '' });
    setHistory(newHistory);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (suggestions.length > 0) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedSuggestion(s => Math.min(s+1, suggestions.length-1)); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedSuggestion(s => Math.max(s-1, 0)); return; }
      if (e.key === 'Tab') {
        e.preventDefault();
        if (suggestions[selectedSuggestion]) setInput(suggestions[selectedSuggestion]);
        return;
      }
    }
    if (e.key === 'Enter') {
      if (suggestions.length > 0 && suggestions[selectedSuggestion] && input !== suggestions[selectedSuggestion]) {
        // If user presses enter with suggestion highlighted, use it? But we want execute input
        // We'll execute input as typed
      }
      execute(input);
      setInput('');
    } else if (e.key === 'ArrowUp' && suggestions.length === 0) {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIdx = historyIdx < 0 ? commandHistory.length - 1 : Math.max(0, historyIdx - 1);
        setHistoryIdx(newIdx);
        setInput(commandHistory[newIdx] || '');
      }
    } else if (e.key === 'ArrowDown' && suggestions.length === 0) {
      e.preventDefault();
      if (historyIdx >= 0) {
        const newIdx = historyIdx + 1;
        if (newIdx >= commandHistory.length) { setHistoryIdx(-1); setInput(''); }
        else { setHistoryIdx(newIdx); setInput(commandHistory[newIdx]); }
      }
    } else if (e.key === 'Escape') {
      setSuggestions([]);
    }
  };

  return (
    <div ref={containerRef} onClick={() => inputRef.current?.focus()} className="h-full bg-black text-[#00ff41] font-mono text-xs p-3 overflow-y-auto cursor-text relative">
      {/* Scanline overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #00ff41 2px, #00ff41 3px)' }} />
      
      {history.map((line, i) => (
        <div key={i} className={line.type === 'input' ? 'text-white' : line.type === 'error' ? 'text-red-400' : line.type === 'success' ? 'text-[#00ff41] font-bold' : 'text-gray-300'}>
          <pre className="whitespace-pre-wrap break-all m-0 leading-relaxed">{line.content}</pre>
        </div>
      ))}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="my-2 rounded-xl overflow-hidden border border-[#00ff41]/20 bg-[#0a0a0f]/95 backdrop-blur-xl">
          <div className="px-2 py-1 text-[9px] tracking-widest text-[#00ff41]/60 flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-[#00ff41] animate-pulse" /> NEXUS AI • TAB to autocomplete</div>
          {suggestions.map((s, i) => (
            <div key={s} onClick={() => setInput(s)} className={`px-3 py-1.5 cursor-pointer text-[11px] flex items-center gap-2 ${i===selectedSuggestion ? 'bg-[#00ff41]/15 text-[#00ff41] border-l-2 border-[#00ff41]' : 'text-white/60 hover:bg-white/5'}`}>
              <span className={i===selectedSuggestion ? 'text-[#00ff41]' : 'text-white/20'}>→</span>
              <span className="font-mono">{s}</span>
              {i===selectedSuggestion && <span className="ml-auto text-[10px] bg-[#00ff41]/20 px-1.5 py-0.5 rounded">TAB</span>}
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center text-white relative">
        <span className="text-[#00ff41] font-bold">root@nexus</span>
        <span className="text-white">:</span>
        <span className="text-[#00aaff]">{cwd}</span>
        <span className="text-white">#&nbsp;</span>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          className="flex-1 bg-transparent outline-none text-white caret-[#00ff41]"
          autoFocus
          placeholder={suggestions.length ? '' : 'Enter command... (try: whoami, ls, nmap)'}
          spellCheck={false}
          autoComplete="off"
        />
        <span className="w-2 h-4 bg-[#00ff41] animate-pulse ml-1 hidden md:inline-block" />
      </div>

      <div className="mt-3 flex items-center gap-2 text-[10px] text-white/20 border-t border-white/5 pt-2">
        <span>↑↓ history</span>
        <span>•</span>
        <span>TAB autocomplete</span>
        <span>•</span>
        <span className="text-[#00ff41]/60">AI enabled</span>
      </div>
    </div>
  );
}
