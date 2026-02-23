import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();

    const result: any = {
      hasKey: !!serviceRoleKey,
      keyLength: serviceRoleKey?.length || 0,
      keyStartsWith: serviceRoleKey?.substring(0, 20) || 'N/A',
      hasUrl: !!supabaseUrl,
      url: supabaseUrl || 'N/A',
      isValid: false,
      error: null,
    };

    if (!serviceRoleKey) {
      result.error = 'Service Role Key bulunamadı';
      return NextResponse.json(result, { status: 500 });
    }

    if (serviceRoleKey === 'your_service_role_key_here' || serviceRoleKey.length < 50) {
      result.error = 'Service Role Key geçersiz (çok kısa veya placeholder)';
      return NextResponse.json(result, { status: 500 });
    }

    // Anon key kontrolü - "User not allowed" hatasının nedeni genelde bu
    try {
      const payload = JSON.parse(Buffer.from(serviceRoleKey.split('.')[1], 'base64').toString());
      result.keyRole = payload.role;
      if (payload.role === 'anon') {
        result.error = 'YANLIŞ ANAHTAR: anon (public) key kullanıyorsunuz. Kullanıcı oluşturmak için service_role key gerekir. Dashboard > Settings > API > service_role (Reveal) ile gizli key\'i alın.';
        return NextResponse.json(result, { status: 500 });
      }
      if (payload.role !== 'service_role' && payload.role !== 'supabase_admin') {
        result.error = `Key rolü uygun değil (role: ${payload.role}). service_role kullanın.`;
        return NextResponse.json(result, { status: 500 });
      }
    } catch {
      // JWT parse hatası
    }

    if (!supabaseUrl) {
      result.error = 'Supabase URL bulunamadı';
      return NextResponse.json(result, { status: 500 });
    }

    // Key'i test et
    try {
      const supabaseAdmin = createClient(
        supabaseUrl,
        serviceRoleKey,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        }
      );

      // Basit bir test sorgusu
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('count')
        .limit(1);

      if (error) {
        result.error = `Key test edilemedi: ${error.message}`;
        return NextResponse.json(result, { status: 500 });
      }

      result.isValid = true;
      result.message = 'Service Role Key geçerli ve çalışıyor!';
      return NextResponse.json(result, { status: 200 });
    } catch (testError: any) {
      result.error = `Key test hatası: ${testError.message}`;
      return NextResponse.json(result, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Test sırasında bir hata oluştu' },
      { status: 500 }
    );
  }
}
