'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { canSeeTeams } from '@/lib/role-permissions';

export default function TeamsLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { profile } = useAuth();

  useEffect(() => {
    if (!profile) return;
    if (!canSeeTeams(profile.role as 'admin' | 'personel' | 'ekip')) {
      router.replace('/dashboard');
    }
  }, [profile, router]);

  return <>{children}</>;
}
