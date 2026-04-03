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

export type Note = {
  id: string;
  content: string;
  author: string;
  theme: 'white' | 'light-blue' | 'dark-blue' | 'mint-green' | 'lavender' | 'soft-pink' | 'sun-peach';
  x_percent: number;
  y_percent: number;
  rotation: number;
  likes: number;
  created_at: string;
};
