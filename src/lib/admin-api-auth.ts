export function verifyAdminPassword(password: unknown): boolean {
  if (typeof password !== 'string' || !password) return false;
  const expected =
    process.env.ADMIN_PASSWORD ||
    process.env.NEXT_PUBLIC_ADMIN_PASSWORD ||
    'ysof2025';
  return password === expected;
}
