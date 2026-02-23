'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, Loader2, Edit, Eye, Phone, Mail } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/utils';

interface Supplier {
  id: string;
  company_name: string;
  contact_person: string | null;
  email: string | null;
  phone: string;
  city: string | null;
  district: string | null;
  created_at: string;
  total_debt?: number;
}

export default function SuppliersPage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('id, company_name, contact_person, email, phone, city, district, created_at')
        .order('company_name', { ascending: true });

      if (error) throw error;

      // Her tedarikçi için borç bakiyesini hesapla
      const suppliersWithDebt = await Promise.all(
        (data || []).map(async (supplier) => {
          const { data: purchasesData, error: purchasesError } = await supabase
            .from('purchases')
            .select('remaining_amount')
            .eq('supplier_id', supplier.id);

          if (purchasesError) {
            console.error('Borç bakiyesi hesaplanırken hata:', purchasesError);
            return { ...supplier, total_debt: 0 };
          }

          const totalDebt = (purchasesData || []).reduce(
            (sum, purchase) => sum + (purchase.remaining_amount || 0),
            0
          );

          return { ...supplier, total_debt: totalDebt };
        })
      );

      setSuppliers(suppliersWithDebt);
    } catch (error: any) {
      console.error('Tedarikçiler yüklenirken hata:', error);
      alert('Tedarikçiler yüklenirken bir hata oluştu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (supplier.contact_person && supplier.contact_person.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (supplier.phone && supplier.phone.includes(searchTerm))
  );

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Yükleniyor...</span>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Tedarikçiler</h1>
            <p className="text-gray-600 sm:text-gray-700 mt-1 sm:mt-2 text-sm sm:text-base font-medium">Tedarikçi bilgilerini yönetin</p>
          </div>
          <Link href="/suppliers/new" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Yeni Tedarikçi
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Tedarikçi Listesi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="search"
                  placeholder="Tedarikçi ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Mobil: Kart görünümü */}
            <div className="md:hidden space-y-3">
              {filteredSuppliers.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  {searchTerm ? 'Arama sonucu bulunamadı' : 'Henüz tedarikçi eklenmemiş'}
                </p>
              ) : (
                filteredSuppliers.map((supplier) => (
                  <div
                    key={supplier.id}
                    className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-gray-900 truncate">{supplier.company_name}</div>
                        {supplier.contact_person && (
                          <div className="text-sm text-gray-500 truncate">{supplier.contact_person}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Link href={`/suppliers/${supplier.id}`}>
                          <Button variant="ghost" size="icon" title="Detay">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Link href={`/suppliers/${supplier.id}/edit`}>
                          <Button variant="ghost" size="icon" title="Düzenle">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                    {supplier.phone && (
                      <a href={`tel:${supplier.phone}`} className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                        <Phone className="w-3 h-3" />
                        {supplier.phone}
                      </a>
                    )}
                    {supplier.email && (
                      <a href={`mailto:${supplier.email}`} className="flex items-center gap-2 text-sm text-blue-600 hover:underline truncate mt-0.5">
                        <Mail className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{supplier.email}</span>
                      </a>
                    )}
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                      <span className="text-sm text-gray-600">
                        {[supplier.district, supplier.city].filter(Boolean).join(', ') || '-'}
                      </span>
                      <span className={supplier.total_debt && supplier.total_debt > 0 ? 'text-red-600 font-semibold' : 'text-green-600'}>
                        {formatCurrency(supplier.total_debt || 0)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Masaüstü: Tablo görünümü */}
            <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Firma Adı</TableHead>
                  <TableHead>İletişim Kişisi</TableHead>
                  <TableHead>Telefon</TableHead>
                  <TableHead>Adres</TableHead>
                  <TableHead>Borç Bakiye</TableHead>
                  <TableHead>İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSuppliers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                      {searchTerm ? 'Arama sonucu bulunamadı' : 'Henüz tedarikçi eklenmemiş'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSuppliers.map((supplier) => (
                    <TableRow key={supplier.id}>
                      <TableCell className="font-medium">{supplier.company_name}</TableCell>
                      <TableCell>{supplier.contact_person || '-'}</TableCell>
                      <TableCell>{supplier.phone}</TableCell>
                      <TableCell>
                        {[supplier.district, supplier.city].filter(Boolean).join(', ') || '-'}
                      </TableCell>
                      <TableCell>
                        <span className={supplier.total_debt && supplier.total_debt > 0 ? 'text-red-600 font-semibold' : 'text-green-600'}>
                          {formatCurrency(supplier.total_debt || 0)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Link href={`/suppliers/${supplier.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4 mr-1" />
                              Detay
                            </Button>
                          </Link>
                          <Link href={`/suppliers/${supplier.id}/edit`}>
                            <Button variant="ghost" size="sm">
                              <Edit className="w-4 h-4 mr-1" />
                              Düzenle
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
