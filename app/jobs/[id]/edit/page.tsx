'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/components/providers/auth-provider';

const JOB_STATUSES = [
  { value: 'satıldı', label: 'Satıldı' },
  { value: 'iş_yapımına_başlandı', label: 'İş Yapımına Başlandı' },
  { value: 'devam_ediyor', label: 'Devam Ediyor' },
  { value: 'gaz_açımına_geçildi', label: 'Gaz Açımına Geçildi' },
  { value: 'gaz_açımı_yapıldı', label: 'Gaz Açımı Yapıldı' },
  { value: 'tamamlandı', label: 'Tamamlandı' },
];

const JOB_STEPS = [
  { value: 'kombi_montajı', label: 'Kombi Montajı' },
  { value: 'iç_gaz_montajı', label: 'İç Gaz Montajı' },
  { value: 'kolon', label: 'Kolon' },
  { value: 'kolektör_taşıma', label: 'Kolektör Taşıma' },
  { value: 'su_taşıma', label: 'Su Taşıma' },
  { value: 'full_montaj', label: 'Full Montaj' },
  { value: 'proje', label: 'Proje' },
  { value: 'gaz_açımı', label: 'Gaz Açımı' },
];

export default function JobEditPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const jobId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [formData, setFormData] = useState({
    status: 'satıldı',
    current_step: '' as string | null,
    notes: '',
  });

  useEffect(() => {
    if (jobId) loadJob();
  }, [jobId]);

  const loadJob = async () => {
    try {
      const { data: jobData, error: jobError } = await supabase
        .from('job_tracking')
        .select('*')
        .eq('id', jobId)
        .single();

      if (jobError) throw jobError;

      const { data: customerData } = await supabase
        .from('customers')
        .select('contact_person, company_name')
        .eq('id', jobData.customer_id)
        .single();

      const { data: saleData } = await supabase
        .from('sales')
        .select('invoice_number')
        .eq('id', jobData.sale_id)
        .single();

      setCustomerName(customerData?.company_name || customerData?.contact_person || '');
      setInvoiceNumber(saleData?.invoice_number || '');
      setFormData({
        status: jobData.status || 'satıldı',
        current_step: jobData.current_step || null,
        notes: jobData.notes || '',
      });
    } catch (error: any) {
      console.error('İş yüklenirken hata:', error);
      alert('İş yüklenirken bir hata oluştu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await supabase
        .from('job_tracking')
        .update({
          status: formData.status,
          current_step: formData.current_step || null,
          notes: formData.notes.trim() || null,
          updated_by: user?.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', jobId);

      if (error) throw error;
      alert('İş takibi güncellendi');
      router.push(`/jobs/${jobId}`);
    } catch (error: any) {
      alert('Güncellenirken hata: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">İş Takibi Güncelle</h1>
            <p className="text-gray-700 mt-2 font-medium">
              {customerName} {invoiceNumber && `- ${invoiceNumber}`}
            </p>
          </div>
          <Button
            onClick={() => router.push(`/jobs/${jobId}`)}
            className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            Geri Dön
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Takip Bilgileri</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">İş Durumu</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                >
                  {JOB_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mevcut Adım</label>
                <select
                  value={formData.current_step || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      current_step: e.target.value || null,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                >
                  <option value="">Seçiniz</option>
                  {JOB_STEPS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notlar</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="İşle ilgili notlar..."
                />
              </div>

              <div className="flex gap-4">
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Kaydediliyor...
                    </>
                  ) : (
                    'Kaydet'
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.push(`/jobs/${jobId}`)}>
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
