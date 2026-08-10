'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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

interface BookingFormProps {
  cabin: any;
  cabinId: string;
}

export function BookingForm({ cabin, cabinId }: BookingFormProps) {
  const [checkIn, setCheckIn] = useState<string | null>(null);
  const [checkOut, setCheckOut] = useState<string | null>(null);
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);

  const [isOpenAdults, setIsOpenAdults] = useState(false);
  const [isOpenChildren, setIsOpenChildren] = useState(false);

  // Estados para disponibilidad
  const [existingBookings, setExistingBookings] = useState<any[]>([]);
  const [existingClosures, setExistingClosures] = useState<any[]>([]);
  const [isChecking, setIsChecking] = useState(true);

  // Estado del calendario interactivo
  const [currentDate, setCurrentDate] = useState(new Date());

  // Obtener reservas y cierres existentes para la cabaña al montar
  useEffect(() => {
    async function fetchData() {
      setIsChecking(true);
      
      // Cargar reservas
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select('check_in, check_out')
        .eq('cabin_id', cabinId)
        .neq('status', 'Cancelada');
      
      // Cargar cierres (individuales y totales)
      const { data: closuresData } = await supabase
        .from('cabin_closures')
        .select('cabin_id, start_date, end_date, reason')
        .or(`cabin_id.eq.${cabinId},cabin_id.is.null`);
      
      setExistingBookings(bookingsData || []);
      setExistingClosures(closuresData || []);
      setIsChecking(false);
    }
    fetchData();
  }, [cabinId]);

  // Validar solapamiento de forma sincrónica durante la fase de renderizado para evitar lags o parpadeos visuales
  const checkOverlap = () => {
    if (!checkIn || !checkOut) return false;

    const selectedIn = new Date(checkIn);
    const selectedOut = new Date(checkOut);

    // Validar reservas en conflicto
    for (const b of existingBookings) {
      const bookedIn = new Date(b.check_in);
      const bookedOut = new Date(b.check_out);
      
      if (selectedIn < bookedOut && selectedOut > bookedIn) {
        return false;
      }
    }

    // Validar cierres en conflicto (individuales o totales)
    for (const c of existingClosures) {
      const closureIn = new Date(c.start_date);
      const closureOut = new Date(c.end_date);
      
      // El cierre dura todo el día de inicio y de término inclusive
      if (selectedIn <= closureOut && selectedOut >= closureIn) {
        return false;
      }
    }

    return true;
  };

  const isAvailable = checkOverlap();


  const isDateBooked = (dateStr: string) => {
    return existingBookings.some(b => {
      return dateStr >= b.check_in && dateStr < b.check_out;
    });
  };

  const isDateClosed = (dateStr: string) => {
    return existingClosures.some(c => {
      return dateStr >= c.start_date && dateStr <= c.end_date;
    });
  };

  const getClosureReason = (dateStr: string) => {
    const closure = existingClosures.find(c => dateStr >= c.start_date && dateStr <= c.end_date);
    return closure ? closure.reason : '';
  };

  const isDateInSelectedRange = (dateStr: string) => {
    if (checkIn && checkOut) {
      return dateStr > checkIn && dateStr < checkOut;
    }
    return false;
  };

  const handleDateClick = (dateStr: string) => {
    if (isDateBooked(dateStr) || isDateClosed(dateStr)) return; // Ignorar ocupados y cerrados

    if (!checkIn || (checkIn && checkOut)) {
      // Nueva selección de inicio
      setCheckIn(dateStr);
      setCheckOut(null);
    } else if (checkIn && !checkOut) {
      if (dateStr < checkIn) {
        // Seleccionó una fecha anterior, reiniciar checkIn
        setCheckIn(dateStr);
      } else if (dateStr === checkIn) {
        // Clic en el mismo día, ignorar o reiniciar
        setCheckIn(null);
      } else {
        // Verificar si hay fechas ocupadas o cerradas en el medio del rango
        const inDate = new Date(checkIn);
        const outDate = new Date(dateStr);
        let hasOverlap = false;
        
        for (const b of existingBookings) {
            const bIn = new Date(b.check_in);
            const bOut = new Date(b.check_out);
            if (inDate < bOut && outDate > bIn) {
                hasOverlap = true;
                break;
            }
        }

        if (!hasOverlap) {
            for (const c of existingClosures) {
                const cIn = new Date(c.start_date);
                const cOut = new Date(c.end_date);
                if (inDate <= cOut && outDate >= cIn) {
                    hasOverlap = true;
                    break;
                }
            }
        }

        if (hasOverlap) {
            // El rango cruza una reserva existente o cierre. Reseteamos el checkIn a esta nueva fecha
            setCheckIn(dateStr);
        } else {
            setCheckOut(dateStr);
        }
      }
    }
  };


  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay(); // 0 is Sunday
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const todayStr = new Date().toISOString().split('T')[0];
    
    const days = [];
    
    for (let i = 0; i < firstDay; i++) {
        days.push(<div key={`empty-${i}`} className="p-2"></div>);
    }
    
    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month+1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        
        const isPast = dateStr < todayStr;
        const booked = isDateBooked(dateStr);
        const closed = isDateClosed(dateStr);
        const closureReason = closed ? getClosureReason(dateStr) : '';
        const isCheckIn = checkIn === dateStr;
        const isCheckOut = checkOut === dateStr;
        const inRange = isDateInSelectedRange(dateStr);

        let cellClasses = "h-10 w-full flex items-center justify-center text-sm font-medium rounded-full transition-all cursor-pointer relative ";
        
        if (isPast) {
            cellClasses += "text-gray-300 cursor-not-allowed";
        } else if (booked) {
            cellClasses += "bg-red-50 text-red-400 line-through cursor-not-allowed";
        } else if (closed) {
            cellClasses += "bg-gray-100 text-gray-400 line-through cursor-not-allowed border border-dashed border-gray-300";
        } else if (isCheckIn || isCheckOut) {
            cellClasses += "bg-[#11d442] text-white shadow-md z-10 font-bold";
        } else if (inRange) {
            cellClasses += "bg-[#11d442]/10 text-[#11d442]";
        } else {
            cellClasses += "text-gray-700 hover:bg-gray-100";
        }

        // Estilos para el background del rango visual conectivo
        let rangeBgClasses = "";
        if (isCheckIn && checkOut) {
            rangeBgClasses = "absolute top-0 bottom-0 right-0 left-1/2 bg-[#11d442]/10 -z-10";
        } else if (isCheckOut && checkIn) {
            rangeBgClasses = "absolute top-0 bottom-0 left-0 right-1/2 bg-[#11d442]/10 -z-10";
        } else if (inRange) {
            rangeBgClasses = "absolute top-0 bottom-0 left-0 right-0 bg-[#11d442]/10 -z-10";
        }

        // Check if full booked/closed range (prevents selecting)
        const isSelectable = !isPast && !booked && !closed;

        days.push(
            <div key={d} className="relative py-1 px-0.5">
                {rangeBgClasses && <div className={rangeBgClasses}></div>}
                <button 
                  type="button"
                  onClick={() => isSelectable && handleDateClick(dateStr)}
                  disabled={!isSelectable}
                  className={cellClasses}
                  aria-label={dateStr}
                  title={closed ? `Cerrado por: ${closureReason}` : undefined}
                >
                  {d}
                </button>
            </div>
        );
    }
    
    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 mb-6">
            <div className="flex items-center justify-between mb-4">
                <button 
                  type="button"
                  onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
                  className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <div className="font-bold text-gray-900 capitalize">
                  {currentDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}
                </div>
                <button 
                  type="button"
                  onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
                  className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
            </div>
            <div className="grid grid-cols-7 mb-2">
                {['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'].map(d => (
                    <div key={d} className="text-center text-xs font-bold text-gray-400">{d}</div>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-y-1">
                {days}
            </div>
            <div className="flex gap-4 mt-4 text-[10px] font-bold uppercase text-gray-500 justify-center">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#11d442]"></span> Seleccionado</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-100 border border-red-200"></span> Reservado</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-gray-100 border border-dashed border-gray-300"></span> Cerrado</span>
            </div>
        </div>
    );
  };

  // Cálculo de huéspedes adicionales y precio
  const maxExtraGuests = cabin.max_extra_guests || 0;
  const maxTotalGuests = cabin.capacity + maxExtraGuests;
  const surchargePercentage = cabin.extra_guest_surcharge_percentage || 100;
  
  const totalGuests = adults + children;
  const extraGuests = Math.max(0, totalGuests - cabin.capacity);
  const pricePerPerson = cabin.price / cabin.capacity;
  const surchargePerExtraPerson = pricePerPerson * (surchargePercentage / 100);
  const extraCostPerNight = extraGuests * surchargePerExtraPerson;
  const finalPricePerNight = cabin.price + extraCostPerNight;

  // Calculamos noches y precio total estimado
  let nights = 0;
  let totalEstimadoRaw = 0;
  let totalEstimado = 0;
  let descuentoRedondeo = 0;

  if (checkIn && checkOut) {
    const inDate = new Date(checkIn);
    const outDate = new Date(checkOut);
    nights = Math.max(1, Math.ceil((outDate.getTime() - inDate.getTime()) / (1000 * 60 * 60 * 24)));
    totalEstimadoRaw = nights * finalPricePerNight;
    // Redondear siempre hacia abajo a la decena (múltiplo de 10)
    totalEstimado = Math.floor(totalEstimadoRaw / 10) * 10;
    descuentoRedondeo = totalEstimadoRaw - totalEstimado;
  }

  // Construimos la URL con los parámetros
  const checkoutUrl = `/checkout/${cabinId}?checkIn=${checkIn}&checkOut=${checkOut}&adults=${adults}&children=${children}`;

  return (
    <div className="sticky top-24 bg-white rounded-3xl premium-shadow p-8 border border-gray-100">
      <div className="flex items-end gap-2 mb-6">
        <span className="text-3xl font-bold text-gray-900">{formatMoney(cabin.price)}</span>
        <span className="text-gray-500 mb-1">/ noche</span>
      </div>

      <div className="mb-2">
        <h3 className="font-bold text-gray-900 mb-2">Selecciona tus fechas</h3>
        {renderCalendar()}
      </div>

      {(isOpenAdults || isOpenChildren) && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => { setIsOpenAdults(false); setIsOpenChildren(false); }}
        />
      )}

      {maxExtraGuests > 0 && (
        <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 text-xs text-orange-900 mb-6 space-y-1.5 animate-in fade-in shadow-sm">
          <p className="font-bold flex items-center gap-1.5 text-orange-950 text-[13px]">
            <span>ℹ️ Capacidad y Huéspedes Adicionales</span>
          </p>
          <p className="leading-relaxed font-medium">
            Esta cabaña tiene una capacidad base de <strong className="text-orange-950">{cabin.capacity} huéspedes</strong> y admite hasta <strong className="text-orange-950">{maxExtraGuests} huéspedes adicionales</strong>.
          </p>
          <p className="pt-1.5 border-t border-orange-200/50 font-semibold text-orange-950 flex justify-between items-center text-[12px]">
            <span>Valor por adicional:</span>
            <span className="bg-orange-100 text-orange-850 px-2 py-0.5 rounded-lg border border-orange-200">{formatMoney(surchargePerExtraPerson)} / noche</span>
          </p>
        </div>
      )}

      <div className="border border-gray-200 rounded-2xl mb-6 bg-white shadow-sm ring-1 ring-gray-900/5 relative z-50">
        <div className="grid grid-cols-2">
          {/* Adultos Dropdown */}
          <div className="relative border-r border-gray-200">
            <button 
              type="button"
              onClick={() => { setIsOpenAdults(!isOpenAdults); setIsOpenChildren(false); }}
              className="w-full text-left p-3 hover:bg-gray-50 focus:bg-gray-50 transition-colors rounded-l-2xl group"
            >
              <span className="block font-bold text-gray-900 uppercase text-[10px] tracking-wider mb-1">Adultos</span>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-[#11d442] group-hover:scale-110 transition-transform flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="w-full text-sm font-semibold text-gray-900">{adults}</span>
                <svg className={`w-4 h-4 text-gray-500 transition-transform ${isOpenAdults ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>
            {isOpenAdults && (
              <ul className="absolute top-full left-0 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-lg z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                {[...Array(Math.max(1, maxTotalGuests - children))].map((_, i) => (
                  <li key={i + 1}>
                    <button
                      type="button"
                      className="w-full text-left px-4 py-3 text-sm font-semibold text-gray-900 hover:bg-[#11d442]/10 hover:text-[#11d442] transition-colors"
                      onClick={() => { setAdults(i + 1); setIsOpenAdults(false); }}
                    >
                      {i + 1}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Niños Dropdown */}
          <div className="relative">
            <button 
              type="button"
              onClick={() => { setIsOpenChildren(!isOpenChildren); setIsOpenAdults(false); }}
              className="w-full text-left p-3 hover:bg-gray-50 focus:bg-gray-50 transition-colors rounded-r-2xl group"
            >
              <span className="block font-bold text-gray-900 uppercase text-[10px] tracking-wider mb-1">Niños</span>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-[#11d442] group-hover:scale-110 transition-transform flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <span className="w-full text-sm font-semibold text-gray-900">{children}</span>
                <svg className={`w-4 h-4 text-gray-500 transition-transform ${isOpenChildren ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>
            {isOpenChildren && (
              <ul className="absolute top-full left-0 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-lg z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                <li key={0}>
                  <button
                    type="button"
                    className="w-full text-left px-4 py-3 text-sm font-semibold text-gray-900 hover:bg-[#11d442]/10 hover:text-[#11d442] transition-colors"
                    onClick={() => { setChildren(0); setIsOpenChildren(false); }}
                  >
                    0
                  </button>
                </li>
                {[...Array(Math.max(0, maxTotalGuests - adults))].map((_, i) => (
                  <li key={i + 1}>
                    <button
                      type="button"
                      className="w-full text-left px-4 py-3 text-sm font-semibold text-gray-900 hover:bg-[#11d442]/10 hover:text-[#11d442] transition-colors"
                      onClick={() => { setChildren(i + 1); setIsOpenChildren(false); }}
                    >
                      {i + 1}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <div className="mb-6 space-y-2 text-sm text-gray-600">
        <div className="flex justify-between">
          <span>{formatMoney(cabin.price)} x {nights} noche{nights > 1 ? 's' : ''}</span>
          <span>{formatMoney(cabin.price * nights)}</span>
        </div>
        {extraGuests > 0 && (
          <div className="flex justify-between text-orange-600">
            <span>+{extraGuests} adicionales ({formatMoney(extraCostPerNight)} x {nights} noche{nights > 1 ? 's' : ''})</span>
            <span>{formatMoney(extraCostPerNight * nights)}</span>
          </div>
        )}
        {descuentoRedondeo > 0 && (
          <div className="flex justify-between text-[#11d442] font-semibold text-xs animate-in fade-in">
            <span>Descuento por redondeo</span>
            <span>-{formatMoney(descuentoRedondeo)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-100">
          <span>Total</span>
          <span>{formatMoney(totalEstimado)}</span>
        </div>
      </div>

      {isChecking ? (
        <Button size="lg" fullWidth disabled>Verificando disponibilidad...</Button>
      ) : (!checkIn || !checkOut) ? (
        <Button size="lg" fullWidth disabled className="bg-gray-300">Selecciona tus fechas primero</Button>
      ) : isAvailable ? (
        <Link href={checkoutUrl} className="block w-full">
          <Button size="lg" fullWidth>
            Confirmar y Reservar
          </Button>
        </Link>
      ) : (
        <Button size="lg" fullWidth className="bg-red-500 hover:bg-red-600 text-white cursor-not-allowed" disabled>
          Fechas No Disponibles
        </Button>
      )}
      
      <p className="text-center text-sm mt-4">
        {(!checkIn || !checkOut) ? (
          <span className="text-gray-400">Haz clic en el calendario arriba para elegir tu rango de estancia</span>
        ) : isAvailable ? (
          <span className="text-gray-400">No se hará ningún cargo aún</span>
        ) : (checkIn && checkOut && existingClosures.some(c => {
            const closureIn = new Date(c.start_date);
            const closureOut = new Date(c.end_date);
            const selectedIn = new Date(checkIn);
            const selectedOut = new Date(checkOut);
            return selectedIn <= closureOut && selectedOut >= closureIn;
          })) ? (
          <span className="text-red-500 font-semibold animate-pulse">
            ⚠️ Cierre Temporal: Esta cabaña no está disponible en las fechas seleccionadas por: "{
              existingClosures.find(c => {
                const closureIn = new Date(c.start_date);
                const closureOut = new Date(c.end_date);
                const selectedIn = new Date(checkIn);
                const selectedOut = new Date(checkOut);
                return selectedIn <= closureOut && selectedOut >= closureIn;
              })?.reason || 'Mantención'
            }".
          </span>
        ) : (
          <span className="text-red-500 font-medium">⚠️ Alguna de las fechas en tu rango ya fue reservada.</span>
        )}
      </p>
    </div>
  );
}
