'use client';

import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { formatDate } from '@/lib/utils';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setNotifications((data || []) as Notification[]);
    } catch (error: any) {
      console.error('Bildirimler yüklenirken hata:', error);
      alert('Bildirimler yüklenirken bir hata oluştu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-600" />
            Bildirimler
          </h1>
          <span className="text-xs text-gray-500">
            Son 50 bildirim gösteriliyor
          </span>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Sistem Bildirimleri</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <p className="text-xs text-gray-500">Yükleniyor...</p>
            ) : notifications.length === 0 ? (
              <p className="text-xs text-gray-500">
                Henüz bir bildirim bulunmuyor.
              </p>
            ) : (
              <ul className="space-y-2">
                {notifications.map((n) => (
                  <li
                    key={n.id}
                    className="flex items-start justify-between rounded-md border border-gray-100 bg-white px-3 py-2 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-semibold text-gray-900">
                          {n.title}
                        </span>
                        {!n.is_read && (
                          <span className="bg-blue-100 text-blue-700 border-none px-1.5 py-0.5 rounded text-[10px] font-medium">
                            Yeni
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600">{n.message}</p>
                    </div>
                    <span className="text-[10px] text-gray-400 ml-4 whitespace-nowrap">
                      {formatDate(n.created_at)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

