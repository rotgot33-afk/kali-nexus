import { useState } from 'react';

const sites = [
  { name: 'Kali Linux', url: 'https://kali.org', color: '#3674f5', desc: 'Official Kali Linux website' },
  { name: 'OffSec', url: 'https://offensive-security.com', color: '#000000', desc: 'Offensive Security training' },
  { name: 'Exploit-DB', url: 'https://exploit-db.com', color: '#cc0000', desc: 'Exploit Database' },
  { name: 'OWASP', url: 'https://owasp.org', color: '#000000', desc: 'Web security' },
];

export default function BrowserApp() {
  const [url, setUrl] = useState('https://kali.org');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<string[]>(['https://kali.org']);
  const [historyIdx, setHistoryIdx] = useState(0);

  const navigate = (newUrl: string) => {
    setLoading(true);
    setUrl(newUrl);
    setTimeout(() => setLoading(false), 800);
    const newHistory = [...history.slice(0, historyIdx + 1), newUrl];
    setHistory(newHistory);
    setHistoryIdx(newHistory.length - 1);
  };

  return (
    <div className="h-full flex flex-col bg-[#1a1a1a] text-white text-xs">
      {/* Tabs */}
      <div className="h-8 bg-[#0d0d0d] flex items-center px-2 gap-1">
        <div className="bg-[#1a1a1a] px-3 py-1 rounded-t flex items-center gap-2 max-w-[200px]">
          <span>🔒</span>
          <span className="truncate">Kali Linux</span>
          <span className="ml-auto text-gray-500 cursor-pointer">✕</span>
        </div>
        <button className="px-2 text-gray-400 hover:text-white">+</button>
      </div>

      {/* Toolbar */}
      <div className="h-9 bg-[#1a1a1a] border-b border-[#00ff41]/20 flex items-center px-2 gap-2">
        <button
          onClick={() => historyIdx > 0 && navigate(history[historyIdx - 1])}
          className="px-2 hover:bg-white/5 rounded disabled:opacity-30"
          disabled={historyIdx === 0}
        >
          ←
        </button>
        <button
          onClick={() => historyIdx < history.length - 1 && navigate(history[historyIdx + 1])}
          className="px-2 hover:bg-white/5 rounded disabled:opacity-30"
          disabled={historyIdx === history.length - 1}
        >
          →
        </button>
        <button
          onClick={() => {
            setLoading(true);
            setTimeout(() => setLoading(false), 500);
          }}
          className="px-2 hover:bg-white/5 rounded"
        >
          ↻
        </button>
        <button className="px-2 hover:bg-white/5 rounded">🏠</button>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && navigate(url)}
          className="flex-1 bg-[#0d0d0d] rounded px-3 py-1 outline-none border border-transparent focus:border-[#00ff41]/50"
        />
        <button className="px-2 hover:bg-white/5 rounded">⭐</button>
        <button className="px-2 hover:bg-white/5 rounded">⋮</button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-white text-black">
        {loading ? (
          <div className="h-full flex items-center justify-center bg-[#1a1a1a]">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-[#00ff41]/20 border-t-[#00ff41] rounded-full animate-spin mx-auto mb-3" />
              <div className="text-[#00ff41] font-mono">Loading {url}...</div>
            </div>
          </div>
        ) : (
          <div className="p-6">
            <div className="text-center mb-8">
              <div
                className="inline-block text-6xl mb-3"
                style={{ filter: 'drop-shadow(0 0 20px rgba(54,116,245,0.5))' }}
              >
                🐉
              </div>
              <h1 className="text-3xl font-bold text-[#3674f5] mb-2">Kali Linux</h1>
              <p className="text-gray-600 text-sm">The most advanced penetration testing distribution</p>
            </div>

            <div className="max-w-2xl mx-auto">
              <div className="flex items-center border-2 border-gray-200 rounded-full px-4 py-2 mb-6">
                <span>🔍</span>
                <input
                  className="flex-1 bg-transparent outline-none px-2"
                  placeholder="Search with DuckDuckGo..."
                />
              </div>

              <div className="grid grid-cols-4 gap-3">
                {sites.map((s) => (
                  <button
                    key={s.name}
                    onClick={() => navigate(s.url)}
                    className="p-3 border border-gray-200 rounded hover:border-[#3674f5] hover:shadow-md transition-all text-left"
                  >
                    <div
                      className="w-8 h-8 rounded mb-2 flex items-center justify-center text-white font-bold"
                      style={{ background: s.color }}
                    >
                      {s.name[0]}
                    </div>
                    <div className="text-xs font-bold">{s.name}</div>
                    <div className="text-[10px] text-gray-500 truncate">{s.desc}</div>
                  </button>
                ))}
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded">
                <div className="text-xs text-gray-600 mb-2">Quick links</div>
                <div className="flex flex-wrap gap-2">
                  {['Tools', 'Documentation', 'Community', 'Blog', 'Download', 'Training'].map((t) => (
                    <button
                      key={t}
                      className="px-3 py-1 bg-white border border-gray-200 rounded-full text-xs hover:bg-[#3674f5] hover:text-white transition-colors"
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="h-5 bg-[#0d0d0d] border-t border-[#00ff41]/20 flex items-center justify-between px-2 text-[10px] text-gray-400">
        <span>{loading ? 'Loading...' : 'Done'}</span>
        <span>🔒 Secure connection</span>
      </div>
    </div>
  );
}
