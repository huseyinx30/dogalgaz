# 🔧 Service Role Key Hatası - Çözüm

## ❌ Hata: "This endpoint requires a valid Bearer token"

Bu hata, Service Role Key'in eksik veya yanlış olduğunu gösterir.

## ✅ Çözüm Adımları

### 1️⃣ Service Role Key'i Kontrol Edin

Tarayıcıda şu URL'yi açın:
```
http://localhost:3000/api/users/test-key
```

Bu sayfa size şunları gösterecek:
- ✅ Key var mı?
- ✅ Key uzunluğu (200+ karakter olmalı)
- ✅ Key formatı doğru mu?
- ✅ Key çalışıyor mu?

### 2️⃣ Service Role Key'i Bulun

1. [Supabase Dashboard](https://app.supabase.com) → Projenizi seçin
2. **Settings** (⚙️) → **API**
3. **Project API keys** bölümünde **service_role** key'ini bulun
4. **Reveal** butonuna tıklayın
5. Key'i **TAMAMINI** kopyalayın (çok uzun bir metin)

### 3️⃣ .env.local Dosyasını Düzenleyin

`.env.local` dosyanızı açın ve şu satırı ekleyin veya güncelleyin:

```env
SUPABASE_SERVICE_ROLE_KEY=buraya_kopyaladiginiz_key_yapistirin
```

**ÖNEMLİ:**
- `your_service_role_key_here` yazısını **SİLİN**
- Gerçek key'i **YAPIŞTIRIN**
- Tırnak işareti **KULLANMAYIN**
- Boşluk **BIRAKMAYIN**
- Key'in başında/sonunda boşluk olmamalı

### 4️⃣ Örnek .env.local

```env
NEXT_PUBLIC_SUPABASE_URL=https://xwbmokmfajyoxbtbgooi.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3Ym1va21mYWp5b3hidGJnb29pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwNzQ3Njc3MiwiZXhwIjoyMDIzMDUyNzcyfQ.çok_uzun_bir_key_buraya_gelir...
```

### 5️⃣ Server'ı Yeniden Başlatın

1. Terminal'de `Ctrl + C` ile server'ı durdurun
2. `npm run dev` ile tekrar başlatın
3. Birkaç saniye bekleyin

### 6️⃣ Tekrar Test Edin

1. `http://localhost:3000/api/users/test-key` adresini açın
2. "isValid: true" görüyorsanız başarılı!
3. Kullanıcı oluşturmayı tekrar deneyin

## 🔍 Key Formatı

Service Role Key:
- ✅ `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` ile başlar
- ✅ 200+ karakter uzunluğundadır
- ✅ JWT token formatındadır
- ✅ İçinde nokta (.) karakterleri vardır

## ⚠️ Yaygın Hatalar

### 🚨 En sık neden: anon key kullanmak!

**"User not allowed"** hatası alıyorsanız genellikle `anon` (public) key'i `service_role` yerine koymuşsunuzdur.

- **anon key**: Dashboard'da "anon public" olarak görünür, **KULLANMAYIN** (kullanıcı oluşturma için)
- **service_role key**: "service_role" olarak görünür, **Reveal** ile gösterilir — **BUNU kullanın**

Supabase Dashboard > Settings > API > Project API keys:
- `anon` (public) → NEXT_PUBLIC_SUPABASE_ANON_KEY için
- `service_role` (secret) → SUPABASE_SERVICE_ROLE_KEY için

---

❌ **YANLIŞ:**
```env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
SUPABASE_SERVICE_ROLE_KEY=eyJ...anon_key... (anon key yapıştırmak!)
SUPABASE_SERVICE_ROLE_KEY="eyJhbGci..."
SUPABASE_SERVICE_ROLE_KEY= eyJhbGci... (başında boşluk)
```

✅ **DOĞRU:**
```env
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3Ym1va21mYWp5b3hidGJnb29pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwNzQ3Njc3MiwiZXhwIjoyMDIzMDUyNzcyfQ...
```

## 🎯 Hızlı Kontrol

Terminal'de şu komutu çalıştırarak key'in yüklenip yüklenmediğini kontrol edebilirsiniz:

```bash
# Windows PowerShell
$env:SUPABASE_SERVICE_ROLE_KEY.Length
```

Eğer bir sayı görüyorsanız (200+), key yüklenmiş demektir.

---

**💡 İpucu:** Key'i ekledikten sonra MUTLAKA server'ı yeniden başlatın!
