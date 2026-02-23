# 🚀 Supabase Kurulum Rehberi - Adım Adım

Bu rehber, Supabase projenizi tamamen kurmak için gereken tüm adımları içerir.

## 📋 İçindekiler
1. [API Key'lerini Alma](#1-api-keylerini-alma)
2. [.env.local Dosyasını Güncelleme](#2-envlocal-dosyasini-guncelleme)
3. [Veritabanı Şemasını Oluşturma](#3-veritabani-semasi-olusturma)
4. [İlk Admin Kullanıcısını Oluşturma](#4-ilk-admin-kullanicisini-olusturma)
5. [Test ve Doğrulama](#5-test-ve-dogrulama)

---

## 1. API Key'lerini Alma

### Adım 1: Supabase Dashboard'a Giriş
1. [Supabase Dashboard](https://app.supabase.com) adresine gidin
2. Projenizi seçin

### Adım 2: API Bilgilerini Bulma
1. Sol menüden **Settings** (⚙️) ikonuna tıklayın
2. **API** sekmesine tıklayın
3. Şu bilgileri kopyalayın:

#### Project URL
- **Konum**: Settings > API > Project URL
- **Format**: `https://xxxxx.supabase.co`
- **Örnek**: `https://abcdefghijklmnop.supabase.co`

#### anon public key
- **Konum**: Settings > API > Project API keys > **anon public**
- **Format**: Uzun bir JWT token (eyJhbGci... ile başlar)
- **Örnek**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYzODk2NzI5MCwiZXhwIjoxOTU0NTQzMjkwfQ.example-key-here`

**⚠️ ÖNEMLİ**: `service_role` key'ini ASLA kullanmayın, sadece `anon public` key'ini kullanın!

---

## 2. .env.local Dosyasını Güncelleme

### Adım 1: Dosyayı Açın
Proje kök dizinindeki `.env.local` dosyasını bir metin editöründe açın.

### Adım 2: Değerleri Güncelleyin
Yukarıda kopyaladığınız değerleri şu şekilde güncelleyin:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Örnek:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYzODk2NzI5MCwiZXhwIjoxOTU0NTQzMjkwfQ.actual-key-here
```

### Adım 3: Dosyayı Kaydedin
Değişiklikleri kaydedin.

---

## 3. Veritabanı Şeması Oluşturma

### Adım 1: SQL Editor'ü Açın
1. Supabase Dashboard'da sol menüden **SQL Editor**'ü seçin
2. **New Query** butonuna tıklayın

### Adım 2: Şema SQL'ini Çalıştırın
1. Aşağıdaki SQL komutlarını kopyalayın
2. SQL Editor'e yapıştırın
3. **Run** butonuna tıklayın (veya `Ctrl+Enter` / `F5`)

**⚠️ ÖNEMLİ**: Tüm SQL'i tek seferde çalıştırın. Dosya çok büyükse, bölüm bölüm çalıştırabilirsiniz.

---

## 4. İlk Admin Kullanıcısını Oluşturma

### Adım 1: Authentication'da Kullanıcı Oluşturun
1. Sol menüden **Authentication** → **Users** seçin
2. **Add User** butonuna tıklayın
3. Şu bilgileri girin:
   - **Email**: `admin@example.com` (veya istediğiniz email)
   - **Password**: Güçlü bir şifre girin
   - **Auto Confirm User**: ✅ İşaretleyin (önemli!)
4. **Create User** butonuna tıklayın
5. Oluşturulan kullanıcının **UUID**'sini kopyalayın (kullanıcı listesinde görünecek)

### Adım 2: Profil Kaydı Oluşturun
1. **SQL Editor**'e gidin
2. Aşağıdaki SQL'i çalıştırın (UUID'yi yukarıdaki adımdan alın):

```sql
-- UUID'yi kendi kullanıcı UUID'niz ile değiştirin
INSERT INTO profiles (id, email, full_name, role)
VALUES (
  'kullanici-uuid-buraya',  -- Buraya Authentication'dan aldığınız UUID'yi yapıştırın
  'admin@example.com',      -- Email adresiniz
  'Admin Kullanıcı',        -- İsim
  'admin'                   -- Rol (admin, personel, ekip)
);
```

**Örnek:**
```sql
INSERT INTO profiles (id, email, full_name, role)
VALUES (
  '123e4567-e89b-12d3-a456-426614174000',
  'admin@example.com',
  'Admin Kullanıcı',
  'admin'
);
```

---

## 5. Test ve Doğrulama

### Adım 1: Sunucuyu Yeniden Başlatın
```bash
# Mevcut sunucuyu durdurun (Ctrl+C)
# Sonra tekrar başlatın
npm run dev
```

### Adım 2: Login Sayfasına Gidin
1. Tarayıcıda `http://localhost:3000` adresine gidin
2. Login sayfasına yönlendirileceksiniz

### Adım 3: Giriş Yapın
1. Oluşturduğunuz admin kullanıcısının email ve şifresi ile giriş yapın
2. Dashboard'a yönlendirileceksiniz

### Adım 4: Veritabanını Kontrol Edin
SQL Editor'de şu sorguları çalıştırarak kontrol edin:

```sql
-- Kullanıcıları kontrol et
SELECT * FROM profiles;

-- Müşteri tablosunu kontrol et
SELECT * FROM customers;

-- Ürün tablosunu kontrol et
SELECT * FROM products;
```

---

## 🔧 Sorun Giderme

### "Invalid API key" Hatası
- `.env.local` dosyasındaki değerleri kontrol edin
- Boşluk veya tırnak işareti olmamalı
- Sunucuyu yeniden başlatın

### "relation does not exist" Hatası
- SQL şemasının tamamını çalıştırdığınızdan emin olun
- SQL Editor'de hata mesajlarını kontrol edin
- Tabloların oluşturulduğunu kontrol edin: `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';`

### Login Çalışmıyor
- Authentication → Providers → Email provider'ın aktif olduğundan emin olun
- Kullanıcının "Auto Confirm" olduğundan emin olun
- Profil kaydının oluşturulduğundan emin olun

### Tablolar Görünmüyor
- SQL Editor'de şu sorguyu çalıştırın:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

---

## ✅ Kontrol Listesi

- [ ] Supabase projesi oluşturuldu
- [ ] API key'leri alındı (Project URL ve anon key)
- [ ] `.env.local` dosyası güncellendi
- [ ] SQL şeması çalıştırıldı (tüm tablolar oluşturuldu)
- [ ] İlk admin kullanıcısı oluşturuldu (Authentication)
- [ ] Profil kaydı eklendi (SQL ile)
- [ ] Sunucu yeniden başlatıldı
- [ ] Login sayfası açıldı
- [ ] Giriş yapıldı ve dashboard görüntülendi

---

## 📞 Destek

Sorun yaşarsanız:
1. Supabase Dashboard → Logs bölümünü kontrol edin
2. Browser Console'da hataları kontrol edin
3. SQL Editor'de hata mesajlarını kontrol edin

---

**🎉 Başarılı! Artık sisteminiz tamamen çalışır durumda!**
