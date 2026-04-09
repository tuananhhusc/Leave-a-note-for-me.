import { NextResponse } from 'next/server';
import { NOTES_TABLE, NOTE_COLUMNS } from '@/lib/supabase';
import { verifyAdminPassword } from '@/lib/admin-api-auth';
import { createServiceSupabase } from '@/lib/supabase-admin';

export async function POST(request: Request) {
  let body: { password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!verifyAdminPassword(body.password)) {
    return NextResponse.json({ error: 'Sai mật khẩu admin.' }, { status: 401 });
  }

  let supabase;
  try {
    supabase = createServiceSupabase();
  } catch {
    return NextResponse.json(
      { error: 'Server chưa cấu hình SUPABASE_SERVICE_ROLE_KEY.' },
      { status: 503 }
    );
  }

  const { data, error } = await supabase
    .from(NOTES_TABLE)
    .select(NOTE_COLUMNS)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: 500 }
    );
  }

  return NextResponse.json({ notes: data || [] });
}
