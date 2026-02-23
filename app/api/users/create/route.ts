import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    // Service Role Key kontrolü
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();

    // Detaylı key kontrolü
    if (!serviceRoleKey) {
      return NextResponse.json(
        { 
          error: 'Service Role Key bulunamadı. Lütfen .env.local dosyasına SUPABASE_SERVICE_ROLE_KEY ekleyin. Supabase Dashboard > Settings > API > service_role key\'ini kopyalayın.' 
        },
        { status: 500 }
      );
    }

    if (serviceRoleKey === 'your_service_role_key_here' || serviceRoleKey.length < 50) {
      return NextResponse.json(
        { 
          error: 'Service Role Key geçersiz. Lütfen Supabase Dashboard\'dan gerçek service_role key\'ini kopyalayıp .env.local dosyasına ekleyin. Key genellikle 200+ karakter uzunluğundadır ve "eyJhbGci..." ile başlar.' 
        },
        { status: 500 }
      );
    }

    // Anon key kontrolü - yanlış key kullanılıyorsa "User not allowed" hatası alınır
    try {
      const payload = JSON.parse(Buffer.from(serviceRoleKey.split('.')[1], 'base64').toString());
      if (payload.role === 'anon') {
        return NextResponse.json(
          { 
            error: 'YANLIŞ ANAHTAR: anon (public) key kullanıyorsunuz! Kullanıcı oluşturmak için SERVICE_ROLE key gerekir. Supabase Dashboard > Settings > API > "service_role" (gizli) key\'ini kopyalayın. "anon" key\'i KULLANMAYIN.' 
          },
          { status: 500 }
        );
      }
      if (payload.role !== 'service_role' && payload.role !== 'supabase_admin') {
        return NextResponse.json(
          { 
            error: `Key rolü uygun değil (role: ${payload.role}). service_role key kullanmanız gerekiyor.` 
          },
          { status: 500 }
        );
      }
    } catch {
      // JWT parse hatası - devam et, Supabase kendisi kontrol edecek
    }

    if (!supabaseUrl) {
      return NextResponse.json(
        { error: 'Supabase URL yapılandırılmamış. .env.local dosyasında NEXT_PUBLIC_SUPABASE_URL kontrol edin.' },
        { status: 500 }
      );
    }

    // Supabase Admin Client (Service Role Key ile)
    let supabaseAdmin;
    try {
      supabaseAdmin = createClient(
        supabaseUrl,
        serviceRoleKey,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
            detectSessionInUrl: false,
          },
        }
      );
    } catch (clientError: any) {
      return NextResponse.json(
        { 
          error: `Supabase client oluşturulamadı: ${clientError.message}. Service Role Key formatını kontrol edin.` 
        },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { email, password, full_name, phone, role, is_active } = body;

    // Validasyon
    if (!email || !password) {
      return NextResponse.json(
        { error: 'E-posta ve şifre gereklidir' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Şifre en az 6 karakter olmalıdır' },
        { status: 400 }
      );
    }

    // 1. Supabase Auth'da kullanıcı oluştur
    // Service Role Key ile admin.createUser kullanıyoruz
    console.log('Kullanıcı oluşturma denemesi:', { email, hasPassword: !!password });
    
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase().trim(), // Email'i normalize et
      password: password,
      email_confirm: true, // E-posta doğrulamasını atla
      user_metadata: {
        full_name: full_name || null,
        phone: phone || null,
      },
    });

    if (authError) {
      console.error('Auth kullanıcı oluşturma hatası:', {
        message: authError.message,
        status: authError.status,
        name: authError.name,
        fullError: JSON.stringify(authError, null, 2),
      });
      
      // Özel hata mesajları
      let errorMessage = authError.message || 'Kullanıcı oluşturulurken bir hata oluştu';
      
      if (authError.message?.includes('Bearer token') || authError.message?.includes('JWT')) {
        errorMessage = 'Service Role Key geçersiz veya yanlış. Lütfen Supabase Dashboard\'dan service_role key\'ini kontrol edip .env.local dosyasına doğru şekilde ekleyin. Server\'ı yeniden başlatmayı unutmayın!';
      } else if (authError.message?.includes('already registered') || authError.message?.includes('already exists') || authError.message?.includes('User already registered')) {
        errorMessage = 'Bu e-posta adresi zaten kullanılıyor. Lütfen farklı bir e-posta adresi deneyin.';
      } else if (authError.message?.includes('not allowed') || authError.message?.includes('User not allowed') || authError.message?.includes('Signups not allowed') || authError.status === 403) {
        errorMessage = `Kullanıcı oluşturma engellendi. Supabase: "${authError.message}". Kontrol edin: Dashboard > Authentication > Providers > Email (açık olsun), Authentication > URL Configuration (Site URL doğru olsun). Proje duraklatılmış olabilir - Dashboard\'da proje durumunu kontrol edin.`;
      } else if (authError.message?.includes('Invalid email') || authError.message?.includes('invalid')) {
        errorMessage = 'Geçersiz e-posta adresi. Lütfen doğru bir e-posta adresi girin.';
      } else if (authError.message?.includes('Password') || authError.message?.includes('password')) {
        errorMessage = 'Şifre gereksinimlerini karşılamıyor. Şifre en az 6 karakter olmalıdır.';
      }
      
      return NextResponse.json(
        { 
          error: errorMessage,
          supabaseError: authError.message,
          supabaseStatus: authError.status,
        },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Kullanıcı oluşturulamadı' },
        { status: 400 }
      );
    }

    // 2. Profiles tablosuna kayıt ekle
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: email,
        full_name: full_name || null,
        phone: phone || null,
        role: role || 'personel',
        is_active: is_active !== undefined ? is_active : true,
      });

    if (profileError) {
      // Eğer profile eklenemezse, auth kullanıcısını sil
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      console.error('Profile oluşturma hatası:', profileError);
      return NextResponse.json(
        { error: profileError.message || 'Profil oluşturulurken bir hata oluştu' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        message: 'Kullanıcı başarıyla oluşturuldu',
        user: {
          id: authData.user.id,
          email: authData.user.email,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Kullanıcı oluşturma hatası:', error);
    return NextResponse.json(
      { error: error.message || 'Kullanıcı oluşturulurken bir hata oluştu' },
      { status: 500 }
    );
  }
}
