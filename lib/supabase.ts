import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Cliente único para todo el frontend (anon key + RLS; nunca usar service role acá).
// Usa cookies (createBrowserClient) para que proxy.ts pueda leer la sesión.
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
