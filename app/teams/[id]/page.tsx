'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Loader2, Edit, Plus, Users } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { formatDate, formatCurrency } from '@/lib/utils';

interface Team {
  id: string;
  name: string;
  leader_id: string | null;
  leader_name: string | null;
  authorized_person: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  district: string | null;
  is_active: boolean;
  created_at: string;
}

interface TeamMember {
  id: string;
  member_id: string;
  member_name: string;
  role: string;
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
  created_at: string;
}

export default function TeamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const teamId = params.id as string;
  
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [assignments, setAssignments] = useState<JobAssignment[]>([]);
  const [payments, setPayments] = useState<TeamPayment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (teamId) {
      loadTeamData();
    }
  }, [teamId]);

  const loadTeamData = async () => {
    try {
      // Ekip bilgileri
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .select('*')
        .eq('id', teamId)
        .single();

      if (teamError) throw teamError;

      // Lider bilgisi
      let leaderName = null;
      if (teamData.leader_id) {
        const { data: leaderData } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', teamData.leader_id)
          .single();
        leaderName = leaderData?.full_name || null;
      }

      const formattedTeam: Team = {
        id: teamData.id,
        name: teamData.name,
        leader_id: teamData.leader_id,
        leader_name: leaderName,
        authorized_person: teamData.authorized_person || null,
        phone: teamData.phone || null,
        email: teamData.email || null,
        address: teamData.address || null,
        city: teamData.city || null,
        district: teamData.district || null,
        is_active: teamData.is_active,
        created_at: teamData.created_at,
      };

      setTeam(formattedTeam);

      // Ekip üyeleri
      const { data: membersData, error: membersError } = await supabase
        .from('team_members')
        .select(`
          *,
          profiles!inner(full_name)
        `)
        .eq('team_id', teamId);

      if (membersError) throw membersError;

      const formattedMembers = (membersData || []).map((member: any) => ({
        id: member.id,
        member_id: member.member_id,
        member_name: member.profiles?.full_name || 'Bilinmeyen',
        role: member.role,
      }));

      setMembers(formattedMembers);

      // İş atamaları
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('job_assignments')
        .select(`
          *,
          sales!inner(
            customers(id, contact_person, company_name)
          )
        `)
        .eq('team_id', teamId)
        .order('assigned_date', { ascending: false })
        .limit(20);

      if (assignmentsError) throw assignmentsError;

      const formattedAssignments = (assignmentsData || []).map((assignment: any) => {
        const customer = Array.isArray(assignment.sales?.customers)
          ? assignment.sales.customers[0]
          : assignment.sales?.customers;
        
        return {
          id: assignment.id,
          sale_id: assignment.sale_id,
          customer_name: customer?.company_name || customer?.contact_person || 'Bilinmeyen',
          job_type: assignment.job_type,
          assigned_date: assignment.assigned_date,
          planned_start_date: assignment.planned_start_date,
          planned_end_date: assignment.planned_end_date,
          price: assignment.price,
          status: assignment.status,
          paid_amount: 0, // Önce 0, sonra hesaplanacak
          remaining_amount: assignment.price, // Önce tamamı, sonra hesaplanacak
        };
      });

      setAssignments(formattedAssignments);

      // Ekip ödemelerini yükle
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('team_payments')
        .select(`
          *,
          job_assignments!left(
            id,
            job_type,
            sales!inner(
              customers(id, contact_person, company_name)
            )
          )
        `)
        .eq('team_id', teamId)
        .order('payment_date', { ascending: false });

      if (paymentsError) throw paymentsError;

      const formattedPayments = (paymentsData || []).map((payment: any) => {
        const assignment = payment.job_assignments;
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
          id: payment.id,
          job_assignment_id: payment.job_assignment_id,
          job_type: jobType,
          customer_name: customerName,
          amount: payment.amount,
          payment_method: payment.payment_method,
          payment_date: payment.payment_date,
          reference_number: payment.reference_number,
          notes: payment.notes,
          created_at: payment.created_at,
        };
      });

      setPayments(formattedPayments);

      // Her iş ataması için ödenen tutarı hesapla
      const assignmentPayments = new Map<string, number>();
      formattedPayments.forEach((payment) => {
        if (payment.job_assignment_id) {
          const current = assignmentPayments.get(payment.job_assignment_id) || 0;
          assignmentPayments.set(payment.job_assignment_id, current + payment.amount);
        }
      });

      // İş atamalarını güncelle (ödenen ve kalan tutarları ekle)
      const updatedAssignments = formattedAssignments.map((assignment) => {
        const paid = assignmentPayments.get(assignment.id) || 0;
        return {
          ...assignment,
          paid_amount: paid,
          remaining_amount: assignment.price - paid,
        };
      });

      setAssignments(updatedAssignments);

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
            <h1 className="text-3xl font-bold text-gray-900">Ekip Detayı</h1>
            <p className="text-gray-600 mt-1">{team.name}</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => router.push('/teams')}
              className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white"
            >
              <ArrowLeft className="w-4 h-4" />
              Geri Dön
            </Button>
            <Link href={`/teams/${teamId}/edit`}>
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
                <CardTitle>Ekip Bilgileri</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-500">Ekip Adı</div>
                      <div className="font-medium">{team.name}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Ekip Lideri</div>
                      <div className="font-medium">{team.leader_name || '-'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Yetkili Ad Soyad</div>
                      <div className="font-medium">{team.authorized_person || '-'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Durum</div>
                      <div>
                        <span className={`px-2 py-1 rounded-full text-sm ${
                          team.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {team.is_active ? 'Aktif' : 'Pasif'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {(team.phone || team.email) && (
                    <div className="border-t pt-4">
                      <div className="text-sm font-medium text-gray-700 mb-2">İletişim Bilgileri</div>
                      <div className="grid grid-cols-2 gap-4">
                        {team.phone && (
                          <div>
                            <div className="text-sm text-gray-500">Telefon</div>
                            <div className="font-medium">
                              <a href={`tel:${team.phone}`} className="text-blue-600 hover:text-blue-700">
                                {team.phone}
                              </a>
                            </div>
                          </div>
                        )}
                        {team.email && (
                          <div>
                            <div className="text-sm text-gray-500">Email</div>
                            <div className="font-medium">
                              <a href={`mailto:${team.email}`} className="text-blue-600 hover:text-blue-700">
                                {team.email}
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {(team.address || team.city || team.district) && (
                    <div className="border-t pt-4">
                      <div className="text-sm font-medium text-gray-700 mb-2">Adres Bilgileri</div>
                      <div className="text-sm text-gray-900">
                        {[team.address, team.district, team.city].filter(Boolean).join(', ') || '-'}
                      </div>
                    </div>
                  )}

                  <div className="border-t pt-4">
                    <div className="text-sm text-gray-500">Oluşturulma Tarihi</div>
                    <div className="font-medium">{formatDate(team.created_at)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>İş Atamaları ({assignments.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {assignments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>Henüz iş ataması yapılmamış</p>
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
                        <TableHead>İşlemler</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assignments.map((assignment) => {
                        const status = getStatusLabel(assignment.status);
                        return (
                          <TableRow key={assignment.id}>
                            <TableCell>{assignment.customer_name}</TableCell>
                            <TableCell>{getJobTypeLabel(assignment.job_type)}</TableCell>
                            <TableCell>{formatDate(assignment.assigned_date)}</TableCell>
                            <TableCell className="font-semibold">
                              {formatCurrency(assignment.price)}
                            </TableCell>
                            <TableCell className="text-green-600 font-semibold">
                              {formatCurrency(assignment.paid_amount)}
                            </TableCell>
                            <TableCell className={assignment.remaining_amount > 0 ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}>
                              {formatCurrency(assignment.remaining_amount)}
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
                                onClick={() => router.push(`/teams/assignments/${assignment.id}`)}
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
              <CardHeader className="flex items-center justify-between">
                <CardTitle>Ekip Ödemeleri ({payments.length})</CardTitle>
                <Link href={`/teams/${teamId}/payment`}>
                  <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Ekibe Ödeme Yap
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
                        <TableHead>İş Tipi</TableHead>
                        <TableHead>Müşteri</TableHead>
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
                          <TableCell>
                            {payment.job_type ? getJobTypeLabel(payment.job_type) : '-'}
                          </TableCell>
                          <TableCell>{payment.customer_name || '-'}</TableCell>
                          <TableCell className="font-semibold text-green-600">
                            {formatCurrency(payment.amount)}
                          </TableCell>
                          <TableCell>{getPaymentMethodLabel(payment.payment_method)}</TableCell>
                          <TableCell>{payment.reference_number || '-'}</TableCell>
                          <TableCell className="max-w-xs truncate" title={payment.notes || ''}>
                            {payment.notes || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex items-center justify-between">
                <CardTitle>Ekip Üyeleri ({members.length})</CardTitle>
                <Link href={`/teams/${teamId}/members`}>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Üye Ekle
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {members.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p>Henüz üye eklenmemiş</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Üye</TableHead>
                        <TableHead>Rol</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {members.map((member) => (
                        <TableRow key={member.id}>
                          <TableCell className="font-medium">{member.member_name}</TableCell>
                          <TableCell>{member.role}</TableCell>
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
                    <span className="text-sm text-gray-500">Toplam Üye:</span>
                    <span className="font-semibold">{members.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Aktif İşler:</span>
                    <span className="font-semibold">
                      {assignments.filter(a => a.status === 'atandı' || a.status === 'başlandı').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Tamamlanan:</span>
                    <span className="font-semibold text-green-600">
                      {assignments.filter(a => a.status === 'tamamlandı').length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Muhasebe Özeti</CardTitle>
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
                    <span className="text-sm text-gray-500">İş Bazlı Ödenen:</span>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(assignments.reduce((sum, a) => sum + a.paid_amount, 0))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Genel Ödemeler:</span>
                    <span className="font-semibold text-blue-600">
                      {formatCurrency(
                        payments
                          .filter(p => !p.job_assignment_id)
                          .reduce((sum, p) => sum + p.amount, 0)
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-sm font-medium text-gray-700">Toplam Ödenen:</span>
                    <span className="font-bold text-lg text-green-600">
                      {formatCurrency(
                        payments.reduce((sum, p) => sum + p.amount, 0)
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-sm font-medium text-gray-700">Toplam Kalan Borç:</span>
                    <span className={`font-bold text-lg ${
                      assignments.reduce((sum, a) => sum + a.remaining_amount, 0) > 0 
                        ? 'text-red-600' 
                        : 'text-green-600'
                    }`}>
                      {formatCurrency(assignments.reduce((sum, a) => sum + a.remaining_amount, 0))}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-sm text-gray-500">Toplam Ödeme Sayısı:</span>
                    <span className="font-semibold">{payments.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">İş Bazlı Ödeme:</span>
                    <span className="font-semibold">
                      {payments.filter(p => p.job_assignment_id).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Genel Ödeme:</span>
                    <span className="font-semibold">
                      {payments.filter(p => !p.job_assignment_id).length}
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
