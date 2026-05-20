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

  useEffect(() => {
    fetchSettings();
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

      {message.text && (
        <div className={`p-4 rounded-xl text-sm font-bold ${message.type === 'error' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'}`}>
          {message.text}
        </div>
      )}

      <Button onClick={handleSave} disabled={saving}>
        {saving ? 'Guardando...' : 'Guardar Configuraciones'}
      </Button>
    </div>
  );
}
