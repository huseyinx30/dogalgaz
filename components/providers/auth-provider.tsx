'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { canAccessPath } from '@/lib/role-permissions';
import type { UserRole } from '@/lib/types';

interface Profile {
  id: string;
  full_name: string | null;
  email: string;
  phone?: string | null;
  role: UserRole;
  is_active: boolean;
}

interface AuthContextType {
  user: { id: string; email: string } | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadProfile(session.user.id);
        setUser({ id: session.user.id, email: session.user.email || '' });
      } else {
        setUser(null);
        setProfile(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone, role, is_active')
        .eq('id', userId)
        .single();
      if (data) {
        setProfile(data as Profile);
      }
    } catch (err) {
      console.error('Profil yükleme hatası:', err);
      setProfile(null);
    }
  };

  const loadUser = async () => {
    const timeoutId = setTimeout(() => {
      setLoading(false);
      console.warn('Auth yükleme zaman aşımı (8sn)');
    }, 8000);

    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      clearTimeout(timeoutId);
      if (authUser) {
        setUser({ id: authUser.id, email: authUser.email || '' });
        await loadProfile(authUser.id);
      } else {
        setUser(null);
        setProfile(null);
      }
    } catch (err) {
      clearTimeout(timeoutId);
      console.error('Auth yükleme hatası:', err);
      setUser(null);
      setProfile(null);
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    window.location.href = '/login';
  };

  // Route protection: login sayfası hariç, giriş yapmamış kullanıcıyı login'e yönlendir
  useEffect(() => {
    if (loading) return;
    if (pathname?.startsWith('/login')) return;

    if (!user) {
      router.replace('/login');
      return;
    }

    if (profile && !profile.is_active) {
      signOut();
      return;
    }

    // Rol bazlı erişim kontrolü
    if (profile && pathname && !pathname.startsWith('/login')) {
      const role = profile.role as UserRole;
      if (!canAccessPath(role, pathname)) {
        router.replace('/dashboard');
      }
    }
  }, [loading, user, profile, pathname]);

  const value: AuthContextType = {
    user,
    profile,
    loading,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
