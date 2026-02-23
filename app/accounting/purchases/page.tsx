'use client';

import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, Loader2, Eye } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { formatCurrency, formatDate } from '@/lib/utils';

interface Purchase {
  id: string;
  invoice_number: string | null;
  invoice_date: string | null;
  supplier_name: string;
  final_amount: number;
  payment_status: string;
  remaining_amount: number | null;
  created_at: string;
}

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadPurchases();
  }, []);

  const loadPurchases = async () => {
    try {
      const { data, error } = await supabase
        .from('purchases')
        .select(`
          *,
          suppliers!inner(company_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedPurchases = (data || []).map((purchase: any) => ({
        id: purchase.id,
        invoice_number: purchase.invoice_number,
        invoice_date: purchase.invoice_date,
        supplier_name: purchase.suppliers?.company_name || 'Bilinmeyen Tedarikçi',
        final_amount: purchase.final_amount,
        payment_status: purchase.payment_status,
        remaining_amount: purchase.remaining_amount,
        created_at: purchase.created_at,
      }));

      setPurchases(formattedPurchases);
    } catch (error: any) {
      console.error('Satın almalar yüklenirken hata:', error);
      alert('Satın almalar yüklenirken bir hata oluştu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredPurchases = purchases.filter(purchase =>
    (purchase.invoice_number && purchase.invoice_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
    purchase.supplier_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPaymentStatusLabel = (status: string) => {
    const statuses: Record<string, { label: string; color: string }> = {
      'beklemede': { label: 'Beklemede', color: 'bg-yellow-100 text-yellow-800' },
      'kısmen_ödendi': { label: 'Kısmen Ödendi', color: 'bg-blue-100 text-blue-800' },
      'ödendi': { label: 'Ödendi', color: 'bg-green-100 text-green-800' },
    };
    return statuses[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
  };

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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Satın Almalar</h1>
            <p className="text-gray-700 mt-2 font-medium">Tedarikçilerden yapılan alımları yönetin</p>
          </div>
          <Link href="/inventory/movements/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Yeni Satın Alma
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Satın Alma Listesi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="search"
                  placeholder="Satın alma ara (fatura no, tedarikçi)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fatura No</TableHead>
                  <TableHead>Tedarikçi</TableHead>
                  <TableHead>Tarih</TableHead>
                  <TableHead>Tutar</TableHead>
                  <TableHead>Ödeme Durumu</TableHead>
                  <TableHead>Kalan Borç</TableHead>
                  <TableHead>İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPurchases.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                      {searchTerm ? 'Arama sonucu bulunamadı' : 'Henüz satın alma eklenmemiş'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPurchases.map((purchase) => {
                    const paymentStatus = getPaymentStatusLabel(purchase.payment_status);
                    return (
                      <TableRow key={purchase.id}>
                        <TableCell className="font-medium">
                          {purchase.invoice_number || '-'}
                        </TableCell>
                        <TableCell>{purchase.supplier_name}</TableCell>
                        <TableCell>
                          {purchase.invoice_date ? formatDate(purchase.invoice_date) : formatDate(purchase.created_at)}
                        </TableCell>
                        <TableCell>{formatCurrency(purchase.final_amount)}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-sm ${paymentStatus.color}`}>
                            {paymentStatus.label}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={purchase.remaining_amount && purchase.remaining_amount > 0 ? 'text-red-600 font-semibold' : 'text-green-600'}>
                            {formatCurrency(purchase.remaining_amount || 0)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Link href={`/accounting/purchases/${purchase.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4 mr-1" />
                              Detay
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
