import { createClient } from '@supabase/supabase-js';

// Este cliente SOLO debe usarse en entornos de servidor (API Routes, Server Actions, etc.)
// Nunca exponer la SERVICE_ROLE_KEY al cliente.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);
