# 🔐 Supabase Auth Ayarları - "User not allowed" Hatası Çözümü

## ❌ Hata: "User not allowed"

Bu hata, Supabase Authentication ayarlarından kaynaklanabilir.

## ✅ Çözüm Adımları

### 1️⃣ Supabase Dashboard'a Gidin

1. [Supabase Dashboard](https://app.supabase.com) → Projenizi seçin
2. Sol menüden **Authentication** (🔒) tıklayın
3. **Settings** sekmesine gidin

### 2️⃣ Email Signup Ayarlarını Kontrol Edin

**Authentication > Settings > Email Auth** bölümünde:

- ✅ **Enable email signup** seçeneğinin **AÇIK** olduğundan emin olun
- ✅ **Confirm email** seçeneğini kontrol edin (Service Role Key kullanıyorsanız bu önemli değil)

### 3️⃣ Service Role Key Kontrolü

Service Role Key'in doğru olduğundan emin olun:

1. **Settings** → **API**
2. **service_role** key'ini kontrol edin
3. `.env.local` dosyasında doğru key'in olduğundan emin olun
4. Server'ı yeniden başlatın

### 4️⃣ Auth Policies Kontrolü

Eğer RLS (Row Level Security) kullanıyorsanız:

1. **Authentication** → **Policies**
2. `auth.users` tablosu için politikaları kontrol edin
3. Admin kullanıcı oluşturma için gerekli izinlerin olduğundan emin olun

### 5️⃣ Email Domain Restrictions

Eğer email domain kısıtlamaları varsa:

1. **Authentication** → **Settings** → **Email Auth**
2. **Email domain allowlist** veya **Email domain blocklist** ayarlarını kontrol edin
3. Kullanmak istediğiniz email domain'inin engellenmediğinden emin olun

## 🔧 Alternatif Çözümler

### Çözüm 1: Email Signup'ı Etkinleştir

Supabase Dashboard'da:
1. **Authentication** → **Settings**
2. **Enable email signup** seçeneğini **AÇIK** yapın
3. Değişiklikleri kaydedin

### Çözüm 2: Service Role Key'i Yeniden Kontrol Et

1. `.env.local` dosyasını açın
2. `SUPABASE_SERVICE_ROLE_KEY` değerini kontrol edin
3. Key'in tam ve doğru olduğundan emin olun
4. Server'ı yeniden başlatın: `Ctrl + C` sonra `npm run dev`

### Çözüm 3: Supabase Auth Admin API Test

API route'unuzda kullanıcı oluşturma işlemini test edin:

```typescript
// Test için
const { data, error } = await supabaseAdmin.auth.admin.createUser({
  email: 'test@example.com',
  password: 'test123456',
  email_confirm: true,
});
```

## 🐛 Yaygın Sorunlar

### Sorun 1: Email Signup Kapalı
**Çözüm:** Authentication > Settings > Enable email signup'ı açın

### Sorun 2: Service Role Key Yanlış
**Çözüm:** Key'i Supabase Dashboard'dan yeniden kopyalayın ve `.env.local`'e ekleyin

### Sorun 3: Email Domain Engellenmiş
**Çözüm:** Authentication > Settings > Email domain ayarlarını kontrol edin

### Sorun 4: RLS Policies
**Çözüm:** `auth.users` tablosu için gerekli politikaları ekleyin

## 📋 Kontrol Listesi

- [ ] Email signup etkin mi?
- [ ] Service Role Key doğru mu?
- [ ] `.env.local` dosyası güncel mi?
- [ ] Server yeniden başlatıldı mı?
- [ ] Email domain kısıtlaması var mı?
- [ ] RLS policies doğru mu?

## 🎯 Hızlı Test

1. Supabase Dashboard > Authentication > Settings
2. "Enable email signup" seçeneğini kontrol edin
3. Açık değilse açın
4. Uygulamayı tekrar deneyin

---

**💡 İpucu:** Service Role Key kullanıyorsanız, email signup ayarı genellikle önemli değildir. Ancak bazı durumlarda bu ayarın açık olması gerekebilir.
