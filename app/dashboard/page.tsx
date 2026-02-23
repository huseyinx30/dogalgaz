'use client';

import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, ShoppingCart, Package, Building2, TrendingUp, FileText, CheckCircle, XCircle, Calendar, RefreshCw, User, X, Wallet, ClipboardList } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/providers/auth-provider';

interface EkipAssignment {
  id: string;
  customer_name: string;
  job_type: string;
  assigned_date: string;
  price: number;
  paid_amount: number;
  remaining_amount: number;
  status: string;
}

interface EkipPayment {
  id: string;
  payment_date: string;
  amount: number;
  customer_name: string | null;
  job_type: string | null;
  payment_method: string;
  reference_number: string | null;
}

export default function DashboardPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const isEkip = profile?.role === 'ekip';
  const [loadError, setLoadError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    customers: 0,
    sales: 0,
    salesAmount: 0,
    products: 0,
    teams: 0,
    personnel: 0,
  });
  const [loading, setLoading] = useState(true);
  const [diposData, setDiposData] = useState({
    taslakProjeler: '0',
    onayBekleyenProje: '0',
    projeKontoru: '0',
    bugunReddedilenProje: '0',
    bugunOnaylananProje: '0',
    policeKontoru: '0',
    bugunkuRandevular: '0',
    lastUpdated: '',
  });
  const [diposLoading, setDiposLoading] = useState(false);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [credentials, setCredentials] = useState({
    username: 'felekkagan530',
    password: 'Hf354525',
  });
  const [upcomingJobs, setUpcomingJobs] = useState<
    { sale_id: string; tracking_id: string | null; customer_name: string; status: string; current_step: string | null; invoice_number: string | null }[]
  >([]);
  const [upcomingJobsLoading, setUpcomingJobsLoading] = useState(false);
  const [jobStats, setJobStats] = useState({ total: 0, devam_eden: 0, tamamlandı: 0 });
  const [ekipTeamName, setEkipTeamName] = useState<string | null>(null);
  const [ekipAccounting, setEkipAccounting] = useState({ totalWork: 0, totalPaid: 0, totalRemaining: 0 });
  const [ekipAssignments, setEkipAssignments] = useState<EkipAssignment[]>([]);
  const [ekipPayments, setEkipPayments] = useState<EkipPayment[]>([]);
  const [ekipLoading, setEkipLoading] = useState(false);

  // Veri yükleme - auth tamamlandıktan sonra çalışır
  useEffect(() => {
    if (authLoading) return;
    if (!user) return;

    if (!isEkip) {
      loadStats();
      loadUpcomingJobs();
    } else {
      loadEkipDashboardData();
    }
  }, [authLoading, user, isEkip]);

  // Fallback: 5 sn içinde veri gelmezse tekrar dene
  useEffect(() => {
    if (!user || isEkip) return;
    const t = setTimeout(() => {
      if (loading) {
        loadStats();
        loadUpcomingJobs();
      }
    }, 5000);
    return () => clearTimeout(t);
  }, [user, isEkip, loading]);

  const loadDiposData = async (username?: string, password?: string) => {
    // Veri çekme işlemi şimdilik durduruldu
    console.log('⚠️ Dipos veri çekme işlemi şimdilik devre dışı');
    alert('Dipos veri çekme işlemi şimdilik devre dışı bırakıldı. Daha sonra aktif edilecek.');
    return;
    
    /* 
    setDiposLoading(true);
    try {
      const response = await fetch('/api/dipos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username || credentials.username,
          password: password || credentials.password,
        }),
      });
      const data = await response.json();
      if (data.error) {
        console.error('❌ Dipos verisi çekilemedi:', data.message);
        alert('Veri çekilemedi: ' + data.message);
      } else {
        setDiposData(data);
        // Başarılı olursa modal'ı kapat
        if (username && password) {
          setShowCredentialsModal(false);
        }
      }
    } catch (error: any) {
      console.error('❌ Dipos verisi yüklenirken hata:', error);
      alert('Veri yüklenirken hata oluştu: ' + error.message);
    } finally {
      setDiposLoading(false);
    }
    */
  };

  const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadDiposData(credentials.username, credentials.password);
  };

  const loadStats = async () => {
    setLoadError(null);
    setLoading(true);

    const timeoutId = setTimeout(() => {
      setLoading(false);
      setLoadError('Veri yükleme zaman aşımına uğradı. Bağlantınızı kontrol edin.');
      console.error('⏱️ loadStats zaman aşımı');
    }, 15000);

    try {
      console.log('📊 Dashboard istatistikleri yükleniyor...');

      // Müşteri sayısı
      const { count: customerCount, error: customerError } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true });

      if (customerError) {
        console.warn('⚠️ Müşteri sayısı yüklenemedi:', customerError.message);
      }

      // Satış sayısı ve toplam
      const { count: salesCount, data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('total_amount');

      if (salesError) {
        console.warn('⚠️ Satış verileri yüklenemedi:', salesError.message);
      }

      const salesTotal = salesData?.reduce((sum, sale) => sum + (sale.total_amount || 0), 0) || 0;

      // Ürün sayısı
      const { count: productCount, error: productError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });

      if (productError) {
        console.warn('⚠️ Ürün sayısı yüklenemedi:', productError.message);
      }

      // Ekip sayısı
      const { count: teamCount, error: teamError } = await supabase
        .from('teams')
        .select('*', { count: 'exact', head: true });

      if (teamError) {
        console.warn('⚠️ Ekip sayısı yüklenemedi:', teamError.message);
      }

      // Personel sayısı (admin + personel rolündeki kullanıcılar)
      const { count: personnelCount, error: personnelError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .in('role', ['admin', 'personel']);

      if (personnelError) {
        console.warn('⚠️ Personel sayısı yüklenemedi:', personnelError.message);
      }

      setStats({
        customers: customerCount || 0,
        sales: salesCount || 0,
        salesAmount: salesTotal,
        products: productCount || 0,
        teams: teamCount || 0,
        personnel: personnelCount || 0,
      });

      console.log('✅ İstatistikler yüklendi:', {
        customers: customerCount || 0,
        sales: salesCount || 0,
        products: productCount || 0,
        teams: teamCount || 0,
      });
    } catch (error: any) {
      console.error('❌ İstatistikler yüklenirken hata:', error);
      setLoadError(error?.message || 'Veriler yüklenirken hata oluştu.');
      setStats({
        customers: 0,
        sales: 0,
        salesAmount: 0,
        products: 0,
        teams: 0,
        personnel: 0,
      });
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  const loadUpcomingJobs = async () => {
    setUpcomingJobsLoading(true);
    try {
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select(`
          id,
          invoice_number,
          customers(id, contact_person, company_name)
        `)
        .order('created_at', { ascending: false });

      if (salesError || !salesData?.length) {
        setUpcomingJobs([]);
        setJobStats({ total: 0, devam_eden: 0, tamamlandı: 0 });
        return;
      }

      const saleIds = salesData.map((s: any) => s.id);
      const { data: trackingData } = await supabase
        .from('job_tracking')
        .select('id, sale_id, status, current_step')
        .in('sale_id', saleIds);

      const trackingMap = new Map(
        (trackingData || []).map((t: any) => [t.sale_id, t])
      );

      const devamStatuses = ['iş_yapımına_başlandı', 'devam_ediyor', 'gaz_açımına_geçildi', 'gaz_açımı_yapıldı'];

      const jobs = salesData.map((sale: any) => {
        const customer = Array.isArray(sale.customers) ? sale.customers[0] : sale.customers;
        const tracking = trackingMap.get(sale.id);
        const status = tracking?.status || 'satıldı';
        return {
          sale_id: sale.id,
          tracking_id: tracking?.id || null,
          customer_name: customer?.company_name || customer?.contact_person || 'Bilinmeyen',
          status,
          current_step: tracking?.current_step || null,
          invoice_number: sale.invoice_number || null,
        };
      });

      const activeJobs = jobs.filter(
        (j: any) => j.status === 'satıldı' || devamStatuses.includes(j.status)
      );

      setJobStats({
        total: jobs.length,
        devam_eden: jobs.filter((j: any) => devamStatuses.includes(j.status)).length,
        tamamlandı: jobs.filter((j: any) => j.status === 'tamamlandı').length,
      });

      setUpcomingJobs(activeJobs.slice(0, 5));
    } catch (err: any) {
      console.error('Yaklaşan işler yüklenirken hata:', err);
      setUpcomingJobs([]);
    } finally {
      setUpcomingJobsLoading(false);
    }
  };

  const loadEkipDashboardData = async () => {
    if (!user?.id) return;
    setEkipLoading(true);
    try {
      const { data: memberData, error: memberError } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('member_id', user.id)
        .limit(1)
        .maybeSingle();

      if (memberError || !memberData?.team_id) {
        setEkipLoading(false);
        return;
      }

      const teamId = memberData.team_id;

      const { data: teamData } = await supabase
        .from('teams')
        .select('name')
        .eq('id', teamId)
        .single();
      if (teamData?.name) setEkipTeamName(teamData.name);

      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('job_assignments')
        .select(`
          id, sale_id, job_type, assigned_date, price, status,
          sales!inner(customers(id, contact_person, company_name))
        `)
        .eq('team_id', teamId)
        .order('assigned_date', { ascending: false });

      if (assignmentsError || !assignmentsData?.length) {
        setEkipLoading(false);
        return;
      }

      const assignments: EkipAssignment[] = assignmentsData.map((a: any) => {
        const customer = Array.isArray(a.sales?.customers) ? a.sales.customers[0] : a.sales?.customers;
        return {
          id: a.id,
          customer_name: customer?.company_name || customer?.contact_person || 'Bilinmeyen',
          job_type: a.job_type,
          assigned_date: a.assigned_date,
          price: a.price,
          paid_amount: 0,
          remaining_amount: a.price,
          status: a.status,
        };
      });

      const { data: paymentsData } = await supabase
        .from('team_payments')
        .select(`
          id, job_assignment_id, amount, payment_method, payment_date, reference_number,
          job_assignments!left(job_type, sales!inner(customers(id, contact_person, company_name)))
        `)
        .eq('team_id', teamId)
        .order('payment_date', { ascending: false });

      const paidByAssignment = new Map<string, number>();
      let totalPaidFromAllPayments = 0;
      const formattedPayments: EkipPayment[] = [];
      (paymentsData || []).forEach((p: any) => {
        const amount = Number(p.amount) || 0;
        totalPaidFromAllPayments += amount;
        if (p.job_assignment_id) {
          paidByAssignment.set(p.job_assignment_id, (paidByAssignment.get(p.job_assignment_id) || 0) + amount);
        }
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
        formattedPayments.push({
          id: p.id,
          payment_date: p.payment_date,
          amount: amount,
          customer_name: customerName,
          job_type: jobType,
          payment_method: p.payment_method,
          reference_number: p.reference_number,
        });
      });
      setEkipPayments(formattedPayments);

      const withPaid = assignments.map((a) => {
        const paid = paidByAssignment.get(a.id) || 0;
        return { ...a, paid_amount: paid, remaining_amount: a.price - paid };
      });

      setEkipAssignments(withPaid);

      const totalWork = withPaid.reduce((s, a) => s + a.price, 0);
      const totalPaid = totalPaidFromAllPayments;
      const totalRemaining = Math.max(0, totalWork - totalPaid);
      setEkipAccounting({ totalWork, totalPaid, totalRemaining });
    } catch (err: any) {
      console.error('Ekip dashboard yükleme hatası:', err);
    } finally {
      setEkipLoading(false);
    }
  };

  const getJobTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      kombi_montajı: 'Kombi Montajı',
      iç_gaz_montajı: 'İç Gaz',
      kolon: 'Kolon',
      kolektör_taşıma: 'Kolektör',
      su_taşıma: 'Su Taşıma',
      full_montaj: 'Full Montaj',
      proje: 'Proje',
      gaz_açımı: 'Gaz Açımı',
    };
    return types[type] || type;
  };

  const getAssignmentStatusLabel = (status: string) => {
    const statuses: Record<string, { label: string; color: string }> = {
      atandı: { label: 'Atandı', color: 'bg-blue-100 text-blue-700' },
      başlandı: { label: 'Başlandı', color: 'bg-amber-100 text-amber-700' },
      tamamlandı: { label: 'Tamamlandı', color: 'bg-green-100 text-green-700' },
      iptal: { label: 'İptal', color: 'bg-red-100 text-red-700' },
    };
    return statuses[status] || { label: status, color: 'bg-gray-100 text-gray-700' };
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

  // Profil yüklenene kadar rol bazlı içerik gösterme (ekip/personel için admin görünümü flash'ını önle)
  const roleReady = !authLoading && user && profile;

  const getStepLabel = (step: string | null) => {
    if (!step) return null;
    const steps: Record<string, string> = {
      kombi_montajı: 'Kombi',
      iç_gaz_montajı: 'İç Gaz',
      kolon: 'Kolon',
      kolektör_taşıma: 'Kolektör',
      su_taşıma: 'Su Taşıma',
      full_montaj: 'Full Montaj',
      proje: 'Proje',
      gaz_açımı: 'Gaz Açımı',
    };
    return steps[step] || step;
  };

  if (!roleReady) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Yükleniyor...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-4 p-3 sm:p-4">
        {/* Başlık Bölümü */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              {isEkip ? 'Ekip Paneli' : 'Doğalgaz Otomasyon Sistemi'}
            </h1>
            <p className="text-gray-600 text-sm">
              {isEkip && ekipTeamName ? ekipTeamName : (isEkip ? 'Muhasebe ve iş atamalarınız' : 'Sistem özeti ve istatistikler')}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            {loadError && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200">
                <span className="text-xs text-red-700">{loadError}</span>
                <Button size="sm" variant="outline" onClick={() => loadStats()} className="shrink-0">
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Yenile
                </Button>
              </div>
            )}
            <div className="text-xs text-gray-700 font-semibold bg-gray-100 px-3 py-2 rounded-lg border border-gray-200 truncate">
              {new Date().toLocaleDateString('tr-TR', { 
                weekday: 'short', 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
              })}
            </div>
          </div>
        </div>

        {/* İstatistik Kartları - Ekip için gizli */}
        {!isEkip && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-4">
          {/* Toplam Müşteri */}
          <Card className="relative overflow-hidden hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500 bg-white shadow-md min-h-[140px]">
            <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-bold text-gray-800">Toplam Müşteri</CardTitle>
              <div className="p-2 bg-blue-100 rounded-lg shrink-0">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0 space-y-2">
              <div className="text-2xl font-bold text-blue-600 min-h-[32px] flex items-center">
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin shrink-0 mr-2" />
                    <span>0</span>
                  </>
                ) : (
                  stats.customers
                )}
              </div>
              <p className="text-xs text-gray-600">Aktif müşteri sayısı</p>
              <Link href="/customers" className="inline-block text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline">
                Tümünü gör →
              </Link>
            </CardContent>
          </Card>

          {/* Toplam Satış */}
          <Card className="relative overflow-hidden hover:shadow-lg transition-all duration-300 border-l-4 border-l-green-500 bg-white shadow-md min-h-[140px]">
            <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-bold text-gray-800">Toplam Satış</CardTitle>
              <div className="p-2 bg-green-100 rounded-lg shrink-0">
                <ShoppingCart className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0 space-y-2">
              <div className="text-2xl font-bold text-green-600 min-h-[32px] flex items-center">
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-green-200 border-t-green-600 rounded-full animate-spin shrink-0 mr-2" />
                    <span>0</span>
                  </>
                ) : (
                  stats.sales
                )}
              </div>
              <p className="text-xs text-gray-600">
                {loading ? 'Yükleniyor...' : formatCurrency(stats.salesAmount)}
              </p>
              <Link href="/accounting/sales" className="inline-block text-xs font-semibold text-green-600 hover:text-green-700 hover:underline">
                Satışları gör →
              </Link>
            </CardContent>
          </Card>

          {/* Stok Ürünleri */}
          <Card className="relative overflow-hidden hover:shadow-lg transition-all duration-300 border-l-4 border-l-orange-500 bg-white shadow-md min-h-[140px]">
            <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-bold text-gray-800">Stok Ürünleri</CardTitle>
              <div className="p-2 bg-orange-100 rounded-lg shrink-0">
                <Package className="h-4 w-4 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0 space-y-2">
              <div className="text-2xl font-bold text-orange-600 min-h-[32px] flex items-center">
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-orange-200 border-t-orange-600 rounded-full animate-spin shrink-0 mr-2" />
                    <span>0</span>
                  </>
                ) : (
                  stats.products
                )}
              </div>
              <p className="text-xs text-gray-600">Toplam ürün sayısı</p>
              <Link href="/inventory/products" className="inline-block text-xs font-semibold text-orange-600 hover:text-orange-700 hover:underline">
                Stokları gör →
              </Link>
            </CardContent>
          </Card>

          {/* Aktif Ekipler */}
          <Card className="relative overflow-hidden hover:shadow-lg transition-all duration-300 border-l-4 border-l-purple-500 bg-white shadow-md min-h-[140px]">
            <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-bold text-gray-800">Aktif Ekipler</CardTitle>
              <div className="p-2 bg-purple-100 rounded-lg shrink-0">
                <Building2 className="h-4 w-4 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0 space-y-2">
              <div className="text-2xl font-bold text-purple-600 min-h-[32px] flex items-center">
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin shrink-0 mr-2" />
                    <span>0</span>
                  </>
                ) : (
                  stats.teams
                )}
              </div>
              <p className="text-xs text-gray-600">Çalışan ekip sayısı</p>
              <Link href="/teams" className="inline-block text-xs font-semibold text-purple-600 hover:text-purple-700 hover:underline">
                Ekipleri gör →
              </Link>
            </CardContent>
          </Card>

          {/* Personeller */}
          <Card className="relative overflow-hidden hover:shadow-lg transition-all duration-300 border-l-4 border-l-cyan-500 bg-white shadow-md min-h-[140px]">
            <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-bold text-gray-800">Personeller</CardTitle>
              <div className="p-2 bg-cyan-100 rounded-lg shrink-0">
                <User className="h-4 w-4 text-cyan-600" />
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0 space-y-2">
              <div className="text-2xl font-bold text-cyan-600 min-h-[32px] flex items-center">
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-cyan-200 border-t-cyan-600 rounded-full animate-spin shrink-0 mr-2" />
                    <span>0</span>
                  </>
                ) : (
                  stats.personnel
                )}
              </div>
              <p className="text-xs text-gray-600">Ofis personeli sayısı</p>
              <Link href="/personeller" className="inline-block text-xs font-semibold text-cyan-600 hover:text-cyan-700 hover:underline">
                Personelleri gör →
              </Link>
            </CardContent>
          </Card>
        </div>
        )}

        {/* Ekip Dashboard - Muhasebe + Son İş Atamaları */}
        {isEkip && (
          <div className="space-y-6 mb-4">
            {ekipLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-10 h-10 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                <span className="ml-3 text-gray-600">Yükleniyor...</span>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-slate-700 to-slate-800 text-white">
                    <CardContent className="pt-6 pb-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-slate-300 text-xs font-medium uppercase tracking-wider">Toplam İş Tutarı</p>
                          <p className="text-2xl font-bold mt-1">{formatCurrency(ekipAccounting.totalWork)}</p>
                        </div>
                        <div className="p-3 bg-white/10 rounded-xl">
                          <ClipboardList className="w-8 h-8 text-slate-300" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
                    <CardContent className="pt-6 pb-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-emerald-100 text-xs font-medium uppercase tracking-wider">Ödenen</p>
                          <p className="text-2xl font-bold mt-1">{formatCurrency(ekipAccounting.totalPaid)}</p>
                        </div>
                        <div className="p-3 bg-white/20 rounded-xl">
                          <Wallet className="w-8 h-8 text-emerald-100" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className={`overflow-hidden border-0 shadow-lg ${ekipAccounting.totalRemaining > 0 ? 'bg-gradient-to-br from-amber-500 to-orange-500' : 'bg-gradient-to-br from-teal-500 to-cyan-500'} text-white`}>
                    <CardContent className="pt-6 pb-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white/80 text-xs font-medium uppercase tracking-wider">Kalan Alacak</p>
                          <p className="text-2xl font-bold mt-1">{formatCurrency(ekipAccounting.totalRemaining)}</p>
                        </div>
                        <div className="p-3 bg-white/20 rounded-xl">
                          <TrendingUp className="w-8 h-8 text-white/90" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="shadow-lg border border-gray-100 overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50 border-b">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <ClipboardList className="w-5 h-5 text-blue-600" />
                        Son İş Atamaları
                      </CardTitle>
                      <Link href="/teams/assignments" className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline">
                        Tümünü gör →
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    {ekipAssignments.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <ClipboardList className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p className="text-sm font-medium">Henüz iş ataması yok</p>
                        <Link href="/teams/assignments" className="inline-block mt-2 text-blue-600 hover:underline text-sm">İş atamalarına git</Link>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {ekipAssignments.slice(0, 6).map((a) => {
                          const status = getAssignmentStatusLabel(a.status);
                          return (
                            <Link key={a.id} href={`/teams/assignments/${a.id}`} className="block p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all duration-200">
                              <div className="flex items-center justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                  <p className="font-medium text-gray-900 truncate">{a.customer_name}</p>
                                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    <span className={
                                      a.job_type === 'proje'
                                        ? 'text-sm font-semibold px-3 py-1 rounded-lg bg-blue-500 text-white shadow-sm ring-2 ring-blue-200'
                                        : 'text-xs px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600'
                                    }>
                                      {getJobTypeLabel(a.job_type)}
                                    </span>
                                    <span className={`text-xs px-2 py-0.5 rounded-lg ${status.color}`}>
                                      {status.label}
                                    </span>
                                    <span className="text-xs text-gray-500">{formatDate(a.assigned_date)}</span>
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <p className="text-sm font-semibold text-gray-900">{formatCurrency(a.price)}</p>
                                  <p className={`text-xs font-medium ${a.remaining_amount > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                                    Kalan: {formatCurrency(a.remaining_amount)}
                                  </p>
                                </div>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="shadow-lg border border-gray-100 overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50 border-b">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <Wallet className="w-5 h-5 text-emerald-600" />
                        Son Ödemeler
                      </CardTitle>
                      <Link href="/teams/payments" className="text-sm font-medium text-emerald-600 hover:text-emerald-700 hover:underline">
                        Tümünü gör →
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    {ekipPayments.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <Wallet className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p className="text-sm font-medium">Henüz ödeme kaydı yok</p>
                        <p className="text-xs text-gray-400 mt-1">Ekibinize yapılan ödemeler burada listelenecek</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {ekipPayments.slice(0, 6).map((p) => (
                          <Link key={p.id} href="/teams/payments" className="block p-4 rounded-xl border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/50 transition-all duration-200">
                            <div className="flex items-center justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-gray-900 truncate">{p.customer_name || 'Genel Ödeme'}</p>
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                  <span className={
                                    p.job_type === 'proje'
                                      ? 'text-sm font-semibold px-3 py-1 rounded-lg bg-blue-500 text-white shadow-sm ring-2 ring-blue-200'
                                      : 'text-xs px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-700'
                                  }>
                                    {p.job_type ? getJobTypeLabel(p.job_type) : '-'}
                                  </span>
                                  <span className="text-xs text-gray-500">{formatDate(p.payment_date)}</span>
                                  <span className="text-xs text-gray-500">• {getPaymentMethodLabel(p.payment_method)}</span>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-sm font-semibold text-emerald-600">{formatCurrency(p.amount)}</p>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        )}

        {/* Hızlı Erişim - Admin/Personel için */}
        {!isEkip && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <Card className="shadow-md">
            <CardHeader className="border-b">
              <CardTitle className="text-lg font-semibold">Hızlı İşlemler</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 gap-3">
                <Link href="/customers/new" className="group">
                  <div className="p-3 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-all duration-200 group-hover:shadow-md">
                    <div className="p-1.5 bg-blue-100 rounded-lg w-fit mb-2 group-hover:bg-blue-200 transition-colors">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <p className="font-semibold text-sm text-gray-900 mb-0.5">Yeni Müşteri</p>
                    <p className="text-xs text-gray-500">Müşteri ekle</p>
                  </div>
                </Link>
                <Link href="/accounting/sales/new" className="group">
                  <div className="p-3 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 cursor-pointer transition-all duration-200 group-hover:shadow-md">
                    <div className="p-1.5 bg-green-100 rounded-lg w-fit mb-2 group-hover:bg-green-200 transition-colors">
                      <ShoppingCart className="w-5 h-5 text-green-600" />
                    </div>
                    <p className="font-semibold text-sm text-gray-900 mb-0.5">Yeni Satış</p>
                    <p className="text-xs text-gray-500">Satış oluştur</p>
                  </div>
                </Link>
                <Link href="/offers/new" className="group">
                  <div className="p-3 border-2 border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 cursor-pointer transition-all duration-200 group-hover:shadow-md">
                    <div className="p-1.5 bg-orange-100 rounded-lg w-fit mb-2 group-hover:bg-orange-200 transition-colors">
                      <TrendingUp className="w-5 h-5 text-orange-600" />
                    </div>
                    <p className="font-semibold text-sm text-gray-900 mb-0.5">Yeni Teklif</p>
                    <p className="text-xs text-gray-500">Teklif hazırla</p>
                  </div>
                </Link>
                <Link href="/teams" className="group">
                  <div className="p-3 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 cursor-pointer transition-all duration-200 group-hover:shadow-md">
                    <div className="p-1.5 bg-purple-100 rounded-lg w-fit mb-2 group-hover:bg-purple-200 transition-colors">
                      <Building2 className="w-5 h-5 text-purple-600" />
                    </div>
                    <p className="font-semibold text-sm text-gray-900 mb-0.5">Ekip Yönetimi</p>
                    <p className="text-xs text-gray-500">Ekipleri yönet</p>
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader className="border-b">
              <CardTitle className="text-lg font-semibold">Yaklaşan İşler</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {upcomingJobsLoading ? (
                <div className="flex items-center justify-center py-6">
                  <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                  <span className="ml-2 text-xs text-gray-600">Yükleniyor...</span>
                </div>
              ) : upcomingJobs.length > 0 ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2 text-center mb-3">
                    <div className="bg-gray-50 rounded p-2">
                      <p className="text-lg font-bold text-gray-900">{jobStats.total}</p>
                      <p className="text-[10px] text-gray-600">Toplam</p>
                    </div>
                    <div className="bg-amber-50 rounded p-2">
                      <p className="text-lg font-bold text-amber-700">{jobStats.devam_eden}</p>
                      <p className="text-[10px] text-gray-600">Devam Eden</p>
                    </div>
                    <div className="bg-green-50 rounded p-2">
                      <p className="text-lg font-bold text-green-700">{jobStats.tamamlandı}</p>
                      <p className="text-[10px] text-gray-600">Tamamlanan</p>
                    </div>
                  </div>
                  <div className="space-y-2 max-h-[160px] overflow-y-auto">
                    {upcomingJobs.map((job) => (
                      <Link key={job.sale_id} href={isEkip ? '/teams/assignments' : (job.tracking_id ? `/jobs/${job.tracking_id}` : '/jobs')} className="flex items-center gap-2 p-2 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                        <p className="text-sm font-medium text-gray-900 truncate flex-1 min-w-0">{job.customer_name}</p>
                        {job.current_step ? (
                          <span className="shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-md bg-blue-100 text-blue-700">
                            {getStepLabel(job.current_step)}
                          </span>
                        ) : (
                          <span className="shrink-0 text-[10px] text-gray-400">—</span>
                        )}
                      </Link>
                    ))}
                  </div>
                  <Link href={isEkip ? '/teams/assignments' : '/jobs'} className="text-blue-600 hover:text-blue-700 hover:underline text-xs font-medium inline-flex items-center gap-1 pt-1">
                    {isEkip ? 'İş atamalarına git' : 'İş takibine git'} <span>→</span>
                  </Link>
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-xs font-medium mb-2">Yaklaşan iş bulunmuyor</p>
                  <Link href={isEkip ? '/teams/assignments' : '/jobs'} className="text-blue-600 hover:text-blue-700 hover:underline text-xs font-medium inline-flex items-center gap-1">
                    {isEkip ? 'İş atamalarına git' : 'İş takibine git'} <span>→</span>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        )}

        {/* Dipos Verileri - Ekip için gizli */}
        {!isEkip && (
        <Card className="shadow-md border-t-4 border-t-indigo-500">
          <CardHeader className="border-b bg-gradient-to-r from-indigo-50 to-blue-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <FileText className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-900">Dipos Proje Durumu</CardTitle>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {diposData.lastUpdated 
                      ? `Son güncelleme: ${new Date(diposData.lastUpdated).toLocaleString('tr-TR')}`
                      : 'Veri yükleniyor...'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowCredentialsModal(true)}
                  className="p-2 hover:bg-indigo-100 rounded-lg transition-colors"
                  title="Kullanıcı Bilgileri"
                >
                  <User className="h-4 w-4 text-indigo-600" />
                </button>
                <button
                  onClick={() => loadDiposData()}
                  disabled={diposLoading}
                  className="p-2 hover:bg-indigo-100 rounded-lg transition-colors disabled:opacity-50"
                  title="Yenile"
                >
                  <RefreshCw className={`h-4 w-4 text-indigo-600 ${diposLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {diposLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                <span className="ml-3 text-sm text-gray-600">Veriler yükleniyor...</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                {/* Taslak Projeler */}
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 hover:shadow-md transition-shadow">
                  <p className="text-xs font-medium text-gray-600 mb-1">Taslak Projeler</p>
                  <p className="text-xl font-bold text-gray-900">{diposData.taslakProjeler}</p>
                </div>

                {/* Onay Bekleyen Proje */}
                <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200 hover:shadow-md transition-shadow">
                  <p className="text-xs font-medium text-gray-600 mb-1">Onay Bekleyen Proje</p>
                  <p className="text-xl font-bold text-yellow-700">{diposData.onayBekleyenProje}</p>
                </div>

                {/* Proje Kontörü */}
                <div className="bg-orange-50 rounded-lg p-3 border border-orange-200 hover:shadow-md transition-shadow">
                  <p className="text-xs font-medium text-gray-600 mb-1">Proje Kontörü</p>
                  <p className="text-xl font-bold text-orange-700">{diposData.projeKontoru}</p>
                </div>

                {/* Bugün Reddedilen Proje */}
                <div className="bg-red-50 rounded-lg p-3 border border-red-200 hover:shadow-md transition-shadow">
                  <p className="text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
                    <XCircle className="h-3 w-3" />
                    Bugün Reddedilen
                  </p>
                  <p className="text-xl font-bold text-red-700">{diposData.bugunReddedilenProje}</p>
                </div>

                {/* Bugün Onaylanan Proje */}
                <div className="bg-green-50 rounded-lg p-3 border border-green-200 hover:shadow-md transition-shadow">
                  <p className="text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Bugün Onaylanan
                  </p>
                  <p className="text-xl font-bold text-green-700">{diposData.bugunOnaylananProje}</p>
                </div>

                {/* Poliçe Kontörü */}
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200 hover:shadow-md transition-shadow">
                  <p className="text-xs font-medium text-gray-600 mb-1">Poliçe Kontörü</p>
                  <p className="text-xl font-bold text-blue-700">{diposData.policeKontoru}</p>
                </div>

                {/* Bugünkü Randevular */}
                <div className="bg-purple-50 rounded-lg p-3 border border-purple-200 hover:shadow-md transition-shadow">
                  <p className="text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Bugünkü Randevular
                  </p>
                  <p className="text-xl font-bold text-purple-700">{diposData.bugunkuRandevular}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        )}

        {/* Sistem Durumu */}
        <Card className="shadow-md">
          <CardHeader className="border-b">
            <CardTitle className="text-lg font-semibold">Sistem Durumu</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-gray-700">Sistem Aktif</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-gray-700">Veritabanı Bağlı</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-700">Versiyon: 1.00</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-700">Sistem Hüseyin AKIN</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Kullanıcı Bilgileri Modal - Ekip için gizli */}
        {!isEkip && showCredentialsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md shadow-xl">
              <CardHeader className="border-b bg-gradient-to-r from-indigo-50 to-blue-50">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <User className="h-5 w-5 text-indigo-600" />
                    Dipos Kullanıcı Bilgileri
                  </CardTitle>
                  <button
                    onClick={() => setShowCredentialsModal(false)}
                    className="p-1 hover:bg-indigo-100 rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5 text-gray-600" />
                  </button>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleCredentialsSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kullanıcı Adı
                    </label>
                    <Input
                      type="text"
                      value={credentials.username}
                      onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                      placeholder="Kullanıcı adınızı girin"
                      required
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Şifre
                    </label>
                    <Input
                      type="password"
                      value={credentials.password}
                      onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                      placeholder="Şifrenizi girin"
                      required
                      className="w-full"
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowCredentialsModal(false)}
                      className="flex-1"
                    >
                      İptal
                    </Button>
                    <Button
                      type="submit"
                      disabled={diposLoading}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                    >
                      {diposLoading ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Yükleniyor...
                        </>
                      ) : (
                        'Verileri Çek'
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
