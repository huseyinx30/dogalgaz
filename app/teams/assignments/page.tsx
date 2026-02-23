'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, Eye, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { formatDate, formatCurrency } from '@/lib/utils';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/components/providers/auth-provider';

interface JobAssignment {
  id: string;
  sale_id: string;
  team_id: string;
  team_name: string;
  customer_name: string;
  project_name: string | null;
  project_id: string | null;
  invoice_number: string | null;
  job_type: string;
  job_count: number;
  assigned_date: string;
  planned_start_date: string | null;
  planned_end_date: string | null;
  actual_start_date: string | null;
  actual_end_date: string | null;
  price: number;
  status: string;
  notes: string | null;
}

export default function JobAssignmentsPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [assignments, setAssignments] = useState<JobAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    if (user) loadAssignments();
  }, [user, profile?.role]);

  const loadAssignments = async () => {
    if (!user) return;
    try {
      let teamFilter: string[] | null = null;
      if (profile?.role === 'ekip') {
        const { data: memberData } = await supabase
          .from('team_members')
          .select('team_id')
          .eq('member_id', user.id);
        teamFilter = (memberData || []).map((m: any) => m.team_id);
        if (teamFilter.length === 0) {
          setAssignments([]);
          setLoading(false);
          return;
        }
      }

      let query = supabase
        .from('job_assignments')
        .select('*')
        .order('assigned_date', { ascending: false });

      if (teamFilter && teamFilter.length > 0) {
        query = query.in('team_id', teamFilter);
      }

      const { data: assignmentsData, error: assignmentsError } = await query;

      if (assignmentsError) throw assignmentsError;

      if (!assignmentsData || assignmentsData.length === 0) {
        setAssignments([]);
        setLoading(false);
        return;
      }

      // Ekip bilgilerini yükle
      const teamIds = [...new Set(assignmentsData.map(a => a.team_id).filter(Boolean))];
      const { data: teamsData } = await supabase
        .from('teams')
        .select('id, name')
        .in('id', teamIds);

      const teamsMap = new Map(
        (teamsData || []).map((t: any) => [t.id, t.name])
      );

      // Satış bilgilerini yükle (müşteri ve proje için - proje daire/dükkan sayıları için)
      const saleIds = [...new Set(assignmentsData.map(a => a.sale_id).filter(Boolean))];
      const { data: salesData } = await supabase
        .from('sales')
        .select(`
          id,
          invoice_number,
          project_id,
          customers(id, contact_person, company_name),
          customer_projects(id, project_name, floor_count, apartments_per_floor, apartments_by_floor, shop_count, project_type, device_count)
        `)
        .in('id', saleIds);

      const salesMap = new Map<string, any>();
      if (salesData) {
        salesData.forEach((sale: any) => {
          const customer = Array.isArray(sale.customers) 
            ? sale.customers[0] 
            : sale.customers;
          const project = sale.customer_projects
            ? (Array.isArray(sale.customer_projects) 
                ? sale.customer_projects[0] 
                : sale.customer_projects)
            : null;

          salesMap.set(sale.id, {
            invoice_number: sale.invoice_number,
            project_id: sale.project_id || null,
            customer_name: customer?.company_name || customer?.contact_person || 'Bilinmeyen',
            project_name: project?.project_name || null,
            project,
          });
        });
      }

      const getJobCount = (project: any, jobType: string): number => {
        if (!project) return 0;
        let totalApartments = 0;
        if (project.apartments_by_floor && Array.isArray(project.apartments_by_floor)) {
          totalApartments = project.apartments_by_floor.reduce((sum: number, n: number) => sum + Number(n || 0), 0);
        } else if (project.floor_count != null && project.apartments_per_floor != null) {
          totalApartments = project.floor_count * project.apartments_per_floor;
        } else if (project.project_type === 'iş_yeri' && project.device_count != null) {
          totalApartments = project.device_count;
        }
        const shopCount = Number(project.shop_count) || 0;
        if (jobType === 'kolon') return totalApartments + shopCount + 1;
        return totalApartments + shopCount;
      };

      const formattedAssignments = assignmentsData.map((assignment: any) => {
        const sale = salesMap.get(assignment.sale_id);

        return {
          id: assignment.id,
          sale_id: assignment.sale_id,
          team_id: assignment.team_id,
          team_name: teamsMap.get(assignment.team_id) || 'Bilinmeyen Ekip',
          customer_name: sale?.customer_name || 'Bilinmeyen',
          project_name: sale?.project_name || null,
          project_id: sale?.project_id || null,
          invoice_number: sale?.invoice_number || null,
          job_type: assignment.job_type,
          job_count: getJobCount(sale?.project, assignment.job_type),
          assigned_date: assignment.assigned_date,
          planned_start_date: assignment.planned_start_date,
          planned_end_date: assignment.planned_end_date,
          actual_start_date: assignment.actual_start_date,
          actual_end_date: assignment.actual_end_date,
          price: assignment.price,
          status: assignment.status,
          notes: assignment.notes,
        };
      });

      setAssignments(formattedAssignments);
    } catch (error: any) {
      console.error('İş atamaları yüklenirken hata:', error);
      alert('İş atamaları yüklenirken bir hata oluştu: ' + error.message);
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

  const filteredAssignments = assignments.filter(assignment => {
    if (statusFilter !== 'all' && assignment.status !== statusFilter) {
      return false;
    }
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      assignment.customer_name.toLowerCase().includes(searchLower) ||
      assignment.team_name.toLowerCase().includes(searchLower) ||
      (profile?.role !== 'ekip' && assignment.invoice_number?.toLowerCase().includes(searchLower)) ||
      (assignment.project_name?.toLowerCase().includes(searchLower))
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">İş Atamaları</h1>
            <p className="text-gray-700 mt-2 font-medium">
              {profile?.role === 'ekip' ? 'Atandığınız işler' : 'Ekiplere iş atamalarını yönetin'}
            </p>
          </div>
          {profile?.role !== 'ekip' && (
            <Link href="/teams/assignments/new">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Yeni İş Ataması
              </Button>
            </Link>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Atama Listesi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="search"
                  placeholder={profile?.role === 'ekip' ? 'Müşteri veya proje ara...' : 'Müşteri, ekip veya fatura no ara...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Durum Filtresi
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                >
                  <option value="all">Tümü</option>
                  <option value="atandı">Atandı</option>
                  <option value="başlandı">Başlandı</option>
                  <option value="tamamlandı">Tamamlandı</option>
                  <option value="iptal">İptal</option>
                </select>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  {profile?.role !== 'ekip' && <TableHead>Fatura No</TableHead>}
                  <TableHead>Müşteri</TableHead>
                  <TableHead>Proje</TableHead>
                  {profile?.role === 'ekip' && <TableHead>Atanan İş Sayısı</TableHead>}
                  {profile?.role !== 'ekip' && <TableHead>Ekip</TableHead>}
                  <TableHead>İş Tipi</TableHead>
                  <TableHead>Atama Tarihi</TableHead>
                  <TableHead>Planlanan Başlangıç</TableHead>
                  <TableHead>Planlanan Bitiş</TableHead>
                  <TableHead>Fiyat</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssignments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={profile?.role === 'ekip' ? 10 : 11} className="text-center text-gray-500 py-8">
                      {searchTerm || statusFilter !== 'all' 
                        ? 'Arama sonucu bulunamadı' 
                        : 'Henüz iş ataması yapılmamış'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAssignments.map((assignment) => {
                    const status = getStatusLabel(assignment.status);
                    return (
                      <TableRow key={assignment.id}>
                        {profile?.role !== 'ekip' && (
                          <TableCell className="font-medium">
                            {assignment.invoice_number || '-'}
                          </TableCell>
                        )}
                        <TableCell>{assignment.customer_name}</TableCell>
                        <TableCell>{assignment.project_name || '-'}</TableCell>
                        {profile?.role === 'ekip' && (
                          <TableCell className="font-medium">
                            {assignment.job_count}
                          </TableCell>
                        )}
                        {profile?.role !== 'ekip' && (
                          <TableCell>{assignment.team_name}</TableCell>
                        )}
                        <TableCell>
                          {assignment.job_type === 'proje' ? (
                            <span className="inline-flex items-center text-sm font-semibold px-3 py-1.5 rounded-lg bg-blue-500 text-white shadow-sm ring-2 ring-blue-200">
                              {getJobTypeLabel(assignment.job_type)}
                            </span>
                          ) : (
                            getJobTypeLabel(assignment.job_type)
                          )}
                        </TableCell>
                        <TableCell>{formatDate(assignment.assigned_date)}</TableCell>
                        <TableCell>
                          {assignment.planned_start_date 
                            ? formatDate(assignment.planned_start_date) 
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {assignment.planned_end_date 
                            ? formatDate(assignment.planned_end_date) 
                            : '-'}
                        </TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency(assignment.price)}
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
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
                            <Eye className="w-4 h-4 mr-1" />
                            Detay
                          </Button>
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

