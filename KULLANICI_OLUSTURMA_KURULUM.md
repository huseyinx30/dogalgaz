# 👥 Kullanıcı Oluşturma - Kurulum Rehberi

## ✅ Yapılan İşlemler

1. ✅ Kullanıcılar listesi sayfası oluşturuldu (`/settings/users`)
2. ✅ Kullanıcı düzenleme sayfası oluşturuldu (`/settings/users/[id]/edit`)
3. ✅ Yeni kullanıcı ekleme sayfası oluşturuldu (`/settings/users/new`)
4. ✅ API route oluşturuldu (`/api/users/create`)

## 🔑 Service Role Key Kurulumu

Kullanıcı oluşturma özelliğinin çalışması için Supabase **Service Role Key** gereklidir.

### Adım 1: Service Role Key'i Bulun

1. [Supabase Dashboard](https://app.supabase.com) adresine gidin
2. Projenizi seçin: **DogalgazCRM**
3. Sol menüden **Settings** (⚙️) → **API** bölümüne gidin
4. **Project API keys** bölümünde **service_role** key'ini bulun
5. **Reveal** butonuna tıklayarak key'i görün
6. Key'i kopyalayın (⚠️ **ÇOK ÖNEMLİ**: Bu key'i asla paylaşmayın!)

### Adım 2: .env.local Dosyasına Ekleyin

`.env.local` dosyanızı açın ve şu satırı ekleyin:

```env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**Örnek:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://xwbmokmfajyoxbtbgooi.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Adım 3: Server'ı Yeniden Başlatın

Service role key'i ekledikten sonra:

1. Development server'ı durdurun (`Ctrl + C`)
2. Server'ı tekrar başlatın: `npm run dev`

## 🎯 Kullanım

### Kullanıcılar Listesi
- **URL**: `/settings/users`
- Mevcut tüm kullanıcıları listeler
- Arama özelliği ile kullanıcı arayabilirsiniz
- Her kullanıcı için "Düzenle" butonu ile düzenleme yapabilirsiniz

### Yeni Kullanıcı Ekleme
- **URL**: `/settings/users/new`
- Yeni kullanıcı eklemek için form
- E-posta, şifre, ad soyad, telefon, rol ve aktif/pasif durumu belirleyebilirsiniz

### Kullanıcı Düzenleme
- **URL**: `/settings/users/[id]/edit`
- Mevcut kullanıcı bilgilerini düzenleyebilirsiniz
- E-posta adresi değiştirilemez (güvenlik nedeniyle)
- Rol ve aktif/pasif durumu değiştirilebilir

## 🔐 Güvenlik Notları

⚠️ **ÖNEMLİ GÜVENLİK UYARILARI:**

1. **Service Role Key'i Asla Paylaşmayın**
   - Bu key tüm veritabanına tam erişim sağlar
   - GitHub'a commit etmeyin
   - `.env.local` dosyası zaten `.gitignore`'da olmalı

2. **Production'da Dikkatli Olun**
   - Service role key'i sadece server-side kullanın
   - Client-side'da asla kullanmayın
   - API route'ları güvenli tutun

3. **Kullanıcı Oluşturma İzinleri**
   - Sadece admin kullanıcılar yeni kullanıcı oluşturabilir
   - API route'una erişim kontrolü ekleyebilirsiniz

## 🐛 Sorun Giderme

### "Service Role Key bulunamadı" Hatası
- `.env.local` dosyasında `SUPABASE_SERVICE_ROLE_KEY` tanımlı mı kontrol edin
- Server'ı yeniden başlattınız mı?
- Key doğru kopyalandı mı?

### "Kullanıcı oluşturulamadı" Hatası
- E-posta adresi daha önce kullanılmış olabilir
- Şifre en az 6 karakter olmalıdır
- Supabase Dashboard'da Auth ayarlarını kontrol edin

### "Profil oluşturulamadı" Hatası
- Veritabanı bağlantısını kontrol edin
- `profiles` tablosunun doğru yapılandırıldığından emin olun

## 📋 Özellikler

### Kullanıcı Listesi
- ✅ Tüm kullanıcıları listeleme
- ✅ Arama özelliği (e-posta, ad, telefon, rol)
- ✅ Rol renk kodlaması (Admin: Kırmızı, Personel: Mavi, Ekip: Yeşil)
- ✅ Durum göstergesi (Aktif/Pasif)
- ✅ Oluşturulma tarihi
- ✅ Düzenleme butonu

### Kullanıcı Düzenleme
- ✅ Ad soyad güncelleme
- ✅ Telefon güncelleme
- ✅ Rol değiştirme
- ✅ Aktif/Pasif durumu değiştirme
- ✅ E-posta değiştirilemez (güvenlik)

### Yeni Kullanıcı Ekleme
- ✅ E-posta ve şifre ile kullanıcı oluşturma
- ✅ Şifre doğrulama
- ✅ Ad soyad, telefon ekleme
- ✅ Rol seçimi
- ✅ Aktif/Pasif durumu belirleme
- ✅ Otomatik profil oluşturma

---

**🎉 Kurulum tamamlandıktan sonra kullanıcı yönetimi özelliklerini kullanabilirsiniz!**
