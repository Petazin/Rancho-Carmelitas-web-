'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
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

const formatRut = (rut: string) => {
  let clean = rut.replace(/[^0-9kK]/g, '').toUpperCase();
  if (clean.length === 0) return '';
  clean = clean.slice(0, 9);
  if (clean.length === 1) return clean;
  const dv = clean.slice(-1);
  const body = clean.slice(0, -1);
  let formattedBody = '';
  if (body.length > 6) {
    formattedBody = body.replace(/^(\d{1,2})(\d{3})(\d{3})$/, '$1.$2.$3');
  } else if (body.length > 3) {
    formattedBody = body.replace(/^(\d{1,3})(\d{3})$/, '$1.$2');
  } else {
    formattedBody = body;
  }
  return `${formattedBody}-${dv}`;
};

interface CheckoutFormProps {
  cabin: any;
  checkoutData: {
    checkIn: string;
    checkOut: string;
    adults: number;
    children: number;
    nights: number;
    totalBase: number;
    extraCostTotal: number;
    extraGuests: number;
  };
}

export function CheckoutForm({ cabin, checkoutData }: CheckoutFormProps) {
  const { checkIn, checkOut, adults, children, nights, totalBase, extraCostTotal, extraGuests } = checkoutData;
  const guests = adults + children;
  const hasChildren = children > 0;
  
  const router = useRouter();

  // Estados de Facturación
  const [requiresInvoice, setRequiresInvoice] = useState(false);
  const [invoiceRut, setInvoiceRut] = useState('');
  const [invoiceName, setInvoiceName] = useState('');
  const [invoiceGiro, setInvoiceGiro] = useState('');

  const [motivoViaje, setMotivoViaje] = useState('');
  
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [childrenAges, setChildrenAges] = useState('');
  const [individualAges, setIndividualAges] = useState<string[]>(Array(children).fill(''));
  
  // Nuevos campos de robustez de huéspedes (Fase 2)
  const [guestRut, setGuestRut] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [guestNationality, setGuestNationality] = useState('');
  const [guestPreferences, setGuestPreferences] = useState('');
  const [guestBirthdate, setGuestBirthdate] = useState('');

  const [paymentMethod, setPaymentMethod] = useState<'mercadopago' | 'transferencia'>('mercadopago');

  const [isLoading, setIsLoading] = useState(false);
  const [simulationStep, setSimulationStep] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState('');

  // Cálculos reactivos
  const iva = requiresInvoice ? totalBase * 0.19 : 0;
  const totalConImpuestosRaw = totalBase + iva;
  // Redondear siempre hacia abajo a la decena (múltiplo de 10)
  const totalConImpuestos = Math.floor(totalConImpuestosRaw / 10) * 10;
  const descuentoRedondeo = totalConImpuestosRaw - totalConImpuestos;
  const abono = totalConImpuestos * 0.5;
  const restante = totalConImpuestos - abono;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    let createdBookingId: string | null = null;

    try {
      // 1. VALIDACIÓN DE CONTACTO E IDENTIFICACIÓN
      if (!guestName.trim() || !guestEmail.trim() || !guestPhone.trim() || !guestRut.trim()) {
        setErrorMsg('Por favor completa todos los datos de contacto e identificación obligatorios (Nombre, RUT/Pasaporte, Correo y Teléfono).');
        setIsLoading(false);
        return;
      }

      if (guestEmail !== confirmEmail) {
        setErrorMsg('Los correos electrónicos no coinciden. Por favor revísalos.');
        setIsLoading(false);
        return;
      }

      // 2. VALIDACIÓN EXTRA (Backend Check) - Para evitar colisiones de último segundo
      const { data: colisiones, error: colError } = await supabase
        .from('bookings')
        .select('id')
        .eq('cabin_id', cabin.id)
        .neq('status', 'Cancelada')
        .or(`and(check_in.lt.${checkOut},check_out.gt.${checkIn})`);

      if (colError) throw colError;

      if (colisiones && colisiones.length > 0) {
        setErrorMsg('Lo sentimos, alguien acaba de reservar estas fechas hace un momento. Por favor vuelve atrás y elige otras fechas.');
        setIsLoading(false);
        return;
      }

      // 3. VALIDACIÓN DE CIERRES TEMPORALES (Backend Check)
      const { data: cierres, error: cierresError } = await supabase
        .from('cabin_closures')
        .select('reason')
        .or(`cabin_id.eq.${cabin.id},cabin_id.is.null`)
        .lte('start_date', checkOut)
        .gte('end_date', checkIn);

      if (cierresError) throw cierresError;

      if (cierres && cierres.length > 0) {
        setErrorMsg(`Lo sentimos, la cabaña se encuentra cerrada temporalmente en el periodo seleccionado por: "${cierres[0].reason}". Por favor vuelve atrás y elige otras fechas.`);
        setIsLoading(false);
        return;
      }

      // 4. INSERTAR EN DB (Estado Inicial Pendiente)
      let finalTravelReason = motivoViaje === 'otro' ? `Otro: ${specialRequests}` : motivoViaje;
      
      if (requiresInvoice) {
        finalTravelReason += ` | DATOS FACTURA: RUT: ${invoiceRut}, Razón Social: ${invoiceName}, Giro: ${invoiceGiro}`;
      }

      const { data, error } = await supabase
        .from('bookings')
        .insert([
          {
            cabin_id: cabin.id,
            guest_name: guestName,
            guest_email: guestEmail,
            guest_phone: guestPhone,
            guest_rut: guestRut,
            vehicle_plate: vehiclePlate || null,
            guest_nationality: guestNationality || null,
            guest_preferences: guestPreferences || null,
            guest_birthdate: guestBirthdate || null,
            check_in: checkIn,
            check_out: checkOut,
            adults,
            children,
            children_ages: hasChildren ? childrenAges : null,
            travel_reason: finalTravelReason,
            special_requests: null,
            requires_invoice: requiresInvoice,
            total_price: totalConImpuestos,
            extra_guests_cost: extraCostTotal,
            payment_amount: null,
            payment_reference: null,
            confirmed_at: null,
            confirmed_by: null,
            status: 'Pendiente'
          }
        ])
        .select();

      if (error || !data || data.length === 0) {
          throw new Error(error?.message || 'Error desconocido al guardar en base de datos.');
      }

      const bookingId = data[0].id;
      createdBookingId = bookingId;

      // 5. FLUJO SEGÚN MÉTODO DE PAGO
      if (paymentMethod === 'mercadopago') {
        setSimulationStep('Conectando con la pasarela de pagos segura...');
        const prefRes = await fetch('/api/mercadopago/create-preference', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookingId,
            title: `Abono 50% - ${cabin.name} (Rancho Carmelitas)`,
            amount: abono,
            guestName,
            guestEmail,
            type: 'abono',
            origin: window.location.origin
          })
        });

        const prefData = await prefRes.json();

        if (prefData.success && (prefData.initPoint || prefData.sandboxInitPoint)) {
          // Enviar correo previo de solicitud de reserva recibida
          try {
            await fetch('/api/send-confirmation', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                guestName,
                guestEmail,
                cabinName: cabin.name,
                checkIn,
                checkOut,
                adults,
                children,
                totalPrice: totalConImpuestos,
                bookingId
              })
            });
          } catch (mErr) {
            console.warn('Advertencia correo confirmación:', mErr);
          }

          // Redirigir a la pasarela de pago oficial
          const targetUrl = prefData.initPoint || prefData.sandboxInitPoint;
          window.location.href = targetUrl;
          return;
        } else {
          throw new Error(prefData.error || 'No se pudo conectar con la pasarela de pagos.');
        }
      }

      // Si el método es Transferencia Bancaria Directa
      setSimulationStep('Registrando solicitud de reserva...');
      try {
        await fetch('/api/send-confirmation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            guestName,
            guestEmail,
            cabinName: cabin.name,
            checkIn: formatearFecha(checkIn),
            checkOut: formatearFecha(checkOut),
            totalPrice: totalConImpuestos,
            bookingId: bookingId
          })
        });
      } catch (emailErr) {
        console.error('Error al intentar enviar los correos:', emailErr);
      }

      // Redirigir a pantalla de éxito para transferencia bancaria
      const queryParams = new URLSearchParams({
        bookingId: bookingId,
        method: 'transferencia',
        status: 'pending',
        amount: String(abono),
        total: String(totalConImpuestos)
      });

      router.push(`/checkout/success?${queryParams.toString()}`);


    } catch (err: any) {
      console.warn('Error al guardar reserva:', err);
      // Rollback: si se insertó la reserva pero falló la pasarela de pago, eliminar la reserva provisional para liberar fechas
      if (createdBookingId) {
        try {
          await supabase.from('bookings').delete().eq('id', createdBookingId);
        } catch (delErr) {
          console.warn('Error en rollback de reserva provisional:', delErr);
        }
      }
      setErrorMsg(err.message || 'Ocurrió un error al procesar tu reserva. Inténtalo de nuevo.');
      setIsLoading(false);
      setSimulationStep('');
    }
  };

  const formatearFecha = (fechaStr: string) => {
    const fecha = new Date(fechaStr);
    fecha.setMinutes(fecha.getMinutes() + fecha.getTimezoneOffset());
    return new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }).format(fecha);
  };

  return (
    <div className="flex flex-col-reverse lg:flex-row gap-12">
      
      {/* Formulario de Checkout */}
      <div className="flex-1">
        <div className="bg-white rounded-3xl premium-shadow p-8 border border-gray-100 mb-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-900">Tus Datos</h2>
          
          {errorMsg && (
            <div className="bg-rose-50 border-2 border-rose-300 text-rose-900 p-6 rounded-2xl mb-8 shadow-md animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-sm text-2xl">
                  ⚠️
                </div>
                <div className="flex-1 space-y-2">
                  <h3 className="font-extrabold text-base text-rose-950 flex items-center gap-2">
                    <span>Fechas No Disponibles</span>
                    <span className="bg-rose-200 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Conflicto de Ocupación
                    </span>
                  </h3>
                  <p className="text-sm text-rose-800 leading-relaxed">
                    {errorMsg}
                  </p>
                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    <a
                      href={`/cabins/${cabin.id}`}
                      className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm"
                    >
                      <span>📅 Seleccionar Otras Fechas</span>
                    </a>
                    <a
                      href="/"
                      className="inline-flex items-center gap-2 bg-white hover:bg-rose-100 text-rose-800 border border-rose-200 text-xs font-bold px-4 py-2.5 rounded-xl transition-all"
                    >
                      <span>🏡 Explorar Otras Cabañas</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nombre de quién reserva (*)</label>
                <input 
                  type="text" 
                  className="input-premium w-full" 
                  placeholder="Ej. Juan Pérez" 
                  required 
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  disabled={isLoading}
                />
                <p className="text-xs text-gray-500 mt-1">Sólo mayores de 18 años.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">RUT o Pasaporte del Titular (*)</label>
                <input 
                  type="text" 
                  className="input-premium w-full" 
                  placeholder="Ej. 12.345.678-9" 
                  required 
                  value={guestRut}
                  onChange={(e) => setGuestRut(formatRut(e.target.value))}
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Correo Electrónico (*)</label>
                <input 
                  type="email" 
                  className="input-premium w-full" 
                  placeholder="tucorreo@ejemplo.com" 
                  required 
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirmar Correo Electrónico (*)</label>
                <input 
                  type="email" 
                  className="input-premium w-full" 
                  placeholder="Vuelve a escribir tu correo" 
                  required 
                  value={confirmEmail}
                  onChange={(e) => setConfirmEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono / WhatsApp (*)</label>
                <input 
                  type="tel" 
                  className="input-premium w-full" 
                  placeholder="+56 9 1234 5678" 
                  required 
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Motivo del viaje (*)</label>
                <select 
                  className="input-premium w-full mb-3" 
                  required 
                  value={motivoViaje}
                  onChange={(e) => setMotivoViaje(e.target.value)}
                >
                  <option value="" disabled>Selecciona una opción</option>
                  <option value="descanso">Descanso / Vacaciones</option>
                  <option value="trabajo">Trabajo / Negocios</option>
                  <option value="aniversario">Aniversario / Luna de Miel</option>
                  <option value="escapada_fin_semana">Escapada de Fin de Semana</option>
                  <option value="evento_familiar">Evento Familiar / Celebración</option>
                  <option value="otro">Otro motivo</option>
                </select>
                
                {motivoViaje === 'otro' && (
                  <div className="animate-in fade-in slide-in-from-top-2">
                    <input 
                      type="text" 
                      className="input-premium w-full bg-gray-50/50" 
                      placeholder="Por favor, especifica el motivo..." 
                      required 
                      value={specialRequests}
                      onChange={(e) => setSpecialRequests(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                )}
              </div>
            </div>

            {hasChildren && (
              <div className="pt-5 border-t border-gray-100 animate-in fade-in slide-in-from-top-2 space-y-4">
                <label className="block text-sm font-bold text-gray-900 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
                  <span>👶 Edades individuales de los {children} niño{children !== 1 ? 's' : ''} (*)</span>
                  <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[9px] font-bold uppercase">Edad Requerida</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 bg-gray-50/60 p-4 rounded-2xl border border-gray-150">
                  {Array.from({ length: children }).map((_, idx) => (
                    <div key={idx} className="space-y-1">
                      <label className="block text-[10px] font-bold text-gray-550 uppercase text-[9px]">Niño {idx + 1} (*)</label>
                      <input 
                        type="number" 
                        min="0"
                        max="17"
                        className="input-premium w-full text-xs font-semibold bg-white" 
                        placeholder="Ej. 6" 
                        required 
                        value={individualAges[idx] || ''}
                        onChange={(e) => {
                          const newAges = [...individualAges];
                          newAges[idx] = e.target.value;
                          setIndividualAges(newAges);
                          setChildrenAges(newAges.filter(a => a !== '').join(', '));
                        }}
                        disabled={isLoading}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ficha de Registro y Check-in Anticipado (Fase 2) */}
            <div className="pt-6 border-t border-gray-100 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-[#11d442]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Ficha de Registro y Check-in Anticipado (Opcional)
                </h3>
                <p className="text-xs text-gray-500 mt-1">Completa estos datos para agilizar el ingreso a tu llegada a las cabañas del Rancho.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1">
                    🚗 Patente / Matrícula Vehículo
                  </label>
                  <input 
                    type="text" 
                    className="input-premium w-full text-sm" 
                    placeholder="Ej. AB-CD-12 o JWT-45" 
                    value={vehiclePlate}
                    onChange={(e) => setVehiclePlate(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1">
                    🌎 Nacionalidad / Ciudad
                  </label>
                  <input 
                    type="text" 
                    className="input-premium w-full text-sm" 
                    placeholder="Ej. Chilena o Santiago" 
                    value={guestNationality}
                    onChange={(e) => setGuestNationality(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1">
                    🎂 Fecha de Nacimiento
                  </label>
                  <input 
                    type="date" 
                    className="input-premium w-full text-sm appearance-none bg-no-repeat bg-[right_1rem_center]" 
                    value={guestBirthdate}
                    onChange={(e) => setGuestBirthdate(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1">
                  ✨ Preferencias, Alergias u Observaciones Especiales
                </label>
                <textarea 
                  className="input-premium w-full text-sm h-20 resize-none py-2" 
                  placeholder="Ej. Requiero cama adicional, alérgico al gluten, viajo con mascota, etc." 
                  value={guestPreferences}
                  onChange={(e) => setGuestPreferences(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <label className="block text-sm font-medium text-gray-700 mb-2">Fechas Seleccionadas</label>
              <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div className="flex-1">
                  <p className="text-xs text-gray-500 uppercase font-bold mb-1">Check-in (15 a 21 hrs)</p>
                  <p className="font-medium text-gray-900">{formatearFecha(checkIn)}</p>
                </div>
                <div className="w-px h-10 bg-gray-300"></div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 uppercase font-bold mb-1">Check-out (12 hrs)</p>
                  <p className="font-medium text-gray-900">{formatearFecha(checkOut)}</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <label className="flex items-center gap-3 cursor-pointer p-4 bg-blue-50/50 border border-blue-100 rounded-xl hover:bg-blue-50 transition-colors">
                <input 
                  type="checkbox" 
                  className="w-5 h-5 text-blue-600 focus:ring-blue-500 rounded border-gray-300"
                  checked={requiresInvoice}
                  onChange={(e) => setRequiresInvoice(e.target.checked)}
                />
                <div>
                  <span className="block text-sm font-bold text-blue-900">Requiere Boleta / Factura</span>
                  <span className="block text-xs text-blue-700 mt-0.5">Se agregará un 19% de IVA al total de la reserva.</span>
                </div>
              </label>

              {requiresInvoice && (
                <div className="mt-4 p-4 bg-blue-50/30 rounded-xl border border-blue-100 space-y-4 animate-in fade-in slide-in-from-top-2">
                  <h4 className="font-bold text-blue-900 text-sm">Datos para Facturación</h4>
                  <div>
                    <label className="block text-xs font-bold text-blue-800 uppercase mb-1">RUT Empresa (*)</label>
                    <input 
                      type="text" 
                      className="input-premium w-full bg-white border-blue-200 focus:ring-blue-500" 
                      placeholder="Ej. 76.123.456-K" 
                      required={requiresInvoice}
                      value={invoiceRut}
                      onChange={(e) => setInvoiceRut(formatRut(e.target.value))}
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-blue-800 uppercase mb-1">Razón Social (*)</label>
                    <input 
                      type="text" 
                      className="input-premium w-full bg-white border-blue-200 focus:ring-blue-500" 
                      placeholder="Ej. Comercializadora Limitada" 
                      required={requiresInvoice}
                      value={invoiceName}
                      onChange={(e) => setInvoiceName(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-blue-800 uppercase mb-1">Giro (*)</label>
                    <input 
                      type="text" 
                      className="input-premium w-full bg-white border-blue-200 focus:ring-blue-500" 
                      placeholder="Ej. Venta al por menor" 
                      required={requiresInvoice}
                      value={invoiceGiro}
                      onChange={(e) => setInvoiceGiro(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* SELECCIÓN DE MÉTODO DE PAGO */}
            <div className="pt-6 border-t border-gray-100 space-y-4">
              <div>
                <label className="block text-base font-bold text-gray-900 flex items-center justify-between">
                  <span>💳 Elige tu Método de Pago para el Abono del 50%</span>
                  <span className="text-xs font-semibold text-[#11d442] bg-[#11d442]/10 px-2.5 py-1 rounded-full">
                    Abono hoy: {formatMoney(abono)}
                  </span>
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  El 50% restante ({formatMoney(restante)}) se salda de forma presencial o por el portal antes del Check-in.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {/* Opción 1: Pago Online */}
                <label 
                  className={`relative flex items-start gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    paymentMethod === 'mercadopago' 
                      ? 'border-[#009EE3] bg-[#009EE3]/5 shadow-sm' 
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                  onClick={() => setPaymentMethod('mercadopago')}
                >
                  <input 
                    type="radio" 
                    name="payment_method" 
                    value="mercadopago"
                    checked={paymentMethod === 'mercadopago'}
                    onChange={() => setPaymentMethod('mercadopago')}
                    className="mt-1 w-4 h-4 text-[#009EE3] focus:ring-[#009EE3]"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-900 text-sm flex items-center gap-2">
                        <span>💳 Pago Online (Tarjetas Débito / Crédito / Webpay)</span>
                        <span className="bg-[#009EE3] text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Inmediato
                        </span>
                      </span>
                      <span className="text-xs font-bold text-gray-900">{formatMoney(abono)}</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                      Paga de forma rápida y segura con <strong>Tarjetas de Débito, Redcompra, Tarjetas de Crédito (en cuotas) o Webpay</strong> a través de nuestra pasarela protegida. Confirmación e ingreso automático de tu reserva.
                    </p>
                  </div>
                </label>

                {/* Opción 2: Transferencia Bancaria */}
                <label 
                  className={`relative flex items-start gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    paymentMethod === 'transferencia' 
                      ? 'border-emerald-600 bg-emerald-50/40 shadow-sm' 
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                  onClick={() => setPaymentMethod('transferencia')}
                >
                  <input 
                    type="radio" 
                    name="payment_method" 
                    value="transferencia"
                    checked={paymentMethod === 'transferencia'}
                    onChange={() => setPaymentMethod('transferencia')}
                    className="mt-1 w-4 h-4 text-emerald-600 focus:ring-emerald-600"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-900 text-sm flex items-center gap-2">
                        <span>🏦 Transferencia Bancaria Directa</span>
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Manual
                        </span>
                      </span>
                      <span className="text-xs font-bold text-gray-900">{formatMoney(abono)}</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                      Transfiere el abono directamente a nuestra cuenta bancaria. Te mostraremos los datos de la cuenta en el siguiente paso para enviar el comprobante por WhatsApp.
                    </p>
                  </div>
                </label>
              </div>
            </div>
            
          </form>
        </div>

        {/* Políticas de la casa */}
        <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200 mb-8">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Políticas de Rancho Carmelitas
          </h3>
          <ul className="text-sm text-gray-600 space-y-3 list-disc pl-5">
            <li><strong>Cancelaciones:</strong> Se puede cancelar hasta 5 días previo al check-in y se devolverá el total de la reserva, pasado este periodo no se hará devolución del abono.</li>
            <li><strong>Reagendamiento:</strong> Ofrecemos la opción de reagendar, sujeto a disponibilidad de cabañas.</li>
            <li><strong>Edad Mínima:</strong> Sólo pueden hacer reservas mayores de 18 años.</li>
            <li><strong>Horarios:</strong> Check in: de 15:00 a 21:00 hrs. Check out: 12:00 hrs.</li>
          </ul>
        </div>

        <Button 
          size="lg" 
          fullWidth 
          onClick={handleSubmit} 
          disabled={isLoading}
          className="relative py-4 text-base font-bold shadow-lg"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {simulationStep || 'Procesando...'}
            </span>
          ) : (
            paymentMethod === 'mercadopago' ? `Pagar Abono Online (${formatMoney(abono)})` :
            `Confirmar Reserva y Ver Datos para Transferir (${formatMoney(abono)})`
          )}
        </Button>

        {/* MODAL DE PROCESAMIENTO (UX FEEDBACK) */}
        {isLoading && simulationStep && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center space-y-4 shadow-2xl border border-gray-100">
              <div className="w-16 h-16 bg-[#009EE3]/10 rounded-full flex items-center justify-center mx-auto text-[#009EE3]">
                <svg className="animate-spin h-8 w-8" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900">Procesando Pago Seguro</h3>
              <p className="text-sm text-gray-600 font-medium animate-pulse">{simulationStep}</p>
              <div className="text-[11px] text-gray-400">Rancho Carmelitas • Transacción Segura y Encriptada</div>
            </div>
          </div>
        )}
      </div>

      {/* Resumen Lateral */}
      <div className="w-full lg:w-[400px]">
        <div className="sticky top-24 bg-white rounded-3xl premium-shadow border border-gray-100 overflow-hidden">
          <div className="relative h-48 w-full">
            {cabin.imageUrl ? (
              <Image
                src={cabin.imageUrl}
                alt={cabin.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-100 flex flex-col items-center justify-center text-gray-400 gap-1.5 border-b border-gray-100">
                <svg className="w-8 h-8 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span className="text-xs font-semibold">Sin imagen de cabaña</span>
              </div>
            )}
          </div>
          <div className="p-6">
            <div className="flex justify-between items-start mb-4 pb-4 border-b border-gray-100">
              <div>
                <p className="text-sm text-gray-500 mb-1">Resumen de la estancia</p>
                <h3 className="text-xl font-bold text-gray-900">{cabin.name}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {adults} Adulto{adults > 1 ? 's' : ''}
                  {children > 0 ? `, ${children} Niño${children > 1 ? 's' : ''}` : ''}
                </p>
              </div>
            </div>

            <div className="space-y-3 text-sm text-gray-700 mb-6 pb-6 border-b border-gray-100">
              <div className="flex justify-between">
                <span>{formatMoney(cabin.price)} x {nights} noche{nights > 1 ? 's' : ''}</span>
                <span>{formatMoney(cabin.price * nights)}</span>
              </div>
              {extraGuests > 0 && (
                <div className="flex justify-between text-orange-600">
                  <span>+{extraGuests} adicionales</span>
                  <span>{formatMoney(extraCostTotal)}</span>
                </div>
              )}
              {requiresInvoice && (
                <div className="flex justify-between text-gray-500">
                  <span>IVA (19%)</span>
                  <span>{formatMoney(iva)}</span>
                </div>
              )}
              {descuentoRedondeo > 0 && (
                <div className="flex justify-between text-[#11d442] font-semibold text-xs animate-in fade-in">
                  <span>Descuento por redondeo</span>
                  <span>-{formatMoney(descuentoRedondeo)}</span>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center text-lg font-bold text-gray-900">
                <span>Total Reserva</span>
                <span>{formatMoney(totalConImpuestos)}</span>
              </div>

              <div className="bg-[#11d442]/10 rounded-xl p-4 border border-[#11d442]/20">
                <div className="flex justify-between items-center text-[#11d442] font-bold mb-1">
                  <span>Abono requerido hoy (50%)</span>
                  <span>{formatMoney(abono)}</span>
                </div>
                <div className="flex justify-between items-center text-sm text-gray-600">
                  <span>Pago restante al Check-in</span>
                  <span>{formatMoney(restante)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
