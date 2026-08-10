// ===============================================================
//  KALI NEXUS — Real Backend Server (Render Ready)
// ===============================================================
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { WebSocketServer } from 'ws';
import { spawn, exec } from 'child_process';
import http from 'http';
import os from 'os';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const execAsync = promisify(exec);

const app = express();
const PORT = process.env.PORT || 3001;

// ============== LOAD node-pty (OPTIONAL — falls back to spawn) ==============
let ptyModule = null;
try {
  ptyModule = await import('node-pty').then(m => m.default || m).catch(() => null);
  if (ptyModule) {
    const testPty = ptyModule.spawn('/bin/echo', ['pty_test'], { name: 'xterm-256color', cols: 80, rows: 24 });
    await new Promise((resolve) => {
      const timer = setTimeout(() => { try { testPty.kill(); } catch(e) {}; resolve(); }, 500);
      testPty.onExit(() => { clearTimeout(timer); resolve(); });
    });
    console.log('[PTY] node-pty loaded and verified ✓');
  } else {
    console.warn('[PTY] node-pty not installed — using spawn fallback');
  }
} catch (e) {
  ptyModule = null;
  console.warn('[PTY] node-pty not available — using spawn fallback. Reason:', e.message);
}

// ============== MIDDLEWARE ==============
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '5mb' }));

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, slow down.' },
});
app.use('/api/', limiter);

// ============== SECURITY: COMMAND FILTER ==============
const FORBIDDEN_PATTERNS = [
  /rm\s+-rf\s+\/(?!tmp)/,
  /rm\s+-rf\s+\/\*/,
  /mkfs/,
  /dd\s+if=.*of=\/dev\//,
  /:\s*\(\s*\)\s*\{/,
  /\bsync.*;\s*echo\s+3\s*>\s*\/proc\/sys\/vm\/drop_caches/,
  />\s*\/dev\/sd[a-z]/,
  />\s*\/dev\/nvme/,
  /shutdown/,
  /reboot/,
  /\binit\s+[06]\b/,
  /systemctl\s+(reboot|poweroff|halt)/,
  /halt\b/,
  /poweroff\b/,
  /\bkillall\s+-9\s+init\b/,
  /\bkill\s+-9\s+1\b/,
  /chmod\s+-R\s+000\s+\//,
  /chown\s+-R\s+.*\s+\/(?!tmp|home)/,
  /\/etc\/shadow/,
  /passwd\s+root/,
  /usermod.*-p.*root/,
  /\bcurl\s+.*\|\s*sh/,
  /\bwget\s+.*\|\s*sh/,
  /\bnpm\s+install\s+-g.*&&.*rm/,
];

const isCommandForbidden = (cmd) => {
  const normalized = cmd.replace(/\s+/g, ' ').trim();
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(normalized)) return true;
  }
  return false;
};

// ============== HEALTH ==============
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), platform: os.platform(), pty: ptyModule ? 'node-pty' : 'spawn-fallback' });
});

// ============== SYSTEM INFO ==============
app.get('/api/system', async (req, res) => {
  try {
    const platform = os.platform();
    const isLinux = platform === 'linux';
    const isMac = platform === 'darwin';
    const isWin = platform === 'win32';

    let distro = 'Unknown';
    if (isLinux) {
      try {
        const { stdout } = await execAsync('cat /etc/os-release 2>/dev/null | grep PRETTY_NAME | cut -d= -f2 | tr -d \'"\'');
        distro = stdout.trim() || 'Linux';
      } catch (e) { distro = 'Linux'; }
    } else if (isMac) distro = 'macOS';
    else if (isWin) distro = 'Windows';

    let kernel = os.release();
    try { const { stdout } = await execAsync('uname -r'); kernel = stdout.trim(); } catch (e) {}

    const interfaces = os.networkInterfaces();
    const ips = [];
    Object.keys(interfaces).forEach((ifname) => {
      interfaces[ifname].forEach((iface) => {
        if (iface.family === 'IPv4' && !iface.internal) ips.push({ interface: ifname, address: iface.address });
      });
    });

    let isRoot = false;
    try { const { stdout } = await execAsync('id -u'); isRoot = stdout.trim() === '0'; } catch (e) {}

    const tools = {};
    for (const tool of ['nmap', 'msfconsole', 'tshark', 'tcpdump', 'python3', 'curl', 'sqlmap', 'nikto', 'gobuster', 'hydra', 'john', 'hashcat']) {
      try { await execAsync(`which ${tool}`); tools[tool] = true; } catch { tools[tool] = false; }
    }

    res.json({
      platform, distro, arch: os.arch(), hostname: os.hostname(),
      username: os.userInfo().username, isRoot, kernel,
      uptime: os.uptime(), cpus: os.cpus().length,
      cpuModel: os.cpus()[0]?.model || 'Unknown',
      totalMem: os.totalmem(), freeMem: os.freemem(),
      ips, homeDir: os.homedir(), cwd: process.cwd(), tools,
    });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// ============== EXEC ==============
app.post('/api/exec', async (req, res) => {
  const { command, cwd } = req.body;
  if (!command) return res.status(400).json({ error: 'No command provided' });
  if (isCommandForbidden(command)) {
    return res.json({ success: false, stdout: '', stderr: '⛔ Command blocked by security filter', blocked: true });
  }
  try {
    const { stdout, stderr } = await execAsync(command, { cwd: cwd || os.homedir(), timeout: 30000, maxBuffer: 10 * 1024 * 1024 });
    res.json({ success: true, stdout, stderr, cwd: cwd || os.homedir() });
  } catch (error) {
    res.json({ success: false, stdout: error.stdout || '', stderr: error.stderr || error.message, code: error.code });
  }
});

// ============== FILESYSTEM ==============
app.post('/api/fs/list', async (req, res) => {
  const { path: dirPath } = req.body;
  const targetPath = dirPath || os.homedir();
  try {
    const items = await fs.promises.readdir(targetPath, { withFileTypes: true });
    const result = await Promise.all(items.map(async (item) => {
      const fullPath = path.join(targetPath, item.name);
      try {
        const stats = await fs.promises.stat(fullPath);
        return { name: item.name, isDirectory: item.isDirectory(), isFile: item.isFile(), size: stats.size, modified: stats.mtime, permissions: stats.mode.toString(8).slice(-3) };
      } catch (e) { return { name: item.name, isDirectory: item.isDirectory(), isFile: item.isFile(), size: 0, modified: new Date(), permissions: '000' }; }
    }));
    res.json({ success: true, path: targetPath, items: result });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

app.post('/api/fs/read', async (req, res) => {
  const { path: filePath } = req.body;
  if (!filePath) return res.status(400).json({ error: 'No path' });
  try {
    const content = await fs.promises.readFile(filePath, 'utf-8');
    const stats = await fs.promises.stat(filePath);
    res.json({ success: true, content, size: stats.size, modified: stats.mtime });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

app.post('/api/fs/write', async (req, res) => {
  const { path: filePath, content } = req.body;
  if (!filePath) return res.status(400).json({ error: 'No path' });
  try { await fs.promises.writeFile(filePath, content || ''); res.json({ success: true }); }
  catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

// ============== NMAP (auto-adds --unprivileged for container compatibility) ==============
app.post('/api/nmap', async (req, res) => {
  const { target, options = '-sV' } = req.body;
  if (!target) return res.status(400).json({ error: 'No target' });
  const safeTarget = target.replace(/[^a-zA-Z0-9.\-/:]/g, '');
  let safeOptions = options.replace(/[^a-zA-Z0-9\-\s]/g, '').trim();
  // Auto-add --unprivileged if not present (containers don't have CAP_NET_RAW)
  if (!safeOptions.includes('--unprivileged')) {
    safeOptions += ' --unprivileged';
  }
  const command = `nmap ${safeOptions} ${safeTarget}`;
  try {
    const { stdout, stderr } = await execAsync(command, { timeout: 60000 });
    res.json({ success: true, stdout, stderr, command });
  } catch (error) {
    // If nmap still fails (e.g., not installed), fall back to native scanner
    if ((error.stderr || '').includes('not found') || (error.message || '').includes('not found')) {
      return res.json({ success: false, stdout: '', stderr: 'nmap not installed. Using native scanner.', command, fallback: true });
    }
    res.json({ success: false, stdout: error.stdout || '', stderr: error.stderr || error.message, command });
  }
});

// ============== PING ==============
app.post('/api/ping', async (req, res) => {
  const { host, count = 4 } = req.body;
  if (!host) return res.status(400).json({ error: 'No host' });
  const safeHost = host.replace(/[^a-zA-Z0-9.\-]/g, '');
  const safeCount = Math.min(parseInt(count) || 4, 10);
  const isWin = os.platform() === 'win32';
  const command = isWin ? `ping -n ${safeCount} ${safeHost}` : `ping -c ${safeCount} ${safeHost}`;
  try {
    const { stdout, stderr } = await execAsync(command, { timeout: 30000 });
    res.json({ success: true, stdout, stderr, command });
  } catch (error) { res.json({ success: false, stdout: error.stdout || '', stderr: error.stderr || error.message, command }); }
});

// ============== PROCESSES / ENV / WHICH ==============
app.get('/api/processes', async (req, res) => {
  try {
    const isWin = os.platform() === 'win32';
    const command = isWin ? 'tasklist' : 'ps aux --sort=-%cpu | head -20';
    const { stdout } = await execAsync(command, { timeout: 5000 });
    res.json({ success: true, output: stdout });
  } catch (error) { res.json({ success: false, error: error.message }); }
});

app.get('/api/env', (req, res) => {
  res.json({ shell: process.env.SHELL || (os.platform() === 'win32' ? 'cmd.exe' : '/bin/bash'), nodeVersion: process.version });
});

app.post('/api/which', async (req, res) => {
  const { tool } = req.body;
  if (!tool) return res.status(400).json({ error: 'No tool' });
  const safeTool = tool.replace(/[^a-zA-Z0-9_\-]/g, '');
  try { const { stdout } = await execAsync(`which ${safeTool} || command -v ${safeTool}`); res.json({ success: true, path: stdout.trim() }); }
  catch (error) { res.json({ success: false, path: null, error: 'Not found' }); }
});

// ============== NATIVE PORT SCANNER (fallback when nmap missing) ==============
import net from 'net';
import dns from 'dns/promises';

const COMMON_PORTS = [
  { port: 21, service: 'ftp' }, { port: 22, service: 'ssh' }, { port: 23, service: 'telnet' },
  { port: 25, service: 'smtp' }, { port: 53, service: 'dns' }, { port: 80, service: 'http' },
  { port: 110, service: 'pop3' }, { port: 143, service: 'imap' }, { port: 443, service: 'https' },
  { port: 445, service: 'smb' }, { port: 3306, service: 'mysql' }, { port: 3389, service: 'rdp' },
  { port: 5432, service: 'postgresql' }, { port: 6379, service: 'redis' }, { port: 8080, service: 'http-proxy' },
  { port: 8443, service: 'https-alt' }, { port: 27017, service: 'mongodb' },
];

app.post('/api/scan', async (req, res) => {
  const { target, ports } = req.body;
  if (!target) return res.status(400).json({ error: 'No target' });
  const safeTarget = target.replace(/[^a-zA-Z0-9.\-:]/g, '');

  // Resolve hostname to IP
  let ip = safeTarget;
  try {
    if (!/^[\d.]+$/.test(safeTarget)) {
      const records = await dns.resolve4(safeTarget);
      ip = records[0];
    }
  } catch (e) {
    return res.json({ success: false, error: `Cannot resolve ${safeTarget}`, ip: null });
  }

  // Determine ports to scan
  let portList = COMMON_PORTS;
  if (ports && Array.isArray(ports) && ports.length > 0) {
    portList = ports.filter(p => typeof p === 'number' && p > 0 && p < 65536).map(p => ({ port: p, service: 'unknown' }));
  } else if (typeof ports === 'string' && ports.trim()) {
    // Parse "80,443,8080-8085"
    const parsed = [];
    for (const part of ports.split(',')) {
      const trimmed = part.trim();
      if (trimmed.includes('-')) {
        const [start, end] = trimmed.split('-').map(n => parseInt(n));
        for (let i = start; i <= end && i <= 65535; i++) parsed.push({ port: i, service: 'unknown' });
      } else {
        const p = parseInt(trimmed);
        if (p > 0 && p < 65536) {
          const known = COMMON_PORTS.find(c => c.port === p);
          parsed.push({ port: p, service: known?.service || 'unknown' });
        }
      }
    }
    if (parsed.length > 0) portList = parsed;
  }

  // Scan ports (concurrent, max 20 at a time)
  const scanPort = (host, port) => new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(2000);
    let done = false;
    const finish = (state) => {
      if (done) return;
      done = true;
      socket.destroy();
      resolve({ port, state });
    };
    socket.on('connect', () => finish('open'));
    socket.on('timeout', () => finish('filtered'));
    socket.on('error', (err) => {
      if (err.code === 'ECONNREFUSED') finish('closed');
      else finish('filtered');
    });
    socket.connect(port, host);
  });

  const results = [];
  const batchSize = 20;
  for (let i = 0; i < portList.length; i += batchSize) {
    const batch = portList.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(p => scanPort(ip, p.port)));
    results.push(...batchResults);
  }

  const openPorts = results.filter(r => r.state === 'open').map(r => ({
    port: r.port,
    state: r.state,
    service: COMMON_PORTS.find(c => c.port === r.port)?.service || 'unknown',
  }));

  res.json({
    success: true,
    target: safeTarget,
    ip,
    scanned: results.length,
    open: openPorts.length,
    ports: results,
    openPorts,
  });
});

// ============== NATIVE PING (fallback when ping binary missing) ==============
app.post('/api/ping-native', async (req, res) => {
  const { host } = req.body;
  if (!host) return res.status(400).json({ error: 'No host' });
  const safeHost = host.replace(/[^a-zA-Z0-9.\-:]/g, '');

  const startTime = Date.now();
  let ip = safeHost;
  let resolved = false;

  // Resolve DNS
  try {
    if (!/^[\d.]+$/.test(safeHost)) {
      const records = await dns.resolve4(safeHost);
      ip = records[0];
      resolved = true;
    } else {
      resolved = true;
    }
  } catch (e) {
    return res.json({ success: false, host: safeHost, error: `DNS resolution failed: ${e.message}` });
  }

  // TCP "ping" — try connecting to common ports
  const probePorts = [80, 443, 22, 8080];
  let pingable = false;
  let latency = 0;

  for (const port of probePorts) {
    const t0 = Date.now();
    const reachable = await new Promise((resolve) => {
      const socket = new net.Socket();
      socket.setTimeout(3000);
      let done = false;
      const finish = (result) => { if (!done) { done = true; socket.destroy(); resolve(result); } };
      socket.on('connect', () => finish(true));
      socket.on('timeout', () => finish(false));
      socket.on('error', () => finish(false));
      socket.connect(port, ip);
    });
    if (reachable) {
      pingable = true;
      latency = Date.now() - t0;
      break;
    }
  }

  res.json({
    success: pingable,
    host: safeHost,
    ip,
    resolved: resolved ? `yes (${ip})` : 'no',
    pingable,
    latency_ms: latency,
    method: 'tcp-probe',
    note: pingable ? 'Host is up (TCP probe succeeded)' : 'Host appears down or filtered (no response on common ports)',
    timestamp: new Date().toISOString(),
  });
});

// ============== HTTP SERVER (created BEFORE WS servers) ==============
const server = http.createServer(app);

// ============== WEBSOCKET: REAL TERMINAL ==============
const wssTerminal = new WebSocketServer({ server, path: '/terminal', perMessageDeflate: false });

wssTerminal.on('connection', (ws) => {
  console.log('[Terminal] Client connected');
  const isWin = os.platform() === 'win32';
  const shell = isWin ? 'powershell.exe' : (process.env.SHELL || '/bin/bash' || 'sh');

  let ptyProcess = null;
  let spawnProcess = null;
  let alive = true;
  let heartbeatInterval = null;

  const send = (data) => {
    try { if (alive) ws.send(typeof data === 'string' ? data : data.toString(), { binary: false }); } catch (e) {}
  };

  // Heartbeat: send ping every 25s to keep connection alive (Render proxy kills idle after ~30s)
  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });

  heartbeatInterval = setInterval(() => {
    if (!alive) return;
    if (ws.isAlive === false) {
      console.log('[Terminal] Heartbeat timeout, terminating connection');
      try { ws.terminate(); } catch (e) {}
      return;
    }
    ws.isAlive = false;
    try { ws.ping(); } catch (e) {}
  }, 25000);

  const welcome = `\r\n\x1b[32m╔════════════════════════════════════════╗\r\n║   🐉 KALI NEXUS — REAL SHELL           ║\r\n╚════════════════════════════════════════╝\x1b[0m\r\n` +
    `\r\nHost: ${os.hostname()} • ${os.platform()} ${os.release()}\r\n` +
    `User: ${os.userInfo().username} • Shell: ${shell}\r\n` +
    `Cwd:  ${os.homedir()}\r\n\r\n`;

  const cleanup = () => {
    alive = false;
    if (heartbeatInterval) { clearInterval(heartbeatInterval); heartbeatInterval = null; }
    try { ptyProcess && ptyProcess.kill(); } catch (e) {}
    try { spawnProcess && spawnProcess.kill(); } catch (e) {}
  };

  // Command executor mode: receive commands via WebSocket, execute via exec
  // More reliable than interactive shell in Docker containers
  let currentCwd = os.homedir();
  const username = os.userInfo().username;
  const hostname = os.hostname();
  const shortHost = hostname.split('-')[0];

  send(welcome + `\x1b[90m[Real Shell — commands execute on backend]\x1b[0m\r\n`);
  send(`\r\n\x1b[32m${username}@${shortHost}\x1b[0m:\x1b[34m~\x1b[0m# `);

  let commandBuffer = '';

  ws.on('message', async (msg) => {
    try {
      const text = msg.toString();
      if (text === '__heartbeat__') return;
      if (text.startsWith('\x1b[__resize__')) return;

      // Process each character
      for (const ch of text) {
        const code = ch.charCodeAt(0);
        if (code === 13 || code === 10) {
          // Enter — execute command
          const cmd = commandBuffer.trim();
          commandBuffer = '';
          if (!cmd) {
            send(`\r\n\x1b[32m${username}@${shortHost}\x1b[0m:\x1b[34m${currentCwd === os.homedir() ? '~' : currentCwd}\x1b[0m# `);
            continue;
          }

          // Handle cd specially
          if (cmd.startsWith('cd ')) {
            const newDir = cmd.substring(3).trim();
            try {
              const targetPath = newDir === '~' ? os.homedir() : path.resolve(currentCwd, newDir);
              process.chdir(targetPath);
              currentCwd = targetPath;
            } catch (e) {
              send(`\r\nbash: cd: ${newDir}: No such file or directory\r\n`);
            }
            send(`\r\n\x1b[32m${username}@${shortHost}\x1b[0m:\x1b[34m${currentCwd === os.homedir() ? '~' : currentCwd}\x1b[0m# `);
            continue;
          }

          // Handle clear
          if (cmd === 'clear' || cmd === 'cls') {
            send('\x1b[2J\x1b[H');
            send(`\x1b[32m${username}@${shortHost}\x1b[0m:\x1b[34m${currentCwd === os.homedir() ? '~' : currentCwd}\x1b[0m# `);
            continue;
          }

          // Handle exit
          if (cmd === 'exit' || cmd === 'logout') {
            send('\r\n\x1b[33m[Session ended]\x1b[0m\r\n');
            ws.close();
            return;
          }

          // Execute command
          try {
            const { stdout, stderr } = await execAsync(cmd, {
              cwd: currentCwd,
              timeout: 30000,
              maxBuffer: 10 * 1024 * 1024,
              env: { ...process.env, TERM: 'xterm-256color' },
            });
            if (stdout) send(stdout);
            if (stderr) send(`\x1b[31m${stderr}\x1b[0m`);
          } catch (error) {
            if (error.stdout) send(error.stdout);
            if (error.stderr) send(`\x1b[31m${error.stderr}\x1b[0m`);
            else if (error.message) send(`\x1b[31m${error.message}\x1b[0m\r\n`);
          }

          send(`\r\n\x1b[32m${username}@${shortHost}\x1b[0m:\x1b[34m${currentCwd === os.homedir() ? '~' : currentCwd}\x1b[0m# `);
        } else if (code === 3) {
          // Ctrl+C
          send('^C\r\n');
          commandBuffer = '';
          send(`\x1b[32m${username}@${shortHost}\x1b[0m:\x1b[34m${currentCwd === os.homedir() ? '~' : currentCwd}\x1b[0m# `);
        } else if (code === 127 || code === 8) {
          // Backspace
          if (commandBuffer.length > 0) {
            send('\b \b');
            commandBuffer = commandBuffer.slice(0, -1);
          }
        } else if (code >= 32 && code < 127) {
          // Printable character
          send(ch);
          commandBuffer += ch;
        }
      }
    } catch (e) {
      console.error('[Terminal] Message error:', e.message);
    }
  });

  ws.on('close', () => { console.log('[Terminal] Client disconnected'); cleanup(); });
  ws.on('error', () => { cleanup(); });
});

// ============== WEBSOCKET: METASPLOIT CONSOLE ==============
const wssMsf = new WebSocketServer({ server, path: '/metasploit', perMessageDeflate: false });

wssMsf.on('connection', (ws) => {
  console.log('[Metasploit] Client connected');
  let alive = true;
  const send = (data) => { try { if (alive) ws.send(typeof data === 'string' ? data : data.toString(), { binary: false }); } catch (e) {} };

  send('\x1b[33m[*] Launching Metasploit Framework Console...\x1b[0m\r\n');
  send('\x1b[90m[if msfconsole is not installed, install with: apt install metasploit-framework]\x1b[0m\r\n\r\n');

  let msfProcess = null;
  try {
    msfProcess = spawn('msfconsole', ['-q'], {
      env: { ...process.env, TERM: 'xterm-256color' },
      cwd: os.homedir(), stdio: ['pipe', 'pipe', 'pipe'],
    });
    msfProcess.stdout.on('data', (data) => send(data.toString()));
    msfProcess.stderr.on('data', (data) => send(data.toString()));
    ws.on('message', (msg) => { try { msfProcess.stdin.write(msg.toString()); } catch (e) {} });
    ws.on('close', () => {
      alive = false;
      try { msfProcess && msfProcess.kill('SIGINT'); } catch (e) {}
      setTimeout(() => { try { msfProcess && msfProcess.kill(); } catch (e) {} }, 500);
      console.log('[Metasploit] Client disconnected');
    });
    msfProcess.on('exit', (code) => {
      send(`\r\n\x1b[33m[*] Metasploit exited with code ${code}\x1b[0m\r\n`);
      send(`\x1b[90m[If not installed: apt install metasploit-framework]\x1b[0m\r\n`);
      try { if (alive) ws.close(); } catch (e) {}
    });
    msfProcess.on('error', (err) => {
      send(`\r\n\x1b[31m[!] msfconsole not found: ${err.message}\x1b[0m\r\n`);
      send(`\x1b[90m[Install: apt install metasploit-framework]\x1b[0m\r\n`);
    });
  } catch (e) {
    send(`\x1b[31m[!] Failed to start msfconsole: ${e.message}\x1b[0m\r\n`);
  }
});

// ============== WEBSOCKET: WIRESHARK (tshark) ==============
const wssShark = new WebSocketServer({ server, path: '/wireshark', perMessageDeflate: false });

wssShark.on('connection', (ws) => {
  console.log('[Wireshark] Client connected');
  let alive = true;
  let captureProcess = null;
  let packetCount = 0;
  const send = (data) => { try { if (alive) ws.send(typeof data === 'string' ? data : data.toString(), { binary: false }); } catch (e) {} };

  // Parse tcpdump output line into structured packet data
  const parseTcpdumpLine = (line) => {
    // Example: "10:30:45.123456 IP 192.168.1.1.443 > 192.168.1.2.54321: Flags [S], seq 0, win 64240, length 0"
    const match = line.match(/^(\d+:\d+:\d+\.\d+)\s+IP\s+(\S+)\s+>\s+(\S+):\s+(.*)$/);
    if (!match) return null;
    const [, time, srcFull, dstFull, info] = match;
    const src = srcFull.replace(/\.\d+$/, ''); // strip port
    const dst = dstFull.replace(/\.\d+$/, '');
    let proto = 'IP';
    if (info.includes('Flags [S]')) proto = 'TCP';
    else if (info.includes('UDP')) proto = 'UDP';
    else if (info.includes('ICMP')) proto = 'ICMP';
    else if (srcFull.includes('.53') || dstFull.includes('.53')) proto = 'DNS';
    else if (srcFull.includes('.80') || dstFull.includes('.80')) proto = 'HTTP';
    else if (srcFull.includes('.443') || dstFull.includes('.443')) proto = 'HTTPS';
    else if (info.includes('ARP')) proto = 'ARP';
    const lenMatch = info.match(/length\s+(\d+)/);
    const len = lenMatch ? lenMatch[1] : '0';
    return { time, src, dst, proto, len, info: info.substring(0, 100) };
  };

  const startCapture = (iface = 'any', filter = '') => {
    send(JSON.stringify({ type: 'status', text: `Starting capture on ${iface}...` }) + '\n');
    // Use tcpdump with line-buffered output (-l), no name resolution (-n), no timestamps conversion (-tt)
    // -i: interface, -q: quiet (one line per packet), -s 0: full capture
    const args = ['-l', '-n', '-q', '-tt'];
    if (iface && iface !== 'any') {
      args.push('-i', iface);
    }
    if (filter) args.push(filter);

    try {
      captureProcess = spawn('tcpdump', args, { env: process.env, stdio: ['pipe', 'pipe', 'pipe'] });
      send(JSON.stringify({ type: 'status', text: 'Capture started (tcpdump live)' }) + '\n');

      captureProcess.stdout.on('data', (data) => {
        const lines = data.toString().split('\n').filter(l => l.trim());
        for (const line of lines) {
          packetCount++;
          const parsed = parseTcpdumpLine(line);
          if (parsed) {
            send(JSON.stringify({
              type: 'packet',
              no: String(packetCount),
              time: parsed.time,
              src: parsed.src,
              dst: parsed.dst,
              proto: parsed.proto,
              len: parsed.len,
              info: parsed.info,
            }) + '\n');
          }
        }
      });
      captureProcess.stderr.on('data', (data) => {
        const text = data.toString();
        // tcpdump prints "listening on..." and "X packets captured" to stderr
        if (text.includes('listening')) {
          send(JSON.stringify({ type: 'status', text: text.trim() }) + '\n');
        } else if (text.includes('packets captured') || text.includes('packets received')) {
          send(JSON.stringify({ type: 'status', text: text.trim() }) + '\n');
        } else {
          send(JSON.stringify({ type: 'stderr', text }) + '\n');
        }
      });
      captureProcess.on('exit', (code) => send(JSON.stringify({ type: 'exit', code }) + '\n'));
      captureProcess.on('error', (err) => {
        send(JSON.stringify({ type: 'error', text: `tcpdump error: ${err.message}` }) + '\n');
        // Fallback: try tshark
        send(JSON.stringify({ type: 'status', text: 'Trying tshark fallback...' }) + '\n');
        startTshark(iface, filter);
      });
    } catch (e) {
      send(JSON.stringify({ type: 'error', text: e.message }) + '\n');
    }
  };

  const startTshark = (iface, filter) => {
    const args = ['-l', '-i', iface || 'any', '-T', 'fields',
      '-e', 'frame.number', '-e', 'frame.time_relative',
      '-e', 'ip.src', '-e', 'ip.dst', '-e', '_ws.col.Protocol',
      '-e', 'frame.len', '-e', '_ws.col.Info'];
    if (filter) args.push('-f', filter);
    try {
      captureProcess = spawn('tshark', args, { env: process.env, stdio: ['pipe', 'pipe', 'pipe'] });
      captureProcess.stdout.on('data', (data) => {
        const lines = data.toString().split('\n').filter(l => l.trim());
        for (const line of lines) {
          packetCount++;
          const fields = line.split('\t');
          send(JSON.stringify({
            type: 'packet', no: String(packetCount), time: fields[1] || '',
            src: fields[2] || '', dst: fields[3] || '', proto: fields[4] || '',
            len: fields[5] || '', info: fields[6] || '',
          }) + '\n');
        }
      });
      captureProcess.stderr.on('data', (data) => send(JSON.stringify({ type: 'stderr', text: data.toString() }) + '\n'));
      captureProcess.on('exit', (code) => send(JSON.stringify({ type: 'exit', code }) + '\n'));
      captureProcess.on('error', () => {
        send(JSON.stringify({ type: 'error', text: 'Neither tcpdump nor tshark available. Using demo mode.' }) + '\n');
        send(JSON.stringify({ type: 'demo' }) + '\n');
      });
    } catch (e) { send(JSON.stringify({ type: 'error', text: e.message }) + '\n'); }
  };

  ws.on('message', (msg) => {
    try {
      const data = JSON.parse(msg.toString());
      if (data.type === 'start') { packetCount = 0; startCapture(data.iface || 'any', data.filter || ''); }
      else if (data.type === 'stop') { try { captureProcess && captureProcess.kill('SIGINT'); } catch (e) {} }
    } catch (e) {}
  });

  ws.on('close', () => {
    alive = false;
    try { captureProcess && captureProcess.kill('SIGINT'); } catch (e) {}
    setTimeout(() => { try { captureProcess && captureProcess.kill(); } catch (e) {} }, 300);
    console.log('[Wireshark] Client disconnected');
  });
});

// ============== SERVE FRONTEND (after WS servers attached) ==============
const distPath = path.join(__dirname, '../dist');
console.log(`[Server] Checking dist at: ${distPath} — exists: ${fs.existsSync(distPath)}`);
if (fs.existsSync(distPath)) {
  console.log(`[Server] Serving frontend from ${distPath}`);
  // Serve static files with explicit index
  app.use(express.static(distPath, {
    index: 'index.html',
    extensions: ['html', 'json', 'js'],
  }));

  // Explicit route for root
  app.get('/', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });

  // SPA fallback — only for non-WS, non-API routes
  app.use((req, res, next) => {
    // Skip WS upgrade requests
    if (req.headers.upgrade === 'websocket') return next();
    if (req.path.startsWith('/api') || req.path.startsWith('/terminal') || req.path.startsWith('/metasploit') || req.path.startsWith('/wireshark') || req.path.startsWith('/health')) {
      return res.status(404).json({ error: 'Not found' });
    }
    // For any GET request, serve index.html (SPA routing)
    if (req.method === 'GET') {
      return res.sendFile(path.join(distPath, 'index.html'));
    }
    next();
  });
} else {
  console.log('[Server] No dist folder — API only mode (dev)');
  app.get('/', (req, res) => res.json({ message: 'Kali Nexus Backend (dev)', docs: '/api/system', health: '/health' }));
}

// ============== START SERVER ==============
server.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔════════════════════════════════════════════╗
║   KALI NEXUS BACKEND • ACTIVE             ║
╠════════════════════════════════════════════╣
║  Port:        ${String(PORT).padEnd(28)} ║
║  PTY:         ${ptyModule ? 'node-pty (real shell)'.padEnd(28) : 'spawn-fallback'.padEnd(28)} ║
║  WS:          /terminal  /metasploit      ║
║               /wireshark                  ║
║  Platform:    ${os.platform().padEnd(28)} ║
║  Home:        ${(os.homedir() || '/').padEnd(28)} ║
║  Dist:        ${fs.existsSync(distPath) ? 'FOUND'.padEnd(28) : 'NOT FOUND (dev mode)'.padEnd(28)} ║
╚════════════════════════════════════════════╝
  `);
});

// ============== GRACEFUL SHUTDOWN ==============
process.on('SIGTERM', () => { console.log('[Server] SIGTERM received'); server.close(() => process.exit(0)); });
process.on('SIGINT', () => { console.log('[Server] SIGINT received'); server.close(() => process.exit(0)); });
