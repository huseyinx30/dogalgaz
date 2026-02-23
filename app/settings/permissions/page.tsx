import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function PermissionsPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Yetki Ayarları</h1>
          <p className="text-gray-700 mt-2 font-medium">Rol ve yetki ayarlarını yönetin</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Rol Yetkileri</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Yetki</TableHead>
                  <TableHead>Admin</TableHead>
                  <TableHead>Personel</TableHead>
                  <TableHead>Ekip</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Müşteri Ekleme</TableCell>
                  <TableCell>
                    <input type="checkbox" defaultChecked className="w-4 h-4" />
                  </TableCell>
                  <TableCell>
                    <input type="checkbox" className="w-4 h-4" />
                  </TableCell>
                  <TableCell>
                    <input type="checkbox" disabled className="w-4 h-4" />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Satış Yapma</TableCell>
                  <TableCell>
                    <input type="checkbox" defaultChecked className="w-4 h-4" />
                  </TableCell>
                  <TableCell>
                    <input type="checkbox" defaultChecked className="w-4 h-4" />
                  </TableCell>
                  <TableCell>
                    <input type="checkbox" disabled className="w-4 h-4" />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Stok Yönetimi</TableCell>
                  <TableCell>
                    <input type="checkbox" defaultChecked className="w-4 h-4" />
                  </TableCell>
                  <TableCell>
                    <input type="checkbox" className="w-4 h-4" />
                  </TableCell>
                  <TableCell>
                    <input type="checkbox" disabled className="w-4 h-4" />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Ekip Yönetimi</TableCell>
                  <TableCell>
                    <input type="checkbox" defaultChecked className="w-4 h-4" />
                  </TableCell>
                  <TableCell>
                    <input type="checkbox" disabled className="w-4 h-4" />
                  </TableCell>
                  <TableCell>
                    <input type="checkbox" disabled className="w-4 h-4" />
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

