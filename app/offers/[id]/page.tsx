'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useReactToPrint } from 'react-to-print';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Loader2, CheckCircle, XCircle, FileText, Printer, FileDown } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { formatDate, formatCurrency } from '@/lib/utils';

interface Offer {
  id: string;
  offer_number: string;
  offer_date: string;
  valid_until: string | null;
  customer_id: string;
  customer_name: string;
  project_id: string | null;
  project_name: string | null;
  total_amount: number;
  discount_amount: number;
  tax_amount: number;
  final_amount: number;
  status: string;
  notes: string | null;
  created_at: string;
}

interface OfferItem {
  id: string;
  product_id: string;
  product_name: string;
  product_code: string | null;
  product_unit: string;
  quantity: number;
  unit_price: number;
  discount_percentage: number;
  discount_amount: number;
  tax_percentage: number;
  tax_amount: number;
  total_amount: number;
}

export default function OfferDetailPage() {
  const params = useParams();
  const router = useRouter();
  const offerId = params.id as string;
  
  const [offer, setOffer] = useState<Offer | null>(null);
  const [items, setItems] = useState<OfferItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const offerPrintRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    content: () => offerPrintRef.current,
    documentTitle: `Teklif-${offer?.offer_number || 'detay'}`,
  });

  const handleSavePdf = async () => {
    if (!offerPrintRef.current || !offer) return;
    setPdfLoading(true);
    try {
      const canvas = await html2canvas(offerPrintRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const pageWidth = pdfWidth - 2 * margin;
      const pageHeight = pdfHeight - 2 * margin;

      let imgWidth = pageWidth;
      let imgHeight = (canvas.height * imgWidth) / canvas.width;

      if (imgHeight > pageHeight) {
        imgHeight = pageHeight;
        imgWidth = (canvas.width * imgHeight) / canvas.height;
      }

      pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight);
      pdf.save(`Teklif-${offer.offer_number}.pdf`);
    } catch (error: any) {
      console.error('PDF oluşturulurken hata:', error);
      alert('PDF kaydedilirken bir hata oluştu: ' + error.message);
    } finally {
      setPdfLoading(false);
    }
  };

  useEffect(() => {
    if (offerId) {
      loadOfferData();
    }
  }, [offerId]);

  const loadOfferData = async () => {
    try {
      // Teklif bilgileri
      const { data: offerData, error: offerError } = await supabase
        .from('offers')
        .select(`
          *,
          customers!inner(contact_person, company_name),
          customer_projects(project_name)
        `)
        .eq('id', offerId)
        .single();

      if (offerError) throw offerError;

      const formattedOffer: Offer = {
        id: offerData.id,
        offer_number: offerData.offer_number,
        offer_date: offerData.offer_date,
        valid_until: offerData.valid_until,
        customer_id: offerData.customer_id,
        customer_name: offerData.customers?.company_name || offerData.customers?.contact_person || 'Bilinmeyen Müşteri',
        project_id: offerData.project_id,
        project_name: offerData.customer_projects?.project_name || null,
        total_amount: offerData.total_amount,
        discount_amount: offerData.discount_amount,
        tax_amount: offerData.tax_amount,
        final_amount: offerData.final_amount,
        status: offerData.status,
        notes: offerData.notes,
        created_at: offerData.created_at,
      };

      setOffer(formattedOffer);

      // Teklif kalemleri
      const { data: itemsData, error: itemsError } = await supabase
        .from('offer_items')
        .select(`
          *,
          products!inner(name, code, unit)
        `)
        .eq('offer_id', offerId)
        .order('created_at', { ascending: true });

      if (itemsError) throw itemsError;

      const formattedItems = (itemsData || []).map((item: any) => ({
        id: item.id,
        product_id: item.product_id,
        product_name: item.products?.name || 'Bilinmeyen Ürün',
        product_code: item.products?.code || null,
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
    } catch (error: any) {
      console.error('Veri yüklenirken hata:', error);
      alert('Veri yüklenirken bir hata oluştu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateOfferStatus = async (newStatus: string) => {
    if (!offer) return;

    try {
      const { error } = await supabase
        .from('offers')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', offerId);

      if (error) throw error;

      setOffer({ ...offer, status: newStatus });
      
      // Eğer onaylandıysa, otomatik olarak satış oluştur
      if (newStatus === 'onaylandı') {
        await createSaleFromOffer();
      }
    } catch (error: any) {
      console.error('Teklif durumu güncellenirken hata:', error);
      alert('Teklif durumu güncellenirken bir hata oluştu: ' + error.message);
    }
  };

  const createSaleFromOffer = async () => {
    if (!offer || items.length === 0) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Mevcut satış kaydı var mı kontrol et (notlarında teklif numarasına göre)
      const { data: existingSales } = await supabase
        .from('sales')
        .select('id, notes')
        .eq('customer_id', offer.customer_id)
        .ilike('notes', `%Teklif No: ${offer.offer_number}%`);

      if (existingSales && existingSales.length > 0) {
        alert('Bu teklif için zaten bir satış kaydı mevcut!');
        return;
      }

      // Satış kaydı oluştur
      const invoiceNumber = `SAT-${Date.now()}`;
      const today = new Date().toISOString().split('T')[0];

      const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
      const totalDiscount = items.reduce((sum, item) => sum + item.discount_amount, 0);
      const totalTax = items.reduce((sum, item) => sum + item.tax_amount, 0);

      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .insert({
          contract_id: null,
          customer_id: offer.customer_id,
          project_id: offer.project_id || null,
          invoice_number: invoiceNumber,
          invoice_date: today,
          total_amount: subtotal,
          discount_percentage: 0,
          discount_amount: totalDiscount,
          tax_amount: totalTax,
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
      for (const item of items) {
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

      alert('Teklif onaylandı ve satış kaydı oluşturuldu!');
    } catch (error: any) {
      console.error('Satış oluşturulurken hata:', error);
      alert('Satış oluşturulurken bir hata oluştu: ' + error.message);
    }
  };

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

  if (!offer) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">Teklif bulunamadı</p>
          <Button onClick={() => router.push('/offers')}>
            Teklif Listesine Dön
          </Button>
        </div>
      </MainLayout>
    );
  }

  const status = getStatusLabel(offer.status);
  const isValid = offer.valid_until ? new Date(offer.valid_until) >= new Date() : true;

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Teklif Detayı
            </h1>
            <p className="text-gray-600 mt-1">
              Teklif No: {offer.offer_number}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handlePrint}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Teklifi Yazdır
            </Button>
            <Button
              onClick={handleSavePdf}
              variant="outline"
              disabled={pdfLoading}
              className="flex items-center gap-2"
            >
              {pdfLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileDown className="w-4 h-4" />
              )}
              PDF Olarak Kaydet
            </Button>
            <Button
              onClick={() => router.push('/offers')}
              className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white"
            >
              <ArrowLeft className="w-4 h-4" />
              Geri Dön
            </Button>
            {offer.status === 'onaylandı' && (
              <Link href={`/contracts/new?offer=${offerId}`}>
                <Button className="bg-green-600 hover:bg-green-700 text-white">
                  <FileText className="w-4 h-4 mr-2" />
                  Sözleşme Oluştur
                </Button>
              </Link>
            )}
          </div>
        </div>

        <div ref={offerPrintRef} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Teklif Bilgileri</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">Müşteri</div>
                    <div className="font-medium">{offer.customer_name}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Proje</div>
                    <div className="font-medium">{offer.project_name || '-'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Teklif Tarihi</div>
                    <div className="font-medium">{formatDate(offer.offer_date)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Geçerlilik Tarihi</div>
                    <div className={`font-medium ${isValid ? 'text-green-600' : 'text-red-600'}`}>
                      {offer.valid_until ? formatDate(offer.valid_until) : '-'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Durum</div>
                    <div>
                      <span className={`px-2 py-1 rounded-full text-sm ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                  </div>
                  {offer.notes && (
                    <div className="col-span-2 pt-2 border-t">
                      <div className="text-sm text-gray-500 mb-1">Notlar:</div>
                      <div className="text-sm text-gray-600">{offer.notes}</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Teklif Kalemleri ({items.length})</CardTitle>
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
                          <TableCell className="font-medium">
                            <div>
                              <div>{item.product_name}</div>
                              {item.product_code && (
                                <div className="text-xs text-gray-500">{item.product_code}</div>
                              )}
                            </div>
                          </TableCell>
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
                    <span className="font-semibold">{formatCurrency(offer.total_amount)}</span>
                  </div>
                  {offer.discount_amount > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span className="text-sm">İndirim:</span>
                      <span className="font-semibold">-{formatCurrency(offer.discount_amount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">KDV (%20):</span>
                    <span className="font-semibold">{formatCurrency(offer.tax_amount)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-sm font-medium text-gray-700">Genel Toplam:</span>
                    <span className="font-bold text-blue-600 text-lg">
                      {formatCurrency(offer.final_amount)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {offer.status === 'beklemede' && (
              <Card>
                <CardHeader>
                  <CardTitle>İşlemler</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    onClick={() => updateOfferStatus('onaylandı')}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Teklifi Onayla
                  </Button>
                  <Button
                    onClick={() => updateOfferStatus('reddedildi')}
                    className="w-full bg-red-600 hover:bg-red-700 text-white"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Teklifi Reddet
                  </Button>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Bilgiler</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Oluşturulma:</span>
                    <span className="text-sm">{formatDate(offer.created_at)}</span>
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
