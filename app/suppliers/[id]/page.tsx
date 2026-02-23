'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Phone, Mail, MapPin, Edit, ArrowLeft, FileText, Loader2, Plus } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { formatDate, formatCurrency } from '@/lib/utils';

interface Supplier {
  id: string;
  company_name: string;
  contact_person: string | null;
  email: string | null;
  phone: string;
  tax_number: string | null;
  tax_office: string | null;
  address: string | null;
  city: string | null;
  district: string | null;
  postal_code: string | null;
  notes: string | null;
  created_at: string;
}

interface Purchase {
  id: string;
  invoice_number: string | null;
  invoice_date: string | null;
  final_amount: number;
  payment_status: string;
  remaining_amount: number | null;
  created_at: string;
}

export default function SupplierDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supplierId = params.id as string;
  
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (supplierId) {
      loadSupplierData();
    }
  }, [supplierId]);

  const loadSupplierData = async () => {
    try {
      // Tedarikçi bilgileri
      const { data: supplierData, error: supplierError } = await supabase
        .from('suppliers')
        .select('*')
        .eq('id', supplierId)
        .single();

      if (supplierError) throw supplierError;
      setSupplier(supplierData);

      // Satın almalar
      const { data: purchasesData, error: purchasesError } = await supabase
        .from('purchases')
        .select('*')
        .eq('supplier_id', supplierId)
        .order('created_at', { ascending: false });

      if (purchasesError) throw purchasesError;
      setPurchases(purchasesData || []);

    } catch (error: any) {
      console.error('Veri yüklenirken hata:', error);
      alert('Veri yüklenirken bir hata oluştu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getAddress = () => {
    if (!supplier) return '';
    const parts = [supplier.address, supplier.district, supplier.city].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'Adres bilgisi yok';
  };

  const getPaymentStatusLabel = (status: string) => {
    const statuses: Record<string, { label: string; color: string }> = {
      'beklemede': { label: 'Beklemede', color: 'bg-yellow-100 text-yellow-800' },
      'kısmen_ödendi': { label: 'Kısmen Ödendi', color: 'bg-blue-100 text-blue-800' },
      'ödendi': { label: 'Ödendi', color: 'bg-green-100 text-green-800' },
    };
    return statuses[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
  };

  const totalDebt = purchases.reduce((sum, purchase) => sum + (purchase.remaining_amount || 0), 0);

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

  if (!supplier) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">Tedarikçi bulunamadı</p>
          <Button onClick={() => router.push('/suppliers')}>
            Tedarikçi Listesine Dön
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{supplier.company_name}</h1>
            {supplier.contact_person && (
              <p className="text-gray-600 mt-1">İletişim: {supplier.contact_person}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => router.push('/suppliers')}
              className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white"
            >
              <ArrowLeft className="w-4 h-4" />
              Geri Dön
            </Button>
            <Link href={`/suppliers/${supplierId}/edit`}>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Edit className="w-4 h-4 mr-2" />
                Düzenle
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Tedarikçi Bilgileri</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {supplier.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <a href={`tel:${supplier.phone}`} className="hover:text-blue-600">
                        {supplier.phone}
                      </a>
                    </div>
                  )}
                  {supplier.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <a href={`mailto:${supplier.email}`} className="hover:text-blue-600">
                        {supplier.email}
                      </a>
                    </div>
                  )}
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                    <div>
                      <div>{getAddress()}</div>
                      {supplier.postal_code && (
                        <div className="text-sm text-gray-500">Posta Kodu: {supplier.postal_code}</div>
                      )}
                    </div>
                  </div>
                  {(supplier.tax_number || supplier.tax_office) && (
                    <div className="pt-2 border-t">
                      {supplier.tax_number && (
                        <div className="text-sm text-gray-500">Vergi No: {supplier.tax_number}</div>
                      )}
                      {supplier.tax_office && (
                        <div className="text-sm text-gray-500">Vergi Dairesi: {supplier.tax_office}</div>
                      )}
                    </div>
                  )}
                  {supplier.notes && (
                    <div className="pt-2 border-t">
                      <div className="text-sm font-medium mb-1">Notlar:</div>
                      <div className="text-sm text-gray-600">{supplier.notes}</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex items-center justify-between">
                <CardTitle>Satın Almalar ({purchases.length})</CardTitle>
                <Link href={`/inventory/movements/new?supplier=${supplierId}`}>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Yeni Satın Alma
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {purchases.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p>Henüz satın alma yapılmamış</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fatura No</TableHead>
                        <TableHead>Tarih</TableHead>
                        <TableHead>Tutar</TableHead>
                        <TableHead>Ödeme Durumu</TableHead>
                        <TableHead>Kalan Borç</TableHead>
                        <TableHead>İşlemler</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {purchases.map((purchase) => {
                        const paymentStatus = getPaymentStatusLabel(purchase.payment_status);
                        return (
                          <TableRow key={purchase.id}>
                            <TableCell className="font-medium">
                              {purchase.invoice_number || '-'}
                            </TableCell>
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
                                <Button variant="ghost" size="sm">Detay</Button>
                              </Link>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Özet Bilgiler</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Toplam Satın Alma:</span>
                    <span className="font-semibold">{purchases.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Toplam Tutar:</span>
                    <span className="font-semibold">
                      {formatCurrency(purchases.reduce((sum, p) => sum + p.final_amount, 0))}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-sm text-gray-500">Toplam Borç:</span>
                    <span className="font-semibold text-red-600">
                      {formatCurrency(totalDebt)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-sm text-gray-500">Kayıt Tarihi:</span>
                    <span className="text-sm">{formatDate(supplier.created_at)}</span>
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
