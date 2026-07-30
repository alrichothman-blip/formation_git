import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { auth } from './api';

type UserRole = 'admin' | 'student' | null;

interface AuthUser {
  id: number;
  name: string;
  prenom?: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: AuthUser | null;
  role: UserRole;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    auth.me()
      .then((data) => {
        setUser(data.user);
        setRole((data.user.role as UserRole) || 'student');
      })
      .catch(() => {
        setUser(null);
        setRole(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const data = await auth.login(email, password);
      setUser(data.user);
      setRole((data.user.role as UserRole) || 'student');
      return { error: null };
    } catch (e: any) {
      return { error: e.message || 'Erreur de connexion' };
    }
  }, []);

  const signUp = useCallback(async (_email: string, _password: string) => {
    return { error: null };
  }, []);

  const signOut = useCallback(async () => {
    await auth.logout();
    setUser(null);
    setRole(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, role, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
