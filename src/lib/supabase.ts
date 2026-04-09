import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (_supabase) return _supabase;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
      'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. ' +
      'Using dummy Supabase client for UI preview. Database actions will not work.'
    );
    // Return a dummy client that doesn't crash but returns empty data
    return new Proxy({} as SupabaseClient, {
      get(_target, prop) {
        if (typeof prop === 'symbol' || prop === 'then' || prop === 'catch' || prop === 'finally' || prop === '$$typeof') return undefined;
        if (prop === 'from') return () => ({
          select: () => ({ order: () => Promise.resolve({ data: [], error: null }) }),
          insert: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: new Error('No Supabase credentials') }) }) }),
          update: () => ({ eq: () => Promise.resolve({ error: null }) }),
          delete: () => ({ eq: () => Promise.resolve({ error: null }) }),
        });
        if (prop === 'channel') return () => ({ on: () => ({ subscribe: () => {} }), unsubscribe: () => {} });
        if (prop === 'removeChannel') return () => {};
        if (prop === 'rpc') return () => Promise.resolve({ data: null, error: null });
        return () => {};
      }
    });
  }

  _supabase = createClient(supabaseUrl, supabaseAnonKey);
  return _supabase;
}

// Re-export as `supabase` for convenience (lazy getter)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    if (typeof prop === 'symbol' || prop === 'then' || prop === 'catch' || prop === 'finally' || prop === '$$typeof') return undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (getSupabase() as any)[prop];
  },
});

export const NOTES_TABLE = 'toi_va_ban_notes';

// Public columns (no email - email is admin-only)
export const NOTE_PUBLIC_COLUMNS = 'id, content, author, theme, x_percent, y_percent, rotation, likes, admin_reply, replied_at, hidden, created_at';

// All columns including email (for admin/server-side use)
export const NOTE_COLUMNS = 'id, content, author, email, theme, x_percent, y_percent, rotation, likes, admin_reply, replied_at, hidden, created_at';

export type Note = {
  id: string;
  content: string;
  author: string;
  email?: string | null;
  theme: 'white' | 'light-blue' | 'dark-blue' | 'mint-green' | 'lavender' | 'soft-pink' | 'sun-peach';
  x_percent: number;
  y_percent: number;
  rotation: number;
  likes: number;
  admin_reply: string | null;
  replied_at: string | null;
  hidden: boolean;
  created_at: string;
};

const VALID_THEMES: Note['theme'][] = [
  'white',
  'light-blue',
  'dark-blue',
  'mint-green',
  'lavender',
  'soft-pink',
  'sun-peach',
];

export function normalizeNote(raw: Partial<Note> & Record<string, unknown>): Note {
  const theme = VALID_THEMES.includes(raw.theme as Note['theme'])
    ? (raw.theme as Note['theme'])
    : 'white';

  const fallbackId =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `note-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  return {
    id: String(raw.id || fallbackId),
    content: String(raw.content || ''),
    author: String(raw.author || 'Ẩn danh'),
    theme,
    x_percent: typeof raw.x_percent === 'number' ? raw.x_percent : 50,
    y_percent: typeof raw.y_percent === 'number' ? raw.y_percent : 50,
    rotation: typeof raw.rotation === 'number' ? raw.rotation : 0,
    likes: typeof raw.likes === 'number' ? raw.likes : 0,
    email: typeof raw.email === 'string' ? raw.email : null,
    admin_reply: typeof raw.admin_reply === 'string' ? raw.admin_reply : null,
    replied_at: typeof raw.replied_at === 'string' ? raw.replied_at : null,
    hidden: typeof raw.hidden === 'boolean' ? raw.hidden : false,
    created_at: typeof raw.created_at === 'string' ? raw.created_at : new Date().toISOString(),
  };
}
