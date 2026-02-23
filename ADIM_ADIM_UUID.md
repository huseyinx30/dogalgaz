# 🎯 UUID Bulma - Görsel Rehber

## Senaryo: İlk Admin Kullanıcısını Oluşturuyorsunuz

### 1️⃣ Kullanıcı Oluşturma

**Supabase Dashboard → Authentication → Users → Add User**

Form:
```
Email: admin@example.com
Password: [güçlü şifre]
☑ Auto Confirm User
```

**Create User** butonuna tıklayın.

### 2️⃣ UUID'yi Bulma

Kullanıcı oluşturulduktan sonra, kullanıcı listesinde şöyle görünecek:

```
┌─────────────────────────────────────────────────────┬─────────────────────┐
│ UID (UUID)                                         │ Email               │
├─────────────────────────────────────────────────────┼─────────────────────┤
│ 123e4567-e89b-12d3-a456-426614174000              │ admin@example.com   │
└─────────────────────────────────────────────────────┴─────────────────────┘
```

**Bu UUID'yi kopyalayın!**

### 3️⃣ SQL'de Kullanma

Kopyaladığınız UUID'yi şu SQL sorgusunda kullanın:

```sql
INSERT INTO profiles (id, email, full_name, role)
VALUES (
  '123e4567-e89b-12d3-a456-426614174000',  -- ← BURAYA UUID'Yİ YAPIŞTIRIN
  'admin@example.com',                      -- ← Email aynı olmalı
  'Admin Kullanıcı',
  'admin'
);
```

## 🔍 Alternatif: SQL ile UUID Bulma

Eğer UUID'yi listede bulamazsanız, SQL Editor'de şu sorguyu çalıştırın:

```sql
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'admin@example.com';
```

Bu sorgu size UUID'yi gösterecektir.

## ✅ Doğrulama

SQL'i çalıştırdıktan sonra kontrol edin:

```sql
SELECT id, email, full_name, role 
FROM profiles;
```

Artık admin kullanıcınız hazır! 🎉
