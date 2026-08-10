import { useState, useEffect, useRef } from 'react';
import { getWiresharkWebSocket, fetchSystemInfo } from '../../../lib/api';

interface Packet {
  no: string;
  time: string;
  source: string;
  destination: string;
  protocol: string;
  length: string;
  info: string;
  color: string;
}

const PROTOCOL_COLORS: Record<string, string> = {
  TCP: '#00aaff',
  UDP: '#00aaff',
  HTTP: '#00ff41',
  HTTPS: '#00ff41',
  TLS: '#ff66ff',
  SSL: '#ff66ff',
  DNS: '#ffaa00',
  ICMP: '#ff3366',
  ARP: '#aaffaa',
  SSH: '#ff8800',
  DHCP: '#ff00ff',
};

const SAMPLE_PACKETS: Omit<Packet, 'no' | 'time'>[] = [
  { source: '192.168.1.105', destination: '8.8.8.8', protocol: 'DNS', length: '78', info: 'Standard query A google.com', color: '#ffaa00' },
  { source: '8.8.8.8', destination: '192.168.1.105', protocol: 'DNS', length: '94', info: 'Standard query response A 142.250.80.46', color: '#ffaa00' },
  { source: '192.168.1.105', destination: '142.250.80.46', protocol: 'TCP', length: '74', info: '443 [SYN] Seq=0 Win=64240', color: '#00aaff' },
  { source: '142.250.80.46', destination: '192.168.1.105', protocol: 'TCP', length: '74', info: '443 [SYN, ACK] Seq=0 Ack=1', color: '#00aaff' },
  { source: '192.168.1.105', destination: '142.250.80.46', protocol: 'TLS', length: '583', info: 'Client Hello', color: '#ff66ff' },
  { source: '192.168.1.1', destination: '192.168.1.105', protocol: 'ARP', length: '60', info: '192.168.1.1 is at 00:1a:2b:3c:4d:5e', color: '#aaffaa' },
  { source: '172.217.14.110', destination: '192.168.1.105', protocol: 'HTTP', length: '1284', info: 'HTTP/1.1 200 OK (text/html)', color: '#00ff41' },
  { source: '192.168.1.105', destination: '192.168.1.1', protocol: 'ICMP', length: '84', info: 'Echo (ping) request', color: '#ff3366' },
];

const PROTOCOLS = ['All', 'TCP', 'UDP', 'HTTP', 'HTTPS', 'DNS', 'TLS', 'ICMP', 'ARP', 'SSH'];

export default function WiresharkApp() {
  const [packets, setPackets] = useState<Packet[]>([]);
  const [capturing, setCapturing] = useState(false);
  const [filter, setFilter] = useState('');
  const [selectedProto, setSelectedProto] = useState('All');
  const [selectedPacket, setSelectedPacket] = useState<Packet | null>(null);
  const [interface_, setInterface] = useState('any');
  const [mode, setMode] = useState<'live' | 'demo' | 'idle'>('idle');
  const [interfaces, setInterfaces] = useState<string[]>(['any', 'eth0', 'lo']);
  const wsRef = useRef<WebSocket | null>(null);

  // Load real interfaces on mount
  useEffect(() => {
    fetchSystemInfo().then((info) => {
      if (info?.ips?.length) {
        const realIfaces = info.ips.map(i => i.interface);
        setInterfaces(['any', ...realIfaces, 'lo']);
      }
    });
  }, []);

  // Demo mode packet generator
  useEffect(() => {
    if (mode !== 'demo' || !capturing) return;
    const interval = setInterval(() => {
      setPackets((prev) => {
        const sample = SAMPLE_PACKETS[Math.floor(Math.random() * SAMPLE_PACKETS.length)];
        const newPkt: Packet = {
          ...sample,
          no: String(prev.length + 1),
          time: new Date().toISOString().substr(11, 12),
        };
        return [...prev.slice(-100), newPkt];
      });
    }, 800);
    return () => clearInterval(interval);
  }, [capturing, mode]);

  const startCapture = () => {
    setPackets([]);
    setCapturing(true);
    setSelectedPacket(null);

    // Try real backend first
    try {
      const ws = getWiresharkWebSocket();
      if (!ws) throw new Error('no ws');

      wsRef.current = ws;
      const timeout = setTimeout(() => {
        // Fallback to demo after 5s
        if (mode === 'idle') {
          try { ws.close(); } catch (e) {}
          setMode('demo');
        }
      }, 5000);

      ws.onopen = () => {
        clearTimeout(timeout);
        setMode('live');
        ws.send(JSON.stringify({ type: 'start', iface: interface_, filter: filter || '' }));
      };
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'packet') {
            const newPkt: Packet = {
              no: data.no || String(packets.length + 1),
              time: data.time || '0.000000',
              source: data.src || '?',
              destination: data.dst || '?',
              protocol: data.proto || '?',
              length: data.len || '0',
              info: data.info || '',
              color: PROTOCOL_COLORS[data.proto?.toUpperCase()] || '#ffffff',
            };
            setPackets((prev) => [...prev.slice(-100), newPkt]);
          } else if (data.type === 'status') {
            // Status messages from tcpdump (e.g., "listening on eth0")
            // Don't switch to demo mode on status messages
          } else if (data.type === 'stderr') {
            // Check for permission errors
            if (data.text.includes('Permission denied') || data.text.includes('CAP_NET_RAW') || data.text.includes('You don\'t have permission')) {
              setMode('demo');
              try { ws.close(); } catch (e) {}
            }
          } else if (data.type === 'demo') {
            // Server explicitly told us to use demo mode
            setMode('demo');
          } else if (data.type === 'exit') {
            setCapturing(false);
            // Don't switch to demo on exit if we already have packets
            if (mode === 'live' && packets.length === 0) setMode('demo');
          }
        } catch (e) {}
      };
      ws.onerror = () => {
        clearTimeout(timeout);
        // Don't immediately switch to demo on error - let onclose handle it
      };
      ws.onclose = () => {
        clearTimeout(timeout);
        // Only switch to demo if we never connected
        if (mode === 'idle') setMode('demo');
      };
    } catch (e) {
      setMode('demo');
    }
  };

  const stopCapture = () => {
    setCapturing(false);
    if (mode === 'live' && wsRef.current?.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify({ type: 'stop' }));
        wsRef.current.close();
      } catch (e) {}
    }
  };

  useEffect(() => () => {
    try { wsRef.current?.close(); } catch (e) {}
  }, []);

  const filteredPackets = packets.filter((p) => {
    if (selectedProto !== 'All' && p.protocol !== selectedProto) return false;
    if (filter && !`${p.source} ${p.destination} ${p.info}`.toLowerCase().includes(filter.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="h-full flex flex-col bg-[#1a1a1a] text-white text-xs">
      {/* Toolbar */}
      <div className="h-9 bg-[#0d0d0d] border-b border-[#167dad]/30 flex items-center px-2 gap-2">
        <span className="text-[#167dad] font-bold">🦈 Wireshark</span>
        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
          mode === 'live' ? 'bg-green-500/20 text-green-400' :
          mode === 'demo' ? 'bg-orange-500/20 text-orange-400' :
          'bg-gray-500/20 text-gray-400'
        }`}>
          {mode === 'live' ? '● LIVE CAPTURE' : mode === 'demo' ? '● DEMO' : '○ IDLE'}
        </span>
        <div className="flex-1" />
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-gray-400">Interface:</span>
          <select
            value={interface_}
            onChange={(e) => setInterface(e.target.value)}
            disabled={capturing}
            className="bg-[#0d0d0d] border border-[#167dad]/30 rounded px-2 py-0.5 outline-none disabled:opacity-50"
          >
            {interfaces.map((i) => <option key={i} value={i}>{i}</option>)}
          </select>
        </div>
        <button
          onClick={capturing ? stopCapture : startCapture}
          className={`px-3 py-0.5 rounded text-[10px] font-bold ${
            capturing ? 'bg-red-500 animate-pulse' : 'bg-[#00ff41] text-black'
          }`}
        >
          {capturing ? '⏹ STOP' : '▶ START'}
        </button>
      </div>

      {/* Filter bar */}
      <div className="h-8 bg-[#0d0d0d] border-b border-[#167dad]/20 flex items-center px-2 gap-2">
        <span className="text-[#167dad] text-[10px]">Filter:</span>
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="tcp.port == 443 or host 192.168.1.1"
          className="flex-1 bg-[#0d0d0d] border border-yellow-500/50 rounded px-2 py-0.5 outline-none focus:border-yellow-400 font-mono"
        />
        <div className="flex gap-1 flex-wrap">
          {PROTOCOLS.slice(0, 6).map((p) => (
            <button
              key={p}
              onClick={() => setSelectedProto(p)}
              className={`px-2 py-0.5 rounded text-[10px] ${
                selectedProto === p
                  ? 'bg-[#167dad]/30 text-[#167dad]'
                  : 'hover:bg-white/5 text-gray-400'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Packet list */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="grid grid-cols-[40px,90px,130px,130px,60px,50px,1fr] gap-1 px-2 py-1 bg-[#0d0d0d] text-[10px] text-gray-400 border-b border-[#167dad]/20 sticky top-0 z-10">
          <div>No.</div>
          <div>Time</div>
          <div>Source</div>
          <div>Destination</div>
          <div>Protocol</div>
          <div>Length</div>
          <div>Info</div>
        </div>
        {filteredPackets.map((p, idx) => (
          <div
            key={idx}
            onClick={() => setSelectedPacket(p)}
            className={`grid grid-cols-[40px,90px,130px,130px,60px,50px,1fr] gap-1 px-2 py-0.5 text-[10px] border-b border-white/5 hover:bg-white/5 font-mono cursor-pointer ${
              selectedPacket === p ? 'bg-blue-500/20' : ''
            }`}
          >
            <div className="text-gray-400">{p.no}</div>
            <div className="text-gray-400">{p.time}</div>
            <div className="text-white truncate">{p.source}</div>
            <div className="text-white truncate">{p.destination}</div>
            <div style={{ color: p.color }} className="font-bold">{p.protocol}</div>
            <div className="text-gray-400">{p.length}</div>
            <div className="text-gray-300 truncate">{p.info}</div>
          </div>
        ))}
        {filteredPackets.length === 0 && (
          <div className="text-center text-gray-500 mt-12">
            {mode === 'live' ? 'Waiting for packets...' : mode === 'demo' ? 'Demo mode — start capture to see sample packets' : 'Press START to begin capture'}
          </div>
        )}
      </div>

      {/* Packet details */}
      {selectedPacket && (
        <div className="h-24 bg-[#0d0d0d] border-t border-[#167dad]/30 p-2 overflow-y-auto text-[10px] font-mono">
          <div className="text-[#167dad] mb-1">▼ Packet {selectedPacket.no} Details</div>
          <div className="text-gray-300">Frame {selectedPacket.no}: {selectedPacket.length} bytes on wire, {selectedPacket.length} bytes captured</div>
          <div className="text-gray-300">Ethernet II, Src: _, Dst: _</div>
          <div className="text-gray-300">Internet Protocol Version 4, Src: {selectedPacket.source}, Dst: {selectedPacket.destination}</div>
          <div className="text-gray-300">{selectedPacket.protocol}: {selectedPacket.info}</div>
        </div>
      )}

      {/* Status bar */}
      <div className="h-5 bg-[#0d0d0d] border-t border-[#167dad]/20 flex items-center justify-between px-2 text-[10px] text-gray-400">
        <span>Packets: {packets.length} • Displayed: {filteredPackets.length}</span>
        <span className={capturing ? 'text-red-400' : 'text-green-400'}>
          ● {capturing ? (mode === 'live' ? 'Capturing (tshark)' : 'Demo capture') : 'Stopped'}
        </span>
      </div>
    </div>
  );
}
