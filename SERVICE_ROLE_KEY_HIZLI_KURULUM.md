# 🔑 Service Role Key - Hızlı Kurulum

## ⚠️ Hata: "This endpoint requires a valid Bearer token"

Bu hata, Service Role Key'in `.env.local` dosyasına eklenmediği veya yanlış eklendiği anlamına gelir.

## 📋 Adım Adım Çözüm

### 1️⃣ Service Role Key'i Bulun

1. [Supabase Dashboard](https://app.supabase.com) → Projenizi seçin
2. Sol menüden **Settings** (⚙️) → **API**
3. **Project API keys** bölümünde **service_role** key'ini bulun
4. **Reveal** butonuna tıklayın
5. Key'i kopyalayın (uzun bir metin olacak, JWT token gibi)

### 2️⃣ .env.local Dosyasını Açın

Proje kök dizininde `.env.local` dosyasını açın.

### 3️⃣ Service Role Key'i Ekleyin

`.env.local` dosyanıza şu satırı ekleyin:

```env
SUPABASE_SERVICE_ROLE_KEY=buraya_kopyaladiginiz_key_yapistirin
```

**ÖNEMLİ:**
- `your_service_role_key_here` yazısını **SİLİN**
- Gerçek key'i **YAPIŞTIRIN**
- Tırnak işareti kullanmayın
- Boşluk bırakmayın

### 4️⃣ Örnek .env.local Dosyası

```env
NEXT_PUBLIC_SUPABASE_URL=https://xwbmokmfajyoxbtbgooi.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3Ym1va21mYWp5b3hidGJnb29pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDc0NzY3NzIsImV4cCI6MjAyMzA1Mjc3Mn0...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3Ym1va21mYWp5b3hidGJnb29pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwNzQ3Njc3MiwiZXhwIjoyMDIzMDUyNzcyfQ...
```

### 5️⃣ Server'ı Yeniden Başlatın

1. Terminal'de `Ctrl + C` ile server'ı durdurun
2. `npm run dev` ile tekrar başlatın

## ✅ Kontrol

Key'i doğru eklediyseniz:
- ✅ Hata mesajı kaybolacak
- ✅ Kullanıcı oluşturma çalışacak
- ✅ Şifre değiştirme çalışacak

## 🔍 Key Formatı

Service Role Key genellikle şu şekilde başlar:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Çok uzun bir metindir (200+ karakter).

## ⚠️ Yaygın Hatalar

❌ **YANLIŞ:**
```env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

✅ **DOĞRU:**
```env
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3Ym1va21mYWp5b3hidGJnb29pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwNzQ3Njc3MiwiZXhwIjoyMDIzMDUyNzcyfQ...
```

---

**🎯 Key'i ekledikten sonra server'ı yeniden başlatmayı unutmayın!**
