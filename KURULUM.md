# Doğalgaz CRM - Kurulum Rehberi

Bu dokümantasyon, Doğalgaz CRM sisteminin kurulumu ve yapılandırması için detaylı adımları içermektedir.

## Gereksinimler

- Node.js 18.x veya üzeri
- npm veya yarn
- Supabase hesabı (ücretsiz plan yeterli)

## 1. Proje Kurulumu

### Adım 1: Bağımlılıkları Yükleyin

```bash
npm install
```

### Adım 2: Ortam Değişkenlerini Ayarlayın

`.env.local` dosyası oluşturun (proje kök dizininde):

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Not:** Bu değerleri Supabase Dashboard → Settings → API bölümünden alabilirsiniz.

## 2. Supabase Kurulumu

### Adım 1: Supabase Projesi Oluşturun

1. [Supabase](https://supabase.com) sitesine gidin
2. Yeni bir proje oluşturun
3. Proje URL'sini ve Anon Key'i kopyalayın

### Adım 2: Veritabanı Şemasını Oluşturun

1. Supabase Dashboard'a gidin
2. Sol menüden **SQL Editor**'ü seçin
3. **New Query** butonuna tıklayın
4. `supabase/schema.sql` dosyasının içeriğini kopyalayıp yapıştırın
5. **Run** butonuna tıklayın

**Önemli:** Şema başarıyla çalıştırıldıktan sonra tüm tablolar oluşturulmuş olacaktır.

### Adım 3: Row Level Security (RLS) Politikaları (Opsiyonel)

Güvenlik için RLS politikaları ekleyebilirsiniz. Örnek:

```sql
-- Profiles tablosu için RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
```

## 3. İlk Kullanıcı Oluşturma

### Adım 1: Supabase Auth ile Kullanıcı Oluşturun

1. Supabase Dashboard → **Authentication** → **Users**
2. **Add User** butonuna tıklayın
3. Email ve şifre girin
4. Kullanıcıyı oluşturun

### Adım 2: Profil Kaydı Oluşturun

SQL Editor'de şu sorguyu çalıştırın (user_id'yi oluşturduğunuz kullanıcının ID'si ile değiştirin):

```sql
INSERT INTO profiles (id, email, full_name, role)
VALUES (
  'user-id-here',
  'admin@example.com',
  'Admin Kullanıcı',
  'admin'
);
```

**Not:** User ID'yi Authentication → Users sayfasından kopyalayabilirsiniz.

## 4. Geliştirme Sunucusunu Başlatma

```bash
npm run dev
```

Tarayıcıda `http://localhost:3000` adresine gidin.

## 5. Production Build

### Build Oluşturma

```bash
npm run build
```

### Production Sunucusunu Başlatma

```bash
npm start
```

## 6. Özellik Yapılandırmaları

### SMS Entegrasyonu

SMS göndermek için bir SMS servis sağlayıcısı (ör: Twilio, Netgsm) API anahtarı gereklidir.

1. Ayarlar → Genel Ayarlar sayfasına gidin
2. SMS API Key alanını doldurun

### WhatsApp Entegrasyonu

WhatsApp Business API veya bir WhatsApp servis sağlayıcısı gereklidir.

1. Ayarlar → Genel Ayarlar sayfasına gidin
2. WhatsApp API Key alanını doldurun

### Email Yapılandırması

SMTP ayarları için:

1. Ayarlar → Genel Ayarlar sayfasına gidin
2. SMTP Host, Port, Kullanıcı Adı ve Şifre bilgilerini girin

## 7. Sorun Giderme

### Veritabanı Bağlantı Hatası

- `.env.local` dosyasının doğru yapılandırıldığından emin olun
- Supabase projenizin aktif olduğunu kontrol edin
- API anahtarlarının doğru olduğunu doğrulayın

### Authentication Hatası

- Supabase Auth ayarlarını kontrol edin
- Email/Password provider'ın aktif olduğundan emin olun
- Redirect URL'lerin doğru yapılandırıldığını kontrol edin

### Stok Güncelleme Sorunları

- Trigger'ların doğru çalıştığını kontrol edin:
```sql
SELECT * FROM stock_movements ORDER BY created_at DESC LIMIT 10;
```

## 8. Veritabanı Yedekleme

Supabase Dashboard → Settings → Database → Backups bölümünden otomatik yedeklemeleri yapılandırabilirsiniz.

## 9. Güvenlik Notları

- Production ortamında `.env.local` dosyasını asla commit etmeyin
- RLS politikalarını mutlaka etkinleştirin
- API anahtarlarını güvenli tutun
- Düzenli olarak güvenlik güncellemelerini kontrol edin: `npm audit`

## 10. Destek

Sorun yaşarsanız:
1. README.md dosyasını kontrol edin
2. Supabase dokümantasyonunu inceleyin
3. Next.js dokümantasyonunu kontrol edin

## Sık Kullanılan SQL Sorguları

### Tüm Müşterileri Listeleme
```sql
SELECT * FROM customers ORDER BY created_at DESC;
```

### Stok Durumunu Kontrol Etme
```sql
SELECT p.name, p.stock_quantity, p.min_stock_level
FROM products p
WHERE p.stock_quantity < p.min_stock_level;
```

### Satış İstatistikleri
```sql
SELECT 
  DATE_TRUNC('month', created_at) as month,
  COUNT(*) as sale_count,
  SUM(final_amount) as total_revenue
FROM sales
GROUP BY month
ORDER BY month DESC;
```
