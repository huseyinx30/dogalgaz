# 📊 Test Verileri Kullanım Rehberi

## 🎯 Hızlı Başlangıç

### Adım 1: SQL Dosyasını Açın
1. Supabase Dashboard → **SQL Editor**
2. **New Query** tıklayın
3. `supabase/test_data.sql` dosyasını açın ve içeriğini kopyalayın

### Adım 2: SQL'i Çalıştırın
1. SQL Editor'e yapıştırın
2. **Run** butonuna tıklayın (veya F5)

### Adım 3: Kontrol Edin
Aşağıdaki sorguları çalıştırarak verilerin oluşturulduğunu kontrol edin:

```sql
-- Kategori sayısı
SELECT COUNT(*) as kategori_sayisi FROM product_categories;

-- Ürün sayısı
SELECT COUNT(*) as urun_sayisi FROM products;

-- Müşteri sayısı
SELECT COUNT(*) as musteri_sayisi FROM customers;

-- Tedarikçi sayısı
SELECT COUNT(*) as tedarikci_sayisi FROM suppliers;
```

## 📋 Oluşturulan Test Verileri

### ✅ Ürün Kategorileri (5 adet)
- Kombi
- Doğalgaz Tesisatı
- Kolektör
- Vana ve Armatürler
- Montaj Malzemeleri

### ✅ Ürünler (15 adet)
- 3 Kombi ürünü
- 4 Doğalgaz tesisat ürünü
- 3 Kolektör ürünü
- 3 Vana ve armatür
- 2 Montaj malzemesi

### ✅ Müşteriler (6 adet)
- Yılmaz İnşaat Ltd.
- Demir Ticaret A.Ş.
- Kaya Emlak
- Özkan Yapı
- Çelik İnşaat
- Aydın Ticaret

### ✅ Müşteri Projeleri (5 adet)
- Villa, site, iş merkezi, konut, fabrika projeleri

### ✅ Tedarikçiler (4 adet)
- Kombi Dünyası A.Ş.
- Bor Sanayi Ltd.
- Vana Merkezi
- Montaj Malzemeleri A.Ş.

### ✅ Ekipler (3 adet)
- Montaj Ekibi 1
- Montaj Ekibi 2
- İç Tesisat Ekibi

### ✅ Teklif (1 adet örnek)
- Yılmaz Villa Projesi için teklif

### ✅ Sistem Ayarları (8 adet)
- Şirket bilgileri
- Sistem ayarları

### ✅ Yetkiler (10 adet)
- Çeşitli işlem yetkileri

## ⚠️ ÖNEMLİ NOTLAR

### 1. Admin Kullanıcı Gerekli
Test verileri oluşturmadan önce bir admin kullanıcınızın olması gerekir. Eğer yoksa:

```sql
-- Önce Authentication'da kullanıcı oluşturun
-- Sonra profil kaydı oluşturun (daha önce anlatıldığı gibi)
```

### 2. Ekip Üyeleri (Opsiyonel)
Ekipler için ekip üyesi kullanıcılar oluşturmak isterseniz:

```sql
-- Authentication'da ekip üyesi oluşturun
-- Profil kaydı oluştururken role = 'ekip' yapın
```

Eğer ekip üyesi yoksa, ekipler `leader_id = NULL` ile oluşturulacaktır.

### 3. Kategori ID'leri
Ürünler oluşturulurken kategori ID'leri otomatik olarak bulunur. Eğer hata alırsanız, kategorilerin önce oluşturulduğundan emin olun.

## 🔧 Özelleştirme

### Fiyatları Değiştirme
```sql
UPDATE products 
SET sale_price = 20000.00 
WHERE code = 'KOMB-001';
```

### Stok Miktarını Güncelleme
```sql
UPDATE products 
SET stock_quantity = 100 
WHERE code = 'BOR-001';
```

### Müşteri Ekleme
```sql
INSERT INTO customers (company_name, contact_person, email, phone, address, city, district, created_by)
VALUES (
  'Yeni Şirket',
  'Yeni Kişi',
  'yeni@email.com',
  '0555 999 99 99',
  'Adres',
  'İstanbul',
  'Kadıköy',
  (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)
);
```

## 🗑️ Test Verilerini Silme

Eğer test verilerini silmek isterseniz:

```sql
-- DİKKAT: Bu işlem geri alınamaz!

-- Önce ilişkili verileri silin
DELETE FROM offer_items;
DELETE FROM offers;
DELETE FROM sale_items;
DELETE FROM sales;
DELETE FROM purchase_items;
DELETE FROM purchases;
DELETE FROM customer_projects;
DELETE FROM customers;
DELETE FROM suppliers;
DELETE FROM products;
DELETE FROM product_categories;
DELETE FROM teams;
DELETE FROM role_permissions;
DELETE FROM permissions;
DELETE FROM system_settings;
```

## 📊 Veri Görüntüleme

### Tüm Ürünleri Görüntüleme
```sql
SELECT p.name, p.code, c.name as kategori, p.stock_quantity, p.sale_price
FROM products p
LEFT JOIN product_categories c ON p.category_id = c.id
ORDER BY c.name, p.name;
```

### Müşteri ve Projelerini Görüntüleme
```sql
SELECT 
  c.contact_person as musteri,
  c.company_name as firma,
  cp.project_name as proje,
  cp.project_type as tip
FROM customers c
LEFT JOIN customer_projects cp ON c.id = cp.customer_id
ORDER BY c.contact_person;
```

### Stok Durumu
```sql
SELECT 
  name,
  code,
  stock_quantity,
  min_stock_level,
  CASE 
    WHEN stock_quantity < min_stock_level THEN 'Düşük Stok'
    ELSE 'Normal'
  END as durum
FROM products
ORDER BY stock_quantity ASC;
```

## ✅ Başarı Kontrolü

Tüm veriler başarıyla oluşturulduysa:

```sql
SELECT 
  (SELECT COUNT(*) FROM product_categories) as kategoriler,
  (SELECT COUNT(*) FROM products) as urunler,
  (SELECT COUNT(*) FROM customers) as musteriler,
  (SELECT COUNT(*) FROM suppliers) as tedarikciler,
  (SELECT COUNT(*) FROM teams) as ekipler,
  (SELECT COUNT(*) FROM offers) as teklifler;
```

Bu sorgu size oluşturulan veri sayılarını gösterecektir.

---

**🎉 Artık test verileriniz hazır! Dashboard'da verileri görebilirsiniz!**
