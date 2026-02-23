'use client';

import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, Package, Loader2, Eye, Edit, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/utils';

interface Product {
  id: string;
  name: string;
  code: string | null;
  unit: string;
  purchase_price: number | null;
  sale_price: number | null;
  stock_quantity: number;
  min_stock_level: number;
  category_id: string | null;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      console.error('Ürünler yüklenirken hata:', error);
      alert('Ürünler yüklenirken bir hata oluştu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.code && product.code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const isLowStock = (product: Product) => {
    return product.stock_quantity <= product.min_stock_level;
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
            <h1 className="text-3xl font-bold text-gray-900">Ürünler</h1>
            <p className="text-gray-700 mt-2 font-medium">Stok ürünlerini yönetin</p>
          </div>
          <Link href="/inventory/products/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Yeni Ürün
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Ürün Listesi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="search"
                  placeholder="Ürün ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ürün Adı</TableHead>
                  <TableHead>Kod</TableHead>
                  <TableHead>Birim</TableHead>
                  <TableHead>Stok</TableHead>
                  <TableHead>Min. Stok</TableHead>
                  <TableHead>Alış Fiyatı</TableHead>
                  <TableHead>Satış Fiyatı</TableHead>
                  <TableHead>İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                      {searchTerm ? 'Arama sonucu bulunamadı' : 'Henüz ürün eklenmemiş'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => (
                    <TableRow key={product.id} className={isLowStock(product) ? 'bg-red-50' : ''}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {product.name}
                          {isLowStock(product) && (
                            <AlertTriangle className="w-4 h-4 text-red-500" aria-label="Düşük stok" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{product.code || '-'}</TableCell>
                      <TableCell>{product.unit}</TableCell>
                      <TableCell>
                        <span className={isLowStock(product) ? 'text-red-600 font-semibold' : ''}>
                          {product.stock_quantity}
                        </span>
                      </TableCell>
                      <TableCell>{product.min_stock_level}</TableCell>
                      <TableCell>
                        {product.purchase_price ? formatCurrency(product.purchase_price) : '-'}
                      </TableCell>
                      <TableCell>
                        {product.sale_price ? formatCurrency(product.sale_price) : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Link href={`/inventory/products/${product.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4 mr-1" />
                              Detay
                            </Button>
                          </Link>
                          <Link href={`/inventory/products/${product.id}/edit`}>
                            <Button variant="ghost" size="sm">
                              <Edit className="w-4 h-4 mr-1" />
                              Düzenle
                            </Button>
                          </Link>
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
