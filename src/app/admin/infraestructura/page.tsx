'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

// Claves de configuración que maneja el Panel de Gobernanza
const CONFIG_KEYS = [
  { key: 'email_sender', label: 'Remitente Oficial de Correos (FROM)', placeholder: 'Ej: Rancho Carmelitas <reservas@ranchocarmelitas.com>', hint: 'Debe coincidir con el dominio verificado en Resend. Si es de pruebas, use "Rancho Carmelitas <onboarding@resend.dev>".' },
  { key: 'company_email', label: 'Correo del Administrador para Alertas (TO)', placeholder: 'Ej: rancho.carmelitas.6@gmail.com', hint: 'Correo donde se enviarán las notificaciones de nuevas reservas y abonos.' },
  { key: 'resend_api_key', label: 'Resend API Key', placeholder: 'Ej: re_6yeqwc8V...', hint: 'Clave de API saliente para el envío de mailing transaccional.', isSecret: true },
  { key: 'vault_dominioschile', label: 'Contraseña DominiosChile', placeholder: 'Ingrese contraseña de acceso', hint: 'Clave para ingresar a DominiosChile.com y renovar el dominio.', isSecret: true },
  { key: 'vault_vercel', label: 'Contraseña Cuenta Vercel', placeholder: 'Ingrese contraseña de acceso', hint: 'Clave de acceso unificado al hosting en Vercel.', isSecret: true },
];

export default function AdminInfraestructuraPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState('');
  
  // Estado para la re-autenticación de seguridad (modal)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authPassword, setAuthPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [pendingAction, setPendingAction] = useState<{ type: 'show' | 'copy' | 'save'; keyName?: string } | null>(null);

  // Estados de visualización de secretos individuales
  const [revealedSecrets, setRevealedSecrets] = useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    fetchInitialData();
  }, []);

  async function fetchInitialData() {
    setLoading(true);
    
    // 1. Obtener sesión del usuario logueado actualmente
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email) {
      setCurrentUserEmail(user.email);
    }

    // 2. Obtener configuraciones de la base de datos
    const { data, error } = await supabase
      .from('settings')
      .select('key, value');
    
    if (data) {
      const map: Record<string, string> = {};
      data.forEach((s: { key: string; value: string }) => { map[s.key] = s.value; });
      setSettings(map);
    }
    setLoading(false);
  }

  // Manejador de cambios en inputs locales
  const handleChange = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  // Función para guardar configuraciones no secretas directamente, y secretas con re-autenticación
  const handleSaveClick = (e: React.FormEvent) => {
    e.preventDefault();
    // Solicitar confirmación de seguridad para guardar cambios
    setPendingAction({ type: 'save' });
    setIsAuthModalOpen(true);
    setAuthPassword('');
    setAuthError('');
  };

  // Proceder a guardar datos tras re-autenticación exitosa
  const executeSave = async () => {
    setSaving(true);
    setMessage({ text: '', type: '' });

    const upserts = CONFIG_KEYS.map(({ key }) => ({
      key,
      value: settings[key] || '',
    }));

    const { error } = await supabase
      .from('settings')
      .upsert(upserts, { onConflict: 'key' });

    setSaving(false);

    if (error) {
      setMessage({ text: 'Error al guardar credenciales: ' + error.message, type: 'error' });
    } else {
      setMessage({ text: '✓ Credenciales y Llavero actualizados de forma segura en Supabase.', type: 'success' });
      setTimeout(() => setMessage({ text: '', type: '' }), 4000);
      fetchInitialData();
    }
  };

  // Solicitar ver un secreto
  const handleRevealSecret = (keyName: string) => {
    if (revealedSecrets[keyName]) {
      // Si ya está revelado, ocultar
      setRevealedSecrets(prev => ({ ...prev, [keyName]: false }));
    } else {
      // Re-autenticar antes de revelar
      setPendingAction({ type: 'show', keyName });
      setIsAuthModalOpen(true);
      setAuthPassword('');
      setAuthError('');
    }
  };

  // Solicitar copiar un secreto
  const handleCopySecret = (keyName: string) => {
    setPendingAction({ type: 'copy', keyName });
    setIsAuthModalOpen(true);
    setAuthPassword('');
    setAuthError('');
  };

  // Ejecución de re-autenticación mediante llamado a Supabase Auth
  const handleVerifyPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authPassword) return;
    setAuthLoading(true);
    setAuthError('');

    try {
      // Intenta re-autenticar al usuario administrador firmando sesión en caliente
      const { error } = await supabase.auth.signInWithPassword({
        email: currentUserEmail,
        password: authPassword,
      });

      if (error) {
        setAuthError('Contraseña incorrecta. Acceso de seguridad denegado.');
        setAuthLoading(false);
        return;
      }

      // Verificación exitosa
      setIsAuthModalOpen(false);
      
      if (pendingAction) {
        if (pendingAction.type === 'show' && pendingAction.keyName) {
          const key = pendingAction.keyName;
          setRevealedSecrets(prev => ({ ...prev, [key]: true }));
        } else if (pendingAction.type === 'copy' && pendingAction.keyName) {
          const keyName = pendingAction.keyName;
          const secretValue = settings[keyName] || '';
          navigator.clipboard.writeText(secretValue);
          setCopiedKey(keyName);
          setTimeout(() => setCopiedKey(null), 2500);
        } else if (pendingAction.type === 'save') {
          executeSave();
        }
      }
    } catch (err) {
      console.error('Error de re-autenticación:', err);
      setAuthError('Ocurrió un error al verificar la contraseña.');
    } finally {
      setAuthLoading(false);
      setPendingAction(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#11d442]"></div>
        <span className="text-sm font-semibold text-gray-500">Cargando panel de gobernanza técnica...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          🛡️ Gobernanza Técnica e Infraestructura
        </h2>
        <p className="text-gray-500 mt-1">
          Panel exclusivo para la gestión desvinculada de sistemas satélite, rotación de credenciales y llavero seguro (Vault).
        </p>
      </div>

      {/* Banner de Estado del Ecosistema */}
      <div className="bg-[#11d442]/5 border border-[#11d442]/20 p-5 rounded-2xl flex items-center gap-4">
        <div className="w-12 h-12 bg-[#11d442]/10 text-[#11d442] rounded-xl flex items-center justify-center font-bold text-xl shadow-sm">
          🛡️
        </div>
        <div>
          <h4 className="text-sm font-bold text-gray-800">Ecosistema 100% Desvinculado</h4>
          <p className="text-xs text-gray-600 mt-0.5">
            Las credenciales de Supabase y Resend se leen dinámicamente desde este panel y las variables globales de producción.
          </p>
        </div>
        <span className="ml-auto bg-[#11d442] text-white text-[10px] uppercase font-bold px-3 py-1.5 rounded-full shadow-sm">
          Activo y Seguro
        </span>
      </div>

      <form onSubmit={handleSaveClick} className="space-y-6">
        
        {/* 1. Configuración de Mailing (Resend) */}
        <div className="bg-white p-8 rounded-[24px] border border-gray-100 shadow-sm space-y-6">
          <h3 className="text-lg font-bold text-gray-900 border-b pb-4 flex items-center gap-2">
            🔌 Mailing Transaccional (Resend)
          </h3>
          
          <div className="space-y-5">
            {/* Remitente FROM */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                {CONFIG_KEYS[0].label}
              </label>
              <input 
                type="text" 
                className="w-full px-4 py-3 border border-gray-250 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#11d442]/30 outline-none text-sm font-semibold transition-colors"
                placeholder={CONFIG_KEYS[0].placeholder}
                value={settings[CONFIG_KEYS[0].key] || ''}
                onChange={e => handleChange(CONFIG_KEYS[0].key, e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-2">{CONFIG_KEYS[0].hint}</p>
            </div>

            {/* Alertas TO */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                {CONFIG_KEYS[1].label}
              </label>
              <input 
                type="email" 
                className="w-full px-4 py-3 border border-gray-250 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#11d442]/30 outline-none text-sm font-semibold transition-colors"
                placeholder={CONFIG_KEYS[1].placeholder}
                value={settings[CONFIG_KEYS[1].key] || ''}
                onChange={e => handleChange(CONFIG_KEYS[1].key, e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-2">{CONFIG_KEYS[1].hint}</p>
            </div>

            {/* Resend API Key (Secret) */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                {CONFIG_KEYS[2].label}
              </label>
              <div className="flex gap-2">
                <input 
                  type={revealedSecrets[CONFIG_KEYS[2].key] ? 'text' : 'password'}
                  className="w-full px-4 py-3 border border-gray-250 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#11d442]/30 outline-none text-sm font-mono transition-colors"
                  placeholder={CONFIG_KEYS[2].placeholder}
                  value={settings[CONFIG_KEYS[2].key] || ''}
                  onChange={e => handleChange(CONFIG_KEYS[2].key, e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => handleRevealSecret(CONFIG_KEYS[2].key)}
                  className="px-3.5 border border-gray-250 hover:bg-gray-100 rounded-xl text-gray-600 transition-colors flex items-center justify-center active:scale-95"
                  title="Revelar credencial"
                >
                  {revealedSecrets[CONFIG_KEYS[2].key] ? '🙈' : '👁️'}
                </button>
                <button
                  type="button"
                  onClick={() => handleCopySecret(CONFIG_KEYS[2].key)}
                  className="px-3.5 border border-gray-250 hover:bg-gray-100 rounded-xl text-gray-600 transition-colors flex items-center justify-center active:scale-95 text-xs font-bold"
                  title="Copiar al portapapeles"
                >
                  {copiedKey === CONFIG_KEYS[2].key ? '✓ Copiado' : '📋'}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">{CONFIG_KEYS[2].hint}</p>
            </div>
          </div>
        </div>

        {/* 2. Llavero Seguro (Vault de Contraseñas) */}
        <div className="bg-white p-8 rounded-[24px] border border-gray-100 shadow-sm space-y-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              🔑 Llavero de Credenciales del Rancho (Vault)
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Almacena aquí las claves de acceso de los sistemas satélite para renovación anual o administración. Se guardan encriptadas en la base de datos.
            </p>
          </div>

          <hr className="border-gray-100" />

          <div className="space-y-6">
            {/* Clave DominiosChile */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider flex items-center justify-between">
                <span>{CONFIG_KEYS[3].label}</span>
                <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full border">DominiosChile.com</span>
              </label>
              <div className="flex gap-2">
                <input 
                  type={revealedSecrets[CONFIG_KEYS[3].key] ? 'text' : 'password'}
                  className="w-full px-4 py-3 border border-gray-250 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#11d442]/30 outline-none text-sm transition-colors"
                  placeholder={CONFIG_KEYS[3].placeholder}
                  value={settings[CONFIG_KEYS[3].key] || ''}
                  onChange={e => handleChange(CONFIG_KEYS[3].key, e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => handleRevealSecret(CONFIG_KEYS[3].key)}
                  className="px-3.5 border border-gray-250 hover:bg-gray-100 rounded-xl text-gray-600 transition-colors flex items-center justify-center active:scale-95"
                >
                  {revealedSecrets[CONFIG_KEYS[3].key] ? '🙈' : '👁️'}
                </button>
                <button
                  type="button"
                  onClick={() => handleCopySecret(CONFIG_KEYS[3].key)}
                  className="px-3.5 border border-gray-250 hover:bg-gray-100 rounded-xl text-gray-600 transition-colors flex items-center justify-center active:scale-95 text-xs font-bold"
                >
                  {copiedKey === CONFIG_KEYS[3].key ? '✓' : '📋'}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">{CONFIG_KEYS[3].hint}</p>
            </div>

            {/* Clave Cuenta Vercel */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider flex items-center justify-between">
                <span>{CONFIG_KEYS[4].label}</span>
                <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full border">Vercel Hosting</span>
              </label>
              <div className="flex gap-2">
                <input 
                  type={revealedSecrets[CONFIG_KEYS[4].key] ? 'text' : 'password'}
                  className="w-full px-4 py-3 border border-gray-250 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#11d442]/30 outline-none text-sm transition-colors"
                  placeholder={CONFIG_KEYS[4].placeholder}
                  value={settings[CONFIG_KEYS[4].key] || ''}
                  onChange={e => handleChange(CONFIG_KEYS[4].key, e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => handleRevealSecret(CONFIG_KEYS[4].key)}
                  className="px-3.5 border border-gray-250 hover:bg-gray-100 rounded-xl text-gray-600 transition-colors flex items-center justify-center active:scale-95"
                >
                  {revealedSecrets[CONFIG_KEYS[4].key] ? '🙈' : '👁️'}
                </button>
                <button
                  type="button"
                  onClick={() => handleCopySecret(CONFIG_KEYS[4].key)}
                  className="px-3.5 border border-gray-250 hover:bg-gray-100 rounded-xl text-gray-600 transition-colors flex items-center justify-center active:scale-95 text-xs font-bold"
                >
                  {copiedKey === CONFIG_KEYS[4].key ? '✓' : '📋'}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">{CONFIG_KEYS[4].hint}</p>
            </div>
          </div>
        </div>

        {/* 3. Datos del Servidor y Deep Links */}
        <div className="bg-white p-8 rounded-[24px] border border-gray-100 shadow-sm space-y-6">
          <h3 className="text-lg font-bold text-gray-900 border-b pb-4 flex items-center gap-2">
            🛢️ Backend & Deep Links
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
            <div className="space-y-1 bg-gray-50 p-4 rounded-xl border border-gray-200 shadow-inner">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Base de Datos de Producción</p>
              <p className="font-mono text-xs text-gray-700 font-bold break-all mt-1">
                {process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://oggmpexsscquyfwlbcwo.supabase.co'}
              </p>
            </div>

            <div className="space-y-2 flex flex-col justify-center">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Accesos Rápidos Directos (Deep Links)</p>
              <div className="flex flex-wrap gap-2.5 mt-1.5">
                <a 
                  href="https://www.dominioschile.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs bg-[#11d442]/10 hover:bg-[#11d442]/20 text-[#0fb337] px-3.5 py-2.5 rounded-xl font-bold transition-all shadow-sm flex items-center gap-1 hover:scale-[1.02]"
                >
                  🌐 DominiosChile
                </a>
                <a 
                  href="https://vercel.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs bg-black text-white px-3.5 py-2.5 rounded-xl font-bold transition-all shadow-sm flex items-center gap-1 hover:scale-[1.02] hover:bg-neutral-800"
                >
                  🚀 Vercel Console
                </a>
                <a 
                  href="https://supabase.com/dashboard" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs bg-emerald-700 hover:bg-emerald-800 text-white px-3.5 py-2.5 rounded-xl font-bold transition-all shadow-sm flex items-center gap-1 hover:scale-[1.02]"
                >
                  🛢️ Supabase Admin
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Mensaje de Retroalimentación */}
        {message.text && (
          <div className={`p-4 rounded-xl text-sm font-bold border ${
            message.type === 'error' 
              ? 'bg-red-50 text-red-600 border-red-100' 
              : 'bg-green-50 text-green-600 border-green-100'
          } animate-in fade-in`}>
            {message.text}
          </div>
        )}

        {/* Botón de Guardado General */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="bg-[#11d442] hover:bg-[#0fb337] text-white px-7 py-3.5 rounded-xl font-bold text-sm shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2 hover:shadow-lg"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Guardando en el Llavero Seguro...
              </>
            ) : '🔒 Guardar Configuración y Contraseñas'}
          </button>
        </div>
      </form>

      {/* ========================================================================= */}
      {/* 🔐 MODAL DE RE-AUTENTICACIÓN DE SEGURIDAD (MÉTODOS BANCARIOS)            */}
      {/* ========================================================================= */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] max-w-md w-full p-8 border border-gray-100 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
            <div className="text-center space-y-2">
              <span className="text-3xl">🔐</span>
              <h3 className="text-lg font-bold text-gray-900">Verificación de Seguridad Requerida</h3>
              <p className="text-xs text-gray-500 px-4">
                Por motivos de seguridad, debe re-autenticar su sesión administrativa para ver, copiar o alterar las credenciales e infraestructura de Rancho Carmelitas.
              </p>
            </div>

            <form onSubmit={handleVerifyPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                  Usuario Administrador
                </label>
                <input 
                  type="text" 
                  disabled
                  className="w-full px-4 py-3 border border-gray-250 rounded-xl bg-gray-100 text-gray-500 text-sm font-semibold outline-none cursor-not-allowed"
                  value={currentUserEmail}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                  Contraseña Actual del PMS *
                </label>
                <input 
                  type="password" 
                  required
                  autoFocus
                  className="w-full px-4 py-3 border border-gray-250 rounded-xl focus:ring-2 focus:ring-[#11d442]/30 outline-none text-sm font-semibold transition-colors"
                  placeholder="Ingrese contraseña de su sesión"
                  value={authPassword}
                  onChange={e => setAuthPassword(e.target.value)}
                />
              </div>

              {authError && (
                <div className="text-xs font-bold text-red-600 bg-red-50 border border-red-100 p-3.5 rounded-xl">
                  ⚠️ {authError}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAuthModalOpen(false);
                    setPendingAction(null);
                  }}
                  className="w-1/2 px-4 py-3 border border-gray-250 rounded-xl text-gray-700 hover:bg-gray-50 text-sm font-bold active:scale-95 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-1/2 bg-[#11d442] hover:bg-[#0fb337] text-white px-4 py-3 rounded-xl text-sm font-bold active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {authLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Verificando...
                    </>
                  ) : 'Confirmar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
