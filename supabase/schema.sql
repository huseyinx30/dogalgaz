-- Kullanıcı Rolleri Enum
CREATE TYPE user_role AS ENUM ('admin', 'personel', 'ekip');

-- İş Durumu Enum
CREATE TYPE job_status AS ENUM (
  'satıldı',
  'iş_yapımına_başlandı',
  'devam_ediyor',
  'gaz_açımına_geçildi',
  'gaz_açımı_yapıldı',
  'tamamlandı'
);

-- İş Adımları Enum
CREATE TYPE job_step AS ENUM (
  'kombi_montajı',
  'iç_gaz_montajı',
  'kolon',
  'kolektör_taşıma',
  'su_taşıma',
  'full_montaj',
  'proje',
  'gaz_açımı'
);

-- Ödeme Şekli Enum
CREATE TYPE payment_method AS ENUM (
  'nakit',
  'kredi_kartı',
  'banka_havalesi',
  'çek',
  'senet',
  'kredi_kartı_taksit'
);

-- Teklif Durumu Enum
CREATE TYPE offer_status AS ENUM ('beklemede', 'onaylandı', 'reddedildi', 'iptal');

-- Sözleşme Durumu Enum
CREATE TYPE contract_status AS ENUM ('taslak', 'imzalandı', 'onaylandı', 'iptal');

-- Kullanıcılar Tablosu (Supabase Auth ile entegre)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'personel',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Yetkiler Tablosu
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rol Yetkileri Tablosu
CREATE TABLE role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role user_role NOT NULL,
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(role, permission_id)
);

-- Sistem Ayarları
CREATE TABLE system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Müşteriler Tablosu
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT,
  contact_person TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  tax_number TEXT,
  tax_office TEXT,
  address TEXT,
  city TEXT,
  district TEXT,
  postal_code TEXT,
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tedarikçiler Tablosu
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  contact_person TEXT,
  email TEXT,
  phone TEXT NOT NULL,
  tax_number TEXT,
  tax_office TEXT,
  address TEXT,
  city TEXT,
  district TEXT,
  postal_code TEXT,
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ürün Kategorileri
CREATE TABLE product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ürünler Tablosu
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  category_id UUID REFERENCES product_categories(id),
  unit TEXT DEFAULT 'adet',
  purchase_price DECIMAL(10, 2),
  sale_price DECIMAL(10, 2),
  stock_quantity DECIMAL(10, 2) DEFAULT 0,
  min_stock_level DECIMAL(10, 2) DEFAULT 0,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stok Hareketleri
CREATE TABLE stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('giriş', 'çıkış', 'düzeltme')),
  quantity DECIMAL(10, 2) NOT NULL,
  unit_price DECIMAL(10, 2),
  reference_type TEXT, -- 'purchase', 'sale', 'adjustment'
  reference_id UUID,
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tedarikçi Alımları (Satın Alma)
CREATE TABLE purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID REFERENCES suppliers(id) ON DELETE CASCADE,
  invoice_number TEXT,
  invoice_date DATE,
  total_amount DECIMAL(10, 2) NOT NULL,
  discount_percentage DECIMAL(5, 2) DEFAULT 0,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  tax_amount DECIMAL(10, 2) DEFAULT 0,
  final_amount DECIMAL(10, 2) NOT NULL,
  payment_method payment_method,
  payment_status TEXT DEFAULT 'beklemede' CHECK (payment_status IN ('beklemede', 'kısmen_ödendi', 'ödendi')),
  paid_amount DECIMAL(10, 2) DEFAULT 0,
  remaining_amount DECIMAL(10, 2),
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Satın Alma Detayları
CREATE TABLE purchase_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID REFERENCES purchases(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity DECIMAL(10, 2) NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  discount_percentage DECIMAL(5, 2) DEFAULT 0,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  tax_percentage DECIMAL(5, 2) DEFAULT 0,
  tax_amount DECIMAL(10, 2) DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ödemeler (Tedarikçi)
CREATE TABLE supplier_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID REFERENCES purchases(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  payment_method payment_method NOT NULL,
  payment_date DATE NOT NULL,
  reference_number TEXT,
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Müşteri Projeleri
CREATE TABLE customer_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  project_name TEXT NOT NULL,
  project_type TEXT, -- 'ev', 'yapı', 'iş_yeri'
  address TEXT,
  city TEXT,
  district TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Teklifler
CREATE TABLE offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  project_id UUID REFERENCES customer_projects(id) ON DELETE CASCADE,
  offer_number TEXT UNIQUE NOT NULL,
  offer_date DATE NOT NULL,
  valid_until DATE,
  status offer_status DEFAULT 'beklemede',
  total_amount DECIMAL(10, 2) NOT NULL,
  discount_percentage DECIMAL(5, 2) DEFAULT 0,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  tax_amount DECIMAL(10, 2) DEFAULT 0,
  final_amount DECIMAL(10, 2) NOT NULL,
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Teklif Detayları
CREATE TABLE offer_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID REFERENCES offers(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity DECIMAL(10, 2) NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  discount_percentage DECIMAL(5, 2) DEFAULT 0,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  tax_percentage DECIMAL(5, 2) DEFAULT 0,
  tax_amount DECIMAL(10, 2) DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sözleşmeler
CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID REFERENCES offers(id),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  project_id UUID REFERENCES customer_projects(id) ON DELETE CASCADE,
  contract_number TEXT UNIQUE NOT NULL,
  contract_date DATE NOT NULL,
  start_date DATE,
  end_date DATE,
  status contract_status DEFAULT 'taslak',
  customer_signed_at TIMESTAMP WITH TIME ZONE,
  company_signed_at TIMESTAMP WITH TIME ZONE,
  total_amount DECIMAL(10, 2) NOT NULL,
  payment_plan JSONB, -- Ödeme planı
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Satışlar
CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES contracts(id),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  project_id UUID REFERENCES customer_projects(id) ON DELETE CASCADE,
  invoice_number TEXT UNIQUE,
  invoice_date DATE,
  total_amount DECIMAL(10, 2) NOT NULL,
  discount_percentage DECIMAL(5, 2) DEFAULT 0,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  tax_amount DECIMAL(10, 2) DEFAULT 0,
  final_amount DECIMAL(10, 2) NOT NULL,
  payment_method payment_method,
  payment_status TEXT DEFAULT 'beklemede' CHECK (payment_status IN ('beklemede', 'kısmen_ödendi', 'ödendi')),
  paid_amount DECIMAL(10, 2) DEFAULT 0,
  remaining_amount DECIMAL(10, 2),
  status job_status DEFAULT 'satıldı',
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Satış Detayları
CREATE TABLE sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity DECIMAL(10, 2) NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  discount_percentage DECIMAL(5, 2) DEFAULT 0,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  tax_percentage DECIMAL(5, 2) DEFAULT 0,
  tax_amount DECIMAL(10, 2) DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- İş Takibi
CREATE TABLE job_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  project_id UUID REFERENCES customer_projects(id) ON DELETE CASCADE,
  status job_status NOT NULL,
  current_step job_step,
  notes TEXT,
  updated_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ekipler
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  leader_id UUID REFERENCES profiles(id),
  authorized_person TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  district TEXT,
  password TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ekip Üyeleri
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  member_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'üye',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(team_id, member_id)
);

-- İş Atamaları
CREATE TABLE job_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  job_type job_step NOT NULL,
  assigned_date DATE NOT NULL,
  planned_start_date DATE,
  planned_end_date DATE,
  actual_start_date DATE,
  actual_end_date DATE,
  price DECIMAL(10, 2) NOT NULL,
  status TEXT DEFAULT 'atandı' CHECK (status IN ('atandı', 'başlandı', 'tamamlandı', 'iptal')),
  notes TEXT,
  assigned_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ekip Ödemeleri
CREATE TABLE team_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  job_assignment_id UUID REFERENCES job_assignments(id),
  amount DECIMAL(10, 2) NOT NULL,
  payment_method payment_method NOT NULL,
  payment_date DATE NOT NULL,
  reference_number TEXT,
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Müşteri Ödemeleri
CREATE TABLE customer_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  payment_method payment_method NOT NULL,
  payment_date DATE NOT NULL,
  reference_number TEXT,
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bildirimler
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  is_read BOOLEAN DEFAULT false,
  related_type TEXT, -- 'sale', 'contract', 'job' etc.
  related_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- İletişim Logları
CREATE TABLE communication_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  communication_type TEXT NOT NULL CHECK (communication_type IN ('sms', 'email', 'whatsapp', 'phone')),
  message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_by UUID REFERENCES profiles(id),
  status TEXT DEFAULT 'gönderildi'
);

-- İndeksler
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_suppliers_email ON suppliers(email);
CREATE INDEX idx_sales_customer ON sales(customer_id);
CREATE INDEX idx_sales_status ON sales(status);
CREATE INDEX idx_job_tracking_sale ON job_tracking(sale_id);
CREATE INDEX idx_job_assignments_team ON job_assignments(team_id);
CREATE INDEX idx_job_assignments_date ON job_assignments(assigned_date);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);

-- Trigger: Stok güncelleme (satın alma)
CREATE OR REPLACE FUNCTION update_stock_on_purchase()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO stock_movements (product_id, movement_type, quantity, unit_price, reference_type, reference_id, created_by)
  VALUES (NEW.product_id, 'giriş', NEW.quantity, NEW.unit_price, 'purchase', NEW.purchase_id, (SELECT created_by FROM purchases WHERE id = NEW.purchase_id));
  
  UPDATE products 
  SET stock_quantity = stock_quantity + NEW.quantity,
      updated_at = NOW()
  WHERE id = NEW.product_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_stock_on_purchase
AFTER INSERT ON purchase_items
FOR EACH ROW
EXECUTE FUNCTION update_stock_on_purchase();

-- Trigger: Stok düşürme (satış)
CREATE OR REPLACE FUNCTION update_stock_on_sale()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO stock_movements (product_id, movement_type, quantity, unit_price, reference_type, reference_id, created_by)
  VALUES (NEW.product_id, 'çıkış', NEW.quantity, NEW.unit_price, 'sale', NEW.sale_id, (SELECT created_by FROM sales WHERE id = NEW.sale_id));
  
  UPDATE products 
  SET stock_quantity = stock_quantity - NEW.quantity,
      updated_at = NOW()
  WHERE id = NEW.product_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_stock_on_sale
AFTER INSERT ON sale_items
FOR EACH ROW
EXECUTE FUNCTION update_stock_on_sale();

-- Trigger: Satış ödeme güncelleme
CREATE OR REPLACE FUNCTION update_sale_payment()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE sales
  SET paid_amount = COALESCE((SELECT SUM(amount) FROM customer_payments WHERE sale_id = NEW.sale_id), 0),
      remaining_amount = final_amount - COALESCE((SELECT SUM(amount) FROM customer_payments WHERE sale_id = NEW.sale_id), 0),
      payment_status = CASE
        WHEN COALESCE((SELECT SUM(amount) FROM customer_payments WHERE sale_id = NEW.sale_id), 0) = 0 THEN 'beklemede'
        WHEN COALESCE((SELECT SUM(amount) FROM customer_payments WHERE sale_id = NEW.sale_id), 0) >= final_amount THEN 'ödendi'
        ELSE 'kısmen_ödendi'
      END,
      updated_at = NOW()
  WHERE id = NEW.sale_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_sale_payment
AFTER INSERT OR UPDATE OR DELETE ON customer_payments
FOR EACH ROW
EXECUTE FUNCTION update_sale_payment();

-- Trigger: Satın alma ödeme güncelleme
CREATE OR REPLACE FUNCTION update_purchase_payment()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE purchases
  SET paid_amount = COALESCE((SELECT SUM(amount) FROM supplier_payments WHERE purchase_id = NEW.purchase_id), 0),
      remaining_amount = final_amount - COALESCE((SELECT SUM(amount) FROM supplier_payments WHERE purchase_id = NEW.purchase_id), 0),
      payment_status = CASE
        WHEN COALESCE((SELECT SUM(amount) FROM supplier_payments WHERE purchase_id = NEW.purchase_id), 0) = 0 THEN 'beklemede'
        WHEN COALESCE((SELECT SUM(amount) FROM supplier_payments WHERE purchase_id = NEW.purchase_id), 0) >= final_amount THEN 'ödendi'
        ELSE 'kısmen_ödendi'
      END,
      updated_at = NOW()
  WHERE id = NEW.purchase_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_purchase_payment
AFTER INSERT OR UPDATE OR DELETE ON supplier_payments
FOR EACH ROW
EXECUTE FUNCTION update_purchase_payment();
