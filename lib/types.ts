export type UserRole = 'admin' | 'personel' | 'ekip';

export type JobStatus = 
  | 'satıldı'
  | 'iş_yapımına_başlandı'
  | 'devam_ediyor'
  | 'gaz_açımına_geçildi'
  | 'gaz_açımı_yapıldı'
  | 'tamamlandı';

export type JobStep = 
  | 'kombi_montajı'
  | 'iç_gaz_montajı'
  | 'kolon'
  | 'kolektör_taşıma'
  | 'su_taşıma'
  | 'full_montaj'
  | 'proje'
  | 'gaz_açımı';

export type PaymentMethod = 
  | 'nakit'
  | 'kredi_kartı'
  | 'banka_havalesi'
  | 'çek'
  | 'senet'
  | 'kredi_kartı_taksit';

export type OfferStatus = 'beklemede' | 'onaylandı' | 'reddedildi' | 'iptal';

export type ContractStatus = 'taslak' | 'imzalandı' | 'onaylandı' | 'iptal';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  company_name: string | null;
  contact_person: string;
  email: string | null;
  phone: string;
  tax_number: string | null;
  tax_office: string | null;
  address: string | null;
  city: string | null;
  district: string | null;
  postal_code: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Supplier {
  id: string;
  company_name: string;
  contact_person: string | null;
  email: string | null;
  phone: string;
  tax_number: string | null;
  tax_office: string | null;
  address: string | null;
  city: string | null;
  district: string | null;
  postal_code: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  code: string | null;
  category_id: string | null;
  unit: string;
  purchase_price: number | null;
  sale_price: number | null;
  stock_quantity: number;
  min_stock_level: number;
  description: string | null;
  created_at: string;
  updated_at: string;
}
