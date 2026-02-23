'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { canManageSettings } from '@/lib/role-permissions';

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { profile } = useAuth();

  useEffect(() => {
    if (!profile) return;
    if (!canManageSettings(profile.role as 'admin' | 'personel' | 'ekip')) {
      router.replace('/dashboard');
    }
  }, [profile, router]);

  return <>{children}</>;
}
