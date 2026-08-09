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

// ============== NMAP ==============
app.post('/api/nmap', async (req, res) => {
  const { target, options = '-sV' } = req.body;
  if (!target) return res.status(400).json({ error: 'No target' });
  const safeTarget = target.replace(/[^a-zA-Z0-9.\-/:]/g, '');
  const safeOptions = options.replace(/[^a-zA-Z0-9\-\s]/g, '');
  const command = `nmap ${safeOptions} ${safeTarget}`;
  try {
    const { stdout, stderr } = await execAsync(command, { timeout: 60000 });
    res.json({ success: true, stdout, stderr, command });
  } catch (error) { res.json({ success: false, stdout: error.stdout || '', stderr: error.stderr || 'nmap not found.', command }); }
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

  const send = (data) => {
    try { if (alive) ws.send(typeof data === 'string' ? data : data.toString(), { binary: false }); } catch (e) {}
  };

  const welcome = `\r\n\x1b[32m╔════════════════════════════════════════╗\r\n║   🐉 KALI NEXUS — REAL SHELL           ║\r\n╚════════════════════════════════════════╝\x1b[0m\r\n` +
    `\r\nHost: ${os.hostname()} • ${os.platform()} ${os.release()}\r\n` +
    `User: ${os.userInfo().username} • Shell: ${shell}\r\n` +
    `Cwd:  ${os.homedir()}\r\n\r\n`;

  if (ptyModule) {
    try {
      ptyProcess = ptyModule.spawn(shell, [], {
        name: 'xterm-256color', cols: 80, rows: 24, cwd: os.homedir(),
        env: { ...process.env, TERM: 'xterm-256color', COLORTERM: 'truecolor' },
      });
      send(welcome + `\x1b[90m[PTY mode — vim, top, htop, nano all work]\x1b[0m\r\n`);
      ptyProcess.onData((data) => send(data));
      ws.on('message', (msg) => {
        try {
          const text = msg.toString();
          if (text.startsWith('\x1b[__resize__')) {
            const m = text.match(/cols=(\d+);rows=(\d+)/);
            if (m && ptyProcess) { try { ptyProcess.resize(parseInt(m[1]), parseInt(m[2])); } catch (e) {} }
            return;
          }
          ptyProcess.write(text);
        } catch (e) {}
      });
      ws.on('close', () => { alive = false; try { ptyProcess && ptyProcess.kill(); } catch (e) {} console.log('[Terminal] Client disconnected (pty)'); });
      ptyProcess.onExit(({ exitCode }) => { try { if (alive) ws.close(); } catch (e) {} console.log(`[Terminal] PTY exited with code ${exitCode}`); });
      return;
    } catch (e) { console.error('[PTY] Failed to spawn, falling back:', e.message); }
  }

  // ============ FALLBACK: child_process spawn ============
  send(welcome + `\x1b[33m[spawn fallback mode — basic interactive shell]\x1b[0m\r\n`);
  send(`\x1b[90m[vim/top may not work in fallback mode]\x1b[0m\r\n\r\n`);
  try {
    spawnProcess = spawn(shell, ['-i'], {
      env: { ...process.env, TERM: 'xterm-256color', COLORTERM: 'truecolor', PS1: '\\u@\\h:\\w# ' },
      cwd: os.homedir(), stdio: ['pipe', 'pipe', 'pipe'],
    });
    spawnProcess.stdout.on('data', (data) => send(data.toString()));
    spawnProcess.stderr.on('data', (data) => send(data.toString()));
    ws.on('message', (msg) => { try { spawnProcess.stdin.write(msg.toString()); } catch (e) {} });
    ws.on('close', () => { alive = false; try { spawnProcess && spawnProcess.kill(); } catch (e) {} console.log('[Terminal] Client disconnected (spawn)'); });
    spawnProcess.on('exit', () => { try { if (alive) ws.close(); } catch (e) {} });
    spawnProcess.on('error', (err) => { send(`\r\n\x1b[31m[shell error: ${err.message}]\x1b[0m\r\n`); });
  } catch (e) { send(`\r\n\x1b[31m[Failed to start shell: ${e.message}]\x1b[0m\r\n`); }
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
  let tsharkProcess = null;
  const send = (data) => { try { if (alive) ws.send(typeof data === 'string' ? data : data.toString(), { binary: false }); } catch (e) {} };

  const startCapture = (iface = 'any', filter = '') => {
    send(`\x1b[33m[*] Starting tshark on ${iface}${filter ? ' filter: ' + filter : ''}\x1b[0m\r\n`);
    const args = ['-l', '-i', iface, '-T', 'fields',
      '-e', 'frame.number', '-e', 'frame.time_relative',
      '-e', 'ip.src', '-e', 'ip.dst', '-e', '_ws.col.Protocol',
      '-e', 'frame.len', '-e', '_ws.col.Info'];
    if (filter) args.push('-f', filter);
    try {
      tsharkProcess = spawn('tshark', args, { env: process.env, stdio: ['pipe', 'pipe', 'pipe'] });
      tsharkProcess.stdout.on('data', (data) => {
        const lines = data.toString().split('\n').filter(l => l.trim());
        for (const line of lines) {
          const fields = line.split('\t');
          send(JSON.stringify({
            type: 'packet', no: fields[0] || '', time: fields[1] || '',
            src: fields[2] || '', dst: fields[3] || '', proto: fields[4] || '',
            len: fields[5] || '', info: fields[6] || '',
          }) + '\n');
        }
      });
      tsharkProcess.stderr.on('data', (data) => send(JSON.stringify({ type: 'stderr', text: data.toString() }) + '\n'));
      tsharkProcess.on('exit', (code) => send(JSON.stringify({ type: 'exit', code }) + '\n'));
      tsharkProcess.on('error', (err) => send(JSON.stringify({ type: 'error', text: err.message }) + '\n'));
    } catch (e) { send(JSON.stringify({ type: 'error', text: e.message }) + '\n'); }
  };

  ws.on('message', (msg) => {
    try {
      const data = JSON.parse(msg.toString());
      if (data.type === 'start') startCapture(data.iface || 'any', data.filter || '');
      else if (data.type === 'stop') { try { tsharkProcess && tsharkProcess.kill('SIGINT'); } catch (e) {} }
    } catch (e) {}
  });

  ws.on('close', () => {
    alive = false;
    try { tsharkProcess && tsharkProcess.kill('SIGINT'); } catch (e) {}
    setTimeout(() => { try { tsharkProcess && tsharkProcess.kill(); } catch (e) {} }, 300);
    console.log('[Wireshark] Client disconnected');
  });
});

// ============== SERVE FRONTEND (after WS servers attached) ==============
const distPath = path.join(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  console.log(`[Server] Serving frontend from ${distPath}`);
  app.use(express.static(distPath));
  // SPA fallback — only for non-WS, non-API routes
  app.use((req, res, next) => {
    // Skip WS upgrade requests
    if (req.headers.upgrade === 'websocket') return next();
    if (req.path.startsWith('/api') || req.path.startsWith('/terminal') || req.path.startsWith('/metasploit') || req.path.startsWith('/wireshark') || req.path.startsWith('/health')) {
      return res.status(404).json({ error: 'Not found' });
    }
    if (req.method === 'GET' && req.accepts('html')) {
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
