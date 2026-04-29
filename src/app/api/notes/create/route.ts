import { NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { NOTES_TABLE, NOTE_COLUMNS } from '@/lib/supabase';
import { createServiceSupabase } from '@/lib/supabase-admin';

const DAILY_NOTE_LIMIT = 4;
const RATE_TABLE = 'toi_va_ban_note_rate_limits';
const VALID_THEMES = new Set([
  'white',
  'light-blue',
  'dark-blue',
  'mint-green',
  'lavender',
  'soft-pink',
  'sun-peach',
]);

type CreateNoteBody = {
  content?: unknown;
  author?: unknown;
  email?: unknown;
  theme?: unknown;
  fingerprint?: unknown;
};

function toFingerprintHash(input: string): string {
  const salt = process.env.NOTE_FINGERPRINT_SALT || process.env.ADMIN_PASSWORD || 'toi-va-ban';
  return createHash('sha256').update(`${salt}:${input}`).digest('hex');
}

function getTodayRangeUtc() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
  return { start: start.toISOString(), end: end.toISOString() };
}

export async function POST(request: Request) {
  let body: CreateNoteBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const content = typeof body.content === 'string' ? body.content.trim() : '';
  const authorRaw = typeof body.author === 'string' ? body.author.trim() : '';
  const author = authorRaw || 'Ẩn danh';
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const theme = typeof body.theme === 'string' ? body.theme : 'white';
  const fingerprint = typeof body.fingerprint === 'string' ? body.fingerprint.trim() : '';

  if (!content) {
    return NextResponse.json({ error: 'Nội dung không được để trống.' }, { status: 400 });
  }
  if (content.length > 400) {
    return NextResponse.json({ error: 'Nội dung tối đa 400 ký tự.' }, { status: 400 });
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Email không hợp lệ.' }, { status: 400 });
  }
  if (!VALID_THEMES.has(theme)) {
    return NextResponse.json({ error: 'Màu note không hợp lệ.' }, { status: 400 });
  }
  if (!fingerprint) {
    return NextResponse.json({ error: 'Thiếu fingerprint thiết bị.' }, { status: 400 });
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

  const fingerprintHash = toFingerprintHash(fingerprint);
  const { start, end } = getTodayRangeUtc();

  const { count, error: countError } = await supabase
    .from(RATE_TABLE)
    .select('id', { count: 'exact', head: true })
    .eq('fingerprint_hash', fingerprintHash)
    .gte('created_at', start)
    .lte('created_at', end);

  if (countError) {
    return NextResponse.json(
      { error: countError.message, code: countError.code },
      { status: 500 }
    );
  }

  if ((count ?? 0) >= DAILY_NOTE_LIMIT) {
    return NextResponse.json(
      { error: 'Thiết bị này đã đạt giới hạn 4 note trong hôm nay.' },
      { status: 429 }
    );
  }

  const x_percent = Number((5 + Math.random() * 90).toFixed(2));
  const y_percent = Number((10 + Math.random() * 75).toFixed(2));
  const rotation = Number((-10 + Math.random() * 20).toFixed(2));

  const { data: note, error: insertError } = await supabase
    .from(NOTES_TABLE)
    .insert([
      {
        content,
        author,
        email,
        theme,
        x_percent,
        y_percent,
        rotation,
      },
    ])
    .select(NOTE_COLUMNS)
    .single();

  if (insertError) {
    return NextResponse.json(
      { error: insertError.message, code: insertError.code, hint: insertError.hint },
      { status: 400 }
    );
  }

  const { error: logError } = await supabase.from(RATE_TABLE).insert([
    {
      fingerprint_hash: fingerprintHash,
      note_id: note.id,
    },
  ]);

  if (logError) {
    return NextResponse.json(
      { error: logError.message, code: logError.code },
      { status: 500 }
    );
  }

  return NextResponse.json({ note });
}
