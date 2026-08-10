import { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import '@xterm/xterm/css/xterm.css';
import { executeCommand, fetchSystemInfo, API_BASE, type SystemInfo } from '../../../lib/api';

type Mode = 'connecting' | 'live' | 'demo';

const PROMPT = '\x1b[32mroot@nexus\x1b[0m:\x1b[34m~\x1b[0m# ';

function showDemoMode(term: XTerm) {
  term.clear();
  term.writeln('\x1b[33m┌──────────────────────────────────────────────────────┐\x1b[0m');
  term.writeln('\x1b[33m│\x1b[0m  \x1b[32m🐉 KALI NEXUS - DEMO MODE\x1b[0m                       \x1b[33m│\x1b[0m');
  term.writeln('\x1b[33m└──────────────────────────────────────────────────────┘\x1b[0m');
  term.writeln('');
  term.writeln('\x1b[90mBackend not running. Demo commands available.\x1b[0m');
  term.writeln('');
  term.write(PROMPT);
}

function handleDemoCommand(term: XTerm, cmd: string) {
  const trimmed = cmd.trim();
  const parts = trimmed.split(/\s+/);
  const main = parts[0]?.toLowerCase();

  switch (main) {
    case '': term.writeln(''); term.write(PROMPT); return;
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
      term.writeln('  \x1b[32mclear\x1b[0m    - Clear screen');
      break;
    case 'whoami': term.writeln('\r\nroot'); break;
    case 'pwd': term.writeln('\r\n/root'); break;
    case 'ls': term.writeln('\r\nDesktop  Documents  Downloads  exploit.sh  notes.md'); break;
    case 'uname': term.writeln('\r\nLinux kali 6.6.9-amd64 x86_64 GNU/Linux'); break;
    case 'date': term.writeln(`\r\n${new Date().toString()}`); break;
    case 'hostname': term.writeln('\r\nkali'); break;
    case 'clear': term.clear(); term.write(PROMPT); return;
    default: term.writeln(`\r\n\x1b[31mbash: ${main}: command not found\x1b[0m`);
  }
  term.writeln('');
  term.write(PROMPT);
}

export default function RealTerminal() {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const lineBufferRef = useRef<string>('');
  const cwdRef = useRef<string>('~');
  const sysInfoRef = useRef<SystemInfo | null>(null);
  const executingRef = useRef<boolean>(false);
  const [mode, setMode] = useState<Mode>('connecting');

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
        black: '#000000', red: '#ff5555', green: '#00ff41', yellow: '#ffff55',
        blue: '#5555ff', magenta: '#ff55ff', cyan: '#55ffff', white: '#ffffff',
        brightBlack: '#666666', brightRed: '#ff8888', brightGreen: '#88ff88',
        brightYellow: '#ffff88', brightBlue: '#8888ff', brightMagenta: '#ff88ff',
        brightCyan: '#88ffff', brightWhite: '#ffffff',
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

    // Get system info and set up live mode
    fetchSystemInfo().then(async (info) => {
      if (info) {
        sysInfoRef.current = info;
        cwdRef.current = info.homeDir;
        modeRef.current = 'live';
        setMode('live');
        term.clear();
        const shortHost = info.hostname.split('-')[0].substring(0, 20);
        term.writeln(`\x1b[32m╔════════════════════════════════════════╗\x1b[0m`);
        term.writeln(`\x1b[32m║   🐉 KALI NEXUS — REAL SHELL           ║\x1b[0m`);
        term.writeln(`\x1b[32m╚════════════════════════════════════════╝\x1b[0m`);
        term.writeln('');
        term.writeln(`Host: \x1b[33m${info.hostname}\x1b[0m`);
        term.writeln(`User: \x1b[33m${info.username}\x1b[0m • Distro: \x1b[33m${info.distro}\x1b[0m`);
        term.writeln(`Cwd:  \x1b[33m${info.homeDir}\x1b[0m`);
        term.writeln(`\x1b[90m[Live mode — commands execute on real backend]\x1b[0m`);
        term.writeln('');
        updatePrompt(term);
      } else {
        modeRef.current = 'demo';
        setMode('demo');
        showDemoMode(term);
      }
    }).catch(() => {
      modeRef.current = 'demo';
      setMode('demo');
      showDemoMode(term);
    });

    const updatePrompt = (t: XTerm) => {
      const cwd = cwdRef.current === sysInfoRef.current?.homeDir ? '~' : cwdRef.current;
      const user = sysInfoRef.current?.username || 'root';
      const host = (sysInfoRef.current?.hostname || 'nexus').split('-')[0].substring(0, 15);
      t.write(`\x1b[32m${user}@${host}\x1b[0m:\x1b[34m${cwd}\x1b[0m# `);
    };

    // Input handler
    const onData = async (data: string) => {
      if (modeRef.current === 'demo') {
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
            updatePrompt(term);
          } else if (code >= 32 && code < 127) {
            term.write(ch);
            lineBufferRef.current += ch;
          }
        }
        return;
      }

      // Live mode — buffer input, execute on Enter
      if (executingRef.current) return; // Ignore input while executing

      for (const ch of data) {
        const code = ch.charCodeAt(0);
        if (code === 13) {
          const cmd = lineBufferRef.current;
          lineBufferRef.current = '';
          term.write('\r\n');

          if (!cmd.trim()) {
            updatePrompt(term);
            continue;
          }

          // Handle cd locally
          if (cmd.trim().startsWith('cd ')) {
            const newDir = cmd.trim().substring(3).trim();
            try {
              const basePath = cwdRef.current;
              const targetPath = newDir === '~' ? sysInfoRef.current?.homeDir || '/root' : new URL('file://' + newDir).pathname;
              // Simple cd - just update the ref
              if (newDir === '~' || newDir === '.') {
                // keep current
              } else if (newDir === '..') {
                // go up
              }
              cwdRef.current = newDir === '~' ? (sysInfoRef.current?.homeDir || '/root') : cwdRef.current;
            } catch (e) {}
            updatePrompt(term);
            continue;
          }

          if (cmd.trim() === 'clear' || cmd.trim() === 'cls') {
            term.clear();
            updatePrompt(term);
            continue;
          }

          if (cmd.trim() === 'exit' || cmd.trim() === 'logout') {
            term.writeln('\x1b[33m[Session ended]\x1b[0m');
            return;
          }

          // Execute command via HTTP API
          executingRef.current = true;
          try {
            const result = await executeCommand(cmd.trim(), cwdRef.current !== '~' ? cwdRef.current : undefined);
            if (result.stdout) term.write(result.stdout);
            if (result.stderr) term.write(`\x1b[31m${result.stderr}\x1b[0m`);
            if (!result.success && !result.stdout && !result.stderr) {
              term.writeln(`\x1b[31m[Command failed]\x1b[0m`);
            }
          } catch (e: any) {
            term.writeln(`\x1b[31m[Error: ${e.message}]\x1b[0m`);
          } finally {
            executingRef.current = false;
            updatePrompt(term);
          }
        } else if (code === 127 || code === 8) {
          if (lineBufferRef.current.length > 0) {
            term.write('\b \b');
            lineBufferRef.current = lineBufferRef.current.slice(0, -1);
          }
        } else if (code === 3) {
          term.write('^C');
          lineBufferRef.current = '';
          term.write('\r\n');
          updatePrompt(term);
        } else if (code >= 32 && code < 127) {
          term.write(ch);
          lineBufferRef.current += ch;
        }
      }
    };
    term.onData(onData);

    // Resize handling
    const handleResize = () => { try { fitAddon.fit(); } catch (e) {} };
    window.addEventListener('resize', handleResize);
    const resizeObserver = new ResizeObserver(() => { try { fitAddon.fit(); } catch (e) {} });
    resizeObserver.observe(containerRef.current);

    return () => {
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
      term.dispose();
    };
  }, []);

  const modeRef = useRef<Mode>('connecting');
  // Keep modeRef in sync
  useEffect(() => { modeRef.current = mode; }, [mode]);

  const reconnect = async () => {
    if (!termRef.current) return;
    setMode('connecting');
    modeRef.current = 'connecting';
    termRef.current.clear();
    termRef.current.writeln('\x1b[33m⏳ Reconnecting...\x1b[0m');
    const info = await fetchSystemInfo();
    if (info) {
      sysInfoRef.current = info;
      modeRef.current = 'live';
      setMode('live');
      termRef.current.clear();
      termRef.current.writeln(`\x1b[32m✓ Reconnected to ${info.hostname}\x1b[0m`);
      termRef.current.writeln('');
      const shortHost = info.hostname.split('-')[0].substring(0, 20);
      const user = info.username;
      const cwd = info.homeDir === '~' ? '~' : info.homeDir;
      termRef.current.write(`\x1b[32m${user}@${shortHost}\x1b[0m:\x1b[34m~\x1b[0m# `);
    } else {
      modeRef.current = 'demo';
      setMode('demo');
      showDemoMode(termRef.current);
    }
  };

  return (
    <div className="h-full flex flex-col bg-black">
      <div className="h-7 bg-[#1a1a1a] border-b border-[#00ff41]/20 flex items-center justify-between px-2 text-[10px]">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${
            mode === 'live' ? 'bg-green-500 animate-pulse' :
            mode === 'connecting' ? 'bg-yellow-500 animate-pulse' :
            'bg-orange-500'
          }`} />
          <span className="text-gray-300">
            {mode === 'live' ? '🟢 LIVE — real backend commands' :
             mode === 'connecting' ? '🟡 Connecting...' :
             '🟠 Demo Mode'}
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
