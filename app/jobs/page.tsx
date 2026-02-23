'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Eye, Loader2, TrendingUp, CheckCircle, Clock, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/components/providers/auth-provider';

interface Job {
  id: string | null;
  sale_id: string;
  customer_id: string;
  project_id: string | null;
  customer_name: string;
  project_name: string | null;
  invoice_number: string | null;
  status: string;
  current_step: string | null;
  notes: string | null;
  has_tracking: boolean;
  team_names: string;
}

export default function JobsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [addingTracking, setAddingTracking] = useState<string | null>(null);
  const [updatingStep, setUpdatingStep] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    satıldı: 0,
    devam_eden: 0,
    tamamlandı: 0,
  });

  useEffect(() => {
    loadJobs();
  }, [statusFilter]);

  const loadJobs = async () => {
    try {
      // Satışı gerçekleşmiş tüm satışları yükle
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select(`
          id,
          customer_id,
          project_id,
          invoice_number,
          final_amount,
          status,
          updated_at,
          customers(id, contact_person, company_name),
          customer_projects(id, project_name)
        `)
        .order('created_at', { ascending: false });

      if (salesError) throw salesError;

      const saleIds = (salesData || []).map((s: any) => s.id);

      // İş takibi kayıtlarını yükle
      const { data: trackingData } = saleIds.length > 0
        ? await supabase
            .from('job_tracking')
            .select('id, sale_id, status, current_step, notes, updated_at')
            .in('sale_id', saleIds)
        : { data: [] };

      const trackingMap = new Map(
        (trackingData || []).map((t: any) => [t.sale_id, t])
      );

      // Ekip atamalarını yükle (sale_id -> team names)
      const { data: assignmentsData } = saleIds.length > 0
        ? await supabase
            .from('job_assignments')
            .select('sale_id, teams(name)')
            .in('sale_id', saleIds)
        : { data: [] };

      const saleTeamsMap = new Map<string, string[]>();
      (assignmentsData || []).forEach((a: any) => {
        const team = Array.isArray(a.teams) ? a.teams[0] : a.teams;
        const name = team?.name || 'Bilinmeyen';
        const arr = saleTeamsMap.get(a.sale_id) || [];
        if (!arr.includes(name)) arr.push(name);
        saleTeamsMap.set(a.sale_id, arr);
      });

      const formattedJobs: Job[] = (salesData || []).map((sale: any) => {
        const customer = Array.isArray(sale.customers)
          ? sale.customers[0]
          : sale.customers;
        const project = sale.customer_projects
          ? (Array.isArray(sale.customer_projects) ? sale.customer_projects[0] : sale.customer_projects)
          : null;
        const tracking = trackingMap.get(sale.id);

        const teamNames = (saleTeamsMap.get(sale.id) || []).join(', ') || '-';
        return {
          id: tracking?.id || null,
          sale_id: sale.id,
          customer_id: sale.customer_id,
          project_id: sale.project_id,
          customer_name: customer?.company_name || customer?.contact_person || 'Bilinmeyen Müşteri',
          project_name: project?.project_name || null,
          invoice_number: sale.invoice_number || null,
          status: tracking?.status || sale.status || 'satıldı',
          current_step: tracking?.current_step || null,
          notes: tracking?.notes || null,
          has_tracking: !!tracking,
          team_names: teamNames,
        };
      });

      setJobs(formattedJobs);

      const newStats = {
        total: formattedJobs.length,
        satıldı: formattedJobs.filter((j) => j.status === 'satıldı').length,
        devam_eden: formattedJobs.filter((j) =>
          ['iş_yapımına_başlandı', 'devam_ediyor', 'gaz_açımına_geçildi', 'gaz_açımı_yapıldı'].includes(j.status)
        ).length,
        tamamlandı: formattedJobs.filter((j) => j.status === 'tamamlandı').length,
      };
      setStats(newStats);
    } catch (error: any) {
      console.error('İşler yüklenirken hata:', error);
      alert('İşler yüklenirken bir hata oluştu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTracking = async (saleId: string) => {
    setAddingTracking(saleId);
    try {
      const sale = jobs.find((j) => j.sale_id === saleId);
      if (!sale) return;

      const { data, error } = await supabase
        .from('job_tracking')
        .insert({
          sale_id: saleId,
          customer_id: sale.customer_id,
          project_id: sale.project_id,
          status: 'satıldı',
          updated_by: user?.id,
        })
        .select('id')
        .single();

      if (error) throw error;
      if (data?.id) {
        router.push(`/jobs/${data.id}`);
      }
    } catch (error: any) {
      alert('İş takibine eklenirken hata: ' + error.message);
    } finally {
      setAddingTracking(null);
    }
  };

  const getStatusLabel = (status: string) => {
    const statuses: Record<string, { label: string; color: string }> = {
      satıldı: { label: 'Satıldı', color: 'bg-blue-100 text-blue-800' },
      iş_yapımına_başlandı: { label: 'İş Yapımına Başlandı', color: 'bg-yellow-100 text-yellow-800' },
      devam_ediyor: { label: 'Devam Ediyor', color: 'bg-orange-100 text-orange-800' },
      gaz_açımına_geçildi: { label: 'Gaz Açımına Geçildi', color: 'bg-purple-100 text-purple-800' },
      gaz_açımı_yapıldı: { label: 'Gaz Açımı Yapıldı', color: 'bg-indigo-100 text-indigo-800' },
      tamamlandı: { label: 'Tamamlandı', color: 'bg-green-100 text-green-800' },
    };
    return statuses[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
  };

  const JOB_STEPS_ORDERED = [
    { value: 'kombi_montajı', label: 'Kombi Montajı' },
    { value: 'iç_gaz_montajı', label: 'İç Gaz Montajı' },
    { value: 'kolon', label: 'Kolon' },
    { value: 'kolektör_taşıma', label: 'Kolektör Taşıma' },
    { value: 'su_taşıma', label: 'Su Taşıma' },
    { value: 'full_montaj', label: 'Full Montaj' },
    { value: 'proje', label: 'Proje' },
    { value: 'gaz_açımı', label: 'Gaz Açımı' },
  ];

  const getStepIndex = (step: string | null) => {
    if (!step) return -1;
    return JOB_STEPS_ORDERED.findIndex((s) => s.value === step);
  };

  const isStepDone = (job: Job, stepValue: string) => {
    const currentIdx = getStepIndex(job.current_step);
    const stepIdx = JOB_STEPS_ORDERED.findIndex((s) => s.value === stepValue);
    return stepIdx >= 0 && stepIdx <= currentIdx;
  };

  const handleStepChange = async (trackingId: string, newStep: string) => {
    if (!newStep) return;
    setUpdatingStep(trackingId);
    try {
      const { error } = await supabase
        .from('job_tracking')
        .update({
          current_step: newStep,
          updated_by: user?.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', trackingId);

      if (error) throw error;
      setJobs((prev) =>
        prev.map((j) =>
          j.id === trackingId ? { ...j, current_step: newStep } : j
        )
      );
    } catch (error: any) {
      alert('Adım güncellenirken hata: ' + error.message);
    } finally {
      setUpdatingStep(null);
    }
  };

  const filteredJobs = jobs.filter((job) => {
    if (statusFilter !== 'all' && job.status !== statusFilter) return false;
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return (
      job.customer_name.toLowerCase().includes(s) ||
      job.project_name?.toLowerCase().includes(s) ||
      job.invoice_number?.toLowerCase().includes(s)
    );
  });

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
        <div>
          <h1 className="text-3xl font-bold text-gray-900">İş Takibi</h1>
          <p className="text-gray-700 mt-2 font-medium">Satışı gerçekleşmiş işleri takip edin</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Toplam İş</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Satıldı</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.satıldı}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-yellow-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Devam Eden</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.devam_eden}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tamamlanan</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.tamamlandı}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>İş Listesi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="search"
                  placeholder="Müşteri, proje veya fatura no ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Durum Filtresi</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                >
                  <option value="all">Tümü</option>
                  <option value="satıldı">Satıldı</option>
                  <option value="iş_yapımına_başlandı">İş Yapımına Başlandı</option>
                  <option value="devam_ediyor">Devam Ediyor</option>
                  <option value="gaz_açımına_geçildi">Gaz Açımına Geçildi</option>
                  <option value="gaz_açımı_yapıldı">Gaz Açımı Yapıldı</option>
                  <option value="tamamlandı">Tamamlandı</option>
                </select>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fatura No</TableHead>
                  <TableHead>Müşteri</TableHead>
                  <TableHead>Proje</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Ekip</TableHead>
                  <TableHead>Adımlar</TableHead>
                  <TableHead>İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredJobs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                      {searchTerm || statusFilter !== 'all'
                        ? 'Arama sonucu bulunamadı'
                        : 'Henüz satış gerçekleşmemiş'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredJobs.map((job) => {
                    const status = getStatusLabel(job.status);
                    return (
                      <TableRow key={job.sale_id} className="hover:bg-gray-50">
                        <TableCell className="font-medium">{job.invoice_number || '-'}</TableCell>
                        <TableCell className="font-medium">{job.customer_name}</TableCell>
                        <TableCell>{job.project_name || '-'}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                            {status.label}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm">{job.team_names}</TableCell>
                        <TableCell>
                          {job.has_tracking && job.id ? (
                            <select
                              value={job.current_step || ''}
                              onChange={(e) => handleStepChange(job.id!, e.target.value)}
                              disabled={updatingStep === job.id}
                              role="listbox"
                              className="w-full max-w-[180px] px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                            >
                              <option value="">Seçiniz...</option>
                              {JOB_STEPS_ORDERED.map((step, idx) => (
                                <option key={step.value} value={step.value}>
                                  {isStepDone(job, step.value) ? '✓ ' : ''}{idx + 1}. {step.label}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-gray-400 text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {job.has_tracking && job.id ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/jobs/${job.id}`)}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Takip Et
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAddTracking(job.sale_id)}
                              disabled={addingTracking === job.sale_id}
                              className="text-green-600 border-green-300 hover:bg-green-50"
                            >
                              {addingTracking === job.sale_id ? (
                                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                              ) : (
                                <Plus className="w-4 h-4 mr-1" />
                              )}
                              Takibe Al
                            </Button>
                          )}
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
