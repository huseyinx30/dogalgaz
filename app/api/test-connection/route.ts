import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const result: any = {
      hasUrl: !!url,
      hasKey: !!key,
      urlFormat: url?.startsWith('https://') || false,
      keyFormat: key?.startsWith('eyJ') || false,
      connectionTest: false,
      error: null,
    };

    if (!url || !key) {
      result.error = 'Environment variables eksik';
      return NextResponse.json(result, { status: 500 });
    }

    // Supabase bağlantı testi
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.auth.getSession();
      result.connectionTest = !error;
      result.error = error?.message || null;
    } catch (err: any) {
      result.error = err.message;
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
