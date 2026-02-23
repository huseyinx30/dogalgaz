'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Loader2, Plus, Trash2, X } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/utils';
import { useAuth } from '@/components/providers/auth-provider';

interface Team {
  id: string;
  name: string;
}

interface Sale {
  id: string;
  invoice_number: string | null;
  customer_name: string;
  project_id: string | null;
}

interface ProjectDetails {
  total_apartments: number;
  shop_count: number;
}

interface JobAssignmentItem {
  id: string;
  job_type: 'kombi_montajı' | 'iç_gaz_montajı' | 'kolon' | 'kolektör_taşıma' | 'su_taşıma' | 'full_montaj' | 'proje' | 'gaz_açımı';
  team_id: string;
  assigned_date: string;
  planned_start_date: string;
  planned_end_date: string;
  unit_price: string;
  price: string;
}

function NewJobAssignmentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [teams, setTeams] = useState<Team[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [projectDetails, setProjectDetails] = useState<ProjectDetails | null>(null);
  const [selectedJobTypes, setSelectedJobTypes] = useState<Set<string>>(new Set());
  const [assignmentItems, setAssignmentItems] = useState<JobAssignmentItem[]>([]);
  
  const [formData, setFormData] = useState({
    sale_id: '',
    default_team_id: '',
    notes: '',
  });

  useEffect(() => {
    const saleId = searchParams.get('sale_id');
    if (saleId) {
      setFormData((prev) => ({ ...prev, sale_id: saleId }));
    }
  }, [searchParams]);

  useEffect(() => {
    if (!formData.sale_id) {
      setProjectDetails(null);
      return;
    }
    const loadProjectForSale = async () => {
      const sale = sales.find(s => s.id === formData.sale_id);
      if (!sale?.project_id) {
        setProjectDetails(null);
        return;
      }
      try {
        const { data: projectData, error } = await supabase
          .from('customer_projects')
          .select('floor_count, apartments_per_floor, apartments_by_floor, shop_count, project_type, device_count')
          .eq('id', sale.project_id)
          .single();

        if (error || !projectData) {
          setProjectDetails(null);
          return;
        }

        let totalApartments = 0;
        if (projectData.apartments_by_floor && Array.isArray(projectData.apartments_by_floor)) {
          totalApartments = projectData.apartments_by_floor.reduce((sum: number, n: number) => sum + Number(n || 0), 0);
        } else if (projectData.floor_count != null && projectData.apartments_per_floor != null) {
          totalApartments = projectData.floor_count * projectData.apartments_per_floor;
        } else if (projectData.project_type === 'iş_yeri' && projectData.device_count != null) {
          totalApartments = projectData.device_count;
        }

        const shopCount = Number(projectData.shop_count) || 0;

        setProjectDetails({
          total_apartments: totalApartments,
          shop_count: shopCount,
        });
      } catch {
        setProjectDetails(null);
      }
    };
    loadProjectForSale();
  }, [formData.sale_id, sales]);

  useEffect(() => {
    if (profile?.role === 'ekip') {
      router.replace('/teams/assignments');
      return;
    }
    loadData();
  }, [profile?.role]);

  const loadData = async () => {
    try {
      // Ekipleri yükle
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select('id, name')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (teamsError) throw teamsError;
      setTeams(teamsData || []);

      // Satışları yükle (proje bilgisi için project_id)
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select(`
          id,
          invoice_number,
          project_id,
          customers(id, contact_person, company_name)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (salesError) throw salesError;

      const formattedSales = (salesData || []).map((sale: any) => {
        const customer = Array.isArray(sale.customers) 
          ? sale.customers[0] 
          : sale.customers;
        
        return {
          id: sale.id,
          invoice_number: sale.invoice_number,
          customer_name: customer?.company_name || customer?.contact_person || 'Bilinmeyen',
          project_id: sale.project_id || null,
        };
      });

      setSales(formattedSales);
    } catch (error: any) {
      console.error('Veriler yüklenirken hata:', error);
      alert('Veriler yüklenirken bir hata oluştu: ' + error.message);
    } finally {
      setLoadingData(false);
    }
  };

  const jobTypes = [
    { value: 'kombi_montajı', label: 'Kombi Montajı' },
    { value: 'iç_gaz_montajı', label: 'İç Gaz Montajı' },
    { value: 'kolon', label: 'Kolon' },
    { value: 'kolektör_taşıma', label: 'Kolektör Taşıma' },
    { value: 'su_taşıma', label: 'Su Taşıma' },
    { value: 'full_montaj', label: 'Full Montaj' },
    { value: 'proje', label: 'Proje' },
    { value: 'gaz_açımı', label: 'Gaz Açımı' },
  ];

  const handleJobTypeToggle = (jobType: string) => {
    const newSelected = new Set(selectedJobTypes);
    if (newSelected.has(jobType)) {
      newSelected.delete(jobType);
    } else {
      newSelected.add(jobType);
    }
    setSelectedJobTypes(newSelected);
  };

  const addSelectedToQueue = () => {
    if (selectedJobTypes.size === 0) {
      alert('Lütfen en az bir iş tipi seçin');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const newItems: JobAssignmentItem[] = Array.from(selectedJobTypes).map((jobType) => ({
      id: Math.random().toString(36).substr(2, 9),
      job_type: jobType as any,
      team_id: formData.default_team_id || '',
      assigned_date: today,
      planned_start_date: '',
      planned_end_date: '',
      unit_price: '',
      price: '',
    }));

    setAssignmentItems([...assignmentItems, ...newItems]);
    setSelectedJobTypes(new Set());
  };

  const removeFromQueue = (id: string) => {
    setAssignmentItems(assignmentItems.filter(item => item.id !== id));
  };

  const updateQueueItem = (id: string, field: keyof JobAssignmentItem, value: string) => {
    setAssignmentItems(assignmentItems.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.sale_id) {
      alert('Lütfen bir satış seçin');
      return;
    }


    if (assignmentItems.length === 0) {
      alert('Lütfen en az bir iş ataması ekleyin');
      return;
    }

    // Validasyon
    for (const item of assignmentItems) {
      if (!item.team_id) {
        alert(`"${getJobTypeLabel(item.job_type)}" iş tipi için ekip seçilmelidir`);
        return;
      }
      if (!item.assigned_date) {
        alert('Tüm iş atamaları için atama tarihi girilmelidir');
        return;
      }
      if (!item.unit_price || parseFloat(item.unit_price) <= 0) {
        alert(`"${getJobTypeLabel(item.job_type)}" iş tipi için geçerli bir birim tutar girilmelidir`);
        return;
      }
      const quantity = getQuantityForJobType(item.job_type);
      if (quantity <= 0) {
        alert(`"${getJobTypeLabel(item.job_type)}" iş tipi için birim sayısı hesaplanamadı. Satışa bağlı projede daire/dükkan bilgisi olmalıdır.`);
        return;
      }
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const assignmentsToInsert = assignmentItems.map(item => {
        const quantity = getQuantityForJobType(item.job_type);
        const unitPrice = parseFloat(item.unit_price);
        const totalPrice = quantity * unitPrice;
        return {
          sale_id: formData.sale_id,
          team_id: item.team_id,
          job_type: item.job_type,
          assigned_date: item.assigned_date,
          planned_start_date: item.planned_start_date || null,
          planned_end_date: item.planned_end_date || null,
          price: totalPrice,
          notes: formData.notes || null,
          assigned_by: user?.id,
        };
      });

      const { error } = await supabase
        .from('job_assignments')
        .insert(assignmentsToInsert);

      if (error) throw error;

      router.push('/teams/assignments');
    } catch (error: any) {
      console.error('İş ataması eklenirken hata:', error);
      alert('İş ataması eklenirken bir hata oluştu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getQuantityForJobType = (jobType: string): number => {
    if (!projectDetails) return 0;
    const { total_apartments, shop_count } = projectDetails;
    if (jobType === 'kolon') {
      return total_apartments + shop_count + 1;
    }
    return total_apartments + shop_count;
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

  if (loadingData) {
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
            <h1 className="text-3xl font-bold text-gray-900">Yeni İş Ataması</h1>
            <p className="text-gray-600 mt-1">Ekiplere yeni iş ataması yapın</p>
          </div>
          <Button
            onClick={() => router.push('/teams/assignments')}
            className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            Geri Dön
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>İş Atama Bilgileri</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Satış <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.sale_id}
                  onChange={(e) => setFormData({ ...formData, sale_id: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                >
                  <option value="">Satış seçin</option>
                  {sales.map((sale) => (
                    <option key={sale.id} value={sale.id}>
                      {sale.invoice_number || 'Fatura No Yok'} - {sale.customer_name}
                    </option>
                  ))}
                </select>
                {formData.sale_id && (
                  <p className="text-xs text-gray-500 mt-1">
                    {projectDetails
                      ? `Proje: ${projectDetails.total_apartments} daire + ${projectDetails.shop_count} dükkan`
                      : 'Bu satışta proje bulunamadı. Birim sayıları hesaplanamayacak.'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Varsayılan Ekip
                </label>
                <p className="text-xs text-gray-500 mb-1">
                  Listeye eklerken seçilen iş tiplerine bu ekip varsayılan atanır. Her iş tipi için ayrı ekip seçebilirsiniz.
                </p>
                <select
                  value={formData.default_team_id}
                  onChange={(e) => setFormData({ ...formData, default_team_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                >
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* İş Tipi Seçimi */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  İş Tipleri Seçin <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                  {jobTypes.map((jobType) => (
                    <label
                      key={jobType.value}
                      className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedJobTypes.has(jobType.value)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedJobTypes.has(jobType.value)}
                        onChange={() => handleJobTypeToggle(jobType.value)}
                        className="mr-2 w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm font-medium">{jobType.label}</span>
                    </label>
                  ))}
                </div>
                <Button
                  type="button"
                  onClick={addSelectedToQueue}
                  disabled={selectedJobTypes.size === 0}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Seçilenleri Listeye Ekle ({selectedJobTypes.size})
                </Button>
              </div>

              {/* İş Atama Listesi */}
              {assignmentItems.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    İş Atama Listesi ({assignmentItems.length} adet)
                  </label>
                  <div className="space-y-3 border border-gray-200 rounded-lg p-4 bg-gray-50">
                    {assignmentItems.map((item) => (
                      <div
                        key={item.id}
                        className="bg-white border border-gray-200 rounded-lg p-4 space-y-3"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-semibold text-gray-900">
                              {getJobTypeLabel(item.job_type)}
                            </h4>
                            {item.team_id ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200">
                                {teams.find((t) => t.id === item.team_id)?.name || 'Bilinmeyen Ekip'}
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium bg-amber-100 text-amber-800 border border-amber-200">
                                Ekip seçilmedi
                              </span>
                            )}
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFromQueue(item.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="mb-3">
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Ekip <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={item.team_id}
                            onChange={(e) => updateQueueItem(item.id, 'team_id', e.target.value)}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900"
                          >
                            <option value="">Ekip seçin</option>
                            {teams.map((team) => (
                              <option key={team.id} value={team.id}>
                                {team.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Birim Sayısı
                            </label>
                            <div className="px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-sm font-medium">
                              {projectDetails
                                ? getQuantityForJobType(item.job_type)
                                : '—'}
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {item.job_type === 'kolon' ? 'Daire + Dükkan + 1' : 'Daire + Dükkan'}
                            </p>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Birim Tutar (₺) <span className="text-red-500">*</span>
                            </label>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.unit_price}
                              onChange={(e) => updateQueueItem(item.id, 'unit_price', e.target.value)}
                              placeholder="0.00"
                              required
                              className="text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Toplam Tutar (₺)
                            </label>
                            <div className="px-3 py-2 border border-blue-200 rounded-md bg-blue-50 text-sm font-semibold text-blue-800">
                              {projectDetails && item.unit_price
                                ? formatCurrency(getQuantityForJobType(item.job_type) * parseFloat(item.unit_price || '0'))
                                : '0,00'}
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Atama Tarihi <span className="text-red-500">*</span>
                            </label>
                            <Input
                              type="date"
                              value={item.assigned_date}
                              onChange={(e) => updateQueueItem(item.id, 'assigned_date', e.target.value)}
                              required
                              className="text-sm"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2 lg:col-span-1">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Planlanan Başlangıç
                              </label>
                              <Input
                                type="date"
                                value={item.planned_start_date}
                                onChange={(e) => updateQueueItem(item.id, 'planned_start_date', e.target.value)}
                                className="text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Planlanan Bitiş
                              </label>
                              <Input
                                type="date"
                                value={item.planned_end_date}
                                onChange={(e) => updateQueueItem(item.id, 'planned_end_date', e.target.value)}
                                className="text-sm"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 min-w-[200px] text-right">
                      <div className="text-sm text-gray-600 mb-1">Kalemler Toplamı</div>
                      <div className="text-xl font-bold text-blue-800">
                        {formatCurrency(
                          assignmentItems.reduce(
                            (sum, item) =>
                              sum + getQuantityForJobType(item.job_type) * parseFloat(item.unit_price || '0'),
                            0
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notlar
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="İş ataması ile ilgili notlar"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Kaydediliyor...
                    </>
                  ) : (
                    'İş Ataması Oluştur'
                  )}
                </Button>
                <Button
                  type="button"
                  className="bg-gray-500 hover:bg-gray-600 text-white"
                  onClick={() => router.push('/teams/assignments')}
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

export default function NewJobAssignmentPage() {
  return (
    <Suspense fallback={<MainLayout><div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div></MainLayout>}>
      <NewJobAssignmentContent />
    </Suspense>
  );
}
