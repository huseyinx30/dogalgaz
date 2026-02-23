# 🔧 "User not allowed" Hatası - Çözüm Rehberi

## ❌ Hata: "Kullanıcı oluşturma izni yok"

Bu hata, Supabase Authentication ayarlarından veya Service Role Key yapılandırmasından kaynaklanabilir.

## ✅ Hızlı Çözüm

### Çözüm 1: Supabase Dashboard'da Email Signup'ı Etkinleştir

1. [Supabase Dashboard](https://app.supabase.com) → Projenizi seçin
2. Sol menüden **Authentication** (🔒) tıklayın
3. **Settings** sekmesine gidin
4. **Email Auth** bölümünde:
   - ✅ **"Enable email signup"** seçeneğini **AÇIK** yapın
   - Değişiklikleri kaydedin

### Çözüm 2: Service Role Key'i Kontrol Et

1. **Settings** → **API**
2. **service_role** key'ini kontrol edin
3. `.env.local` dosyasında key'in doğru olduğundan emin olun:
   ```env
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGci... (gerçek key)
   ```
4. Server'ı yeniden başlatın: `Ctrl + C` sonra `npm run dev`

### Çözüm 3: Supabase Auth Policies Kontrolü

Eğer hala çalışmıyorsa:

1. **Authentication** → **Policies**
2. `auth.users` tablosu için politikaları kontrol edin
3. Gerekirse admin kullanıcı oluşturma için policy ekleyin

## 🔍 Detaylı Kontrol

### Adım 1: Supabase Dashboard Kontrolü

1. **Authentication** → **Settings** → **Email Auth**
2. Şu ayarları kontrol edin:
   - ✅ Enable email signup: **AÇIK**
   - ✅ Confirm email: İstediğiniz gibi (Service Role Key kullanıyorsanız önemli değil)

### Adım 2: Service Role Key Test

Terminal'de test edin:
```bash
# .env.local dosyasında key var mı kontrol et
# Windows PowerShell
$env:SUPABASE_SERVICE_ROLE_KEY.Length
```

Eğer bir sayı görüyorsanız (200+), key yüklenmiş demektir.

### Adım 3: API Route Test

`http://localhost:3000/api/users/test-key` adresini açın ve key durumunu kontrol edin.

## 🐛 Alternatif Çözümler

### Çözüm A: Email Domain Kısıtlaması

Eğer email domain kısıtlaması varsa:

1. **Authentication** → **Settings** → **Email Auth**
2. **Email domain allowlist** veya **blocklist** ayarlarını kontrol edin
3. Kullanmak istediğiniz email domain'inin engellenmediğinden emin olun

### Çözüm B: RLS Policies

Eğer Row Level Security (RLS) kullanıyorsanız:

1. **Authentication** → **Policies**
2. `auth.users` tablosu için gerekli politikaları ekleyin
3. Admin kullanıcı oluşturma için izin verin

### Çözüm C: Service Role Key Yenileme

Eğer key çalışmıyorsa:

1. Supabase Dashboard → **Settings** → **API**
2. **service_role** key'ini yeniden kopyalayın
3. `.env.local` dosyasına yapıştırın
4. Server'ı yeniden başlatın

## 📋 Kontrol Listesi

- [ ] Email signup etkin mi? (Authentication > Settings)
- [ ] Service Role Key doğru mu? (.env.local)
- [ ] Key uzunluğu 200+ karakter mi?
- [ ] Server yeniden başlatıldı mı?
- [ ] Email domain kısıtlaması var mı?
- [ ] RLS policies doğru mu?

## 🎯 En Yaygın Çözüm

**%90 durumda çözüm:**

1. Supabase Dashboard → **Authentication** → **Settings**
2. **"Enable email signup"** seçeneğini **AÇIK** yapın
3. Sayfayı yenileyin
4. Uygulamada tekrar deneyin

## 💡 Notlar

- Service Role Key kullanıyorsanız, email signup ayarı genellikle önemli değildir
- Ancak bazı Supabase sürümlerinde bu ayarın açık olması gerekebilir
- Key'in doğru olduğundan ve server'ın yeniden başlatıldığından emin olun

---

**🔧 Hala çalışmıyorsa:** Supabase Dashboard'da Authentication > Settings > Email Auth bölümündeki tüm ayarları kontrol edin ve gerekirse Supabase desteği ile iletişime geçin.
