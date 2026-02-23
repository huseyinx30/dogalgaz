'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Loader2, Edit, Plus, Building2, FileText } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { formatDate, formatCurrency } from '@/lib/utils';
import { useAuth } from '@/components/providers/auth-provider';

interface JobAssignment {
  id: string;
  sale_id: string;
  team_id: string;
  team_name: string;
  customer_name: string;
  project_name: string | null;
  invoice_number: string | null;
  job_count: number;
  job_type: string;
  assigned_date: string;
  planned_start_date: string | null;
  planned_end_date: string | null;
  actual_start_date: string | null;
  actual_end_date: string | null;
  price: number;
  status: string;
  notes: string | null;
  assigned_by: string | null;
  assigned_by_name: string | null;
  created_at: string;
  updated_at: string;
}

interface TeamPayment {
  id: string;
  amount: number;
  payment_method: string;
  payment_date: string;
  reference_number: string | null;
  notes: string | null;
  created_at: string;
}

export default function JobAssignmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { profile } = useAuth();
  const assignmentId = params.id as string;
  
  const [assignment, setAssignment] = useState<JobAssignment | null>(null);
  const [payments, setPayments] = useState<TeamPayment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (assignmentId) {
      loadAssignmentData();
    }
  }, [assignmentId]);

  const loadAssignmentData = async () => {
    try {
      // İş ataması bilgileri
      const { data: assignmentData, error: assignmentError } = await supabase
        .from('job_assignments')
        .select('*')
        .eq('id', assignmentId)
        .single();

      if (assignmentError) throw assignmentError;

      // Ekip bilgisi
      const { data: teamData } = await supabase
        .from('teams')
        .select('name')
        .eq('id', assignmentData.team_id)
        .single();

      // Satış bilgisi (müşteri, proje ve iş sayısı için)
      const { data: saleData } = await supabase
        .from('sales')
        .select(`
          id,
          invoice_number,
          project_id,
          customers(id, contact_person, company_name),
          customer_projects(id, project_name, floor_count, apartments_per_floor, apartments_by_floor, shop_count, project_type, device_count)
        `)
        .eq('id', assignmentData.sale_id)
        .single();

      const customer = saleData?.customers
        ? (Array.isArray(saleData.customers) 
            ? saleData.customers[0] 
            : saleData.customers)
        : null;
      const project = saleData?.customer_projects
        ? (Array.isArray(saleData.customer_projects) 
            ? saleData.customer_projects[0] 
            : saleData.customer_projects)
        : null;

      const getJobCount = (proj: any, jobType: string): number => {
        if (!proj) return 0;
        let totalApartments = 0;
        if (proj.apartments_by_floor && Array.isArray(proj.apartments_by_floor)) {
          totalApartments = proj.apartments_by_floor.reduce((sum: number, n: number) => sum + Number(n || 0), 0);
        } else if (proj.floor_count != null && proj.apartments_per_floor != null) {
          totalApartments = proj.floor_count * proj.apartments_per_floor;
        } else if (proj.project_type === 'iş_yeri' && proj.device_count != null) {
          totalApartments = proj.device_count;
        }
        const shopCount = Number(proj.shop_count) || 0;
        if (jobType === 'kolon') return totalApartments + shopCount + 1;
        return totalApartments + shopCount;
      };

      // Atayan kullanıcı bilgisi
      let assignedByName = null;
      if (assignmentData.assigned_by) {
        const { data: userData } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', assignmentData.assigned_by)
          .single();
        assignedByName = userData?.full_name || null;
      }

      const formattedAssignment: JobAssignment = {
        id: assignmentData.id,
        sale_id: assignmentData.sale_id,
        team_id: assignmentData.team_id,
        team_name: teamData?.name || 'Bilinmeyen Ekip',
        customer_name: customer?.company_name || customer?.contact_person || 'Bilinmeyen',
        project_name: project?.project_name || null,
        invoice_number: saleData?.invoice_number || null,
        job_count: getJobCount(project, assignmentData.job_type),
        job_type: assignmentData.job_type,
        assigned_date: assignmentData.assigned_date,
        planned_start_date: assignmentData.planned_start_date,
        planned_end_date: assignmentData.planned_end_date,
        actual_start_date: assignmentData.actual_start_date,
        actual_end_date: assignmentData.actual_end_date,
        price: assignmentData.price,
        status: assignmentData.status,
        notes: assignmentData.notes,
        assigned_by: assignmentData.assigned_by,
        assigned_by_name: assignedByName,
        created_at: assignmentData.created_at,
        updated_at: assignmentData.updated_at,
      };

      setAssignment(formattedAssignment);

      // Ekip ödemeleri
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('team_payments')
        .select('*')
        .eq('job_assignment_id', assignmentId)
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

  const getStatusLabel = (status: string) => {
    const statuses: Record<string, { label: string; color: string }> = {
      'atandı': { label: 'Atandı', color: 'bg-blue-100 text-blue-800' },
      'başlandı': { label: 'Başlandı', color: 'bg-yellow-100 text-yellow-800' },
      'tamamlandı': { label: 'Tamamlandı', color: 'bg-green-100 text-green-800' },
      'iptal': { label: 'İptal', color: 'bg-red-100 text-red-800' },
    };
    return statuses[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
  };

  const getJobTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'kombi_montajı': 'Kombi Montajı',
      'iç_gaz_montajı': 'İç Gaz Montajı',
      'kolon': 'Kolon',
      'kolektör_taşıma': 'Kolektör Taşıma',
      'su_taşıma': 'Su Taşıma',
      'full_montaj': 'Full Montaj',
      'proje': 'Proje',
      'gaz_açımı': 'Gaz Açımı',
    };
    return types[type] || type;
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

  if (!assignment) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">İş ataması bulunamadı</p>
          <Button onClick={() => router.push('/teams/assignments')}>
            İş Atamaları Listesine Dön
          </Button>
        </div>
      </MainLayout>
    );
  }

  const status = getStatusLabel(assignment.status);
  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const remainingAmount = assignment.price - totalPaid;

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">İş Ataması Detayı</h1>
            <p className="text-gray-600 mt-1">
              {getJobTypeLabel(assignment.job_type)} - {assignment.team_name}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => router.push('/teams/assignments')}
              className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white"
            >
              <ArrowLeft className="w-4 h-4" />
              Geri Dön
            </Button>
            <Link href={`/teams/assignments/${assignmentId}/edit`}>
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
                <CardTitle>İş Ataması Bilgileri</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {profile?.role !== 'ekip' && (
                    <div>
                      <div className="text-sm text-gray-500">Fatura No</div>
                      <div className="font-medium">{assignment.invoice_number || '-'}</div>
                    </div>
                  )}
                  <div>
                    <div className="text-sm text-gray-500">Müşteri</div>
                    <div className="font-medium">{assignment.customer_name}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Proje</div>
                    <div className="font-medium">{assignment.project_name || '-'}</div>
                  </div>
                  {profile?.role === 'ekip' && (
                    <>
                      <div>
                        <div className="text-sm text-gray-500">Atanan İş Sayısı</div>
                        <div className="font-medium font-semibold">{assignment.job_count}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Hesaplanan Birim Fiyat</div>
                        <div className="font-medium font-semibold">
                          {assignment.job_count > 0
                            ? formatCurrency(assignment.price / assignment.job_count)
                            : '-'}
                        </div>
                      </div>
                    </>
                  )}
                  {profile?.role !== 'ekip' && (
                    <div>
                      <div className="text-sm text-gray-500">Ekip</div>
                      <div className="font-medium">{assignment.team_name}</div>
                    </div>
                  )}
                  <div>
                    <div className="text-sm text-gray-500">İş Tipi</div>
                    <div className="font-medium flex items-center gap-2 flex-wrap">
                      <span>{getJobTypeLabel(assignment.job_type)}</span>
                      {profile?.role !== 'ekip' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                          {assignment.team_name}
                        </span>
                      )}
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
                  <div>
                    <div className="text-sm text-gray-500">Atama Tarihi</div>
                    <div className="font-medium">{formatDate(assignment.assigned_date)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Fiyat</div>
                    <div className="font-semibold text-lg">{formatCurrency(assignment.price)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Planlanan Başlangıç</div>
                    <div className="font-medium">
                      {assignment.planned_start_date
                        ? formatDate(assignment.planned_start_date)
                        : '-'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Planlanan Bitiş</div>
                    <div className="font-medium">
                      {assignment.planned_end_date
                        ? formatDate(assignment.planned_end_date)
                        : '-'}
                    </div>
                  </div>
                  {assignment.actual_start_date && (
                    <div>
                      <div className="text-sm text-gray-500">Gerçek Başlangıç</div>
                      <div className="font-medium">{formatDate(assignment.actual_start_date)}</div>
                    </div>
                  )}
                  {assignment.actual_end_date && (
                    <div>
                      <div className="text-sm text-gray-500">Gerçek Bitiş</div>
                      <div className="font-medium">{formatDate(assignment.actual_end_date)}</div>
                    </div>
                  )}
                  {assignment.notes && (
                    <div className="col-span-2 pt-2 border-t">
                      <div className="text-sm text-gray-500 mb-1">Notlar:</div>
                      <div className="text-sm text-gray-600">{assignment.notes}</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex items-center justify-between">
                <CardTitle>Ekip Ödemeleri ({payments.length})</CardTitle>
                <Link href={`/teams/assignments/${assignmentId}/payment`}>
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
                    <span className="text-sm text-gray-500">Toplam Fiyat:</span>
                    <span className="font-semibold">{formatCurrency(assignment.price)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Ödenen:</span>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(totalPaid)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-sm text-gray-500">Kalan:</span>
                    <span className={`font-bold text-lg ${remainingAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(remainingAmount)}
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
                    <span className="text-sm">{formatDate(assignment.created_at)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Son Güncelleme:</span>
                    <span className="text-sm">{formatDate(assignment.updated_at)}</span>
                  </div>
                  {assignment.assigned_by_name && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Atayan:</span>
                      <span className="text-sm">{assignment.assigned_by_name}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Hızlı Erişim</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Link href={`/teams/${assignment.team_id}`}>
                    <Button variant="outline" className="w-full justify-start">
                      <Building2 className="w-4 h-4 mr-2" />
                      Ekip Detayı
                    </Button>
                  </Link>
                  <Link href={`/accounting/sales/${assignment.sale_id}`}>
                    <Button variant="outline" className="w-full justify-start">
                      <FileText className="w-4 h-4 mr-2" />
                      Satış Detayı
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
