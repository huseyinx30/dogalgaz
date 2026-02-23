'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, Eye, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency, formatDate } from '@/lib/utils';
import { supabase } from '@/lib/supabase/client';

interface Sale {
  id: string;
  invoice_number: string | null;
  invoice_date: string | null;
  customer_name: string;
  project_name: string | null;
  total_amount: number;
  final_amount: number;
  payment_status: string;
  status: string;
  paid_amount: number;
  remaining_amount: number | null;
  created_at: string;
}

export default function SalesPage() {
  const router = useRouter();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = async () => {
    try {
      // Önce tüm satışları yükle
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('*')
        .order('created_at', { ascending: false });

      if (salesError) {
        console.error('Satışlar yüklenirken hata:', salesError);
        throw salesError;
      }

      console.log('Yüklenen satışlar (ham):', salesData);

      if (!salesData || salesData.length === 0) {
        console.log('Veritabanında satış kaydı bulunamadı');
        setSales([]);
        setLoading(false);
        return;
      }

      // Müşteri ve proje bilgilerini ayrı ayrı yükle
      const customerIds = [...new Set(salesData.map(s => s.customer_id).filter(Boolean))];
      const projectIds = [...new Set(salesData.map(s => s.project_id).filter(Boolean))];

      const [customersResult, projectsResult] = await Promise.all([
        customerIds.length > 0
          ? supabase
              .from('customers')
              .select('id, contact_person, company_name')
              .in('id', customerIds)
          : Promise.resolve({ data: [], error: null }),
        projectIds.length > 0
          ? supabase
              .from('customer_projects')
              .select('id, project_name')
              .in('id', projectIds)
          : Promise.resolve({ data: [], error: null }),
      ]);

      if (customersResult.error) {
        console.error('Müşteriler yüklenirken hata:', customersResult.error);
      }
      if (projectsResult.error) {
        console.error('Projeler yüklenirken hata:', projectsResult.error);
      }

      const customersMap = new Map(
        (customersResult.data || []).map((c: any) => [c.id, c])
      );
      const projectsMap = new Map(
        (projectsResult.data || []).map((p: any) => [p.id, p])
      );

      const formattedSales = salesData.map((sale: any) => {
        const customer = customersMap.get(sale.customer_id);
        const project = sale.project_id ? projectsMap.get(sale.project_id) : null;

        return {
          id: sale.id,
          invoice_number: sale.invoice_number,
          invoice_date: sale.invoice_date,
          customer_name: customer?.company_name || customer?.contact_person || 'Bilinmeyen Müşteri',
          project_name: project?.project_name || null,
          total_amount: sale.total_amount,
          final_amount: sale.final_amount,
          payment_status: sale.payment_status,
          status: sale.status,
          paid_amount: sale.paid_amount,
          remaining_amount: sale.remaining_amount,
          created_at: sale.created_at,
        };
      });

      console.log('Formatlanmış satışlar:', formattedSales);
      setSales(formattedSales);
    } catch (error: any) {
      console.error('Satışlar yüklenirken hata:', error);
      alert('Satışlar yüklenirken bir hata oluştu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getPaymentStatusLabel = (status: string) => {
    const statuses: Record<string, { label: string; color: string }> = {
      'beklemede': { label: 'Beklemede', color: 'bg-yellow-100 text-yellow-800' },
      'kısmen_ödendi': { label: 'Kısmen Ödendi', color: 'bg-blue-100 text-blue-800' },
      'ödendi': { label: 'Ödendi', color: 'bg-green-100 text-green-800' },
    };
    return statuses[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
  };

  const getJobStatusLabel = (status: string) => {
    const statuses: Record<string, { label: string; color: string }> = {
      'satıldı': { label: 'Satıldı', color: 'bg-blue-100 text-blue-800' },
      'planlandı': { label: 'Planlandı', color: 'bg-purple-100 text-purple-800' },
      'devam_ediyor': { label: 'Devam Ediyor', color: 'bg-yellow-100 text-yellow-800' },
      'tamamlandı': { label: 'Tamamlandı', color: 'bg-green-100 text-green-800' },
      'iptal': { label: 'İptal', color: 'bg-red-100 text-red-800' },
    };
    return statuses[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
  };

  const filteredSales = sales.filter(sale => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      sale.invoice_number?.toLowerCase().includes(searchLower) ||
      sale.customer_name.toLowerCase().includes(searchLower) ||
      sale.project_name?.toLowerCase().includes(searchLower)
    );
  });

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
            <h1 className="text-3xl font-bold text-gray-900">Satışlar</h1>
            <p className="text-gray-700 mt-2 font-medium">Müşteri satışlarını yönetin</p>
          </div>
          <Link href="/accounting/sales/new">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Yeni Satış
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Satış Listesi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="search"
                  placeholder="Fatura no, müşteri veya proje ara..."
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
                  <TableHead>Müşteri</TableHead>
                  <TableHead>Proje</TableHead>
                  <TableHead>Tarih</TableHead>
                  <TableHead>Tutar</TableHead>
                  <TableHead>Ödenen</TableHead>
                  <TableHead>Kalan</TableHead>
                  <TableHead>Ödeme Durumu</TableHead>
                  <TableHead>İş Durumu</TableHead>
                  <TableHead>İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSales.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-gray-500 py-8">
                      {searchTerm ? 'Arama sonucu bulunamadı' : 'Henüz satış eklenmemiş'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSales.map((sale) => {
                    const paymentStatus = getPaymentStatusLabel(sale.payment_status);
                    const jobStatus = getJobStatusLabel(sale.status);
                    
                    return (
                      <TableRow key={sale.id}>
                        <TableCell className="font-medium">
                          {sale.invoice_number || '-'}
                        </TableCell>
                        <TableCell>{sale.customer_name}</TableCell>
                        <TableCell>{sale.project_name || '-'}</TableCell>
                        <TableCell>
                          {sale.invoice_date ? formatDate(sale.invoice_date) : formatDate(sale.created_at)}
                        </TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency(sale.final_amount)}
                        </TableCell>
                        <TableCell>{formatCurrency(sale.paid_amount)}</TableCell>
                        <TableCell className={sale.remaining_amount && sale.remaining_amount > 0 ? 'text-red-600 font-semibold' : ''}>
                          {formatCurrency(sale.remaining_amount || 0)}
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${paymentStatus.color}`}>
                            {paymentStatus.label}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${jobStatus.color}`}>
                            {jobStatus.label}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/accounting/sales/${sale.id}`)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Detay
                          </Button>
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
