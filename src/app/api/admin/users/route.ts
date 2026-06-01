import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// supabaseAdmin para acciones privilegiadas por defecto
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function checkAdmin() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return false;

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();

  return profile?.role === 'admin';
}

async function getAdminSessionUserId() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.id || null;
  } catch (e) {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    if (!await checkAdmin()) {
      return NextResponse.json({ error: 'No tienes permisos' }, { status: 403 });
    }

    const { email, full_name, role, phone } = await request.json();
    const adminId = await getAdminSessionUserId();

    // Crear cliente dinámico con el header de auditoría x-audit-user-id
    const supabaseAdminLocal = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: { autoRefreshToken: false, persistSession: false },
        global: {
          headers: adminId ? { 'x-audit-user-id': adminId } : {}
        }
      }
    );

    const requestOrigin = new URL(request.url).origin;
    const siteOrigin = requestOrigin.includes('localhost') ? requestOrigin : 'https://ranchocarmelitas.com';

    // 1. Invitar al usuario usando supabaseAdminLocal
    const { data: inviteData, error: inviteError } = await supabaseAdminLocal.auth.admin.inviteUserByEmail(email, {
      data: { full_name, role, phone },
      redirectTo: `${siteOrigin}/login`,
    });

    // Si arroja error, puede ser porque ya existe
    if (inviteError) {
      // Intentar re-invitar si el usuario ya existe y está pendiente
      if (inviteError.message.includes('already registered') || inviteError.message.includes('already exists')) {
        // Encontrar al usuario existente
        const { data: searchUser } = await supabaseAdminLocal.auth.admin.listUsers();
        const existingUser = searchUser?.users?.find(u => u.email === email);
        
        if (existingUser) {
          // Re-enviar invitación
          const { data: reinviteData, error: reinviteError } = await supabaseAdminLocal.auth.admin.inviteUserByEmail(email, {
            data: { full_name, role, phone },
            redirectTo: `${siteOrigin}/login`,
          });
          
          if (reinviteError) throw reinviteError;

          // Forzar upsert del perfil en profiles
          const { error: profileError } = await supabaseAdminLocal
            .from('profiles')
            .upsert({
              id: existingUser.id,
              full_name,
              role,
              email: email,
              phone: phone || null,
              created_at: new Date().toISOString()
            });

          if (profileError) throw profileError;

          return NextResponse.json({ data: reinviteData, message: 'Invitación reenviada correctamente.' });
        }
      }
      throw inviteError;
    }

    // 2. Si la invitación fue exitosa, forzar la inserción en public.profiles para visualizarlo inmediatamente
    if (inviteData?.user) {
      const { error: profileError } = await supabaseAdminLocal
        .from('profiles')
        .upsert({
          id: inviteData.user.id,
          full_name,
          role,
          email: email,
          phone: phone || null,
          created_at: new Date().toISOString()
        });

      if (profileError) {
        console.error('Error insertando perfil manual:', profileError);
      }

      // 3. Corregir retroactivamente el registro automático "INSERT" del trigger interno de Supabase
      if (adminId) {
        try {
          const { data: adminProfile } = await supabaseAdminLocal
            .from('profiles')
            .select('full_name, email, role')
            .eq('id', adminId)
            .single();

          if (adminProfile) {
            await supabaseAdminLocal
              .from('audit_logs')
              .update({
                performed_by_id: adminId,
                performed_by_email: adminProfile.email || '',
                performed_by_name: adminProfile.full_name || '',
                user_role: adminProfile.role || 'admin'
              })
              .eq('table_name', 'profiles')
              .eq('record_id', inviteData.user.id)
              .eq('action', 'INSERT')
              .eq('user_role', 'sistema');
          }
        } catch (e) {
          console.error('Error actualizando log de inserción de auditoría:', e);
        }
      }
    }

    return NextResponse.json({ data: inviteData, message: 'Invitación enviada correctamente.' });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  try {
    if (!await checkAdmin()) {
      return NextResponse.json({ error: 'No tienes permisos' }, { status: 403 });
    }

    const { userId, full_name, email, role, phone, is_blocked, block_reason } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'Falta ID de usuario' }, { status: 400 });
    }

    const adminId = await getAdminSessionUserId();

    // Crear cliente dinámico con el header de auditoría x-audit-user-id
    const supabaseAdminLocal = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: { autoRefreshToken: false, persistSession: false },
        global: {
          headers: adminId ? { 'x-audit-user-id': adminId } : {}
        }
      }
    );

    // 1. Obtener datos del usuario existente
    const { data: searchUser } = await supabaseAdminLocal.auth.admin.listUsers();
    const existingUser = searchUser?.users?.find(u => u.id === userId);
    
    if (!existingUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // 2. Definir ban_duration si is_blocked es verdadero
    const banDuration = is_blocked ? '87600h' : 'none';
    const metadata = {
      ...existingUser.user_metadata,
      full_name: full_name || existingUser.user_metadata?.full_name || '',
      role: role || existingUser.user_metadata?.role || '',
      phone: phone || existingUser.user_metadata?.phone || '',
      block_reason: is_blocked ? (block_reason || 'Sin motivo especificado') : ''
    };

    // 3. Actualizar datos en Supabase Auth
    const updatePayload: any = {
      user_metadata: metadata,
      ban_duration: banDuration
    };
    
    if (email && email !== existingUser.email) {
      updatePayload.email = email;
      updatePayload.email_confirm = true;
    }

    const { error: authError } = await supabaseAdminLocal.auth.admin.updateUserById(userId, updatePayload);

    if (authError) throw authError;

    // 4. Actualizar perfiles públicos (profiles) para sincronía reactiva y persistencia relacional híbrida robusta
    const { error: profileError } = await supabaseAdminLocal
      .from('profiles')
      .upsert({
        id: userId,
        full_name: full_name || null,
        role: role || 'staff',
        email: email || existingUser.email || null,
        phone: phone || null,
        banned_until: is_blocked ? new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toISOString() : null,
        block_reason: is_blocked ? (block_reason || 'Sin motivo') : null,
        created_at: existingUser.created_at
      });

    if (profileError) throw profileError;

    return NextResponse.json({ success: true, message: 'Usuario actualizado correctamente.' });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function GET(request: Request) {
  try {
    if (!await checkAdmin()) {
      return NextResponse.json({ error: 'No tienes permisos' }, { status: 403 });
    }

    // 1. Obtener todos los perfiles de la base de datos pública
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profilesError) throw profilesError;

    // 2. Obtener la lista completa de usuarios desde Auth usando privilegios de admin
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    
    // Crear un mapa para búsqueda rápida
    const authMap: Record<string, { email: string; phone?: string; banned_until?: string; block_reason?: string }> = {};
    if (!authError && authData?.users) {
      authData.users.forEach(u => {
        authMap[u.id] = {
          email: u.email || '',
          phone: u.phone || u.user_metadata?.phone || '',
          banned_until: u.banned_until || '',
          block_reason: u.user_metadata?.block_reason || ''
        };
      });
    }

    // 3. Cruzar los datos dinámicamente usando 100% la data nativa de Supabase Auth para baneo
    const enrichedProfiles = (profiles || []).map(p => {
      const authInfo = authMap[p.id];
      const bannedUntil = authInfo?.banned_until || '';
      const isBlocked = !!bannedUntil && new Date(bannedUntil) > new Date();

      return {
        ...p,
        email: p.email || authInfo?.email || '',
        phone: p.phone || authInfo?.phone || p.user_metadata?.phone || '',
        is_blocked: isBlocked,
        banned_until: bannedUntil,
        block_reason: authInfo?.block_reason || ''
      };
    });

    return NextResponse.json({ data: enrichedProfiles });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    if (!await checkAdmin()) {
      return NextResponse.json({ error: 'No tienes permisos' }, { status: 403 });
    }

    const { userId } = await request.json();
    const adminId = await getAdminSessionUserId();

    // Crear cliente dinámico con el header de auditoría x-audit-user-id
    const supabaseAdminLocal = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: { autoRefreshToken: false, persistSession: false },
        global: {
          headers: adminId ? { 'x-audit-user-id': adminId } : {}
        }
      }
    );

    // 1. Borrar de forma explícita el perfil público con el cliente dinámico para que el trigger de auditoría asocie al operador real
    try {
      const { error: profileDeleteError } = await supabaseAdminLocal
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (profileDeleteError) {
        console.error('Error borrando perfil de forma explícita:', profileDeleteError);
      }
    } catch (e) {
      console.error('Excepción al borrar perfil explícito:', e);
    }

    // 2. Borrar de Supabase Auth
    const { error } = await supabaseAdminLocal.auth.admin.deleteUser(userId);

    if (error) throw error;

    return NextResponse.json({ message: 'Usuario eliminado correctamente' });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
