'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Loader2, FileText, Plus, User } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { formatDate, formatCurrency } from '@/lib/utils';

interface Sale {
  id: string;
  customer_id: string;
  project_id: string | null;
  customer_name: string;
  project_name: string | null;
  invoice_number: string | null;
  invoice_date: string | null;
  total_amount: number;
  discount_percentage: number;
  discount_amount: number;
  tax_amount: number;
  final_amount: number;
  payment_method: string | null;
  payment_status: string;
  status: string;
  paid_amount: number;
  remaining_amount: number | null;
  notes: string | null;
  created_at: string;
}

interface SaleItem {
  id: string;
  product_id: string;
  product_name: string;
  product_unit: string;
  quantity: number;
  unit_price: number;
  discount_percentage: number;
  discount_amount: number;
  tax_percentage: number;
  tax_amount: number;
  total_amount: number;
}

interface CustomerPayment {
  id: string;
  amount: number;
  payment_method: string;
  payment_date: string;
  reference_number: string | null;
  notes: string | null;
  created_at: string;
}

export default function SaleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const saleId = params.id as string;
  
  const [sale, setSale] = useState<Sale | null>(null);
  const [items, setItems] = useState<SaleItem[]>([]);
  const [payments, setPayments] = useState<CustomerPayment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (saleId) {
      loadSaleData();
    }
  }, [saleId]);

  const loadSaleData = async () => {
    try {
      // Satış bilgileri
      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .select(`
          *,
          customers(id, contact_person, company_name),
          customer_projects(id, project_name)
        `)
        .eq('id', saleId)
        .single();

      if (saleError) throw saleError;

      const customer = Array.isArray(saleData.customers) 
        ? saleData.customers[0] 
        : saleData.customers;
      const project = saleData.project_id && saleData.customer_projects
        ? (Array.isArray(saleData.customer_projects) 
            ? saleData.customer_projects[0] 
            : saleData.customer_projects)
        : null;

      const formattedSale: Sale = {
        id: saleData.id,
        customer_id: saleData.customer_id,
        project_id: saleData.project_id,
        customer_name: customer?.company_name || customer?.contact_person || 'Bilinmeyen Müşteri',
        project_name: project?.project_name || null,
        invoice_number: saleData.invoice_number,
        invoice_date: saleData.invoice_date,
        total_amount: saleData.total_amount,
        discount_percentage: saleData.discount_percentage,
        discount_amount: saleData.discount_amount,
        tax_amount: saleData.tax_amount,
        final_amount: saleData.final_amount,
        payment_method: saleData.payment_method,
        payment_status: saleData.payment_status,
        status: saleData.status,
        paid_amount: saleData.paid_amount,
        remaining_amount: saleData.remaining_amount,
        notes: saleData.notes,
        created_at: saleData.created_at,
      };

      setSale(formattedSale);

      // Satış kalemleri
      const { data: itemsData, error: itemsError } = await supabase
        .from('sale_items')
        .select(`
          *,
          products!inner(name, unit)
        `)
        .eq('sale_id', saleId)
        .order('created_at', { ascending: true });

      if (itemsError) throw itemsError;

      const formattedItems = (itemsData || []).map((item: any) => ({
        id: item.id,
        product_id: item.product_id,
        product_name: item.products?.name || 'Bilinmeyen Ürün',
        product_unit: item.products?.unit || 'adet',
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount_percentage: item.discount_percentage,
        discount_amount: item.discount_amount,
        tax_percentage: item.tax_percentage,
        tax_amount: item.tax_amount,
        total_amount: item.total_amount,
      }));

      setItems(formattedItems);

      // Müşteri ödemeleri
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('customer_payments')
        .select('*')
        .eq('sale_id', saleId)
        .order('payment_date', { ascending: false });

      if (paymentsError) throw paymentsError;
      setPayments(paymentsData || []);

    } catch (error: any) {
      console.error('Veri yüklenirken hata:', error);
      alert('Veri yüklenirken bir hata oluştu: ' + error.message);
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

  const getPaymentMethodLabel = (method: string | null) => {
    const methods: Record<string, string> = {
      'nakit': 'Nakit',
      'kredi_kartı': 'Kredi Kartı',
      'banka_havalesi': 'Banka Havalesi',
      'çek': 'Çek',
      'senet': 'Senet',
      'kredi_kartı_taksit': 'Kredi Kartı Taksit',
    };
    return methods[method || ''] || method || '-';
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

  if (!sale) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">Satış bulunamadı</p>
          <Button onClick={() => router.push('/accounting/sales')}>
            Satış Listesine Dön
          </Button>
        </div>
      </MainLayout>
    );
  }

  const paymentStatus = getPaymentStatusLabel(sale.payment_status);
  const jobStatus = getJobStatusLabel(sale.status);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Satış Detayı
            </h1>
            <p className="text-gray-600 mt-1">
              Müşteri: {sale.customer_name}
              {sale.project_name && ` - Proje: ${sale.project_name}`}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => router.push('/accounting/sales')}
              className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white"
            >
              <ArrowLeft className="w-4 h-4" />
              Geri Dön
            </Button>
            <Link href={`/customers/${sale.customer_id}`}>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <User className="w-4 h-4 mr-2" />
                Müşteri Detayı
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Fatura Bilgileri</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">Fatura No</div>
                    <div className="font-medium">{sale.invoice_number || '-'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Fatura Tarihi</div>
                    <div className="font-medium">
                      {sale.invoice_date ? formatDate(sale.invoice_date) : formatDate(sale.created_at)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Ödeme Şekli</div>
                    <div className="font-medium">{getPaymentMethodLabel(sale.payment_method)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Ödeme Durumu</div>
                    <div>
                      <span className={`px-2 py-1 rounded-full text-sm ${paymentStatus.color}`}>
                        {paymentStatus.label}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">İş Durumu</div>
                    <div>
                      <span className={`px-2 py-1 rounded-full text-sm ${jobStatus.color}`}>
                        {jobStatus.label}
                      </span>
                    </div>
                  </div>
                  {sale.notes && (
                    <div className="col-span-2 pt-2 border-t">
                      <div className="text-sm text-gray-500 mb-1">Notlar:</div>
                      <div className="text-sm text-gray-600">{sale.notes}</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Satış Kalemleri ({items.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {items.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p>Henüz kalem eklenmemiş</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ürün</TableHead>
                        <TableHead>Miktar</TableHead>
                        <TableHead>Birim Fiyat</TableHead>
                        <TableHead>İskonto</TableHead>
                        <TableHead>KDV (%20)</TableHead>
                        <TableHead>Toplam</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.product_name}</TableCell>
                          <TableCell>{item.quantity} {item.product_unit}</TableCell>
                          <TableCell>{formatCurrency(item.unit_price)}</TableCell>
                          <TableCell>
                            {item.discount_percentage > 0 ? (
                              <span className="text-red-600">
                                %{item.discount_percentage.toFixed(2)} ({formatCurrency(item.discount_amount)})
                              </span>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell>
                            {item.tax_amount > 0 ? formatCurrency(item.tax_amount) : '-'}
                          </TableCell>
                          <TableCell className="font-semibold">{formatCurrency(item.total_amount)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex items-center justify-between">
                <CardTitle>Ödemeler ({payments.length})</CardTitle>
                <Link href={`/accounting/sales/${saleId}/payment`}>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Ödeme Ekle
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {payments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>Henüz ödeme yapılmamış</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tarih</TableHead>
                        <TableHead>Tutar</TableHead>
                        <TableHead>Ödeme Şekli</TableHead>
                        <TableHead>Referans</TableHead>
                        <TableHead>Notlar</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>{formatDate(payment.payment_date)}</TableCell>
                          <TableCell className="font-semibold">{formatCurrency(payment.amount)}</TableCell>
                          <TableCell>{getPaymentMethodLabel(payment.payment_method)}</TableCell>
                          <TableCell>{payment.reference_number || '-'}</TableCell>
                          <TableCell>{payment.notes || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Özet</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Ara Toplam:</span>
                    <span className="font-semibold">{formatCurrency(sale.total_amount)}</span>
                  </div>
                  {sale.discount_amount > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span className="text-sm">İndirim:</span>
                      <span className="font-semibold">-{formatCurrency(sale.discount_amount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">KDV:</span>
                    <span className="font-semibold">{formatCurrency(sale.tax_amount)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-sm font-medium text-gray-700">Genel Toplam:</span>
                    <span className="font-bold text-blue-600 text-lg">
                      {formatCurrency(sale.final_amount)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-sm text-gray-500">Ödenen:</span>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(sale.paid_amount)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-sm text-gray-500">Kalan Alacak:</span>
                    <span className={`font-bold text-lg ${sale.remaining_amount && sale.remaining_amount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(sale.remaining_amount || 0)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Bilgiler</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Oluşturulma:</span>
                    <span className="text-sm">{formatDate(sale.created_at)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
