'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Loader2, Plus, Trash2, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/utils';

interface Supplier {
  id: string;
  company_name: string;
}

interface Category {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  code: string | null;
  unit: string;
  stock_quantity: number;
  purchase_price: number | null;
  category_id: string | null;
}

interface MovementItem {
  product_id: string;
  product_name: string;
  product_unit: string;
  quantity: number;
  unit_price: number;
  discount_percentage: number;
  discount_amount: number;
  total_amount: number;
}

function NewStockMovementContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = searchParams.get('product');
  const supplierId = searchParams.get('supplier');
  
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<MovementItem[]>([]);
  
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [selectedProductId, setSelectedProductId] = useState(productId || '');
  
  const [formData, setFormData] = useState({
    supplier_id: supplierId || '',
    movement_type: 'giriş' as 'giriş' | 'çıkış' | 'düzeltme',
    invoice_number: '',
    invoice_date: new Date().toISOString().split('T')[0],
    payment_method: 'nakit' as 'nakit' | 'kredi_kartı' | 'banka_havalesi' | 'çek' | 'senet' | 'kredi_kartı_taksit',
    tax_percentage: '18',
    notes: '',
  });

  const [newItem, setNewItem] = useState({
    quantity: '',
    unit_price: '',
    discount_percentage: '0',
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [selectedCategoryId, productSearchTerm, allProducts]);

  useEffect(() => {
    if (selectedProductId && allProducts.length > 0) {
      const product = allProducts.find(p => p.id === selectedProductId);
      if (product && product.purchase_price !== null && product.purchase_price !== undefined) {
        setNewItem(prev => ({
          ...prev,
          unit_price: product.purchase_price!.toString(),
        }));
      }
    }
  }, [selectedProductId, allProducts]);

  const loadInitialData = async () => {
    try {
      // Tedarikçiler
      const { data: suppliersData, error: suppliersError } = await supabase
        .from('suppliers')
        .select('id, company_name')
        .order('company_name', { ascending: true });

      if (!suppliersError) {
        setSuppliers(suppliersData || []);
      }

      // Kategoriler
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('product_categories')
        .select('id, name')
        .order('name', { ascending: true });

      if (!categoriesError) {
        setCategories(categoriesData || []);
      }

      // Ürünler
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, name, code, unit, stock_quantity, purchase_price, category_id')
        .order('name', { ascending: true });

      if (!productsError) {
        setAllProducts(productsData || []);
      }
    } catch (error: any) {
      console.error('Veri yüklenirken hata:', error);
    }
  };

  const filterProducts = () => {
    let filtered = [...allProducts];

    // Kategori filtresi
    if (selectedCategoryId) {
      filtered = filtered.filter(p => p.category_id === selectedCategoryId);
    }

    // Arama filtresi
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
    if (!selectedProductId || !newItem.quantity) {
      alert('Lütfen ürün ve miktar seçin');
      return;
    }

    const product = allProducts.find(p => p.id === selectedProductId);
    if (!product) return;

    const quantity = parseFloat(newItem.quantity);
    const unitPrice = parseFloat(newItem.unit_price) || 0;
    const discountPercent = parseFloat(newItem.discount_percentage) || 0;
    const subtotal = quantity * unitPrice;
    const discountAmount = subtotal * (discountPercent / 100);
    const totalAmount = subtotal - discountAmount;

    const item: MovementItem = {
      product_id: selectedProductId,
      product_name: product.name,
      product_unit: product.unit,
      quantity,
      unit_price: unitPrice,
      discount_percentage: discountPercent,
      discount_amount: discountAmount,
      total_amount: totalAmount,
    };

    setItems([...items, item]);
    
    // Formu sıfırla
    setSelectedProductId('');
    setNewItem({
      quantity: '',
      unit_price: '',
      discount_percentage: '0',
    });
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
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

    if (formData.movement_type === 'giriş' && !formData.supplier_id) {
      alert('Giriş işlemi için tedarikçi seçimi zorunludur');
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      let purchaseId: string | null = null;

      // Eğer tedarikçi seçilmişse ve giriş tipindeyse, satın alma kaydı oluştur
      if (formData.supplier_id && formData.movement_type === 'giriş') {
        const totalAmount = calculateTotal();
        const taxPercent = parseFloat(formData.tax_percentage) || 0;
        const taxAmount = totalAmount * (taxPercent / 100);
        const finalAmount = totalAmount + taxAmount;

        const { data: purchaseData, error: purchaseError } = await supabase
          .from('purchases')
          .insert({
            supplier_id: formData.supplier_id,
            invoice_number: formData.invoice_number || null,
            invoice_date: formData.invoice_date || null,
            total_amount: totalAmount,
            discount_percentage: 0,
            discount_amount: 0,
            tax_amount: taxAmount,
            final_amount: finalAmount,
            payment_method: formData.payment_method,
            payment_status: 'beklemede',
            paid_amount: 0,
            remaining_amount: finalAmount,
            notes: formData.notes || null,
            created_by: user?.id,
          })
          .select()
          .single();

        if (purchaseError) throw purchaseError;
        purchaseId = purchaseData.id;

        // Purchase items ekle
        for (const item of items) {
          const taxPercent = parseFloat(formData.tax_percentage) || 0;
          // KDV, iskonto sonrası tutar üzerinden hesaplanır
          const itemTaxAmount = item.total_amount * (taxPercent / 100);
          const itemFinalAmount = item.total_amount + itemTaxAmount;

          const { error: itemError } = await supabase
            .from('purchase_items')
            .insert({
              purchase_id: purchaseId,
              product_id: item.product_id,
              quantity: item.quantity,
              unit_price: item.unit_price,
              discount_percentage: item.discount_percentage,
              discount_amount: item.discount_amount,
              tax_percentage: taxPercent,
              tax_amount: itemTaxAmount,
              total_amount: itemFinalAmount,
            });

          if (itemError) throw itemError;
        }
      } else {
        // Tedarikçi yoksa veya giriş değilse, sadece stok hareketi oluştur
        for (const item of items) {
          const product = allProducts.find(p => p.id === item.product_id);
          if (!product) continue;

          // Stok hareketi oluştur
          const { error: movementError } = await supabase
            .from('stock_movements')
            .insert({
              product_id: item.product_id,
              movement_type: formData.movement_type,
              quantity: item.quantity,
              unit_price: item.unit_price || null,
              notes: formData.notes || null,
              reference_type: 'adjustment',
              reference_id: null,
              created_by: user?.id,
            });

          if (movementError) throw movementError;

          // Ürün stok miktarını güncelle
          let newStockQuantity = product.stock_quantity;
          
          if (formData.movement_type === 'giriş') {
            newStockQuantity += item.quantity;
          } else if (formData.movement_type === 'çıkış') {
            newStockQuantity -= item.quantity;
            if (newStockQuantity < 0) {
              throw new Error(`${product.name} için stok miktarı negatif olamaz! Mevcut stok: ${product.stock_quantity} ${product.unit}`);
            }
          } else if (formData.movement_type === 'düzeltme') {
            newStockQuantity = item.quantity;
            if (newStockQuantity < 0) {
              throw new Error('Stok miktarı negatif olamaz!');
            }
          }

          const { error: updateError } = await supabase
            .from('products')
            .update({
              stock_quantity: newStockQuantity,
              updated_at: new Date().toISOString(),
            })
            .eq('id', item.product_id);

          if (updateError) throw updateError;
        }
      }

      // Yönlendirme
      if (purchaseId && formData.supplier_id) {
        router.push(`/suppliers/${formData.supplier_id}`);
      } else {
        router.push('/inventory/movements');
      }
    } catch (error: any) {
      alert('Hata: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const selectedProduct = allProducts.find(p => p.id === selectedProductId);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Yeni Stok Hareketi</h1>
            <p className="text-gray-700 mt-2 font-medium">Stok giriş, çıkış veya düzeltme işlemi yapın</p>
          </div>
          <Button
            onClick={() => router.push('/inventory/movements')}
            className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            Geri Dön
          </Button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Ürün Ekle</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Kategori
                      </label>
                      <select
                        value={selectedCategoryId}
                        onChange={(e) => {
                          setSelectedCategoryId(e.target.value);
                          setSelectedProductId('');
                        }}
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
                            setSelectedProductId('');
                          }}
                          placeholder="Ürün adı veya kodu ile ara..."
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ürün <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedProductId}
                      onChange={(e) => setSelectedProductId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    >
                      <option value="">Ürün seçin</option>
                      {filteredProducts.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name} {product.code && `(${product.code})`} - Stok: {product.stock_quantity} {product.unit}
                        </option>
                      ))}
                    </select>
                    {filteredProducts.length === 0 && (selectedCategoryId || productSearchTerm) && (
                      <p className="text-sm text-gray-500 mt-1">Arama sonucu bulunamadı</p>
                    )}
                  </div>

                  {selectedProduct && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-md">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Miktar <span className="text-red-500">*</span>
                          <span className="text-xs text-gray-500 ml-1">({selectedProduct.unit})</span>
                        </label>
                        <Input
                          type="number"
                          step="0.01"
                          value={newItem.quantity}
                          onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                          placeholder="0.00"
                          min="0"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Birim Fiyat
                        </label>
                        <Input
                          type="number"
                          step="0.01"
                          value={newItem.unit_price}
                          onChange={(e) => setNewItem({ ...newItem, unit_price: e.target.value })}
                          placeholder="0.00"
                          min="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          İskonto (%)
                        </label>
                        <Input
                          type="number"
                          step="0.01"
                          value={newItem.discount_percentage}
                          onChange={(e) => setNewItem({ ...newItem, discount_percentage: e.target.value })}
                          placeholder="0"
                          min="0"
                          max="100"
                        />
                      </div>
                      <div className="md:col-span-3">
                        <Button
                          type="button"
                          onClick={addItem}
                          className="w-full bg-green-600 hover:bg-green-700 text-white"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Listeye Ekle
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {items.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Eklenen Ürünler ({items.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ürün</TableHead>
                          <TableHead>Miktar</TableHead>
                          <TableHead>Birim Fiyat</TableHead>
                          <TableHead>İskonto</TableHead>
                          <TableHead>Toplam</TableHead>
                          <TableHead>İşlem</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{item.product_name}</TableCell>
                            <TableCell>{item.quantity} {item.product_unit}</TableCell>
                            <TableCell>{formatCurrency(item.unit_price)}</TableCell>
                            <TableCell>
                              {item.discount_percentage > 0 ? (
                                <span className="text-red-600">
                                  %{item.discount_percentage.toFixed(2)} ({formatCurrency(item.discount_amount)})
                                </span>
                              ) : (
                                '-'
                              )}
                            </TableCell>
                            <TableCell className="font-semibold">{formatCurrency(item.total_amount)}</TableCell>
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
                    <div className="mt-4 pt-4 border-t flex justify-end">
                      <div className="text-right">
                        <div className="text-sm text-gray-500">Toplam Tutar</div>
                        <div className="text-2xl font-bold text-blue-600">
                          {formatCurrency(calculateTotal())}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Hareket Bilgileri</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hareket Tipi <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.movement_type}
                      onChange={(e) => setFormData({ ...formData, movement_type: e.target.value as 'giriş' | 'çıkış' | 'düzeltme' })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    >
                      <option value="giriş">Giriş</option>
                      <option value="çıkış">Çıkış</option>
                      <option value="düzeltme">Düzeltme</option>
                    </select>
                  </div>

                  {formData.movement_type === 'giriş' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tedarikçi <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={formData.supplier_id}
                          onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                        >
                          <option value="">Tedarikçi seçin</option>
                          {suppliers.map((supplier) => (
                            <option key={supplier.id} value={supplier.id}>
                              {supplier.company_name}
                            </option>
                          ))}
                        </select>
                      </div>
                      {formData.supplier_id && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Fatura No
                            </label>
                            <Input
                              value={formData.invoice_number}
                              onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                              placeholder="Fatura numarası"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Fatura Tarihi
                            </label>
                            <Input
                              type="date"
                              value={formData.invoice_date}
                              onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Ödeme Şekli
                            </label>
                            <select
                              value={formData.payment_method}
                              onChange={(e) => setFormData({ ...formData, payment_method: e.target.value as any })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                            >
                              <option value="nakit">Nakit</option>
                              <option value="kredi_kartı">Kredi Kartı</option>
                              <option value="banka_havalesi">Banka Havalesi</option>
                              <option value="çek">Çek</option>
                              <option value="senet">Senet</option>
                              <option value="kredi_kartı_taksit">Kredi Kartı Taksit</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              KDV Oranı (%)
                            </label>
                            <Input
                              type="number"
                              step="0.01"
                              value={formData.tax_percentage}
                              onChange={(e) => setFormData({ ...formData, tax_percentage: e.target.value })}
                              placeholder="18"
                              min="0"
                              max="100"
                            />
                          </div>
                        </>
                      )}
                    </>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notlar
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Hareket notları"
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="pt-4 border-t">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-500">Toplam Ürün:</span>
                      <span className="font-semibold">{items.length}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-500">Ara Toplam:</span>
                      <span className="font-semibold">{formatCurrency(calculateTotal())}</span>
                    </div>
                    {formData.supplier_id && formData.movement_type === 'giriş' && (
                      <>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm text-gray-500">
                            KDV (%{formData.tax_percentage}):
                          </span>
                          <span className="font-semibold">
                            {formatCurrency(calculateTotal() * (parseFloat(formData.tax_percentage) || 0) / 100)}
                          </span>
                        </div>
                        <div className="flex justify-between pt-2 border-t">
                          <span className="text-sm font-medium text-gray-700">Genel Toplam:</span>
                          <span className="font-bold text-blue-600">
                            {formatCurrency(calculateTotal() * (1 + (parseFloat(formData.tax_percentage) || 0) / 100))}
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={loading || items.length === 0}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
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
                    className="bg-gray-500 hover:bg-gray-600 text-white w-full"
                    onClick={() => router.push('/inventory/movements')}
                    disabled={loading}
                  >
                    İptal
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}

export default function NewStockMovementPage() {
  return (
    <Suspense fallback={<MainLayout><div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div></MainLayout>}>
      <NewStockMovementContent />
    </Suspense>
  );
}
