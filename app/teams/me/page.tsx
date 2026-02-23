'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, User, Edit2, Save, X, Wallet, ClipboardList } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { formatDate, formatCurrency } from '@/lib/utils';
import { useAuth } from '@/components/providers/auth-provider';

interface Team {
  id: string;
  name: string;
  authorized_person: string | null;
  phone: string | null;
  email: string | null;
}

interface JobAssignment {
  id: string;
  sale_id: string;
  customer_name: string;
  job_type: string;
  assigned_date: string;
  planned_start_date: string | null;
  planned_end_date: string | null;
  price: number;
  status: string;
  paid_amount: number;
  remaining_amount: number;
}

interface TeamPayment {
  id: string;
  job_assignment_id: string | null;
  job_type: string | null;
  customer_name: string | null;
  amount: number;
  payment_method: string;
  payment_date: string;
  reference_number: string | null;
  notes: string | null;
}

export default function TeamMePage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [team, setTeam] = useState<Team | null>(null);
  const [assignments, setAssignments] = useState<JobAssignment[]>([]);
  const [payments, setPayments] = useState<TeamPayment[]>([]);
  const [totalPaidFromPayments, setTotalPaidFromPayments] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editProfile, setEditProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    phone: '',
  });

  useEffect(() => {
    if (!user || profile?.role !== 'ekip') {
      router.replace('/dashboard');
      return;
    }
    loadData();
  }, [user, profile?.role]);

  useEffect(() => {
    if (profile) {
      setProfileForm({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
      });
    }
  }, [profile]);

  const loadData = async () => {
    if (!user) return;
    try {
      const { data: memberData, error: memberError } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('member_id', user.id)
        .limit(1)
        .maybeSingle();

      if (memberError || !memberData?.team_id) {
        setLoading(false);
        return;
      }

      const teamId = memberData.team_id;

      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .select('id, name, authorized_person, phone, email')
        .eq('id', teamId)
        .single();

      if (teamError || !teamData) {
        setLoading(false);
        return;
      }

      setTeam({
        id: teamData.id,
        name: teamData.name,
        authorized_person: teamData.authorized_person || null,
        phone: teamData.phone || null,
        email: teamData.email || null,
      });

      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('job_assignments')
        .select(`
          id, sale_id, job_type, assigned_date, planned_start_date, planned_end_date, price, status,
          sales!inner(customers(id, contact_person, company_name))
        `)
        .eq('team_id', teamId)
        .order('assigned_date', { ascending: false });

      if (!assignmentsError && assignmentsData) {
        const formatted = assignmentsData.map((a: any) => {
          const customer = Array.isArray(a.sales?.customers)
            ? a.sales.customers[0]
            : a.sales?.customers;
          return {
            id: a.id,
            sale_id: a.sale_id,
            customer_name: customer?.company_name || customer?.contact_person || 'Bilinmeyen',
            job_type: a.job_type,
            assigned_date: a.assigned_date,
            planned_start_date: a.planned_start_date,
            planned_end_date: a.planned_end_date,
            price: a.price,
            status: a.status,
            paid_amount: 0,
            remaining_amount: a.price,
          };
        });
        setAssignments(formatted);
      }

      const { data: paymentsData, error: paymentsError } = await supabase
        .from('team_payments')
        .select(`
          id, job_assignment_id, amount, payment_method, payment_date, reference_number, notes,
          job_assignments!left(id, job_type, sales!inner(customers(id, contact_person, company_name)))
        `)
        .eq('team_id', teamId)
        .order('payment_date', { ascending: false });

      if (!paymentsError && paymentsData) {
        const formatted = paymentsData.map((p: any) => {
          const assignment = p.job_assignments;
          let customerName = null;
          let jobType = null;
          if (assignment) {
            jobType = assignment.job_type;
            const customer = assignment.sales?.customers
              ? (Array.isArray(assignment.sales.customers)
                  ? assignment.sales.customers[0]
                  : assignment.sales.customers)
              : null;
            customerName = customer?.company_name || customer?.contact_person || null;
          }
          return {
            id: p.id,
            job_assignment_id: p.job_assignment_id,
            job_type: jobType,
            customer_name: customerName,
            amount: Number(p.amount) || 0,
            payment_method: p.payment_method,
            payment_date: p.payment_date,
            reference_number: p.reference_number,
            notes: p.notes,
          };
        });
        setPayments(formatted);

        const assignmentPayments = new Map<string, number>();
        let totalPaidFromAllPayments = 0;
        formatted.forEach((p) => {
          totalPaidFromAllPayments += p.amount;
          if (p.job_assignment_id) {
            const cur = assignmentPayments.get(p.job_assignment_id) || 0;
            assignmentPayments.set(p.job_assignment_id, cur + p.amount);
          }
        });
        setTotalPaidFromPayments(totalPaidFromAllPayments);
        setAssignments((prev) =>
          prev.map((a) => {
            const paid = assignmentPayments.get(a.id) || 0;
            return { ...a, paid_amount: paid, remaining_amount: a.price - paid };
          })
        );
      }
    } catch (error: any) {
      console.error('Veri yüklenirken hata:', error);
      alert('Veri yüklenirken bir hata oluştu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        alert('Oturum süresi dolmuş olabilir. Lütfen tekrar giriş yapın.');
        setSavingProfile(false);
        return;
      }
      const res = await fetch('/api/users/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          full_name: profileForm.full_name.trim() || null,
          phone: profileForm.phone.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Güncelleme başarısız');
      setEditProfile(false);
      window.location.reload();
    } catch (error: any) {
      console.error('Profil güncellenirken hata:', error);
      alert('Profil güncellenirken bir hata oluştu: ' + error.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const getStatusLabel = (status: string) => {
    const statuses: Record<string, { label: string; color: string }> = {
      atandı: { label: 'Atandı', color: 'bg-blue-100 text-blue-800' },
      başlandı: { label: 'Başlandı', color: 'bg-yellow-100 text-yellow-800' },
      tamamlandı: { label: 'Tamamlandı', color: 'bg-green-100 text-green-800' },
      iptal: { label: 'İptal', color: 'bg-red-100 text-red-800' },
    };
    return statuses[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
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

  const getPaymentMethodLabel = (method: string) => {
    const methods: Record<string, string> = {
      nakit: 'Nakit',
      kredi_kartı: 'Kredi Kartı',
      banka_havalesi: 'Banka Havalesi',
      çek: 'Çek',
      senet: 'Senet',
      kredi_kartı_taksit: 'Kredi Kartı Taksit',
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

  if (!team) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">Ekip bilgisi bulunamadı. Lütfen yöneticinizle iletişime geçin.</p>
          <Button onClick={() => router.push('/dashboard')}>Dashboarda Dön</Button>
        </div>
      </MainLayout>
    );
  }

  const totalWorkAmount = assignments.reduce((s, a) => s + a.price, 0);
  const totalPaid = totalPaidFromPayments;
  const totalRemaining = Math.max(0, totalWorkAmount - totalPaid);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ekip Paneli</h1>
          <p className="text-gray-700 mt-2 font-medium">{team.name}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Bilgilerim
                </CardTitle>
                {!editProfile ? (
                  <Button variant="outline" size="sm" onClick={() => setEditProfile(true)}>
                    <Edit2 className="w-4 h-4 mr-1" />
                    Düzenle
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setEditProfile(false)}>
                      <X className="w-4 h-4 mr-1" />
                      İptal
                    </Button>
                    <Button size="sm" onClick={handleSaveProfile} disabled={savingProfile} className="bg-blue-600 hover:bg-blue-700">
                      {savingProfile ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-1" />
                      ) : (
                        <Save className="w-4 h-4 mr-1" />
                      )}
                      Kaydet
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {editProfile ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ad Soyad</label>
                      <Input
                        value={profileForm.full_name}
                        onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                        placeholder="Ad Soyad"
                        className="max-w-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                      <Input
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                        placeholder="Telefon"
                        className="max-w-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">E-posta (değiştirilemez)</label>
                      <p className="text-gray-900">{profile?.email || '-'}</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-gray-500">Ad Soyad:</span>{' '}
                      <span className="font-medium">{profileForm.full_name || '-'}</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Telefon:</span>{' '}
                      <span className="font-medium">{profileForm.phone || '-'}</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">E-posta:</span>{' '}
                      <span className="font-medium">{profile?.email || '-'}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="w-5 h-5" />
                  Atanan İşler ({assignments.length})
                </CardTitle>
                <Link href="/teams/assignments">
                  <Button variant="outline" size="sm">Tümünü Gör</Button>
                </Link>
              </CardHeader>
              <CardContent>
                {assignments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Henüz iş ataması yapılmamış
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Müşteri</TableHead>
                        <TableHead>İş Tipi</TableHead>
                        <TableHead>Atama Tarihi</TableHead>
                        <TableHead>Fiyat</TableHead>
                        <TableHead>Ödenen</TableHead>
                        <TableHead>Kalan</TableHead>
                        <TableHead>Durum</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assignments.slice(0, 10).map((a) => {
                        const status = getStatusLabel(a.status);
                        return (
                          <TableRow key={a.id}>
                            <TableCell>{a.customer_name}</TableCell>
                            <TableCell>
                              {a.job_type === 'proje' ? (
                                <span className="inline-flex items-center text-sm font-semibold px-3 py-1.5 rounded-lg bg-blue-500 text-white shadow-sm ring-2 ring-blue-200">
                                  {getJobTypeLabel(a.job_type)}
                                </span>
                              ) : (
                                getJobTypeLabel(a.job_type)
                              )}
                            </TableCell>
                            <TableCell>{formatDate(a.assigned_date)}</TableCell>
                            <TableCell className="font-semibold">{formatCurrency(a.price)}</TableCell>
                            <TableCell className="text-green-600 font-semibold">{formatCurrency(a.paid_amount)}</TableCell>
                            <TableCell className={a.remaining_amount > 0 ? 'text-red-600 font-semibold' : 'text-green-600'}>
                              {formatCurrency(a.remaining_amount)}
                            </TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded-full text-xs ${status.color}`}>
                                {status.label}
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
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="w-5 h-5" />
                  Ekip Ödemeleri ({payments.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {payments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Henüz ödeme kaydı yok
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tarih</TableHead>
                        <TableHead>İş Tipi</TableHead>
                        <TableHead>Müşteri</TableHead>
                        <TableHead>Tutar</TableHead>
                        <TableHead>Ödeme Şekli</TableHead>
                        <TableHead>Referans</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell>{formatDate(p.payment_date)}</TableCell>
                          <TableCell>
                            {p.job_type === 'proje' ? (
                              <span className="inline-flex items-center text-sm font-semibold px-3 py-1.5 rounded-lg bg-blue-500 text-white shadow-sm ring-2 ring-blue-200">
                                {getJobTypeLabel(p.job_type)}
                              </span>
                            ) : (
                              p.job_type ? getJobTypeLabel(p.job_type) : '-'
                            )}
                          </TableCell>
                          <TableCell>{p.customer_name || '-'}</TableCell>
                          <TableCell className="font-semibold text-green-600">
                            {formatCurrency(p.amount)}
                          </TableCell>
                          <TableCell>{getPaymentMethodLabel(p.payment_method)}</TableCell>
                          <TableCell>{p.reference_number || '-'}</TableCell>
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
                <CardTitle>Muhasebe Özeti</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Toplam İş Tutarı:</span>
                    <span className="font-semibold">{formatCurrency(totalWorkAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Ödenen:</span>
                    <span className="font-semibold text-green-600">{formatCurrency(totalPaid)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-sm font-medium text-gray-700">Kalan Alacak:</span>
                    <span className={`font-bold text-lg ${totalRemaining > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(totalRemaining)}
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
