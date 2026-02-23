'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

export default function EditProjectPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;
  const projectId = params.projectId as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [customer, setCustomer] = useState<{ contact_person: string; company_name: string | null } | null>(null);
  const [formData, setFormData] = useState({
    project_name: '',
    project_type: 'ev' as 'ev' | 'yapı' | 'iş_yeri',
    address: '',
    city: '',
    district: '',
    description: '',
    floor_count: '',
    apartments_by_floor: [] as string[],
    shop_count: '',
    device_count: '',
  });

  useEffect(() => {
    if (projectId && customerId) {
      loadData();
    }
  }, [projectId, customerId]);

  const loadData = async () => {
    try {
      setLoading(true);

      const { data: projectData, error: projectError } = await supabase
        .from('customer_projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (projectError) throw projectError;
      if (!projectData) throw new Error('Proje bulunamadı');

      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('contact_person, company_name')
        .eq('id', projectData.customer_id)
        .single();

      if (customerError) throw customerError;
      setCustomer(customerData);

      const floorCount = projectData.floor_count ?? 0;
      let apartmentsByFloor: string[] = [];
      if (Array.isArray(projectData.apartments_by_floor) && projectData.apartments_by_floor.length > 0) {
        apartmentsByFloor = projectData.apartments_by_floor.map((v: number) => String(v));
      } else if (projectData.apartments_per_floor != null && floorCount > 0) {
        apartmentsByFloor = Array(floorCount).fill(String(projectData.apartments_per_floor));
      } else if (floorCount > 0) {
        apartmentsByFloor = Array(floorCount).fill('');
      }

      setFormData({
        project_name: projectData.project_name || '',
        project_type: (projectData.project_type as 'ev' | 'yapı' | 'iş_yeri') || 'ev',
        address: projectData.address || '',
        city: projectData.city || '',
        district: projectData.district || '',
        description: projectData.description || '',
        floor_count: floorCount > 0 ? String(floorCount) : '',
        apartments_by_floor: apartmentsByFloor,
        shop_count: projectData.shop_count != null ? String(projectData.shop_count) : '',
        device_count: projectData.device_count != null ? String(projectData.device_count) : '',
      });
    } catch (error: unknown) {
      console.error('Veri yüklenirken hata:', error);
      alert('Proje yüklenirken bir hata oluştu: ' + (error as Error).message);
      router.push(`/customers/${customerId}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const updateData: Record<string, unknown> = {
        project_name: formData.project_name,
        project_type: formData.project_type,
        address: formData.address || null,
        city: formData.city || null,
        district: formData.district || null,
        description: formData.description || null,
        updated_at: new Date().toISOString(),
      };

      if (formData.project_type === 'ev') {
        const floorCount = formData.floor_count ? parseInt(formData.floor_count, 10) : 0;
        updateData.floor_count = floorCount > 0 ? floorCount : null;
        const aptsByFloor = formData.apartments_by_floor
          .slice(0, floorCount)
          .map((v) => parseInt(v, 10))
          .filter((n) => !isNaN(n) && n >= 0);
        updateData.apartments_by_floor = aptsByFloor.length > 0 ? aptsByFloor : null;
        updateData.shop_count = formData.shop_count ? parseInt(formData.shop_count, 10) : null;
        updateData.device_count = null;
      } else if (formData.project_type === 'iş_yeri') {
        updateData.device_count = formData.device_count ? parseInt(formData.device_count, 10) : null;
        updateData.floor_count = null;
        updateData.apartments_by_floor = null;
        updateData.shop_count = null;
      } else {
        updateData.floor_count = null;
        updateData.apartments_by_floor = null;
        updateData.shop_count = null;
        updateData.device_count = null;
      }

      const { error } = await supabase
        .from('customer_projects')
        .update(updateData)
        .eq('id', projectId);

      if (error) throw error;

      router.push(`/customers/${customerId}/projects/${projectId}`);
    } catch (error: unknown) {
      console.error('Proje güncellenirken hata:', error);
      alert('Hata: ' + (error as Error).message);
    } finally {
      setSaving(false);
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
            <h1 className="text-3xl font-bold text-gray-900">Proje Düzenle</h1>
            {customer && (
              <p className="text-gray-600 mt-1">
                Müşteri: {customer.contact_person}
                {customer.company_name && ` - ${customer.company_name}`}
              </p>
            )}
          </div>
          <Button
            onClick={() => router.push(`/customers/${customerId}/projects/${projectId}`)}
            className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            Geri Dön
          </Button>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Proje Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Proje Adı <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.project_name}
                  onChange={(e) => setFormData({ ...formData, project_name: e.target.value })}
                  required
                  placeholder="Proje adı"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Proje Tipi <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.project_type}
                  onChange={(e) => setFormData({ ...formData, project_type: e.target.value as 'ev' | 'yapı' | 'iş_yeri' })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="ev">Ev</option>
                  <option value="yapı">Yapı</option>
                  <option value="iş_yeri">İş Yeri</option>
                </select>
              </div>

              {formData.project_type === 'ev' && (
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Kat Sayısı</label>
                      <Input
                        type="number"
                        min="1"
                        value={formData.floor_count}
                        onChange={(e) => {
                          const val = e.target.value;
                          const count = val ? Math.max(1, parseInt(val, 10)) : 0;
                          const newApts = [...formData.apartments_by_floor];
                          while (newApts.length < count) newApts.push('');
                          setFormData({ ...formData, floor_count: val, apartments_by_floor: newApts.slice(0, count) });
                        }}
                        placeholder="Örn: 4"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Dükkan Sayısı</label>
                      <Input
                        type="number"
                        min="0"
                        value={formData.shop_count}
                        onChange={(e) => setFormData({ ...formData, shop_count: e.target.value })}
                        placeholder="Örn: 1"
                      />
                    </div>
                  </div>
                  {parseInt(formData.floor_count, 10) > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Her Katta Daire Sayısı (katlar farklı olabilir)
                        </label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="0"
                            placeholder="Tümü"
                            className="w-20"
                            id="same-all-floors-edit"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const inp = document.getElementById('same-all-floors-edit') as HTMLInputElement;
                              const v = inp?.value ? parseInt(inp.value, 10) : 0;
                              if (!isNaN(v) && v >= 0) {
                                const cnt = parseInt(formData.floor_count, 10) || 0;
                                setFormData({ ...formData, apartments_by_floor: Array(cnt).fill(String(v)) });
                              }
                            }}
                          >
                            Tüm katlara uygula
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                        {Array.from({ length: parseInt(formData.floor_count, 10) || 0 }).map((_, i) => (
                          <div key={i}>
                            <label className="block text-xs text-gray-500 mb-0.5">{i + 1}. Kat</label>
                            <Input
                              type="number"
                              min="0"
                              value={formData.apartments_by_floor[i] ?? ''}
                              onChange={(e) => {
                                const arr = [...formData.apartments_by_floor];
                                arr[i] = e.target.value;
                                setFormData({ ...formData, apartments_by_floor: arr });
                              }}
                              placeholder="0"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {formData.project_type === 'iş_yeri' && (
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kullanılacak Cihaz Sayısı</label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.device_count}
                      onChange={(e) => setFormData({ ...formData, device_count: e.target.value })}
                      placeholder="Örn: 5"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">İl</label>
                  <Input
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="İl"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">İlçe</label>
                  <Input
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    placeholder="İlçe"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Adres</label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Adres"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Proje açıklaması"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Kaydediliyor...
                    </>
                  ) : (
                    'Değişiklikleri Kaydet'
                  )}
                </Button>
                <Button
                  type="button"
                  className="bg-gray-500 hover:bg-gray-600 text-white"
                  onClick={() => router.push(`/customers/${customerId}/projects/${projectId}`)}
                  disabled={saving}
                >
                  İptal
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </MainLayout>
  );
}
