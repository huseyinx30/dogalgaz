'use client';

import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, Loader2, Eye, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { formatCurrency, formatDate } from '@/lib/utils';

interface Offer {
  id: string;
  offer_number: string;
  offer_date: string;
  valid_until: string | null;
  customer_name: string;
  project_name: string | null;
  final_amount: number;
  status: string;
  created_at: string;
}

export default function OffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadOffers();
  }, []);

  const loadOffers = async () => {
    try {
      const { data, error } = await supabase
        .from('offers')
        .select(`
          *,
          customers!inner(contact_person, company_name),
          customer_projects(project_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedOffers = (data || []).map((offer: any) => ({
        id: offer.id,
        offer_number: offer.offer_number,
        offer_date: offer.offer_date,
        valid_until: offer.valid_until,
        customer_name: offer.customers?.company_name || offer.customers?.contact_person || 'Bilinmeyen Müşteri',
        project_name: offer.customer_projects?.project_name || null,
        final_amount: offer.final_amount,
        status: offer.status,
        created_at: offer.created_at,
      }));

      setOffers(formattedOffers);
    } catch (error: any) {
      console.error('Teklifler yüklenirken hata:', error);
      alert('Teklifler yüklenirken bir hata oluştu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateOfferStatus = async (offerId: string, newStatus: string) => {
    try {
      // Teklif durumunu güncelle
      const { error } = await supabase
        .from('offers')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', offerId);

      if (error) throw error;

      // Eğer onaylandıysa, otomatik olarak satış oluştur
      if (newStatus === 'onaylandı') {
        await createSaleFromOffer(offerId);
        alert('Teklif onaylandı ve satış kaydı oluşturuldu!');
      }

      await loadOffers();
    } catch (error: any) {
      console.error('Teklif durumu güncellenirken hata:', error);
      alert('Teklif durumu güncellenirken bir hata oluştu: ' + error.message);
    }
  };

  const createSaleFromOffer = async (offerId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Teklif bilgilerini al
      const { data: offerData, error: offerError } = await supabase
        .from('offers')
        .select('*')
        .eq('id', offerId)
        .single();

      if (offerError) throw offerError;

      // Mevcut satış kaydı var mı kontrol et (notlarında teklif numarasına göre)
      const { data: existingSales } = await supabase
        .from('sales')
        .select('id, notes')
        .eq('customer_id', offerData.customer_id)
        .ilike('notes', `%Teklif No: ${offerData.offer_number}%`);

      if (existingSales && existingSales.length > 0) {
        console.log('Bu teklif için zaten bir satış kaydı mevcut');
        return false;
      }

      // Teklif kalemlerini al
      const { data: offerItems, error: itemsError } = await supabase
        .from('offer_items')
        .select('*')
        .eq('offer_id', offerId);

      if (itemsError) throw itemsError;

      if (!offerItems || offerItems.length === 0) {
        console.log('Teklif kalemleri bulunamadı');
        return;
      }

      // Satış kaydı oluştur
      const invoiceNumber = `SAT-${Date.now()}`;
      const today = new Date().toISOString().split('T')[0];

      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .insert({
          contract_id: null,
          customer_id: offerData.customer_id,
          project_id: offerData.project_id || null,
          invoice_number: invoiceNumber,
          invoice_date: today,
          total_amount: offerData.total_amount,
          discount_percentage: offerData.discount_percentage || 0,
          discount_amount: offerData.discount_amount || 0,
          tax_amount: offerData.tax_amount || 0,
          final_amount: offerData.final_amount,
          payment_method: null,
          payment_status: 'beklemede',
          paid_amount: 0,
          remaining_amount: offerData.final_amount,
          status: 'satıldı',
          notes: `Teklif No: ${offerData.offer_number} - Otomatik oluşturuldu`,
          created_by: user?.id,
        })
        .select()
        .single();

      if (saleError) throw saleError;

      // Satış kalemlerini oluştur
      for (const item of offerItems) {
        const { error: itemError } = await supabase
          .from('sale_items')
          .insert({
            sale_id: saleData.id,
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            discount_percentage: item.discount_percentage,
            discount_amount: item.discount_amount,
            tax_percentage: item.tax_percentage,
            tax_amount: item.tax_amount,
            total_amount: item.total_amount,
          });

        if (itemError) throw itemError;
      }

      console.log('Satış kaydı başarıyla oluşturuldu');
      return true;
    } catch (error: any) {
      console.error('Satış oluşturulurken hata:', error);
      throw error;
    }
  };

  const convertApprovedOffersToSales = async () => {
    if (!confirm('Onaylanmış tüm teklifleri satışa dönüştürmek istediğinize emin misiniz?')) {
      return;
    }

    try {
      // Onaylanmış teklifleri al
      const { data: approvedOffers, error: offersError } = await supabase
        .from('offers')
        .select('*')
        .eq('status', 'onaylandı')
        .order('created_at', { ascending: false });

      if (offersError) throw offersError;

      if (!approvedOffers || approvedOffers.length === 0) {
        alert('Onaylanmış teklif bulunamadı!');
        return;
      }

      let successCount = 0;
      let errorCount = 0;

      for (const offer of approvedOffers) {
        try {
          // Mevcut satış kaydı var mı kontrol et
          const { data: existingSales } = await supabase
            .from('sales')
            .select('id, notes')
            .eq('customer_id', offer.customer_id)
            .ilike('notes', `%Teklif No: ${offer.offer_number}%`);

          if (existingSales && existingSales.length > 0) {
            console.log(`Teklif ${offer.offer_number} için zaten satış kaydı mevcut`);
            continue;
          }

          // Teklif kalemlerini al
          const { data: offerItems, error: itemsError } = await supabase
            .from('offer_items')
            .select('*')
            .eq('offer_id', offer.id);

          if (itemsError) throw itemsError;

          if (!offerItems || offerItems.length === 0) {
            console.log(`Teklif ${offer.offer_number} için kalem bulunamadı`);
            continue;
          }

          const { data: { user } } = await supabase.auth.getUser();

          // Satış kaydı oluştur
          const invoiceNumber = `SAT-${Date.now()}-${offer.id.substring(0, 8)}`;
          const today = new Date().toISOString().split('T')[0];

          const { data: saleData, error: saleError } = await supabase
            .from('sales')
            .insert({
              contract_id: null,
              customer_id: offer.customer_id,
              project_id: offer.project_id || null,
              invoice_number: invoiceNumber,
              invoice_date: today,
              total_amount: offer.total_amount,
              discount_percentage: offer.discount_percentage || 0,
              discount_amount: offer.discount_amount || 0,
              tax_amount: offer.tax_amount || 0,
              final_amount: offer.final_amount,
              payment_method: null,
              payment_status: 'beklemede',
              paid_amount: 0,
              remaining_amount: offer.final_amount,
              status: 'satıldı',
              notes: `Teklif No: ${offer.offer_number} - Otomatik oluşturuldu`,
              created_by: user?.id,
            })
            .select()
            .single();

          if (saleError) throw saleError;

          // Satış kalemlerini oluştur
          for (const item of offerItems) {
            const { error: itemError } = await supabase
              .from('sale_items')
              .insert({
                sale_id: saleData.id,
                product_id: item.product_id,
                quantity: item.quantity,
                unit_price: item.unit_price,
                discount_percentage: item.discount_percentage,
                discount_amount: item.discount_amount,
                tax_percentage: item.tax_percentage,
                tax_amount: item.tax_amount,
                total_amount: item.total_amount,
              });

            if (itemError) throw itemError;
          }

          successCount++;
        } catch (error: any) {
          console.error(`Teklif ${offer.offer_number} için satış oluşturulurken hata:`, error);
          errorCount++;
        }
      }

      alert(`${successCount} teklif başarıyla satışa dönüştürüldü. ${errorCount > 0 ? `${errorCount} teklif için hata oluştu.` : ''}`);
      await loadOffers();
    } catch (error: any) {
      console.error('Toplu dönüştürme hatası:', error);
      alert('Toplu dönüştürme sırasında bir hata oluştu: ' + error.message);
    }
  };

  const filteredOffers = offers.filter(offer => {
    const matchesSearch = 
      offer.offer_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      offer.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (offer.project_name && offer.project_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || offer.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusLabel = (status: string) => {
    const statuses: Record<string, { label: string; color: string }> = {
      'beklemede': { label: 'Beklemede', color: 'bg-yellow-100 text-yellow-800' },
      'onaylandı': { label: 'Onaylandı', color: 'bg-green-100 text-green-800' },
      'reddedildi': { label: 'Reddedildi', color: 'bg-red-100 text-red-800' },
      'iptal': { label: 'İptal', color: 'bg-gray-100 text-gray-800' },
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
            <h1 className="text-3xl font-bold text-gray-900">Teklifler</h1>
            <p className="text-gray-700 mt-2 font-medium">Müşteri tekliflerini yönetin</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={convertApprovedOffersToSales}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Onaylanan Teklifleri Satışa Dönüştür
            </Button>
            <Link href="/offers/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Yeni Teklif
              </Button>
            </Link>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Teklif Listesi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 space-y-4">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="search"
                    placeholder="Teklif ara (numara, müşteri, proje)..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Tüm Durumlar</option>
                    <option value="beklemede">Beklemede</option>
                    <option value="onaylandı">Onaylandı</option>
                    <option value="reddedildi">Reddedildi</option>
                    <option value="iptal">İptal</option>
                  </select>
                </div>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Teklif No</TableHead>
                  <TableHead>Müşteri</TableHead>
                  <TableHead>Proje</TableHead>
                  <TableHead>Tarih</TableHead>
                  <TableHead>Geçerlilik</TableHead>
                  <TableHead>Tutar</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOffers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                      {searchTerm || statusFilter !== 'all' ? 'Arama sonucu bulunamadı' : 'Henüz teklif eklenmemiş'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOffers.map((offer) => {
                    const status = getStatusLabel(offer.status);
                    const isValid = offer.valid_until ? new Date(offer.valid_until) >= new Date() : true;
                    
                    return (
                      <TableRow key={offer.id}>
                        <TableCell className="font-medium">{offer.offer_number}</TableCell>
                        <TableCell>{offer.customer_name}</TableCell>
                        <TableCell>{offer.project_name || '-'}</TableCell>
                        <TableCell>{formatDate(offer.offer_date)}</TableCell>
                        <TableCell>
                          {offer.valid_until ? (
                            <span className={isValid ? 'text-green-600' : 'text-red-600'}>
                              {formatDate(offer.valid_until)}
                            </span>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>{formatCurrency(offer.final_amount)}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-sm ${status.color}`}>
                            {status.label}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Link href={`/offers/${offer.id}`}>
                              <Button variant="ghost" size="sm">
                                <Eye className="w-4 h-4 mr-1" />
                                Detay
                              </Button>
                            </Link>
                            {offer.status === 'beklemede' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => updateOfferStatus(offer.id, 'onaylandı')}
                                  className="text-green-600 hover:text-green-700"
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Onayla
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => updateOfferStatus(offer.id, 'reddedildi')}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Reddet
                                </Button>
                              </>
                            )}
                          </div>
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
