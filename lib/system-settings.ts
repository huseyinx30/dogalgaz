/**
 * Genel ayarlar için key sabitleri ve varsayılan değerler
 */
export const SETTINGS_KEYS = {
  // Firma Bilgileri
  company_name: 'company_name',
  tax_number: 'tax_number',
  company_phone: 'company_phone',
  company_email: 'company_email',
  company_address: 'company_address',
  // İletişim Ayarları
  sms_api_key: 'sms_api_key',
  whatsapp_api_key: 'whatsapp_api_key',
  smtp_host: 'smtp_host',
  smtp_port: 'smtp_port',
  smtp_user: 'smtp_user',
  smtp_password: 'smtp_password',
} as const;

export type CompanyInfo = {
  company_name: string;
  tax_number: string;
  company_phone: string;
  company_email: string;
  company_address: string;
};

export type ContactSettings = {
  sms_api_key: string;
  whatsapp_api_key: string;
  smtp_host: string;
  smtp_port: string;
  smtp_user: string;
  smtp_password: string;
};

export const DEFAULT_COMPANY_INFO: CompanyInfo = {
  company_name: '',
  tax_number: '',
  company_phone: '',
  company_email: '',
  company_address: '',
};

export const DEFAULT_CONTACT_SETTINGS: ContactSettings = {
  sms_api_key: '',
  whatsapp_api_key: '',
  smtp_host: '',
  smtp_port: '',
  smtp_user: '',
  smtp_password: '',
};
