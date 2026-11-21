'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';

interface Setting {
  key: string;
  value: string;
  description?: string;
}

export interface VenuePricingTier {
  id: string;
  name: string;
  min_guests: number;
  max_guests: number;
  base_price: number;
  included_guests: number;
  extra_guest_fee: number;
}

const SETTING_KEYS = [
  { key: 'whatsapp_number', label: 'Número de WhatsApp', placeholder: 'Ej: 56912345678', hint: 'Número con código de país (56 para Chile), sin + ni espacios.' },
  { key: 'company_name', label: 'Nombre de la Empresa / Rancho', placeholder: 'Ej: Rancho Carmelitas', hint: 'Aparece en el encabezado de todos los correos.' },
  { key: 'company_rut', label: 'RUT (Opcional)', placeholder: 'Ej: 12.345.678-9', hint: 'Se mostrará en los correos de confirmación.' },
  { key: 'company_address', label: 'Dirección', placeholder: 'Ej: Camino Los Álamos 123, Región del Maule', hint: 'Dirección física del rancho.' },
  { key: 'company_phone', label: 'Teléfono de Contacto', placeholder: 'Ej: +56 9 8765 4321', hint: 'Teléfono que verá el cliente en el correo.' },
  { key: 'company_email', label: 'Email de Contacto', placeholder: 'Ej: contacto@ranchocarmelitas.cl', hint: 'Email visible en los correos (no necesariamente el de envío).' },
  { key: 'default_admin_commission', label: 'Comisión de Administración por Defecto (%)', placeholder: 'Ej: 10', hint: 'Porcentaje de comisión administrativa aplicado por defecto al crear reservas manuales.' },
];

const DEFAULT_VENUE_TIERS: VenuePricingTier[] = [
  { id: 'tier-1', name: 'Paseo Estándar / Mediano (hasta 29 personas)', min_guests: 1, max_guests: 29, base_price: 180000, included_guests: 15, extra_guest_fee: 3500 },
  { id: 'tier-2', name: 'Paseo Grande (30 a 70 personas)', min_guests: 30, max_guests: 70, base_price: 250000, included_guests: 30, extra_guest_fee: 3500 }
];

// Auto-encadenamiento para garantizar continuidad matemática perfecta (sin vacíos ni solapamientos)
export const rechainTiers = (tiers: VenuePricingTier[]): VenuePricingTier[] => {
  let nextMin = 1;
  return tiers.map((tier, idx) => {
    const minG = idx === 0 ? 1 : nextMin;
    const inc = Math.max(1, Number(tier.included_guests) || 1);
    const extra = Math.max(0, Number(tier.max_guests) - Number(tier.included_guests) || 0);
    const maxG = Math.max(minG, inc + extra);
    nextMin = maxG + 1;
    return {
      ...tier,
      min_guests: minG,
      max_guests: maxG,
      included_guests: inc,
    };
  });
};

export default function AdminConfiguracionesPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [savingGlobal, setSavingGlobal] = useState(false);
  const [globalMessage, setGlobalMessage] = useState({ text: '', type: '' });

  // Estados para Tarifas de Arriendo de Recinto Completo (8h)
  const [pricingTiers, setPricingTiers] = useState<VenuePricingTier[]>(DEFAULT_VENUE_TIERS);
  const [bouncyCastleFee, setBouncyCastleFee] = useState<number>(5000);
  const [depositPercentage, setDepositPercentage] = useState<number>(50);
  const [maxCapacity, setMaxCapacity] = useState<number>(70);
  const [savingVenue, setSavingVenue] = useState(false);
  const [venueMessage, setVenueMessage] = useState({ text: '', type: '' });
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    setLoading(true);
    const { data } = await supabase
      .from('settings')
      .select('key, value');
    
    if (data) {
      const map: Record<string, string> = {};
      data.forEach((s: Setting) => { map[s.key] = s.value; });
      setSettings(map);

      // Cargar configuración de recinto
      if (map['venue_pricing_tiers']) {
        try {
          const parsed = JSON.parse(map['venue_pricing_tiers']);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setPricingTiers(rechainTiers(parsed));
          }
        } catch (e) {
          console.warn('Error al parsear venue_pricing_tiers de settings, usando default:', e);
        }
      }

      if (map['venue_bouncy_castle_fee']) {
        const val = Number(map['venue_bouncy_castle_fee']);
        if (!isNaN(val)) setBouncyCastleFee(val);
      }

      if (map['venue_deposit_percentage']) {
        const val = Number(map['venue_deposit_percentage']);
        if (!isNaN(val)) setDepositPercentage(val);
      }

      if (map['venue_max_capacity']) {
        const val = Number(map['venue_max_capacity']);
        if (!isNaN(val)) setMaxCapacity(val);
      }
    }
    setLoading(false);
  }

  // Validación de continuidad matemática y rangos lógicos
  const validateTiers = (tiers: VenuePricingTier[], cap: number = maxCapacity): string | null => {
    if (tiers.length === 0) {
      return 'Debe existir al menos un tramo de precio configurado.';
    }

    const sorted = [...tiers].sort((a, b) => a.min_guests - b.min_guests);

    for (let i = 0; i < sorted.length; i++) {
      const current = sorted[i];

      if (!current.name || !current.name.trim()) {
        return `El tramo #${i + 1} debe tener un nombre asignado.`;
      }

      if (current.included_guests < 1) {
        return `El tramo "${current.name}" debe incluir al menos 1 persona base.`;
      }

      if (current.base_price < 0 || isNaN(current.base_price)) {
        return `El precio base del tramo "${current.name}" debe ser un monto válido mayor o igual a $0.`;
      }

      if (current.extra_guest_fee < 0 || isNaN(current.extra_guest_fee)) {
        return `La tarifa adicional del tramo "${current.name}" debe ser mayor o igual a $0.`;
      }

      if (current.max_guests < current.min_guests) {
        return `En el tramo "${current.name}", el alcance total (${current.max_guests}) no puede ser menor al inicio (${current.min_guests}).`;
      }

      if (i > 0) {
        const previous = sorted[i - 1];
        const expectedMin = previous.max_guests + 1;
        if (current.min_guests !== expectedMin) {
          return `Error de continuidad: El tramo "${current.name}" comienza en ${current.min_guests} pers., pero el tramo anterior finaliza en ${previous.max_guests}. Debe comenzar en ${expectedMin} pers.`;
        }
      }
    }

    if (cap < 10) {
      return 'El aforo máximo del recinto debe ser de al menos 10 personas.';
    }

    if (depositPercentage < 10 || depositPercentage > 100) {
      return 'El porcentaje de abono debe situarse entre el 10% y el 100%.';
    }

    // Validación de coherencia entre Aforo Máximo y Tramos
    if (sorted.length > 0) {
      const highestTier = sorted[sorted.length - 1];
      if (cap < highestTier.max_guests) {
        return `Incoherencia de Aforo: El Aforo Máximo del Recinto (${cap} pers.) no puede ser menor que el alcance de tus tramos (${highestTier.max_guests} pers.). Sube el aforo o reduce los adicionales del tramo "${highestTier.name}".`;
      }
    }

    return null;
  };

  const handleChangeGlobal = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  // Guardar configuraciones corporativas y de contacto
  const handleSaveGlobal = async () => {
    setSavingGlobal(true);
    setGlobalMessage({ text: '', type: '' });

    const upserts = SETTING_KEYS.map(({ key }) => ({
      key,
      value: settings[key] || '',
    }));

    const { error } = await supabase
      .from('settings')
      .upsert(upserts, { onConflict: 'key' });

    setSavingGlobal(false);

    if (error) {
      setGlobalMessage({ text: 'Error al guardar: ' + error.message, type: 'error' });
    } else {
      setGlobalMessage({ text: '✓ Configuraciones globales guardadas exitosamente.', type: 'success' });
      setTimeout(() => setGlobalMessage({ text: '', type: '' }), 3500);
    }
  };

  // Agregar nuevo tramo de precio contiguo
  const handleAddTier = () => {
    const lastTier = pricingTiers[pricingTiers.length - 1];
    const nextMin = lastTier ? lastTier.max_guests + 1 : 1;
    const defaultExtra = 30;

    const newTier: VenuePricingTier = {
      id: `tier-${Date.now()}`,
      name: `Paseo Especial (desde ${nextMin} personas)`,
      min_guests: nextMin,
      max_guests: nextMin + defaultExtra,
      base_price: (lastTier?.base_price || 250000) + 50000,
      included_guests: nextMin,
      extra_guest_fee: lastTier?.extra_guest_fee || 3500,
    };

    const updated = rechainTiers([...pricingTiers, newTier]);
    setPricingTiers(updated);
    setValidationError(validateTiers(updated));
  };

  // Eliminar tramo
  const handleDeleteTier = (index: number) => {
    if (pricingTiers.length <= 1) {
      alert('Debe mantenerse al menos un tramo de precio activo.');
      return;
    }
    const updated = rechainTiers(pricingTiers.filter((_, i) => i !== index));
    setPricingTiers(updated);
    setValidationError(validateTiers(updated));
  };

  // Actualizar personas base incluidas
  const handleUpdateIncludedGuests = (index: number, newIncluded: number) => {
    setPricingTiers(prev => {
      const updated = prev.map((t, idx) => {
        if (idx !== index) return t;
        const inc = Math.max(1, isNaN(newIncluded) ? 1 : newIncluded);
        const currentExtra = Math.max(0, t.max_guests - t.included_guests);
        return {
          ...t,
          included_guests: inc,
          max_guests: inc + currentExtra
        };
      });
      const recomputed = rechainTiers(updated);
      setValidationError(validateTiers(recomputed));
      return recomputed;
    });
  };

  // Actualizar máximo de adicionales permitidos
  const handleUpdateMaxExtra = (index: number, newMaxExtra: number) => {
    setPricingTiers(prev => {
      const updated = prev.map((t, idx) => {
        if (idx !== index) return t;
        const extra = Math.max(0, isNaN(newMaxExtra) ? 0 : newMaxExtra);
        return {
          ...t,
          max_guests: t.included_guests + extra
        };
      });
      const recomputed = rechainTiers(updated);
      setValidationError(validateTiers(recomputed));
      return recomputed;
    });
  };

  // Actualizar campo genérico (nombre, precio base, valor adicional)
  const handleUpdateTierField = (index: number, field: keyof VenuePricingTier, value: any) => {
    setPricingTiers(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      setValidationError(validateTiers(updated));
      return updated;
    });
  };

  // Guardar tarifas de recinto completo
  const handleSaveVenueSettings = async () => {
    const err = validateTiers(pricingTiers);
    if (err) {
      setValidationError(err);
      setVenueMessage({ text: err, type: 'error' });
      return;
    }

    setSavingVenue(true);
    setVenueMessage({ text: '', type: '' });
    setValidationError(null);

    // Asegurar ordenamiento antes de guardar
    const sortedTiers = [...pricingTiers].sort((a, b) => a.min_guests - b.min_guests);

    const upserts = [
      {
        key: 'venue_pricing_tiers',
        value: JSON.stringify(sortedTiers),
        description: 'Tramos dinámicos de asistentes y precios para arriendo de recinto completo (8h) en formato JSON'
      },
      {
        key: 'venue_bouncy_castle_fee',
        value: String(bouncyCastleFee),
        description: 'Tarifa en CLP por consumo eléctrico si el cliente trae juego inflable'
      },
      {
        key: 'venue_deposit_percentage',
        value: String(depositPercentage),
        description: 'Porcentaje de abono requerido para confirmar la reserva de recinto completo'
      },
      {
        key: 'venue_max_capacity',
        value: String(maxCapacity),
        description: 'Aforo máximo permitido de personas en el recinto para eventos diurnos'
      }
    ];

    const { error } = await supabase
      .from('settings')
      .upsert(upserts, { onConflict: 'key' });

    setSavingVenue(false);

    if (error) {
      setVenueMessage({ text: 'Error al guardar tarifas: ' + error.message, type: 'error' });
    } else {
      setVenueMessage({ text: '✓ Tarifas, tramos y parámetros de recinto guardados exitosamente.', type: 'success' });
      setTimeout(() => setVenueMessage({ text: '', type: '' }), 4000);
    }
  };

  const handleResetToDefaultTiers = () => {
    if (confirm('¿Restablecer los tramos a la configuración oficial simplificada (Tramo 1: 1 a 29 pers. con 15 base / Tramo 2: 30 a 70 pers. con 30 base)?')) {
      setPricingTiers(DEFAULT_VENUE_TIERS);
      setBouncyCastleFee(5000);
      setDepositPercentage(50);
      setMaxCapacity(70);
      setValidationError(null);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500 font-medium">Cargando configuraciones globales...</div>;
  }

  const sortedTiers = [...pricingTiers].sort((a, b) => a.min_guests - b.min_guests);
  const highestTier = sortedTiers.length > 0 ? sortedTiers[sortedTiers.length - 1] : null;
  const maxTierGuests = highestTier ? highestTier.max_guests : 0;

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Configuraciones Globales del Sistema</h2>
        <p className="text-gray-500 text-sm">Administra las tarifas dinámicas de arriendo de recinto, datos corporativos y canales de contacto.</p>
      </div>

      {/* ========================================================================= */}
      {/* SECCIÓN 1: TARIFAS Y TRAMOS DE ARRIENDO DE RECINTO COMPLETO (8H)          */}
      {/* ========================================================================= */}
      <div className="bg-white p-6 md:p-8 rounded-[24px] border border-gray-100 shadow-sm space-y-6">
        <div className="border-b border-gray-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              🎉 Tarifas y Tramos de Arriendo de Recinto Completo (8 Horas)
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Configura los rangos de precios por cantidad de personas, costos de adicionales, aforo máximo y porcentaje de abono.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetToDefaultTiers}
              className="text-xs text-gray-500 hover:text-gray-800 px-3 py-1.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              title="Restablece los valores estándar iniciales"
            >
              Restablecer Valores
            </button>
            <button
              type="button"
              onClick={handleAddTier}
              className="bg-[#11d442] hover:bg-green-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
            >
              <span>➕</span> Agregar Nuevo Rango
            </button>
          </div>
        </div>

        {/* Parámetros Generales de Recinto */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-emerald-50/40 border border-emerald-100 rounded-2xl">
          <div>
            <label className="block text-xs font-bold text-emerald-950 uppercase mb-1">
              Aforo Máximo del Recinto
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="10"
                max="500"
                className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-xl text-sm font-bold text-emerald-900 outline-none focus:ring-2 focus:ring-[#11d442]"
                value={maxCapacity}
                onChange={e => {
                  const val = Number(e.target.value);
                  setMaxCapacity(val);
                  setValidationError(validateTiers(pricingTiers, val));
                }}
              />
              <span className="text-xs font-bold text-emerald-700">personas</span>
            </div>
            <p className="text-[10px] text-emerald-700/80 mt-1">Límite físico permitido antes de exigir WhatsApp.</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-emerald-950 uppercase mb-1">
              Recargo por Inflable (CLP)
            </label>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-emerald-700">$</span>
              <input
                type="number"
                min="0"
                step="1000"
                className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-xl text-sm font-bold text-emerald-900 outline-none focus:ring-2 focus:ring-[#11d442]"
                value={bouncyCastleFee}
                onChange={e => setBouncyCastleFee(Number(e.target.value))}
              />
            </div>
            <p className="text-[10px] text-emerald-700/80 mt-1">Cobro por consumo eléctrico de turbina.</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-emerald-950 uppercase mb-1">
              Abono Requerido (%)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="10"
                max="100"
                step="5"
                className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-xl text-sm font-bold text-emerald-900 outline-none focus:ring-2 focus:ring-[#11d442]"
                value={depositPercentage}
                onChange={e => {
                  const val = Number(e.target.value);
                  setDepositPercentage(val);
                  setValidationError(validateTiers(pricingTiers));
                }}
              />
              <span className="text-sm font-bold text-emerald-700">%</span>
            </div>
            <p className="text-[10px] text-emerald-700/80 mt-1">Porcentaje del total cobrado para reservar (def: 50%).</p>
          </div>
        </div>

        {/* Banner de Sincronización y Validación de Aforo */}
        {maxTierGuests > 0 && (
          <div>
            {maxCapacity === maxTierGuests ? (
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 bg-emerald-50 px-3.5 py-2.5 rounded-xl border border-emerald-200">
                <span className="text-emerald-600 font-bold">✓</span>
                <span>Aforo sincronizado: Tus tramos cubren exactamente el 100% del aforo máximo permitido ({maxCapacity} personas).</span>
              </div>
            ) : maxCapacity < maxTierGuests ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-semibold text-amber-900 bg-amber-50 px-3.5 py-2.5 rounded-xl border border-amber-200">
                <div className="flex items-center gap-2">
                  <span className="text-amber-600 font-bold">⚠️</span>
                  <span>Aforo menor al tramo: El Aforo Máximo ({maxCapacity} pers.) es menor al alcance de tus tramos ({maxTierGuests} pers.).</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMaxCapacity(maxTierGuests);
                    setValidationError(validateTiers(pricingTiers, maxTierGuests));
                  }}
                  className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-bold transition-colors whitespace-nowrap cursor-pointer shadow-xs"
                >
                  Alinear Aforo a {maxTierGuests} pers.
                </button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-semibold text-blue-900 bg-blue-50 px-3.5 py-2.5 rounded-xl border border-blue-200">
                <div className="flex items-center gap-2">
                  <span className="text-blue-600 font-bold">ℹ️</span>
                  <span>Margen de aforo: El recinto permite hasta {maxCapacity} pers., pero tus tramos terminan en {maxTierGuests} pers. (Grupos entre {maxTierGuests + 1} y {maxCapacity} pers. no tendrán tarifa).</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMaxCapacity(maxTierGuests);
                    setValidationError(validateTiers(pricingTiers, maxTierGuests));
                  }}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold transition-colors whitespace-nowrap cursor-pointer shadow-xs"
                >
                  Ajustar Aforo a {maxTierGuests} pers.
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tabla Interactiva de Tramos de Precios y Adicionales */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Tramos de Precio y Adicionales Activos ({pricingTiers.length})
            </h4>
            <span className="text-[11px] text-gray-400">
              * El aforo total de cada tramo se auto-calcula (Personas Base + Máx. Adicionales) sin vacíos tarifarios.
            </span>
          </div>

          <div className="overflow-x-auto border border-gray-100 rounded-2xl shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 font-bold uppercase text-[10px]">
                  <th className="p-3">Nombre del Tramo</th>
                  <th className="p-3 w-28 text-center" title="Cantidad de personas cubiertas dentro del precio base">
                    Personas Base
                  </th>
                  <th className="p-3 w-32">Precio Base ($)</th>
                  <th className="p-3 w-28 text-center" title="Máximo de personas extras permitidas sobre la base">
                    Máx. Adicionales
                  </th>
                  <th className="p-3 w-32">Valor Adicional ($/pers.)</th>
                  <th className="p-3 w-36 text-center">Aforo del Tramo</th>
                  <th className="p-3 w-16 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {pricingTiers.map((tier, idx) => {
                  const maxExtra = Math.max(0, tier.max_guests - tier.included_guests);
                  return (
                    <tr key={tier.id || idx} className="hover:bg-gray-50/60 transition-colors">
                      {/* Nombre */}
                      <td className="p-2.5">
                        <input
                          type="text"
                          className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-[#11d442] font-semibold text-gray-800"
                          value={tier.name}
                          onChange={e => handleUpdateTierField(idx, 'name', e.target.value)}
                          placeholder="Ej. Paseo Estándar"
                        />
                      </td>

                      {/* Personas Base */}
                      <td className="p-2.5">
                        <input
                          type="number"
                          min="1"
                          className="w-full px-2 py-1.5 border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-[#11d442] text-center font-bold text-gray-900"
                          value={tier.included_guests}
                          onChange={e => handleUpdateIncludedGuests(idx, Number(e.target.value))}
                          title="Cantidad de asistentes cubiertos por el precio base"
                        />
                      </td>

                      {/* Precio Base */}
                      <td className="p-2.5">
                        <div className="flex items-center gap-1">
                          <span className="text-gray-400 font-bold">$</span>
                          <input
                            type="number"
                            min="0"
                            step="5000"
                            className="w-full px-2 py-1.5 border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-[#11d442] font-bold text-gray-900"
                            value={tier.base_price}
                            onChange={e => handleUpdateTierField(idx, 'base_price', Number(e.target.value))}
                          />
                        </div>
                      </td>

                      {/* Máx. Adicionales */}
                      <td className="p-2.5">
                        <input
                          type="number"
                          min="0"
                          className="w-full px-2 py-1.5 border border-emerald-200 bg-emerald-50/30 rounded-lg outline-none focus:ring-1 focus:ring-[#11d442] text-center font-bold text-emerald-900"
                          value={maxExtra}
                          onChange={e => handleUpdateMaxExtra(idx, Number(e.target.value))}
                          title="Máximo de personas extras permitidas en este tramo"
                        />
                      </td>

                      {/* Valor Adicional por Persona */}
                      <td className="p-2.5">
                        <div className="flex items-center gap-1">
                          <span className="text-gray-400 font-bold">$</span>
                          <input
                            type="number"
                            min="0"
                            step="500"
                            className="w-full px-2 py-1.5 border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-[#11d442] font-medium text-gray-700"
                            value={tier.extra_guest_fee}
                            onChange={e => handleUpdateTierField(idx, 'extra_guest_fee', Number(e.target.value))}
                          />
                        </div>
                      </td>

                      {/* Aforo / Alcance del Tramo (Auto-calculado) */}
                      <td className="p-2.5 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 whitespace-nowrap">
                            {tier.min_guests} a {tier.max_guests} pers.
                          </span>
                          <span className="text-[10px] text-gray-400 mt-0.5">
                            (Máx. {tier.max_guests} pers.)
                          </span>
                        </div>
                      </td>

                      {/* Botón Eliminar */}
                      <td className="p-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteTier(idx)}
                          disabled={pricingTiers.length <= 1}
                          className="w-7 h-7 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-20 inline-flex items-center justify-center font-bold text-sm"
                          title="Eliminar este tramo"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Alerta de validación matemática */}
        {validationError && (
          <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold flex items-center gap-2">
            <span>⚠️</span>
            <span>{validationError}</span>
          </div>
        )}

        {/* Mensaje de resultado */}
        {venueMessage.text && (
          <div className={`p-3.5 rounded-xl text-xs font-bold ${
            venueMessage.type === 'error' 
              ? 'bg-red-50 text-red-600 border border-red-100' 
              : 'bg-green-50 text-green-700 border border-green-100'
          }`}>
            {venueMessage.text}
          </div>
        )}

        {/* Botón de guardado de tarifas */}
        <div className="flex justify-end pt-2 border-t border-gray-50">
          <button
            type="button"
            onClick={handleSaveVenueSettings}
            disabled={savingVenue || !!validationError}
            className="bg-[#11d442] hover:bg-green-600 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-sm flex items-center gap-2 text-sm disabled:opacity-50"
          >
            {savingVenue ? 'Guardando Tarifas...' : '✓ Guardar Tarifas de Recinto'}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECCIÓN 2: CONTACTO Y REDES CORPORATIVAS                                 */}
      {/* ========================================================================= */}
      <div className="bg-white p-6 md:p-8 rounded-[24px] border border-gray-100 shadow-sm space-y-6">
        <h3 className="text-lg font-bold text-gray-900 border-b pb-4">📱 Contacto y Redes</h3>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            {SETTING_KEYS[0].label}
          </label>
          <input 
            type="text" 
            className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#11d442] bg-gray-50 focus:bg-white transition-colors text-sm"
            placeholder={SETTING_KEYS[0].placeholder}
            value={settings[SETTING_KEYS[0].key] || ''}
            onChange={(e) => handleChangeGlobal(SETTING_KEYS[0].key, e.target.value)}
          />
          <p className="text-xs text-gray-500 mt-2">{SETTING_KEYS[0].hint}</p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECCIÓN 3: DATOS DE LA EMPRESA Y CORREOS                                 */}
      {/* ========================================================================= */}
      <div className="bg-white p-6 md:p-8 rounded-[24px] border border-gray-100 shadow-sm space-y-6">
        <h3 className="text-lg font-bold text-gray-900 border-b pb-4">🏢 Datos de la Empresa</h3>
        <p className="text-sm text-gray-500 -mt-2">Esta información aparece en el pie de todos los correos enviados a los clientes.</p>
        
        {SETTING_KEYS.slice(1).map(({ key, label, placeholder, hint }) => (
          <div key={key}>
            <label className="block text-sm font-bold text-gray-700 mb-2">{label}</label>
            <input 
              type="text" 
              className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#11d442] bg-gray-50 focus:bg-white transition-colors text-sm"
              placeholder={placeholder}
              value={settings[key] || ''}
              onChange={(e) => handleChangeGlobal(key, e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">{hint}</p>
          </div>
        ))}
      </div>

      {/* Mensaje global */}
      {globalMessage.text && (
        <div className={`p-4 rounded-xl text-sm font-bold ${
          globalMessage.type === 'error' 
            ? 'bg-red-50 text-red-600 border border-red-100' 
            : 'bg-green-50 text-green-600 border border-green-100'
        }`}>
          {globalMessage.text}
        </div>
      )}

      {/* Botón de guardado global */}
      <div>
        <Button onClick={handleSaveGlobal} disabled={savingGlobal}>
          {savingGlobal ? 'Guardando...' : 'Guardar Configuraciones Globales'}
        </Button>
      </div>
    </div>
  );
}
