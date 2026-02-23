'use client';

import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, Mail, Phone, Edit, Loader2, User } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { formatDate } from '@/lib/utils';
import { Profile } from '@/lib/types';
import { useAuth } from '@/components/providers/auth-provider';
import { canAddUser, canSeeAdmins, canManageSettings } from '@/lib/role-permissions';

export default function PersonellerPage() {
  const { profile } = useAuth();
  const [personnel, setPersonnel] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!profile) return;
    loadPersonnel();
  }, [profile]);

  const loadPersonnel = async () => {
    if (!profile) return;
    try {
      const role = (profile.role ?? 'personel') as 'admin' | 'personel' | 'ekip';
      const roles = canSeeAdmins(role) ? ['admin', 'personel'] : ['personel'];
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('role', roles)
        .order('full_name', { ascending: true });

      if (error) throw error;

      setPersonnel(data || []);
    } catch (error: any) {
      console.error('Personeller yüklenirken hata:', error);
      alert('Personeller yüklenirken bir hata oluştu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      admin: 'Admin',
      personel: 'Personel',
    };
    return labels[role] || role;
  };

  const role = (profile?.role ?? 'personel') as 'admin' | 'personel' | 'ekip';
  const showAddButton = canAddUser(role);
  const showEditButton = canManageSettings(role);

  const filteredPersonnel = personnel.filter((p) => {
    const search = searchTerm.toLowerCase();
    return (
      p.email?.toLowerCase().includes(search) ||
      p.full_name?.toLowerCase().includes(search) ||
      p.phone?.toLowerCase().includes(search) ||
      getRoleLabel(p.role).toLowerCase().includes(search)
    );
  });

  return (
    <MainLayout>
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Personeller</h1>
            <p className="text-gray-600 sm:text-gray-700 mt-1 sm:mt-2 text-sm sm:text-base font-medium">Ofis personeli ve yöneticileri</p>
          </div>
          {showAddButton && (
            <Link href="/personeller/new" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Yeni Personel
              </Button>
            </Link>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Personel Listesi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="search"
                  placeholder="Ad, e-posta veya telefon ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-semibold">Ad Soyad</TableHead>
                  <TableHead className="font-semibold">E-posta</TableHead>
                  <TableHead className="font-semibold">Telefon</TableHead>
                  <TableHead className="font-semibold">Rol</TableHead>
                  <TableHead className="font-semibold">Durum</TableHead>
                  <TableHead className="font-semibold">Oluşturulma</TableHead>
                  <TableHead className="font-semibold">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-2" />
                      <span className="text-gray-500">Yükleniyor...</span>
                    </TableCell>
                  </TableRow>
                ) : filteredPersonnel.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-gray-500 py-12">
                      {searchTerm ? 'Arama sonucu bulunamadı.' : 'Henüz personel eklenmemiş.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPersonnel.map((person) => (
                    <TableRow key={person.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-500" />
                          <span className="font-medium">{person.full_name || 'Ad belirtilmemiş'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-500" />
                          {person.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        {person.phone ? (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-gray-500" />
                            {person.phone}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            person.role === 'admin'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {getRoleLabel(person.role)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            person.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {person.is_active ? 'Aktif' : 'Pasif'}
                        </span>
                      </TableCell>
                      <TableCell className="text-gray-600 text-sm">
                        {formatDate(person.created_at)}
                      </TableCell>
                      <TableCell>
                        {showEditButton && (
                          <Link href={`/settings/users/${person.id}/edit`}>
                            <Button variant="outline" size="sm" className="gap-2">
                              <Edit className="w-4 h-4" />
                              Düzenle
                            </Button>
                          </Link>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
