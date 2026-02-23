'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Wallet, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase/client';
import { formatDate, formatCurrency } from '@/lib/utils';
import { useAuth } from '@/components/providers/auth-provider';

interface TeamPayment {
  id: string;
  payment_date: string;
  amount: number;
  customer_name: string | null;
  job_type: string | null;
  payment_method: string;
  reference_number: string | null;
  notes: string | null;
}

export default function TeamPaymentsPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [payments, setPayments] = useState<TeamPayment[]>([]);
  const [totalPaid, setTotalPaid] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || profile?.role !== 'ekip') {
      router.replace('/dashboard');
      return;
    }
    loadPayments();
  }, [user, profile?.role]);

  const loadPayments = async () => {
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

      const { data: paymentsData, error: paymentsError } = await supabase
        .from('team_payments')
        .select(`
          id, amount, payment_method, payment_date, reference_number, notes,
          job_assignments!left(job_type, sales!inner(customers(id, contact_person, company_name)))
        `)
        .eq('team_id', teamId)
        .order('payment_date', { ascending: false });

      if (paymentsError) {
        console.error('Ödemeler yüklenirken hata:', paymentsError);
        setLoading(false);
        return;
      }

      const formatted = (paymentsData || []).map((p: any) => {
        let customerName: string | null = null;
        let jobType: string | null = null;
        const assignment = p.job_assignments;
        if (assignment) {
          jobType = assignment.job_type;
          const customer = assignment.sales?.customers
            ? (Array.isArray(assignment.sales.customers) ? assignment.sales.customers[0] : assignment.sales.customers)
            : null;
          customerName = customer?.company_name || customer?.contact_person || null;
        }
        return {
          id: p.id,
          payment_date: p.payment_date,
          amount: p.amount,
          customer_name: customerName,
          job_type: jobType,
          payment_method: p.payment_method,
          reference_number: p.reference_number,
          notes: p.notes,
        };
      });

      setPayments(formatted);
      setTotalPaid(formatted.reduce((s: number, p: TeamPayment) => s + p.amount, 0));
    } catch (error: any) {
      console.error('Veri yüklenirken hata:', error);
      alert('Veri yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const getJobTypeLabel = (type: string | null) => {
    if (!type) return '-';
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
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Yükleniyor...</span>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Link href="/dashboard" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-2">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Ekip Ödemeleri</h1>
            <p className="text-gray-700 mt-2 font-medium">Ekibinize yapılan ödemelerin listesi</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Toplam Ödenen</p>
            <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalPaid)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="w-5 h-5" />
                Ödeme Geçmişi ({payments.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Wallet className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm font-medium">Henüz ödeme kaydı yok</p>
                  <p className="text-xs text-gray-400 mt-1">Ekibinize yapılan ödemeler burada listelenecek</p>
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
                              getJobTypeLabel(p.job_type)
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

          <Card>
            <CardHeader>
              <CardTitle>Muhasebe Özeti</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Toplam Ödenen</span>
                  <span className="font-semibold text-green-600">{formatCurrency(totalPaid)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Ödeme Sayısı</span>
                  <span className="font-semibold">{payments.length}</span>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t">
                <Link href="/teams/me">
                  <Button variant="outline" className="w-full">Ekip Paneline Git</Button>
                </Link>
                <Link href="/dashboard" className="block mt-2">
                  <Button variant="ghost" className="w-full">Dashboard</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
