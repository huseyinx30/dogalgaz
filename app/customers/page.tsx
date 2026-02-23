'use client';

import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, Phone, Mail, Eye, Edit, Loader2, Filter, X, TrendingUp, TrendingDown, Users, Building2, MapPin } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { formatDate, formatCurrency } from '@/lib/utils';

interface Customer {
  id: string;
  company_name: string | null;
  contact_person: string;
  email: string | null;
  phone: string;
  address: string | null;
  city: string | null;
  district: string | null;
  created_at: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [projectCounts, setProjectCounts] = useState<Record<string, number>>({});
  const [accountBalances, setAccountBalances] = useState<Record<string, number>>({});
  
  // Filtreler
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [districtFilter, setDistrictFilter] = useState<string>('all');
  const [debtFilter, setDebtFilter] = useState<string>('all'); // all, has_debt, no_debt
  const [projectFilter, setProjectFilter] = useState<string>('all'); // all, has_projects, no_projects
  const [sortBy, setSortBy] = useState<string>('created_at'); // created_at, name, debt, projects
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);
  
  // İstatistikler
  const [stats, setStats] = useState({
    total: 0,
    withProjects: 0,
    withDebt: 0,
    totalDebt: 0,
  });

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    if (customers.length > 0) {
      loadProjectCounts();
      loadAccountBalances();
      calculateStats();
    }
  }, [customers, projectCounts, accountBalances]);

  const loadCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setCustomers(data || []);
    } catch (error: any) {
      console.error('Müşteriler yüklenirken hata:', error);
      alert('Müşteriler yüklenirken bir hata oluştu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadProjectCounts = async () => {
    try {
      const customerIds = customers.map(c => c.id);
      
      const { data, error } = await supabase
        .from('customer_projects')
        .select('customer_id')
        .in('customer_id', customerIds);

      if (error) throw error;

      const counts: Record<string, number> = {};
      data?.forEach((project: any) => {
        counts[project.customer_id] = (counts[project.customer_id] || 0) + 1;
      });

      setProjectCounts(counts);
    } catch (error: any) {
      console.error('Proje sayıları yüklenirken hata:', error);
    }
  };

  const loadAccountBalances = async () => {
    try {
      const customerIds = customers.map(c => c.id);
      
      const { data, error } = await supabase
        .from('sales')
        .select('customer_id, remaining_amount')
        .in('customer_id', customerIds);

      if (error) throw error;

      const balances: Record<string, number> = {};
      data?.forEach((sale: any) => {
        const customerId = sale.customer_id;
        const amount = sale.remaining_amount || 0;
        balances[customerId] = (balances[customerId] || 0) + amount;
      });

      setAccountBalances(balances);
    } catch (error: any) {
      console.error('Cari hesap bakiyeleri yüklenirken hata:', error);
    }
  };

  const calculateStats = () => {
    const withProjects = customers.filter(c => (projectCounts[c.id] || 0) > 0).length;
    const withDebt = customers.filter(c => (accountBalances[c.id] || 0) > 0).length;
    const totalDebt = customers.reduce((sum, c) => sum + (accountBalances[c.id] || 0), 0);

    setStats({
      total: customers.length,
      withProjects,
      withDebt,
      totalDebt,
    });
  };

  // Şehir ve ilçe listelerini al (null/undefined filtrele)
  const cities = [...new Set(customers.map(c => c.city).filter((x): x is string => !!x))].sort();
  const districts = [...new Set(customers.map(c => c.district).filter((x): x is string => !!x))].sort();

  const filteredCustomers = customers
    .filter((customer) => {
      // Arama filtresi
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          customer.contact_person.toLowerCase().includes(searchLower) ||
          (customer.company_name?.toLowerCase().includes(searchLower) ?? false) ||
          customer.phone.includes(searchTerm) ||
          (customer.email?.toLowerCase().includes(searchLower) ?? false) ||
          (customer.city?.toLowerCase().includes(searchLower) ?? false) ||
          (customer.district?.toLowerCase().includes(searchLower) ?? false) ||
          (customer.address?.toLowerCase().includes(searchLower) ?? false);
        if (!matchesSearch) return false;
      }

      // Şehir filtresi
      if (cityFilter !== 'all' && customer.city !== cityFilter) {
        return false;
      }

      // İlçe filtresi
      if (districtFilter !== 'all' && customer.district !== districtFilter) {
        return false;
      }

      // Borç filtresi
      const debt = accountBalances[customer.id] || 0;
      if (debtFilter === 'has_debt' && debt <= 0) return false;
      if (debtFilter === 'no_debt' && debt > 0) return false;

      // Proje filtresi
      const projectCount = projectCounts[customer.id] || 0;
      if (projectFilter === 'has_projects' && projectCount === 0) return false;
      if (projectFilter === 'no_projects' && projectCount > 0) return false;

      return true;
    })
    .sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          const nameA = (a.company_name || a.contact_person).toLowerCase();
          const nameB = (b.company_name || b.contact_person).toLowerCase();
          comparison = nameA.localeCompare(nameB);
          break;
        case 'debt':
          comparison = (accountBalances[a.id] || 0) - (accountBalances[b.id] || 0);
          break;
        case 'projects':
          comparison = (projectCounts[a.id] || 0) - (projectCounts[b.id] || 0);
          break;
        case 'created_at':
        default:
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const getAddress = (customer: Customer) => {
    const parts = [customer.address, customer.district, customer.city].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'Adres bilgisi yok';
  };

  const clearFilters = () => {
    setCityFilter('all');
    setDistrictFilter('all');
    setDebtFilter('all');
    setProjectFilter('all');
    setSearchTerm('');
  };

  const hasActiveFilters = cityFilter !== 'all' || districtFilter !== 'all' || debtFilter !== 'all' || projectFilter !== 'all' || searchTerm !== '';

  return (
    <MainLayout>
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Müşteriler</h1>
            <p className="text-gray-600 sm:text-gray-700 mt-1 sm:mt-2 text-sm sm:text-base font-medium">
              {loading ? 'Yükleniyor...' : `${customers.length} müşteri bulundu`}
            </p>
          </div>
          <Link href="/customers/new" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Yeni Müşteri
            </Button>
          </Link>
        </div>

        {/* İstatistik Kartları */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Toplam Müşteri</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Projeli Müşteri</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.withProjects}</p>
                </div>
                <Building2 className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Borçlu Müşteri</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.withDebt}</p>
                </div>
                <TrendingDown className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Toplam Borç</p>
                  <p className="text-2xl font-bold text-red-600">{formatCurrency(stats.totalDebt)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Arama ve Filtreler */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Müşteri Listesi</CardTitle>
              <div className="flex items-center gap-2">
                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                    className="text-gray-600"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Filtreleri Temizle
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className={showFilters ? 'bg-blue-50 border-blue-300' : ''}
                >
                  <Filter className="w-4 h-4 mr-1" />
                  Filtreler
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4 space-y-4">
              {/* Arama */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="search"
                  placeholder="Müşteri ara (isim, firma, telefon, email, adres, şehir, ilçe)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Gelişmiş Filtreler */}
              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Şehir
                    </label>
                    <select
                      value={cityFilter}
                      onChange={(e) => {
                        setCityFilter(e.target.value);
                        setDistrictFilter('all'); // Şehir değişince ilçe filtresini sıfırla
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">Tüm Şehirler</option>
                      {cities.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      İlçe
                    </label>
                    <select
                      value={districtFilter}
                      onChange={(e) => setDistrictFilter(e.target.value)}
                      disabled={cityFilter === 'all'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="all">Tüm İlçeler</option>
                      {cityFilter !== 'all' && districts
                        .filter(d => {
                          const customer = customers.find(c => c.district === d && c.city === cityFilter);
                          return customer !== undefined;
                        })
                        .map((district) => (
                          <option key={district} value={district}>
                            {district}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Borç Durumu
                    </label>
                    <select
                      value={debtFilter}
                      onChange={(e) => setDebtFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">Tümü</option>
                      <option value="has_debt">Borçlu</option>
                      <option value="no_debt">Borçsuz</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Proje Durumu
                    </label>
                    <select
                      value={projectFilter}
                      onChange={(e) => setProjectFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">Tümü</option>
                      <option value="has_projects">Projeli</option>
                      <option value="no_projects">Projesiz</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sıralama
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="created_at">Kayıt Tarihi</option>
                        <option value="name">İsim</option>
                        <option value="debt">Borç</option>
                        <option value="projects">Proje Sayısı</option>
                      </select>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                        className="px-3"
                        title={sortOrder === 'asc' ? 'Artan' : 'Azalan'}
                      >
                        {sortOrder === 'asc' ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Sonuç Sayısı */}
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>
                  {filteredCustomers.length} müşteri gösteriliyor
                  {hasActiveFilters && ` (${customers.length} toplam)`}
                </span>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-3 h-3 mr-1" />
                    Temizle
                  </Button>
                )}
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">Yükleniyor...</span>
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">
                  {searchTerm ? 'Arama sonucu bulunamadı' : 'Henüz müşteri eklenmemiş'}
                </p>
                {!searchTerm && (
                  <Link href="/customers/new">
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      İlk Müşteriyi Ekle
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <>
                {/* Mobil: Kart görünümü */}
                <div className="md:hidden space-y-3">
                  {filteredCustomers.map((customer) => (
                    <div
                      key={customer.id}
                      className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-gray-900 truncate">{customer.contact_person}</div>
                          {customer.company_name && (
                            <div className="text-sm text-gray-500 truncate">{customer.company_name}</div>
                          )}
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Link href={`/customers/${customer.id}`}>
                            <Button variant="ghost" size="icon" title="Detay">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Link href={`/customers/${customer.id}/edit`}>
                            <Button variant="ghost" size="icon" title="Düzenle">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                      {customer.phone && (
                        <a href={`tel:${customer.phone}`} className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                          <Phone className="w-3 h-3" />
                          {customer.phone}
                        </a>
                      )}
                      {customer.email && (
                        <a href={`mailto:${customer.email}`} className="flex items-center gap-2 text-sm text-blue-600 hover:underline truncate mt-0.5">
                          <Mail className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{customer.email}</span>
                        </a>
                      )}
                      <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-gray-100">
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          {projectCounts[customer.id] || 0} proje
                        </span>
                        <span className={`text-sm font-semibold ${(accountBalances[customer.id] || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {formatCurrency(accountBalances[customer.id] || 0)}
                        </span>
                        <span className="text-xs text-gray-500 ml-auto">
                          {formatDate(customer.created_at)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Masaüstü: Tablo görünümü */}
                <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <button
                          onClick={() => {
                            setSortBy('name');
                            setSortOrder(sortBy === 'name' && sortOrder === 'asc' ? 'desc' : 'asc');
                          }}
                          className="flex items-center gap-1 hover:text-blue-600"
                        >
                          Müşteri Adı
                          {sortBy === 'name' && (
                            sortOrder === 'asc' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />
                          )}
                        </button>
                      </TableHead>
                      <TableHead>İletişim</TableHead>
                      <TableHead>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          Adres
                        </div>
                      </TableHead>
                      <TableHead>
                        <button
                          onClick={() => {
                            setSortBy('projects');
                            setSortOrder(sortBy === 'projects' && sortOrder === 'asc' ? 'desc' : 'asc');
                          }}
                          className="flex items-center gap-1 hover:text-blue-600"
                        >
                          Proje Sayısı
                          {sortBy === 'projects' && (
                            sortOrder === 'asc' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />
                          )}
                        </button>
                      </TableHead>
                      <TableHead>
                        <button
                          onClick={() => {
                            setSortBy('debt');
                            setSortOrder(sortBy === 'debt' && sortOrder === 'asc' ? 'desc' : 'asc');
                          }}
                          className="flex items-center gap-1 hover:text-blue-600"
                        >
                          Cari Hesap
                          {sortBy === 'debt' && (
                            sortOrder === 'asc' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />
                          )}
                        </button>
                      </TableHead>
                      <TableHead>
                        <button
                          onClick={() => {
                            setSortBy('created_at');
                            setSortOrder(sortBy === 'created_at' && sortOrder === 'asc' ? 'desc' : 'asc');
                          }}
                          className="flex items-center gap-1 hover:text-blue-600"
                        >
                          Kayıt Tarihi
                          {sortBy === 'created_at' && (
                            sortOrder === 'asc' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />
                          )}
                        </button>
                      </TableHead>
                      <TableHead>İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCustomers.map((customer) => (
                      <TableRow key={customer.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium">
                          <div>
                            <div className="font-semibold">{customer.contact_person}</div>
                            {customer.company_name && (
                              <div className="text-sm text-gray-500">{customer.company_name}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {customer.phone && (
                              <div className="flex items-center gap-2 text-sm">
                                <Phone className="w-3 h-3 text-gray-400" />
                                <a href={`tel:${customer.phone}`} className="hover:text-blue-600">
                                  {customer.phone}
                                </a>
                              </div>
                            )}
                            {customer.email && (
                              <div className="flex items-center gap-2 text-sm">
                                <Mail className="w-3 h-3 text-gray-400" />
                                <a href={`mailto:${customer.email}`} className="hover:text-blue-600 truncate max-w-[200px]">
                                  {customer.email}
                                </a>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm max-w-[250px] truncate" title={getAddress(customer)}>
                            {getAddress(customer)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                            {projectCounts[customer.id] || 0}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`font-semibold ${(accountBalances[customer.id] || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {formatCurrency(accountBalances[customer.id] || 0)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-500">
                            {formatDate(customer.created_at)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Link href={`/customers/${customer.id}`}>
                              <Button variant="ghost" size="icon" title="Detayları Gör">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </Link>
                            <Link href={`/customers/${customer.id}/edit`}>
                              <Button variant="ghost" size="icon" title="Düzenle">
                                <Edit className="w-4 h-4" />
                              </Button>
                            </Link>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

