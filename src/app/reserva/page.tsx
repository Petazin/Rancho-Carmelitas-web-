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
        const { data: exactBooking, error: exactErr } = await supabase
          .from('bookings')
          .select('id, guest_name, check_in, check_out, total_price, cabins(name)')
          .eq('id', clean.toLowerCase())
          .maybeSingle();

        if (!exactErr && exactBooking) {
          router.push(`/reserva/${exactBooking.id}`);
          return;
        }
      }

      // 2. Búsqueda flexible multivariable (Código corto de 8 caracteres, Correo, RUT, Nombre)
      const { data: allBookings, error: fetchErr } = await supabase
        .from('bookings')
        .select('id, guest_name, guest_email, guest_rut, guest_phone, check_in, check_out, total_price, status, cabins(name)')
        .order('created_at', { ascending: false })
        .limit(200);

      if (fetchErr || !allBookings || allBookings.length === 0) {
        setErrorMsg('No encontramos ninguna reserva activa con ese código, correo o RUT. Por favor revísalo.');
        setIsLoading(false);
        return;
      }

      const queryNormalized = clean.toLowerCase().replace(/[^a-z0-9]/g, '');
      const queryLower = clean.toLowerCase();

      const matches = allBookings.filter((b: any) => {
        const idLower = (b.id || '').toLowerCase();
        const idClean = idLower.replace(/[^a-z0-9]/g, '');
        const idShort = idLower.slice(0, 8);
        const email = (b.guest_email || '').toLowerCase();
        const rut = (b.guest_rut || '').toLowerCase().replace(/[^0-9k]/g, '');
        const name = (b.guest_name || '').toLowerCase();
        const phone = (b.guest_phone || '').replace(/[^0-9]/g, '');

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
        router.push(`/reserva/${matches[0].id}`);
        return;
      } else if (matches.length > 1) {
        setResults(matches);
      } else {
        setErrorMsg(`No encontramos ninguna reserva activa con el código o dato "${clean}". Por favor verifica que esté bien escrito.`);
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
                    href={`/reserva/${r.id}`}
                    className="block p-3.5 rounded-2xl bg-gray-50 hover:bg-[#11d442]/10 border border-gray-200 transition-all text-xs"
                  >
                    <div className="flex justify-between items-center font-bold text-gray-900">
                      <span>{(r.cabins as any)?.name || 'Cabaña'}</span>
                      <span className="text-[10px] text-[#11d442] font-mono bg-[#11d442]/10 px-2 py-0.5 rounded-full font-bold">
                        {r.id.slice(0, 8).toUpperCase()}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-600 mt-1">
                      📅 {formatearFecha(r.check_in)} al {formatearFecha(r.check_out)} • 👤 {r.guest_name}
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
