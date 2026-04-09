import { NextResponse } from 'next/server';
import { NOTES_TABLE } from '@/lib/supabase';
import { verifyAdminPassword } from '@/lib/admin-api-auth';
import { createServiceSupabase } from '@/lib/supabase-admin';

export async function POST(request: Request) {
  let body: { password?: unknown; noteId?: unknown; hidden?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { password, noteId, hidden } = body;

  if (!verifyAdminPassword(password)) {
    return NextResponse.json({ error: 'Sai mật khẩu admin.' }, { status: 401 });
  }

  if (!noteId || typeof noteId !== 'string') {
    return NextResponse.json({ error: 'Thiếu noteId.' }, { status: 400 });
  }

  if (typeof hidden !== 'boolean') {
    return NextResponse.json({ error: 'Thiếu trạng thái hidden.' }, { status: 400 });
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
    .update({ hidden })
    .eq('id', noteId)
    .select('id, hidden')
    .single();

  if (error) {
    return NextResponse.json(
      { error: error.message, code: error.code, hint: error.hint },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, note: data });
}
