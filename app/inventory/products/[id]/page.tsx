'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Edit, Loader2, Package, AlertTriangle, Plus } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { formatDate, formatCurrency } from '@/lib/utils';

interface Product {
  id: string;
  name: string;
  code: string | null;
  unit: string;
  purchase_price: number | null;
  sale_price: number | null;
  stock_quantity: number;
  min_stock_level: number;
  description: string | null;
  category_id: string | null;
  created_at: string;
  updated_at: string;
}

interface StockMovement {
  id: string;
  movement_type: string;
  quantity: number;
  unit_price: number | null;
  notes: string | null;
  created_at: string;
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;
  
  const [product, setProduct] = useState<Product | null>(null);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (productId) {
      loadProductData();
    }
  }, [productId]);

  const loadProductData = async () => {
    try {
      // Ürün bilgileri
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (productError) throw productError;
      setProduct(productData);

      // Stok hareketleri
      const { data: movementsData, error: movementsError } = await supabase
        .from('stock_movements')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (movementsError) throw movementsError;
      setMovements(movementsData || []);

    } catch (error: any) {
      console.error('Veri yüklenirken hata:', error);
      alert('Veri yüklenirken bir hata oluştu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getMovementTypeLabel = (type: string) => {
    const types: Record<string, { label: string; color: string }> = {
      'giriş': { label: 'Giriş', color: 'bg-green-100 text-green-800' },
      'çıkış': { label: 'Çıkış', color: 'bg-red-100 text-red-800' },
      'düzeltme': { label: 'Düzeltme', color: 'bg-blue-100 text-blue-800' },
    };
    return types[type] || { label: type, color: 'bg-gray-100 text-gray-800' };
  };

  const isLowStock = product ? product.stock_quantity <= product.min_stock_level : false;

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

  if (!product) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">Ürün bulunamadı</p>
          <Button onClick={() => router.push('/inventory/products')}>
            Ürün Listesine Dön
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
            {product.code && (
              <p className="text-gray-600 mt-1">Kod: {product.code}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => router.push('/inventory/products')}
              className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white"
            >
              <ArrowLeft className="w-4 h-4" />
              Geri Dön
            </Button>
            <Link href={`/inventory/products/${productId}/edit`}>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Edit className="w-4 h-4 mr-2" />
                Düzenle
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Ürün Bilgileri</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-500">Birim</div>
                      <div className="font-medium">{product.unit}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Alış Fiyatı</div>
                      <div className="font-medium">
                        {product.purchase_price ? formatCurrency(product.purchase_price) : '-'}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Satış Fiyatı</div>
                      <div className="font-medium">
                        {product.sale_price ? formatCurrency(product.sale_price) : '-'}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Minimum Stok</div>
                      <div className="font-medium">{product.min_stock_level}</div>
                    </div>
                  </div>
                  {product.description && (
                    <div className="pt-2 border-t">
                      <div className="text-sm font-medium mb-1">Açıklama:</div>
                      <div className="text-sm text-gray-600">{product.description}</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex items-center justify-between">
                <CardTitle>Stok Hareketleri ({movements.length})</CardTitle>
                <Link href={`/inventory/movements/new?product=${productId}`}>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Yeni Hareket
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {movements.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p>Henüz stok hareketi yok</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tarih</TableHead>
                        <TableHead>Tip</TableHead>
                        <TableHead>Miktar</TableHead>
                        <TableHead>Birim Fiyat</TableHead>
                        <TableHead>Notlar</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {movements.map((movement) => {
                        const typeInfo = getMovementTypeLabel(movement.movement_type);
                        return (
                          <TableRow key={movement.id}>
                            <TableCell>{formatDate(movement.created_at)}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded-full text-sm ${typeInfo.color}`}>
                                {typeInfo.label}
                              </span>
                            </TableCell>
                            <TableCell>{movement.quantity}</TableCell>
                            <TableCell>
                              {movement.unit_price ? formatCurrency(movement.unit_price) : '-'}
                            </TableCell>
                            <TableCell>{movement.notes || '-'}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Stok Durumu</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Mevcut Stok</div>
                    <div className={`text-3xl font-bold ${isLowStock ? 'text-red-600' : 'text-green-600'}`}>
                      {product.stock_quantity} {product.unit}
                    </div>
                  </div>
                  {isLowStock && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                      <div className="flex items-center gap-2 text-red-800">
                        <AlertTriangle className="w-5 h-5" />
                        <span className="font-medium">Düşük Stok Uyarısı</span>
                      </div>
                      <p className="text-sm text-red-700 mt-1">
                        Stok seviyesi minimum seviyenin altında!
                      </p>
                    </div>
                  )}
                  <div className="pt-2 border-t">
                    <div className="text-sm text-gray-500">Minimum Stok Seviyesi</div>
                    <div className="font-medium">{product.min_stock_level} {product.unit}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Bilgiler</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Oluşturulma:</span>
                    <span className="text-sm">{formatDate(product.created_at)}</span>
                  </div>
                  {product.updated_at !== product.created_at && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Son Güncelleme:</span>
                      <span className="text-sm">{formatDate(product.updated_at)}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
