'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';

interface Setting {
  key: string;
  value: string;
  description?: string;
}

const SETTING_KEYS = [
  { key: 'whatsapp_number', label: 'Número de WhatsApp', placeholder: 'Ej: 56912345678', hint: 'Número con código de país (56 para Chile), sin + ni espacios.' },
  { key: 'company_name', label: 'Nombre de la Empresa / Rancho', placeholder: 'Ej: Rancho Carmelitas', hint: 'Aparece en el encabezado de todos los correos.' },
  { key: 'company_rut', label: 'RUT (Opcional)', placeholder: 'Ej: 12.345.678-9', hint: 'Se mostrará en los correos de confirmación.' },
  { key: 'company_address', label: 'Dirección', placeholder: 'Ej: Camino Los Álamos 123, Región del Maule', hint: 'Dirección física del rancho.' },
  { key: 'company_phone', label: 'Teléfono de Contacto', placeholder: 'Ej: +56 9 8765 4321', hint: 'Teléfono que verá el cliente en el correo.' },
  { key: 'company_email', label: 'Email de Contacto', placeholder: 'Ej: contacto@ranchocarmelitas.cl', hint: 'Email visible en los correos (no necesariamente el de envío).' },
];

export default function AdminConfiguracionesPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Estados para Canales/Plataformas
  const [plataformas, setPlataformas] = useState<any[]>([]);
  const [loadingPlats, setLoadingPlats] = useState(true);
  const [newPlatName, setNewPlatName] = useState('');
  const [newPlatCommission, setNewPlatCommission] = useState('');
  const [addingPlat, setAddingPlat] = useState(false);

  useEffect(() => {
    fetchSettings();
    fetchPlataformas();
  }, []);

  async function fetchSettings() {
    const { data, error } = await supabase
      .from('settings')
      .select('key, value');
    
    if (data) {
      const map: Record<string, string> = {};
      data.forEach((s: Setting) => { map[s.key] = s.value; });
      setSettings(map);
    }
    setLoading(false);
  }

  async function fetchPlataformas() {
    setLoadingPlats(true);
    const { data } = await supabase
      .from('plataformas')
      .select('id, nombre, comision_porcentaje')
      .order('nombre');
    setPlataformas(data || []);
    setLoadingPlats(false);
  }

  const handleAddPlataforma = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlatName || newPlatCommission === '') return;
    setAddingPlat(true);
    const commissionVal = Number(newPlatCommission) || 0;

    const { error } = await supabase.from('plataformas').insert([
      { nombre: newPlatName, comision_porcentaje: commissionVal }
    ]);

    setAddingPlat(false);
    if (error) {
      alert('Error al agregar plataforma: ' + error.message);
    } else {
      setNewPlatName('');
      setNewPlatCommission('');
      fetchPlataformas();
    }
  };

  const handleDeletePlataforma = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta plataforma de venta?')) return;
    const { error } = await supabase.from('plataformas').delete().eq('id', id);
    if (error) {
      alert('Error al eliminar plataforma: ' + error.message);
    } else {
      fetchPlataformas();
    }
  };

  const handleChange = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage({ text: '', type: '' });

    const upserts = SETTING_KEYS.map(({ key }) => ({
      key,
      value: settings[key] || '',
    }));

    const { error } = await supabase
      .from('settings')
      .upsert(upserts, { onConflict: 'key' });

    setSaving(false);

    if (error) {
      setMessage({ text: 'Error al guardar: ' + error.message, type: 'error' });
    } else {
      setMessage({ text: '✓ Configuraciones guardadas exitosamente.', type: 'success' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Cargando configuraciones...</div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Configuraciones Globales</h2>
        <p className="text-gray-500">Ajusta variables generales del sitio web y la empresa.</p>
      </div>

      {/* Contacto y Redes */}
      <div className="bg-white p-8 rounded-[24px] border border-gray-100 shadow-sm space-y-6">
        <h3 className="text-lg font-bold text-gray-900 border-b pb-4">📱 Contacto y Redes</h3>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            {SETTING_KEYS[0].label}
          </label>
          <input 
            type="text" 
            className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#11d442] bg-gray-50 focus:bg-white transition-colors"
            placeholder={SETTING_KEYS[0].placeholder}
            value={settings[SETTING_KEYS[0].key] || ''}
            onChange={(e) => handleChange(SETTING_KEYS[0].key, e.target.value)}
          />
          <p className="text-xs text-gray-500 mt-2">{SETTING_KEYS[0].hint}</p>
        </div>
      </div>

      {/* Datos de la Empresa */}
      <div className="bg-white p-8 rounded-[24px] border border-gray-100 shadow-sm space-y-6">
        <h3 className="text-lg font-bold text-gray-900 border-b pb-4">🏢 Datos de la Empresa</h3>
        <p className="text-sm text-gray-500 -mt-2">Esta información aparece en el pie de todos los correos enviados a los clientes.</p>
        
        {SETTING_KEYS.slice(1).map(({ key, label, placeholder, hint }) => (
          <div key={key}>
            <label className="block text-sm font-bold text-gray-700 mb-2">{label}</label>
            <input 
              type="text" 
              className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#11d442] bg-gray-50 focus:bg-white transition-colors"
              placeholder={placeholder}
              value={settings[key] || ''}
              onChange={(e) => handleChange(key, e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">{hint}</p>
          </div>
        ))}
      </div>

      {/* Canales de Venta / Plataformas */}
      <div className="bg-white p-8 rounded-[24px] border border-gray-100 shadow-sm space-y-6">
        <h3 className="text-lg font-bold text-gray-900 border-b pb-4 flex items-center gap-2">
          🔌 Canales de Venta y Comisiones
        </h3>
        <p className="text-sm text-gray-500 -mt-2">
          Administra las plataformas externas (Airbnb, Booking.com, etc.) conectadas a tu PMS. Las comisiones ingresadas aquí se aplicarán automáticamente al calcular los precios de las reservas manuales.
        </p>

        {/* Listado de Canales */}
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Canales Activos</h4>
          {loadingPlats ? (
            <div className="text-xs text-gray-400 italic">Cargando canales...</div>
          ) : plataformas.length === 0 ? (
            <div className="text-sm text-gray-400 italic bg-gray-50 p-4 rounded-xl text-center">
              No hay canales externos configurados. Las reservas serán únicamente Directas.
            </div>
          ) : (
            <div className="divide-y divide-gray-100 border border-gray-150 rounded-2xl overflow-hidden bg-white shadow-sm">
              {plataformas.map((plat) => (
                <div key={plat.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="font-bold text-sm text-gray-800 flex items-center gap-1.5">
                      🔌 {plat.nombre}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Comisión por defecto: <strong className="text-gray-700">{plat.comision_porcentaje}%</strong>
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeletePlataforma(plat.id)}
                    className="p-2 hover:bg-red-50 text-red-500 rounded-xl transition-all active:scale-95 border border-transparent hover:border-red-100 flex items-center justify-center"
                    title="Eliminar plataforma"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Agregar Plataforma Form */}
        <form onSubmit={handleAddPlataforma} className="bg-gray-50/50 p-5 rounded-2xl border border-gray-150 space-y-4 pt-4 mt-6">
          <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1">
            ➕ Agregar Nuevo Canal
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">Nombre del Canal *</label>
              <input 
                type="text" 
                required
                className="w-full px-4 py-2.5 border border-gray-250 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#11d442]/30 text-sm"
                placeholder="Ej: Expedia, Vrbo"
                value={newPlatName}
                onChange={e => setNewPlatName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">Comisión del Canal (%) *</label>
              <input 
                type="number" 
                required
                step="0.01"
                min="0"
                className="w-full px-4 py-2.5 border border-gray-250 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#11d442]/30 text-sm"
                placeholder="Ej: 12"
                value={newPlatCommission}
                onChange={e => setNewPlatCommission(e.target.value)}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={addingPlat || !newPlatName || newPlatCommission === ''}
            className="bg-[#11d442] hover:bg-[#0fb337] text-white px-5 py-2.5 rounded-[12px] font-bold text-xs shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5 self-start"
          >
            {addingPlat ? 'Agregando...' : 'Guardar Nuevo Canal'}
          </button>
        </form>
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl text-sm font-bold ${message.type === 'error' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'}`}>
          {message.text}
        </div>
      )}

      <Button onClick={handleSave} disabled={saving}>
        {saving ? 'Guardando...' : 'Guardar Configuraciones Globales'}
      </Button>
    </div>
  );
}
