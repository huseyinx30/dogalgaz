import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Ekip kaydedildiğinde otomatik olarak Supabase Auth'a kullanıcı oluşturur.
 * Böylece ekip email+şifre ile login yapabilir.
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
    const { team_id } = body;

    if (!team_id) {
      return NextResponse.json(
        { error: 'team_id gereklidir', success: false },
        { status: 400 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: team, error: teamError } = await supabaseAdmin
      .from('teams')
      .select('id, name, email, password')
      .eq('id', team_id)
      .single();

    if (teamError || !team || !team.email) {
      return NextResponse.json(
        { success: true, message: 'Ekip giriş bilgisi yok veya eksik' },
        { status: 200 }
      );
    }
    if (!team.password || String(team.password).length < 6) {
      return NextResponse.json(
        { success: true, message: 'Şifre en az 6 karakter olmalı' },
        { status: 200 }
      );
    }

    const trimmedEmail = team.email.trim().toLowerCase();

    // Mevcut auth kullanıcısı var mı?
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(
      (u) => u.email?.toLowerCase() === trimmedEmail
    );

    if (existingUser) {
      // Şifreyi güncelle
      await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
        password: team.password,
        user_metadata: { full_name: team.name },
      });
      // Profile güncelle
      await supabaseAdmin
        .from('profiles')
        .update({ full_name: team.name, role: 'ekip', is_active: true })
        .eq('id', existingUser.id);
      // team_members'a ekle
      await supabaseAdmin
        .from('team_members')
        .upsert(
          { team_id: team.id, member_id: existingUser.id, role: 'lider' },
          { onConflict: 'team_id,member_id' }
        );
      return NextResponse.json({ success: true, message: 'Ekip giriş bilgisi güncellendi' });
    }

    // Yeni auth user + profile oluştur
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: trimmedEmail,
      password: team.password,
      email_confirm: true,
      user_metadata: { full_name: team.name },
    });

    if (authError) {
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

    await supabaseAdmin.from('profiles').insert({
      id: authData.user.id,
      email: trimmedEmail,
      full_name: team.name,
      role: 'ekip',
      is_active: true,
    });

    await supabaseAdmin
      .from('team_members')
      .insert({ team_id: team.id, member_id: authData.user.id, role: 'lider' });

    return NextResponse.json({ success: true, message: 'Ekip giriş hesabı oluşturuldu' });
  } catch (error: any) {
    console.error('Sync team error:', error);
    return NextResponse.json(
      { error: error.message || 'Beklenmeyen hata', success: false },
      { status: 500 }
    );
  }
}
