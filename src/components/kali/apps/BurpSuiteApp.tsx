import { useState } from 'react';

interface Request {
  id: number;
  method: string;
  host: string;
  path: string;
  status: number;
  length: number;
  type: 'http' | 'https';
}

const sampleRequests: Request[] = [
  { id: 1, method: 'GET', host: 'target.com', path: '/', status: 200, length: 1254, type: 'https' },
  { id: 2, method: 'GET', host: 'target.com', path: '/login', status: 200, length: 2341, type: 'https' },
  { id: 3, method: 'POST', host: 'target.com', path: '/api/auth', status: 401, length: 89, type: 'https' },
  { id: 4, method: 'GET', host: 'target.com', path: '/admin', status: 403, length: 521, type: 'https' },
  { id: 5, method: 'GET', host: 'target.com', path: '/robots.txt', status: 200, length: 102, type: 'https' },
  { id: 6, method: 'GET', host: 'target.com', path: '/api/users', status: 200, length: 4521, type: 'https' },
  { id: 7, method: 'POST', host: 'target.com', path: '/api/data', status: 500, length: 234, type: 'https' },
  { id: 8, method: 'GET', host: 'cdn.target.com', path: '/static/main.js', status: 200, length: 89234, type: 'https' },
  { id: 9, method: 'GET', host: 'target.com', path: '/.git/HEAD', status: 404, length: 132, type: 'https' },
  { id: 10, method: 'GET', host: 'target.com', path: '/api/v1/users/1', status: 200, length: 432, type: 'https' },
];

export default function BurpSuiteApp() {
  const [selectedReq, setSelectedReq] = useState<Request | null>(null);
  const [activeTab, setActiveTab] = useState('intercept');
  const [interceptOn, setInterceptOn] = useState(false);

  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: '📊' },
    { id: 'target', name: 'Target', icon: '🎯' },
    { id: 'proxy', name: 'Proxy', icon: '🔀' },
    { id: 'intruder', name: 'Intruder', icon: '💥' },
    { id: 'repeater', name: 'Repeater', icon: '🔁' },
    { id: 'sequencer', name: 'Sequencer', icon: '🔢' },
    { id: 'decoder', name: 'Decoder', icon: '🔐' },
    { id: 'comparer', name: 'Comparer', icon: '🔄' },
    { id: 'logger', name: 'Logger', icon: '📝' },
  ];

  return (
    <div className="h-full flex flex-col bg-[#1a1a1a] text-white text-xs">
      {/* Toolbar */}
      <div className="h-9 bg-[#0d0d0d] border-b border-[#ff6633]/30 flex items-center px-2 gap-2">
        <div
          className="px-3 py-1 rounded font-bold text-[#ff6633]"
          style={{ textShadow: '0 0 5px #ff6633' }}
        >
          Burp Suite
        </div>
        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">
          DEMO UI — use Real Shell for mitmproxy
        </span>
        <div className="flex-1" />
        <button
          onClick={() => setInterceptOn(!interceptOn)}
          className={`px-2 py-0.5 rounded text-[10px] ${
            interceptOn
              ? 'bg-[#ff6633] text-black'
              : 'bg-[#0d0d0d] border border-[#ff6633]/50'
          }`}
        >
          Intercept: {interceptOn ? 'ON' : 'OFF'}
        </button>
        <span className="text-[10px] text-gray-400">Proxy: 127.0.0.1:8080</span>
      </div>

      <div className="flex-1 flex">
        {/* Sidebar tabs */}
        <div className="w-32 bg-[#0d0d0d] border-r border-[#ff6633]/20 py-1">
          {tabs.map((t) => (
            <div
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-3 py-1.5 cursor-pointer text-[11px] flex items-center gap-2 ${
                activeTab === t.id ? 'bg-[#ff6633]/20 text-[#ff6633] border-l-2 border-[#ff6633]' : 'hover:bg-white/5'
              }`}
            >
              <span>{t.icon}</span>
              {t.name}
            </div>
          ))}
        </div>

        {/* Main content */}
        <div className="flex-1 flex">
          {activeTab === 'proxy' && (
            <>
              <div className="w-1/2 border-r border-[#ff6633]/20 flex flex-col">
                <div className="h-7 bg-[#0d0d0d] border-b border-[#ff6633]/20 px-2 flex items-center text-[#ff6633] font-bold">
                  HTTP History
                </div>
                <div className="flex-1 overflow-y-auto">
                  {sampleRequests.map((req) => (
                    <div
                      key={req.id}
                      onClick={() => setSelectedReq(req)}
                      className={`px-2 py-1 cursor-pointer border-b border-white/5 text-[10px] ${
                        selectedReq?.id === req.id ? 'bg-[#ff6633]/20' : 'hover:bg-white/5'
                      }`}
                    >
                      <div className="flex gap-2">
                        <span
                          className={
                            req.method === 'GET' ? 'text-blue-400' :
                            req.method === 'POST' ? 'text-green-400' :
                            'text-yellow-400'
                          }
                        >
                          {req.method}
                        </span>
                        <span
                          className={
                            req.status >= 200 && req.status < 300 ? 'text-green-400' :
                            req.status >= 300 && req.status < 400 ? 'text-yellow-400' :
                            req.status >= 400 ? 'text-red-400' : 'text-gray-400'
                          }
                        >
                          {req.status}
                        </span>
                        <span className="truncate flex-1">{req.host}{req.path}</span>
                        <span className="text-gray-500">{req.length}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="w-1/2 flex flex-col">
                <div className="h-7 bg-[#0d0d0d] border-b border-[#ff6633]/20 flex">
                  {['Request', 'Response', 'Headers'].map((t) => (
                    <div
                      key={t}
                      className="px-3 py-1 hover:bg-white/5 cursor-pointer text-[10px]"
                    >
                      {t}
                    </div>
                  ))}
                </div>
                <div className="flex-1 bg-black p-2 font-mono text-[10px] overflow-y-auto">
                  {selectedReq ? (
                    <>
                      <div className="text-[#ff6633]">{selectedReq.method} {selectedReq.path} HTTP/1.1</div>
                      <div className="text-blue-300">Host: {selectedReq.host}</div>
                      <div className="text-blue-300">User-Agent: Mozilla/5.0 (X11; Linux x86_64)</div>
                      <div className="text-blue-300">Accept: text/html,application/xhtml+xml</div>
                      <div className="text-blue-300">Accept-Language: en-US,en;q=0.9</div>
                      <div className="text-blue-300">Cookie: session=abc123def456</div>
                      <div className="text-blue-300">Connection: keep-alive</div>
                      <div className="mt-2">&nbsp;</div>
                      <div className="text-[#ff6633]">HTTP/1.1 {selectedReq.status} {selectedReq.status === 200 ? 'OK' : selectedReq.status === 401 ? 'Unauthorized' : 'Status'}</div>
                      <div className="text-blue-300">Content-Type: application/json</div>
                      <div className="text-blue-300">Content-Length: {selectedReq.length}</div>
                      <div className="mt-2 text-gray-300">{'{ "id": 1, "user": "admin", "email": "admin@target.com", "role": "administrator" }'}</div>
                    </>
                  ) : (
                    <div className="text-gray-500">Select a request to view details</div>
                  )}
                </div>
              </div>
            </>
          )}

          {activeTab === 'dashboard' && (
            <div className="flex-1 p-4 overflow-y-auto">
              <h2 className="text-[#ff6633] font-bold mb-4 text-base">Dashboard</h2>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Tasks', value: '7', color: '#ff6633' },
                  { label: 'Issues', value: '14', color: '#ff3366' },
                  { label: 'Requests', value: '847', color: '#ffaa00' },
                  { label: 'Errors', value: '3', color: '#ff0033' },
                  { label: 'Hostnames', value: '5', color: '#00ff41' },
                  { label: 'Unique URLs', value: '124', color: '#00aaff' },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="bg-[#0d0d0d] border border-[#ff6633]/20 rounded p-3"
                  >
                    <div className="text-[10px] text-gray-400">{s.label}</div>
                    <div className="text-2xl font-bold" style={{ color: s.color }}>
                      {s.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'intruder' && (
            <div className="flex-1 p-4">
              <h2 className="text-[#ff6633] font-bold mb-2">Intruder</h2>
              <div className="bg-[#0d0d0d] border border-[#ff6633]/20 rounded p-3 font-mono text-[10px]">
                <div className="text-[#ff6633]">GET /api/users/§1§ HTTP/1.1</div>
                <div className="text-blue-300">Host: target.com</div>
                <div className="mt-2 text-gray-400">Payload positions: 1</div>
                <div className="text-gray-400">Payload type: Numbers</div>
                <div className="text-gray-400">From: 1, To: 100, Step: 1</div>
              </div>
            </div>
          )}

          {!['proxy', 'dashboard', 'intruder'].includes(activeTab) && (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <div className="text-4xl mb-2">{tabs.find(t => t.id === activeTab)?.icon}</div>
                <div>{tabs.find(t => t.id === activeTab)?.name}</div>
                <div className="text-[10px]">Module under construction</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
