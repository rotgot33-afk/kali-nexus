import { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import '@xterm/xterm/css/xterm.css';
import { getTerminalWebSocket } from '../../../lib/api';

type Mode = 'connecting' | 'connected' | 'demo';

const PROMPT = '\x1b[32mroot@kali\x1b[0m:\x1b[34m~\x1b[0m# ';

function showDemoMode(term: XTerm) {
  term.clear();
  term.writeln('\x1b[33m┌──────────────────────────────────────────────────────┐\x1b[0m');
  term.writeln('\x1b[33m│\x1b[0m  \x1b[32m🐉 KALI NEXUS - DEMO MODE\x1b[0m                       \x1b[33m│\x1b[0m');
  term.writeln('\x1b[33m└──────────────────────────────────────────────────────┘\x1b[0m');
  term.writeln('');
  term.writeln('\x1b[90mBackend not running. Demo commands available.\x1b[0m');
  term.writeln('\x1b[90mStart backend with: npm run dev:server\x1b[0m');
  term.writeln('');
  term.write(PROMPT);
}

function handleDemoCommand(term: XTerm, cmd: string) {
  const trimmed = cmd.trim();
  const parts = trimmed.split(/\s+/);
  const main = parts[0]?.toLowerCase();

  switch (main) {
    case '':
      term.writeln('');
      term.write(PROMPT);
      return;
    case 'help':
      term.writeln('');
      term.writeln('\x1b[36mAvailable demo commands:\x1b[0m');
      term.writeln('  \x1b[32mhelp\x1b[0m     - Show this help');
      term.writeln('  \x1b[32mwhoami\x1b[0m   - Print current user');
      term.writeln('  \x1b[32mpwd\x1b[0m      - Print working directory');
      term.writeln('  \x1b[32mls\x1b[0m       - List directory');
      term.writeln('  \x1b[32muname\x1b[0m    - System info');
      term.writeln('  \x1b[32mdate\x1b[0m     - Current date');
      term.writeln('  \x1b[32mhostname\x1b[0m - Show hostname');
      term.writeln('  \x1b[32muptime\x1b[0m   - System uptime');
      term.writeln('  \x1b[32mifconfig\x1b[0m - Network interfaces');
      term.writeln('  \x1b[32mps\x1b[0m       - Running processes');
      term.writeln('  \x1b[32mfree\x1b[0m     - Memory info');
      term.writeln('  \x1b[32mdf\x1b[0m       - Disk usage');
      term.writeln('  \x1b[32mecho\x1b[0m <t> - Display text');
      term.writeln('  \x1b[32mclear\x1b[0m    - Clear screen');
      break;
    case 'whoami': term.writeln('\r\nroot'); break;
    case 'pwd': term.writeln('\r\n/root'); break;
    case 'ls':
      term.writeln('\r\nDesktop  Documents  Downloads  Music  Pictures  Videos');
      term.writeln('exploit.sh  notes.md  passwords.txt  targets.txt');
      break;
    case 'uname':
      term.writeln('\r\nLinux kali 6.6.9-amd64 #1 SMP PREEMPT_DYNAMIC Kali 6.6.9-1kali1 (2024-01-08) x86_64 GNU/Linux');
      break;
    case 'date': term.writeln(`\r\n${new Date().toString()}`); break;
    case 'hostname': term.writeln('\r\nkali'); break;
    case 'uptime': term.writeln('\r\n 10:42:34 up 3 days,  2:14,  1 user,  load average: 0.08, 0.12, 0.09'); break;
    case 'ifconfig':
      term.writeln('\r\neth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500');
      term.writeln('        inet 192.168.1.105  netmask 255.255.255.0');
      term.writeln('        ether 08:00:27:4e:12:34  txqueuelen 1000  (Ethernet)');
      term.writeln('lo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536');
      term.writeln('        inet 127.0.0.1  netmask 255.0.0.0');
      break;
    case 'ps':
      term.writeln('\r\n  PID TTY          TIME CMD');
      term.writeln('    1 ?        00:00:01 systemd');
      term.writeln('  234 ?        00:00:00 sshd');
      term.writeln('  567 ?        00:00:00 NetworkManager');
      term.writeln('  789 ?        00:00:00 gnome-shell');
      break;
    case 'free':
      term.writeln('\r\n              total        used        free      shared  buff/cache   available');
      term.writeln('Mem:        8042032     2345678     3456789      234567     2239565     5234567');
      break;
    case 'df':
      term.writeln('\r\nFilesystem      Size  Used Avail Use% Mounted on');
      term.writeln('/dev/sda1        50G   12G   35G  26% /');
      term.writeln('tmpfs           2.0G     0  2.0G   0% /tmp');
      break;
    case 'echo': term.writeln(`\r\n${parts.slice(1).join(' ')}`); break;
    case 'clear':
      term.clear();
      term.write(PROMPT);
      return;
    default:
      term.writeln(`\r\n\x1b[31mbash: ${main}: command not found\x1b[0m`);
      term.writeln('\x1b[90m(Demo mode - start backend for real commands)\x1b[0m');
  }
  term.writeln('');
  term.write(PROMPT);
}

export default function RealTerminal() {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const modeRef = useRef<Mode>('connecting');
  const lineBufferRef = useRef<string>('');
  const [mode, setMode] = useState<Mode>('connecting');

  // Send terminal size to backend (PTY resize)
  const sendResize = (cols: number, rows: number) => {
    if (modeRef.current === 'connected' && wsRef.current?.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(`\x1b[__resize__cols=${cols};rows=${rows}`);
      } catch (e) {}
    }
  };

  useEffect(() => {
    if (!containerRef.current) return;

    const term = new XTerm({
      cursorBlink: true,
      fontFamily: 'JetBrains Mono, Consolas, Monaco, "Courier New", monospace',
      fontSize: 13,
      lineHeight: 1.2,
      theme: {
        background: '#000000',
        foreground: '#00ff41',
        cursor: '#00ff41',
        cursorAccent: '#000000',
        selectionBackground: '#00ff4140',
        black: '#000000',
        red: '#ff5555',
        green: '#00ff41',
        yellow: '#ffff55',
        blue: '#5555ff',
        magenta: '#ff55ff',
        cyan: '#55ffff',
        white: '#ffffff',
        brightBlack: '#666666',
        brightRed: '#ff8888',
        brightGreen: '#88ff88',
        brightYellow: '#ffff88',
        brightBlue: '#8888ff',
        brightMagenta: '#ff88ff',
        brightCyan: '#88ffff',
        brightWhite: '#ffffff',
      },
      convertEol: true,
      allowProposedApi: true,
      scrollback: 5000,
    });

    const fitAddon = new FitAddon();
    const linksAddon = new WebLinksAddon();
    term.loadAddon(fitAddon);
    term.loadAddon(linksAddon);
    term.open(containerRef.current);

    try { fitAddon.fit(); } catch (e) {}

    termRef.current = term;
    fitAddonRef.current = fitAddon;

    term.writeln('\x1b[33m⏳ Connecting to backend...\x1b[0m');

    // Input handler (works in both modes)
    const onData = (data: string) => {
      if (modeRef.current === 'connected' && wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(data);
        return;
      }
      // Demo mode line-based input
      for (const ch of data) {
        const code = ch.charCodeAt(0);
        if (code === 13) {
          term.write('\r\n');
          handleDemoCommand(term, lineBufferRef.current);
          lineBufferRef.current = '';
        } else if (code === 127 || code === 8) {
          if (lineBufferRef.current.length > 0) {
            term.write('\b \b');
            lineBufferRef.current = lineBufferRef.current.slice(0, -1);
          }
        } else if (code === 3) {
          term.writeln('^C');
          lineBufferRef.current = '';
          term.write(PROMPT);
        } else if (code >= 32 && code < 127) {
          term.write(ch);
          lineBufferRef.current += ch;
        }
      }
    };
    term.onData(onData);

    // Connection attempt with longer timeout (Render free tier cold start)
    let connectionTimeout: ReturnType<typeof setTimeout> | null = null;
    let heartbeatInterval: ReturnType<typeof setInterval> | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
    let reconnectAttempts = 0;
    let isManualClose = false;

    const switchToDemo = () => {
      if (modeRef.current === 'connecting') {
        modeRef.current = 'demo';
        setMode('demo');
        showDemoMode(term);
      }
    };

    const connect = () => {
      try {
        const ws = getTerminalWebSocket();
        if (!ws) {
          setTimeout(switchToDemo, 100);
          return;
        }
        wsRef.current = ws;
        // 15-second timeout for Render cold start
        connectionTimeout = setTimeout(switchToDemo, 15000);

        ws.onopen = () => {
          if (connectionTimeout) clearTimeout(connectionTimeout);
          modeRef.current = 'connected';
          setMode('connected');
          reconnectAttempts = 0;
          term.clear();
          // Send initial size
          setTimeout(() => {
            try {
              const dims = fitAddon.proposeDimensions();
              if (dims) sendResize(dims.cols, dims.rows);
            } catch (e) {}
          }, 100);

          // Start heartbeat: send every 20s to keep connection alive
          if (heartbeatInterval) clearInterval(heartbeatInterval);
          heartbeatInterval = setInterval(() => {
            if (wsRef.current?.readyState === WebSocket.OPEN) {
              try { wsRef.current.send('__heartbeat__'); } catch (e) {}
            }
          }, 20000);
        };
        ws.onmessage = (event: MessageEvent) => {
          term.write(event.data);
        };
        ws.onerror = () => {};
        ws.onclose = () => {
          if (heartbeatInterval) { clearInterval(heartbeatInterval); heartbeatInterval = null; }

          if (isManualClose) return;

          // Auto-reconnect with exponential backoff (max 5 attempts)
          if (reconnectAttempts < 5 && modeRef.current !== 'demo') {
            reconnectAttempts++;
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts - 1), 10000);
            term.writeln(`\r\n\x1b[33m⟳ Reconnecting in ${delay / 1000}s... (attempt ${reconnectAttempts}/5)\x1b[0m`);
            modeRef.current = 'connecting';
            setMode('connecting');
            reconnectTimeout = setTimeout(() => connect(), delay);
          } else if (modeRef.current === 'connected') {
            modeRef.current = 'demo';
            setMode('demo');
            term.writeln('\r\n\x1b[33m⚠️  Connection lost - switched to demo mode\x1b[0m');
            term.write(PROMPT);
          } else {
            switchToDemo();
          }
        };
      } catch (e) {
        setTimeout(switchToDemo, 100);
      }
    };

    connect();

    // Resize handling — also sends new size to backend
    const handleResize = () => {
      try {
        fitAddon.fit();
        const dims = fitAddon.proposeDimensions();
        if (dims) sendResize(dims.cols, dims.rows);
      } catch (e) {}
    };
    window.addEventListener('resize', handleResize);
    const resizeObserver = new ResizeObserver(() => {
      try {
        fitAddon.fit();
        const dims = fitAddon.proposeDimensions();
        if (dims) sendResize(dims.cols, dims.rows);
      } catch (e) {}
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      isManualClose = true;
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
      if (connectionTimeout) clearTimeout(connectionTimeout);
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      try { wsRef.current?.close(); } catch (e) {}
      term.dispose();
    };
  }, []);

  const reconnect = () => {
    if (!termRef.current) return;
    setMode('connecting');
    modeRef.current = 'connecting';
    termRef.current.clear();
    termRef.current.writeln('\x1b[33m⏳ Reconnecting...\x1b[0m');

    setTimeout(() => {
      const ws = getTerminalWebSocket();
      if (!ws) {
        modeRef.current = 'demo';
        setMode('demo');
        showDemoMode(termRef.current!);
        return;
      }
      wsRef.current = ws;
      const timeout = setTimeout(() => {
        modeRef.current = 'demo';
        setMode('demo');
        showDemoMode(termRef.current!);
      }, 8000);
      ws.onopen = () => {
        clearTimeout(timeout);
        modeRef.current = 'connected';
        setMode('connected');
        termRef.current?.clear();
        setTimeout(() => {
          try {
            const dims = fitAddonRef.current?.proposeDimensions();
            if (dims && wsRef.current?.readyState === WebSocket.OPEN) {
              wsRef.current.send(`\x1b[__resize__cols=${dims.cols};rows=${dims.rows}`);
            }
          } catch (e) {}
        }, 100);
      };
      ws.onmessage = (e: MessageEvent) => termRef.current?.write(e.data);
      ws.onerror = () => {};
      ws.onclose = () => {
        clearTimeout(timeout);
        modeRef.current = 'demo';
        setMode('demo');
        showDemoMode(termRef.current!);
      };
    }, 100);
  };

  return (
    <div className="h-full flex flex-col bg-black">
      <div className="h-7 bg-[#1a1a1a] border-b border-[#00ff41]/20 flex items-center justify-between px-2 text-[10px]">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${
            mode === 'connected' ? 'bg-green-500 animate-pulse' :
            mode === 'connecting' ? 'bg-yellow-500 animate-pulse' :
            'bg-orange-500'
          }`} />
          <span className="text-gray-300">
            {mode === 'connected' ? '🟢 REAL PTY SHELL — vim/top/nano work' :
             mode === 'connecting' ? '🟡 Connecting...' :
             '🟠 Demo Mode — backend offline'}
          </span>
        </div>
        <button
          onClick={reconnect}
          className="px-2 py-0.5 bg-[#00ff41]/20 text-[#00ff41] rounded hover:bg-[#00ff41]/30"
        >
          🔄
        </button>
      </div>
      <div ref={containerRef} className="flex-1 p-1 bg-black overflow-hidden" />
    </div>
  );
}
