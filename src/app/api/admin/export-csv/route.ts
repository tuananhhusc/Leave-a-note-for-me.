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

  const { password } = body;

  if (!verifyAdminPassword(password)) {
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

  if (!data || data.length === 0) {
    return NextResponse.json({ error: 'Không có note nào.' }, { status: 404 });
  }

  const headers = [
    'ID',
    'Nội dung',
    'Tác giả',
    'Theme',
    'X%',
    'Y%',
    'Rotation',
    'Likes',
    'Admin Reply',
    'Replied At',
    'Hidden',
    'Created At',
  ];

  const escapeCSV = (value: unknown): string => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = data.map((note) => [
    escapeCSV(note.id),
    escapeCSV(note.content),
    escapeCSV(note.author),
    escapeCSV(note.theme),
    escapeCSV(note.x_percent),
    escapeCSV(note.y_percent),
    escapeCSV(note.rotation),
    escapeCSV(note.likes),
    escapeCSV(note.admin_reply),
    escapeCSV(note.replied_at),
    escapeCSV(note.hidden ? 'Có' : 'Không'),
    escapeCSV(note.created_at),
  ]);

  const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

  const BOM = '\uFEFF';
  const csvWithBOM = BOM + csvContent;

  return new NextResponse(csvWithBOM, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="notes_export_${new Date().toISOString().split('T')[0]}.csv"`,
    },
  });
}
