-- Test Verileri SQL Sorguları
-- Bu dosyayı SQL Editor'de çalıştırarak test verileri oluşturabilirsiniz

-- ============================================
-- 1. ÜRÜN KATEGORİLERİ
-- ============================================
INSERT INTO product_categories (name, description) VALUES
('Kombi', 'Kombi cihazları ve yedek parçaları'),
('Doğalgaz Tesisatı', 'Doğalgaz boru ve bağlantı elemanları'),
('Kolektör', 'Kolektör sistemleri ve ekipmanları'),
('Vana ve Armatürler', 'Vana, armatür ve bağlantı parçaları'),
('Montaj Malzemeleri', 'Montaj için gerekli malzemeler');

-- ============================================
-- 2. ÜRÜNLER
-- ============================================
-- Önce kategori ID'lerini alalım (kategoriler oluşturulduktan sonra)
-- Kategori ID'lerini manuel olarak değiştirmeniz gerekebilir

INSERT INTO products (name, code, category_id, unit, purchase_price, sale_price, stock_quantity, min_stock_level, description) VALUES
-- Kombi Ürünleri
('Vaillant ecoTEC plus VUW 246/5-3', 'KOMB-001', (SELECT id FROM product_categories WHERE name = 'Kombi' LIMIT 1), 'adet', 15000.00, 18000.00, 5, 2, '24 kW Kombi'),
('Bosch Condens 2500 W ZWB 24-1', 'KOMB-002', (SELECT id FROM product_categories WHERE name = 'Kombi' LIMIT 1), 'adet', 12000.00, 15000.00, 8, 3, '24 kW Yoğuşmalı Kombi'),
('Ariston Genus One 24 FF', 'KOMB-003', (SELECT id FROM product_categories WHERE name = 'Kombi' LIMIT 1), 'adet', 10000.00, 13000.00, 6, 2, '24 kW Kombi'),

-- Doğalgaz Tesisatı
('Doğalgaz Borusu 1/2" (20m)', 'BOR-001', (SELECT id FROM product_categories WHERE name = 'Doğalgaz Tesisatı' LIMIT 1), 'metre', 25.00, 35.00, 500, 100, 'Paslanmaz çelik doğalgaz borusu'),
('Doğalgaz Borusu 3/4" (20m)', 'BOR-002', (SELECT id FROM product_categories WHERE name = 'Doğalgaz Tesisatı' LIMIT 1), 'metre', 35.00, 50.00, 400, 80, 'Paslanmaz çelik doğalgaz borusu'),
('Doğalgaz Fitting 1/2"', 'FIT-001', (SELECT id FROM product_categories WHERE name = 'Doğalgaz Tesisatı' LIMIT 1), 'adet', 15.00, 25.00, 200, 50, 'Doğalgaz bağlantı parçası'),
('Doğalgaz Fitting 3/4"', 'FIT-002', (SELECT id FROM product_categories WHERE name = 'Doğalgaz Tesisatı' LIMIT 1), 'adet', 20.00, 30.00, 150, 40, 'Doğalgaz bağlantı parçası'),

-- Kolektör
('Kolektör 6 Yollu', 'KOL-001', (SELECT id FROM product_categories WHERE name = 'Kolektör' LIMIT 1), 'adet', 800.00, 1200.00, 15, 5, '6 yollu kolektör sistemi'),
('Kolektör 8 Yollu', 'KOL-002', (SELECT id FROM product_categories WHERE name = 'Kolektör' LIMIT 1), 'adet', 1000.00, 1500.00, 12, 4, '8 yollu kolektör sistemi'),
('Kolektör Vana Seti', 'KOL-003', (SELECT id FROM product_categories WHERE name = 'Kolektör' LIMIT 1), 'takım', 200.00, 300.00, 30, 10, 'Kolektör vana seti'),

-- Vana ve Armatürler
('Ana Vana 1/2"', 'VAN-001', (SELECT id FROM product_categories WHERE name = 'Vana ve Armatürler' LIMIT 1), 'adet', 150.00, 250.00, 50, 15, 'Ana doğalgaz vanası'),
('Ana Vana 3/4"', 'VAN-002', (SELECT id FROM product_categories WHERE name = 'Vana ve Armatürler' LIMIT 1), 'adet', 200.00, 300.00, 40, 12, 'Ana doğalgaz vanası'),
('Gaz Açma Kapatma Vana', 'VAN-003', (SELECT id FROM product_categories WHERE name = 'Vana ve Armatürler' LIMIT 1), 'adet', 100.00, 180.00, 60, 20, 'Gaz açma kapatma vanası'),

-- Montaj Malzemeleri
('Teflon Bant (50m)', 'TEF-001', (SELECT id FROM product_categories WHERE name = 'Montaj Malzemeleri' LIMIT 1), 'rul', 25.00, 40.00, 100, 30, 'PTFE teflon bant'),
('Kontra Bağlantı Parçası', 'KON-001', (SELECT id FROM product_categories WHERE name = 'Montaj Malzemeleri' LIMIT 1), 'adet', 30.00, 50.00, 200, 50, 'Kontra bağlantı parçası'),
('Kelepçe Seti', 'KEL-001', (SELECT id FROM product_categories WHERE name = 'Montaj Malzemeleri' LIMIT 1), 'takım', 50.00, 80.00, 150, 40, 'Kelepçe seti');

-- ============================================
-- 3. MÜŞTERİLER
-- ============================================
-- NOT: created_by alanı için bir admin kullanıcı ID'si gerekir
-- Eğer admin kullanıcınız yoksa, created_by NULL olarak bırakılabilir
-- Önce bir admin kullanıcınızın olması önerilir

INSERT INTO customers (company_name, contact_person, email, phone, tax_number, tax_office, address, city, district, postal_code, notes, created_by) VALUES
('Yılmaz İnşaat Ltd.', 'Ahmet Yılmaz', 'ahmet@yilmazinsaat.com', '0555 123 45 67', '1234567890', 'Kadıköy', 'Atatürk Cad. No:123', 'İstanbul', 'Kadıköy', '34700', 'Düzenli müşteri', (SELECT id FROM profiles WHERE role = 'admin' ORDER BY created_at LIMIT 1)),
('Demir Ticaret A.Ş.', 'Mehmet Demir', 'mehmet@demirticaret.com', '0555 234 56 78', '2345678901', 'Çankaya', 'Kızılay Mah. İnönü Cad. No:45', 'Ankara', 'Çankaya', '06420', 'Kurumsal müşteri', (SELECT id FROM profiles WHERE role = 'admin' ORDER BY created_at LIMIT 1)),
('Kaya Emlak', 'Ayşe Kaya', 'ayse@kayaemlak.com', '0555 345 67 89', '3456789012', 'Konak', 'Alsancak Mah. Cumhuriyet Bul. No:78', 'İzmir', 'Konak', '35220', 'Yeni müşteri', (SELECT id FROM profiles WHERE role = 'admin' ORDER BY created_at LIMIT 1)),
('Özkan Yapı', 'Ali Özkan', 'ali@ozkanyapi.com', '0555 456 78 90', '4567890123', 'Nilüfer', 'Fethiye Mah. Atatürk Cad. No:12', 'Bursa', 'Nilüfer', '16110', NULL, (SELECT id FROM profiles WHERE role = 'admin' ORDER BY created_at LIMIT 1)),
('Çelik İnşaat', 'Fatma Çelik', 'fatma@celikinsaat.com', '0555 567 89 01', '5678901234', 'Muratpaşa', 'Konyaaltı Mah. Atatürk Bul. No:34', 'Antalya', 'Muratpaşa', '07050', 'VIP müşteri', (SELECT id FROM profiles WHERE role = 'admin' ORDER BY created_at LIMIT 1)),
('Aydın Ticaret', 'Mustafa Aydın', 'mustafa@aydinticaret.com', '0555 678 90 12', NULL, NULL, 'Merkez Mah. Cumhuriyet Cad. No:56', 'Adana', 'Seyhan', '01010', NULL, (SELECT id FROM profiles WHERE role = 'admin' ORDER BY created_at LIMIT 1));

-- ============================================
-- 4. MÜŞTERİ PROJELERİ
-- ============================================
INSERT INTO customer_projects (customer_id, project_name, project_type, address, city, district, description) VALUES
((SELECT id FROM customers WHERE contact_person = 'Ahmet Yılmaz' ORDER BY created_at LIMIT 1), 'Yılmaz Villa Projesi', 'ev', 'Bağdat Cad. No:100', 'İstanbul', 'Kadıköy', '3 katlı villa doğalgaz tesisatı'),
((SELECT id FROM customers WHERE contact_person = 'Ahmet Yılmaz' ORDER BY created_at LIMIT 1), 'Yılmaz Site Projesi', 'yapı', 'Fenerbahçe Mah. No:200', 'İstanbul', 'Kadıköy', 'Site doğalgaz altyapısı'),
((SELECT id FROM customers WHERE contact_person = 'Mehmet Demir' ORDER BY created_at LIMIT 1), 'Demir İş Merkezi', 'iş_yeri', 'Kızılay Mah. İş Merkezi', 'Ankara', 'Çankaya', 'İş merkezi doğalgaz tesisatı'),
((SELECT id FROM customers WHERE contact_person = 'Ayşe Kaya' ORDER BY created_at LIMIT 1), 'Kaya Konut Projesi', 'ev', 'Alsancak Mah. No:50', 'İzmir', 'Konak', 'Daire doğalgaz bağlantısı'),
((SELECT id FROM customers WHERE contact_person = 'Ali Özkan' ORDER BY created_at LIMIT 1), 'Özkan Fabrika', 'iş_yeri', 'Organize Sanayi Bölgesi', 'Bursa', 'Nilüfer', 'Fabrika doğalgaz tesisatı');

-- ============================================
-- 5. TEDARİKÇİLER
-- ============================================
INSERT INTO suppliers (company_name, contact_person, email, phone, tax_number, tax_office, address, city, district, postal_code, notes, created_by) VALUES
('Kombi Dünyası A.Ş.', 'Hasan Yıldız', 'hasan@kombidunyasi.com', '0212 555 11 22', '1111111111', 'Şişli', 'Büyükdere Cad. No:100', 'İstanbul', 'Şişli', '34394', 'Ana kombi tedarikçisi', (SELECT id FROM profiles WHERE role = 'admin' ORDER BY created_at LIMIT 1)),
('Bor Sanayi Ltd.', 'Zeynep Aktaş', 'zeynep@borsanayi.com', '0216 555 22 33', '2222222222', 'Ümraniye', 'Sanayi Cad. No:200', 'İstanbul', 'Ümraniye', '34775', 'Boru ve fitting tedarikçisi', (SELECT id FROM profiles WHERE role = 'admin' ORDER BY created_at LIMIT 1)),
('Vana Merkezi', 'Osman Kılıç', 'osman@vanamerkezi.com', '0312 555 33 44', '3333333333', 'Yenimahalle', 'Sanayi Sitesi No:300', 'Ankara', 'Yenimahalle', '06370', 'Vana ve armatür tedarikçisi', (SELECT id FROM profiles WHERE role = 'admin' ORDER BY created_at LIMIT 1)),
('Montaj Malzemeleri A.Ş.', 'Elif Şahin', 'elif@montajmalzemeleri.com', '0232 555 44 55', '4444444444', 'Bornova', 'Sanayi Bölgesi No:400', 'İzmir', 'Bornova', '35040', 'Montaj malzemeleri tedarikçisi', (SELECT id FROM profiles WHERE role = 'admin' ORDER BY created_at LIMIT 1));

-- ============================================
-- 6. EKİPLER
-- ============================================
-- NOT: Eğer ekip üyesi kullanıcılarınız yoksa, leader_id NULL olarak bırakılabilir
-- Ekip üyesi kullanıcılar oluşturmak için:
-- 1. Authentication'da kullanıcı oluşturun
-- 2. Profil kaydı oluştururken role = 'ekip' yapın

-- Ekip üyesi yoksa, NULL ile oluşturun:
INSERT INTO teams (name, leader_id, is_active) VALUES
('Montaj Ekibi 1', NULL, true),
('Montaj Ekibi 2', NULL, true),
('İç Tesisat Ekibi', NULL, true);

-- Eğer ekip üyesi kullanıcılarınız varsa, şu şekilde kullanabilirsiniz:
-- INSERT INTO teams (name, leader_id, is_active) VALUES
-- ('Montaj Ekibi 1', (SELECT id FROM profiles WHERE role = 'ekip' ORDER BY created_at LIMIT 1 OFFSET 0), true),
-- ('Montaj Ekibi 2', (SELECT id FROM profiles WHERE role = 'ekip' ORDER BY created_at LIMIT 1 OFFSET 1), true),
-- ('İç Tesisat Ekibi', (SELECT id FROM profiles WHERE role = 'ekip' ORDER BY created_at LIMIT 1 OFFSET 2), true);

-- ============================================
-- 7. TEKLİFLER (Örnek)
-- ============================================
INSERT INTO offers (customer_id, project_id, offer_number, offer_date, valid_until, status, total_amount, discount_percentage, discount_amount, tax_amount, final_amount, notes, created_by) VALUES
((SELECT id FROM customers WHERE contact_person = 'Ahmet Yılmaz' ORDER BY created_at LIMIT 1), 
 (SELECT id FROM customer_projects WHERE project_name = 'Yılmaz Villa Projesi' ORDER BY created_at LIMIT 1),
 'TEK-2024-001', 
 CURRENT_DATE, 
 CURRENT_DATE + INTERVAL '30 days',
 'beklemede',
 50000.00,
 5.00,
 2500.00,
 8550.00,
 56050.00,
 'Villa projesi için teklif',
 (SELECT id FROM profiles WHERE role = 'admin' ORDER BY created_at LIMIT 1));

-- ============================================
-- 8. SİSTEM AYARLARI
-- ============================================
INSERT INTO system_settings (key, value, description) VALUES
('company_name', '"Doğalgaz CRM"', 'Şirket adı'),
('company_phone', '"0555 000 00 00"', 'Şirket telefonu'),
('company_email', '"info@dogalgazcrm.com"', 'Şirket email adresi'),
('company_address', '"İstanbul, Türkiye"', 'Şirket adresi'),
('tax_rate', '18', 'KDV oranı (%)'),
('currency', '"TRY"', 'Para birimi'),
('sms_enabled', 'false', 'SMS servisi aktif mi?'),
('whatsapp_enabled', 'false', 'WhatsApp servisi aktif mi?');

-- ============================================
-- 9. YETKİLER (Örnek)
-- ============================================
INSERT INTO permissions (name, description) VALUES
('customer_create', 'Müşteri oluşturma yetkisi'),
('customer_edit', 'Müşteri düzenleme yetkisi'),
('customer_delete', 'Müşteri silme yetkisi'),
('sale_create', 'Satış oluşturma yetkisi'),
('sale_edit', 'Satış düzenleme yetkisi'),
('purchase_create', 'Satın alma oluşturma yetkisi'),
('inventory_manage', 'Stok yönetimi yetkisi'),
('team_manage', 'Ekip yönetimi yetkisi'),
('offer_create', 'Teklif oluşturma yetkisi'),
('contract_create', 'Sözleşme oluşturma yetkisi');

-- ============================================
-- 10. ROL YETKİLERİ (Örnek)
-- ============================================
-- Admin tüm yetkilere sahip
INSERT INTO role_permissions (role, permission_id)
SELECT 'admin', id FROM permissions;

-- Personel bazı yetkilere sahip
INSERT INTO role_permissions (role, permission_id)
SELECT 'personel', id FROM permissions 
WHERE name IN ('customer_create', 'customer_edit', 'sale_create', 'offer_create');

-- ============================================
-- KONTROL SORGULARI
-- ============================================
-- Verilerin doğru oluşturulduğunu kontrol etmek için:

-- SELECT COUNT(*) as kategori_sayisi FROM product_categories;
-- SELECT COUNT(*) as urun_sayisi FROM products;
-- SELECT COUNT(*) as musteri_sayisi FROM customers;
-- SELECT COUNT(*) as tedarikci_sayisi FROM suppliers;
-- SELECT COUNT(*) as ekip_sayisi FROM teams;
-- SELECT COUNT(*) as teklif_sayisi FROM offers;
