'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/utils';

interface JobAssignment {
  id: string;
  sale_id: string;
  team_id: string;
  team_name: string;
  customer_name: string;
  project_name: string | null;
  invoice_number: string | null;
  job_type: string;
  assigned_date: string;
  planned_start_date: string | null;
  planned_end_date: string | null;
  price: number;
  status: string;
  notes: string | null;
}

export default function JobAssignmentEditPage() {
  const params = useParams();
  const router = useRouter();
  const assignmentId = params.id as string;

  const [assignment, setAssignment] = useState<JobAssignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    assigned_date: '',
    planned_start_date: '',
    planned_end_date: '',
    status: 'atandı',
    notes: '',
  });

  useEffect(() => {
    if (assignmentId) {
      loadAssignmentData();
    }
  }, [assignmentId]);

  const loadAssignmentData = async () => {
    try {
      const { data: assignmentData, error: assignmentError } = await supabase
        .from('job_assignments')
        .select('*')
        .eq('id', assignmentId)
        .single();

      if (assignmentError) throw assignmentError;

      const { data: teamData } = await supabase
        .from('teams')
        .select('name')
        .eq('id', assignmentData.team_id)
        .single();

      const { data: saleData } = await supabase
        .from('sales')
        .select(`
          id,
          invoice_number,
          customers(id, contact_person, company_name),
          customer_projects(id, project_name)
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

      const formatted: JobAssignment = {
        id: assignmentData.id,
        sale_id: assignmentData.sale_id,
        team_id: assignmentData.team_id,
        team_name: teamData?.name || 'Bilinmeyen Ekip',
        customer_name: customer?.company_name || customer?.contact_person || 'Bilinmeyen',
        project_name: project?.project_name || null,
        invoice_number: saleData?.invoice_number || null,
        job_type: assignmentData.job_type,
        assigned_date: assignmentData.assigned_date,
        planned_start_date: assignmentData.planned_start_date,
        planned_end_date: assignmentData.planned_end_date,
        price: assignmentData.price,
        status: assignmentData.status,
        notes: assignmentData.notes,
      };

      setAssignment(formatted);
      setFormData({
        assigned_date: assignmentData.assigned_date || '',
        planned_start_date: assignmentData.planned_start_date || '',
        planned_end_date: assignmentData.planned_end_date || '',
        status: assignmentData.status || 'atandı',
        notes: assignmentData.notes || '',
      });
    } catch (error: any) {
      console.error('Veri yüklenirken hata:', error);
      alert('Veri yüklenirken bir hata oluştu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignment) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('job_assignments')
        .update({
          assigned_date: formData.assigned_date,
          planned_start_date: formData.planned_start_date || null,
          planned_end_date: formData.planned_end_date || null,
          status: formData.status,
          notes: formData.notes || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', assignmentId);

      if (error) throw error;

      router.push(`/teams/assignments/${assignmentId}`);
    } catch (error: any) {
      console.error('Güncelleme hatası:', error);
      alert('Güncelleme sırasında bir hata oluştu: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const getJobTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      kombi_montajı: 'Kombi Montajı',
      iç_gaz_montajı: 'İç Gaz Montajı',
      kolon: 'Kolon',
      kolektör_taşıma: 'Kolektör Taşıma',
      su_taşıma: 'Su Taşıma',
      full_montaj: 'Full Montaj',
      proje: 'Proje',
      gaz_açımı: 'Gaz Açımı',
    };
    return types[type] || type;
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

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">İş Ataması Düzenle</h1>
            <p className="text-gray-600 mt-1">
              {getJobTypeLabel(assignment.job_type)} - {assignment.team_name}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => router.push(`/teams/assignments/${assignmentId}`)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Geri Dön
            </Button>
            <Link href={`/teams/assignments/${assignmentId}`}>
              <Button className="bg-gray-600 hover:bg-gray-700 text-white">Detay</Button>
            </Link>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Düzenlenebilir Alanlar</CardTitle>
            <p className="text-sm text-gray-500 font-normal mt-1">
              Fatura No, Müşteri, Ekip ve İş Tipi değiştirilemez.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg mb-4">
                <div>
                  <div className="text-sm text-gray-500">Fatura No</div>
                  <div className="font-medium">{assignment.invoice_number || '-'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Müşteri</div>
                  <div className="font-medium">{assignment.customer_name}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Ekip</div>
                  <div className="font-medium">{assignment.team_name}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">İş Tipi</div>
                  <div className="font-medium">{getJobTypeLabel(assignment.job_type)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Fiyat</div>
                  <div className="font-semibold">{formatCurrency(assignment.price)}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Atama Tarihi <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="date"
                    value={formData.assigned_date}
                    onChange={(e) =>
                      setFormData({ ...formData, assigned_date: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Planlanan Başlangıç
                  </label>
                  <Input
                    type="date"
                    value={formData.planned_start_date}
                    onChange={(e) =>
                      setFormData({ ...formData, planned_start_date: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Planlanan Bitiş
                  </label>
                  <Input
                    type="date"
                    value={formData.planned_end_date}
                    onChange={(e) =>
                      setFormData({ ...formData, planned_end_date: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Durum
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  >
                    <option value="atandı">Atandı</option>
                    <option value="başlandı">Başlandı</option>
                    <option value="tamamlandı">Tamamlandı</option>
                    <option value="iptal">İptal</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notlar</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="İş ataması ile ilgili notlar"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white">
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Kaydediliyor...
                    </>
                  ) : (
                    'Değişiklikleri Kaydet'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/teams/assignments/${assignmentId}`)}
                >
                  İptal
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
