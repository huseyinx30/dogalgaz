'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/utils';

interface Team {
  id: string;
  name: string;
}

interface JobAssignment {
  id: string;
  job_type: string;
  customer_name: string;
  price: number;
  paid_amount: number;
  remaining_amount: number;
}

export default function AddTeamPaymentPage() {
  const params = useParams();
  const router = useRouter();
  const teamId = params.id as string;
  
  const [team, setTeam] = useState<Team | null>(null);
  const [assignments, setAssignments] = useState<JobAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    payment_method: 'nakit' as 'nakit' | 'kredi_kartı' | 'banka_havalesi' | 'çek' | 'senet' | 'kredi_kartı_taksit',
    payment_date: new Date().toISOString().split('T')[0],
    reference_number: '',
    notes: '',
  });

  useEffect(() => {
    if (teamId) {
      loadTeamData();
    }
  }, [teamId]);

  const loadTeamData = async () => {
    try {
      // Ekip bilgisi
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .select('id, name')
        .eq('id', teamId)
        .single();

      if (teamError) throw teamError;
      setTeam({ id: teamData.id, name: teamData.name });

      // İş atamalarını sadece özet bilgileri için yükle (ödemeler için değil)
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('job_assignments')
        .select(`
          *,
          sales!inner(
            customers(id, contact_person, company_name)
          )
        `)
        .eq('team_id', teamId)
        .order('assigned_date', { ascending: false });

      if (assignmentsError) throw assignmentsError;

      // Her iş ataması için ödenen tutarı hesapla (sadece özet için)
      const assignmentIds = (assignmentsData || []).map(a => a.id);
      const { data: paymentsData } = await supabase
        .from('team_payments')
        .select('job_assignment_id, amount')
        .eq('team_id', teamId)
        .in('job_assignment_id', assignmentIds);

      const paymentsMap = new Map<string, number>();
      paymentsData?.forEach((payment: any) => {
        if (payment.job_assignment_id) {
          const current = paymentsMap.get(payment.job_assignment_id) || 0;
          paymentsMap.set(payment.job_assignment_id, current + payment.amount);
        }
      });

      const formattedAssignments = (assignmentsData || []).map((assignment: any) => {
        const customer = Array.isArray(assignment.sales?.customers)
          ? assignment.sales.customers[0]
          : assignment.sales?.customers;
        
        const paid = paymentsMap.get(assignment.id) || 0;
        const remaining = assignment.price - paid;

        return {
          id: assignment.id,
          job_type: assignment.job_type,
          customer_name: customer?.company_name || customer?.contact_person || 'Bilinmeyen',
          price: assignment.price,
          paid_amount: paid,
          remaining_amount: remaining,
        };
      });

      setAssignments(formattedAssignments);
    } catch (error: any) {
      console.error('Veriler yüklenirken hata:', error);
      alert('Veriler yüklenirken bir hata oluştu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!team) return;

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      alert('Lütfen geçerli bir tutar girin');
      return;
    }

    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('team_payments')
        .insert({
          team_id: teamId,
          job_assignment_id: null, // Genel ödeme - iş ataması yok
          amount: amount,
          payment_method: formData.payment_method,
          payment_date: formData.payment_date,
          reference_number: formData.reference_number || null,
          notes: formData.notes || null,
          created_by: user?.id,
        });

      if (error) throw error;

      router.push(`/teams/${teamId}`);
    } catch (error: any) {
      console.error('Ödeme eklenirken hata:', error);
      alert('Ödeme eklenirken bir hata oluştu: ' + error.message);
    } finally {
      setSaving(false);
    }
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


  const totalRemaining = assignments.reduce((sum, a) => sum + a.remaining_amount, 0);

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

  if (!team) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">Ekip bulunamadı</p>
          <Button onClick={() => router.push('/teams')}>
            Ekip Listesine Dön
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
            <h1 className="text-3xl font-bold text-gray-900">Ekibe Ödeme Ekle</h1>
            <p className="text-gray-600 mt-1">
              Ekip: {team.name}
            </p>
          </div>
          <Button
            onClick={() => router.push(`/teams/${teamId}`)}
            className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            Geri Dön
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Ödeme Bilgileri</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ödeme Tutarı <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      placeholder="Ödeme tutarını girin"
                      required
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Genel ödeme tutarını girin
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ödeme Şekli <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.payment_method}
                      onChange={(e) => setFormData({ ...formData, payment_method: e.target.value as any })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    >
                      <option value="nakit">Nakit</option>
                      <option value="kredi_kartı">Kredi Kartı</option>
                      <option value="banka_havalesi">Banka Havalesi</option>
                      <option value="çek">Çek</option>
                      <option value="senet">Senet</option>
                      <option value="kredi_kartı_taksit">Kredi Kartı Taksit</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ödeme Tarihi <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="date"
                      value={formData.payment_date}
                      onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Referans No / İşlem No
                    </label>
                    <Input
                      type="text"
                      value={formData.reference_number}
                      onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                      placeholder="Örn: Çek no, Havale no, İşlem no"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notlar
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Ödeme ile ilgili notlar"
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      type="submit"
                      disabled={saving || !formData.amount || parseFloat(formData.amount) <= 0}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Kaydediliyor...
                        </>
                      ) : (
                        'Ödemeyi Kaydet'
                      )}
                    </Button>
                    <Button
                      type="button"
                      className="bg-gray-500 hover:bg-gray-600 text-white"
                      onClick={() => router.push(`/teams/${teamId}`)}
                    >
                      İptal
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Özet</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Toplam İş Tutarı:</span>
                    <span className="font-semibold">
                      {formatCurrency(assignments.reduce((sum, a) => sum + a.price, 0))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Toplam Ödenen:</span>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(assignments.reduce((sum, a) => sum + a.paid_amount, 0))}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-sm font-medium text-gray-700">Toplam Kalan Borç:</span>
                    <span className={`font-bold text-lg ${totalRemaining > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(totalRemaining)}
                    </span>
                  </div>
                  {formData.amount && parseFloat(formData.amount) > 0 && (
                    <>
                      <div className="flex justify-between pt-2 border-t">
                        <span className="text-sm text-gray-500">Bu Ödeme:</span>
                        <span className="font-semibold text-blue-600">
                          {formatCurrency(parseFloat(formData.amount))}
                        </span>
                      </div>
                      <div className="flex justify-between pt-2 border-t">
                        <span className="text-sm font-medium text-gray-700">Yeni Kalan Borç:</span>
                        <span className={`font-bold text-lg ${totalRemaining - parseFloat(formData.amount) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {formatCurrency(Math.max(0, totalRemaining - parseFloat(formData.amount)))}
                        </span>
                      </div>
                    </>
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
