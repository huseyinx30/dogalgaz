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
          error: 'Service Role Key bulunamadı. Lütfen .env.local dosyasına SUPABASE_SERVICE_ROLE_KEY ekleyin.' 
        },
        { status: 500 }
      );
    }

    if (serviceRoleKey === 'your_service_role_key_here' || serviceRoleKey.length < 50) {
      return NextResponse.json(
        { 
          error: 'Service Role Key geçersiz. Lütfen Supabase Dashboard\'dan gerçek service_role key\'ini kopyalayıp .env.local dosyasına ekleyin.' 
        },
        { status: 500 }
      );
    }

    if (!supabaseUrl) {
      return NextResponse.json(
        { error: 'Supabase URL yapılandırılmamış' },
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
    const { userId, newPassword } = body;

    // Validasyon
    if (!userId || !newPassword) {
      return NextResponse.json(
        { error: 'Kullanıcı ID ve yeni şifre gereklidir' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Şifre en az 6 karakter olmalıdır' },
        { status: 400 }
      );
    }

    // Yetki kontrolü: Admin dışındakiler sadece kendi şifresini değiştirebilir
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (token) {
      const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
      if (!authError && authUser) {
        const { data: profileData } = await supabaseAdmin
          .from('profiles')
          .select('role')
          .eq('id', authUser.id)
          .single();
        const isAdmin = profileData?.role === 'admin';
        if (!isAdmin && authUser.id !== userId) {
          return NextResponse.json(
            { error: 'Sadece kendi şifrenizi değiştirebilirsiniz' },
            { status: 403 }
          );
        }
      }
    }

    // Supabase Auth'da şifreyi güncelle
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: newPassword,
    });

    if (error) {
      console.error('Şifre değiştirme hatası:', error);
      
      // Özel hata mesajları
      let errorMessage = error.message || 'Şifre değiştirilirken bir hata oluştu';
      
      if (error.message?.includes('Bearer token') || error.message?.includes('JWT')) {
        errorMessage = 'Service Role Key geçersiz veya yanlış. Lütfen Supabase Dashboard\'dan service_role key\'ini kontrol edip .env.local dosyasına doğru şekilde ekleyin. Server\'ı yeniden başlatmayı unutmayın!';
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        message: 'Şifre başarıyla değiştirildi',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Şifre değiştirme hatası:', error);
    return NextResponse.json(
      { error: error.message || 'Şifre değiştirilirken bir hata oluştu' },
      { status: 500 }
    );
  }
}
