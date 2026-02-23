# 🚀 Hızlı Başlangıç Rehberi

Bu rehber, projeyi hızlıca çalıştırmanız için gerekli adımları içerir.

## ⚡ Hızlı Kurulum (5 Dakika)

### 1. Bağımlılıklar Yüklendi ✅
```bash
npm install
```
Bu adım zaten tamamlandı!

### 2. Supabase Kurulumu

#### Adım 1: Supabase Projesi Oluşturun
1. [supabase.com](https://supabase.com) adresine gidin
2. "Start your project" butonuna tıklayın
3. GitHub ile giriş yapın (veya email ile kayıt olun)
4. "New Project" butonuna tıklayın
5. Proje adı ve şifre girin
6. Projeyi oluşturun (2-3 dakika sürebilir)

#### Adım 2: API Bilgilerini Alın
1. Supabase Dashboard'da projenize gidin
2. Sol menüden **Settings** → **API** seçin
3. Şu bilgileri kopyalayın:
   - **Project URL** (örn: `https://xxxxx.supabase.co`)
   - **anon public** key (uzun bir string)

#### Adım 3: .env.local Dosyası Oluşturun
Proje kök dizininde `.env.local` dosyası oluşturun:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Önemli:** `.env.local` dosyası `.gitignore` içinde, bu yüzden git'e commit edilmeyecek.

#### Adım 4: Veritabanı Şemasını Oluşturun
1. Supabase Dashboard'da **SQL Editor**'ü açın
2. **New Query** butonuna tıklayın
3. `supabase/schema.sql` dosyasını açın ve içeriğini kopyalayın
4. SQL Editor'e yapıştırın
5. **Run** butonuna tıklayın (veya F5)
6. Başarılı mesajını bekleyin

#### Adım 5: İlk Admin Kullanıcısını Oluşturun

**Yöntem 1: Supabase Dashboard'dan**
1. **Authentication** → **Users** → **Add User**
2. Email ve şifre girin
3. "Auto Confirm User" seçeneğini işaretleyin
4. Kullanıcıyı oluşturun
5. Oluşturulan kullanıcının **UUID**'sini kopyalayın

**Yöntem 2: SQL ile Profil Oluşturma**
SQL Editor'de şu sorguyu çalıştırın (UUID'yi yukarıdaki adımdan alın):

```sql
INSERT INTO profiles (id, email, full_name, role)
VALUES (
  'kullanici-uuid-buraya',
  'admin@example.com',
  'Admin Kullanıcı',
  'admin'
);
```

### 3. Geliştirme Sunucusunu Başlatın

```bash
npm run dev
```

Tarayıcıda şu adrese gidin:
```
http://localhost:3000
```

### 4. Giriş Yapın

1. Oluşturduğunuz admin kullanıcısının email ve şifresi ile giriş yapın
2. Dashboard ekranına yönlendirileceksiniz

## ✅ Kurulum Kontrol Listesi

- [ ] Supabase projesi oluşturuldu
- [ ] `.env.local` dosyası oluşturuldu ve dolduruldu
- [ ] `supabase/schema.sql` çalıştırıldı
- [ ] İlk admin kullanıcısı oluşturuldu
- [ ] Profil kaydı eklendi (role: 'admin')
- [ ] `npm run dev` çalıştırıldı
- [ ] Login sayfası açıldı
- [ ] Giriş yapıldı ve dashboard görüntülendi

## 🐛 Sorun Giderme

### "Invalid API key" Hatası
- `.env.local` dosyasındaki değerleri kontrol edin
- Supabase Dashboard'dan API key'leri tekrar kopyalayın
- Sunucuyu yeniden başlatın (`Ctrl+C` sonra `npm run dev`)

### "relation does not exist" Hatası
- `supabase/schema.sql` dosyasının tamamını çalıştırdığınızdan emin olun
- SQL Editor'de hata mesajlarını kontrol edin

### Login Çalışmıyor
- Supabase Dashboard → Authentication → Providers
- Email provider'ın aktif olduğundan emin olun
- Kullanıcının "Auto Confirm" olduğundan emin olun

### Veritabanı Bağlantı Hatası
- Supabase projenizin aktif olduğunu kontrol edin
- Internet bağlantınızı kontrol edin
- Supabase Dashboard'da proje durumunu kontrol edin

## 📚 Sonraki Adımlar

1. **Müşteri Ekleme**: Dashboard'dan "Yeni Müşteri" butonuna tıklayın
2. **Ürün Ekleme**: Stok Yönetimi → Ürünler → Yeni Ürün
3. **Teklif Oluşturma**: Teklifler → Yeni Teklif
4. **Ekip Oluşturma**: Ekipler → Yeni Ekip

## 🎉 Başarılı!

Artık sisteminiz kullanıma hazır! Tüm özellikleri keşfetmek için menüyü kullanabilirsiniz.
