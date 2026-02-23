'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, ArrowLeft, Search, Loader2, AlertTriangle, Package } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { supabase } from '@/lib/supabase/client';

interface Customer {
  id: string;
  contact_person: string;
  company_name: string | null;
}

interface Project {
  id: string;
  project_name: string;
}

interface ProjectDetails {
  floor_count: number | null;
  apartments_by_floor: number[] | null;
  apartments_per_floor: number | null;
  shop_count: number | null;
}

interface Product {
  id: string;
  name: string;
  code: string | null;
  category_id: string | null;
  category_name: string | null;
  unit: string;
  sale_price: number | null;
  stock_quantity: number;
  min_stock_level: number;
}

interface Category {
  id: string;
  name: string;
}

interface OfferItem {
  product_id: string;
  product_name: string;
  product_code: string | null;
  product_unit: string;
  quantity: number;
  unit_price: number;
  discount_percentage: number;
  discount_amount: number;
  tax_percentage: number;
  tax_amount: number;
  total_amount: number;
  stock_quantity: number;
  min_stock_level: number | null;
}

function NewOfferContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const customerId = searchParams.get('customer');
  const projectId = searchParams.get('project');
  
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<OfferItem[]>([]);
  
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [selectedProjectDetails, setSelectedProjectDetails] = useState<ProjectDetails | null>(null);
  
  const [formData, setFormData] = useState({
    customer_id: customerId || '',
    project_id: projectId || '',
    offer_date: new Date().toISOString().split('T')[0],
    valid_until: '',
    tax_percentage: '20',
    notes: '',
  });

  useEffect(() => {
    const initialize = async () => {
      await Promise.all([
        loadCustomers(),
        loadCategories(),
        loadProducts(),
      ]);
      
      if (customerId) {
        await loadProjects(customerId);
        setFormData(prev => ({ 
          ...prev, 
          customer_id: customerId,
          project_id: projectId || ''
        }));
      }
      
      setLoadingData(false);
    };
    
    initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (formData.customer_id) {
      loadProjects(formData.customer_id);
      if (formData.customer_id !== customerId) {
        setFormData(prev => ({ ...prev, project_id: '' }));
      }
    } else {
      setProjects([]);
      setFormData(prev => ({ ...prev, project_id: '' }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.customer_id]);

  useEffect(() => {
    const loadProjectDetails = async (projId: string) => {
      try {
        const { data, error } = await supabase
          .from('customer_projects')
          .select('floor_count, apartments_by_floor, apartments_per_floor, shop_count')
          .eq('id', projId)
          .single();

        if (error) throw error;
        setSelectedProjectDetails({
          floor_count: data?.floor_count ?? null,
          apartments_by_floor: data?.apartments_by_floor ?? null,
          apartments_per_floor: data?.apartments_per_floor ?? null,
          shop_count: data?.shop_count ?? null,
        });
      } catch (err) {
        console.error('Proje detayları yüklenirken hata:', err);
        setSelectedProjectDetails(null);
      }
    };

    if (formData.project_id) {
      loadProjectDetails(formData.project_id);
    } else {
      setSelectedProjectDetails(null);
    }
  }, [formData.project_id]);

  useEffect(() => {
    filterProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategoryId, productSearchTerm, products]);

  const loadCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, contact_person, company_name')
        .order('contact_person', { ascending: true });

      if (error) throw error;
      setCustomers(data || []);
    } catch (error: any) {
      console.error('Müşteriler yüklenirken hata:', error);
    }
  };

  const loadProjects = async (selectedCustomerId: string) => {
    try {
      const { data, error } = await supabase
        .from('customer_projects')
        .select('id, project_name')
        .eq('customer_id', selectedCustomerId)
        .order('project_name', { ascending: true });

      if (error) throw error;
      setProjects(data || []);

      if (projectId && selectedCustomerId === customerId) {
        setFormData(prev => ({ ...prev, project_id: projectId }));
      }
    } catch (error: any) {
      console.error('Projeler yüklenirken hata:', error);
      setProjects([]);
    }
  };

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('product_categories')
        .select('id, name')
        .order('name', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      console.error('Kategoriler yüklenirken hata:', error);
    }
  };

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          product_categories(name)
        `)
        .order('name', { ascending: true });

      if (error) throw error;

      const formattedProducts = (data || []).map((product: any) => ({
        id: product.id,
        name: product.name,
        code: product.code,
        category_id: product.category_id,
        category_name: product.product_categories?.name || null,
        unit: product.unit,
        sale_price: product.sale_price,
        stock_quantity: product.stock_quantity,
        min_stock_level: product.min_stock_level,
      }));

      setProducts(formattedProducts);
    } catch (error: any) {
      console.error('Ürünler yüklenirken hata:', error);
    }
  };

  const filterProducts = () => {
    let filtered = products;

    if (selectedCategoryId) {
      filtered = filtered.filter(p => p.category_id === selectedCategoryId);
    }

    if (productSearchTerm) {
      const searchLower = productSearchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchLower) ||
        (p.code && p.code.toLowerCase().includes(searchLower))
      );
    }

    setFilteredProducts(filtered);
  };

  const addItem = () => {
    setShowProductSelector(true);
    setSelectedProductIds(new Set());
    setProductSearchTerm('');
    setSelectedCategoryId('');
  };

  const toggleProductSelection = (productId: string) => {
    const newSelection = new Set(selectedProductIds);
    if (newSelection.has(productId)) {
      newSelection.delete(productId);
    } else {
      newSelection.add(productId);
    }
    setSelectedProductIds(newSelection);
  };

  const addSelectedProducts = () => {
    const taxPercent = parseFloat(formData.tax_percentage) || 0;
    const newItems: OfferItem[] = [];

    selectedProductIds.forEach(productId => {
      const product = products.find(p => p.id === productId);
      if (!product) return;

      // Eğer bu ürün zaten listede varsa, ekleme
      if (items.some(item => item.product_id === productId)) {
        return;
      }

      const unitPrice = product.sale_price || 0;
      const subtotal = unitPrice;
      const discountAmount = 0;
      const afterDiscount = subtotal - discountAmount;
      const taxAmount = afterDiscount * (taxPercent / 100);
      const totalAmount = afterDiscount + taxAmount;

      newItems.push({
        product_id: product.id,
        product_name: product.name,
        product_code: product.code,
        product_unit: product.unit,
        quantity: 1,
        unit_price: unitPrice,
        discount_percentage: 0,
        discount_amount: discountAmount,
        tax_percentage: taxPercent,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        stock_quantity: product.stock_quantity,
        min_stock_level: product.min_stock_level,
      });
    });

    if (newItems.length > 0) {
      setItems([...items, ...newItems]);
    }

    setShowProductSelector(false);
    setSelectedProductIds(new Set());
    setProductSearchTerm('');
    setSelectedCategoryId('');
  };

  const updateItem = (index: number, field: keyof OfferItem, value: any) => {
    const updatedItems = [...items];
    const item = updatedItems[index];

    if (field === 'quantity' || field === 'unit_price' || field === 'discount_percentage') {
      const quantity = field === 'quantity' ? value : item.quantity;
      const unitPrice = field === 'unit_price' ? value : item.unit_price;
      const discountPercent = field === 'discount_percentage' ? value : item.discount_percentage;

      const subtotal = quantity * unitPrice;
      const discountAmount = subtotal * (discountPercent / 100);
      const afterDiscount = subtotal - discountAmount;
      const taxAmount = afterDiscount * (item.tax_percentage / 100);
      const totalAmount = afterDiscount + taxAmount;

      updatedItems[index] = {
        ...item,
        [field]: value,
        discount_amount: discountAmount,
        tax_amount: taxAmount,
        total_amount: totalAmount,
      };
    } else {
      updatedItems[index] = { ...item, [field]: value };
    }

    setItems(updatedItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  };

  const calculateTotalDiscount = () => {
    return items.reduce((sum, item) => sum + item.discount_amount, 0);
  };

  const calculateTotalTax = () => {
    return items.reduce((sum, item) => sum + item.tax_amount, 0);
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.total_amount, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (items.length === 0) {
      alert('Lütfen en az bir ürün ekleyin');
      return;
    }

    if (!formData.customer_id) {
      alert('Lütfen müşteri seçin');
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Teklif oluştur
      const { data: offerData, error: offerError } = await supabase
        .from('offers')
        .insert({
          customer_id: formData.customer_id,
          project_id: formData.project_id || null,
          offer_number: `TEK-${Date.now()}`,
          offer_date: formData.offer_date,
          valid_until: formData.valid_until || null,
          status: 'beklemede',
          total_amount: calculateSubtotal(),
          discount_percentage: 0,
          discount_amount: calculateTotalDiscount(),
          tax_amount: calculateTotalTax(),
          final_amount: calculateTotal(),
          notes: formData.notes || null,
          created_by: user?.id,
        })
        .select()
        .single();

      if (offerError) throw offerError;

      // Teklif kalemlerini ekle
      for (const item of items) {
        const { error: itemError } = await supabase
          .from('offer_items')
          .insert({
            offer_id: offerData.id,
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            discount_percentage: item.discount_percentage,
            discount_amount: item.discount_amount,
            tax_percentage: item.tax_percentage,
            tax_amount: item.tax_amount,
            total_amount: item.total_amount,
          });

        if (itemError) throw itemError;
      }

      router.push('/offers');
    } catch (error: any) {
      console.error('Teklif oluşturulurken hata:', error);
      alert('Teklif oluşturulurken bir hata oluştu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const customer = customers.find(c => c.id === formData.customer_id);
  const project = projects.find(p => p.id === formData.project_id);

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
            <h1 className="text-3xl font-bold text-gray-900">Yeni Teklif</h1>
            <p className="text-gray-700 mt-2 font-medium">Müşteriye yeni teklif oluşturun</p>
          </div>
          <Button
            onClick={() => router.push('/offers')}
            className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            Geri Dön
          </Button>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Teklif Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Müşteri <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.customer_id}
                    onChange={(e) => setFormData({ ...formData, customer_id: e.target.value, project_id: '' })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  >
                    <option value="">Müşteri seçin</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.contact_person}
                        {customer.company_name ? ` - ${customer.company_name}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Proje
                  </label>
                  <select
                    value={formData.project_id}
                    onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                    disabled={!formData.customer_id || projects.length === 0}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {!formData.customer_id 
                        ? 'Önce müşteri seçin' 
                        : projects.length === 0 
                        ? 'Bu müşteriye ait proje yok' 
                        : 'Proje seçin (opsiyonel)'}
                    </option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.project_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teklif Tarihi <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="date"
                    value={formData.offer_date}
                    onChange={(e) => setFormData({ ...formData, offer_date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Geçerlilik Tarihi
                  </label>
                  <Input
                    type="date"
                    value={formData.valid_until}
                    onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    KDV Oranı (%)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.tax_percentage}
                    onChange={(e) => {
                      setFormData({ ...formData, tax_percentage: e.target.value });
                      // Tüm kalemlerin KDV'sini güncelle
                      const taxPercent = parseFloat(e.target.value) || 0;
                      setItems(items.map(item => {
                        const subtotal = item.quantity * item.unit_price;
                        const discountAmount = subtotal * (item.discount_percentage / 100);
                        const afterDiscount = subtotal - discountAmount;
                        const taxAmount = afterDiscount * (taxPercent / 100);
                        const totalAmount = afterDiscount + taxAmount;
                        return {
                          ...item,
                          tax_percentage: taxPercent,
                          tax_amount: taxAmount,
                          total_amount: totalAmount,
                        };
                      }));
                    }}
                    placeholder="20"
                    min="0"
                    max="100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notlar
                  </label>
                  <Input
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Teklif notları"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {formData.project_id && selectedProjectDetails && (selectedProjectDetails.floor_count != null || selectedProjectDetails.shop_count != null || (selectedProjectDetails.apartments_by_floor && selectedProjectDetails.apartments_by_floor.length > 0) || selectedProjectDetails.apartments_per_floor != null) && (
            <Card className="bg-gray-50 border-gray-200">
              <CardHeader>
                <CardTitle className="text-base">Seçilen Proje Bilgileri</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  {selectedProjectDetails.floor_count != null && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg shadow-sm">
                      <span className="text-xs text-gray-500">Kat Sayısı:</span>
                      <span className="font-semibold text-gray-900">{selectedProjectDetails.floor_count}</span>
                    </div>
                  )}
                  {selectedProjectDetails.shop_count != null && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg shadow-sm">
                      <span className="text-xs text-gray-500">Dükkan:</span>
                      <span className="font-semibold text-amber-900">{selectedProjectDetails.shop_count}</span>
                    </div>
                  )}
                  {((selectedProjectDetails.apartments_by_floor && selectedProjectDetails.apartments_by_floor.length > 0) || selectedProjectDetails.apartments_per_floor != null) && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg shadow-sm">
                      <span className="text-xs text-gray-500">Toplam Daire:</span>
                      <span className="font-semibold text-gray-900">
                        {selectedProjectDetails.apartments_by_floor && selectedProjectDetails.apartments_by_floor.length > 0
                          ? selectedProjectDetails.apartments_by_floor.reduce((sum, n) => sum + Number(n), 0)
                          : (selectedProjectDetails.floor_count ?? 0) * (selectedProjectDetails.apartments_per_floor ?? 0)}
                      </span>
                    </div>
                  )}
                  {((selectedProjectDetails.apartments_by_floor && selectedProjectDetails.apartments_by_floor.length > 0) || selectedProjectDetails.shop_count != null) && (
                    <div className="flex flex-wrap gap-2 w-full">
                      <span className="text-xs text-gray-500 w-full">Her Katta Birim:</span>
                      {selectedProjectDetails.shop_count != null && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 border border-amber-200 rounded text-sm">
                          <span className="text-gray-500">Zemin:</span>
                          <span className="font-medium text-amber-900">{selectedProjectDetails.shop_count}</span>
                        </span>
                      )}
                      {selectedProjectDetails.apartments_by_floor?.map((n, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-gray-200 rounded text-sm"
                        >
                          <span className="text-gray-500">{i + 1}. Kat:</span>
                          <span className="font-medium">{n}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle>Ürünler ({items.length})</CardTitle>
              <Button type="button" onClick={addItem} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Ürün Ekle
              </Button>
            </CardHeader>
            <CardContent>
              {items.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p>Ürün eklemek için &quot;Ürün Ekle&quot; butonuna tıklayın</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ürün</TableHead>
                      <TableHead>Miktar</TableHead>
                      <TableHead>Birim Fiyat</TableHead>
                      <TableHead>İskonto %</TableHead>
                      <TableHead>KDV (%20)</TableHead>
                      <TableHead>Toplam</TableHead>
                      <TableHead>Stok</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          <div>
                            <div>{item.product_name}</div>
                            {item.product_code && (
                              <div className="text-xs text-gray-500">{item.product_code}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                            className="w-20"
                          />
                          <span className="text-xs text-gray-500 ml-1">{item.product_unit}</span>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.unit_price}
                            onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                            className="w-24"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            value={item.discount_percentage}
                            onChange={(e) => updateItem(index, 'discount_percentage', parseFloat(e.target.value) || 0)}
                            className="w-20"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{formatCurrency(item.tax_amount)}</div>
                        </TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency(item.total_amount)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <span className={item.min_stock_level !== null && item.stock_quantity < item.min_stock_level ? 'text-red-600 font-semibold' : 'text-gray-600'}>
                              {item.stock_quantity} {item.product_unit}
                            </span>
                            {item.min_stock_level !== null && item.stock_quantity < item.min_stock_level && (
                              <AlertTriangle className="w-4 h-4 text-red-600" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {showProductSelector && (
            <Card className="border-2 border-blue-500">
              <CardHeader>
                <CardTitle>Ürün Seç</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kategori
                    </label>
                    <select
                      value={selectedCategoryId}
                      onChange={(e) => setSelectedCategoryId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    >
                      <option value="">Tüm Kategoriler</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ürün Ara
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        type="text"
                        value={productSearchTerm}
                        onChange={(e) => {
                          setProductSearchTerm(e.target.value);
                        }}
                        placeholder="Ürün adı veya kodu ile ara..."
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                <div className="max-h-96 overflow-y-auto border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <input
                            type="checkbox"
                            checked={filteredProducts.length > 0 && filteredProducts.every(p => selectedProductIds.has(p.id))}
                            onChange={(e) => {
                              if (e.target.checked) {
                                const allIds = new Set(filteredProducts.map(p => p.id));
                                setSelectedProductIds(allIds);
                              } else {
                                filteredProducts.forEach(p => {
                                  const newSelection = new Set(selectedProductIds);
                                  newSelection.delete(p.id);
                                  setSelectedProductIds(newSelection);
                                });
                              }
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </TableHead>
                        <TableHead>Ürün Adı</TableHead>
                        <TableHead>Kod</TableHead>
                        <TableHead>Kategori</TableHead>
                        <TableHead>Birim Fiyat</TableHead>
                        <TableHead>Stok</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProducts.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                            {productSearchTerm || selectedCategoryId ? 'Arama sonucu bulunamadı' : 'Ürün bulunamadı'}
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredProducts.map((product) => {
                          const isLowStock = product.stock_quantity < product.min_stock_level;
                          const isSelected = selectedProductIds.has(product.id);
                          const isAlreadyAdded = items.some(item => item.product_id === product.id);
                          return (
                            <TableRow
                              key={product.id}
                              className={isSelected ? 'bg-blue-50' : ''}
                            >
                              <TableCell>
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleProductSelection(product.id)}
                                  disabled={isAlreadyAdded}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                              </TableCell>
                              <TableCell className="font-medium">
                                {product.name}
                                {isAlreadyAdded && (
                                  <span className="ml-2 text-xs text-green-600">(Ekli)</span>
                                )}
                              </TableCell>
                              <TableCell>{product.code || '-'}</TableCell>
                              <TableCell>{product.category_name || '-'}</TableCell>
                              <TableCell>
                                {product.sale_price ? formatCurrency(product.sale_price) : '-'}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <span className={isLowStock ? 'text-red-600 font-semibold' : 'text-gray-600'}>
                                    {product.stock_quantity} {product.unit}
                                  </span>
                                  {isLowStock && (
                                    <AlertTriangle className="w-4 h-4 text-red-600" />
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex justify-between items-center pt-4 border-t">
                  <div className="text-sm text-gray-600">
                    {selectedProductIds.size > 0 && (
                      <span className="font-semibold text-blue-600">
                        {selectedProductIds.size} ürün seçildi
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      className="bg-gray-500 hover:bg-gray-600 text-white"
                      onClick={() => {
                        setShowProductSelector(false);
                        setSelectedProductIds(new Set());
                        setProductSearchTerm('');
                        setSelectedCategoryId('');
                      }}
                    >
                      İptal
                    </Button>
                    <Button
                      type="button"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={addSelectedProducts}
                      disabled={selectedProductIds.size === 0}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Ekle ({selectedProductIds.size})
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Özet</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-xs text-gray-500 mb-1">KDV oranı %20 olarak hesaplanmaktadır.</div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Ara Toplam:</span>
                  <span className="font-semibold">{formatCurrency(calculateSubtotal())}</span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span className="text-sm">Toplam İndirim:</span>
                  <span className="font-semibold">-{formatCurrency(calculateTotalDiscount())}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Toplam KDV (%20):</span>
                  <span className="font-semibold">{formatCurrency((calculateSubtotal() - calculateTotalDiscount()) * 0.20)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="text-sm font-medium text-gray-700">Genel Toplam:</span>
                  <span className="font-bold text-blue-600 text-lg">
                    {formatCurrency((calculateSubtotal() - calculateTotalDiscount()) * 1.20)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button type="submit" disabled={loading || items.length === 0}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Kaydediliyor...
                </>
              ) : (
                'Kaydet'
              )}
            </Button>
            <Button
              type="button"
              className="bg-gray-500 hover:bg-gray-600 text-white"
              onClick={() => router.back()}
            >
              İptal
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}

export default function NewOfferPage() {
  return (
    <Suspense fallback={<MainLayout><div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div></MainLayout>}>
      <NewOfferContent />
    </Suspense>
  );
}
