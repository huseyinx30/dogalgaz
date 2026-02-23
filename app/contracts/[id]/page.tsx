'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Loader2, CheckCircle, Printer, FileText, FileDown } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { formatDate, formatCurrency } from '@/lib/utils';

interface Contract {
  id: string;
  contract_number: string;
  contract_date: string;
  start_date: string | null;
  end_date: string | null;
  customer_id: string;
  customer_name: string;
  customer_contact: string;
  customer_tc: string | null;
  customer_address: string;
  project_id: string | null;
  project_name: string | null;
  offer_id: string | null;
  offer_number: string | null;
  total_amount: number;
  status: string;
  customer_signed_at: string | null;
  company_signed_at: string | null;
  notes: string | null;
  created_at: string;
}

interface OfferItem {
  id: string;
  product_id: string;
  product_name: string;
  product_code: string | null;
  quantity: number;
  unit_price: number;
  discount_percentage: number;
  discount_amount: number;
  tax_percentage: number;
  tax_amount: number;
  total_amount: number;
  product_unit: string;
}

interface CompanyInfo {
  name: string;
  contact_person: string;
  address: string;
  phone: string;
}

export default function ContractDetailPage() {
  const params = useParams();
  const router = useRouter();
  const contractId = params.id as string;
  
  const [contract, setContract] = useState<Contract | null>(null);
  const [offerItems, setOfferItems] = useState<OfferItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const contractPrintRef = useRef<HTMLDivElement>(null);
  const [companyInfo] = useState<CompanyInfo>({
    name: 'KAĞAN MÜHENDİSLİK',
    contact_person: 'Felek KAĞAN',
    address: 'Yeni Mah. Cengiz Topel Cad. Diri İş Mrkz. Kat: 3 No: 2 Yüksekova/HAKKARİ',
    phone: '0541 196 65 30',
  });

  useEffect(() => {
    if (contractId) {
      loadContractData();
    }
  }, [contractId]);

  const loadContractData = async () => {
    try {
      // Sözleşme bilgileri
      const { data: contractData, error: contractError } = await supabase
        .from('contracts')
        .select(`
          *,
          customers!inner(contact_person, company_name, tax_number, tax_office, address, city, district, phone, email),
          customer_projects(project_name, address, city, district),
          offers(offer_number)
        `)
        .eq('id', contractId)
        .single();

      if (contractError) throw contractError;

      const customer = contractData.customers as any;
      const project = contractData.customer_projects as any;
      const offer = contractData.offers as any;

      const formattedContract: Contract = {
        id: contractData.id,
        contract_number: contractData.contract_number,
        contract_date: contractData.contract_date,
        start_date: contractData.start_date,
        end_date: contractData.end_date,
        customer_id: contractData.customer_id,
        customer_name: customer?.company_name || customer?.contact_person || 'Bilinmeyen Müşteri',
        customer_contact: customer?.phone || '',
        customer_tc: customer?.tax_number || null,
        customer_address: [customer?.address, customer?.district, customer?.city].filter(Boolean).join(', ') || '',
        project_id: contractData.project_id,
        project_name: project?.project_name || null,
        offer_id: contractData.offer_id,
        offer_number: offer?.offer_number || null,
        total_amount: contractData.total_amount,
        status: contractData.status,
        customer_signed_at: contractData.customer_signed_at,
        company_signed_at: contractData.company_signed_at,
        notes: contractData.notes,
        created_at: contractData.created_at,
      };

      setContract(formattedContract);

      // Teklif kalemlerini yükle
      if (contractData.offer_id) {
        const { data: itemsData, error: itemsError } = await supabase
          .from('offer_items')
          .select(`
            *,
            products!inner(name, code, unit)
          `)
          .eq('offer_id', contractData.offer_id)
          .order('created_at', { ascending: true });

        if (itemsError) throw itemsError;

        const formattedItems = (itemsData || []).map((item: any) => ({
          id: item.id,
          product_id: item.product_id,
          product_name: item.products?.name || 'Bilinmeyen Ürün',
          product_code: item.products?.code || null,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount_percentage: item.discount_percentage,
          discount_amount: item.discount_amount,
          tax_percentage: item.tax_percentage,
          tax_amount: item.tax_amount,
          total_amount: item.total_amount,
          product_unit: item.products?.unit || 'adet',
        }));

        setOfferItems(formattedItems);
      }
    } catch (error: any) {
      console.error('Veri yüklenirken hata:', error);
      alert('Veri yüklenirken bir hata oluştu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const approveContract = async () => {
    if (!contract) return;

    if (!confirm('Sözleşmeyi onaylamak istediğinize emin misiniz? Onaylandığında otomatik olarak satış kaydı oluşturulacaktır.')) {
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Önce mevcut satış kaydı var mı kontrol et
      const { data: existingSale } = await supabase
        .from('sales')
        .select('id')
        .eq('contract_id', contractId)
        .single();

      if (existingSale) {
        alert('Bu sözleşme için zaten bir satış kaydı mevcut!');
        return;
      }

      // Sözleşmeyi güncelle
      const { error: contractError } = await supabase
        .from('contracts')
        .update({
          status: 'onaylandı',
          company_signed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', contractId);

      if (contractError) throw contractError;

      // Teklif kalemlerini al
      if (contract.offer_id && offerItems.length > 0) {
        // Toplamları hesapla
        const calculatedSubtotal = offerItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
        const calculatedTotalDiscount = offerItems.reduce((sum, item) => sum + item.discount_amount, 0);
        const calculatedTotalTax = offerItems.reduce((sum, item) => sum + item.tax_amount, 0);
        
        // Satış kaydı oluştur
        const invoiceNumber = `SAT-${Date.now()}`;
        const today = new Date().toISOString().split('T')[0];
        
        const { data: saleData, error: saleError } = await supabase
          .from('sales')
          .insert({
            contract_id: contractId,
            customer_id: contract.customer_id,
            project_id: contract.project_id,
            invoice_number: invoiceNumber,
            invoice_date: today,
            total_amount: calculatedSubtotal,
            discount_percentage: 0,
            discount_amount: calculatedTotalDiscount,
            tax_amount: calculatedTotalTax,
            final_amount: contract.total_amount,
            payment_method: null,
            payment_status: 'beklemede',
            paid_amount: 0,
            remaining_amount: contract.total_amount,
            status: 'satıldı',
            notes: `Sözleşme No: ${contract.contract_number} - Otomatik oluşturuldu`,
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
      }

      await loadContractData();
      alert('Sözleşme onaylandı ve satış kaydı oluşturuldu!');
    } catch (error: any) {
      console.error('Sözleşme onaylanırken hata:', error);
      alert('Sözleşme onaylanırken bir hata oluştu: ' + error.message);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSavePdf = async () => {
    if (!contractPrintRef.current || !contract) return;
    setPdfLoading(true);
    try {
      const canvas = await html2canvas(contractPrintRef.current, {
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
      pdf.save(`Sozlesme-${contract.contract_number}.pdf`);
    } catch (error: any) {
      console.error('PDF oluşturulurken hata:', error);
      alert('PDF kaydedilirken bir hata oluştu: ' + error.message);
    } finally {
      setPdfLoading(false);
    }
  };

  const getStatusLabel = (status: string) => {
    const statuses: Record<string, { label: string; color: string }> = {
      'taslak': { label: 'Taslak', color: 'bg-gray-100 text-gray-800' },
      'müşteri_imzaladı': { label: 'Müşteri İmzaladı', color: 'bg-blue-100 text-blue-800' },
      'firma_imzaladı': { label: 'Firma İmzaladı', color: 'bg-green-100 text-green-800' },
      'aktif': { label: 'Aktif', color: 'bg-green-100 text-green-800' },
      'tamamlandı': { label: 'Tamamlandı', color: 'bg-purple-100 text-purple-800' },
      'iptal': { label: 'İptal', color: 'bg-red-100 text-red-800' },
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

  if (!contract) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">Sözleşme bulunamadı</p>
          <Button onClick={() => router.push('/contracts')}>
            Sözleşme Listesine Dön
          </Button>
        </div>
      </MainLayout>
    );
  }

  const status = getStatusLabel(contract.status);
  const totalDiscount = offerItems.reduce((sum, item) => sum + item.discount_amount, 0);
  const totalTax = offerItems.reduce((sum, item) => sum + item.tax_amount, 0);
  const subtotal = offerItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between print:hidden">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Sözleşme Detayı</h1>
            <p className="text-gray-600 mt-1">
              Sözleşme No: {contract.contract_number}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => router.push('/contracts')}
              className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white"
            >
              <ArrowLeft className="w-4 h-4" />
              Geri Dön
            </Button>
            {contract.company_signed_at && (
              <span className="px-3 py-2 rounded-lg bg-green-100 text-green-800 text-sm font-medium flex items-center">
                <CheckCircle className="w-4 h-4 mr-2" />
                Sözleşme onaylanmış
              </span>
            )}
            <Button
              onClick={approveContract}
              disabled={!!contract.company_signed_at}
              className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-green-600"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Sözleşmeyi Onayla
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
              onClick={handlePrint}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Printer className="w-4 h-4 mr-2" />
              Yazdır
            </Button>
          </div>
        </div>

        {/* Sözleşme Dokümanı */}
        <div ref={contractPrintRef} className="contract-print-content">
          <Card className="print:shadow-none print:border-0 bg-white">
          <CardContent className="p-8 print:p-4">
            <div className="space-y-6">
              {/* Başlık */}
              <div className="text-center print:mb-6">
                <h1 className="text-3xl font-bold mb-4 print:text-2xl print:mb-2">SÖZLEŞME</h1>
              </div>

              {/* İki Sütunlu Layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Sol Sütun */}
                <div className="space-y-6">
                  {/* Sertifikalı Firma/Yüklenici */}
                  <div>
                    <h3 className="font-bold text-lg mb-2">Sertifikalı Firma/Yüklenici</h3>
                    <div className="space-y-1 text-sm">
                      <div><strong>{companyInfo.name}</strong></div>
                      <div><strong>Adı Soyadı:</strong> {companyInfo.contact_person}</div>
                      <div><strong>Adres:</strong> {companyInfo.address}</div>
                      <div><strong>Telefon:</strong> {companyInfo.phone}</div>
                    </div>
                  </div>

                  {/* Müşteri Abone/İşveren */}
                  <div>
                    <h3 className="font-bold text-lg mb-2">MÜŞTERİ ABONE/İŞVEREN</h3>
                    <div className="space-y-1 text-sm">
                      <div><strong>Adı Soyadı:</strong> {contract.customer_name}</div>
                      <div><strong>İletişim:</strong> {contract.customer_contact}</div>
                      {contract.customer_tc && (
                        <div><strong>Tc. Kimlik No:</strong> {contract.customer_tc}</div>
                      )}
                      <div><strong>Adres:</strong> {contract.customer_address || '-'}</div>
                    </div>
                  </div>

                  {/* Taraflar */}
                  <div>
                    <h3 className="font-bold text-lg mb-2">TARAFLAR</h3>
                    <p className="text-sm">
                      Sertifikalı firma aşağıda &quot;yüklenici&quot;, işveren/abone aşağıda &quot;işveren&quot; olarak anılacaktır.
                    </p>
                  </div>

                  {/* Yapılacak Tesisatın Kapsamı */}
                  <div>
                    <h3 className="font-bold text-lg mb-2">Yapılacak tesisatın kapsamı;</h3>
                    <div className="text-sm space-y-2">
                      <p>
                        1. Yüklenici tarafından yapılacak tesisatın tarifi: hangi cihaz ve ekipmanların kaçar adet ve hangi mahallelere konulacağı,
                      </p>
                      <div className="ml-4 space-y-1">
                        {offerItems.map((item, index) => (
                          <div key={item.id} className="border-b pb-1">
                            <div className="font-medium">
                              {index + 1}. {item.product_name} {item.product_code && `(${item.product_code})`}
                            </div>
                            <div className="text-xs text-gray-600">
                              Miktar: {item.quantity} {item.product_unit} - Birim Fiyat: {formatCurrency(item.unit_price)}
                              {item.discount_percentage > 0 && (
                                <span className="text-red-600"> - İskonto: %{item.discount_percentage.toFixed(2)}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      <p>
                        2. Yüklenici tarafından tesisatın tamamında kullanılacak malzeme, ekipman ve yakıcı cihazların marka ve modelleri,
                      </p>
                    </div>
                  </div>

                  {/* Kombi Modeli */}
                  <div>
                    <h3 className="font-bold text-lg mb-2">Kombi Modeli ve Markası:</h3>
                    <div className="text-sm">
                      {offerItems.filter(item => item.product_name.toLowerCase().includes('kombi')).map(item => (
                        <div key={item.id} className="font-medium">{item.product_name}</div>
                      ))}
                      {offerItems.filter(item => item.product_name.toLowerCase().includes('kombi')).length === 0 && (
                        <div className="text-gray-500">Belirtilmemiş</div>
                      )}
                    </div>
                  </div>

                  {/* Ödeme */}
                  <div className="text-sm">
                    <p className="mb-2">
                      3. İşveren işbu iç tesisat proje yapım dönüşüm montajı hizmetleri karşılığında oluşan bedeli{' '}
                      <strong className="text-lg">{formatCurrency(contract.total_amount)}</strong> TL nakit ödemeyi taahhüt eder.
                    </p>
                    <p>4. Fiyatlarımıza KDV dahildir</p>
                  </div>

                  {/* Tarihler */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>İş Başlangıç Tarihi:</strong> {contract.start_date ? formatDate(contract.start_date) : '-'}
                    </div>
                    <div>
                      <strong>İş Bitiş Tarihi:</strong> {contract.end_date ? formatDate(contract.end_date) : '-'}
                    </div>
                    <div>
                      <strong>Sözleşme Tarihi:</strong> {formatDate(contract.contract_date)}
                    </div>
                  </div>

                  {/* Taahhütler */}
                  <div className="text-sm space-y-1">
                    <p>• Yüklenici ve yüklenici tarafından istihdam edilen mühendis ve ustaların AKMERCAN nezdinde yeterlilik sahibi olduğunu beyan ederiz.</p>
                    <p>• Tesisatın yapımında kullanılacak tür, malzeme, ekipman ve yakıcı cihazların AKMERCAN teknik şartnamelerine uygun standartları haiz olacağını taahhüt ederiz.</p>
                    <p>• İş bu sözleşmenin ihtilafı vukuunda kuruluşumuzun bulunduğunuz bölge de bağlı olduğu yerel mahkeme yetkilidir.</p>
                  </div>
                </div>

                {/* Sağ Sütun */}
                <div className="space-y-6">
                  {/* Dikkat */}
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 print:border print:border-gray-400 print:bg-gray-50">
                    <h3 className="font-bold text-lg mb-2 print:text-base">DİKKAT:</h3>
                    <p className="text-sm print:text-xs">
                      AKMERCAN gaz açımından sonra AKMERCAN onayı olmadan tesisatta yapılacak her türlü değişiklik hayat ve mal güvenliği açısından risklidir ve gaz beslemesinin süresiz kesilmesine neden olabilir.
                    </p>
                  </div>

                  <p className="text-sm font-semibold">
                    İşin bitiş tarihi başlangıç tarihinden maksimum bir ay olmalıdır.
                  </p>

                  {/* Sorumluluklar ve İşlem Sırası */}
                  <div className="print:break-inside-avoid">
                    <h3 className="font-bold text-lg mb-2 print:text-base print:mb-1">Doğalgaza dönüşüm esnasında sorumluluklar ve işlem sırası;</h3>
                    <ol className="text-sm space-y-2 list-decimal list-inside print:text-xs print:space-y-1">
                      <li>İşveren tarafından AKMERCAN&apos;a abonelik işleminin yapılması.</li>
                      <li>Bina önünde servis kutusu yok ise AKMERCAN tarafından servis kutusu konulması.</li>
                      <li>İşverenin yüklenici ile doğalgaz dönüşüm sözleşmesi imzalaması</li>
                      <li>Yüklenici tarafından işverenin tesisatına ait projenin ilgili AKMERCAN teknik şartnamesine uygun olarak hazırlanarak AKMERCAN teslim edilmesi.</li>
                      <li>AKMERCAN tarafından projenin onaylanması.</li>
                      <li>Yüklenici tarafından işverene ait doğal gaz tesisatının ilgili AKMERCAN teknik şartnamesine uygun olarak yapılması.</li>
                      <li>İşveren tarafından AKMERCAN ile doğal gaz kullanım sözleşmesinin imzalanması.</li>
                      <li>Yüklenici tarafından AKMERCAN&apos;dan tesisat kontrol randevusuna alınması.</li>
                      <li>AKMERCAN yetkilileri, yüklenici yetkili mühendisi ve ustası ile işverenin aynı anda bulunduğu randevu günü saatinde AKMERCAN tarafından tesisatın kontrolü ve gaz açma işleminin yapılması.</li>
                      <li>
                        Yüklenici, bu sözleşmenin imzalandığı tarih itibari ile başlayan doğal gaz paket poliçesinin yaptırıp. AİL risk kapsamına ilave olarak; poliçede aşağıda belirtilen hususlar yer almalıdır.
                        <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                          <li>
                            A. Üçüncü kontrol ve/veya test esnasında tesisatın halen uygun olmadığı anlaşılırsa, durum tutanak ile tespit edilir. Ve sigortalının işveren ve/veya yetkili temsilcinin sigorta şirketine müracaatı üzerine yapılacak işlerin bedeli, sigorta şirketi tarafından sigortalıya ödenir ve/veya tamamlanması gereken işler sigorta şirketi tarafından bir başka sertifikalı firmaya yaptırılır ve kontrol ve/veya test işlemleri tekrar yapılarak tesisat onaylanır ifadesi yer almalıdır.
                          </li>
                          <li>
                            B. Sözleşme bedeli, doğalgaz dönüşüm sözleşmesinde anlaşılan bedel iç tesisatta takılan kombi dahil olacaktır.
                          </li>
                          <li>
                            C. Sözleşme iki nüsha halinde düzenlenerek işveren ve yüklenicide bulunacaktır.
                          </li>
                        </ul>
                      </li>
                    </ol>
                  </div>

                  {/* İmzalar */}
                  <div className="mt-8 space-y-6">
                    <div>
                      <h3 className="font-bold text-lg mb-2">YÜKLENİCİ YETKİLİSİ</h3>
                      <div className="border-t-2 border-gray-400 pt-2">
                        <div className="text-sm">
                          <div>Kaşe / İsim / İmza</div>
                          <div className="mt-4 font-medium">{companyInfo.contact_person}</div>
                          {contract.company_signed_at && (
                            <div className="text-xs text-gray-500 mt-2">
                              Onaylandı: {formatDate(contract.company_signed_at)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-bold text-lg mb-2">İŞVEREN</h3>
                      <div className="border-t-2 border-gray-400 pt-2">
                        <div className="text-sm">
                          <div>İsim / İmza</div>
                          <div className="mt-4 font-medium">{contract.customer_name}</div>
                          {contract.customer_signed_at && (
                            <div className="text-xs text-gray-500 mt-2">
                              İmzalandı: {formatDate(contract.customer_signed_at)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Özet Tablo */}
              {offerItems.length > 0 && (
                <div className="mt-8 print:mt-4 print:break-inside-avoid">
                  <h3 className="font-bold text-lg mb-4 print:text-base print:mb-2">Teklif Detayları</h3>
                  <Table className="print:text-xs">
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
                      {offerItems.map((item) => (
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
                  <div className="mt-4 flex justify-end">
                    <div className="w-64 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Ara Toplam:</span>
                        <span className="font-semibold">{formatCurrency(subtotal)}</span>
                      </div>
                      {totalDiscount > 0 && (
                        <div className="flex justify-between text-red-600">
                          <span>Toplam İndirim:</span>
                          <span className="font-semibold">-{formatCurrency(totalDiscount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Toplam KDV:</span>
                        <span className="font-semibold">{formatCurrency(totalTax)}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t font-bold text-lg">
                        <span>Genel Toplam:</span>
                        <span className="text-blue-600">{formatCurrency(contract.total_amount)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </MainLayout>
  );
}
