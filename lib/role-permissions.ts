import type { UserRole } from './types';

/**
 * Rol bazlı menü erişim hakları - her menü öğesinin kök path'i
 * admin: Tüm menülere erişim
 * personel: Ekipler, ayarlar, kullanıcı ekleme HARİÇ
 * ekip: Sadece dashboard, iş atamaları, takvim, bildirimler
 */
export const ROLE_MENU_ACCESS: Record<UserRole, string[]> = {
  admin: [
    '/dashboard', '/customers', '/suppliers', '/personeller', '/inventory', '/accounting',
    '/offers', '/contracts', '/jobs', '/teams', '/calendar', '/notifications', '/settings',
  ],
  personel: [
    '/dashboard', '/customers', '/suppliers', '/personeller', '/inventory', '/accounting',
    '/offers', '/contracts', '/jobs', '/calendar', '/notifications',
  ],
  ekip: [
    '/dashboard', '/teams', '/teams/payments', '/calendar', '/notifications',
  ],
};

/**
 * Rol bazlı sayfa erişimi
 * personel: /teams, /settings, /personeller/new YASAKLI
 */
export const ROLE_PAGE_ACCESS: Record<UserRole, string[]> = {
  admin: ['*'],
  personel: [
    '/dashboard', '/profil', '/customers', '/suppliers', '/personeller', '/inventory', '/accounting',
    '/offers', '/contracts', '/jobs', '/calendar', '/notifications',
  ],
  ekip: [
    '/dashboard',
    '/profil',
    '/teams/me',
    '/teams/payments',
    '/teams/assignments',
    '/calendar',
    '/notifications',
  ],
};

/** Personel kullanıcı ekleyebilir mi? */
export function canAddUser(role: UserRole): boolean {
  return role === 'admin';
}

/** Personel adminleri görebilir mi? */
export function canSeeAdmins(role: UserRole): boolean {
  return role === 'admin';
}

/** Personel ekipleri görebilir mi? */
export function canSeeTeams(role: UserRole): boolean {
  return role === 'admin' || role === 'ekip';
}

/** Personel ayarları görebilir/güncelleyebilir mi? */
export function canManageSettings(role: UserRole): boolean {
  return role === 'admin';
}

/** Personel için yasaklı path'ler (menüde olmasa bile doğrudan URL ile erişimi engelle) */
const PERSONEL_FORBIDDEN_PATTERNS = ['/teams', '/settings', '/personeller/new'];

export function canAccessPath(role: UserRole, pathname: string): boolean {
  const allowed = ROLE_PAGE_ACCESS[role];
  if (allowed.includes('*')) return true;

  const normalized = pathname.replace(/\/$/, '') || '/';

  // Personel: teams, settings, personeller/new erişemez
  if (role === 'personel') {
    const isForbidden = PERSONEL_FORBIDDEN_PATTERNS.some(
      (p) => normalized === p || normalized.startsWith(p + '/')
    );
    if (isForbidden) return false;
  }

  // Ekip: /teams/assignments/new erişemez; sadece /teams/me, /teams/payments, /teams/assignments
  if (role === 'ekip' && normalized === '/teams/assignments/new') return false;
  if (role === 'ekip' && normalized === '/teams') return false;
  if (role === 'ekip' && normalized.startsWith('/teams/') && !normalized.startsWith('/teams/me') && !normalized.startsWith('/teams/payments') && !normalized.startsWith('/teams/assignments')) return false;

  return allowed.some((pattern) => {
    if (pattern.endsWith('[id]')) {
      const base = pattern.replace(/\[id\]$/, '');
      return normalized === base || normalized.startsWith(base + '/');
    }
    return normalized === pattern || normalized.startsWith(pattern + '/');
  });
}

export function getMenuItemsForRole(role: UserRole): string[] {
  return ROLE_MENU_ACCESS[role] || [];
}
