import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL?.trim() ?? '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY?.trim() ?? '';

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    'Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file. ' +
      'Get them from Supabase Dashboard → Project Settings → API.'
  );
}

/**
 * Server-side Supabase client with service role key (bypasses RLS).
 * Use for admin operations, creating profiles, etc.
 */
export const supabaseAdmin: SupabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Create a Supabase client with a user's JWT for RLS / user-scoped operations.
 */
export function createSupabaseClientWithAuth(accessToken: string): SupabaseClient {
  return createClient(supabaseUrl, supabaseAnonKey || supabaseServiceKey, {
    global: {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  });
}
