import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Ekip girişi: teams tablosundaki email/password ile eşleşen ekipler için
 * Supabase Auth kullanıcısı + profil oluşturur. Böylece ekip, login sayfasından
 * giriş yapabilir.
 */
export async function POST(request: NextRequest) {
  try {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();

    if (!serviceRoleKey || !supabaseUrl) {
      return NextResponse.json(
        { error: 'Sunucu yapılandırması eksik', success: false },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'E-posta ve şifre gereklidir', success: false },
        { status: 400 }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 1. teams tablosunda bu email ve password ile ekip var mı?
    const { data: team, error: teamError } = await supabaseAdmin
      .from('teams')
      .select('id, name, email, password')
      .eq('email', trimmedEmail)
      .maybeSingle();

    if (teamError || !team) {
      return NextResponse.json({ error: 'Ekip bulunamadı', success: false }, { status: 200 });
    }

    if (!team.password || team.password !== password) {
      return NextResponse.json({ error: 'Şifre hatalı', success: false }, { status: 200 });
    }

    // 2. Bu email ile zaten auth user var mı?
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(
      (u) => u.email?.toLowerCase() === trimmedEmail
    );

    if (existingUser) {
      // Auth user var ama şifre yanlış olabilir - şifreyi güncelle (ekip girişi için)
      await supabaseAdmin.auth.admin.updateUserById(existingUser.id, { password });
      return NextResponse.json({ success: true, message: 'Mevcut hesap güncellendi' });
    }

    // 3. Yeni auth user + profile oluştur
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: trimmedEmail,
      password,
      email_confirm: true,
      user_metadata: { full_name: team.name },
    });

    if (authError) {
      if (
        authError.message?.includes('already') ||
        authError.message?.includes('already exists')
      ) {
        return NextResponse.json({ success: true, message: 'Hesap zaten mevcut' });
      }
      return NextResponse.json(
        { error: authError.message || 'Kullanıcı oluşturulamadı', success: false },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Kullanıcı oluşturulamadı', success: false },
        { status: 400 }
      );
    }

    // 4. Profile oluştur (role: ekip)
    const { error: profileError } = await supabaseAdmin.from('profiles').insert({
      id: authData.user.id,
      email: trimmedEmail,
      full_name: team.name,
      role: 'ekip',
      is_active: true,
    });

    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { error: profileError.message || 'Profil oluşturulamadı', success: false },
        { status: 400 }
      );
    }

    // 5. team_members'a ekle (ekibin kendisini üye olarak - atamaları görebilmesi için)
    const { error: memberError } = await supabaseAdmin
      .from('team_members')
      .insert({ team_id: team.id, member_id: authData.user.id, role: 'lider' });
    if (memberError && memberError.code !== '23505') {
      // 23505 = unique violation, zaten üye demek
      console.warn('team_members insert:', memberError);
    }

    return NextResponse.json({ success: true, message: 'Ekip hesabı oluşturuldu' });
  } catch (error: any) {
    console.error('Team login error:', error);
    return NextResponse.json(
      { error: error.message || 'Beklenmeyen hata', success: false },
      { status: 500 }
    );
  }
}
