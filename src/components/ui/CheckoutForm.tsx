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
  };
}

export function CheckoutForm({ cabin, checkoutData }: CheckoutFormProps) {
  const { checkIn, checkOut, adults, children, nights, totalBase } = checkoutData;
  const guests = adults + children;
  const hasChildren = children > 0;
  
  const router = useRouter();

  // Estados del formulario
  const [requiresInvoice, setRequiresInvoice] = useState(false);
  const [motivoViaje, setMotivoViaje] = useState('');
  
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [childrenAges, setChildrenAges] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Cálculos reactivos
  const iva = requiresInvoice ? totalBase * 0.19 : 0;
  const totalConImpuestos = totalBase + iva;
  const abono = totalConImpuestos * 0.5;
  const restante = totalConImpuestos - abono;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      const finalTravelReason = motivoViaje === 'otro' ? `Otro: ${specialRequests}` : motivoViaje;

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
            status: 'pending'
          }
        ])
        .select();

      if (error) throw error;

      // 2. Enviar correos de confirmación (Cliente y Dueño)
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
      console.error('Error al guardar reserva:', err);
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
            <Image
              src={cabin.imageUrl}
              alt={cabin.name}
              fill
              className="object-cover"
            />
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
                <span>${cabin.price} x {nights} noche{nights > 1 ? 's' : ''}</span>
                <span>${totalBase}</span>
              </div>
              {requiresInvoice && (
                <div className="flex justify-between text-gray-500">
                  <span>IVA (19%)</span>
                  <span>${iva}</span>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center text-lg font-bold text-gray-900">
                <span>Total Reserva</span>
                <span>${totalConImpuestos}</span>
              </div>

              <div className="bg-[#11d442]/10 rounded-xl p-4 border border-[#11d442]/20">
                <div className="flex justify-between items-center text-[#11d442] font-bold mb-1">
                  <span>Abono requerido hoy (50%)</span>
                  <span>${abono}</span>
                </div>
                <div className="flex justify-between items-center text-sm text-gray-600">
                  <span>Pago restante al Check-in</span>
                  <span>${restante}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
