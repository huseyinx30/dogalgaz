'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Search, User, LogOut, ChevronDown, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/components/providers/auth-provider';
import { formatDate } from '@/lib/utils';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userProfile, setUserProfile] = useState<{ id: string; full_name: string | null; email: string } | null>(null);
  const [companyName, setCompanyName] = useState<string>('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadNotifications();
    loadUserProfile();
    loadCompanyName();
  }, []);

  const loadCompanyName = async () => {
    try {
      const { data } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'company_name')
        .single();
      if (data?.value) {
        setCompanyName(String(data.value));
      }
    } catch {
      // Firma adı yoksa sessizce geç
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { profile: authProfile, signOut: authSignOut } = useAuth();

  useEffect(() => {
    if (authProfile) {
      setUserProfile({ id: authProfile.id, full_name: authProfile.full_name, email: authProfile.email });
    } else {
      loadUserProfile();
    }
  }, [authProfile]);

  const loadUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('id', user.id)
        .single();
      if (data) {
        setUserProfile(data);
      } else {
        setUserProfile({ id: user.id, full_name: null, email: user.email || '' });
      }
    } catch (err) {
      console.error('Profil yüklenirken hata:', err);
    }
  };

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      const notifs = (data || []) as Notification[];
      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.is_read).length);
    } catch (error: any) {
      console.error('Bildirimler yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setSigningOut(true);
      await authSignOut();
    } catch (error) {
      console.error('Çıkış yapılırken hata:', error);
      setSigningOut(false);
      alert('Çıkış yapılırken bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  const toggleNotifications = () => {
    setNotificationsOpen(!notificationsOpen);
    if (!notificationsOpen) {
      loadNotifications();
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 px-3 sm:px-6 py-2 sm:py-3 shadow-sm relative z-50">
      <div className="flex items-center justify-between gap-2 sm:gap-4">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={onMenuClick}
            className="lg:hidden p-2 -ml-1 rounded-lg hover:bg-gray-100 text-gray-700 flex-shrink-0"
            aria-label="Menüyü aç"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="shrink-0 min-w-0 max-w-[120px] sm:max-w-none sm:min-w-[140px] px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-gray-50 border border-gray-200">
            <p className="text-xs sm:text-sm font-bold text-gray-800 truncate" title={companyName || undefined}>
              {companyName || 'Doğalgaz CRM'}
            </p>
          </div>
        </div>
        <div className="hidden sm:flex flex-1 max-w-xl min-w-0">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 w-5 h-5" />
            <Input
              type="search"
              placeholder="Ara..."
              className="pl-10 text-gray-900 placeholder:text-gray-500 w-full"
            />
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-4">
          <div className="relative" ref={dropdownRef}>
            <Button
              variant="ghost"
              size="icon"
              className="relative hover:bg-gray-100"
              onClick={toggleNotifications}
            >
              <Bell className="w-5 h-5 text-gray-700" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </Button>
            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] max-w-80 sm:w-80 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50">
                <div className="p-3 border-b border-gray-200 bg-gray-50">
                  <h3 className="text-sm font-semibold text-gray-900">Bildirimler</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {loading ? (
                    <div className="p-4 text-center text-sm text-gray-500">
                      Yükleniyor...
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="p-4 text-center text-sm text-gray-500">
                      Henüz bildirim yok
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {notifications.map((n) => (
                        <div
                          key={n.id}
                          className="p-3 hover:bg-gray-50 transition-colors cursor-pointer"
                          onClick={() => router.push('/notifications')}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-semibold text-gray-900 truncate">
                                  {n.title}
                                </span>
                                {!n.is_read && (
                                  <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-[10px] font-medium flex-shrink-0">
                                    Yeni
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-600 line-clamp-2">{n.message}</p>
                              <p className="text-[10px] text-gray-400 mt-1">
                                {formatDate(n.created_at)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="p-3 border-t border-gray-200 bg-gray-50">
                  <Button
                    size="sm"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => {
                      setNotificationsOpen(false);
                      router.push('/notifications');
                    }}
                  >
                    Tüm Bildirimler
                  </Button>
                </div>
              </div>
            )}
          </div>
          <div className="relative flex items-center gap-2" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg hover:bg-gray-100 transition-colors min-w-0"
            >
              <span className="hidden sm:inline text-sm font-medium text-gray-700 max-w-[100px] sm:max-w-[140px] truncate">
                {userProfile?.full_name || userProfile?.email || 'Kullanıcı'}
              </span>
              <User className="w-5 h-5 text-gray-700 flex-shrink-0" />
              <ChevronDown className={`hidden sm:block w-4 h-4 text-gray-500 transition-transform flex-shrink-0 ${userMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-64 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50">
                <div className="p-4 border-b border-gray-100 bg-gray-50">
                  <p className="font-medium text-gray-900 truncate">
                    {userProfile?.full_name || userProfile?.email || 'Kullanıcı'}
                  </p>
                  <p className="text-sm text-gray-500 truncate mt-0.5">
                    {userProfile?.email}
                  </p>
                </div>
                <div className="py-1">
                  {userProfile && (
                    <Link
                      href="/profil"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <User className="w-4 h-4" />
                      Profil Düzenle
                    </Link>
                  )}
                </div>
                <div className="border-t border-gray-100 p-1">
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      handleSignOut();
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors rounded"
                    disabled={signingOut}
                  >
                    <LogOut className="w-4 h-4" />
                    Çıkış Yap
                  </button>
                </div>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            className="hidden sm:flex hover:bg-gray-100"
            disabled={signingOut}
            title="Çıkış Yap"
          >
            <LogOut className="w-5 h-5 text-gray-700" />
          </Button>
        </div>
      </div>
    </header>
  );
}
