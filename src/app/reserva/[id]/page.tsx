'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';

const formatMoney = (amount: number | undefined | null) => {
  if (amount === undefined || amount === null) return '$0';
  const formatted = new Intl.NumberFormat('es-CL', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount);
  return `$${formatted}`;
};

const formatearFecha = (fechaStr: string) => {
  if (!fechaStr) return '';
  const fecha = new Date(fechaStr);
  fecha.setMinutes(fecha.getMinutes() + fecha.getTimezoneOffset());
  return new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'short', year: 'numeric' }).format(fecha);
};

export default function GuestPortalPage() {
  const params = useParams();
  const bookingId = params?.id as string;

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [whatsappNumber, setWhatsappNumber] = useState('56912345678');
  const [mapsUrl, setMapsUrl] = useState('https://maps.google.com/?q=Rancho+Carmelitas');
  const [bankSettings, setBankSettings] = useState<Record<string, string>>({});
  const [showTransferDetails, setShowTransferDetails] = useState(false);

  // Estados de Simulación de Pago de Saldo Restante
  const [isPayingSaldo, setIsPayingSaldo] = useState(false);
  const [simulationStep, setSimulationStep] = useState('');

  const loadBookingData = useCallback(async () => {
    if (!bookingId) return;

    try {
      let bData: any = null;
      const isFullUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(bookingId);

      if (isFullUuid) {
        const { data, error } = await supabase
          .from('bookings')
          .select('*, cabins(name, image_url, capacity), booking_payments(*)')
          .eq('id', bookingId.toLowerCase())
          .maybeSingle();

        if (!error && data) bData = data;
      } else {
        // Búsqueda por prefijo corto (ej. primeros 8 caracteres)
        const { data: allData } = await supabase
          .from('bookings')
          .select('*, cabins(name, image_url, capacity), booking_payments(*)')
          .order('created_at', { ascending: false })
          .limit(100);

        if (allData) {
          const cleanId = bookingId.toLowerCase().replace(/[^a-z0-9]/g, '');
          const found = allData.find((b: any) => {
            const idLower = (b.id || '').toLowerCase();
            const idClean = idLower.replace(/[^a-z0-9]/g, '');
            return idLower.startsWith(bookingId.toLowerCase()) || idClean.startsWith(cleanId);
          });
          if (found) bData = found;
        }
      }

      if (bData) {
        // Si la reserva está pendiente, intentar sincronizar con Mercado Pago por si pagó recién
        if (bData.status === 'Pendiente') {
          try {
            await fetch('/api/mercadopago/sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ bookingId: bData.id })
            });
            // Re-consultar la reserva actualizada
            const { data: refreshed } = await supabase
              .from('bookings')
              .select(`
                *,
                cabins (*),
                booking_payments (*)
              `)
              .eq('id', bData.id)
              .single();
            if (refreshed) bData = refreshed;
          } catch (syncErr) {
            console.warn('Sync check warning:', syncErr);
          }
        }
        setBooking(bData);
      }

      // Cargar configuraciones globales y bancarias
      const { data: sData } = await supabase
        .from('settings')
        .select('key, value')
        .in('key', [
          'whatsapp_number', 
          'contact_maps_url',
          'bank_name',
          'bank_account_type',
          'bank_account_number',
          'bank_rut',
          'bank_account_holder',
          'bank_email'
        ]);

      if (sData) {
        const settingsMap: Record<string, string> = {};
        sData.forEach(s => {
          settingsMap[s.key] = s.value;
          if (s.key === 'whatsapp_number') setWhatsappNumber(s.value);
          if (s.key === 'contact_maps_url') setMapsUrl(s.value);
        });
        setBankSettings(settingsMap);
      }
    } catch (err) {
      console.error('Error cargando reserva:', err);
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    loadBookingData();
  }, [loadBookingData]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf8f5]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-[#11d442] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-gray-600">Cargando tu portal de estadía...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#faf8f5] px-4">
        <h1 className="text-2xl font-bold mb-3 text-gray-900">Reserva no encontrada</h1>
        <p className="text-sm text-gray-500 mb-6 max-w-sm text-center">
          El código de reserva ingresado no existe o fue cancelado.
        </p>
        <Link href="/reserva">
          <Button variant="outline">Buscar Otra Reserva</Button>
        </Link>
      </div>
    );
  }

  const cabin = booking.cabins || {};
  const totalPrice = booking.total_price || 0;
  
  // Cálculo exacto de pagos en base de datos
  const paymentsSum = booking.booking_payments?.reduce((acc: number, p: any) => acc + (Number(p.amount) || 0), 0) || 0;
  const totalAbonado = paymentsSum > 0 ? paymentsSum : (Number(booking.payment_amount) || 0);
  const saldoPendiente = Math.max(0, totalPrice - totalAbonado);
  const estadiaTotalmentePagada = saldoPendiente === 0;

  // Cálculo de días restantes
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const fechaCheckIn = new Date(booking.check_in);
  const diffDias = Math.ceil((fechaCheckIn.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));

  // Función de Pago del Saldo Online Oficial
  const handlePagarSaldoOnline = async () => {
    setIsPayingSaldo(true);
    try {
      setSimulationStep('Conectando con la pasarela de pagos segura...');
      const prefRes = await fetch('/api/mercadopago/create-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: booking.id,
          title: `Saldo Restante 50% - ${cabin.name || 'Cabaña'} (Rancho Carmelitas)`,
          amount: saldoPendiente,
          guestName: booking.guest_name,
          guestEmail: booking.guest_email,
          type: 'saldo',
          origin: window.location.origin
        })
      });

      const prefData = await prefRes.json();

      if (prefData.success && (prefData.initPoint || prefData.sandboxInitPoint)) {
        const targetUrl = prefData.initPoint || prefData.sandboxInitPoint;
        window.location.href = targetUrl;
        return;
      } else {
        throw new Error(prefData.error || 'No se pudo conectar con la pasarela de pagos.');
      }
    } catch (err: any) {
      alert('Error en pago: ' + err.message);
    } finally {
      setIsPayingSaldo(false);
      setSimulationStep('');
    }
  };


  const cleanShortId = (booking.id || bookingId).slice(0, 8).toUpperCase();
  const whatsappGeneralMsg = `¡Hola! Soy ${booking.guest_name}. Tengo una consulta sobre mi reserva en ${cabin.name || 'Rancho Carmelitas'} (Cód: ${cleanShortId}) para el ${formatearFecha(booking.check_in)}.`;
  const whatsappTransferMsg = `¡Hola! Soy ${booking.guest_name}. Les adjunto el comprobante de transferencia por ${formatMoney(saldoPendiente)} para saldar el restante de mi reserva ${cleanShortId} (${cabin.name || 'Cabaña'}).`;

  return (
    <div className="min-h-screen bg-[#faf8f5] py-10 px-4">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* HEADER DE MARCA & NAVEGACIÓN */}
        <header className="flex items-center justify-between pb-4 border-b border-gray-200">
          <Link href="/" className="text-xl font-bold tracking-tight text-gray-900 flex items-center gap-1 hover:opacity-80 transition-opacity">
            <span>Rancho</span><span className="text-[#11d442]">Carmelitas</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link 
              href="/" 
              className="text-xs font-bold text-gray-700 bg-white hover:bg-gray-100 border border-gray-200 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 shadow-2xs"
            >
              <span>🏠 Ir al Inicio</span>
            </Link>
            <Link 
              href="/reserva" 
              className="text-xs font-semibold text-gray-500 hover:text-gray-900 px-2.5 py-1.5 rounded-xl hover:bg-gray-100 transition-colors hidden sm:block"
            >
              🔍 Buscar Otra
            </Link>
            <span className="text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-full hidden md:inline-block">
              Portal del Huésped
            </span>
          </div>
        </header>

        {/* BANNER DE BIENVENIDA & COUNTDOWN */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 premium-shadow border border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <span className="text-xs font-bold text-[#11d442] uppercase tracking-wider">
              {diffDias > 0 ? `⏳ Faltan ${diffDias} días para tu llegada` : diffDias === 0 ? '🎉 ¡Hoy es tu día de Check-in!' : '🌿 Estadía en Curso'}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
              Hola, {booking.guest_name}
            </h1>
            <p className="text-xs sm:text-sm text-gray-500">
              Aquí puedes revisar todos los detalles de tu estadía, ubicación GPS y modalidades de pago.
            </p>
          </div>

          <div className="text-center sm:text-right shrink-0">
            <span className="text-[10px] text-gray-400 block uppercase font-bold">Código de Reserva</span>
            <span className="font-mono text-sm font-bold bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200 text-gray-900 inline-block">
              {cleanShortId}
            </span>
          </div>
        </div>

        {/* DETALLE DE LA CABAÑA & HORARIOS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 bg-white rounded-3xl p-6 premium-shadow border border-gray-100 flex flex-col sm:flex-row gap-5 items-center">
            <div className="relative w-full sm:w-36 h-32 rounded-2xl overflow-hidden bg-gray-100 shrink-0">
              {cabin.image_url ? (
                <Image src={cabin.image_url} alt={cabin.name || 'Cabaña'} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold text-xs">Rancho</div>
              )}
            </div>
            <div className="space-y-2 text-center sm:text-left flex-1">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tu Cabaña Asignada</span>
              <h2 className="text-xl font-bold text-gray-900">{cabin.name || 'Cabaña Rancho Carmelitas'}</h2>
              <div className="text-xs text-gray-600 space-y-1">
                <div>📅 <strong>Entrada:</strong> {formatearFecha(booking.check_in)} (15:00 a 21:00 hrs)</div>
                <div>📅 <strong>Salida:</strong> {formatearFecha(booking.check_out)} (hasta las 12:00 hrs)</div>
                <div>👥 <strong>Huéspedes:</strong> {booking.adults} adultos {booking.children > 0 ? `, ${booking.children} niños` : ''}</div>
              </div>
            </div>
          </div>

          {/* ACCESOS GPS RÁPIDOS */}
          <div className="bg-white rounded-3xl p-6 premium-shadow border border-gray-100 flex flex-col justify-between space-y-4">
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">📍 Cómo Llegar</span>
              <p className="text-xs text-gray-600 font-medium">Pullally, Papudo, Valparaíso</p>
            </div>
            <div className="space-y-2">
              <a 
                href={`https://waze.com/ul?q=Rancho+Carmelitas+Pullally`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="block"
              >
                <button className="w-full py-2 px-3 bg-[#33ccff]/10 hover:bg-[#33ccff]/20 text-[#0088cc] rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer">
                  🚗 Abrir con Waze
                </button>
              </a>
              <a 
                href={mapsUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="block"
              >
                <button className="w-full py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer">
                  🗺️ Google Maps
                </button>
              </a>
            </div>
          </div>
        </div>

        {/* ESTADO DE CUENTA Y SALDO */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 premium-shadow border border-gray-100 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-4 border-b border-gray-100">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Cuenta Corriente de tu Reserva</h3>
              <p className="text-xs text-gray-500">Transparencia total de cobros, abonos y saldo restante.</p>
            </div>
            <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider inline-block self-start ${
              estadiaTotalmentePagada 
                ? 'bg-emerald-100 text-emerald-800' 
                : 'bg-amber-100 text-amber-900'
            }`}>
              {estadiaTotalmentePagada ? '✓ 100% Pagada' : '⏳ Saldo Pendiente al Check-in'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-150 text-center">
              <span className="text-[11px] font-bold uppercase text-gray-500 block mb-1">Total de la Estadía</span>
              <span className="text-lg font-extrabold text-gray-900">{formatMoney(totalPrice)}</span>
            </div>

            <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 text-center">
              <span className="text-[11px] font-bold uppercase text-emerald-800 block mb-1">Total Abonado</span>
              <span className="text-lg font-extrabold text-emerald-700">
                {formatMoney(totalAbonado)}
              </span>
              <span className="block text-[10px] text-emerald-600 mt-0.5">
                {totalAbonado > 0 ? '✓ Acreditado' : '⏳ Pendiente'}
              </span>
            </div>

            <div className={`p-4 rounded-2xl border text-center ${
              estadiaTotalmentePagada ? 'bg-emerald-50/70 border-emerald-200' : 'bg-amber-50/70 border-amber-200'
            }`}>
              <span className={`text-[11px] font-bold uppercase block mb-1 ${estadiaTotalmentePagada ? 'text-emerald-800' : 'text-amber-800'}`}>
                {estadiaTotalmentePagada ? 'Saldo Pendiente' : 'Saldo Restante'}
              </span>
              <span className={`text-lg font-extrabold ${estadiaTotalmentePagada ? 'text-emerald-700' : 'text-amber-900'}`}>
                {formatMoney(saldoPendiente)}
              </span>
              <span className={`block text-[10px] mt-0.5 ${estadiaTotalmentePagada ? 'text-emerald-600' : 'text-amber-700'}`}>
                {estadiaTotalmentePagada ? '✓ Todo Saldado' : 'A pagar online o al llegar'}
              </span>
            </div>
          </div>

          {/* HISTORIAL DE PAGOS DEL HUÉSPED */}
          {booking.booking_payments && booking.booking_payments.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                📋 Historial de Pagos Registrados
              </span>
              <div className="space-y-2">
                {booking.booking_payments.map((p: any, idx: number) => (
                  <div key={p.id || idx} className="flex justify-between items-center bg-gray-50 p-3 rounded-xl text-xs border border-gray-100">
                    <div>
                      <span className="font-bold text-gray-800">{p.payment_method || 'Abono'}</span>
                      {p.reference && <span className="text-gray-400 font-mono ml-2">({p.reference})</span>}
                      {p.created_at && (
                        <span className="text-gray-400 block text-[10px]">
                          {new Date(p.created_at).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    <span className="font-bold text-emerald-700 text-sm">+{formatMoney(p.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* OPCIONES COMPLETAS PARA SALDAR EL 50% RESTANTE */}
          {!estadiaTotalmentePagada ? (
            <div className="space-y-4 pt-2 border-t border-gray-100">
              
              {/* OPCIÓN 1: SALDAR ONLINE ANTES DE VIAJAR (CHECK-IN EXPRESS) */}
              <div className="p-5 bg-gradient-to-r from-blue-50/90 to-indigo-50/70 rounded-3xl border border-blue-100 space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-blue-950 flex items-center gap-1.5">
                      <span>⚡ Opción 1: Saldar Online Ahora (Check-In Express)</span>
                    </h4>
                    <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                      Ingreso Directo
                    </span>
                  </div>
                  <p className="text-xs text-blue-800 mt-1">
                    Salda tu saldo de <strong>{formatMoney(saldoPendiente)}</strong> antes de llegar para no hacer trámites en recepción:
                  </p>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  <Button 
                    size="md" 
                    onClick={() => handlePagarSaldoOnline()}
                    disabled={isPayingSaldo}
                    className="bg-[#009EE3] hover:bg-[#0081b8] text-white text-xs font-bold py-2.5 px-4 shadow-sm"
                  >
                    {isPayingSaldo ? 'Conectando...' : `💳 Pagar Saldo Online (${formatMoney(saldoPendiente)})`}
                  </Button>

                  <Button 
                    size="md" 
                    variant="outline"
                    onClick={() => setShowTransferDetails(!showTransferDetails)}
                    disabled={isPayingSaldo}
                    className="border-emerald-300 text-emerald-800 hover:bg-emerald-50 text-xs font-bold py-2.5 px-4 bg-white"
                  >
                    {showTransferDetails ? 'Ocultar Datos Bancarios' : '🏦 Transferencia Bancaria'}
                  </Button>
                </div>

                {/* DESGLOSE DE TRANSFERENCIA BANCARIA SI SE ABRE */}
                {showTransferDetails && (
                  <div className="p-4 bg-white rounded-2xl border border-blue-200/80 space-y-3 animate-in fade-in">
                    <span className="text-xs font-bold text-blue-950 uppercase tracking-wider block">
                      Datos de Cuenta para Transferir el Saldo ({formatMoney(saldoPendiente)})
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono bg-blue-50/50 p-3 rounded-xl border border-blue-100 text-gray-800">
                      <div><strong>Banco:</strong> {bankSettings.bank_name || 'BancoEstado'}</div>
                      <div><strong>Tipo:</strong> {bankSettings.bank_account_type || 'Cuenta Corriente'}</div>
                      <div><strong>N° Cuenta:</strong> {bankSettings.bank_account_number || '123456789'}</div>
                      <div><strong>RUT:</strong> {bankSettings.bank_rut || '76.xxx.xxx-x'}</div>
                      <div><strong>Titular:</strong> {bankSettings.bank_account_holder || 'Rancho Carmelitas SpA'}</div>
                      <div><strong>Correo:</strong> {bankSettings.bank_email || 'pagos@ranchocarmelitas.cl'}</div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-1">
                      <p className="text-[11px] text-gray-500">
                        Indica el código <strong>{cleanShortId}</strong> en el asunto.
                      </p>
                      <a 
                        href={`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(whatsappTransferMsg)}`}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-full sm:w-auto"
                      >
                        <Button size="sm" className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold">
                          Enviar Comprobante por WhatsApp
                        </Button>
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* OPCIÓN 2: PAGAR PRESENCIALMENTE EN RECEPCIÓN AL HACER CHECK-IN */}
              <div className="p-5 bg-amber-50/70 rounded-3xl border border-amber-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-amber-950 flex items-center gap-1.5">
                    <span>🛎️ Opción 2: Pagar al Llegar durante tu Check-In</span>
                  </h4>
                  <span className="text-[10px] font-bold bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-full">
                    Presencial en Counter
                  </span>
                </div>
                <p className="text-xs text-amber-900">
                  ¡No te preocupes! Tu cabaña ya está reservada con tu abono. Puedes pagar el saldo de <strong>{formatMoney(saldoPendiente)}</strong> directamente al recibir tus llaves mediante:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  <div className="p-3 bg-white rounded-2xl border border-amber-200 text-xs flex items-center gap-2">
                    <span className="text-lg">📱</span>
                    <div>
                      <strong className="block text-gray-900">POS / Tarjetas</strong>
                      <span className="text-[11px] text-gray-500">Débito, Crédito o Redcompra</span>
                    </div>
                  </div>

                  <div className="p-3 bg-white rounded-2xl border border-amber-200 text-xs flex items-center gap-2">
                    <span className="text-lg">💵</span>
                    <div>
                      <strong className="block text-gray-900">Pago en Efectivo</strong>
                      <span className="text-[11px] text-gray-500">En recepción al llegar</span>
                    </div>
                  </div>

                  <div className="p-3 bg-white rounded-2xl border border-amber-200 text-xs flex items-center gap-2">
                    <span className="text-lg">🏦</span>
                    <div>
                      <strong className="block text-gray-900">Transferencia In Situ</strong>
                      <span className="text-[11px] text-gray-500">Al momento del Check-in</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          ) : (
            <div className="p-4 bg-emerald-100/60 rounded-2xl border border-emerald-200 flex items-center gap-3 text-emerald-900 animate-in fade-in">
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 font-bold">
                ✓
              </div>
              <div className="text-xs">
                <strong className="text-sm block text-emerald-950">¡Tu estadía está 100% Pagada!</strong>
                No tienes pagos pendientes. Te esperamos en el Rancho con todo preparado para tu Check-in.
              </div>
            </div>
          )}
        </div>

        {/* CONTACTO DIRECTO CON EL ANFITRIÓN */}
        <div className="bg-white rounded-3xl p-6 premium-shadow border border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left space-y-0.5">
            <h4 className="text-sm font-bold text-gray-900">¿Tienes alguna duda o requerimiento especial?</h4>
            <p className="text-xs text-gray-500">Estamos atentos para coordinar leña, tinajas o detalles de tu llegada.</p>
          </div>

          <a 
            href={`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(whatsappGeneralMsg)}`}
            target="_blank" 
            rel="noopener noreferrer"
            className="w-full sm:w-auto shrink-0"
          >
            <Button size="md" className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-xs">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Escribir al Anfitrión por WhatsApp
            </Button>
          </a>
        </div>

        {/* PIE DE NAVEGACIÓN */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 pb-8 border-t border-gray-200 text-xs text-gray-500">
          <Link href="/" className="hover:text-[#11d442] font-bold flex items-center gap-1.5 transition-colors">
            <span>← Volver a la Portada de Rancho Carmelitas</span>
          </Link>
          <Link href="/reserva" className="hover:text-gray-900 font-medium">
            🔍 Consultar otra reserva
          </Link>
        </div>

        {/* MODAL DE PROCESAMIENTO SIMULADO */}
        {isPayingSaldo && simulationStep && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center space-y-4 shadow-2xl border border-gray-100">
              <div className="w-16 h-16 bg-[#009EE3]/10 rounded-full flex items-center justify-center mx-auto text-[#009EE3]">
                <svg className="animate-spin h-8 w-8" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900">Simulación de Pago de Saldo</h3>
              <p className="text-sm text-gray-600 font-medium animate-pulse">{simulationStep}</p>
              <div className="text-[11px] text-gray-400">Entorno de Pruebas Rancho Carmelitas</div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
