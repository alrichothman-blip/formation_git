import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from './supabase';
import type { Session, User } from '@supabase/supabase-js';

type UserRole = 'admin' | 'student' | null;

interface AuthContextType {
  session: Session | null;
  user: User | null;
  role: UserRole;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  const fetchRole = useCallback(async (userId: string | undefined) => {
    if (!userId) { setRole(null); return; }
    const { data } = await supabase
      .from('members')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();
    setRole((data?.role as UserRole) || 'student');
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      fetchRole(session?.user?.id).finally(() => setLoading(false));
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      (async () => {
        await fetchRole(session?.user?.id);
      })();
    });

    return () => subscription.unsubscribe();
  }, [fetchRole]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message || null };
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error: error?.message || null };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setRole(null);
  }, []);

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, role, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
