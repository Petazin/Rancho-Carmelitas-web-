'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';

const formatMoney = (amount: number | undefined | null) => {
  if (amount === undefined || amount === null) return '$0';
  const formatted = new Intl.NumberFormat('es-CL', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
  return `$${formatted}`;
};

function PagoContent() {
  const searchParams = useSearchParams();
  const quoteIdParam = searchParams.get('id');
  const paymentStatusParam = searchParams.get('payment_status');

  const [searchId, setSearchId] = useState(quoteIdParam || '');
  const [quote, setQuote] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState('56994168853');

  useEffect(() => {
    async function loadWhatsapp() {
      try {
        const { data } = await supabase
          .from('settings')
          .select('value')
          .eq('key', 'whatsapp_number')
          .maybeSingle();
        if (data?.value) {
          const clean = data.value.replace(/[^0-9]/g, '');
          if (clean) setWhatsappNumber(clean);
        }
      } catch (e) {
        console.warn('Error al cargar whatsapp de settings:', e);
      }
    }
    loadWhatsapp();
  }, []);

  const fetchQuoteById = async (id: string) => {
    if (!id || id.trim().length === 0) return;
    setLoading(true);
    setError('');

    try {
      const { data, error: qError } = await supabase
        .from('event_quotes')
        .select('*')
        .eq('id', id.trim())
        .maybeSingle();

      if (qError) throw qError;

      if (!data) {
        setError('No encontramos ninguna cotización asociada al folio ingresado. Por favor verifica el identificador.');
        setQuote(null);
      } else {
        setQuote(data);

        // Si volvió de Mercado Pago con payment_status=approved y la cotización aún figura Aprobada
        if (paymentStatusParam === 'approved' && data.status === 'Aprobada') {
          try {
            await supabase
              .from('event_quotes')
              .update({
                status: 'Confirmada',
                deposit_paid: data.deposit_required,
                payment_method: 'Mercado Pago (Online)'
              })
              .eq('id', data.id);

            // Refrescar estado local
            setQuote({
              ...data,
              status: 'Confirmada',
              deposit_paid: data.deposit_required,
              payment_method: 'Mercado Pago (Online)'
            });

            // Disparar correo de confirmación de recinto
            fetch('/api/send-event-quote-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'confirmed', quoteId: data.id })
            }).catch(e => console.warn('[pago/page] Aviso email confirmación:', e));
          } catch (upErr) {
            console.warn('Error al auto-confirmar pago retornado:', upErr);
          }
        }
      }
    } catch (err: any) {
      console.error('Error al consultar cotización:', err);
      setError(err?.message || 'Error al conectar con la base de datos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (quoteIdParam) {
      fetchQuoteById(quoteIdParam);
    }
  }, [quoteIdParam]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchQuoteById(searchId);
  };

  const handlePayMercadoPago = async () => {
    if (!quote) return;
    setIsRedirecting(true);
    setError('');

    try {
      const res = await fetch('/api/mercadopago/event-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quoteId: quote.id,
          origin: window.location.origin
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success || !data.initPoint) {
        throw new Error(data.error || 'No se pudo generar el enlace de pago con Mercado Pago.');
      }

      window.location.href = data.initPoint;
    } catch (err: any) {
      console.error('Error al conectar con Mercado Pago:', err);
      setError(err?.message || 'Error al redirigir a la pasarela de pagos.');
      setIsRedirecting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full glass-effect border-b border-gray-200/50">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Logo className="w-10 h-10 rounded-full object-cover border border-gray-200/50 shadow-sm" />
            <span className="text-xl font-bold tracking-tight text-gray-900">
              Rancho<span className="text-[#11d442]">Carmelitas</span>
            </span>
          </Link>
          <div className="flex items-center gap-4 text-sm font-medium">
            <Link href="/recinto-completo" className="text-gray-600 hover:text-[#11d442] transition-colors">
              ← Volver al Cotizador
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 py-12 md:py-20 px-4">
        <div className="container mx-auto max-w-3xl">
          <div className="text-center mb-8">
            <span className="text-xs font-bold uppercase tracking-widest text-[#11d442] bg-[#11d442]/10 px-3.5 py-1.5 rounded-full inline-block">
              Portal de Seguimiento y Pago
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mt-3">
              Cotización de Recinto Completo
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Consulta el estado de tu solicitud de evento y abona el 50% de reserva formal.
            </p>
          </div>

          {/* Formulario de Búsqueda si no hay ID o desea buscar otro */}
          {!quote && (
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-200 shadow-sm mb-8">
              <form onSubmit={handleSearchSubmit} className="space-y-4">
                <label className="block text-sm font-bold text-gray-800">
                  Ingresa tu Folio o Código de Cotización
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    required
                    value={searchId}
                    onChange={(e) => setSearchId(e.target.value)}
                    placeholder="Ej: 3f8e91a2-..."
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#11d442] font-mono"
                  />
                  <Button type="submit" disabled={loading} className="btn-primary px-8 py-3">
                    {loading ? 'Consultando...' : 'Buscar Cotización'}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {error && (
            <div className="p-4 mb-6 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3">
              <span className="text-xl">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Detalle de la Cotización */}
          {quote && (
            <div className="bg-white rounded-3xl p-6 md:p-10 border border-gray-200 shadow-xl space-y-6">
              {/* Alerta de Retorno Aprobado de Mercado Pago */}
              {paymentStatusParam === 'approved' && (
                <div className="p-5 rounded-2xl bg-green-50 border-2 border-green-300 text-green-900 text-sm flex items-start gap-4">
                  <span className="text-3xl">🎉</span>
                  <div>
                    <h4 className="font-bold text-base text-green-950">
                      ¡Pago de Abono Acreditado con Éxito!
                    </h4>
                    <p className="text-xs text-green-800 mt-1">
                      El abono del 50% ha sido recibido. Tu evento ha quedado formalmente <strong>CONFIRMADO</strong> y el recinto se encuentra bloqueado exclusivamente para tu grupo.
                    </p>
                  </div>
                </div>
              )}

              {/* Encabezado de la Cotización */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                <div>
                  <span className="text-xs font-mono text-gray-400">
                    Folio: #{quote.id.slice(0, 8).toUpperCase()}
                  </span>
                  <h3 className="text-2xl font-bold text-gray-900 mt-0.5">
                    {quote.group_name || quote.organizer_name}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Organizador: <span className="font-semibold text-gray-700">{quote.organizer_name}</span> ({quote.organizer_email} • {quote.organizer_phone})
                  </p>
                </div>

                <div>
                  {quote.status === 'Cotizacion_Pendiente' && (
                    <span className="bg-amber-100 text-amber-800 text-xs px-3.5 py-1.5 rounded-full font-bold inline-block">
                      🟡 Pendiente de Aprobación
                    </span>
                  )}
                  {quote.status === 'Aprobada' && (
                    <span className="bg-blue-100 text-blue-800 text-xs px-3.5 py-1.5 rounded-full font-bold inline-block animate-pulse">
                      🔵 Aprobada (Listo para Abonar)
                    </span>
                  )}
                  {quote.status === 'Confirmada' && (
                    <span className="bg-green-100 text-green-800 text-xs px-3.5 py-1.5 rounded-full font-bold inline-block flex items-center gap-1.5">
                      <span>🟢 Recinto Confirmado</span>
                    </span>
                  )}
                  {quote.status === 'Cancelada' && (
                    <span className="bg-red-100 text-red-800 text-xs px-3.5 py-1.5 rounded-full font-bold inline-block">
                      🔴 Cancelada
                    </span>
                  )}
                </div>
              </div>

              {/* Ficha de Detalles del Evento */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100 text-xs">
                <div>
                  <span className="text-gray-400 block mb-0.5">Fecha del Evento:</span>
                  <span className="font-bold text-gray-900 text-sm">{quote.event_date}</span>
                </div>
                <div>
                  <span className="text-gray-400 block mb-0.5">Horario (8 horas):</span>
                  <span className="font-semibold text-gray-800">{quote.start_time?.slice(0, 5)} a {quote.end_time?.slice(0, 5)} hrs</span>
                </div>
                <div>
                  <span className="text-gray-400 block mb-0.5">Total Asistentes:</span>
                  <span className="font-semibold text-gray-800">{quote.total_guests} personas</span>
                </div>
                <div>
                  <span className="text-gray-400 block mb-0.5">Juegos Inflables:</span>
                  <span className="font-semibold text-gray-800">{quote.has_bouncy_castle ? '✓ Sí (+$5.000)' : 'No'}</span>
                </div>
              </div>

              {/* Desglose Financiero */}
              <div className="bg-surface rounded-2xl p-5 border border-gray-200/80 space-y-2 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Valor Total del Arriendo (8 horas):</span>
                  <span className="font-bold text-gray-900 text-sm">{formatMoney(quote.total_amount)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Abono Inicial del 50% (para reservar):</span>
                  <span className="font-bold text-[#11d442] text-sm">{formatMoney(quote.deposit_required)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Abono Registrado:</span>
                  <span className={`font-bold ${quote.deposit_paid >= quote.deposit_required ? 'text-green-600' : 'text-gray-700'}`}>
                    {formatMoney(quote.deposit_paid || 0)}
                  </span>
                </div>
                <div className="pt-2 border-t border-gray-200 flex justify-between text-gray-700 font-semibold">
                  <span>Saldo Restante (a pagar al ingresar):</span>
                  <span>{formatMoney(quote.total_amount - (quote.deposit_paid || 0))}</span>
                </div>
              </div>

              {/* Acciones según el Estado */}
              {quote.status === 'Cotizacion_Pendiente' && (
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 space-y-2">
                  <p className="font-bold flex items-center gap-1.5">
                    <span>⏳</span> Tu cotización está en revisión por la administración
                  </p>
                  <p>
                    Estamos verificando las características de tu delegación. Te notificaremos vía WhatsApp al <strong>{quote.organizer_phone}</strong> apenas sea aprobada para que puedas realizar el abono del 50% en este mismo portal.
                  </p>
                </div>
              )}

              {quote.status === 'Aprobada' && (
                <div className="space-y-4 pt-2">
                  <div className="p-4 bg-blue-50 rounded-2xl border border-blue-200 text-xs text-blue-900 space-y-1">
                    <p className="font-bold flex items-center gap-1.5">
                      <span>✓</span> ¡Tu cotización ha sido aprobada por la administración!
                    </p>
                    <p>
                      Para asegurar y bloquear formalmente la fecha de tu celebración, debes realizar el abono del 50% ({formatMoney(quote.deposit_required)}).
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <Button
                      onClick={handlePayMercadoPago}
                      disabled={isRedirecting}
                      className="w-full sm:w-auto flex-1 btn-primary py-4 text-center justify-center font-bold text-sm shadow-md"
                    >
                      {isRedirecting ? 'Conectando con Mercado Pago...' : `💳 Pagar Abono 50% en Línea (${formatMoney(quote.deposit_required)})`}
                    </Button>

                    <a
                      href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Hola, tengo mi cotización aprobada #${quote.id.slice(0, 8).toUpperCase()} para el ${quote.event_date} y quisiera coordinar el pago por transferencia.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto bg-gray-100 hover:bg-gray-200 text-gray-800 px-6 py-4 rounded-xl font-semibold text-xs text-center transition-colors"
                    >
                      Pagar por Transferencia Bancaria
                    </a>
                  </div>
                </div>
              )}

              {quote.status === 'Confirmada' && (
                <div className="p-6 bg-green-50 rounded-2xl border border-green-200 text-xs text-green-950 space-y-3">
                  <h4 className="font-bold text-sm flex items-center gap-2 text-green-900">
                    <span>🎉</span> ¡Tu Arriendo de Recinto está 100% Confirmado!
                  </h4>
                  <p>
                    El recinto completo de Rancho Carmelitas queda reservado exclusivamente para tu grupo el día <strong>{quote.event_date}</strong> desde las <strong>{quote.start_time?.slice(0, 5)} hasta las {quote.end_time?.slice(0, 5)} hrs</strong>.
                  </p>
                  <p className="text-gray-600">
                    Recuerda que el saldo restante ({formatMoney(quote.total_amount - (quote.deposit_paid || 0))}) se cancela al momento del ingreso al predio.
                  </p>
                  <div className="pt-2">
                    <Link
                      href="/reglamento"
                      className="text-[#11d442] font-bold underline"
                    >
                      Revisar Reglamento de Uso de Piscina y Convivencia →
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function PagoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <span className="text-sm text-gray-500">Cargando portal de pago...</span>
      </div>
    }>
      <PagoContent />
    </Suspense>
  );
}
