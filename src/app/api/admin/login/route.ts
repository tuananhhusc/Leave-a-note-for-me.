import { NextResponse } from 'next/server';
import { verifyAdminPassword } from '@/lib/admin-api-auth';

export async function POST(request: Request) {
  let body: { password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { password } = body;

  if (!verifyAdminPassword(password)) {
    return NextResponse.json({ error: 'Sai mật khẩu.' }, { status: 401 });
  }

  return NextResponse.json({ success: true });
}
