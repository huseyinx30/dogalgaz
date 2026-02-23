import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function TestPage() {
  return (
    <MainLayout>
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Tailwind CSS Test Sayfası</h1>
          <p className="text-gray-600">Tüm UI bileşenlerinin görsel testi</p>
        </div>

        {/* Renkler */}
        <Card>
          <CardHeader>
            <CardTitle>Renkler</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              <div className="p-4 bg-blue-600 text-white rounded">Blue 600</div>
              <div className="p-4 bg-green-600 text-white rounded">Green 600</div>
              <div className="p-4 bg-red-600 text-white rounded">Red 600</div>
              <div className="p-4 bg-purple-600 text-white rounded">Purple 600</div>
            </div>
          </CardContent>
        </Card>

        {/* Butonlar */}
        <Card>
          <CardHeader>
            <CardTitle>Butonlar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4 flex-wrap">
              <Button>Default Button</Button>
              <Button variant="outline">Outline Button</Button>
              <Button variant="secondary">Secondary Button</Button>
              <Button variant="destructive">Destructive Button</Button>
              <Button variant="ghost">Ghost Button</Button>
              <Button variant="link">Link Button</Button>
            </div>
            <div className="flex gap-4 flex-wrap">
              <Button size="sm">Small</Button>
              <Button size="default">Default</Button>
              <Button size="lg">Large</Button>
            </div>
          </CardContent>
        </Card>

        {/* Inputlar */}
        <Card>
          <CardHeader>
            <CardTitle>Input Alanları</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input placeholder="Normal input" />
            <Input type="email" placeholder="Email input" />
            <Input type="password" placeholder="Password input" />
            <Input disabled placeholder="Disabled input" />
          </CardContent>
        </Card>

        {/* Tablo */}
        <Card>
          <CardHeader>
            <CardTitle>Tablo</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ad</TableHead>
                  <TableHead>Soyad</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Durum</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Ahmet</TableCell>
                  <TableCell>Yılmaz</TableCell>
                  <TableCell>ahmet@example.com</TableCell>
                  <TableCell>
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                      Aktif
                    </span>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Mehmet</TableCell>
                  <TableCell>Demir</TableCell>
                  <TableCell>mehmet@example.com</TableCell>
                  <TableCell>
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                      Beklemede
                    </span>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Ayşe</TableCell>
                  <TableCell>Kaya</TableCell>
                  <TableCell>ayse@example.com</TableCell>
                  <TableCell>
                    <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                      Pasif
                    </span>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Grid Sistemi */}
        <Card>
          <CardHeader>
            <CardTitle>Grid Sistemi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-blue-100 rounded text-center">1</div>
              <div className="p-4 bg-blue-100 rounded text-center">2</div>
              <div className="p-4 bg-blue-100 rounded text-center">3</div>
              <div className="p-4 bg-blue-100 rounded text-center">4</div>
            </div>
          </CardContent>
        </Card>

        {/* Typography */}
        <Card>
          <CardHeader>
            <CardTitle>Typography</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <h1 className="text-4xl font-bold">Heading 1</h1>
            <h2 className="text-3xl font-bold text-gray-900">Heading 2</h2>
            <h3 className="text-2xl font-bold">Heading 3</h3>
            <h4 className="text-xl font-bold">Heading 4</h4>
            <p className="text-base">Normal paragraph text</p>
            <p className="text-sm text-gray-500">Small gray text</p>
            <p className="text-xs text-gray-400">Extra small text</p>
          </CardContent>
        </Card>

        {/* Shadows */}
        <Card>
          <CardHeader>
            <CardTitle>Shadows & Effects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-white rounded shadow-sm">shadow-sm</div>
              <div className="p-4 bg-white rounded shadow">shadow</div>
              <div className="p-4 bg-white rounded shadow-lg">shadow-lg</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

