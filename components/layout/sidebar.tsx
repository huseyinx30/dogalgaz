'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/providers/auth-provider';
import type { UserRole } from '@/lib/types';
import {
  LayoutDashboard,
  Users,
  User,
  Package,
  FileText,
  ClipboardList,
  Settings,
  Building2,
  Truck,
  Calendar,
  Bell,
  Wallet,
} from 'lucide-react';

interface MenuItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  children?: MenuItem[];
  roles?: UserRole[]; // Boş/undefined = tüm roller
}

const allMenuItems: MenuItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: <LayoutDashboard className="w-5 h-5" />,
  },
  {
    title: 'Müşteriler',
    href: '/customers',
    icon: <Users className="w-5 h-5" />,
    children: [
      { title: 'Tüm Müşteriler', href: '/customers', icon: <Users className="w-4 h-4" /> },
      { title: 'Yeni Müşteri', href: '/customers/new', icon: <Users className="w-4 h-4" /> },
    ],
  },
  {
    title: 'Personeller',
    href: '/personeller',
    icon: <User className="w-5 h-5" />,
    children: [
      { title: 'Tüm Personeller', href: '/personeller', icon: <User className="w-4 h-4" /> },
      { title: 'Yeni Personel', href: '/personeller/new', icon: <User className="w-4 h-4" /> },
    ],
  },
  {
    title: 'Tedarikçiler',
    href: '/suppliers',
    icon: <Truck className="w-5 h-5" />,
    children: [
      { title: 'Tüm Tedarikçiler', href: '/suppliers', icon: <Truck className="w-4 h-4" /> },
      { title: 'Yeni Tedarikçi', href: '/suppliers/new', icon: <Truck className="w-4 h-4" /> },
    ],
  },
  {
    title: 'Stok Yönetimi',
    href: '/inventory',
    icon: <Package className="w-5 h-5" />,
    children: [
      { title: 'Ürünler', href: '/inventory/products', icon: <Package className="w-4 h-4" /> },
      { title: 'Stok Hareketleri', href: '/inventory/movements', icon: <Package className="w-4 h-4" /> },
      { title: 'Kategoriler', href: '/inventory/categories', icon: <Package className="w-4 h-4" /> },
    ],
  },
  {
    title: 'Ön Muhasebe',
    href: '/accounting',
    icon: <FileText className="w-5 h-5" />,
    children: [
      { title: 'Satın Almalar', href: '/accounting/purchases', icon: <FileText className="w-4 h-4" /> },
      { title: 'Satışlar', href: '/accounting/sales', icon: <FileText className="w-4 h-4" /> },
      { title: 'Ödemeler', href: '/accounting/payments', icon: <FileText className="w-4 h-4" /> },
    ],
  },
  {
    title: 'Teklifler',
    href: '/offers',
    icon: <FileText className="w-5 h-5" />,
  },
  {
    title: 'Sözleşmeler',
    href: '/contracts',
    icon: <FileText className="w-5 h-5" />,
  },
  {
    title: 'İş Takibi',
    href: '/jobs',
    icon: <ClipboardList className="w-5 h-5" />,
  },
  {
    title: 'Ekipler',
    href: '/teams',
    icon: <Building2 className="w-5 h-5" />,
    children: [
      { title: 'Ekip Paneli', href: '/teams/me', icon: <User className="w-4 h-4" /> },
      { title: 'Ödemelerim', href: '/teams/payments', icon: <Wallet className="w-4 h-4" /> },
      { title: 'Tüm Ekipler', href: '/teams', icon: <Building2 className="w-4 h-4" /> },
      { title: 'İş Atamaları', href: '/teams/assignments', icon: <ClipboardList className="w-4 h-4" /> },
    ],
  },
  {
    title: 'Takvim',
    href: '/calendar',
    icon: <Calendar className="w-5 h-5" />,
  },
  {
    title: 'Bildirimler',
    href: '/notifications',
    icon: <Bell className="w-5 h-5" />,
  },
  {
    title: 'Ayarlar',
    href: '/settings',
    icon: <Settings className="w-5 h-5" />,
    children: [
      { title: 'Genel Ayarlar', href: '/settings/general', icon: <Settings className="w-4 h-4" /> },
      { title: 'Yetki Ayarları', href: '/settings/permissions', icon: <Settings className="w-4 h-4" /> },
      { title: 'Kullanıcılar', href: '/settings/users', icon: <Users className="w-4 h-4" /> },
    ],
  },
];

function filterMenuByRole(items: MenuItem[], role: UserRole): MenuItem[] {
  const allowedPaths: Record<UserRole, string[]> = {
    admin: ['*'],
    personel: ['/dashboard', '/customers', '/suppliers', '/personeller', '/inventory', '/accounting', '/offers', '/contracts', '/jobs', '/calendar', '/notifications'],
    ekip: ['/dashboard', '/teams/me', '/teams/payments', '/teams/assignments', '/calendar', '/notifications'],
  };

  const paths = allowedPaths[role];
  if (paths.includes('*')) return items;

  const canAccess = (href: string) => paths.some((p) => href === p || href.startsWith(p + '/'));

  return items
    .map((item) => {
      if (!item.children) {
        return canAccess(item.href) ? item : null;
      }
      let filteredChildren = item.children.filter((c) => canAccess(c.href));
      // Personel: "Yeni Personel" menüsünü gizle
      if (role === 'personel' && item.href === '/personeller') {
        filteredChildren = filteredChildren.filter((c) => c.href !== '/personeller/new');
      }
      // Ekip: "Tüm Ekipler" menüsünü gizle (sadece Ekip Paneli ve İş Atamaları)
      if (role === 'ekip' && item.href === '/teams') {
        filteredChildren = filteredChildren.filter((c) => c.href !== '/teams');
      }
      if (filteredChildren.length === 0) return null;
      return { ...item, children: filteredChildren };
    })
    .filter((item): item is MenuItem => item !== null);
}

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { profile } = useAuth();
  const [expandedItems, setExpandedItems] = React.useState<string[]>([]);

  // Mobilde sayfa değişince sidebar'ı kapat
  React.useEffect(() => {
    onClose?.();
  }, [pathname]);

  const menuItems = React.useMemo(() => {
    const role = (profile?.role as UserRole) || 'personel';
    return filterMenuByRole(allMenuItems, role);
  }, [profile?.role]);

  // Aktif sayfa için otomatik açılma
  React.useEffect(() => {
    const activeItem = menuItems.find(
      (item) => pathname === item.href || pathname?.startsWith(item.href + '/')
    );
    if (activeItem && activeItem.children && activeItem.children.length > 0) {
      setExpandedItems((prev) => {
        if (!prev.includes(activeItem.href)) {
          return [...prev, activeItem.href];
        }
        return prev;
      });
    }
  }, [pathname]);

  const toggleExpanded = React.useCallback((href: string) => {
    setExpandedItems((prev) => {
      const isCurrentlyExpanded = prev.includes(href);
      const newExpanded = isCurrentlyExpanded
        ? prev.filter((item) => item !== href)
        : [...prev, href];
      return newExpanded;
    });
  }, []);

  const sidebarContent = (
    <>
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Doğalgaz CRM</h1>
        <button
          type="button"
          onClick={onClose}
          className="lg:hidden p-2 -mr-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
          aria-label="Menüyü kapat"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto p-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
          const isExpanded = expandedItems.includes(item.href);
          const hasChildren = item.children && item.children.length > 0;

          return (
            <div key={item.href}>
              {hasChildren ? (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleExpanded(item.href);
                    }}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors cursor-pointer text-left',
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-200 hover:bg-gray-800 hover:text-white'
                    )}
                  >
                    <span className={isActive ? 'text-white' : 'text-gray-300'}>{item.icon}</span>
                    <span className={isActive ? 'text-white font-medium' : 'text-gray-200'}>{item.title}</span>
                    <span className="ml-auto text-gray-400 text-lg font-bold">
                      {isExpanded ? '−' : '+'}
                    </span>
                  </button>
                  {isExpanded && item.children && (
                    <div className="ml-4 mt-2 space-y-1">
                      {item.children.map((child) => {
                        const isChildActive = pathname === child.href;
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            className={cn(
                              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors',
                              isChildActive
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                            )}
                          >
                            <span className={isChildActive ? 'text-white' : 'text-gray-300'}>{child.icon}</span>
                            <span className={isChildActive ? 'text-white font-medium' : 'text-gray-200'}>{child.title}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-4 py-2 rounded-lg transition-colors cursor-pointer',
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-200 hover:bg-gray-800 hover:text-white'
                  )}
                >
                  <span className={isActive ? 'text-white' : 'text-gray-300'}>{item.icon}</span>
                  <span className={isActive ? 'text-white font-medium' : 'text-gray-200'}>{item.title}</span>
                </Link>
              )}
            </div>
          );
        })}
      </nav>
    </>
  );

  return (
    <aside
      className={cn(
        'fixed lg:static inset-y-0 left-0 z-50 w-64 flex-shrink-0 bg-gray-900 text-white h-full flex flex-col transition-transform duration-300 ease-in-out',
        'lg:translate-x-0',
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}
      style={{ minWidth: '256px' }}
    >
      {sidebarContent}
    </aside>
  );
}
