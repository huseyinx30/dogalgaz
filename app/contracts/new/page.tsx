'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/utils';

interface Offer {
  id: string;
  offer_number: string;
  customer_id: string;
  customer_name: string;
  project_id: string | null;
  project_name: string | null;
  final_amount: number;
}

function NewContractContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const offerId = searchParams.get('offer');
  
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(!!offerId);
  const [offer, setOffer] = useState<Offer | null>(null);
  const [approvedOffers, setApprovedOffers] = useState<Offer[]>([]);
  
  const [formData, setFormData] = useState({
    offer_id: offerId || '',
    customer_id: '',
    project_id: '',
    contract_number: '',
    contract_date: new Date().toISOString().split('T')[0],
    start_date: '',
    end_date: '',
    notes: '',
  });

  useEffect(() => {
    if (offerId) {
      loadOffer();
    } else {
      loadApprovedOffers();
    }
  }, [offerId]);

  const loadOffer = async () => {
    try {
      const { data, error } = await supabase
        .from('offers')
        .select(`
          *,
          customers!inner(contact_person, company_name),
          customer_projects(project_name)
        `)
        .eq('id', offerId)
        .eq('status', 'onaylandı')
        .single();

      if (error) throw error;

      const formattedOffer: Offer = {
        id: data.id,
        offer_number: data.offer_number,
        customer_id: data.customer_id,
        customer_name: data.customers?.company_name || data.customers?.contact_person || 'Bilinmeyen Müşteri',
        project_id: data.project_id,
        project_name: data.customer_projects?.project_name || null,
        final_amount: data.final_amount,
      };

      setOffer(formattedOffer);
      setFormData(prev => ({
        ...prev,
        offer_id: data.id,
        customer_id: data.customer_id,
        project_id: data.project_id || '',
        contract_number: `SOZ-${Date.now()}`,
      }));

      setLoadingData(false);
    } catch (error: any) {
      console.error('Teklif yüklenirken hata:', error);
      alert('Teklif yüklenirken bir hata oluştu: ' + error.message);
      setLoadingData(false);
    }
  };

  const loadApprovedOffers = async () => {
    try {
      const { data, error } = await supabase
        .from('offers')
        .select(`
          *,
          customers!inner(contact_person, company_name),
          customer_projects(project_name)
        `)
        .eq('status', 'onaylandı')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedOffers = (data || []).map((offer: any) => ({
        id: offer.id,
        offer_number: offer.offer_number,
        customer_id: offer.customer_id,
        customer_name: offer.customers?.company_name || offer.customers?.contact_person || 'Bilinmeyen Müşteri',
        project_id: offer.project_id,
        project_name: offer.customer_projects?.project_name || null,
        final_amount: offer.final_amount,
      }));

      setApprovedOffers(formattedOffers);
      setLoadingData(false);
    } catch (error: any) {
      console.error('Onaylanmış teklifler yüklenirken hata:', error);
      setLoadingData(false);
    }
  };

  const handleOfferSelect = (selectedOfferId: string) => {
    const selectedOffer = approvedOffers.find(o => o.id === selectedOfferId);
    if (selectedOffer) {
      setOffer(selectedOffer);
      setFormData(prev => ({
        ...prev,
        offer_id: selectedOffer.id,
        customer_id: selectedOffer.customer_id,
        project_id: selectedOffer.project_id || '',
        contract_number: `SOZ-${Date.now()}`,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.offer_id || !formData.customer_id) {
      alert('Lütfen teklif seçin');
      return;
    }

    if (!formData.contract_number || !formData.contract_date) {
      alert('Lütfen sözleşme numarası ve tarihini girin');
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('contracts')
        .insert({
          offer_id: formData.offer_id,
          customer_id: formData.customer_id,
          project_id: formData.project_id || null,
          contract_number: formData.contract_number,
          contract_date: formData.contract_date,
          start_date: formData.start_date || null,
          end_date: formData.end_date || null,
          total_amount: offer?.final_amount || 0,
          status: 'taslak',
          notes: formData.notes || null,
          created_by: user?.id,
        });

      if (error) throw error;

      router.push('/contracts');
    } catch (error: any) {
      console.error('Sözleşme oluşturulurken hata:', error);
      alert('Sözleşme oluşturulurken bir hata oluştu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
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
            <h1 className="text-3xl font-bold text-gray-900">Yeni Sözleşme</h1>
            <p className="text-gray-700 mt-2 font-medium">Onaylanmış tekliften sözleşme oluşturun</p>
          </div>
          <Button
            onClick={() => router.push('/contracts')}
            className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            Geri Dön
          </Button>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Sözleşme Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!offerId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teklif Seç <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.offer_id}
                    onChange={(e) => handleOfferSelect(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  >
                    <option value="">Onaylanmış teklif seçin</option>
                    {approvedOffers.map((offer) => (
                      <option key={offer.id} value={offer.id}>
                        {offer.offer_number} - {offer.customer_name} - {formatCurrency(offer.final_amount)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {offer && (
                <div className="p-4 bg-blue-50 rounded-md border border-blue-200">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-500">Teklif No</div>
                      <div className="font-medium">{offer.offer_number}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Müşteri</div>
                      <div className="font-medium">{offer.customer_name}</div>
                    </div>
                    {offer.project_name && (
                      <div>
                        <div className="text-sm text-gray-500">Proje</div>
                        <div className="font-medium">{offer.project_name}</div>
                      </div>
                    )}
                    <div>
                      <div className="text-sm text-gray-500">Teklif Tutarı</div>
                      <div className="font-medium text-blue-600">{formatCurrency(offer.final_amount)}</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sözleşme No <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={formData.contract_number}
                    onChange={(e) => setFormData({ ...formData, contract_number: e.target.value })}
                    required
                    placeholder="SOZ-2026-001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sözleşme Tarihi <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="date"
                    value={formData.contract_date}
                    onChange={(e) => setFormData({ ...formData, contract_date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Başlangıç Tarihi
                  </label>
                  <Input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bitiş Tarihi
                  </label>
                  <Input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notlar
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Sözleşme notları"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button type="submit" disabled={loading || !formData.offer_id}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Kaydediliyor...
                </>
              ) : (
                'Kaydet'
              )}
            </Button>
            <Button
              type="button"
              className="bg-gray-500 hover:bg-gray-600 text-white"
              onClick={() => router.push('/contracts')}
            >
              İptal
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}

export default function NewContractPage() {
  return (
    <Suspense fallback={<MainLayout><div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div></MainLayout>}>
      <NewContractContent />
    </Suspense>
  );
}
