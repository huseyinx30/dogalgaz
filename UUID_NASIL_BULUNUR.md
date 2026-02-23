# 🔑 UUID Nasıl Bulunur?

## UUID Nedir?
UUID (Universally Unique Identifier), Supabase'de her kullanıcıya otomatik olarak verilen benzersiz bir kimlik numarasıdır. Örnek format: `123e4567-e89b-12d3-a456-426614174000`

## 📋 Adım Adım UUID Bulma

### ADIM 1: Supabase Dashboard'a Gidin
1. [https://app.supabase.com](https://app.supabase.com) adresine gidin
2. Projenizi seçin

### ADIM 2: Authentication Bölümüne Gidin
1. Sol menüden **Authentication** (kilit ikonu 🔒) tıklayın
2. **Users** sekmesine tıklayın

### ADIM 3: Kullanıcıyı Oluşturun (Eğer Oluşturmadıysanız)
1. **Add User** butonuna tıklayın
2. Formu doldurun:
   - **Email**: `admin@example.com` (veya istediğiniz email)
   - **Password**: Güçlü bir şifre girin
   - ✅ **Auto Confirm User** işaretleyin (ÖNEMLİ!)
3. **Create User** butonuna tıklayın

### ADIM 4: UUID'yi Kopyalayın
Kullanıcı listesinde oluşturduğunuz kullanıcıyı göreceksiniz. UUID şu şekillerde görünebilir:

#### Yöntem 1: Kullanıcı Listesinde
- Kullanıcı listesinde **UID** veya **ID** sütununda UUID görünecek
- Örnek: `123e4567-e89b-12d3-a456-426614174000`
- Bu UUID'yi kopyalayın

#### Yöntem 2: Kullanıcı Detayında
1. Kullanıcı listesinde kullanıcıya tıklayın
2. Detay sayfasında **UUID** veya **ID** alanını bulun
3. Kopyalayın

#### Yöntem 3: SQL Editor'den
SQL Editor'de şu sorguyu çalıştırarak UUID'yi bulabilirsiniz:

```sql
SELECT id, email 
FROM auth.users 
WHERE email = 'admin@example.com';
```

Bu sorgu size kullanıcının UUID'sini gösterecektir.

## 📝 Örnek Kullanım

UUID'yi bulduktan sonra, SQL sorgusunda şu şekilde kullanın:

```sql
INSERT INTO profiles (id, email, full_name, role)
VALUES (
  '123e4567-e89b-12d3-a456-426614174000',  -- Buraya UUID'yi yapıştırın
  'admin@example.com',
  'Admin Kullanıcı',
  'admin'
);
```

## ⚠️ ÖNEMLİ NOTLAR

1. **UUID Formatı**: UUID genellikle şu formattadır:
   - `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
   - 8-4-4-4-12 karakter grupları
   - Toplam 36 karakter (tireler dahil)

2. **Tırnak İşareti**: UUID'yi SQL'de tek tırnak içinde yazın:
   - ✅ Doğru: `'123e4567-e89b-12d3-a456-426614174000'`
   - ❌ Yanlış: `123e4567-e89b-12d3-a456-426614174000` (tırnak yok)

3. **Email Eşleşmesi**: SQL'deki email, Authentication'da oluşturduğunuz email ile aynı olmalıdır.

## 🔍 UUID Örnekleri

Gerçek UUID'ler şu şekilde görünür:
- `550e8400-e29b-41d4-a716-446655440000`
- `6ba7b810-9dad-11d1-80b4-00c04fd430c8`
- `123e4567-e89b-12d3-a456-426614174000`

## ✅ Kontrol

SQL'i çalıştırdıktan sonra kontrol etmek için:

```sql
SELECT * FROM profiles WHERE email = 'admin@example.com';
```

Bu sorgu, oluşturduğunuz profil kaydını gösterecektir.
