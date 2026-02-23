'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/utils';

interface Purchase {
  id: string;
  supplier_name: string;
  final_amount: number;
  paid_amount: number;
  remaining_amount: number | null;
}

export default function AddPaymentPage() {
  const params = useParams();
  const router = useRouter();
  const purchaseId = params.id as string;
  
  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    payment_method: 'nakit' as 'nakit' | 'kredi_kartı' | 'banka_havalesi' | 'çek' | 'senet' | 'kredi_kartı_taksit',
    payment_date: new Date().toISOString().split('T')[0],
    reference_number: '',
    notes: '',
  });

  useEffect(() => {
    if (purchaseId) {
      loadPurchase();
    }
  }, [purchaseId]);

  const loadPurchase = async () => {
    try {
      const { data, error } = await supabase
        .from('purchases')
        .select(`
          *,
          suppliers!inner(company_name)
        `)
        .eq('id', purchaseId)
        .single();

      if (error) throw error;

      setPurchase({
        id: data.id,
        supplier_name: (data.suppliers as any).company_name,
        final_amount: data.final_amount,
        paid_amount: data.paid_amount,
        remaining_amount: data.remaining_amount,
      });
    } catch (error: any) {
      console.error('Satın alma yüklenirken hata:', error);
      alert('Satın alma yüklenirken bir hata oluştu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!purchase) return;

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      alert('Lütfen geçerli bir tutar girin');
      return;
    }

    const remainingAmount = purchase.remaining_amount || 0;
    if (amount > remainingAmount) {
      alert(`Ödeme tutarı kalan borçtan (${formatCurrency(remainingAmount)}) fazla olamaz!`);
      return;
    }

    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('supplier_payments')
        .insert({
          purchase_id: purchaseId,
          amount: amount,
          payment_method: formData.payment_method,
          payment_date: formData.payment_date,
          reference_number: formData.reference_number || null,
          notes: formData.notes || null,
          created_by: user?.id,
        });

      if (error) throw error;

      // Başarılı oldu, satın alma detay sayfasına yönlendir
      router.push(`/accounting/purchases/${purchaseId}`);
    } catch (error: any) {
      console.error('Ödeme eklenirken hata:', error);
      alert('Ödeme eklenirken bir hata oluştu: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    const methods: Record<string, string> = {
      'nakit': 'Nakit',
      'kredi_kartı': 'Kredi Kartı',
      'banka_havalesi': 'Banka Havalesi',
      'çek': 'Çek',
      'senet': 'Senet',
      'kredi_kartı_taksit': 'Kredi Kartı Taksit',
    };
    return methods[method] || method;
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

  const remainingAmount = purchase.remaining_amount || 0;

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Ödeme Ekle</h1>
            <p className="text-gray-600 mt-1">
              Tedarikçi: {purchase.supplier_name}
            </p>
          </div>
          <Button
            onClick={() => router.push(`/accounting/purchases/${purchaseId}`)}
            className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            Geri Dön
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Ödeme Bilgileri</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ödeme Tutarı <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      max={remainingAmount}
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      placeholder={`Maksimum: ${formatCurrency(remainingAmount)}`}
                      required
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Kalan borç: <span className="font-semibold text-red-600">{formatCurrency(remainingAmount)}</span>
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ödeme Şekli <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.payment_method}
                      onChange={(e) => setFormData({ ...formData, payment_method: e.target.value as any })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    >
                      <option value="nakit">Nakit</option>
                      <option value="kredi_kartı">Kredi Kartı</option>
                      <option value="banka_havalesi">Banka Havalesi</option>
                      <option value="çek">Çek</option>
                      <option value="senet">Senet</option>
                      <option value="kredi_kartı_taksit">Kredi Kartı Taksit</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ödeme Tarihi <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="date"
                      value={formData.payment_date}
                      onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Referans No / İşlem No
                    </label>
                    <Input
                      type="text"
                      value={formData.reference_number}
                      onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                      placeholder="Örn: Çek no, Havale no, İşlem no"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notlar
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Ödeme ile ilgili notlar"
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      type="submit"
                      disabled={saving || !formData.amount || parseFloat(formData.amount) <= 0}
                      className="flex-1"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Kaydediliyor...
                        </>
                      ) : (
                        'Ödemeyi Kaydet'
                      )}
                    </Button>
                    <Button
                      type="button"
                      className="bg-gray-500 hover:bg-gray-600 text-white"
                      onClick={() => router.push(`/accounting/purchases/${purchaseId}`)}
                    >
                      İptal
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Özet</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Toplam Tutar:</span>
                    <span className="font-semibold">{formatCurrency(purchase.final_amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Ödenen:</span>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(purchase.paid_amount)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-sm font-medium text-gray-700">Kalan Borç:</span>
                    <span className={`font-bold text-lg ${remainingAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(remainingAmount)}
                    </span>
                  </div>
                  {formData.amount && parseFloat(formData.amount) > 0 && (
                    <>
                      <div className="flex justify-between pt-2 border-t">
                        <span className="text-sm text-gray-500">Bu Ödeme:</span>
                        <span className="font-semibold text-blue-600">
                          {formatCurrency(parseFloat(formData.amount))}
                        </span>
                      </div>
                      <div className="flex justify-between pt-2 border-t">
                        <span className="text-sm font-medium text-gray-700">Yeni Kalan Borç:</span>
                        <span className={`font-bold text-lg ${remainingAmount - parseFloat(formData.amount) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {formatCurrency(Math.max(0, remainingAmount - parseFloat(formData.amount)))}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
