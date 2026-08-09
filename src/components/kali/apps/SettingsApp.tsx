import { useState } from 'react';

const sections = [
  { id: 'appearance', name: 'Appearance', icon: '🎨' },
  { id: 'network', name: 'Network', icon: '🌐' },
  { id: 'security', name: 'Security', icon: '🔒' },
  { id: 'users', name: 'Users', icon: '👤' },
  { id: 'keyboard', name: 'Keyboard', icon: '⌨️' },
  { id: 'updates', name: 'Updates', icon: '🔄' },
];

export default function SettingsApp() {
  const [active, setActive] = useState('appearance');
  const [theme, setTheme] = useState('dark');
  const [accent, setAccent] = useState('#00ff41');
  const [animations, setAnimations] = useState(true);
  const [firewall, setFirewall] = useState(true);
  const [autoUpdate, setAutoUpdate] = useState(true);

  return (
    <div className="h-full flex bg-[#1a1a1a] text-white text-xs">
      {/* Sidebar */}
      <div className="w-48 bg-[#0d0d0d] border-r border-[#00ff41]/20 p-2">
        {sections.map((s) => (
          <div
            key={s.id}
            onClick={() => setActive(s.id)}
            className={`px-3 py-2 cursor-pointer rounded flex items-center gap-2 ${
              active === s.id ? 'bg-[#00ff41]/20 text-[#00ff41]' : 'hover:bg-white/5'
            }`}
          >
            <span>{s.icon}</span>
            <span>{s.name}</span>
          </div>
        ))}
      </div>

      {/* Main */}
      <div className="flex-1 p-6 overflow-y-auto">
        {active === 'appearance' && (
          <div>
            <h2 className="text-xl mb-4 font-bold">Appearance</h2>
            <SettingGroup title="Theme">
              <RadioOption
                label="Dark"
                checked={theme === 'dark'}
                onChange={() => setTheme('dark')}
              />
              <RadioOption
                label="Light"
                checked={theme === 'light'}
                onChange={() => setTheme('light')}
              />
              <RadioOption
                label="Auto"
                checked={theme === 'auto'}
                onChange={() => setTheme('auto')}
              />
            </SettingGroup>

            <SettingGroup title="Accent Color">
              <div className="flex gap-2">
                {['#00ff41', '#3674f5', '#ff3366', '#ffaa00', '#ff00ff', '#00ffff'].map((c) => (
                  <button
                    key={c}
                    onClick={() => setAccent(c)}
                    className={`w-8 h-8 rounded-full border-2 ${
                      accent === c ? 'border-white scale-110' : 'border-transparent'
                    }`}
                    style={{ background: c, boxShadow: `0 0 10px ${c}` }}
                  />
                ))}
              </div>
            </SettingGroup>

            <SettingGroup title="Animations">
              <ToggleOption
                label="Enable animations"
                checked={animations}
                onChange={setAnimations}
              />
            </SettingGroup>
          </div>
        )}

        {active === 'network' && (
          <div>
            <h2 className="text-xl mb-4 font-bold">Network</h2>
            <SettingGroup title="Connections">
              <div className="bg-[#0d0d0d] rounded p-3">
                <div className="flex justify-between mb-2">
                  <span>📡 Wi-Fi (kali-net)</span>
                  <span className="text-green-400">Connected</span>
                </div>
                <div className="text-[10px] text-gray-400">
                  IP: 192.168.1.105 • Speed: 866 Mbps
                </div>
              </div>
              <div className="bg-[#0d0d0d] rounded p-3">
                <div className="flex justify-between mb-2">
                  <span>🔌 Ethernet (eth0)</span>
                  <span className="text-green-400">Connected</span>
                </div>
                <div className="text-[10px] text-gray-400">
                  IP: 192.168.1.105 • Speed: 1 Gbps
                </div>
              </div>
            </SettingGroup>

            <SettingGroup title="Proxy">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-20">HTTP:</span>
                  <input
                    className="flex-1 bg-[#0d0d0d] border border-[#00ff41]/20 rounded px-2 py-1 outline-none"
                    defaultValue="127.0.0.1:8080"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-20">HTTPS:</span>
                  <input
                    className="flex-1 bg-[#0d0d0d] border border-[#00ff41]/20 rounded px-2 py-1 outline-none"
                    defaultValue="127.0.0.1:8080"
                  />
                </div>
              </div>
            </SettingGroup>
          </div>
        )}

        {active === 'security' && (
          <div>
            <h2 className="text-xl mb-4 font-bold">Security</h2>
            <SettingGroup title="Firewall">
              <ToggleOption
                label="Enable firewall"
                checked={firewall}
                onChange={setFirewall}
              />
            </SettingGroup>

            <SettingGroup title="Encryption">
              <div className="bg-[#0d0d0d] rounded p-3">
                <div className="font-bold mb-1">Disk Encryption</div>
                <div className="text-[10px] text-gray-400 mb-2">LUKS encryption is enabled</div>
                <div className="h-2 bg-green-500/30 rounded">
                  <div className="h-full w-full bg-green-500 rounded" />
                </div>
              </div>
            </SettingGroup>

            <SettingGroup title="Authentication">
              <div className="bg-[#0d0d0d] rounded p-3 space-y-1 text-[11px]">
                <div>✓ Password required for login</div>
                <div>✓ Two-factor authentication</div>
                <div>✓ Biometric login</div>
                <div>✓ Smart card support</div>
              </div>
            </SettingGroup>
          </div>
        )}

        {active === 'users' && (
          <div>
            <h2 className="text-xl mb-4 font-bold">Users</h2>
            <div className="bg-[#0d0d0d] rounded p-3 space-y-2">
              {[
                { name: 'root', type: 'Administrator', avatar: '👑', active: true },
                { name: 'kali', type: 'Standard', avatar: '👤', active: false },
                { name: 'pentester', type: 'Power User', avatar: '🕵️', active: false },
              ].map((u) => (
                <div
                  key={u.name}
                  className="flex items-center gap-3 p-2 hover:bg-white/5 rounded"
                >
                  <div className="text-2xl">{u.avatar}</div>
                  <div className="flex-1">
                    <div className="font-bold">{u.name}</div>
                    <div className="text-[10px] text-gray-400">{u.type}</div>
                  </div>
                  {u.active && <span className="text-[#00ff41] text-[10px]">● Active</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {active === 'keyboard' && (
          <div>
            <h2 className="text-xl mb-4 font-bold">Keyboard</h2>
            <SettingGroup title="Layout">
              <select className="bg-[#0d0d0d] border border-[#00ff41]/20 rounded px-2 py-1 outline-none">
                <option>English (US)</option>
                <option>Arabic</option>
                <option>Spanish</option>
                <option>French</option>
              </select>
            </SettingGroup>

            <SettingGroup title="Shortcuts">
              <div className="bg-[#0d0d0d] rounded p-3 space-y-1 text-[11px]">
                <div className="flex justify-between"><span>Open Terminal</span><span className="text-gray-400">Ctrl+Alt+T</span></div>
                <div className="flex justify-between"><span>File Manager</span><span className="text-gray-400">Super+E</span></div>
                <div className="flex justify-between"><span>Take Screenshot</span><span className="text-gray-400">Print</span></div>
                <div className="flex justify-between"><span>Show Activities</span><span className="text-gray-400">Super</span></div>
              </div>
            </SettingGroup>
          </div>
        )}

        {active === 'updates' && (
          <div>
            <h2 className="text-xl mb-4 font-bold">Updates</h2>
            <SettingGroup title="Automatic Updates">
              <ToggleOption
                label="Download and install updates automatically"
                checked={autoUpdate}
                onChange={setAutoUpdate}
              />
            </SettingGroup>

            <SettingGroup title="Status">
              <div className="bg-[#0d0d0d] rounded p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-green-400 text-xl">✓</span>
                  <span>Your system is up to date</span>
                </div>
                <div className="text-[10px] text-gray-400">
                  Last checked: 2 hours ago
                </div>
              </div>
            </SettingGroup>

            <button className="mt-4 px-4 py-2 bg-[#00ff41] text-black rounded font-bold hover:bg-[#00ff41]/80">
              Check for updates
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function SettingGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h3 className="text-[#00ff41] text-sm font-bold mb-2 uppercase tracking-wider">{title}</h3>
      <div className="space-y-2 pl-2">{children}</div>
    </div>
  );
}

function RadioOption({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <div
        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
          checked ? 'border-[#00ff41]' : 'border-gray-500'
        }`}
        onClick={onChange}
      >
        {checked && <div className="w-2 h-2 rounded-full bg-[#00ff41]" />}
      </div>
      <span>{label}</span>
    </label>
  );
}

function ToggleOption({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between cursor-pointer py-1">
      <span>{label}</span>
      <div
        onClick={() => onChange(!checked)}
        className={`w-10 h-5 rounded-full p-0.5 transition-colors ${
          checked ? 'bg-[#00ff41]' : 'bg-gray-600'
        }`}
      >
        <div
          className={`w-4 h-4 rounded-full bg-white transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </div>
    </label>
  );
}
