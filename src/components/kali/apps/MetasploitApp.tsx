import { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { getMetasploitWebSocket } from '../../../lib/api';

type Mode = 'connecting' | 'connected' | 'demo';

const DEMO_MODULES = [
  { name: 'exploit/multi/handler', type: 'exploit', rank: 'normal' },
  { name: 'exploit/unix/ftp/vsftpd_234_backdoor', type: 'exploit', rank: 'excellent' },
  { name: 'exploit/windows/smb/ms17_010_eternalblue', type: 'exploit', rank: 'great' },
  { name: 'exploit/multi/http/struts2_content_type_ognl', type: 'exploit', rank: 'excellent' },
  { name: 'auxiliary/scanner/ssh/ssh_login', type: 'auxiliary', rank: 'normal' },
  { name: 'auxiliary/scanner/portscan/tcp', type: 'auxiliary', rank: 'normal' },
  { name: 'payload/linux/x64/meterpreter/reverse_tcp', type: 'payload', rank: 'normal' },
  { name: 'payload/windows/x64/meterpreter/reverse_tcp', type: 'payload', rank: 'normal' },
];

const DEMO_BANNER = `
\x1b[31m                                  .,,.                  \x1b[0m
\x1b[31m                                 .,;,.                  \x1b[0m
\x1b[31m                        ....,,:;,.       \x1b[0m
\x1b[31m                      ...,,'',.          \x1b[0m
\x1b[31m              ..,,:;;;;;,.....          \x1b[0m
\x1b[31m          ...,:;;;;;;:.                \x1b[0m
\x1b[31m          \x1b[32mMMMMMMMMM\x1b[31m.         ...,:;;;,..     \x1b[0m
\x1b[31m          \x1b[32mMMMMMMMMMM,\x1b[31m      ..,,:;;;;;:..    \x1b[0m
\x1b[31m          \x1b[32mMMMMMMMMMMM\x1b[31m...,:;;;;;;;:.      \x1b[0m
\x1b[31m          \x1b[32mMMMMMMMMMMM\x1b[31m:;;;;;;;;;:..     \x1b[0m
\x1b[31m          \x1b[32mMMMMMMMMMMM\x1b[31m;;;;;;;;;;.       \x1b[0m
\x1b[31m          \x1b[32mMMMMMMMMMMM\x1b[31m:;;;;;;;;;:..     \x1b[0m
\x1b[31m          \x1b[32mMMMMMMMMMMM\x1b[31m...,:;;;;;;;:.    \x1b[0m
\x1b[31m          \x1b[32mMMMMMMMMMM,\x1b[31m      ..,,:;;;;;:.. \x1b[0m
\x1b[31m          \x1b[32mMMMMMMMMM\x1b[31m.         ...,:;;;,.. \x1b[0m

      \x1b[33m=[ metasploit v6.4.0-dev                          ]\x1b[0m
+ -- --=[ 2300 exploits - 1200 auxiliary - 400 post       ]
+ -- --=[ 1200 payloads - 45 encoders - 11 nops            ]
+ -- --=[ 9 evasion                                       ]

\x1b[33m[*] Demo Mode — start backend for real msfconsole\x1b[0m
\x1b[33m[*] msf6 >\x1b[0m `;

function showDemo(term: XTerm, cmd: string) {
  term.writeln(`\r\n\x1b[32mmsf6 >\x1b[0m ${cmd}`);
  const main = cmd.split(' ')[0];
  if (cmd === 'help' || cmd === '?') {
    term.writeln('\r\nCore Commands');
    term.writeln('=============');
    term.writeln('  ?       Help menu');
    term.writeln('  banner  Display an awesome metasploit banner');
    term.writeln('  exit    Exit the console');
    term.writeln('  search  Searches module names and descriptions');
    term.writeln('  use     Selects a module by name');
    term.writeln('  show    Displays modules of a given type');
  } else if (cmd === 'banner') {
    term.writeln(DEMO_BANNER);
  } else if (cmd.startsWith('search ')) {
    const q = cmd.split(' ')[1];
    term.writeln(`\r\nMatching Modules for "${q}"`);
    DEMO_MODULES.slice(0, 4).forEach(m => term.writeln(`   ${m.name}`));
  } else if (cmd.startsWith('use ')) {
    term.writeln(`\r\n[*] Using module: ${cmd.split(' ')[1]}`);
    term.writeln('[*] Demo mode — set RHOSTS and run with: exploit');
  } else if (cmd === 'show exploits') {
    DEMO_MODULES.filter(m => m.type === 'exploit').forEach(m => term.writeln(`   ${m.name}`));
  } else if (cmd === 'exit' || cmd === 'quit') {
    term.writeln('\r\n[*] Goodbye!');
  } else if (cmd) {
    term.writeln(`\r\n[-] Unknown command: ${cmd}`);
  }
  term.write('\r\n\x1b[32mmsf6 >\x1b[0m ');
}

export default function MetasploitApp() {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const modeRef = useRef<Mode>('connecting');
  const lineBufferRef = useRef<string>('');
  const [mode, setMode] = useState<Mode>('connecting');

  useEffect(() => {
    if (!containerRef.current) return;

    const term = new XTerm({
      cursorBlink: true,
      fontFamily: 'JetBrains Mono, Consolas, Monaco, monospace',
      fontSize: 12,
      theme: {
        background: '#0a0a0a',
        foreground: '#ff5555',
        cursor: '#ff5555',
        selectionBackground: '#ff555540',
        red: '#ff5555',
        green: '#00ff41',
        yellow: '#ffff55',
        cyan: '#55ffff',
        white: '#ffffff',
      },
      convertEol: true,
      allowProposedApi: true,
      scrollback: 5000,
    });
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(containerRef.current);
    try { fitAddon.fit(); } catch (e) {}
    termRef.current = term;
    fitAddonRef.current = fitAddon;

    term.writeln('\x1b[33m[*] Connecting to Metasploit backend...\x1b[0m');
    term.writeln('\x1b[90m[*] First launch may take 20-30 seconds (cold start)\x1b[0m\r\n');

    const onData = (data: string) => {
      if (modeRef.current === 'connected' && wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(data);
        return;
      }
      // Demo line input
      for (const ch of data) {
        const code = ch.charCodeAt(0);
        if (code === 13) {
          showDemo(term, lineBufferRef.current);
          lineBufferRef.current = '';
        } else if (code === 127 || code === 8) {
          if (lineBufferRef.current.length > 0) {
            term.write('\b \b');
            lineBufferRef.current = lineBufferRef.current.slice(0, -1);
          }
        } else if (code === 3) {
          term.writeln('^C');
          lineBufferRef.current = '';
          term.write('\r\n\x1b[32mmsf6 >\x1b[0m ');
        } else if (code >= 32 && code < 127) {
          term.write(ch);
          lineBufferRef.current += ch;
        }
      }
    };
    term.onData(onData);

    let timeout: ReturnType<typeof setTimeout> | null = null;
    const switchToDemo = () => {
      if (modeRef.current === 'connecting') {
        modeRef.current = 'demo';
        setMode('demo');
        term.clear();
        term.writeln(DEMO_BANNER);
        term.write('\r\n\x1b[32mmsf6 >\x1b[0m ');
      }
    };

    try {
      const ws = getMetasploitWebSocket();
      if (ws) {
        wsRef.current = ws;
        // 30s timeout — msfconsole cold start
        timeout = setTimeout(switchToDemo, 30000);
        ws.onopen = () => {
          if (timeout) clearTimeout(timeout);
          modeRef.current = 'connected';
          setMode('connected');
          term.clear();
        };
        ws.onmessage = (e: MessageEvent) => term.write(e.data);
        ws.onerror = () => {};
        ws.onclose = () => {
          if (modeRef.current === 'connected') {
            modeRef.current = 'demo';
            setMode('demo');
            term.writeln('\r\n\x1b[33m[*] Disconnected — switched to demo mode\x1b[0m');
            term.write('\r\n\x1b[32mmsf6 >\x1b[0m ');
          } else {
            switchToDemo();
          }
        };
      } else {
        setTimeout(switchToDemo, 100);
      }
    } catch (e) {
      setTimeout(switchToDemo, 100);
    }

    const handleResize = () => { try { fitAddon.fit(); } catch (e) {} };
    window.addEventListener('resize', handleResize);
    const ro = new ResizeObserver(() => { try { fitAddon.fit(); } catch (e) {} });
    ro.observe(containerRef.current);

    return () => {
      window.removeEventListener('resize', handleResize);
      ro.disconnect();
      if (timeout) clearTimeout(timeout);
      try { wsRef.current?.close(); } catch (e) {}
      term.dispose();
    };
  }, []);

  return (
    <div className="h-full flex flex-col bg-[#0a0a0a]">
      <div className="h-7 bg-[#1a1a1a] border-b border-red-500/30 flex items-center justify-between px-2 text-[10px]">
        <div className="flex items-center gap-2">
          <span className="text-red-400 font-bold">metasploit framework</span>
          <span className="text-gray-500">|</span>
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${
              mode === 'connected' ? 'bg-green-500 animate-pulse' :
              mode === 'connecting' ? 'bg-yellow-500 animate-pulse' :
              'bg-orange-500'
            }`} />
            <span className="text-gray-400">
              {mode === 'connected' ? 'msfconsole LIVE' :
               mode === 'connecting' ? 'Launching...' :
               'Demo Mode'}
            </span>
          </div>
        </div>
        <span className="text-gray-500 font-mono">v6.4.0-dev</span>
      </div>
      <div ref={containerRef} className="flex-1 bg-[#0a0a0a] overflow-hidden p-1" />
    </div>
  );
}
