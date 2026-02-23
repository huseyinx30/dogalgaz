'use client';

import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Loader2, Plus } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { formatDate, formatCurrency } from '@/lib/utils';

interface StockMovement {
  id: string;
  product_id: string;
  product_name: string;
  movement_type: string;
  quantity: number;
  unit_price: number | null;
  notes: string | null;
  created_at: string;
}

export default function StockMovementsPage() {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadMovements();
  }, []);

  const loadMovements = async () => {
    try {
      const { data, error } = await supabase
        .from('stock_movements')
        .select(`
          *,
          products(name)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      const formattedData = (data || []).map((movement: any) => ({
        id: movement.id,
        product_id: movement.product_id,
        product_name: movement.products?.name || 'Bilinmeyen Ürün',
        movement_type: movement.movement_type,
        quantity: movement.quantity,
        unit_price: movement.unit_price,
        notes: movement.notes,
        created_at: movement.created_at,
      }));

      setMovements(formattedData);
    } catch (error: any) {
      console.error('Stok hareketleri yüklenirken hata:', error);
      alert('Stok hareketleri yüklenirken bir hata oluştu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredMovements = movements.filter(movement =>
    movement.product_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getMovementTypeLabel = (type: string) => {
    const types: Record<string, { label: string; color: string }> = {
      'giriş': { label: 'Giriş', color: 'bg-green-100 text-green-800' },
      'çıkış': { label: 'Çıkış', color: 'bg-red-100 text-red-800' },
      'düzeltme': { label: 'Düzeltme', color: 'bg-blue-100 text-blue-800' },
    };
    return types[type] || { label: type, color: 'bg-gray-100 text-gray-800' };
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
            <h1 className="text-3xl font-bold text-gray-900">Stok Hareketleri</h1>
            <p className="text-gray-700 mt-2 font-medium">Stok giriş ve çıkış hareketlerini görüntüleyin</p>
          </div>
          <Link href="/inventory/movements/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Yeni Hareket
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Hareket Listesi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="search"
                  placeholder="Hareket ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tarih</TableHead>
                  <TableHead>Ürün</TableHead>
                  <TableHead>Hareket Tipi</TableHead>
                  <TableHead>Miktar</TableHead>
                  <TableHead>Birim Fiyat</TableHead>
                  <TableHead>Toplam</TableHead>
                  <TableHead>Notlar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMovements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                      {searchTerm ? 'Arama sonucu bulunamadı' : 'Henüz stok hareketi bulunmuyor'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMovements.map((movement) => {
                    const typeInfo = getMovementTypeLabel(movement.movement_type);
                    const total = movement.unit_price ? movement.quantity * movement.unit_price : null;
                    return (
                      <TableRow key={movement.id}>
                        <TableCell>{formatDate(movement.created_at)}</TableCell>
                        <TableCell className="font-medium">{movement.product_name}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-sm ${typeInfo.color}`}>
                            {typeInfo.label}
                          </span>
                        </TableCell>
                        <TableCell>{movement.quantity}</TableCell>
                        <TableCell>
                          {movement.unit_price ? formatCurrency(movement.unit_price) : '-'}
                        </TableCell>
                        <TableCell>
                          {total ? formatCurrency(total) : '-'}
                        </TableCell>
                        <TableCell>{movement.notes || '-'}</TableCell>
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
