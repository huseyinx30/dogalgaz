'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, Eye, Edit, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { formatDate, formatCurrency } from '@/lib/utils';

interface Team {
  id: string;
  name: string;
  authorized_person: string | null;
  is_active: boolean;
  remaining_balance: number;
  active_jobs: number;
  created_at: string;
}

export default function TeamsPage() {
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    try {
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select('*')
        .order('created_at', { ascending: false });

      if (teamsError) throw teamsError;

      if (!teamsData || teamsData.length === 0) {
        setTeams([]);
        setLoading(false);
        return;
      }

      const teamIds = teamsData.map(t => t.id);

      // İş atamalarından toplam fiyatları hesapla
      const { data: assignmentsData } = await supabase
        .from('job_assignments')
        .select('team_id, price, status')
        .in('team_id', teamIds);

      const totalPrices = new Map<string, number>();
      const activeJobsCounts = new Map<string, number>();
      assignmentsData?.forEach((assignment: any) => {
        const currentPrice = totalPrices.get(assignment.team_id) || 0;
        totalPrices.set(assignment.team_id, currentPrice + (assignment.price || 0));
        
        if (assignment.status === 'atandı' || assignment.status === 'başlandı') {
          activeJobsCounts.set(assignment.team_id, (activeJobsCounts.get(assignment.team_id) || 0) + 1);
        }
      });

      // Ekip ödemelerinden toplam ödenen tutarları hesapla
      const { data: paymentsData } = await supabase
        .from('team_payments')
        .select('team_id, amount')
        .in('team_id', teamIds);

      const totalPayments = new Map<string, number>();
      paymentsData?.forEach((payment: any) => {
        const currentPayment = totalPayments.get(payment.team_id) || 0;
        totalPayments.set(payment.team_id, currentPayment + (payment.amount || 0));
      });

      // Kalan bakiyeleri hesapla
      const formattedTeams = teamsData.map((team: any) => {
        const totalPrice = totalPrices.get(team.id) || 0;
        const totalPaid = totalPayments.get(team.id) || 0;
        const remainingBalance = totalPrice - totalPaid;

        return {
          id: team.id,
          name: team.name,
          authorized_person: team.authorized_person || null,
          is_active: team.is_active,
          remaining_balance: remainingBalance,
          active_jobs: activeJobsCounts.get(team.id) || 0,
          created_at: team.created_at,
        };
      });

      console.log('📊 Yüklenen ekipler:', formattedTeams);
      setTeams(formattedTeams);
    } catch (error: any) {
      console.error('Ekipler yüklenirken hata:', error);
      alert('Ekipler yüklenirken bir hata oluştu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredTeams = teams.filter(team => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      team.name.toLowerCase().includes(searchLower) ||
      team.authorized_person?.toLowerCase().includes(searchLower)
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
            <h1 className="text-3xl font-bold text-gray-900">Ekipler</h1>
            <p className="text-gray-700 mt-2 font-medium">Ekip bilgilerini yönetin</p>
          </div>
          <Link href="/teams/new">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Yeni Ekip
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Ekip Listesi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="search"
                  placeholder="Ekip ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ekip Adı</TableHead>
                  <TableHead>Yetkili</TableHead>
                  <TableHead>Kalan Bakiye</TableHead>
                  <TableHead>Aktif İşler</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTeams.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                      {searchTerm ? 'Arama sonucu bulunamadı' : 'Henüz ekip eklenmemiş'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTeams.map((team) => (
                    <TableRow key={team.id}>
                      <TableCell className="font-medium">{team.name}</TableCell>
                      <TableCell>{team.authorized_person || '-'}</TableCell>
                      <TableCell>
                        <span className={`font-semibold ${
                          team.remaining_balance > 0 
                            ? 'text-red-600' 
                            : team.remaining_balance < 0
                            ? 'text-green-600'
                            : 'text-gray-600'
                        }`}>
                          {formatCurrency(team.remaining_balance)}
                        </span>
                      </TableCell>
                      <TableCell>{team.active_jobs}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          team.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {team.is_active ? 'Aktif' : 'Pasif'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/teams/${team.id}`)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Detay
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/teams/${team.id}/edit`)}
                            className="text-gray-600 hover:text-gray-700"
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Düzenle
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

