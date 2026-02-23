# Doğalgaz CRM Sistemi

Doğalgaz tesisatı ve sistemleri için kapsamlı bir SaaS CRM sistemi.

## Özellikler

### Kullanıcı Yönetimi
- **Roller**: Admin, Personel, Ekip
- **Yetki Sistemi**: Admin tarafından yönetilebilir yetkiler
- **Kullanıcı Ayarları**: Profil yönetimi ve şifre değiştirme

### Müşteri Yönetimi
- Müşteri bilgileri (adres, iletişim, vergi bilgileri)
- Müşteri projeleri (ev, yapı, iş yeri)
- İş takip sistemi (satıldı, başlandı, devam ediyor, tamamlandı)
- Satış yönetimi ve stok entegrasyonu

### Tedarikçi Yönetimi
- Tedarikçi bilgileri
- Satın alma işlemleri
- Fatura ve ödeme takibi
- Borç bakiye yönetimi

### Stok ve Ön Muhasebe
- Ürün yönetimi ve kategoriler
- Stok takibi (giriş/çıkış)
- Satın alma yönetimi
- Satış yönetimi
- Ödeme takibi (müşteri ve tedarikçi)
- Fatura yönetimi

### Teklif ve Sözleşme
- Müşteri teklifleri
- Teklif onay süreci
- Sözleşme oluşturma
- Çift taraflı imza sistemi
- Sözleşme yazdırma

### İş Takibi
- İş durumu takibi
- İş adımları (kombi montajı, iç gaz, kolon, vb.)
- Proje bazlı takip

### Ekip Yönetimi
- Ekip oluşturma ve yönetimi
- İş atama sistemi
- Ekip ödeme takibi
- Ekip kendi paneli (işler ve ödemeler)

### Dashboard
- İstatistikler (müşteri, satış, stok, ekip)
- Yaklaşan işler
- Takvim görünümü
- Bildirimler

### İletişim
- Toplu SMS gönderme
- WhatsApp mesajı gönderme
- Email gönderme
- İletişim logları

## Teknolojiler

- **Next.js 14** - React framework
- **TypeScript** - Tip güvenliği
- **Tailwind CSS** - Styling
- **Supabase** - Backend (PostgreSQL, Auth, Storage)
- **React Hook Form** - Form yönetimi
- **Zod** - Validasyon

## Kurulum

1. Projeyi klonlayın:
```bash
git clone <repo-url>
cd DogalgazCRM
```

2. Bağımlılıkları yükleyin:
```bash
npm install
```

3. Supabase projesi oluşturun ve `.env.local` dosyasını oluşturun:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Supabase veritabanı şemasını çalıştırın:
- Supabase dashboard'a gidin
- SQL Editor'ü açın
- `supabase/schema.sql` dosyasındaki SQL'i çalıştırın

5. Geliştirme sunucusunu başlatın:
```bash
npm run dev
```

6. Tarayıcıda `http://localhost:3000` adresine gidin

## Veritabanı Şeması

Sistem aşağıdaki ana tabloları içerir:

- `profiles` - Kullanıcı profilleri
- `customers` - Müşteriler
- `suppliers` - Tedarikçiler
- `products` - Ürünler
- `purchases` - Satın almalar
- `sales` - Satışlar
- `offers` - Teklifler
- `contracts` - Sözleşmeler
- `job_tracking` - İş takibi
- `teams` - Ekipler
- `job_assignments` - İş atamaları
- `stock_movements` - Stok hareketleri
- `notifications` - Bildirimler

Detaylı şema için `supabase/schema.sql` dosyasına bakın.

## Kullanım

### İlk Kullanıcı Oluşturma

1. Supabase Auth ile ilk admin kullanıcısını oluşturun
2. `profiles` tablosuna kullanıcı kaydını ekleyin (role: 'admin')

### Roller ve Yetkiler

- **Admin**: Tüm yetkilere sahip
- **Personel**: Admin tarafından belirlenen yetkilere sahip
- **Ekip**: Sadece kendi işlerini ve ödemelerini görebilir

## Geliştirme

Proje yapısı:

```
├── app/                 # Next.js app router sayfaları
├── components/          # React bileşenleri
│   ├── ui/             # UI bileşenleri
│   └── layout/         # Layout bileşenleri
├── lib/                # Utility fonksiyonları
│   ├── supabase/       # Supabase client'ları
│   ├── types.ts        # TypeScript tipleri
│   └── utils.ts        # Yardımcı fonksiyonlar
├── supabase/           # Supabase şemaları
└── public/             # Statik dosyalar
```

## Lisans

Bu proje özel bir projedir.
