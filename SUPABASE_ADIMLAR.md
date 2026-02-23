# 🎯 Supabase Kurulum - Hızlı Başlangıç

## ADIM 1: API Key'lerini Alın

### 1.1 Supabase Dashboard'a Gidin
- [https://app.supabase.com](https://app.supabase.com)
- Projenizi seçin

### 1.2 Settings > API Bölümüne Gidin
1. Sol menüden **Settings** (⚙️) tıklayın
2. **API** sekmesine tıklayın

### 1.3 Şu İki Değeri Kopyalayın:

#### ✅ Project URL
```
https://xxxxx.supabase.co
```
**Nerede**: Settings > API > Project URL

#### ✅ anon public key
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
**Nerede**: Settings > API > Project API keys > **anon public** (NOT service_role!)

---

## ADIM 2: .env.local Dosyasını Güncelleyin

1. Proje klasörünüzde `.env.local` dosyasını açın
2. Şu değerleri yapıştırın:

```env
NEXT_PUBLIC_SUPABASE_URL=buraya-project-url-yapistirin
NEXT_PUBLIC_SUPABASE_ANON_KEY=buraya-anon-key-yapistirin
```

**Örnek:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYzODk2NzI5MCwiZXhwIjoxOTU0NTQzMjkwfQ.actual-key-here
```

3. Dosyayı kaydedin

---

## ADIM 3: SQL Editor'de Veritabanı Şemasını Oluşturun

### 3.1 SQL Editor'ü Açın
1. Supabase Dashboard'da sol menüden **SQL Editor** tıklayın
2. **New Query** butonuna tıklayın

### 3.2 Şema SQL'ini Çalıştırın

**ÖNEMLİ**: `supabase/schema.sql` dosyasının TAMAMINI kopyalayıp SQL Editor'e yapıştırın ve **Run** butonuna tıklayın.

**Alternatif**: Dosya çok büyükse, aşağıdaki bölümleri sırayla çalıştırabilirsiniz:

#### BÖLÜM 1: Enum Tipleri (Önce bunları çalıştırın)
```sql
-- Kullanıcı Rolleri Enum
CREATE TYPE user_role AS ENUM ('admin', 'personel', 'ekip');

-- İş Durumu Enum
CREATE TYPE job_status AS ENUM (
  'satıldı',
  'iş_yapımına_başlandı',
  'devam_ediyor',
  'gaz_açımına_geçildi',
  'gaz_açımı_yapıldı',
  'tamamlandı'
);

-- İş Adımları Enum
CREATE TYPE job_step AS ENUM (
  'kombi_montajı',
  'iç_gaz_montajı',
  'kolon',
  'kolektör_taşıma',
  'su_taşıma',
  'full_montaj',
  'proje',
  'gaz_açımı'
);

-- Ödeme Şekli Enum
CREATE TYPE payment_method AS ENUM (
  'nakit',
  'kredi_kartı',
  'banka_havalesi',
  'çek',
  'senet',
  'kredi_kartı_taksit'
);

-- Teklif Durumu Enum
CREATE TYPE offer_status AS ENUM ('beklemede', 'onaylandı', 'reddedildi', 'iptal');

-- Sözleşme Durumu Enum
CREATE TYPE contract_status AS ENUM ('taslak', 'imzalandı', 'onaylandı', 'iptal');
```

#### BÖLÜM 2: Tablolar (Enum'lardan sonra)
`supabase/schema.sql` dosyasındaki tüm CREATE TABLE komutlarını çalıştırın.

#### BÖLÜM 3: Trigger'lar (Tablolardan sonra)
`supabase/schema.sql` dosyasındaki tüm CREATE FUNCTION ve CREATE TRIGGER komutlarını çalıştırın.

**💡 TAVSİYE**: Tüm dosyayı tek seferde çalıştırmak daha kolaydır. `supabase/schema.sql` dosyasını açın, tümünü kopyalayın (Ctrl+A, Ctrl+C) ve SQL Editor'e yapıştırın (Ctrl+V), sonra Run'a tıklayın.

---

## ADIM 4: İlk Admin Kullanıcısını Oluşturun

### 4.1 Authentication'da Kullanıcı Oluşturun

1. Sol menüden **Authentication** → **Users** seçin
2. **Add User** butonuna tıklayın
3. Formu doldurun:
   - **Email**: `admin@example.com` (veya istediğiniz)
   - **Password**: Güçlü bir şifre (örn: `Admin123!`)
   - ✅ **Auto Confirm User** işaretleyin (ÖNEMLİ!)
4. **Create User** tıklayın
5. Oluşturulan kullanıcının **UUID**'sini kopyalayın (kullanıcı listesinde görünecek)

### 4.2 SQL Editor'de Profil Kaydı Oluşturun

1. **SQL Editor**'e gidin
2. Aşağıdaki SQL'i çalıştırın (UUID'yi değiştirin):

```sql
-- UUID'yi yukarıdaki adımdan aldığınız UUID ile değiştirin
INSERT INTO profiles (id, email, full_name, role)
VALUES (
  'BURAYA-UUID-YAPIŞTIRIN',  -- Authentication'dan aldığınız UUID
  'admin@example.com',        -- Email adresiniz
  'Admin Kullanıcı',          -- İsim
  'admin'                     -- Rol
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

## ADIM 5: Test Edin

### 5.1 Sunucuyu Yeniden Başlatın
```bash
# Terminal'de Ctrl+C ile durdurun
# Sonra tekrar başlatın:
npm run dev
```

### 5.2 Tarayıcıda Test Edin
1. `http://localhost:3000` adresine gidin
2. Login sayfasında email ve şifrenizi girin
3. Dashboard'a yönlendirilmelisiniz

### 5.3 Veritabanını Kontrol Edin

SQL Editor'de şu sorguları çalıştırın:

```sql
-- Kullanıcıları kontrol et
SELECT id, email, full_name, role FROM profiles;

-- Tabloları kontrol et
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

---

## ✅ Kontrol Listesi

- [ ] API key'leri alındı (Project URL ve anon key)
- [ ] `.env.local` dosyası güncellendi
- [ ] SQL şeması çalıştırıldı (tüm tablolar oluşturuldu)
- [ ] İlk admin kullanıcısı oluşturuldu (Authentication)
- [ ] Profil kaydı eklendi (SQL ile)
- [ ] Sunucu yeniden başlatıldı
- [ ] Login test edildi ve çalışıyor

---

## 🐛 Sorun Giderme

### "Invalid API key" Hatası
- `.env.local` dosyasını kontrol edin
- Değerlerde boşluk veya tırnak olmamalı
- Sunucuyu yeniden başlatın

### "relation does not exist" Hatası
- SQL şemasının tamamını çalıştırdığınızdan emin olun
- Tabloları kontrol edin: `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';`

### Login Çalışmıyor
- Authentication → Providers → Email provider aktif mi?
- Kullanıcı "Auto Confirm" edildi mi?
- Profil kaydı oluşturuldu mu?

---

**🎉 Başarılı! Artık sisteminiz hazır!**
