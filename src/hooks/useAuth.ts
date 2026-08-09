// ===============================================================
//  useAuth — React hook for Supabase authentication
// ===============================================================
import { useState, useEffect, useCallback } from 'react';
import { supabase, auth, profiles, type Profile } from '../lib/supabase';

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    (async () => {
      const { data: { session } } = await auth.getSession();
      if (session?.user) {
        setUser(session.user);
        const p = await profiles.get();
        setProfile(p);
        profiles.updateLastSeen().catch(() => {});
      }
      setLoading(false);
    })();

    // Listen for auth changes
    const { data: { subscription } } = auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        const p = await profiles.get();
        setProfile(p);
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await auth.signIn(email, password);
    if (error) throw error;
    return data;
  }, []);

  const signUp = useCallback(async (email: string, password: string, username?: string) => {
    const { data, error } = await auth.signUp(email, password, username);
    if (error) throw error;
    return data;
  }, []);

  const sendMagicLink = useCallback(async (email: string) => {
    const { error } = await auth.sendMagicLink(email);
    if (error) throw error;
  }, []);

  const signInWithOAuth = useCallback(async (provider: 'github' | 'google' | 'gitlab') => {
    const { error } = await auth.signInWithOAuth(provider);
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    await auth.signOut();
    setUser(null);
    setProfile(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    const p = await profiles.get();
    setProfile(p);
  }, []);

  return {
    user,
    profile,
    loading,
    isAuthenticated: !!user,
    signIn,
    signUp,
    sendMagicLink,
    signInWithOAuth,
    signOut,
    refreshProfile,
  };
}
