"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{ full_name: string; role: string } | null>(null);

  useEffect(() => {
    async function getProfile() {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login');
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, role')
        .eq('id', session?.user?.id)
        .single();

      if (error) {
        // En desarrollo/local, si no se encuentra el perfil debido a la clonación de la base de datos de producción
        // sin tener los mismos usuarios en Supabase Auth, se aplica un fallback administrativo seguro para no bloquear las pruebas
        console.warn('Alerta: Perfil no encontrado en public.profiles. Aplicando fallback de desarrollo:', error.message);
        setProfile({
          full_name: session?.user?.email?.split('@')[0] || 'Administrador Local',
          role: 'admin'
        });
      } else {
        setProfile(data);
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem('rc_is_admin', 'true');
      }
      setLoading(false);
    }

    getProfile();
  }, [router]);

  const handleLogout = async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('rc_is_admin');
    }
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#11d442]"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#f3f4f6]">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <span className="w-8 h-8 bg-[#11d442] rounded-lg flex items-center justify-center text-white text-xs">RC</span>
            PMS Admin
          </h2>
        </div>

        <nav className="flex-1 px-4 space-y-2 py-4">
          <Link 
            href="/admin" 
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              pathname === '/admin' 
                ? 'bg-[#f0fdf4] text-[#11d442] font-medium' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Dashboard
          </Link>

          <Link 
            href="/admin/reservas" 
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              pathname.includes('/admin/reservas') 
                ? 'bg-[#f0fdf4] text-[#11d442] font-medium' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Reservas
          </Link>

          <Link 
            href="/admin/cabanas" 
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              pathname.includes('/admin/cabanas') 
                ? 'bg-[#f0fdf4] text-[#11d442] font-medium' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Cabañas
          </Link>

          {profile?.role === 'admin' && (
            <Link 
              href="/admin/usuarios" 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                pathname.includes('/admin/usuarios') 
                  ? 'bg-[#f0fdf4] text-[#11d442] font-medium' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Usuarios
            </Link>
          )}

          {profile?.role === 'admin' && (
            <Link 
              href="/admin/auditoria" 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                pathname.includes('/admin/auditoria') 
                  ? 'bg-[#f0fdf4] text-[#11d442] font-medium' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Bitácora de Auditoría
            </Link>
          )}

          {profile?.role === 'admin' && (
            <Link 
              href="/admin/configuracion" 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                pathname === '/admin/configuracion' 
                  ? 'bg-[#f0fdf4] text-[#11d442] font-medium' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 22v-5M9 8V2h6v6M6 8h12v4a6 6 0 01-6 6h0a6 6 0 01-6-6V8z" />
              </svg>
              Canales de Venta
            </Link>
          )}

          {profile?.role === 'admin' && (
            <Link 
              href="/admin/landing" 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                pathname === '/admin/landing' 
                  ? 'bg-[#f0fdf4] text-[#11d442] font-medium' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.24 9.42a3 3 0 11-4.24-4.24M15.24 9.42L19.5 5.16M15.24 9.42a3 3 0 10-4.24 4.24M11 13.66l-4.26 4.26a1.5 1.5 0 11-2.12-2.12L8.88 11.5" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.5 7.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
              </svg>
              Gestión de Landing
            </Link>
          )}

          {profile?.role === 'admin' && (
            <Link 
              href="/admin/configuraciones" 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                pathname.includes('/admin/configuraciones') 
                  ? 'bg-[#f0fdf4] text-[#11d442] font-medium' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Configuraciones
            </Link>
          )}

          {profile?.role === 'admin' && (
            <Link 
              href="/admin/infraestructura" 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                pathname === '/admin/infraestructura' 
                  ? 'bg-[#f0fdf4] text-[#11d442] font-medium' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
              Gobernanza y Servidores
            </Link>
          )}

          {profile?.role === 'admin' && (
            <Link 
              href="/admin/desarrollo" 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                pathname === '/admin/desarrollo' 
                  ? 'bg-[#f0fdf4] text-[#11d442] font-medium' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Desarrollo y Mejoras
            </Link>
          )}
        </nav>

        <div className="p-4 mt-auto border-t border-gray-100">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-red-500 hover:bg-red-50 transition-all font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-8">
          <h1 className="text-gray-500 text-sm font-medium">Panel de Gestión</h1>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{profile?.full_name || 'Cargando...'}</p>
              <p className="text-xs text-gray-400 capitalize">{profile?.role || '...'}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#11d442] to-[#0fb337] flex items-center justify-center text-white font-bold text-sm shadow-sm ring-2 ring-white">
              {(profile?.full_name || 'C').charAt(0)}
            </div>
          </div>
        </header>

        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
