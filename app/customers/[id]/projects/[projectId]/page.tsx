'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Edit, Building2, MapPin, FileText, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { formatDate, formatCurrency } from '@/lib/utils';
import { BuildingVisualization } from '@/components/building-visualization';

interface Project {
  id: string;
  customer_id: string;
  project_name: string;
  project_type: string | null;
  address: string | null;
  city: string | null;
  district: string | null;
  description: string | null;
  floor_count: number | null;
  apartments_per_floor: number | null;
  apartments_by_floor: number[] | null;
  shop_count: number | null;
  device_count: number | null;
  created_at: string;
  updated_at: string;
}

interface Customer {
  id: string;
  contact_person: string;
  company_name: string | null;
}

interface Offer {
  id: string;
  offer_number: string;
  offer_date: string;
  valid_until: string | null;
  status: string;
  final_amount: number;
  created_at: string;
}

interface Sale {
  id: string;
  invoice_number: string | null;
  invoice_date: string | null;
  final_amount: number;
  payment_status: string;
  status: string;
  created_at: string;
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;
  const projectId = params.projectId as string;
  
  const [project, setProject] = useState<Project | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (projectId) {
      loadProjectData();
    }
  }, [projectId]);

  const loadProjectData = async () => {
    try {
      // Proje bilgileri
      const { data: projectData, error: projectError } = await supabase
        .from('customer_projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (projectError) throw projectError;
      setProject(projectData);

      // Müşteri bilgileri
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('id, contact_person, company_name')
        .eq('id', projectData.customer_id)
        .single();

      if (customerError) throw customerError;
      setCustomer(customerData);

      // Teklifler
      const { data: offersData, error: offersError } = await supabase
        .from('offers')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (offersError) throw offersError;
      setOffers(offersData || []);

      // Satışlar
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (salesError) throw salesError;
      setSales(salesData || []);

    } catch (error: any) {
      console.error('Veri yüklenirken hata:', error);
      alert('Veri yüklenirken bir hata oluştu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getProjectTypeLabel = (type: string | null) => {
    const types: Record<string, string> = {
      'ev': 'Ev',
      'yapı': 'Yapı',
      'iş_yeri': 'İş Yeri',
    };
    return types[type || ''] || type || '-';
  };

  const getOfferStatusLabel = (status: string) => {
    const statuses: Record<string, { label: string; color: string }> = {
      'beklemede': { label: 'Beklemede', color: 'bg-yellow-100 text-yellow-800' },
      'onaylandı': { label: 'Onaylandı', color: 'bg-green-100 text-green-800' },
      'reddedildi': { label: 'Reddedildi', color: 'bg-red-100 text-red-800' },
      'süresi_doldu': { label: 'Süresi Doldu', color: 'bg-gray-100 text-gray-800' },
    };
    return statuses[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
  };

  const getPaymentStatusLabel = (status: string) => {
    const statuses: Record<string, { label: string; color: string }> = {
      'beklemede': { label: 'Beklemede', color: 'bg-yellow-100 text-yellow-800' },
      'kısmen_ödendi': { label: 'Kısmen Ödendi', color: 'bg-blue-100 text-blue-800' },
      'ödendi': { label: 'Ödendi', color: 'bg-green-100 text-green-800' },
    };
    return statuses[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
  };

  const getAddress = () => {
    if (!project) return '';
    const parts = [project.address, project.district, project.city].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'Adres bilgisi yok';
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

  if (!project || !customer) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">Proje bulunamadı</p>
          <Button onClick={() => router.push(`/customers/${customerId}`)}>
            Müşteri Detayına Dön
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
            <h1 className="text-3xl font-bold text-gray-900">{project.project_name}</h1>
            <p className="text-gray-600 mt-1">
              Müşteri: {customer.contact_person}
              {customer.company_name && ` - ${customer.company_name}`}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => router.push(`/customers/${customerId}`)}
              className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white"
            >
              <ArrowLeft className="w-4 h-4" />
              Geri Dön
            </Button>
            <Link href={`/customers/${customerId}/projects/${projectId}/edit`}>
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
                <CardTitle>Proje Bilgileri</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-500">Proje Tipi</div>
                      <div className="font-medium">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                          {getProjectTypeLabel(project.project_type)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {project.project_type === 'ev' && (project.floor_count != null || project.apartments_per_floor != null || (project.apartments_by_floor && project.apartments_by_floor.length > 0) || project.shop_count != null) && (
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-4">
                      <div className="text-sm font-medium text-gray-700 mb-2">Ev Projesi Detayları</div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {project.floor_count != null && (
                          <div>
                            <div className="text-xs text-gray-500">Kat Sayısı</div>
                            <div className="font-medium">{project.floor_count}</div>
                          </div>
                        )}
                        {project.shop_count != null && (
                          <div>
                            <div className="text-xs text-gray-500">Dükkan Sayısı</div>
                            <div className="font-medium">{project.shop_count}</div>
                          </div>
                        )}
                        {((project.apartments_by_floor && project.apartments_by_floor.length > 0) || (project.apartments_per_floor != null && project.floor_count != null)) && (
                          <div>
                            <div className="text-xs text-gray-500">Toplam Daire Sayısı</div>
                            <div className="font-medium">
                              {project.apartments_by_floor && project.apartments_by_floor.length > 0
                                ? project.apartments_by_floor.reduce((sum, n) => sum + Number(n), 0)
                                : (project.floor_count ?? 0) * (project.apartments_per_floor ?? 0)}
                            </div>
                          </div>
                        )}
                        {((project.apartments_by_floor && project.apartments_by_floor.length > 0) || project.apartments_per_floor != null || project.shop_count != null) && (
                          <div className="md:col-span-3">
                            <div className="text-xs text-gray-500 mb-2">Her Katta Birim Sayısı</div>
                            <div className="flex flex-wrap gap-2">
                              <span
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-sm font-medium shadow-sm"
                              >
                                <span className="text-gray-500 font-normal">Zemin:</span>
                                <span className="font-semibold text-amber-900">{project.shop_count ?? 0}</span>
                              </span>
                              {project.apartments_by_floor && project.apartments_by_floor.length > 0 ? (
                                project.apartments_by_floor.map((n, i) => (
                                  <span
                                    key={i}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-800 shadow-sm"
                                  >
                                    <span className="text-gray-500 font-normal">{i + 1}. Kat:</span>
                                    <span className="font-semibold text-gray-900">{n}</span>
                                  </span>
                                ))
                              ) : project.floor_count != null && project.apartments_per_floor != null ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-800 shadow-sm">
                                  <span className="text-gray-500 font-normal">Tüm katlar:</span>
                                  <span className="font-semibold text-gray-900">{project.apartments_per_floor}</span>
                                </span>
                              ) : null}
                            </div>
                          </div>
                        )}
                      </div>
                      {/* Bina görseli - kat ve daire bilgisi varsa */}
                      {project.floor_count != null && (project.apartments_by_floor?.length || project.apartments_per_floor != null) && (
                        <div className="pt-4 border-t border-gray-200">
                          <BuildingVisualization
                            floorCount={project.floor_count}
                            apartmentsByFloor={project.apartments_by_floor ?? []}
                            apartmentsPerFloor={project.apartments_per_floor ?? undefined}
                            shopCount={project.shop_count ?? 0}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {project.project_type === 'iş_yeri' && project.device_count != null && (
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="text-sm font-medium text-gray-700 mb-1">İş Yeri Projesi Detayları</div>
                      <div>
                        <div className="text-xs text-gray-500">Kullanılacak Cihaz Sayısı</div>
                        <div className="font-medium">{project.device_count}</div>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                    <div>
                      <div className="text-sm text-gray-500">Adres</div>
                      <div className="font-medium">{getAddress()}</div>
                    </div>
                  </div>

                  {project.description && (
                    <div className="pt-2 border-t">
                      <div className="text-sm font-medium mb-1">Açıklama:</div>
                      <div className="text-sm text-gray-600">{project.description}</div>
                    </div>
                  )}

                  <div className="pt-2 border-t">
                    <div className="text-sm text-gray-500">
                      Oluşturulma Tarihi: {formatDate(project.created_at)}
                    </div>
                    {project.updated_at !== project.created_at && (
                      <div className="text-sm text-gray-500">
                        Son Güncelleme: {formatDate(project.updated_at)}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Teklifler ({offers.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {offers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p>Henüz teklif oluşturulmamış</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Teklif No</TableHead>
                        <TableHead>Tarih</TableHead>
                        <TableHead>Geçerlilik</TableHead>
                        <TableHead>Tutar</TableHead>
                        <TableHead>Durum</TableHead>
                        <TableHead>İşlemler</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {offers.map((offer) => {
                        const status = getOfferStatusLabel(offer.status);
                        return (
                          <TableRow key={offer.id}>
                            <TableCell className="font-medium">{offer.offer_number}</TableCell>
                            <TableCell>{formatDate(offer.offer_date)}</TableCell>
                            <TableCell>
                              {offer.valid_until ? formatDate(offer.valid_until) : '-'}
                            </TableCell>
                            <TableCell>{formatCurrency(offer.final_amount)}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded-full text-sm ${status.color}`}>
                                {status.label}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Link href={`/offers/${offer.id}`}>
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

            <Card>
              <CardHeader>
                <CardTitle>Satışlar ({sales.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {sales.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>Henüz satış yapılmamış</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fatura No</TableHead>
                        <TableHead>Tarih</TableHead>
                        <TableHead>Tutar</TableHead>
                        <TableHead>Ödeme Durumu</TableHead>
                        <TableHead>İş Durumu</TableHead>
                        <TableHead>İşlemler</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sales.map((sale) => {
                        const paymentStatus = getPaymentStatusLabel(sale.payment_status);
                        return (
                          <TableRow key={sale.id}>
                            <TableCell className="font-medium">
                              {sale.invoice_number || '-'}
                            </TableCell>
                            <TableCell>
                              {sale.invoice_date ? formatDate(sale.invoice_date) : formatDate(sale.created_at)}
                            </TableCell>
                            <TableCell>{formatCurrency(sale.final_amount)}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded-full text-sm ${paymentStatus.color}`}>
                                {paymentStatus.label}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
                                {sale.status}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Link href={`/accounting/sales/${sale.id}`}>
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
                <CardTitle>Hızlı İşlemler</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href={`/offers/new?customer=${customerId}&project=${projectId}`} className="block">
                  <Button className="w-full justify-start bg-blue-600 hover:bg-blue-700 text-white">
                    <FileText className="w-4 h-4 mr-2" />
                    Yeni Teklif
                  </Button>
                </Link>
                <Link href={`/accounting/sales/new?customer=${customerId}&project=${projectId}`} className="block">
                  <Button className="w-full justify-start bg-blue-600 hover:bg-blue-700 text-white">
                    <FileText className="w-4 h-4 mr-2" />
                    Yeni Satış
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>İstatistikler</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Toplam Teklif:</span>
                    <span className="font-semibold">{offers.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Toplam Satış:</span>
                    <span className="font-semibold">{sales.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Toplam Tutar:</span>
                    <span className="font-semibold">
                      {formatCurrency(sales.reduce((sum, sale) => sum + sale.final_amount, 0))}
                    </span>
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
