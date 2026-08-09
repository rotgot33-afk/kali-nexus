// ===============================================================
//  Kali Nexus — API client with real backend + demo fallback
// ===============================================================

const getApiBase = () => {
  if (typeof window === 'undefined') return '';
  const hostname = window.location.hostname;
  // Local dev -> backend on :3001
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `${window.location.protocol}//${hostname}:3001`;
  }
  // Production -> same origin
  return '';
};

const API_BASE = getApiBase();
const getWsBase = () => {
  if (API_BASE === '') {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${proto}//${window.location.host}`;
  }
  return API_BASE.replace(/^http/, 'ws');
};
const WS_BASE = typeof window !== 'undefined' ? getWsBase() : '';

export interface SystemInfo {
  platform: string;
  distro: string;
  arch: string;
  hostname: string;
  username: string;
  isRoot: boolean;
  kernel: string;
  uptime: number;
  cpus: number;
  cpuModel: string;
  totalMem: number;
  freeMem: number;
  ips: { interface: string; address: string }[];
  homeDir: string;
  cwd: string;
  tools?: Record<string, boolean>;
}

export interface ExecResult {
  success: boolean;
  stdout: string;
  stderr: string;
  cwd?: string;
  code?: number;
  demoMode?: boolean;
  blocked?: boolean;
}

export interface FileItem {
  name: string;
  isDirectory: boolean;
  isFile: boolean;
  size: number;
  modified: string;
  permissions: string;
}

let backendAvailable: boolean | null = null;

export async function isBackendAvailable(): Promise<boolean> {
  if (backendAvailable !== null) return backendAvailable;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`${API_BASE}/api/system`, { signal: controller.signal });
    clearTimeout(timeout);
    backendAvailable = res.ok;
    return backendAvailable;
  } catch (e) {
    backendAvailable = false;
    return false;
  }
}

export async function fetchSystemInfo(): Promise<SystemInfo | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`${API_BASE}/api/system`, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    return null;
  }
}

function demoExec(command: string): ExecResult {
  const cmd = command.trim();
  const parts = cmd.split(/\s+/);
  const main = parts[0]?.toLowerCase() || '';
  switch (main) {
    case 'help':
      return {
        success: true,
        stdout: `Available commands (Demo Mode):
  help, whoami, pwd, ls, uname, date, hostname, uptime
  ifconfig, ip, ps, df, free, env, history
  clear, exit

⚠️  Backend not connected. Deploy on Render for real execution.`,
        stderr: '',
        demoMode: true,
      };
    case 'whoami': return { success: true, stdout: 'root', stderr: '', demoMode: true };
    case 'pwd': return { success: true, stdout: '/root', stderr: '', demoMode: true };
    case 'ls':
      return {
        success: true,
        stdout: `Desktop  Documents  Downloads  Music  Pictures  Videos\nexploit.sh  notes.md  passwords.txt  targets.txt`,
        stderr: '',
        demoMode: true,
      };
    case 'uname':
      return {
        success: true,
        stdout: 'Linux kali 6.6.9-amd64 #1 SMP PREEMPT_DYNAMIC Kali 6.6.9-1kali1 x86_64 GNU/Linux',
        stderr: '',
        demoMode: true,
      };
    case 'date': return { success: true, stdout: new Date().toString(), stderr: '', demoMode: true };
    case 'hostname': return { success: true, stdout: 'kali', stderr: '', demoMode: true };
    case 'uptime': return { success: true, stdout: ' 10:42:34 up 3 days,  2:14,  1 user,  load average: 0.08, 0.12, 0.09', stderr: '', demoMode: true };
    case 'ifconfig':
      return {
        success: true,
        stdout: `eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        inet 192.168.1.105  netmask 255.255.255.0  broadcast 192.168.1.255
        ether 08:00:27:4e:12:34  txqueuelen 1000  (Ethernet)
lo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536
        inet 127.0.0.1  netmask 255.0.0.0`,
        stderr: '',
        demoMode: true,
      };
    case 'ps':
      return {
        success: true,
        stdout: `  PID TTY          TIME CMD
    1 ?        00:00:01 systemd
  234 ?        00:00:00 sshd
  567 ?        00:00:00 NetworkManager
  789 ?        00:00:00 gnome-shell
 1024 ?        00:00:00 xterm
 1234 ?        00:00:00 bash`,
        stderr: '',
        demoMode: true,
      };
    case 'df':
      return {
        success: true,
        stdout: `Filesystem      Size  Used Avail Use% Mounted on
/dev/sda1        50G   12G   35G  26% /
tmpfs           2.0G     0  2.0G   0% /tmp`,
        stderr: '',
        demoMode: true,
      };
    case 'free':
      return {
        success: true,
        stdout: `              total        used        free      shared  buff/cache   available
Mem:        8042032     2345678     3456789      234567     2239565     5234567`,
        stderr: '',
        demoMode: true,
      };
    case 'env':
      return {
        success: true,
        stdout: `USER=root\nHOME=/root\nSHELL=/bin/bash\nPATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin\nTERM=xterm-256color`,
        stderr: '',
        demoMode: true,
      };
    case 'echo': return { success: true, stdout: parts.slice(1).join(' '), stderr: '', demoMode: true };
    default:
      return {
        success: false,
        stdout: '',
        stderr: `[Demo Mode] '${main}' not simulated. Deploy backend for real execution.`,
        demoMode: true,
      };
  }
}

export async function executeCommand(command: string, cwd?: string): Promise<ExecResult> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    const res = await fetch(`${API_BASE}/api/exec`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command, cwd }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (res.ok) {
      backendAvailable = true;
      return await res.json();
    }
  } catch (e) {}
  backendAvailable = false;
  return demoExec(command);
}

export async function listDirectory(dirPath: string) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`${API_BASE}/api/fs/list`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: dirPath }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (res.ok) {
      backendAvailable = true;
      return await res.json();
    }
  } catch (e) {}
  backendAvailable = false;
  return {
    success: true,
    path: dirPath,
    items: [
      { name: 'Desktop', isDirectory: true, isFile: false, size: 4096, modified: new Date().toISOString(), permissions: '755' },
      { name: 'Documents', isDirectory: true, isFile: false, size: 4096, modified: new Date().toISOString(), permissions: '755' },
      { name: 'Downloads', isDirectory: true, isFile: false, size: 4096, modified: new Date().toISOString(), permissions: '755' },
      { name: 'Pictures', isDirectory: true, isFile: false, size: 4096, modified: new Date().toISOString(), permissions: '755' },
      { name: 'exploit.sh', isDirectory: false, isFile: true, size: 2345, modified: new Date().toISOString(), permissions: '644' },
      { name: 'targets.txt', isDirectory: false, isFile: true, size: 1100, modified: new Date().toISOString(), permissions: '644' },
      { name: 'passwords.txt', isDirectory: false, isFile: true, size: 4710, modified: new Date().toISOString(), permissions: '600' },
      { name: 'notes.md', isDirectory: false, isFile: true, size: 8200, modified: new Date().toISOString(), permissions: '644' },
      { name: 'scan_results.xml', isDirectory: false, isFile: true, size: 15600, modified: new Date().toISOString(), permissions: '644' },
      { name: 'payload.py', isDirectory: false, isFile: true, size: 3400, modified: new Date().toISOString(), permissions: '755' },
    ],
    demoMode: true,
  };
}

export async function readFile(filePath: string) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`${API_BASE}/api/fs/read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: filePath }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (res.ok) { backendAvailable = true; return await res.json(); }
  } catch (e) {}
  return { success: false, error: 'Backend not connected. Deploy on Render for real files.' };
}

export async function writeFile(filePath: string, content: string) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`${API_BASE}/api/fs/write`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: filePath, content }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (res.ok) { backendAvailable = true; return await res.json(); }
  } catch (e) {}
  return { success: false, error: 'Backend not connected.' };
}

export async function runNmap(target: string, options = '-sV') {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);
    const res = await fetch(`${API_BASE}/api/nmap`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target, options }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (res.ok) { backendAvailable = true; return await res.json(); }
  } catch (e) {}
  return { success: false, stdout: '', stderr: 'Backend not connected. Deploy on Render.', command: `nmap ${options} ${target}` };
}

export async function runPing(host: string, count = 4) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    const res = await fetch(`${API_BASE}/api/ping`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ host, count }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (res.ok) { backendAvailable = true; return await res.json(); }
  } catch (e) {}
  return { success: false, stdout: '', stderr: 'Backend not connected.', command: `ping ${host}` };
}

// ============== WEBSOCKET FACTORIES ==============

export function getTerminalWebSocket(): WebSocket | null {
  try {
    return new WebSocket(`${WS_BASE}/terminal`);
  } catch (e) {
    return null;
  }
}

export function getMetasploitWebSocket(): WebSocket | null {
  try {
    return new WebSocket(`${WS_BASE}/metasploit`);
  } catch (e) {
    return null;
  }
}

export function getWiresharkWebSocket(): WebSocket | null {
  try {
    return new WebSocket(`${WS_BASE}/wireshark`);
  } catch (e) {
    return null;
  }
}

export function getBackendStatus(): boolean | null {
  return backendAvailable;
}

export { API_BASE, WS_BASE };
