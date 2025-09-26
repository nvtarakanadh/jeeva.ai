import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { apiFetch } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, userData?: any) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  profile: any;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  // Local cache helpers to hydrate profile instantly after auth
  const getProfileCacheKey = (userId: string) => `profile_cache:${userId}`;
  const readCachedProfile = (userId?: string | null) => {
    try {
      if (!userId) return null;
      const raw = localStorage.getItem(getProfileCacheKey(userId));
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  };
  const writeCachedProfile = (userId?: string | null, value?: any) => {
    try {
      if (!userId || !value) return;
      localStorage.setItem(
        getProfileCacheKey(userId),
        JSON.stringify({ ...value, _cachedAt: Date.now() })
      );
    } catch {
      // ignore cache write errors
    }
  };

  const refreshProfile = async () => {
    try {
      const email = localStorage.getItem('auth_email');
      if (!email) return;
      const me = await apiFetch<any>('/api/profile/me/', {
        method: 'GET',
        headers: { 'X-User-Email': email },
      });
      setProfile(me);
      writeCachedProfile(email, me);
    } catch (error) {
      console.error('Error in refreshProfile:', error);
    }
  };

  useEffect(() => {
    let mounted = true;
    let initialLoadComplete = false;

    const initAuth = async () => {
      try {
        const email = localStorage.getItem('auth_email');
        if (email) {
          const cached = readCachedProfile(email);
          if (cached) setProfile(cached);
          await refreshProfile();
        }
      } finally {
        initialLoadComplete = true;
        setLoading(false);
      }
    };
    initAuth();
    return () => { mounted = false; };
  }, []);

  const signUp = async (email: string, _password: string, userData: any = {}) => {
    try {
      const body = { email: email.trim(), ...userData };
      const me = await apiFetch<any>('/api/profile/me/', {
        method: 'PUT',
        headers: { 'X-User-Email': email.trim() },
        body,
      });
      // Auto-login after signup
      setUser({} as any);
      setSession({} as any);
      setProfile(me);
      localStorage.setItem('auth_email', email.trim());
      return { error: null as any };
    } catch (error: any) {
      return { error };
    }
  };

  const signIn = async (email: string, _password: string) => {
    try {
      // TEMP local login: call profile/me and treat email header as identity
      const me = await apiFetch<any>('/api/profile/me/', {
        method: 'GET',
        headers: { 'X-User-Email': email.trim() },
      });
      setUser({} as any);
      setSession({} as any);
      setProfile(me);
      writeCachedProfile(email.trim(), me);
      localStorage.setItem('auth_email', email.trim());
      return { error: null } as any;
    } catch (error) {
      console.error('Sign in exception:', error);
      return { error };
    }
  };

  const signOut = async () => { localStorage.removeItem('auth_email'); setProfile(null); return { error: null as any }; };

  const resetPassword = async (_email: string) => ({ error: null as any });

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signUp,
        signIn,
        signOut,
        resetPassword,
        profile,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};