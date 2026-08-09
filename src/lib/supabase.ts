// ===============================================================
//  Kali Nexus — Supabase Client
//  Provides auth + database + realtime integration
// ===============================================================
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://oviuyijoxgqjbyggqmso.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92aXV5aWpveGdxamJ5Z2dxbXNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyOTk0ODAsImV4cCI6MjEwMTg3NTQ4MH0.3MSa1LUR7PksmgsRwLzbWQc5FnnQ2oI3_Iekd72RbgY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: { eventsPerSecond: 10 },
  },
});

// ============== TYPES ==============
export interface Profile {
  id: string;
  email: string | null;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  plan: string;
  preferences: Record<string, any>;
  total_commands: number;
  total_scans: number;
  last_seen: string;
  created_at: string;
}

export interface CommandHistoryItem {
  id: string;
  user_id: string;
  session_id: string | null;
  command: string;
  output: string | null;
  exit_code: number | null;
  cwd: string | null;
  duration_ms: number | null;
  blocked: boolean;
  created_at: string;
}

export interface ScanResult {
  id: string;
  user_id: string;
  scan_type: string;
  target: string;
  ip_address: string | null;
  options: Record<string, any>;
  results: Record<string, any>;
  open_ports: number[];
  duration_ms: number | null;
  raw_output: string | null;
  created_at: string;
}

export interface AIMessage {
  id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  action_taken: string | null;
  created_at: string;
}

export interface Bookmark {
  id: string;
  user_id: string;
  command: string;
  label: string | null;
  category: string;
  created_at: string;
}

// ============== AUTH API ==============
export const auth = {
  getSession: () => supabase.auth.getSession(),
  getUser: () => supabase.auth.getUser(),

  signUp: (email: string, password: string, username?: string) =>
    supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    }),

  signIn: (email: string, password: string) =>
    supabase.auth.signInWithPassword({ email, password }),

  sendMagicLink: (email: string) =>
    supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } }),

  signInWithOAuth: (provider: 'github' | 'google' | 'gitlab') =>
    supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin },
    }),

  signOut: () => supabase.auth.signOut(),

  onAuthStateChange: (callback: (event: string, session: any) => void) =>
    supabase.auth.onAuthStateChange(callback),
};

// ============== PROFILES API ==============
export const profiles = {
  get: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    if (error) { console.error('Profile get error:', error); return null; }
    return data as Profile;
  },

  update: async (updates: Partial<Profile>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();
    if (error) throw error;
    return data as Profile;
  },

  updateLastSeen: () => supabase.rpc('update_last_seen'),
  getStats: () => supabase.rpc('get_user_stats'),
};

// ============== COMMAND HISTORY API ==============
export const commands = {
  add: async (cmd: Omit<CommandHistoryItem, 'id' | 'user_id' | 'created_at'>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data, error } = await supabase
      .from('command_history')
      .insert({ ...cmd, user_id: user.id })
      .select()
      .single();
    if (error) { console.error('Command save error:', error); return null; }
    return data as CommandHistoryItem;
  },

  list: async (limit = 50) => {
    const { data, error } = await supabase
      .from('command_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) { console.error(error); return []; }
    return (data || []) as CommandHistoryItem[];
  },

  search: (query: string, limit = 20) =>
    supabase.rpc('search_commands', { search_query: query, limit_count: limit }),

  delete: (id: string) =>
    supabase.from('command_history').delete().eq('id', id),

  clearAll: () => supabase.from('command_history').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
};

// ============== SCAN RESULTS API ==============
export const scans = {
  add: async (scan: Omit<ScanResult, 'id' | 'user_id' | 'created_at'>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data, error } = await supabase
      .from('scan_results')
      .insert({ ...scan, user_id: user.id })
      .select()
      .single();
    if (error) { console.error('Scan save error:', error); return null; }
    return data as ScanResult;
  },

  list: async (limit = 20) => {
    const { data, error } = await supabase
      .from('scan_results')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) { console.error(error); return []; }
    return (data || []) as ScanResult[];
  },

  delete: (id: string) =>
    supabase.from('scan_results').delete().eq('id', id),
};

// ============== AI MESSAGES API ==============
export const aiMessages = {
  add: async (msg: { role: 'user' | 'assistant'; content: string; action_taken?: string | null }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data, error } = await supabase
      .from('ai_messages')
      .insert({ ...msg, user_id: user.id })
      .select()
      .single();
    if (error) { console.error(error); return null; }
    return data as AIMessage;
  },

  list: async (limit = 50) => {
    const { data, error } = await supabase
      .from('ai_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) { console.error(error); return []; }
    return (data || []) as AIMessage[];
  },
};

// ============== BOOKMARKS API ==============
export const bookmarks = {
  add: async (bookmark: { command: string; label?: string; category?: string }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data, error } = await supabase
      .from('command_bookmarks')
      .insert({ ...bookmark, user_id: user.id })
      .select()
      .single();
    if (error) { console.error(error); return null; }
    return data as Bookmark;
  },

  list: async () => {
    const { data, error } = await supabase
      .from('command_bookmarks')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) { console.error(error); return []; }
    return (data || []) as Bookmark[];
  },

  delete: (id: string) =>
    supabase.from('command_bookmarks').delete().eq('id', id),
};

// ============== ACTIVITY LOG API ==============
export const activity = {
  log: async (entry: { action: string; resource_type?: string; resource_id?: string; metadata?: any }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('activity_log').insert({
      ...entry,
      user_id: user.id,
      user_agent: navigator.userAgent,
    });
  },
};

// ============== REALTIME ==============
export const realtime = {
  subscribeToCommands: (callback: (payload: any) => void) =>
    supabase
      .channel('command_history_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'command_history' }, callback)
      .subscribe(),

  subscribeToScans: (callback: (payload: any) => void) =>
    supabase
      .channel('scan_results_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'scan_results' }, callback)
      .subscribe(),

  unsubscribe: (channel: any) => supabase.removeChannel(channel),
};
