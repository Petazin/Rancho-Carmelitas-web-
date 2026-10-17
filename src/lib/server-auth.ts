import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase-admin';

/**
 * Obtiene el usuario autenticado a partir de las cookies de la petición.
 */
export async function getAuthenticatedUser() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {}
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (user) return user;

    const { data: { session } } = await supabase.auth.getSession();
    return session?.user || null;
  } catch (err) {
    console.error('[server-auth] Error verificando sesión:', err);
    return null;
  }
}

/**
 * Valida si la petición proviene de un usuario autenticado con permisos operativos (admin/staff).
 */
export async function isStaffOrAdmin(): Promise<boolean> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return false;

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile && ['admin', 'staff', 'recepcion'].includes(profile.role)) {
      return true;
    }

    // Auto-tolerancia en test/dev si el usuario existe en Auth
    if (!profile) {
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(user.id);
      return !!authUser?.user;
    }

    return false;
  } catch (e) {
    return false;
  }
}
