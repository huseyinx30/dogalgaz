'use client';

import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, Loader2, Eye, Send, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { formatCurrency, formatDate } from '@/lib/utils';

interface Contract {
  id: string;
  contract_number: string;
  contract_date: string;
  start_date: string | null;
  end_date: string | null;
  customer_id: string;
  project_id: string | null;
  customer_name: string;
  project_name: string | null;
  total_amount: number;
  status: string;
  created_at: string;
  has_job_tracking?: boolean;
}

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [processingContractId, setProcessingContractId] = useState<string | null>(null);

  useEffect(() => {
    loadContracts();
  }, []);

  const loadContracts = async () => {
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select(`
          *,
          customers!inner(contact_person, company_name),
          customer_projects(project_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // İş takibi kayıtlarını kontrol et
      const contractIds = (data || []).map((c: any) => c.id);
      const { data: salesData } = await supabase
        .from('sales')
        .select('id, contract_id')
        .in('contract_id', contractIds);

      const salesByContract = new Map<string, string>();
      salesData?.forEach((sale: any) => {
        if (sale.contract_id) {
          salesByContract.set(sale.contract_id, sale.id);
        }
      });

      // İş takibi kayıtlarını kontrol et
      const saleIds = salesData?.map(s => s.id) || [];
      const { data: jobTrackingData } = await supabase
        .from('job_tracking')
        .select('sale_id')
        .in('sale_id', saleIds);

      const jobsBySale = new Set(jobTrackingData?.map(j => j.sale_id) || []);

      const formattedContracts = (data || []).map((contract: any) => {
        const saleId = salesByContract.get(contract.id);
        const hasJobTracking = saleId ? jobsBySale.has(saleId) : false;

        return {
          id: contract.id,
          contract_number: contract.contract_number,
          contract_date: contract.contract_date,
          start_date: contract.start_date,
          end_date: contract.end_date,
          customer_id: contract.customer_id,
          project_id: contract.project_id,
          customer_name: contract.customers?.company_name || contract.customers?.contact_person || 'Bilinmeyen Müşteri',
          project_name: contract.customer_projects?.project_name || null,
          total_amount: contract.total_amount,
          status: contract.status,
          created_at: contract.created_at,
          has_job_tracking: hasJobTracking,
        };
      });

      setContracts(formattedContracts);
    } catch (error: any) {
      console.error('Sözleşmeler yüklenirken hata:', error);
      alert('Sözleşmeler yüklenirken bir hata oluştu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredContracts = contracts.filter(contract => {
    const matchesSearch = 
      contract.contract_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (contract.project_name && contract.project_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || contract.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusLabel = (status: string) => {
    const statuses: Record<string, { label: string; color: string }> = {
      'taslak': { label: 'Taslak', color: 'bg-gray-100 text-gray-800' },
      'müşteri_imzaladı': { label: 'Müşteri İmzaladı', color: 'bg-blue-100 text-blue-800' },
      'firma_imzaladı': { label: 'Firma İmzaladı', color: 'bg-green-100 text-green-800' },
      'onaylandı': { label: 'Onaylandı', color: 'bg-green-100 text-green-800' },
      'aktif': { label: 'Aktif', color: 'bg-green-100 text-green-800' },
      'tamamlandı': { label: 'Tamamlandı', color: 'bg-purple-100 text-purple-800' },
      'iptal': { label: 'İptal', color: 'bg-red-100 text-red-800' },
    };
    return statuses[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
  };

  const sendToJobTracking = async (contract: Contract) => {
    if (contract.has_job_tracking) {
      alert('Bu sözleşme zaten iş takibine gönderilmiş.');
      return;
    }

    if (contract.status !== 'onaylandı' && contract.status !== 'aktif' && contract.status !== 'firma_imzaladı') {
      alert('Sadece onaylanan sözleşmeler iş takibine gönderilebilir.');
      return;
    }

    setProcessingContractId(contract.id);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Kullanıcı oturumu bulunamadı');
      }

      // Sözleşmeye bağlı satış var mı kontrol et
      let saleId: string | null = null;
      const { data: existingSale } = await supabase
        .from('sales')
        .select('id')
        .eq('contract_id', contract.id)
        .single();

      if (existingSale) {
        saleId = existingSale.id;
      } else {
        // Satış yoksa oluştur
        const { data: newSale, error: saleError } = await supabase
          .from('sales')
          .insert({
            contract_id: contract.id,
            customer_id: contract.customer_id,
            project_id: contract.project_id,
            total_amount: contract.total_amount,
            final_amount: contract.total_amount,
            status: 'satıldı',
            payment_status: 'beklemede',
            remaining_amount: contract.total_amount,
            created_by: user.id,
          })
          .select('id')
          .single();

        if (saleError) throw saleError;
        saleId = newSale.id;
      }

      // İş takibi kaydı oluştur
      const { error: jobError } = await supabase
        .from('job_tracking')
        .insert({
          sale_id: saleId,
          customer_id: contract.customer_id,
          project_id: contract.project_id,
          status: 'satıldı',
          updated_by: user.id,
        });

      if (jobError) throw jobError;

      alert('Sözleşme başarıyla iş takibine gönderildi!');
      
      // Listeyi yenile
      loadContracts();
    } catch (error: any) {
      console.error('İş takibine gönderirken hata:', error);
      alert('İş takibine gönderirken bir hata oluştu: ' + error.message);
    } finally {
      setProcessingContractId(null);
    }
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

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Sözleşmeler</h1>
            <p className="text-gray-700 mt-2 font-medium">Müşteri sözleşmelerini yönetin</p>
          </div>
          <Link href="/contracts/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Yeni Sözleşme
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sözleşme Listesi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 space-y-4">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="search"
                    placeholder="Sözleşme ara (numara, müşteri, proje)..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Tüm Durumlar</option>
                    <option value="taslak">Taslak</option>
                    <option value="müşteri_imzaladı">Müşteri İmzaladı</option>
                    <option value="firma_imzaladı">Firma İmzaladı</option>
                    <option value="aktif">Aktif</option>
                    <option value="tamamlandı">Tamamlandı</option>
                    <option value="iptal">İptal</option>
                  </select>
                </div>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sözleşme No</TableHead>
                  <TableHead>Müşteri</TableHead>
                  <TableHead>Proje</TableHead>
                  <TableHead>Tarih</TableHead>
                  <TableHead>Başlangıç</TableHead>
                  <TableHead>Bitiş</TableHead>
                  <TableHead>Tutar</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>İş Takibi</TableHead>
                  <TableHead>İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContracts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-gray-500 py-8">
                      {searchTerm || statusFilter !== 'all' ? 'Arama sonucu bulunamadı' : 'Henüz sözleşme eklenmemiş'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredContracts.map((contract) => {
                    const status = getStatusLabel(contract.status);
                    const canSendToJobTracking = 
                      (contract.status === 'onaylandı' || contract.status === 'aktif' || contract.status === 'firma_imzaladı') &&
                      !contract.has_job_tracking;
                    
                    return (
                      <TableRow key={contract.id}>
                        <TableCell className="font-medium">{contract.contract_number}</TableCell>
                        <TableCell>{contract.customer_name}</TableCell>
                        <TableCell>{contract.project_name || '-'}</TableCell>
                        <TableCell>{formatDate(contract.contract_date)}</TableCell>
                        <TableCell>{contract.start_date ? formatDate(contract.start_date) : '-'}</TableCell>
                        <TableCell>{contract.end_date ? formatDate(contract.end_date) : '-'}</TableCell>
                        <TableCell>{formatCurrency(contract.total_amount)}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-sm ${status.color}`}>
                            {status.label}
                          </span>
                        </TableCell>
                        <TableCell>
                          {contract.has_job_tracking ? (
                            <span className="inline-flex items-center gap-1 text-green-600 text-sm">
                              <CheckCircle className="w-4 h-4" />
                              Gönderildi
                            </span>
                          ) : canSendToJobTracking ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => sendToJobTracking(contract)}
                              disabled={processingContractId === contract.id}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              {processingContractId === contract.id ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                  Gönderiliyor...
                                </>
                              ) : (
                                <>
                                  <Send className="w-4 h-4 mr-1" />
                                  İş Takibine Gönder
                                </>
                              )}
                            </Button>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Link href={`/contracts/${contract.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4 mr-1" />
                              Detay
                            </Button>
                          </Link>
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
