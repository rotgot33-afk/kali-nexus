import { useState } from 'react';
import { runNmap } from '../../../lib/api';

interface Port {
  port: number;
  state: string;
  service: string;
  version: string;
}

const targets = ['127.0.0.1', 'localhost', '192.168.1.1', 'scanme.nmap.org'];

const parseNmapOutput = (output: string): Port[] => {
  const ports: Port[] = [];
  const lines = output.split('\n');
  let inPortSection = false;

  for (const line of lines) {
    if (line.includes('PORT') && line.includes('STATE') && line.includes('SERVICE')) {
      inPortSection = true;
      continue;
    }
    if (inPortSection && line.trim() && !line.startsWith('Nmap') && !line.startsWith('Service Info')) {
      const match = line.match(/^(\d+)\/(\w+)\s+(\w+)\s+(\S+)\s+(.*)$/);
      if (match) {
        ports.push({
          port: parseInt(match[1]),
          state: match[3],
          service: match[4],
          version: match[5] || '',
        });
      }
    }
  }
  return ports;
};

export default function NmapApp() {
  const [target, setTarget] = useState('127.0.0.1');
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState<Port[]>([]);
  const [output, setOutput] = useState<string>('');
  const [profile, setProfile] = useState('-sV');
  const [error, setError] = useState<string | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean | null>(null);

  const startScan = async () => {
    setScanning(true);
    setError(null);
    setResults([]);
    setOutput('Initializing scan...\n');

    const res = await runNmap(target, profile);
    setScanning(false);

    if (res.success) {
      setOutput(res.stdout);
      setResults(parseNmapOutput(res.stdout));
      setIsInstalled(true);
    } else {
      setOutput(res.stdout || '');
      setError(res.stderr || 'Scan failed');
      if (res.stderr?.includes('not found') || res.stderr?.includes('not recognized')) {
        setIsInstalled(false);
      }
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#1a1a1a] text-white text-xs">
      {/* Profile tabs */}
      <div className="h-8 bg-[#0d0d0d] flex items-center px-2 gap-1 border-b border-[#00ff41]/20 overflow-x-auto">
        {[
          { name: 'Intense', cmd: '-sV -sC -A' },
          { name: 'Quick', cmd: '-sS' },
          { name: 'Regular', cmd: '-sV' },
          { name: 'Stealth', cmd: '-sS -Pn' },
          { name: 'UDP', cmd: '-sU' },
        ].map((p) => (
          <button
            key={p.name}
            onClick={() => setProfile(p.cmd)}
            className={`px-3 py-1 rounded text-[10px] whitespace-nowrap ${
              profile === p.cmd ? 'bg-[#7b3ff2]/30 text-[#c4a0ff]' : 'hover:bg-white/5'
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="h-10 bg-[#1a1a1a] border-b border-[#00ff41]/20 flex items-center px-2 gap-2">
        <span className="text-gray-400">Target:</span>
        <select
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          className="bg-[#0d0d0d] border border-[#00ff41]/30 rounded px-2 py-1 outline-none"
        >
          {targets.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <input
          type="text"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          className="flex-1 bg-[#0d0d0d] border border-[#00ff41]/30 rounded px-2 py-1 outline-none"
        />
        <button
          onClick={startScan}
          disabled={scanning}
          className="px-3 py-1 bg-[#7b3ff2] hover:bg-[#9159ff] disabled:opacity-50 rounded font-bold"
        >
          {scanning ? '⏳ Scanning...' : '▶ Scan'}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className="w-40 bg-[#0d0d0d] border-r border-[#00ff41]/20 p-2">
          <div className="text-[#7b3ff2] font-bold mb-2 text-[10px]">OPTIONS</div>
          {[
            { name: 'Service Version', flag: '-sV' },
            { name: 'OS Detection', flag: '-O' },
            { name: 'Script Scan', flag: '-sC' },
            { name: 'Aggressive', flag: '-A' },
            { name: 'No Ping', flag: '-Pn' },
            { name: 'UDP Scan', flag: '-sU' },
          ].map((opt) => (
            <label key={opt.flag} className="flex items-center gap-1 px-2 py-1 hover:bg-white/5 rounded cursor-pointer text-[10px]">
              <input type="checkbox" />
              <span>{opt.name}</span>
            </label>
          ))}

          <div className="text-[#7b3ff2] font-bold mt-4 mb-2 text-[10px]">STATUS</div>
          <div className="px-2 py-1 text-[10px]">
            nmap: {isInstalled === null ? '...' : isInstalled ? '✓ installed' : '✗ not found'}
          </div>
        </div>

        {/* Main */}
        <div className="flex-1 flex flex-col">
          {scanning && (
            <div className="p-3 bg-[#0d0d0d] border-b border-[#00ff41]/20">
              <div className="text-[#7b3ff2] mb-1 font-mono">
                [+] Scanning {target} with: {profile}
              </div>
              <div className="h-2 bg-[#0d0d0d] rounded overflow-hidden border border-[#00ff41]/30">
                <div className="h-full bg-gradient-to-r from-[#7b3ff2] to-[#00ff41] animate-pulse w-full" />
              </div>
            </div>
          )}

          {error && !scanning && (
            <div className="p-2 bg-red-900/20 border-b border-red-500/30 text-red-400 text-[10px]">
              {error}
            </div>
          )}

          <div className="flex-1 p-2 overflow-y-auto">
            {results.length > 0 ? (
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="text-left text-gray-400 border-b border-[#00ff41]/20">
                    <th className="py-1">Port</th>
                    <th>State</th>
                    <th>Service</th>
                    <th>Version</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((p, i) => (
                    <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-1 font-mono text-[#00ff41]">{p.port}</td>
                      <td>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] ${
                            p.state === 'open' ? 'bg-green-500/20 text-green-400' :
                            p.state === 'closed' ? 'bg-red-500/20 text-red-400' :
                            p.state === 'filtered' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}
                        >
                          {p.state}
                        </span>
                      </td>
                      <td className="text-gray-300">{p.service}</td>
                      <td className="text-gray-400">{p.version}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : !scanning && !error ? (
              <div className="h-full flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <div className="text-6xl mb-2">🔍</div>
                  <div>Ready to scan</div>
                  <div className="text-[10px]">Real nmap will execute on backend</div>
                </div>
              </div>
            ) : null}
          </div>

          {/* Output console */}
          <div className="h-32 bg-black border-t border-[#00ff41]/20 p-2 font-mono text-[10px] text-[#00ff41] overflow-y-auto">
            <pre className="whitespace-pre-wrap">{output || '$ nmap ' + profile + ' ' + target}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
