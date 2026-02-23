-- Proje tipine göre customer_projects tablosuna yeni alanlar ekle
-- Ev tipi için: kat sayısı, katta daire sayısı, dükkan sayısı
-- İş yeri tipi için: kullanılacak cihaz sayısı

ALTER TABLE customer_projects
ADD COLUMN IF NOT EXISTS floor_count INTEGER,
ADD COLUMN IF NOT EXISTS apartments_per_floor INTEGER,
ADD COLUMN IF NOT EXISTS shop_count INTEGER,
ADD COLUMN IF NOT EXISTS device_count INTEGER;

-- Kolonlara açıklayıcı yorum ekle (opsiyonel)
COMMENT ON COLUMN customer_projects.floor_count IS 'Ev tipi projeler için kat sayısı';
COMMENT ON COLUMN customer_projects.apartments_per_floor IS 'Ev tipi projeler için katta daire sayısı';
COMMENT ON COLUMN customer_projects.shop_count IS 'Ev tipi projeler için dükkan sayısı';
COMMENT ON COLUMN customer_projects.device_count IS 'İş yeri tipi projeler için kullanılacak cihaz sayısı';
