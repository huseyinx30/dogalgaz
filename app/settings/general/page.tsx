'use client';

import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase/client';
import {
  DEFAULT_COMPANY_INFO,
  DEFAULT_CONTACT_SETTINGS,
  type CompanyInfo,
  type ContactSettings,
} from '@/lib/system-settings';
import { useAuth } from '@/components/providers/auth-provider';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2, Save, Building2, Mail } from 'lucide-react';
import { canManageSettings } from '@/lib/role-permissions';

const COMPANY_KEYS = [
  'company_name',
  'tax_number',
  'company_phone',
  'company_email',
  'company_address',
] as const;

const CONTACT_KEYS = [
  'sms_api_key',
  'whatsapp_api_key',
  'smtp_host',
  'smtp_port',
  'smtp_user',
  'smtp_password',
] as const;

function getValueFromSettings(rows: { key: string; value: unknown }[], key: string): string {
  const row = rows.find((r) => r.key === key);
  if (!row || row.value == null) return '';
  return String(row.value);
}

export default function GeneralSettingsPage() {
  const { profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(DEFAULT_COMPANY_INFO);
  const [contactSettings, setContactSettings] = useState<ContactSettings>(DEFAULT_CONTACT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [savingCompany, setSavingCompany] = useState(false);
  const [savingContact, setSavingContact] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!profile) {
      router.replace('/login');
      return;
    }
    if (!canManageSettings(profile.role as 'admin' | 'personel' | 'ekip')) {
      router.replace('/dashboard');
      return;
    }
    loadSettings();
  }, [authLoading, profile, router]);

  const loadSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const allKeys = [...COMPANY_KEYS, ...CONTACT_KEYS];
      const { data, error: fetchError } = await supabase
        .from('system_settings')
        .select('key, value')
        .in('key', allKeys);

      if (fetchError) throw fetchError;

      const rows = (data || []) as { key: string; value: unknown }[];

      setCompanyInfo({
        company_name: getValueFromSettings(rows, 'company_name'),
        tax_number: getValueFromSettings(rows, 'tax_number'),
        company_phone: getValueFromSettings(rows, 'company_phone'),
        company_email: getValueFromSettings(rows, 'company_email'),
        company_address: getValueFromSettings(rows, 'company_address'),
      });

      setContactSettings({
        sms_api_key: getValueFromSettings(rows, 'sms_api_key'),
        whatsapp_api_key: getValueFromSettings(rows, 'whatsapp_api_key'),
        smtp_host: getValueFromSettings(rows, 'smtp_host'),
        smtp_port: getValueFromSettings(rows, 'smtp_port'),
        smtp_user: getValueFromSettings(rows, 'smtp_user'),
        smtp_password: getValueFromSettings(rows, 'smtp_password'),
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ayarlar yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  const saveCompanyInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCompany(true);
    setError(null);
    setSuccess(null);
    try {
      const rows = COMPANY_KEYS.map((key) => ({
        key,
        value: companyInfo[key],
        updated_at: new Date().toISOString(),
      }));

      for (const row of rows) {
        const { error: upsertError } = await supabase.from('system_settings').upsert(
          { key: row.key, value: row.value, updated_at: row.updated_at },
          { onConflict: 'key', ignoreDuplicates: false }
        );
        if (upsertError) throw upsertError;
      }

      setSuccess('Firma bilgileri kaydedildi.');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Kaydetme sırasında hata oluştu.');
    } finally {
      setSavingCompany(false);
    }
  };

  const saveContactSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingContact(true);
    setError(null);
    setSuccess(null);
    try {
      const rows = CONTACT_KEYS.map((key) => ({
        key,
        value: contactSettings[key],
        updated_at: new Date().toISOString(),
      }));

      for (const row of rows) {
        const { error: upsertError } = await supabase.from('system_settings').upsert(
          { key: row.key, value: row.value, updated_at: row.updated_at },
          { onConflict: 'key', ignoreDuplicates: false }
        );
        if (upsertError) throw upsertError;
      }

      setSuccess('İletişim ayarları kaydedildi.');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Kaydetme sırasında hata oluştu.');
    } finally {
      setSavingContact(false);
    }
  };

  if (authLoading || (profile && !canManageSettings(profile.role as 'admin' | 'personel' | 'ekip'))) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[200px]">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Genel Ayarlar</h1>
          <p className="text-gray-700 mt-2 font-medium">Sistem genel ayarlarını yönetin</p>
        </div>

        {error && (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="p-4 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
            {success}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Firma Bilgileri
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              </div>
            ) : (
              <form onSubmit={saveCompanyInfo} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Firma Adı</label>
                    <Input
                      value={companyInfo.company_name}
                      onChange={(e) =>
                        setCompanyInfo((p) => ({ ...p, company_name: e.target.value }))
                      }
                      placeholder="Firma adı"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Vergi Numarası
                    </label>
                    <Input
                      value={companyInfo.tax_number}
                      onChange={(e) =>
                        setCompanyInfo((p) => ({ ...p, tax_number: e.target.value }))
                      }
                      placeholder="Vergi numarası"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                    <Input
                      value={companyInfo.company_phone}
                      onChange={(e) =>
                        setCompanyInfo((p) => ({ ...p, company_phone: e.target.value }))
                      }
                      placeholder="Telefon"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
                    <Input
                      type="email"
                      value={companyInfo.company_email}
                      onChange={(e) =>
                        setCompanyInfo((p) => ({ ...p, company_email: e.target.value }))
                      }
                      placeholder="E-posta"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Adres</label>
                    <Input
                      value={companyInfo.company_address}
                      onChange={(e) =>
                        setCompanyInfo((p) => ({ ...p, company_address: e.target.value }))
                      }
                      placeholder="Adres"
                    />
                  </div>
                </div>
                <Button type="submit" disabled={savingCompany}>
                  {savingCompany ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Kaydediliyor...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Kaydet
                    </>
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              İletişim Ayarları
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              </div>
            ) : (
              <form onSubmit={saveContactSettings} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      SMS API Key
                    </label>
                    <Input
                      type="password"
                      value={contactSettings.sms_api_key}
                      onChange={(e) =>
                        setContactSettings((p) => ({ ...p, sms_api_key: e.target.value }))
                      }
                      placeholder="SMS API anahtarı"
                      autoComplete="off"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      WhatsApp API Key
                    </label>
                    <Input
                      type="password"
                      value={contactSettings.whatsapp_api_key}
                      onChange={(e) =>
                        setContactSettings((p) => ({ ...p, whatsapp_api_key: e.target.value }))
                      }
                      placeholder="WhatsApp API anahtarı"
                      autoComplete="off"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      SMTP Host
                    </label>
                    <Input
                      value={contactSettings.smtp_host}
                      onChange={(e) =>
                        setContactSettings((p) => ({ ...p, smtp_host: e.target.value }))
                      }
                      placeholder="SMTP sunucu"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      SMTP Port
                    </label>
                    <Input
                      type="number"
                      value={contactSettings.smtp_port}
                      onChange={(e) =>
                        setContactSettings((p) => ({ ...p, smtp_port: e.target.value }))
                      }
                      placeholder="SMTP port"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      SMTP Kullanıcı
                    </label>
                    <Input
                      value={contactSettings.smtp_user}
                      onChange={(e) =>
                        setContactSettings((p) => ({ ...p, smtp_user: e.target.value }))
                      }
                      placeholder="SMTP kullanıcı adı"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      SMTP Şifre
                    </label>
                    <Input
                      type="password"
                      value={contactSettings.smtp_password}
                      onChange={(e) =>
                        setContactSettings((p) => ({ ...p, smtp_password: e.target.value }))
                      }
                      placeholder="SMTP şifre"
                      autoComplete="off"
                    />
                  </div>
                </div>
                <Button type="submit" disabled={savingContact}>
                  {savingContact ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Kaydediliyor...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Kaydet
                    </>
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
