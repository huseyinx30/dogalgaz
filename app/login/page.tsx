'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase/client';
import {
  CheckCircle2,
  Zap,
  Shield,
  CreditCard,
  Users,
  BarChart3,
  FileText,
  Loader2,
  Flame,
  MessageCircle,
  Phone,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

const DEMO_PHONE = '0544 242 12 41';
const DEMO_WHATSAPP = `https://wa.me/90${DEMO_PHONE.replace(/\D/g, '').replace(/^0/, '')}?text=${encodeURIComponent('Merhaba, Doğalgaz Yönetim Otomasyonu hakkında demo talep etmek istiyorum.')}`;

const features = [
  {
    icon: Zap,
    text: '7 gün ücretsiz deneyin',
    sub: 'Kredi kartı gerekmez',
  },
  {
    icon: Users,
    text: 'Müşteri ve ekip yönetimi',
  },
  {
    icon: BarChart3,
    text: 'Satış ve stok takibi',
  },
  {
    icon: FileText,
    text: 'Teklif ve sözleşme oluşturma',
  },
  {
    icon: Shield,
    text: 'Güvenli bulut depolama',
  },
  {
    icon: CreditCard,
    text: 'Ödeme takibi ve muhasebe',
  },
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setError('Lütfen geçerli bir e-posta adresi girin.');
      setLoading(false);
      return;
    }

    if (!password || password.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır.');
      setLoading(false);
      return;
    }

    try {
      let authData: { user: { id: string; email?: string } } | null = null;
      let signInError: { message: string } | null = null;

      const signInResult = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password: password,
      });
      authData = signInResult.data?.user ? { user: { id: signInResult.data.user.id, email: signInResult.data.user.email } } : null;
      signInError = signInResult.error;

      if (
        signInError &&
        (signInError.message.includes('Invalid login credentials') ||
          signInError.message.includes('Invalid email or password'))
      ) {
        const teamRes = await fetch('/api/auth/team-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: trimmedEmail, password }),
        });
        const teamData = await teamRes.json();

        if (teamData.success) {
          const retry = await supabase.auth.signInWithPassword({
            email: trimmedEmail,
            password: password,
          });
          authData = retry.data?.user ? { user: { id: retry.data.user.id, email: retry.data.user.email } } : null;
          signInError = retry.error;
        }
      }

      if (signInError) {
        let errorMessage = 'Giriş yapılırken bir hata oluştu';
        if (
          signInError.message.includes('Invalid login credentials') ||
          signInError.message.includes('Invalid email or password')
        ) {
          errorMessage = 'E-posta veya şifre hatalı. Lütfen tekrar deneyin.';
        } else if (signInError.message.includes('Email not confirmed')) {
          errorMessage = 'E-posta adresiniz doğrulanmamış. Lütfen yönetici ile iletişime geçin.';
        } else if (signInError.message.includes('User not found')) {
          errorMessage = 'Bu e-posta adresi ile kayıtlı kullanıcı bulunamadı.';
        } else {
          errorMessage = signInError.message;
        }
        setError(errorMessage);
        setLoading(false);
        return;
      }

      if (!authData?.user) {
        setError('Giriş yapılamadı. Lütfen tekrar deneyin.');
        setLoading(false);
        return;
      }

      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('is_active')
          .eq('id', authData.user.id)
          .single();

        if (profile && !profile.is_active) {
          setError('Hesabınız pasif durumda. Lütfen yönetici ile iletişime geçin.');
          await supabase.auth.signOut();
          setLoading(false);
          return;
        }

        if (profileError && profileError.code === 'PGRST116') {
          await supabase.from('profiles').insert({
            id: authData.user.id,
            email: authData.user.email || trimmedEmail,
            role: 'personel',
            is_active: true,
          });
        }
      } catch {
        // Profil hatası kritik değil
      }

      setLoading(false);
      window.location.href = '/dashboard';
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Giriş yapılırken bir hata oluştu. Lütfen tekrar deneyin.');
      setLoading(false);
    }
  };

  return (
    <div className="h-screen overflow-hidden flex flex-col lg:flex-row">
      {/* Sol - Login Formu */}
      <div className="flex-1 flex flex-col justify-center min-h-0 px-4 sm:px-6 lg:px-10 xl:px-16 py-6 lg:py-8 bg-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_#eff6ff_0%,_transparent_60%)]" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-50 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2 opacity-50" />

        <div className="relative z-10 w-full max-w-sm mx-auto flex flex-col justify-center">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25 ring-2 ring-blue-100">
              <Flame className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">Doğalgaz CRM</h1>
              <p className="text-xs text-gray-500 font-medium">Yönetim Otomasyonu</p>
            </div>
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-1">Hoş geldiniz</h2>
          <p className="text-gray-600 text-sm mb-5">Hesabınıza giriş yapın</p>

          <form onSubmit={handleLogin} className="space-y-3">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs flex items-center gap-2">
                <span className="flex-shrink-0 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold">!</span>
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-xs font-semibold text-gray-700">E-posta</label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={(e) => setEmail(e.target.value.trim().toLowerCase())}
                required
                placeholder="ornek@sirket.com"
                className="w-full h-10 px-3 text-sm border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                autoComplete="email"
                disabled={loading}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-xs font-semibold text-gray-700">Şifre</label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full h-10 px-3 text-sm border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                autoComplete="current-password"
                disabled={loading}
              />
            </div>

            <Button
              type="submit"
              className="w-full h-10 text-sm font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md shadow-blue-500/25 rounded-lg transition-all"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Giriş yapılıyor...
                </>
              ) : (
                <>
                  Giriş Yap
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </form>

          {/* Mobil - Demo + özellikler inline */}
          <div className="mt-5 lg:hidden space-y-3">
            <a
              href={DEMO_WHATSAPP}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-lg bg-[#25D366] hover:bg-[#20bd5a] text-white text-sm font-semibold shadow-md"
            >
              <MessageCircle className="w-4 h-4" />
              Demo Talep Et — 0544 242 12 41
            </a>
            <div className="flex flex-wrap gap-1.5">
              {features.slice(0, 4).map((item, i) => (
                <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-[10px] font-medium">
                  <CheckCircle2 className="w-3 h-3" />
                  {item.text}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Sağ - Tanıtım Paneli (Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between min-h-0 px-10 xl:px-16 py-8 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-950 relative overflow-hidden shrink-0">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl" />
        </div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.03\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50" />

        <div className="relative z-10 flex-1 flex flex-col min-h-0">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/90 text-xs font-medium mb-5 w-fit">
            <Sparkles className="w-3.5 h-3.5" />
            Tek platformda tüm operasyonlar
          </div>

          <h3 className="text-2xl xl:text-3xl font-bold text-white mb-2 leading-tight">Doğalgaz Yönetim<br />Otomasyonu</h3>
          <p className="text-blue-200 text-sm mb-6 max-w-sm">Müşterilerinizi, ekiplerinizi ve işlerinizi tek platformda yönetin.</p>

          <ul className="grid grid-cols-2 gap-x-6 gap-y-2.5 flex-1 min-h-0 content-start">
            {features.map((item, i) => (
              <li key={i} className="flex items-center gap-3 text-white group">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center group-hover:bg-white/25 transition-colors">
                  <item.icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="font-medium text-sm">{item.text}</span>
                  {item.sub && <span className="block text-xs text-blue-200/90">{item.sub}</span>}
                </div>
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 ml-auto" />
              </li>
            ))}
          </ul>

          <div className="mt-5 p-4 rounded-xl bg-white/10 border border-white/20 shrink-0">
            <p className="text-white/90 text-xs mb-3">
              <strong className="text-white">Henüz hesabınız yok mu?</strong> Ücretsiz demo ile keşfedin.
            </p>
            <a
              href={DEMO_WHATSAPP}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#25D366] hover:bg-[#20bd5a] text-white text-sm font-semibold shadow-lg shadow-[#25D366]/30 transition-all hover:-translate-y-0.5"
            >
              <MessageCircle className="w-4 h-4" />
              Demo Talep Et
              <Phone className="w-3.5 h-3.5 opacity-90" />
              <span className="text-white/90 font-normal">0544 242 12 41</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
