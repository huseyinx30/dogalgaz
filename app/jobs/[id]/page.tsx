'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Loader2, Edit, ClipboardList } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { formatDate, formatCurrency } from '@/lib/utils';

interface JobAssignment {
  id: string;
  team_name: string;
  job_type: string;
  assigned_date: string;
  planned_start_date: string | null;
  planned_end_date: string | null;
  price: number;
  status: string;
}

interface Job {
  id: string;
  sale_id: string;
  customer_id: string;
  project_id: string | null;
  customer_name: string;
  project_name: string | null;
  invoice_number: string | null;
  sale_amount: number | null;
  status: string;
  current_step: string | null;
  notes: string | null;
  updated_by: string | null;
  updated_by_name: string | null;
  updated_at: string;
  created_at: string;
}

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;
  
  const [job, setJob] = useState<Job | null>(null);
  const [assignments, setAssignments] = useState<JobAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (jobId) {
      loadJobData();
    }
  }, [jobId]);

  const loadJobData = async () => {
    try {
      // İş takibi bilgileri
      const { data: jobData, error: jobError } = await supabase
        .from('job_tracking')
        .select('*')
        .eq('id', jobId)
        .single();

      if (jobError) throw jobError;

      // Müşteri bilgisi
      const { data: customerData } = await supabase
        .from('customers')
        .select('id, contact_person, company_name')
        .eq('id', jobData.customer_id)
        .single();

      // Proje bilgisi
      let projectName = null;
      if (jobData.project_id) {
        const { data: projectData } = await supabase
          .from('customer_projects')
          .select('project_name')
          .eq('id', jobData.project_id)
          .single();
        projectName = projectData?.project_name || null;
      }

      // Satış bilgisi (fatura no, tutar)
      let invoiceNumber = null;
      let saleAmount = null;
      if (jobData.sale_id) {
        const { data: saleData } = await supabase
          .from('sales')
          .select('invoice_number, final_amount')
          .eq('id', jobData.sale_id)
          .single();
        invoiceNumber = saleData?.invoice_number || null;
        saleAmount = saleData?.final_amount || null;
      }

      // İş atamalarını yükle
      let assignmentsList: JobAssignment[] = [];
      if (jobData.sale_id) {
        const { data: assignData } = await supabase
          .from('job_assignments')
          .select(`
            id, job_type, assigned_date, planned_start_date, planned_end_date, price, status,
            teams(id, name)
          `)
          .eq('sale_id', jobData.sale_id)
          .order('assigned_date', { ascending: false });
        if (assignData) {
          assignmentsList = assignData.map((a: any) => {
            const team = Array.isArray(a.teams) ? a.teams[0] : a.teams;
            return {
            id: a.id,
            team_name: team?.name || 'Bilinmeyen',
            job_type: a.job_type,
            assigned_date: a.assigned_date,
            planned_start_date: a.planned_start_date,
            planned_end_date: a.planned_end_date,
            price: a.price,
            status: a.status,
          };
          });
        }
      }
      setAssignments(assignmentsList);

      // Güncelleyen kullanıcı bilgisi
      let updatedByName = null;
      if (jobData.updated_by) {
        const { data: userData } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', jobData.updated_by)
          .single();
        updatedByName = userData?.full_name || null;
      }

      const formattedJob: Job = {
        id: jobData.id,
        sale_id: jobData.sale_id,
        customer_id: jobData.customer_id,
        project_id: jobData.project_id,
        customer_name: customerData?.company_name || customerData?.contact_person || 'Bilinmeyen Müşteri',
        project_name: projectName,
        invoice_number: invoiceNumber,
        sale_amount: saleAmount,
        status: jobData.status,
        current_step: jobData.current_step,
        notes: jobData.notes,
        updated_by: jobData.updated_by,
        updated_by_name: updatedByName,
        updated_at: jobData.updated_at,
        created_at: jobData.created_at,
      };

      setJob(formattedJob);
    } catch (error: any) {
      console.error('Veri yüklenirken hata:', error);
      alert('Veri yüklenirken bir hata oluştu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (status: string) => {
    const statuses: Record<string, { label: string; color: string }> = {
      'satıldı': { label: 'Satıldı', color: 'bg-blue-100 text-blue-800' },
      'iş_yapımına_başlandı': { label: 'İş Yapımına Başlandı', color: 'bg-yellow-100 text-yellow-800' },
      'devam_ediyor': { label: 'Devam Ediyor', color: 'bg-orange-100 text-orange-800' },
      'gaz_açımına_geçildi': { label: 'Gaz Açımına Geçildi', color: 'bg-purple-100 text-purple-800' },
      'gaz_açımı_yapıldı': { label: 'Gaz Açımı Yapıldı', color: 'bg-indigo-100 text-indigo-800' },
      'tamamlandı': { label: 'Tamamlandı', color: 'bg-green-100 text-green-800' },
    };
    return statuses[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
  };

  const getStepLabel = (step: string | null) => {
    if (!step) return '-';
    const steps: Record<string, string> = {
      'kombi_montajı': 'Kombi Montajı',
      'iç_gaz_montajı': 'İç Gaz Montajı',
      'kolon': 'Kolon',
      'kolektör_taşıma': 'Kolektör Taşıma',
      'su_taşıma': 'Su Taşıma',
      'full_montaj': 'Full Montaj',
      'proje': 'Proje',
      'gaz_açımı': 'Gaz Açımı',
    };
    return steps[step] || step;
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

  if (!job) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">İş bulunamadı</p>
          <Button onClick={() => router.push('/jobs')}>
            İş Listesine Dön
          </Button>
        </div>
      </MainLayout>
    );
  }

  const status = getStatusLabel(job.status);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">İş Detayı</h1>
            <p className="text-gray-600 mt-1">
              Müşteri: {job.customer_name}
              {job.project_name && ` - Proje: ${job.project_name}`}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => router.push('/jobs')}
              className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white"
            >
              <ArrowLeft className="w-4 h-4" />
              Geri Dön
            </Button>
            <Link href={`/jobs/${jobId}/edit`}>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Edit className="w-4 h-4 mr-2" />
                Takip Güncelle
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>İş Bilgileri</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">Fatura No</div>
                    <div className="font-medium">{job.invoice_number || '-'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Satış Tutarı</div>
                    <div className="font-medium">{job.sale_amount != null ? formatCurrency(job.sale_amount) : '-'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Müşteri</div>
                    <div className="font-medium">{job.customer_name}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Proje</div>
                    <div className="font-medium">{job.project_name || '-'}</div>
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
                    <div className="text-sm text-gray-500">Mevcut Adım</div>
                    <div className="font-medium">{getStepLabel(job.current_step)}</div>
                  </div>
                  {job.notes && (
                    <div className="col-span-2 pt-2 border-t">
                      <div className="text-sm text-gray-500 mb-1">Notlar:</div>
                      <div className="text-sm text-gray-600">{job.notes}</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {assignments.length > 0 && (
              <Card>
                <CardHeader className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardList className="w-5 h-5" />
                    Ekip Atamaları ({assignments.length})
                  </CardTitle>
                  <Link href={`/teams/assignments/new?sale_id=${job.sale_id}`}>
                    <Button size="sm" variant="outline">Yeni Atama</Button>
                  </Link>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ekip</TableHead>
                        <TableHead>İş Tipi</TableHead>
                        <TableHead>Atama Tarihi</TableHead>
                        <TableHead>Planlanan</TableHead>
                        <TableHead>Fiyat</TableHead>
                        <TableHead>Durum</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assignments.map((a) => (
                        <TableRow key={a.id}>
                          <TableCell>{a.team_name}</TableCell>
                          <TableCell>{getStepLabel(a.job_type)}</TableCell>
                          <TableCell>{formatDate(a.assigned_date)}</TableCell>
                          <TableCell>
                            {a.planned_start_date && a.planned_end_date
                              ? `${formatDate(a.planned_start_date)} - ${formatDate(a.planned_end_date)}`
                              : '-'}
                          </TableCell>
                          <TableCell className="font-semibold">{formatCurrency(a.price)}</TableCell>
                          <TableCell>
                            <span className="px-2 py-1 rounded-full text-xs bg-gray-100">
                              {a.status}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/teams/assignments/${a.id}`)}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              Detay
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Bilgiler</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Oluşturulma:</span>
                    <span className="text-sm">{formatDate(job.created_at)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Son Güncelleme:</span>
                    <span className="text-sm">{formatDate(job.updated_at)}</span>
                  </div>
                  {job.updated_by_name && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Güncelleyen:</span>
                      <span className="text-sm">{job.updated_by_name}</span>
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
                  <Link href={`/customers/${job.customer_id}`}>
                    <Button variant="outline" className="w-full justify-start">
                      Müşteri Detayı
                    </Button>
                  </Link>
                  {job.sale_id && (
                    <Link href={`/accounting/sales/${job.sale_id}`}>
                      <Button variant="outline" className="w-full justify-start">
                        Satış Detayı
                      </Button>
                    </Link>
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
