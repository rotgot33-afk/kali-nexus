import { useState, useEffect } from 'react';
import { listDirectory, readFile, writeFile, fetchSystemInfo } from '../../../lib/api';

interface FileItem {
  name: string;
  isDirectory: boolean;
  isFile: boolean;
  size: number;
  modified: string;
  permissions: string;
}

const formatSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const formatDate = (dateStr: string): string => {
  try {
    const d = new Date(dateStr);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
};

const getIcon = (item: FileItem): string => {
  if (item.isDirectory) {
    if (item.name.startsWith('.')) return '📂';
    return '📁';
  }
  const ext = item.name.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'txt': case 'md': return '📄';
    case 'sh': case 'bash': return '📜';
    case 'py': return '🐍';
    case 'js': case 'ts': return '📜';
    case 'html': return '🌐';
    case 'json': return '📋';
    case 'png': case 'jpg': case 'jpeg': case 'gif': return '🖼️';
    case 'mp3': case 'wav': return '🎵';
    case 'mp4': case 'avi': return '🎬';
    case 'zip': case 'tar': case 'gz': return '📦';
    case 'pdf': return '📕';
    case 'exe': return '⚙️';
    default: return '📄';
  }
};

export default function FilesApp() {
  const [currentPath, setCurrentPath] = useState<string>('');
  const [items, setItems] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [view, setView] = useState<'list' | 'grid'>('list');
  const [error, setError] = useState<string | null>(null);
  const [homeDir, setHomeDir] = useState<string>('');
  const [openFile, setOpenFile] = useState<{ path: string; content: string } | null>(null);

  useEffect(() => {
    // Get home directory
    fetchSystemInfo().then((info) => {
      if (info) {
        setHomeDir(info.homeDir);
        setCurrentPath(info.homeDir);
      }
    });
  }, []);

  useEffect(() => {
    if (!currentPath) return;
    loadDir(currentPath);
  }, [currentPath]);

  const loadDir = async (path: string) => {
    setLoading(true);
    setError(null);
    const res = await listDirectory(path);
    if (res.success) {
      setItems(res.items);
    } else {
      setError(res.error || 'Failed to load directory');
      setItems([]);
    }
    setLoading(false);
  };

  const navigate = (item: FileItem) => {
    if (item.isDirectory) {
      const newPath = currentPath === '/' ? `/${item.name}` : `${currentPath}/${item.name}`;
      setCurrentPath(newPath);
    } else {
      openFileInEditor(item);
    }
  };

  const openFileInEditor = async (item: FileItem) => {
    const fullPath = currentPath === '/' ? `/${item.name}` : `${currentPath}/${item.name}`;
    const res = await readFile(fullPath);
    if (res.success) {
      setOpenFile({ path: fullPath, content: res.content });
    } else {
      alert('Cannot read file: ' + res.error);
    }
  };

  const saveFile = async () => {
    if (!openFile) return;
    const res = await writeFile(openFile.path, openFile.content);
    if (res.success) {
      alert('Saved!');
      loadDir(currentPath);
    } else {
      alert('Error: ' + res.error);
    }
  };

  const pathParts = currentPath.split('/').filter(Boolean);

  return (
    <div className="h-full flex bg-[#1a1a1a] text-white text-xs">
      {/* Sidebar */}
      <div className="w-48 bg-[#0d0d0d] border-r border-[#00ff41]/20 p-2">
        <div className="text-[#00ff41] font-bold mb-2 px-2">QUICK ACCESS</div>
        <div
          className={`px-2 py-1 cursor-pointer rounded ${currentPath === homeDir ? 'bg-[#00ff41]/20 text-[#00ff41]' : 'hover:bg-white/5'}`}
          onClick={() => homeDir && setCurrentPath(homeDir)}
        >
          🏠 Home
        </div>
        <div className="px-2 py-1 cursor-pointer rounded hover:bg-white/5" onClick={() => setCurrentPath('/tmp')}>
          📂 tmp
        </div>
        <div className="px-2 py-1 cursor-pointer rounded hover:bg-white/5" onClick={() => setCurrentPath('/etc')}>
          ⚙️ etc
        </div>
        <div className="px-2 py-1 cursor-pointer rounded hover:bg-white/5" onClick={() => setCurrentPath('/var')}>
          📦 var
        </div>
        <div className="px-2 py-1 cursor-pointer rounded hover:bg-white/5" onClick={() => setCurrentPath('/usr')}>
          💿 usr
        </div>

        <div className="text-[#00ff41] font-bold mt-4 mb-2 px-2">DEVICES</div>
        <div className="px-2 py-1 cursor-pointer rounded hover:bg-white/5" onClick={() => setCurrentPath('/')}>
          💽 File System
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col">
        {/* Path bar */}
        <div className="h-8 bg-[#1a1a1a] border-b border-[#00ff41]/20 flex items-center px-2 gap-1">
          <button
            onClick={() => pathParts.length > 1 && setCurrentPath('/' + pathParts.slice(0, -1).join('/'))}
            className="px-2 hover:bg-white/5 rounded"
          >
            ←
          </button>
          <button
            onClick={() => loadDir(currentPath)}
            className="px-2 hover:bg-white/5 rounded"
          >
            ↻
          </button>
          <button
            onClick={() => currentPath !== '/' && setCurrentPath('/' + pathParts.slice(0, -1).join('/'))}
            className="px-2 hover:bg-white/5 rounded"
          >
            ↑
          </button>
          <div className="flex-1 bg-[#0d0d0d] rounded px-2 py-1 font-mono text-[#00ff41] flex items-center gap-1 overflow-x-auto">
            <span>📁</span>
            {pathParts.map((p, i) => (
              <span key={i} className="whitespace-nowrap">
                <span
                  className="cursor-pointer hover:text-white"
                  onClick={() => {
                    const newPath = '/' + pathParts.slice(0, i + 1).join('/');
                    setCurrentPath(newPath);
                  }}
                >
                  {p}
                </span>
                {i < pathParts.length - 1 && <span className="text-gray-500"> /</span>}
              </span>
            ))}
          </div>
          <button
            onClick={() => setView(view === 'list' ? 'grid' : 'list')}
            className="px-2 hover:bg-white/5 rounded"
          >
            {view === 'list' ? '⊞' : '☰'}
          </button>
        </div>

        {/* File list */}
        <div className="flex-1 p-2 overflow-y-auto" onClick={() => setSelectedFile(null)}>
          {loading ? (
            <div className="text-center text-gray-500 mt-8">
              <div className="inline-block animate-spin text-2xl mb-2">⟳</div>
              <div>Loading...</div>
            </div>
          ) : error ? (
            <div className="text-center text-red-400 mt-8">
              <div>⚠️ {error}</div>
              <div className="text-[10px] text-gray-500 mt-2">Make sure backend server is running</div>
            </div>
          ) : items.length === 0 ? (
            <div className="text-gray-500 text-center mt-8">Empty folder</div>
          ) : view === 'list' ? (
            <>
              <div className="grid grid-cols-[1fr,80px,80px,100px] gap-1 text-[10px] text-gray-400 border-b border-[#00ff41]/20 pb-1 mb-1 sticky top-0 bg-[#1a1a1a]">
                <div>Name</div>
                <div>Size</div>
                <div>Perm</div>
                <div>Modified</div>
              </div>
              {items.map((item) => (
                <div
                  key={item.name}
                  onClick={(e) => { e.stopPropagation(); setSelectedFile(item.name); }}
                  onDoubleClick={(e) => { e.stopPropagation(); navigate(item); }}
                  className={`grid grid-cols-[1fr,80px,80px,100px] gap-1 px-1 py-1 cursor-pointer rounded text-[11px] ${
                    selectedFile === item.name ? 'bg-[#00ff41]/20 border border-[#00ff41]/50' : 'hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span>{getIcon(item)}</span>
                    <span className="truncate">{item.name}</span>
                  </div>
                  <div className="text-gray-400">{item.isDirectory ? '—' : formatSize(item.size)}</div>
                  <div className="text-gray-400 font-mono text-[10px]">{item.permissions}</div>
                  <div className="text-gray-400">{formatDate(item.modified)}</div>
                </div>
              ))}
            </>
          ) : (
            <div className="grid grid-cols-6 gap-2">
              {items.map((item) => (
                <div
                  key={item.name}
                  onClick={(e) => { e.stopPropagation(); setSelectedFile(item.name); }}
                  onDoubleClick={(e) => { e.stopPropagation(); navigate(item); }}
                  className={`p-2 rounded cursor-pointer text-center ${
                    selectedFile === item.name ? 'bg-[#00ff41]/20 border border-[#00ff41]/50' : 'hover:bg-white/5'
                  }`}
                >
                  <div className="text-3xl mb-1">{getIcon(item)}</div>
                  <div className="text-[10px] truncate">{item.name}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Status bar */}
        <div className="h-6 bg-[#0d0d0d] border-t border-[#00ff41]/20 px-2 flex items-center justify-between text-[10px] text-gray-400">
          <span>{items.length} items {selectedFile && `• Selected: ${selectedFile}`}</span>
          <span className="font-mono text-[#00ff41]">📡 Real FS</span>
        </div>
      </div>

      {/* File editor modal */}
      {openFile && (
        <div className="absolute inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] border border-[#00ff41]/30 rounded-lg w-full h-full flex flex-col">
            <div className="h-8 bg-[#0d0d0d] border-b border-[#00ff41]/20 flex items-center justify-between px-3">
              <span className="text-[#00ff41] font-mono text-[10px] truncate">{openFile.path}</span>
              <div className="flex gap-1">
                <button
                  onClick={saveFile}
                  className="px-2 py-0.5 bg-[#00ff41]/20 text-[#00ff41] rounded hover:bg-[#00ff41]/30 text-[10px]"
                >
                  💾 Save
                </button>
                <button
                  onClick={() => setOpenFile(null)}
                  className="px-2 py-0.5 hover:bg-white/10 rounded text-[10px]"
                >
                  ✕ Close
                </button>
              </div>
            </div>
            <textarea
              value={openFile.content}
              onChange={(e) => setOpenFile({ ...openFile, content: e.target.value })}
              className="flex-1 bg-black text-[#00ff41] font-mono p-2 outline-none resize-none text-[11px]"
              spellCheck={false}
            />
          </div>
        </div>
      )}
    </div>
  );
}
