export interface SupabaseErrorInfo {
  message: string;
  code: string | null;
  hint: string | null;
  details: string | null;
}

export function getSupabaseErrorInfo(err: unknown): SupabaseErrorInfo {
  if (!err || typeof err !== 'object') {
    return { message: 'Lỗi không xác định', code: null, hint: null, details: null };
  }

  const e = err as {
    message?: string;
    code?: string;
    hint?: string;
    details?: string;
  };

  return {
    message: e.message || 'Lỗi không xác định',
    code: e.code || null,
    hint: e.hint || null,
    details: e.details || null,
  };
}
