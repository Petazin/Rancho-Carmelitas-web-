'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';

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
  const [childrenAges, setChildrenAges] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Cálculos reactivos
  const iva = requiresInvoice ? totalBase * 0.19 : 0;
  const totalConImpuestosRaw = totalBase + iva;
  // Redondear siempre hacia abajo a 1000
  const totalConImpuestos = Math.floor(totalConImpuestosRaw / 1000) * 1000;
  const descuentoRedondeo = totalConImpuestosRaw - totalConImpuestos;
  const abono = totalConImpuestos * 0.5;
  const restante = totalConImpuestos - abono;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      // 1. VALIDACIÓN DE CONTACTO
      if (!guestName.trim() || !guestEmail.trim() || !guestPhone.trim()) {
        setErrorMsg('Por favor completa todos los datos de contacto obligatorios (Nombre, Correo y Teléfono).');
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

      // 2. INSERTAR EN DB
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
            check_in: checkIn,
            check_out: checkOut,
            adults,
            children,
            children_ages: hasChildren ? childrenAges : null,
            travel_reason: finalTravelReason,
            special_requests: null, // Por ahora el special requests se usó para "otro"
            requires_invoice: requiresInvoice,
            total_price: totalConImpuestos,
            extra_guests_cost: extraCostTotal,
            status: 'pending'
          }
        ])
        .select();

      if (error || !data || data.length === 0) {
          throw new Error(error?.message || 'Error desconocido al guardar en base de datos.');
      }

      // 3. Enviar correos de confirmación (Cliente y Dueño)
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
            bookingId: data[0].id
          })
        });
      } catch (emailErr) {
        console.error('Error al intentar enviar los correos:', emailErr);
        // No bloqueamos al usuario si falla el mail, ya que la reserva está en DB.
      }

      // Éxito, redirigir a página de confirmación
      router.push(`/checkout/success?bookingId=${data[0].id}`);

    } catch (err: any) {
      console.warn('Error al guardar reserva:', err);
      setErrorMsg(err.message || 'Ocurrió un error al procesar tu reserva. Inténtalo de nuevo.');
      setIsLoading(false);
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
            <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm font-medium border border-red-100">
              {errorMsg}
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
              <div className="pt-4 border-t border-gray-100 animate-in fade-in slide-in-from-top-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Edades de los {children} niño{children !== 1 ? 's' : ''} (*)</label>
                <input 
                  type="text" 
                  className="input-premium w-full" 
                  placeholder="Ej: 3, 5 y 8 años" 
                  required 
                  value={childrenAges}
                  onChange={(e) => setChildrenAges(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            )}

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
                      onChange={(e) => setInvoiceRut(e.target.value)}
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
        >
          {isLoading ? 'Procesando...' : 'Confirmar Reserva y Proceder al Pago del Abono'}
        </Button>
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
                <span>${cabin.price.toLocaleString()} x {nights} noche{nights > 1 ? 's' : ''}</span>
                <span>${(cabin.price * nights).toLocaleString()}</span>
              </div>
              {extraGuests > 0 && (
                <div className="flex justify-between text-orange-600">
                  <span>+{extraGuests} adicionales</span>
                  <span>${Math.round(extraCostTotal).toLocaleString()}</span>
                </div>
              )}
              {requiresInvoice && (
                <div className="flex justify-between text-gray-500">
                  <span>IVA (19%)</span>
                  <span>${iva.toLocaleString()}</span>
                </div>
              )}
              {descuentoRedondeo > 0 && (
                <div className="flex justify-between text-[#11d442] font-semibold text-xs animate-in fade-in">
                  <span>Descuento por redondeo</span>
                  <span>-${Math.round(descuentoRedondeo).toLocaleString()}</span>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center text-lg font-bold text-gray-900">
                <span>Total Reserva</span>
                <span>${totalConImpuestos.toLocaleString()}</span>
              </div>

              <div className="bg-[#11d442]/10 rounded-xl p-4 border border-[#11d442]/20">
                <div className="flex justify-between items-center text-[#11d442] font-bold mb-1">
                  <span>Abono requerido hoy (50%)</span>
                  <span>${abono.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-sm text-gray-600">
                  <span>Pago restante al Check-in</span>
                  <span>${restante.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
