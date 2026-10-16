import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://frgpckemanidliasrdrm.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_fJIhk-wz86u18MeEIIvQxg_I3ILxhCw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
