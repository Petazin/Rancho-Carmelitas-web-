'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [view, setView] = useState<'login' | 'forgot' | 'reset'>('login');
  
  // Login States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Forgot Password States
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);

  // Reset Password States
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    // Detectar si venimos de un enlace de recuperación
    const checkRecovery = () => {
      const hash = window.location.hash;
      if (hash && (hash.includes('access_token') || hash.includes('type=recovery'))) {
        setView('reset');
      }
    };

    checkRecovery();
    window.addEventListener('hashchange', checkRecovery);

    // Escuchar el evento de recuperación de contraseña nativo de Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setView('reset');
      }
    });

    return () => {
      window.removeEventListener('hashchange', checkRecovery);
      subscription.unsubscribe();
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message === 'Invalid login credentials' 
        ? 'Credenciales inválidas. Verifica tu correo y contraseña.' 
        : error.message);
      setLoading(false);
    } else {
      router.push('/admin');
    }
  };

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotError(null);
    setForgotSuccess(null);

    const requestOrigin = window.location.origin;
    const siteOrigin = requestOrigin.includes('localhost') ? requestOrigin : 'https://ranchocarmelitas.com';

    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${siteOrigin}/login`,
    });

    if (error) {
      setForgotError(error.message);
      setForgotLoading(false);
    } else {
      setForgotSuccess('📩 Se ha enviado un correo oficial con el enlace para restablecer tu contraseña. Revisa tu bandeja de entrada o spam.');
      setForgotEmail('');
      setForgotLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setResetError(null);
    setResetSuccess(null);

    if (newPassword !== confirmPassword) {
      setResetError('Las contraseñas no coinciden. Por favor, verifícalas.');
      setResetLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setResetError('La contraseña debe tener al menos 6 caracteres.');
      setResetLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      setResetError(error.message);
      setResetLoading(false);
    } else {
      setResetSuccess('🔑 Contraseña actualizada correctamente. Redirigiéndote al panel administrativo...');
      setNewPassword('');
      setConfirmPassword('');
      setResetLoading(false);
      setTimeout(() => {
        router.push('/admin');
      }, 2500);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f9fafb] p-4">
      <div className="max-w-md w-full bg-white rounded-[24px] shadow-sm p-8 border border-gray-100">
        
        {/* VISTA 1: LOGIN */}
        {view === 'login' && (
          <>
            <div className="text-center mb-8">
              <div className="inline-block p-4 rounded-2xl bg-[#f0fdf4] mb-4">
                <svg className="w-8 h-8 text-[#11d442]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Acceso Administrativo</h1>
              <p className="text-gray-500 mt-2">Bienvenido al Panel de Gestión</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Correo Electrónico</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#11d442] focus:border-transparent outline-none transition-all"
                  placeholder="tu@email.com"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">Contraseña</label>
                  <button
                    type="button"
                    onClick={() => {
                      setView('forgot');
                      setError(null);
                    }}
                    className="text-xs font-semibold text-[#11d442] hover:text-[#0fb337] hover:underline transition-colors"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#11d442] focus:border-transparent outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <div className="p-4 rounded-xl bg-red-50 text-red-600 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#11d442] text-white font-bold py-4 rounded-xl hover:bg-[#0fb337] transition-all disabled:opacity-50 shadow-lg shadow-[#11d44222]"
              >
                {loading ? 'Iniciando sesión...' : 'Entrar al Panel'}
              </button>
            </form>
          </>
        )}

        {/* VISTA 2: OLVIDÓ SU CONTRASEÑA */}
        {view === 'forgot' && (
          <>
            <div className="text-center mb-8">
              <div className="inline-block p-4 rounded-2xl bg-amber-50 mb-4">
                <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Recuperar Contraseña</h1>
              <p className="text-gray-500 mt-2">Enviaremos un enlace para restaurar tu clave</p>
            </div>

            <form onSubmit={handleRequestReset} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tu Correo Electrónico</label>
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#11d442] focus:border-transparent outline-none transition-all"
                  placeholder="ejemplo@correo.com"
                />
              </div>

              {forgotError && (
                <div className="p-4 rounded-xl bg-red-50 text-red-600 text-sm">
                  {forgotError}
                </div>
              )}

              {forgotSuccess && (
                <div className="p-4 rounded-xl bg-green-50 text-green-700 text-sm leading-relaxed">
                  {forgotSuccess}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setView('login');
                    setForgotError(null);
                    setForgotSuccess(null);
                  }}
                  className="w-1/2 bg-gray-100 text-gray-600 font-bold py-3.5 rounded-xl hover:bg-gray-200 transition-all text-sm"
                >
                  Volver
                </button>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-1/2 bg-[#11d442] text-white font-bold py-3.5 rounded-xl hover:bg-[#0fb337] transition-all disabled:opacity-50 text-sm"
                >
                  {forgotLoading ? 'Enviando...' : 'Enviar Enlace'}
                </button>
              </div>
            </form>
          </>
        )}

        {/* VISTA 3: RESTABLECER CONTRASEÑA */}
        {view === 'reset' && (
          <>
            <div className="text-center mb-8">
              <div className="inline-block p-4 rounded-2xl bg-blue-50 mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Nueva Contraseña</h1>
              <p className="text-gray-500 mt-2">Establece tu nueva contraseña de acceso</p>
            </div>

            <form onSubmit={handleUpdatePassword} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nueva Contraseña</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#11d442] focus:border-transparent outline-none transition-all"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirmar Contraseña</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#11d442] focus:border-transparent outline-none transition-all"
                  placeholder="Repite tu nueva contraseña"
                />
              </div>

              {resetError && (
                <div className="p-4 rounded-xl bg-red-50 text-red-600 text-sm">
                  {resetError}
                </div>
              )}

              {resetSuccess && (
                <div className="p-4 rounded-xl bg-green-50 text-green-700 text-sm leading-relaxed">
                  {resetSuccess}
                </div>
              )}

              <button
                type="submit"
                disabled={resetLoading}
                className="w-full bg-[#11d442] text-white font-bold py-4 rounded-xl hover:bg-[#0fb337] transition-all disabled:opacity-50 shadow-lg shadow-[#11d44222]"
              >
                {resetLoading ? 'Actualizando...' : 'Guardar Nueva Contraseña'}
              </button>
            </form>
          </>
        )}

        <p className="text-center text-xs text-gray-400 mt-8">
          Rancho Carmelitas &copy; {new Date().getFullYear()} - Panel PMS Privado
        </p>
      </div>
    </div>
  );
}
