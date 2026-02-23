# 🔍 Service Role Key Test ve Kontrol

## ✅ Email Signup Açık - Şimdi Ne Yapmalı?

Email signup ayarı açık ama hala "User not allowed" hatası alıyorsanız, sorun Service Role Key'de olabilir.

## 🔧 Kontrol Adımları

### 1️⃣ Service Role Key'i Kontrol Edin

`.env.local` dosyanızı açın ve şunu kontrol edin:

```env
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci... (gerçek key)
```

**Kontrol:**
- ❌ `your_service_role_key_here` yazıyor mu? → YANLIŞ
- ❌ Key çok kısa mı? (50 karakterden az) → YANLIŞ
- ✅ Key 200+ karakter uzunluğunda mı? → DOĞRU
- ✅ Key `eyJhbGci...` ile başlıyor mu? → DOĞRU

### 2️⃣ Server'ı Yeniden Başlatın

Service Role Key'i ekledikten veya değiştirdikten sonra:

1. Terminal'de `Ctrl + C` ile server'ı durdurun
2. `npm run dev` ile tekrar başlatın
3. Birkaç saniye bekleyin

### 3️⃣ Key'i Test Edin

Tarayıcıda şu URL'yi açın:
```
http://localhost:3000/api/users/test-key
```

Bu sayfa size şunları gösterecek:
- ✅ Key var mı?
- ✅ Key uzunluğu
- ✅ Key formatı
- ✅ Key çalışıyor mu?

## 🐛 Yaygın Sorunlar

### Sorun 1: Key Eksik veya Yanlış
**Çözüm:**
1. Supabase Dashboard → Settings → API
2. `service_role` key'ini kopyalayın
3. `.env.local` dosyasına yapıştırın
4. Server'ı yeniden başlatın

### Sorun 2: Server Yeniden Başlatılmamış
**Çözüm:**
1. Terminal'de `Ctrl + C`
2. `npm run dev`
3. Tekrar deneyin

### Sorun 3: Key Formatı Yanlış
**Çözüm:**
- Key'in başında/sonunda boşluk olmamalı
- Tırnak işareti kullanmayın
- Key'in tamamını kopyalayın

## 📋 Hızlı Kontrol

Terminal'de şu komutu çalıştırın:

```powershell
# Key uzunluğunu kontrol et
$env:SUPABASE_SERVICE_ROLE_KEY.Length
```

Eğer bir sayı görüyorsanız (200+), key yüklenmiş demektir.

## 🎯 Sonraki Adımlar

1. ✅ Email signup açık (tamamlandı)
2. ⏳ Service Role Key'i kontrol edin
3. ⏳ Server'ı yeniden başlatın
4. ⏳ Tekrar deneyin

---

**💡 İpucu:** Eğer hala çalışmıyorsa, `http://localhost:3000/api/users/test-key` adresini açıp key durumunu kontrol edin.
