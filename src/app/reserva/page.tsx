'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';

export default function BuscarReservaPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [results, setResults] = useState<any[]>([]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setErrorMsg('');
    setResults([]);

    try {
      const clean = query.trim();
      const isFullUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clean);

      // 1. Si es un UUID completo válido de 36 caracteres
      if (isFullUuid) {
        // A) Buscar en reservas de cabañas
        const { data: exactBooking } = await supabase
          .from('bookings')
          .select('id')
          .eq('id', clean.toLowerCase())
          .maybeSingle();

        if (exactBooking) {
          router.push(`/reserva/${exactBooking.id}`);
          return;
        }

        // B) Buscar en eventos de recinto completo
        const { data: exactEvent } = await supabase
          .from('event_quotes')
          .select('id')
          .eq('id', clean.toLowerCase())
          .maybeSingle();

        if (exactEvent) {
          router.push(`/recinto-completo/pago?id=${exactEvent.id}`);
          return;
        }
      }

      // 2. Búsqueda flexible multivariable en ambas tablas (Cabañas y Recinto Completo)
      const [{ data: allBookings }, { data: allEvents }] = await Promise.all([
        supabase
          .from('bookings')
          .select('id, guest_name, guest_email, guest_rut, guest_phone, check_in, check_out, total_price, status, cabins(name)')
          .order('created_at', { ascending: false })
          .limit(100),
        supabase
          .from('event_quotes')
          .select('id, organizer_name, organizer_email, organizer_rut, organizer_phone, group_name, group_type, event_date, start_time, end_time, total_amount, status')
          .order('created_at', { ascending: false })
          .limit(100)
      ]);

      const queryNormalized = clean.toLowerCase().replace(/[^a-z0-9]/g, '');
      const queryLower = clean.toLowerCase();

      // Normalizar registros de cabañas
      const cabinItems = (allBookings || []).map((b: any) => ({
        id: b.id,
        type: 'cabin' as const,
        title: (b.cabins as any)?.name || 'Cabaña',
        guestName: b.guest_name,
        email: (b.guest_email || '').toLowerCase(),
        rut: (b.guest_rut || '').toLowerCase().replace(/[^0-9k]/g, ''),
        phone: (b.guest_phone || '').replace(/[^0-9]/g, ''),
        dateInfo: `${formatearFecha(b.check_in)} al ${formatearFecha(b.check_out)}`,
        status: b.status,
        url: `/reserva/${b.id}`
      }));

      // Normalizar registros de eventos de recinto completo
      const eventItems = (allEvents || []).map((e: any) => ({
        id: e.id,
        type: 'event' as const,
        title: `[Recinto 8h] ${e.group_name || e.organizer_name}`,
        guestName: e.organizer_name,
        email: (e.organizer_email || '').toLowerCase(),
        rut: (e.organizer_rut || '').toLowerCase().replace(/[^0-9k]/g, ''),
        phone: (e.organizer_phone || '').replace(/[^0-9]/g, ''),
        dateInfo: `${formatearFecha(e.event_date)} (${e.start_time?.slice(0, 5)} a ${e.end_time?.slice(0, 5)} hrs)`,
        status: e.status === 'Cotizacion_Pendiente' ? 'Pendiente' : e.status,
        url: `/recinto-completo/pago?id=${e.id}`
      }));

      const unifiedList = [...cabinItems, ...eventItems];

      const matches = unifiedList.filter((item: any) => {
        const idLower = (item.id || '').toLowerCase();
        const idClean = idLower.replace(/[^a-z0-9]/g, '');
        const idShort = idLower.slice(0, 8);
        const email = item.email;
        const rut = item.rut;
        const name = (item.guestName || '').toLowerCase();
        const phone = item.phone;

        return (
          idShort === queryLower ||
          idClean.startsWith(queryNormalized) ||
          idLower === queryLower ||
          email.includes(queryLower) ||
          (rut && rut.includes(queryNormalized)) ||
          name.includes(queryLower) ||
          (phone && phone.includes(queryNormalized))
        );
      });

      if (matches.length === 1) {
        router.push(matches[0].url);
        return;
      } else if (matches.length > 1) {
        setResults(matches);
      } else {
        setErrorMsg(`No encontramos ninguna reserva o arriendo activo con el código o dato "${clean}". Por favor verifica que esté bien escrito.`);
      }

    } catch (err: any) {
      console.error('Error buscando reserva:', err);
      setErrorMsg('Ocurrió un problema de conexión al buscar tu reserva. Inténtalo nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatearFecha = (fechaStr: string) => {
    if (!fechaStr) return '';
    const fecha = new Date(fechaStr);
    fecha.setMinutes(fecha.getMinutes() + fecha.getTimezoneOffset());
    return new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'short', year: 'numeric' }).format(fecha);
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] py-16 px-4 flex flex-col items-center justify-center">
      <div className="max-w-md w-full space-y-6">

        {/* HEADER */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-block text-2xl font-extrabold tracking-tight text-gray-900 hover:opacity-80 transition-opacity">
            <span>Rancho</span><span className="text-[#11d442]">Carmelitas</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Consultar Mi Reserva
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 max-w-xs mx-auto">
            Ingresa tu código de reserva o tu correo para revisar tu estado de cuenta y ubicación.
          </p>
        </div>

        {/* TARJETA DE BÚSQUEDA */}
        <div className="bg-white rounded-3xl p-8 premium-shadow border border-gray-100 space-y-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Código de Reserva o Correo
              </label>
              <input 
                type="text"
                className="input-premium w-full text-sm font-medium tracking-wide uppercase placeholder:normal-case placeholder:tracking-normal"
                placeholder="Ej. 0B9C51AD o tu correo"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                required
                disabled={isLoading}
                autoFocus
              />
              <p className="text-[11px] text-gray-400 mt-1.5">
                Puedes ingresar los 8 dígitos de tu código, tu correo electrónico o tu RUT.
              </p>
            </div>

            {errorMsg && (
              <div className="bg-red-50 text-red-700 p-3.5 rounded-2xl text-xs border border-red-100 animate-in fade-in leading-relaxed">
                {errorMsg}
              </div>
            )}

            <Button size="lg" fullWidth disabled={isLoading} className="py-3.5 font-bold shadow-md text-sm">
              {isLoading ? 'Buscando reserva...' : 'Ver Mi Reserva 🔍'}
            </Button>
          </form>

          {/* LISTADO DE RESULTADOS SI HAY MÚLTIPLES */}
          {results.length > 0 && (
            <div className="pt-4 border-t border-gray-100 space-y-2 animate-in fade-in">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                Reservas Encontradas ({results.length}):
              </span>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {results.map((r) => (
                  <Link 
                    key={r.id} 
                    href={r.url || `/reserva/${r.id}`}
                    className="block p-3.5 rounded-2xl bg-gray-50 hover:bg-[#11d442]/10 border border-gray-200 transition-all text-xs"
                  >
                    <div className="flex justify-between items-center font-bold text-gray-900">
                      <div className="flex items-center gap-2">
                        <span>{r.type === 'event' ? '🎉' : '🏡'}</span>
                        <span>{r.title}</span>
                      </div>
                      <span className="text-[10px] text-[#11d442] font-mono bg-[#11d442]/10 px-2 py-0.5 rounded-full font-bold">
                        {r.id.slice(0, 8).toUpperCase()}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-600 mt-1">
                      📅 {r.dateInfo} • 👤 {r.guestName}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="pt-2 border-t border-gray-100 text-center">
            <Link href="/" className="text-xs text-gray-500 hover:text-gray-900 font-semibold transition-colors">
              ← Volver a la Portada
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
