import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';
import { Settings, Users, Shield } from 'lucide-react';

export default function SettingsPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ayarlar</h1>
          <p className="text-gray-700 mt-2 font-medium">Sistem ayarlarını yönetin</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/settings/general">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <Settings className="w-8 h-8 text-blue-600 mb-2" />
                <CardTitle>Genel Ayarlar</CardTitle>
                <CardDescription>
                  Sistem genel ayarlarını yönetin
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/settings/permissions">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <Shield className="w-8 h-8 text-blue-600 mb-2" />
                <CardTitle>Yetki Ayarları</CardTitle>
                <CardDescription>
                  Rol ve yetki ayarlarını yönetin
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/settings/users">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <Users className="w-8 h-8 text-blue-600 mb-2" />
                <CardTitle>Kullanıcılar</CardTitle>
                <CardDescription>
                  Kullanıcı hesaplarını yönetin
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </div>
    </MainLayout>
  );
}

