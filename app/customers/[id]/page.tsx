'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Phone, Mail, MapPin, Edit, MessageSquare, FileText, Building2, Loader2, Plus, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { formatDate, formatCurrency } from '@/lib/utils';

interface Customer {
  id: string;
  company_name: string | null;
  contact_person: string;
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

interface Project {
  id: string;
  project_name: string;
  project_type: string | null;
  address: string | null;
  city: string | null;
  district: string | null;
  description: string | null;
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

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;
  
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [accountBalance, setAccountBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (customerId) {
      loadCustomerData();
    }
  }, [customerId]);

  const loadCustomerData = async () => {
    try {
      // Müşteri bilgileri
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .single();

      if (customerError) throw customerError;
      setCustomer(customerData);

      // Projeler
      const { data: projectsData, error: projectsError } = await supabase
        .from('customer_projects')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (projectsError) throw projectsError;
      setProjects(projectsData || []);

      // Satışlar
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (salesError) throw salesError;
      setSales(salesData || []);

      // Cari hesap bakiyesi hesapla
      const balance = (salesData || []).reduce((sum, sale) => sum + (sale.remaining_amount || 0), 0);
      setAccountBalance(balance);

    } catch (error: any) {
      console.error('Veri yüklenirken hata:', error);
      alert('Veri yüklenirken bir hata oluştu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getAddress = () => {
    if (!customer) return '';
    const parts = [customer.address, customer.district, customer.city].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'Adres bilgisi yok';
  };

  const getProjectTypeLabel = (type: string | null) => {
    const types: Record<string, string> = {
      'ev': 'Ev',
      'yapı': 'Yapı',
      'iş_yeri': 'İş Yeri',
    };
    return types[type || ''] || type || '-';
  };

  const getPaymentStatusLabel = (status: string) => {
    const statuses: Record<string, { label: string; color: string }> = {
      'beklemede': { label: 'Beklemede', color: 'bg-yellow-100 text-yellow-800' },
      'kısmen_ödendi': { label: 'Kısmen Ödendi', color: 'bg-blue-100 text-blue-800' },
      'ödendi': { label: 'Ödendi', color: 'bg-green-100 text-green-800' },
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

  if (!customer) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">Müşteri bulunamadı</p>
          <Button onClick={() => router.push('/customers')}>
            Müşteri Listesine Dön
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
            <h1 className="text-3xl font-bold text-gray-900">{customer.contact_person}</h1>
            {customer.company_name && (
              <p className="text-gray-600 mt-1">{customer.company_name}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => router.push('/customers')}
              className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white"
            >
              <ArrowLeft className="w-4 h-4" />
              Geri Dön
            </Button>
            <Link href={`/customers/${customerId}/edit`}>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Edit className="w-4 h-4 mr-2" />
                Düzenle
              </Button>
            </Link>
            <Button className="bg-green-600 hover:bg-green-700 text-white">
              <MessageSquare className="w-4 h-4 mr-2" />
              Mesaj Gönder
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Müşteri Bilgileri</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {customer.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <a href={`tel:${customer.phone}`} className="hover:text-blue-600">
                        {customer.phone}
                      </a>
                    </div>
                  )}
                  {customer.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <a href={`mailto:${customer.email}`} className="hover:text-blue-600">
                        {customer.email}
                      </a>
                    </div>
                  )}
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                    <div>
                      <div>{getAddress()}</div>
                      {customer.postal_code && (
                        <div className="text-sm text-gray-500">Posta Kodu: {customer.postal_code}</div>
                      )}
                    </div>
                  </div>
                  {customer.tax_number && (
                    <div className="pt-2 border-t">
                      <div className="text-sm text-gray-500">TC Kimlik No: {customer.tax_number}</div>
                      {customer.tax_office && (
                        <div className="text-sm text-gray-500">Baba Adı: {customer.tax_office}</div>
                      )}
                    </div>
                  )}
                  {customer.notes && (
                    <div className="pt-2 border-t">
                      <div className="text-sm font-medium mb-1">Notlar:</div>
                      <div className="text-sm text-gray-600">{customer.notes}</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex items-center justify-between">
                <CardTitle>Projeler ({projects.length})</CardTitle>
                <Link href={`/customers/${customerId}/projects/new`}>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Yeni Proje
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {projects.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Building2 className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p>Henüz proje eklenmemiş</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Proje Adı</TableHead>
                        <TableHead>Tip</TableHead>
                        <TableHead>Adres</TableHead>
                        <TableHead>İşlemler</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {projects.map((project) => (
                        <TableRow key={project.id}>
                          <TableCell className="font-medium">{project.project_name}</TableCell>
                          <TableCell>
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                              {getProjectTypeLabel(project.project_type)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm max-w-[200px] truncate">
                              {[project.address, project.district, project.city].filter(Boolean).join(', ') || '-'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Link href={`/customers/${customerId}/projects/${project.id}`}>
                              <Button variant="ghost" size="sm">Detay</Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
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
                <CardTitle>Cari Hesap</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Toplam Bakiye:</span>
                    <span className={`text-2xl font-bold ${accountBalance > 0 ? 'text-red-600' : accountBalance < 0 ? 'text-green-600' : 'text-gray-600'}`}>
                      {formatCurrency(accountBalance)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 pt-2 border-t">
                    {accountBalance > 0 ? 'Müşteri borçlu' : accountBalance < 0 ? 'Müşteri alacaklı' : 'Bakiye sıfır'}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Hızlı İşlemler</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href={`/offers/new?customer=${customerId}`} className="block">
                  <Button className="w-full justify-start bg-blue-600 hover:bg-blue-700 text-white">
                    <FileText className="w-4 h-4 mr-2" />
                    Yeni Teklif
                  </Button>
                </Link>
                <Link href={`/accounting/sales/new?customer=${customerId}`} className="block">
                  <Button className="w-full justify-start bg-blue-600 hover:bg-blue-700 text-white">
                    <FileText className="w-4 h-4 mr-2" />
                    Yeni Satış
                  </Button>
                </Link>
                <Button className="w-full justify-start bg-green-600 hover:bg-green-700 text-white">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  SMS Gönder
                </Button>
                <Button className="w-full justify-start bg-green-600 hover:bg-green-700 text-white">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  WhatsApp Gönder
                </Button>
                <Button className="w-full justify-start bg-blue-600 hover:bg-blue-700 text-white">
                  <Mail className="w-4 h-4 mr-2" />
                  Email Gönder
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>İstatistikler</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Toplam Proje:</span>
                    <span className="font-semibold">{projects.length}</span>
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
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-sm text-gray-500">Kayıt Tarihi:</span>
                    <span className="text-sm">{formatDate(customer.created_at)}</span>
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
