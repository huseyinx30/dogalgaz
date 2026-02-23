# 📍 Email Signup Ayarını Bulma - Adım Adım

## 🎯 Doğru Yol

Supabase Dashboard'da şu adımları izleyin:

### Adım 1: Authentication Sayfasına Gidin
1. Sol sidebar'da **"Authentication"** bölümünde olduğunuzdan emin olun
2. Zaten oradasınız! ✅

### Adım 2: Configuration Bölümüne Gidin
Sol sidebar'da **"CONFIGURATION"** bölümünü bulun ve şu seçeneğe tıklayın:

**"Sign In / Providers"** ← Buraya tıklayın!

### Adım 3: Email Provider Ayarlarını Bulun
"Sign In / Providers" sayfasında:

1. **"Email"** provider'ını bulun
2. Email provider'ının yanında bir toggle/switch olacak
3. Bu toggle'ı **AÇIK** yapın (yeşil olmalı)
4. Ayrıca **"Enable email signup"** veya **"Allow new users to sign up"** gibi bir seçenek olabilir
5. Bu seçeneği de **AÇIK** yapın

## 🔍 Alternatif Yerler

Eğer "Sign In / Providers" sayfasında bulamazsanız:

### Seçenek 1: URL Configuration
1. Sol sidebar'da **"URL Configuration"** seçeneğine tıklayın
2. Orada email signup ayarları olabilir

### Seçenek 2: Policies
1. Sol sidebar'da **"Policies"** seçeneğine tıklayın
2. `auth.users` tablosu için politikaları kontrol edin

## 📸 Görsel Rehber

Sol sidebar'da şu sırayı izleyin:

```
Authentication
├── MANAGE
│   ├── Users ← Şu an buradasınız
│   └── OAuth Apps
├── NOTIFICATIONS
│   └── Email
└── CONFIGURATION
    ├── Policies
    ├── Sign In / Providers ← BURAYA TIKLAYIN!
    ├── OAuth Server
    ├── Sessions
    └── ...
```

## ✅ Kontrol Listesi

"Sign In / Providers" sayfasında şunları kontrol edin:

- [ ] Email provider aktif mi? (Toggle AÇIK olmalı)
- [ ] "Enable email signup" seçeneği var mı?
- [ ] "Allow new users to sign up" seçeneği var mı?
- [ ] Herhangi bir kısıtlama var mı?

## 🎯 Hızlı Yol

1. Sol sidebar'da **"CONFIGURATION"** bölümünü bulun
2. **"Sign In / Providers"** seçeneğine tıklayın
3. **"Email"** provider'ını bulun
4. Toggle'ı **AÇIK** yapın
5. Sayfayı kaydedin/yenileyin

---

**💡 İpucu:** Eğer hala bulamıyorsanız, "Sign In / Providers" sayfasında arama kutusunu kullanarak "email" veya "signup" kelimelerini arayın.
