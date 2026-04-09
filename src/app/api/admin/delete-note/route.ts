import { NextResponse } from 'next/server';
import { NOTES_TABLE } from '@/lib/supabase';
import { verifyAdminPassword } from '@/lib/admin-api-auth';
import { createServiceSupabase } from '@/lib/supabase-admin';

export async function POST(request: Request) {
  let body: { password?: string; noteId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!verifyAdminPassword(body.password)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const noteId = typeof body.noteId === 'string' ? body.noteId.trim() : '';
  if (!noteId) {
    return NextResponse.json({ error: 'Missing noteId' }, { status: 400 });
  }

  let supabase;
  try {
    supabase = createServiceSupabase();
  } catch {
    return NextResponse.json(
      {
        error:
          'Server chưa cấu hình SUPABASE_SERVICE_ROLE_KEY. Thêm biến này vào .env.local (không commit).',
      },
      { status: 503 }
    );
  }

  const { error } = await supabase.from(NOTES_TABLE).delete().eq('id', noteId);

  if (error) {
    return NextResponse.json(
      { error: error.message, code: error.code, hint: error.hint },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true });
}
