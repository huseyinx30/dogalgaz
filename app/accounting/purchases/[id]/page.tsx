'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Loader2, FileText, Plus } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { formatDate, formatCurrency } from '@/lib/utils';

interface Purchase {
  id: string;
  supplier_id: string;
  supplier_name: string;
  invoice_number: string | null;
  invoice_date: string | null;
  total_amount: number;
  discount_percentage: number;
  discount_amount: number;
  tax_amount: number;
  final_amount: number;
  payment_method: string | null;
  payment_status: string;
  paid_amount: number;
  remaining_amount: number | null;
  notes: string | null;
  created_at: string;
}

interface PurchaseItem {
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

interface SupplierPayment {
  id: string;
  amount: number;
  payment_method: string;
  payment_date: string;
  reference_number: string | null;
  notes: string | null;
  created_at: string;
}

export default function PurchaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const purchaseId = params.id as string;
  
  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [payments, setPayments] = useState<SupplierPayment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (purchaseId) {
      loadPurchaseData();
    }
  }, [purchaseId]);

  const loadPurchaseData = async () => {
    try {
      // Satın alma bilgileri
      const { data: purchaseData, error: purchaseError } = await supabase
        .from('purchases')
        .select(`
          *,
          suppliers!inner(company_name)
        `)
        .eq('id', purchaseId)
        .single();

      if (purchaseError) throw purchaseError;

      const formattedPurchase: Purchase = {
        id: purchaseData.id,
        supplier_id: purchaseData.supplier_id,
        supplier_name: (purchaseData.suppliers as any).company_name,
        invoice_number: purchaseData.invoice_number,
        invoice_date: purchaseData.invoice_date,
        total_amount: purchaseData.total_amount,
        discount_percentage: purchaseData.discount_percentage,
        discount_amount: purchaseData.discount_amount,
        tax_amount: purchaseData.tax_amount,
        final_amount: purchaseData.final_amount,
        payment_method: purchaseData.payment_method,
        payment_status: purchaseData.payment_status,
        paid_amount: purchaseData.paid_amount,
        remaining_amount: purchaseData.remaining_amount,
        notes: purchaseData.notes,
        created_at: purchaseData.created_at,
      };

      setPurchase(formattedPurchase);

      // Satın alma kalemleri
      const { data: itemsData, error: itemsError } = await supabase
        .from('purchase_items')
        .select(`
          *,
          products!inner(name, unit)
        `)
        .eq('purchase_id', purchaseId)
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

      // Ödemeler
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('supplier_payments')
        .select('*')
        .eq('purchase_id', purchaseId)
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

  if (!purchase) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">Satın alma bulunamadı</p>
          <Button onClick={() => router.push('/accounting/purchases')}>
            Satın Alma Listesine Dön
          </Button>
        </div>
      </MainLayout>
    );
  }

  const paymentStatus = getPaymentStatusLabel(purchase.payment_status);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Satın Alma Detayı
            </h1>
            <p className="text-gray-600 mt-1">
              Tedarikçi: {purchase.supplier_name}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => router.push('/accounting/purchases')}
              className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white"
            >
              <ArrowLeft className="w-4 h-4" />
              Geri Dön
            </Button>
            <Link href={`/suppliers/${purchase.supplier_id}`}>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                Tedarikçi Detayı
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
                    <div className="font-medium">{purchase.invoice_number || '-'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Fatura Tarihi</div>
                    <div className="font-medium">
                      {purchase.invoice_date ? formatDate(purchase.invoice_date) : formatDate(purchase.created_at)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Ödeme Şekli</div>
                    <div className="font-medium">{getPaymentMethodLabel(purchase.payment_method)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Ödeme Durumu</div>
                    <div>
                      <span className={`px-2 py-1 rounded-full text-sm ${paymentStatus.color}`}>
                        {paymentStatus.label}
                      </span>
                    </div>
                  </div>
                  {purchase.notes && (
                    <div className="col-span-2 pt-2 border-t">
                      <div className="text-sm text-gray-500 mb-1">Notlar:</div>
                      <div className="text-sm text-gray-600">{purchase.notes}</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Satın Alma Kalemleri ({items.length})</CardTitle>
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
                        <TableHead>KDV</TableHead>
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
                            {item.tax_percentage > 0 ? (
                              <span>
                                %{item.tax_percentage.toFixed(2)} ({formatCurrency(item.tax_amount)})
                              </span>
                            ) : (
                              '-'
                            )}
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
                <Link href={`/accounting/purchases/${purchaseId}/payment`}>
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
                    <span className="font-semibold">{formatCurrency(purchase.total_amount)}</span>
                  </div>
                  {purchase.discount_amount > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span className="text-sm">İndirim:</span>
                      <span className="font-semibold">-{formatCurrency(purchase.discount_amount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">KDV:</span>
                    <span className="font-semibold">{formatCurrency(purchase.tax_amount)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-sm font-medium text-gray-700">Genel Toplam:</span>
                    <span className="font-bold text-blue-600 text-lg">
                      {formatCurrency(purchase.final_amount)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-sm text-gray-500">Ödenen:</span>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(purchase.paid_amount)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-sm text-gray-500">Kalan Borç:</span>
                    <span className={`font-bold text-lg ${purchase.remaining_amount && purchase.remaining_amount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(purchase.remaining_amount || 0)}
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
                    <span className="text-sm">{formatDate(purchase.created_at)}</span>
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
