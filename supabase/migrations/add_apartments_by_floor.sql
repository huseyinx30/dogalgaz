-- Her katta farklı daire sayısı için apartments_by_floor JSONB ekle
-- Örnek: [2, 3, 2, 3] = 1. kat 2 daire, 2. kat 3 daire, 3. kat 2 daire, 4. kat 3 daire

ALTER TABLE customer_projects
ADD COLUMN IF NOT EXISTS apartments_by_floor JSONB;

COMMENT ON COLUMN customer_projects.apartments_by_floor IS 'Her kat için daire sayısı dizisi. Örn: [2,3,2,3] = 1.kat 2, 2.kat 3 daire...';
