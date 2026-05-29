'use client';

import { useEffect, useState, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Booking {
  id: string;
  guest_name: string;
  guest_email: string;
  guest_phone?: string;
  cabin_id: string;
  check_in: string;
  check_out: string;
  total_price: number;
  status: string;
  created_at: string;
  confirmed_at?: string;
  confirmed_by?: string;
  cabin?: { name: string };
  discount_applied?: number;
  admin_notes?: string;
  extra_guests_cost?: number;
  adults?: number;
  children?: number;
  payment_reference?: string;
  payment_amount?: number;
  payment_receipt_url?: string;
  plataforma_id?: string;
  plataforma_comision_aplicada?: number;
  admin_comision_porcentaje?: number;
  requires_invoice?: boolean;
  plataforma?: { nombre: string };
  admin_notified_conflict?: boolean;
  guest_rut?: string;
  vehicle_plate?: string;
  guest_nationality?: string;
  guest_preferences?: string;
  guest_birthdate?: string;
  booking_payments?: any[];
}

const parseLocalDate = (dateStr: string) => {
  if (!dateStr) return null;
  const cleanStr = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
  const parts = cleanStr.split('-');
  if (parts.length !== 3) return null;
  return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
};

const formatDateString = (dateInput: string | Date | undefined | null) => {
  if (!dateInput) return '';
  if (typeof dateInput === 'string') {
    return dateInput.includes('T') ? dateInput.split('T')[0] : dateInput;
  }
  const year = dateInput.getFullYear();
  const month = String(dateInput.getMonth() + 1).padStart(2, '0');
  const day = String(dateInput.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

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

const calcularTarifaOficial = (cabin: any, checkIn: string, checkOut: string, adults: number, children: number) => {
  if (!cabin || !checkIn || !checkOut) return 0;
  
  const start = parseLocalDate(checkIn);
  const end = parseLocalDate(checkOut);
  if (!start || !end || start >= end) return 0;

  const nights = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  const totalGuests = (Number(adults) || 1) + (Number(children) || 0);
  const capacity = cabin.capacity || 2;
  const pricePerNight = cabin.price_per_night || 0;
  const maxExtraGuests = cabin.max_extra_guests || 0;
  const surchargePercentage = cabin.extra_guest_surcharge_percentage || 100;

  const extraGuests = Math.max(0, totalGuests - capacity);
  const pricePerPerson = pricePerNight / capacity;
  const surchargePerExtraPerson = pricePerPerson * (surchargePercentage / 100);
  const extraCostPerNight = extraGuests * surchargePerExtraPerson;
  const finalPricePerNight = pricePerNight + extraCostPerNight;

  const totalRaw = nights * finalPricePerNight;
  // Redondear siempre hacia abajo a la decena (múltiplo de 10)
  return Math.floor(totalRaw / 10) * 10;
};

const getBookingBreakdown = (booking: Booking) => {
  const platComPct = booking.plataforma_comision_aplicada || 0;
  const adminComPct = booking.admin_comision_porcentaje || 0;
  const discount = booking.discount_applied || 0;
  
  const aplicaIVA = !!booking.requires_invoice;
  const totalCliente = booking.total_price || 0;

  // Reconstrucción inversa del Precio Base Neto
  let precioBaseNeto = 0;
  if (aplicaIVA) {
    precioBaseNeto = totalCliente / (1.19 * (1 + platComPct / 100));
  } else {
    precioBaseNeto = totalCliente / (1 + platComPct / 100);
  }
  
  // Redondear para evitar decimales flotantes
  precioBaseNeto = Math.round(precioBaseNeto);
  
  const precioBaseOriginal = precioBaseNeto + discount;
  const comisionPlataformaMonto = Math.round(precioBaseNeto * (platComPct / 100));
  const ivaMonto = aplicaIVA ? Math.round((precioBaseNeto + comisionPlataformaMonto) * 0.19) : 0;
  const adminComisionMonto = Math.round(totalCliente * (adminComPct / 100));
  const pagoNetoDueño = totalCliente - adminComisionMonto;
  const precioBrutoSinIva = Math.round(aplicaIVA ? totalCliente / 1.19 : totalCliente);

  return {
    precioBaseOriginal,
    discount,
    precioBaseNeto,
    platComPct,
    comisionPlataformaMonto,
    ivaMonto,
    totalCliente,
    adminComPct,
    adminComisionMonto,
    pagoNetoDueño,
    precioBrutoSinIva,
    aplicaIVA
  };
};

function ReservasContent() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [closures, setClosures] = useState<any[]>([]);
  const [closureConflicts, setClosureConflicts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [plataformas, setPlataformas] = useState<any[]>([]);
  const [defaultCommission, setDefaultCommission] = useState<string>('0');
  
  // Estados para la Edición de Reserva
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [editForm, setEditForm] = useState({
    cabin_id: '',
    check_in: '',
    check_out: '',
    discount_type: 'fixed',
    discount_value: '' as string | number,
    admin_notes: '',
    plataforma_id: '',
    plataforma_comision_aplicada: '' as string | number,
    admin_comision_porcentaje: '' as string | number,
    requires_invoice: false,
    precio_base: '' as string | number,
    guest_rut: '',
    vehicle_plate: '',
    guest_nationality: '',
    guest_preferences: '',
    guest_birthdate: ''
  });
  const [availableCabins, setAvailableCabins] = useState<any[]>([]);

  // Estados para Modal de Creación Manual
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    guest_name: '',
    guest_email: '',
    guest_phone: '',
    cabin_id: '',
    check_in: '',
    check_out: '',
    adults: 1,
    children: 0,
    requires_invoice: false,
    total_price: '',
    discount_type: 'fixed',
    discount_value: '0',
    plataforma_id: '',
    plataforma_comision_aplicada: '0',
    admin_comision_porcentaje: '0',
    admin_notes: '',
    status: 'Pendiente',
    guest_rut: '',
    vehicle_plate: '',
    guest_nationality: '',
    guest_preferences: '',
    guest_birthdate: ''
  });
  const [isCreating, setIsCreating] = useState(false);
  const [allowOverCapacity, setAllowOverCapacity] = useState(false);
  const [existingBookingsForSelectedCabin, setExistingBookingsForSelectedCabin] = useState<any[]>([]);
  const [loadingCabinOcupancy, setLoadingCabinOcupancy] = useState(false);
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<Booking | null>(null);
  const [cancelForm, setCancelForm] = useState({
    sendEmail: true,
    sendWhatsapp: true,
    reasonType: 'no_payment' as 'no_payment' | 'conflict' | 'other'
  });
  const [isCanceling, setIsCanceling] = useState(false);

  // Nuevos estados para PMS Avanzado (Fase 2)
  const [paymentsModalOpen, setPaymentsModalOpen] = useState(false);
  const [selectedBookingForPayments, setSelectedBookingForPayments] = useState<Booking | null>(null);
  const [pmsPaymentForm, setPmsPaymentForm] = useState({
    amount: '',
    payment_method: 'Transferencia',
    reference: '',
    notes: '',
    receiptFile: null as File | null
  });
  const [isAddingPayment, setIsAddingPayment] = useState(false);

  const [checkInModalOpen, setCheckInModalOpen] = useState(false);
  const [selectedBookingForCheckIn, setSelectedBookingForCheckIn] = useState<Booking | null>(null);
  const [checkInForm, setCheckInForm] = useState({
    guest_rut: '',
    vehicle_plate: '',
    guest_nationality: '',
    guest_preferences: '',
    guest_birthdate: ''
  });
  const [isProcessingCheckIn, setIsProcessingCheckIn] = useState(false);

  const [checkOutModalOpen, setCheckOutModalOpen] = useState(false);
  const [selectedBookingForCheckOut, setSelectedBookingForCheckOut] = useState<Booking | null>(null);
  const [checkOutNotes, setCheckOutNotes] = useState('');
  const [isProcessingCheckOut, setIsProcessingCheckOut] = useState(false);

  // Estado para filtros de reportabilidad contable
  const [reportYear, setReportYear] = useState<string>(new Date().getFullYear().toString());
  const [reportMonth, setReportMonth] = useState<string>((new Date().getMonth() + 1).toString());


  useEffect(() => {
    if (createModalOpen && createForm.cabin_id) {
      fetchCabinOcupancy(createForm.cabin_id);
    }
  }, [createModalOpen, createForm.cabin_id]);

  useEffect(() => {
    if (editingBooking && editForm.cabin_id) {
      fetchCabinOcupancy(editForm.cabin_id, editingBooking.id);
    }
  }, [editingBooking, editForm.cabin_id]);

  const [existingClosuresForSelectedCabin, setExistingClosuresForSelectedCabin] = useState<any[]>([]);

  async function fetchCabinOcupancy(cabinId: string, excludeBookingId?: string) {
    setLoadingCabinOcupancy(true);
    
    // Cargar reservas activas
    let query = supabase
      .from('bookings')
      .select('check_in, check_out')
      .eq('cabin_id', cabinId)
      .neq('status', 'Cancelada');

    if (excludeBookingId) {
      query = query.neq('id', excludeBookingId);
    }

    const { data: bookingsData } = await query;
    
    // Cargar cierres temporales
    const { data: closuresData } = await supabase
      .from('cabin_closures')
      .select('cabin_id, start_date, end_date, reason')
      .or(`cabin_id.eq.${cabinId},cabin_id.is.null`);

    setExistingBookingsForSelectedCabin(bookingsData || []);
    setExistingClosuresForSelectedCabin(closuresData || []);
    setLoadingCabinOcupancy(false);
  }

  // Asegurar que siempre haya una cabaña seleccionada por defecto al abrir el modal
  useEffect(() => {
    if (createModalOpen && availableCabins.length > 0) {
      const cabinId = createForm.cabin_id || availableCabins[0].id;
      const cabin = availableCabins.find(c => c.id === cabinId);
      if (cabin && (!createForm.cabin_id || !createForm.total_price)) {
        setCreateForm(prev => ({
          ...prev,
          cabin_id: cabinId,
          total_price: prev.total_price || cabin.price_per_night.toString()
        }));
      }
    }
  }, [createModalOpen, availableCabins, createForm.cabin_id, createForm.total_price]);

  const isDateBookedAdmin = (dateStr: string) => {
    return existingBookingsForSelectedCabin.some(b => {
      return dateStr >= b.check_in && dateStr < b.check_out;
    });
  };

  const isDateClosedAdmin = (dateStr: string) => {
    return existingClosuresForSelectedCabin.some(c => {
      return dateStr >= c.start_date && dateStr <= c.end_date;
    });
  };

  const getClosureReasonAdmin = (dateStr: string) => {
    const closure = existingClosuresForSelectedCabin.find(c => dateStr >= c.start_date && dateStr <= c.end_date);
    return closure ? closure.reason : '';
  };

  const isDateInSelectedRangeAdmin = (dateStr: string) => {
    const checkIn = createForm.check_in;
    const checkOut = createForm.check_out;
    if (checkIn && checkOut) {
      return dateStr > checkIn && dateStr < checkOut;
    }
    return false;
  };

  const handleDateClickAdmin = (dateStr: string) => {
    if (isDateBookedAdmin(dateStr) || isDateClosedAdmin(dateStr)) return; // Ignorar ocupados y cerrados

    const checkIn = createForm.check_in;
    const checkOut = createForm.check_out;

    if (!checkIn || (checkIn && checkOut)) {
      // Seleccionó inicio
      handleCreateFormChange({ check_in: dateStr, check_out: '' });
    } else if (checkIn && !checkOut) {
      if (dateStr < checkIn) {
        // Seleccionó fecha anterior, reiniciar checkIn
        handleCreateFormChange({ check_in: dateStr, check_out: '' });
      } else if (dateStr === checkIn) {
        // Clic en el mismo día
        handleCreateFormChange({ check_in: '', check_out: '' });
      } else {
        // Verificar solapamiento en el medio (reservas o cierres)
        const inDate = new Date(checkIn);
        const outDate = new Date(dateStr);
        let hasOverlap = false;
        
        for (const b of existingBookingsForSelectedCabin) {
            const bIn = new Date(b.check_in);
            const bOut = new Date(b.check_out);
            if (inDate < bOut && outDate > bIn) {
                hasOverlap = true;
                break;
            }
        }

        if (!hasOverlap) {
            for (const c of existingClosuresForSelectedCabin) {
                const cIn = new Date(c.start_date);
                const cOut = new Date(c.end_date);
                if (inDate <= cOut && outDate >= cIn) {
                    hasOverlap = true;
                    break;
                }
            }
        }

        if (hasOverlap) {
            // Solapamiento detectado, reiniciar checkIn a esta fecha
            handleCreateFormChange({ check_in: dateStr, check_out: '' });
        } else {
            handleCreateFormChange({ check_out: dateStr });
        }
      }
    }
  };

  const renderCalendarAdmin = () => {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay(); // 0 is Sunday
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const todayStr = new Date().toISOString().split('T')[0];
    
    const days = [];
    
    for (let i = 0; i < firstDay; i++) {
        days.push(<div key={`empty-admin-${i}`} className="p-2"></div>);
    }
    
    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month+1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        
        const isPast = dateStr < todayStr;
        const booked = isDateBookedAdmin(dateStr);
        const closed = isDateClosedAdmin(dateStr);
        const closureReason = closed ? getClosureReasonAdmin(dateStr) : '';
        const isCheckIn = createForm.check_in === dateStr;
        const isCheckOut = createForm.check_out === dateStr;
        const inRange = isDateInSelectedRangeAdmin(dateStr);

        let cellClasses = "h-10 w-full flex items-center justify-center text-sm font-medium rounded-full transition-all cursor-pointer relative ";
        
        if (isPast) {
            cellClasses += "text-gray-300 hover:bg-gray-50"; // Permitir pasado por ser reserva manual de administrador
        } else if (booked) {
            cellClasses += "bg-red-50 text-red-400 line-through cursor-not-allowed";
        } else if (closed) {
            cellClasses += "bg-gray-105 text-gray-400 line-through cursor-not-allowed border border-dashed border-gray-300";
        } else if (isCheckIn || isCheckOut) {
            cellClasses += "bg-[#11d442] text-white shadow-md z-10 font-bold";
        } else if (inRange) {
            cellClasses += "bg-[#11d442]/10 text-[#11d442]";
        } else {
            cellClasses += "text-gray-700 hover:bg-gray-100";
        }

        // Estilos para el background del rango visual conectivo
        let rangeBgClasses = "";
        if (isCheckIn && createForm.check_out) {
            rangeBgClasses = "absolute top-0 bottom-0 right-0 left-1/2 bg-[#11d442]/10 -z-10";
        } else if (isCheckOut && createForm.check_in) {
            rangeBgClasses = "absolute top-0 bottom-0 left-0 right-1/2 bg-[#11d442]/10 -z-10";
        } else if (inRange) {
            rangeBgClasses = "absolute top-0 bottom-0 left-0 right-0 bg-[#11d442]/10 -z-10";
        }

        const isSelectable = !booked && !closed;

        days.push(
            <div key={`day-admin-${d}`} className="relative py-1 px-0.5">
                {rangeBgClasses && <div className={rangeBgClasses}></div>}
                <button 
                  type="button"
                  onClick={() => isSelectable && handleDateClickAdmin(dateStr)}
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
        <div className="bg-white rounded-2xl border border-gray-250 shadow-sm p-4 w-full">
            <div className="flex items-center justify-between mb-4">
                <button 
                  type="button"
                  onClick={() => setCurrentCalendarDate(new Date(year, month - 1, 1))}
                  className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <div className="font-bold text-gray-900 capitalize text-sm">
                  {currentCalendarDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}
                </div>
                <button 
                  type="button"
                  onClick={() => setCurrentCalendarDate(new Date(year, month + 1, 1))}
                  className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
            </div>
            <div className="grid grid-cols-7 mb-2 text-center">
                {['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'].map(d => (
                    <div key={`header-admin-${d}`} className="text-xs font-bold text-gray-400">{d}</div>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-y-1">
                {days}
            </div>
            <div className="flex gap-4 mt-4 text-[9px] font-bold uppercase text-gray-500 justify-center border-t pt-3 border-gray-100 animate-in fade-in">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#11d442]"></span> Seleccionado</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-100 border border-red-200"></span> Reservado</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-gray-100 border border-dashed border-gray-300"></span> Cerrado</span>
            </div>
        </div>
    );
  };


  const isDateInSelectedRangeEditAdmin = (dateStr: string) => {
    const checkIn = editForm.check_in;
    const checkOut = editForm.check_out;
    if (checkIn && checkOut) {
      return dateStr > checkIn && dateStr < checkOut;
    }
    return false;
  };

  const handleDateClickEditAdmin = (dateStr: string) => {
    if (isDateBookedAdmin(dateStr) || isDateClosedAdmin(dateStr)) return; // Ignorar ocupados y cerrados

    const checkIn = editForm.check_in;
    const checkOut = editForm.check_out;

    if (!checkIn || (checkIn && checkOut)) {
      // Seleccionó inicio
      handleEditFormChange({ check_in: dateStr, check_out: '' });
    } else if (checkIn && !checkOut) {
      if (dateStr < checkIn) {
        // Seleccionó fecha anterior, reiniciar checkIn
        handleEditFormChange({ check_in: dateStr, check_out: '' });
      } else if (dateStr === checkIn) {
        // Clic en el mismo día
        handleEditFormChange({ check_in: '', check_out: '' });
      } else {
        // Verificar solapamiento en el medio (reservas o cierres)
        const inDate = new Date(checkIn);
        const outDate = new Date(dateStr);
        let hasOverlap = false;
        
        for (const b of existingBookingsForSelectedCabin) {
            const bIn = new Date(b.check_in);
            const bOut = new Date(b.check_out);
            if (inDate < bOut && outDate > bIn) {
                hasOverlap = true;
                break;
            }
        }

        if (!hasOverlap) {
            for (const c of existingClosuresForSelectedCabin) {
                const cIn = new Date(c.start_date);
                const cOut = new Date(c.end_date);
                if (inDate <= cOut && outDate >= cIn) {
                    hasOverlap = true;
                    break;
                }
            }
        }

        if (hasOverlap) {
            // Solapamiento detectado, reiniciar checkIn a esta fecha
            handleEditFormChange({ check_in: dateStr, check_out: '' });
        } else {
            handleEditFormChange({ check_out: dateStr });
        }
      }
    }
  };

  const renderCalendarEditAdmin = () => {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay(); // 0 is Sunday
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const todayStr = new Date().toISOString().split('T')[0];
    
    const days = [];
    
    for (let i = 0; i < firstDay; i++) {
        days.push(<div key={`empty-edit-admin-${i}`} className="p-2"></div>);
    }
    
    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month+1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        
        const isPast = dateStr < todayStr;
        const booked = isDateBookedAdmin(dateStr);
        const closed = isDateClosedAdmin(dateStr);
        const closureReason = closed ? getClosureReasonAdmin(dateStr) : '';
        const isCheckIn = editForm.check_in === dateStr;
        const isCheckOut = editForm.check_out === dateStr;
        const inRange = isDateInSelectedRangeEditAdmin(dateStr);

        let cellClasses = "h-10 w-full flex items-center justify-center text-sm font-medium rounded-full transition-all cursor-pointer relative ";
        
        if (isPast) {
            cellClasses += "text-gray-300 hover:bg-gray-50"; // Permitir pasado por ser reserva manual de administrador
        } else if (booked) {
            cellClasses += "bg-red-50 text-red-400 line-through cursor-not-allowed";
        } else if (closed) {
            cellClasses += "bg-gray-105 text-gray-400 line-through cursor-not-allowed border border-dashed border-gray-300";
        } else if (isCheckIn || isCheckOut) {
            cellClasses += "bg-[#11d442] text-white shadow-md z-10 font-bold";
        } else if (inRange) {
            cellClasses += "bg-[#11d442]/10 text-[#11d442]";
        } else {
            cellClasses += "text-gray-700 hover:bg-gray-100";
        }

        // Estilos para el background del rango visual conectivo
        let rangeBgClasses = "";
        if (isCheckIn && editForm.check_out) {
            rangeBgClasses = "absolute top-0 bottom-0 right-0 left-1/2 bg-[#11d442]/10 -z-10";
        } else if (isCheckOut && editForm.check_in) {
            rangeBgClasses = "absolute top-0 bottom-0 left-0 right-1/2 bg-[#11d442]/10 -z-10";
        } else if (inRange) {
            rangeBgClasses = "absolute top-0 bottom-0 left-0 right-0 bg-[#11d442]/10 -z-10";
        }

        const isSelectable = !booked && !closed;

        days.push(
            <div key={`day-edit-admin-${d}`} className="relative py-1 px-0.5">
                {rangeBgClasses && <div className={rangeBgClasses}></div>}
                <button 
                  type="button"
                  onClick={() => isSelectable && handleDateClickEditAdmin(dateStr)}
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
        <div className="bg-white rounded-2xl border border-gray-250 shadow-sm p-4 w-full">
            <div className="flex items-center justify-between mb-4">
                <button 
                  type="button"
                  onClick={() => setCurrentCalendarDate(new Date(year, month - 1, 1))}
                  className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <div className="font-bold text-gray-900 capitalize text-sm">
                  {currentCalendarDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}
                </div>
                <button 
                  type="button"
                  onClick={() => setCurrentCalendarDate(new Date(year, month + 1, 1))}
                  className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
            </div>
            <div className="grid grid-cols-7 mb-2 text-center">
                {['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'].map(d => (
                    <div key={`header-edit-admin-${d}`} className="text-xs font-bold text-gray-400">{d}</div>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-y-1">
                {days}
            </div>
            <div className="flex gap-4 mt-4 text-[9px] font-bold uppercase text-gray-500 justify-center border-t pt-3 border-gray-100 animate-in fade-in">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#11d442]"></span> Seleccionado</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-100 border border-red-200"></span> Reservado</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-gray-100 border border-dashed border-gray-300"></span> Cerrado</span>
            </div>
        </div>
    );
  };

  const handleCreateFormChange = (updatedFields: Partial<typeof createForm>) => {
    if ('cabin_id' in updatedFields) {
      setAllowOverCapacity(false);
    }
    setCreateForm(prev => {
      const nextForm = { ...prev, ...updatedFields };
      const cabin = availableCabins.find(c => c.id === nextForm.cabin_id);
      
      const shouldRecalculate = 'cabin_id' in updatedFields || 
                                'check_in' in updatedFields || 
                                'check_out' in updatedFields || 
                                'adults' in updatedFields || 
                                'children' in updatedFields;
      
      if (shouldRecalculate && cabin) {
        const suggested = (nextForm.check_in && nextForm.check_out)
          ? calcularTarifaOficial(
              cabin,
              nextForm.check_in,
              nextForm.check_out,
              nextForm.adults,
              nextForm.children
            )
          : (cabin.price_per_night || 0);
        
        nextForm.total_price = suggested.toString();
      }
      return nextForm;
    });
  };

  const handleEditFormChange = (updatedFields: Partial<typeof editForm>) => {
    setEditForm(prev => {
      const nextForm = { ...prev, ...updatedFields };
      const cabin = availableCabins.find(c => c.id === nextForm.cabin_id);
      
      const shouldRecalculate = 'cabin_id' in updatedFields || 
                                'check_in' in updatedFields || 
                                'check_out' in updatedFields;
      
      if (shouldRecalculate && cabin) {
        const suggested = (nextForm.check_in && nextForm.check_out)
          ? calcularTarifaOficial(
              cabin,
              nextForm.check_in,
              nextForm.check_out,
              editingBooking?.adults || 1,
              editingBooking?.children || 0
            )
          : (cabin.price_per_night || 0);
        
        nextForm.precio_base = suggested.toString();
      }
      return nextForm;
    });
  };


  // Estados para Modal de Confirmación de Pago
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [bookingToConfirm, setBookingToConfirm] = useState<Booking | null>(null);
  const [paymentForm, setPaymentForm] = useState({ amount: '', reference: '', receiptFile: null as File | null });
  const [isConfirming, setIsConfirming] = useState(false);

  const searchParams = useSearchParams();
  const bookingIdFilter = searchParams.get('id');
  const router = useRouter();

  const clearFilter = () => {
    router.push('/admin/reservas');
  };

  const filteredBookings = bookings.filter(b => !bookingIdFilter || b.id === bookingIdFilter);

  useEffect(() => {
    fetchBookings();
    fetchCabins();
    fetchPlataformas();
    fetchDefaultCommission();
  }, []);

  async function fetchDefaultCommission() {
    const { data } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'default_admin_commission')
      .maybeSingle();
    
    if (data?.value) {
      setDefaultCommission(data.value);
    }
  }

  async function fetchCabins() {
    const { data } = await supabase.from('cabins').select('id, name, price_per_night, capacity, max_extra_guests, extra_guest_surcharge_percentage').order('name');
    setAvailableCabins(data || []);
  }

  async function fetchPlataformas() {
    const { data } = await supabase.from('plataformas').select('id, nombre, comision_porcentaje').order('nombre');
    setPlataformas(data || []);
  }

  async function fetchBookings() {
    const { data: bookingsData, error } = await supabase
      .from('bookings')
      .select(`
        *,
        cabin:cabins (name),
        plataforma:plataformas (nombre),
        booking_payments (*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching bookings:', error);
      setLoading(false);
      return;
    }

    // Cargar cierres temporales
    const { data: closuresData } = await supabase
      .from('cabin_closures')
      .select(`
        *,
        cabin:cabins (name)
      `);

    const activeBookings = bookingsData || [];
    const activeClosures = closuresData || [];

    // Calcular colisiones
    const closureConflictsList: any[] = [];
    activeBookings.forEach((b: Booking) => {
      if (b.status === 'Cancelada') return;

      const matchingClosure = activeClosures.find((c: any) => {
        const bIn = new Date(b.check_in);
        const bOut = new Date(b.check_out);
        const cIn = new Date(c.start_date);
        const cOut = new Date(c.end_date);

        // Cruce de fecha inclusivo para cierres
        const dateOverlap = bIn <= cOut && bOut >= cIn;
        const cabinMatches = !c.cabin_id || c.cabin_id === b.cabin_id;

        return dateOverlap && cabinMatches;
      });

      if (matchingClosure) {
        closureConflictsList.push({
          booking: b,
          closure: matchingClosure
        });
      }
    });

    setBookings(activeBookings);
    setClosures(activeClosures);
    setClosureConflicts(closureConflictsList);
    setLoading(false);
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pendiente': return 'bg-yellow-100 text-yellow-700';
      case 'confirmada': return 'bg-orange-105 text-orange-700';
      case 'checkin': return 'bg-green-100 text-green-700';
      case 'checkout': return 'bg-blue-100 text-blue-700';
      case 'cancelada': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    const updatePayload: any = { status: newStatus };
    
    // Si pasa a Confirmada, registrar la fecha, hora y usuario.
    if (newStatus === 'Confirmada') {
      const { data: { user } } = await supabase.auth.getUser();
      updatePayload.confirmed_at = new Date().toISOString();
      updatePayload.confirmed_by = user?.email || 'Admin';
    } else {
      updatePayload.confirmed_at = null;
      updatePayload.confirmed_by = null;
    }

    const { error } = await supabase
      .from('bookings')
      .update(updatePayload)
      .eq('id', id);

    if (error) {
      alert('Error: ' + error.message);
    } else {
      setBookings(bookings.map(b => b.id === id ? { ...b, ...updatePayload } : b));
      fetchBookings();
    }
  };

  const handleStatusChange = (booking: Booking, newStatus: string) => {
    if (newStatus === 'Confirmada') {
      setBookingToConfirm(booking);
      
      const prevPayments = booking.booking_payments?.reduce((sum: number, p: any) => sum + p.amount, 0) || 0;
      const totalAbonadoPrevio = prevPayments === 0 && booking.payment_amount 
        ? booking.payment_amount 
        : prevPayments;
      
      const totalNeto = booking.total_price || 0;
      const sugerido50 = Math.round(totalNeto * 0.5);
      const faltaPara50 = Math.max(0, sugerido50 - totalAbonadoPrevio);
      const sugeridoFinal = faltaPara50 > 0 ? faltaPara50 : Math.max(0, totalNeto - totalAbonadoPrevio);

      setPaymentForm({ 
        amount: sugeridoFinal.toString(), 
        reference: '', 
        receiptFile: null 
      });
      setConfirmModalOpen(true);
    } else if (newStatus === 'Cancelada') {
      setBookingToCancel(booking);
      // Calcular si está expirada o en conflicto para preseleccionar la razón
      const hoursElapsed = Math.floor((new Date().getTime() - new Date(booking.created_at).getTime()) / (1000 * 60 * 60));
      const isExpired = booking.status === 'Pendiente' && hoursElapsed >= 24;
      const conflict = getOverbookingConflict(booking);

      let initialReason: 'no_payment' | 'conflict' | 'other' = 'other';
      if (isExpired) {
        initialReason = 'no_payment';
      } else if (conflict && !conflict.isPriority) {
        initialReason = 'conflict';
      }

      setCancelForm({
        sendEmail: true,
        sendWhatsapp: true,
        reasonType: initialReason
      });
      setCancelModalOpen(true);
    } else {
      updateStatus(booking.id, newStatus);
    }
  };

  const confirmCancelation = async () => {
    if (!bookingToCancel) return;
    setIsCanceling(true);
    try {
      // 1. Actualizar estado a Cancelada en Supabase
      const { error } = await supabase
        .from('bookings')
        .update({ 
          status: 'Cancelada',
          confirmed_at: null,
          confirmed_by: null
        })
        .eq('id', bookingToCancel.id);

      if (error) throw error;

      // 2. Enviar correo de cancelación si está seleccionado
      if (cancelForm.sendEmail && bookingToCancel.guest_email) {
        fetch('/api/send-cancelation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            guestName: bookingToCancel.guest_name,
            guestEmail: bookingToCancel.guest_email,
            cabinName: bookingToCancel.cabin?.name || 'Cabaña',
            checkIn: new Date(bookingToCancel.check_in).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }),
            checkOut: new Date(bookingToCancel.check_out).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }),
            reasonType: cancelForm.reasonType,
            bookingId: bookingToCancel.id
          })
        }).catch(err => console.error('Error al enviar correo de cancelación:', err));
      }

      // 3. Abrir WhatsApp Web si está seleccionado y hay teléfono
      if (cancelForm.sendWhatsapp && bookingToCancel.guest_phone) {
        let rawPhone = bookingToCancel.guest_phone.replace(/\s+/g, '').replace('+', '');
        if (!rawPhone.startsWith('56') && rawPhone.length === 9) {
          rawPhone = '56' + rawPhone;
        }

        let mensajeText = '';
        if (cancelForm.reasonType === 'no_payment') {
          mensajeText = `Hola *${bookingToCancel.guest_name}*, te saludamos de *Rancho Carmelitas*. Te escribimos en relación a tu solicitud de reserva en la cabaña *${bookingToCancel.cabin?.name || 'Cabaña'}* para las fechas del ${new Date(bookingToCancel.check_in).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })} al ${new Date(bookingToCancel.check_out).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}. Lamentablemente, debido a que expiró el plazo de 24 horas para registrar el abono del 50%, hemos liberado las fechas en el sistema. Si aún deseas alojarte con nosotros, por favor contáctanos de inmediato para verificar disponibilidad. ¡Muchas gracias!`;
        } else if (cancelForm.reasonType === 'conflict') {
          mensajeText = `Hola *${bookingToCancel.guest_name}*, te saludamos de *Rancho Carmelitas*. Nos contactamos sobre tu solicitud de reserva en la cabaña *${bookingToCancel.cabin?.name || 'Cabaña'}* (${new Date(bookingToCancel.check_in).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })} al ${new Date(bookingToCancel.check_out).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}). Lamentablemente, se ha generado una colisión de fechas en nuestro sistema con una reserva confirmada anteriormente. Nos encantaría ofrecerte una reubicación en otra de nuestras hermosas cabañas disponibles o ajustar las fechas de tu estadía con un descuento especial. Quedamos a la espera de tu respuesta por esta vía para coordinar la mejor solución. ¡Disculpa las molestias!`;
        } else {
          mensajeText = `Hola *${bookingToCancel.guest_name}*, te escribimos de *Rancho Carmelitas* para informarte que lamentablemente hemos cancelado tu reserva para la cabaña *${bookingToCancel.cabin?.name || 'Cabaña'}* del ${new Date(bookingToCancel.check_in).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })} al ${new Date(bookingToCancel.check_out).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}. Si tienes dudas o deseas reubicarte, por favor respóndenos por esta vía o llámanos directamente. ¡Muchas gracias!`;
        }

        const whatsappUrl = `https://web.whatsapp.com/send?phone=${rawPhone}&text=${encodeURIComponent(mensajeText)}`;
        window.open(whatsappUrl, '_blank');
      }

      // 4. Actualizar estado local
      setBookings(bookings.map(b => b.id === bookingToCancel.id ? { ...b, status: 'Cancelada', confirmed_at: undefined, confirmed_by: undefined } : b));
      setCancelModalOpen(false);
      setBookingToCancel(null);
      fetchBookings();
    } catch (err: any) {
      alert('Error al cancelar la reserva: ' + err.message);
    } finally {
      setIsCanceling(false);
    }
  };

  const confirmPaymentAndBooking = async () => {
    if (!bookingToConfirm) return;
    setIsConfirming(true);
    try {
      let receiptUrl = null;
      // 1. Upload receipt if exists
      if (paymentForm.receiptFile) {
        const fileExt = paymentForm.receiptFile.name.split('.').pop();
        const fileName = `${bookingToConfirm.id}-${Date.now()}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('payment-receipts')
          .upload(fileName, paymentForm.receiptFile);
          
        if (uploadError) {
          console.error('Error al subir el comprobante:', uploadError);
          // throw uploadError; // Podríamos lanzar el error, o continuar sin imagen si falla.
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('payment-receipts')
            .getPublicUrl(fileName);
          receiptUrl = publicUrl;
        }
      }

      const { data: { user } } = await supabase.auth.getUser();

      // 2. Registrar el abono en la tabla relacional de auditoría de pagos (booking_payments)
      if (Number(paymentForm.amount) > 0) {
        const { error: paymentInsertError } = await supabase
          .from('booking_payments')
          .insert([{
            booking_id: bookingToConfirm.id,
            amount: Number(paymentForm.amount),
            payment_method: 'Transferencia',
            reference: paymentForm.reference || null,
            notes: '[Abono Inicial de Confirmación Rápida]',
            receipt_url: receiptUrl
          }]);
        
        if (paymentInsertError) {
          console.error('Error insertando en booking_payments:', paymentInsertError);
        }
      }
      
      const updatePayload: any = { 
        status: 'Confirmada',
        confirmed_at: new Date().toISOString(),
        confirmed_by: user?.email || 'Admin',
        payment_amount: Number(paymentForm.amount) || null,
        payment_reference: paymentForm.reference || null,
        payment_receipt_url: receiptUrl
      };

      const { error } = await supabase
        .from('bookings')
        .update(updatePayload)
        .eq('id', bookingToConfirm.id);

      if (error) throw error;

      // Actualizar UI
      setBookings(bookings.map(b => b.id === bookingToConfirm.id ? { ...b, ...updatePayload } : b));
      
      // Enviar correo via API
      fetch('/api/send-payment-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestName: bookingToConfirm.guest_name,
          guestEmail: bookingToConfirm.guest_email,
          cabinName: bookingToConfirm.cabin?.name || 'Cabaña',
          checkIn: new Date(bookingToConfirm.check_in).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }),
          checkOut: new Date(bookingToConfirm.check_out).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }),
          totalPrice: bookingToConfirm.total_price || 0,
          discountApplied: bookingToConfirm.discount_applied || 0,
          extraGuestsCost: bookingToConfirm.extra_guests_cost || 0,
          paymentAmount: Number(paymentForm.amount) || 0,
          paymentReference: paymentForm.reference || 'N/A',
          paymentReceiptUrl: receiptUrl || null,
          adults: bookingToConfirm.adults || 1,
          children: bookingToConfirm.children || 0,
          bookingId: bookingToConfirm.id,
          plataformaNombre: bookingToConfirm.plataforma?.nombre || null,
          plataformaComisionAplicada: bookingToConfirm.plataforma_comision_aplicada || 0,
          requiresInvoice: bookingToConfirm.requires_invoice || false
        })
      });

      setConfirmModalOpen(false);
      setBookingToConfirm(null);
      fetchBookings();
    } catch (err: any) {
      alert('Error confirmando pago: ' + err.message);
    } finally {
      setIsConfirming(false);
    }
  };

  // Función para agregar un pago al PMS en la tabla booking_payments
  const handleAddPmsPayment = async (bookingId: string, customAmount?: number, customMethod?: string, customReference?: string) => {
    setIsAddingPayment(true);
    try {
      let receiptUrl = null;
      const fileToUpload = pmsPaymentForm.receiptFile;
      const amountToRegister = customAmount ?? Number(pmsPaymentForm.amount);
      const methodToRegister = customMethod ?? pmsPaymentForm.payment_method;
      const referenceToRegister = customReference ?? pmsPaymentForm.reference;

      if (!amountToRegister || amountToRegister <= 0) {
        alert('Por favor introduce un monto válido mayor a 0.');
        setIsAddingPayment(false);
        return;
      }

      if (fileToUpload) {
        const fileExt = fileToUpload.name.split('.').pop();
        const fileName = `payment_${bookingId}_${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('payment-receipts')
          .upload(fileName, fileToUpload);

        if (uploadError) {
          console.error('Error al subir comprobante:', uploadError);
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('payment-receipts')
            .getPublicUrl(fileName);
          receiptUrl = publicUrl;
        }
      }

      const { data, error } = await supabase
        .from('booking_payments')
        .insert([{
          booking_id: bookingId,
          amount: amountToRegister,
          payment_method: methodToRegister,
          reference: referenceToRegister || null,
          notes: pmsPaymentForm.notes || null,
          receipt_url: receiptUrl
        }])
        .select()
        .single();

      if (error) throw error;

      // Recargar reservas para ver reflejado
      await fetchBookings();
      
      // Auto-confirmación inteligente al alcanzar o superar el 50% de abono
      const originalBooking = bookings.find(b => b.id === bookingId);
      let fueAutoConfirmada = false;
      
      if (originalBooking && originalBooking.status === 'Pendiente') {
        const prevPayments = originalBooking.booking_payments?.reduce((sum: number, p: any) => sum + p.amount, 0) || 0;
        const totalAbonadoPrevio = prevPayments === 0 && originalBooking.payment_amount 
          ? originalBooking.payment_amount 
          : prevPayments;
        const nuevoAbonadoTotal = totalAbonadoPrevio + amountToRegister;
        const abonoRequerido50 = Math.round(originalBooking.total_price * 0.5);

        if (nuevoAbonadoTotal >= abonoRequerido50) {
          const { data: { user } } = await supabase.auth.getUser();
          const updatePayload = {
            status: 'Confirmada',
            confirmed_at: new Date().toISOString(),
            confirmed_by: user?.email || 'Admin Auto-Abono'
          };

          const { error: updateError } = await supabase
            .from('bookings')
            .update(updatePayload)
            .eq('id', bookingId);

          if (!updateError) {
            fueAutoConfirmada = true;
            
            // Actualizar localmente la referencia del modal si estuviera abierta
            if (selectedBookingForPayments && selectedBookingForPayments.id === bookingId) {
              setSelectedBookingForPayments(prev => prev ? {
                ...prev,
                status: 'Confirmada',
                confirmed_at: updatePayload.confirmed_at,
                confirmed_by: updatePayload.confirmed_by
              } : null);
            }

            // Disparar correo de confirmación de forma desatendida y asíncrona
            fetch('/api/send-payment-confirmation', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                guestName: originalBooking.guest_name,
                guestEmail: originalBooking.guest_email,
                cabinName: originalBooking.cabin?.name || 'Cabaña',
                checkIn: new Date(originalBooking.check_in).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }),
                checkOut: new Date(originalBooking.check_out).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }),
                totalPrice: originalBooking.total_price || 0,
                discountApplied: originalBooking.discount_applied || 0,
                extraGuestsCost: originalBooking.extra_guests_cost || 0,
                paymentAmount: nuevoAbonadoTotal,
                paymentReference: referenceToRegister || 'Auto-Abono',
                paymentReceiptUrl: receiptUrl || null,
                adults: originalBooking.adults || 1,
                children: originalBooking.children || 0,
                bookingId: originalBooking.id,
                plataformaNombre: originalBooking.plataforma?.nombre || null,
                plataformaComisionAplicada: originalBooking.plataforma_comision_aplicada || 0,
                requiresInvoice: originalBooking.requires_invoice || false
              })
            }).catch(e => console.error('Error al enviar correo automático de abono:', e));

            // Refrescar reservas en UI para reflejar el estado Confirmada
            await fetchBookings();
            
            alert(`💡 ¡Excelente! El abono acumulado (${formatMoney(nuevoAbonadoTotal)}) alcanza o supera el 50% de la tarifa total de la reserva (${formatMoney(abonoRequerido50)}).\n\nLa reserva ha sido PROMOVIDA AUTOMÁTICAMENTE al estado "Confirmada" y se ha disparado la notificación por correo al huésped.`);
          } else {
            console.error('Error al promover estado automáticamente:', updateError);
          }
        }
      }
      
      // Limpiar formulario de pago
      setPmsPaymentForm({
        amount: '',
        payment_method: 'Transferencia',
        reference: '',
        notes: '',
        receiptFile: null
      });

      // Si estábamos en el modal de pagos, actualizar la referencia seleccionada
      if (selectedBookingForPayments && selectedBookingForPayments.id === bookingId) {
        const payments = [...(selectedBookingForPayments.booking_payments || []), data];
        setSelectedBookingForPayments({
          ...selectedBookingForPayments,
          booking_payments: payments
        });
      }

      // Si estábamos en el modal de check-in, actualizar la referencia seleccionada
      if (selectedBookingForCheckIn && selectedBookingForCheckIn.id === bookingId) {
        const payments = [...(selectedBookingForCheckIn.booking_payments || []), data];
        setSelectedBookingForCheckIn({
          ...selectedBookingForCheckIn,
          booking_payments: payments
        });
      }

      alert('Pago registrado correctamente en la auditoría del sistema.');
    } catch (err: any) {
      alert('Error al registrar pago: ' + err.message);
    } finally {
      setIsAddingPayment(false);
    }
  };

  // Función para procesar el Check-In
  const handlePmsCheckIn = async () => {
    if (!selectedBookingForCheckIn) return;
    setIsProcessingCheckIn(true);
    try {
      // 1. Guardar ficha del huésped y cambiar estado a 'checkin'
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({
          status: 'checkin',
          guest_rut: checkInForm.guest_rut || null,
          vehicle_plate: checkInForm.vehicle_plate || null,
          guest_nationality: checkInForm.guest_nationality || null,
          guest_preferences: checkInForm.guest_preferences || null,
          guest_birthdate: checkInForm.guest_birthdate || null,
          admin_notes: selectedBookingForCheckIn.admin_notes 
            ? `${selectedBookingForCheckIn.admin_notes} [Check-In realizado el ${new Date().toLocaleDateString('es-ES')}]`
            : `[Check-In realizado el ${new Date().toLocaleDateString('es-ES')}]`
        })
        .eq('id', selectedBookingForCheckIn.id);

      if (bookingError) throw bookingError;

      // 2. Cambiar cabaña a 'Ocupada'
      const { error: cabinError } = await supabase
        .from('cabins')
        .update({ housekeeping_status: 'Ocupada' })
        .eq('id', selectedBookingForCheckIn.cabin_id);

      if (cabinError) throw cabinError;

      setCheckInModalOpen(false);
      setSelectedBookingForCheckIn(null);
      await fetchBookings();
      alert('Check-In procesado con éxito. Huésped ingresado a cabaña y estado actualizado a Ocupada.');
    } catch (err: any) {
      alert('Error en Check-In: ' + err.message);
    } finally {
      setIsProcessingCheckIn(false);
    }
  };

  // Función para procesar el Check-Out
  const handlePmsCheckOut = async () => {
    if (!selectedBookingForCheckOut) return;
    setIsProcessingCheckOut(true);
    try {
      // 1. Cambiar estado de reserva a 'checkout'
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({
          status: 'checkout',
          admin_notes: selectedBookingForCheckOut.admin_notes
            ? `${selectedBookingForCheckOut.admin_notes} [Check-Out: Llaves recibidas. Inspección realizada. Notas: ${checkOutNotes || 'Ninguna'}]`
            : `[Check-Out: Llaves recibidas. Inspección realizada. Notas: ${checkOutNotes || 'Ninguna'}]`
        })
        .eq('id', selectedBookingForCheckOut.id);

      if (bookingError) throw bookingError;

      // 2. Cambiar cabaña a 'Necesita Aseo'
      const { error: cabinError } = await supabase
        .from('cabins')
        .update({ housekeeping_status: 'Necesita Aseo' })
        .eq('id', selectedBookingForCheckOut.cabin_id);

      if (cabinError) throw cabinError;

      setCheckOutModalOpen(false);
      setSelectedBookingForCheckOut(null);
      setCheckOutNotes('');
      await fetchBookings();
      alert('Check-Out procesado con éxito. Llaves devueltas y cabaña enviada a Housekeeping (Necesita Aseo).');
    } catch (err: any) {
      alert('Error en Check-Out: ' + err.message);
    } finally {
      setIsProcessingCheckOut(false);
    }
  };

  const startEditing = (booking: Booking) => {
    setEditingBooking(booking);
    
    // Calcular el precio base original usando la lógica inversa
    const aplicaIVA = !!booking.requires_invoice;
    const C = (booking.plataforma_comision_aplicada || 0) / 100;
    const totalConDescuento = booking.total_price || 0;
    
    let baseNeto = aplicaIVA 
      ? totalConDescuento / (1.19 * (1 + C))
      : totalConDescuento / (1 + C);
      
    const baseOriginal = baseNeto + (booking.discount_applied || 0);

    setEditForm({
      cabin_id: booking.cabin_id,
      check_in: booking.check_in,
      check_out: booking.check_out,
      discount_type: 'fixed',
      discount_value: booking.discount_applied ?? '',
      admin_notes: booking.admin_notes ?? '',
      plataforma_id: booking.plataforma_id ?? '',
      plataforma_comision_aplicada: booking.plataforma_comision_aplicada ?? '',
      admin_comision_porcentaje: booking.admin_comision_porcentaje ?? '',
      requires_invoice: booking.requires_invoice || false,
      precio_base: Math.round(baseOriginal).toString(),
      guest_rut: booking.guest_rut ?? '',
      vehicle_plate: booking.vehicle_plate ?? '',
      guest_nationality: booking.guest_nationality ?? '',
      guest_preferences: booking.guest_preferences ?? '',
      guest_birthdate: booking.guest_birthdate ?? ''
    });
  };

  const saveEdit = async () => {
    if (!editingBooking) return;

    // 1. VALIDACIÓN ESTRICTA DE CIERRES TEMPORALES AL EDITAR
    const { data: cierresCol, error: cierresError } = await supabase
      .from('cabin_closures')
      .select('reason')
      .or(`cabin_id.eq.${editForm.cabin_id},cabin_id.is.null`)
      .lte('start_date', editForm.check_out)
      .gte('end_date', editForm.check_in);

    if (cierresError) throw cierresError;

    if (cierresCol && cierresCol.length > 0) {
      alert(`❌ Error Absoluto: No se puede guardar la modificación debido a que la cabaña se encuentra bajo un CIERRE TEMPORAL programado por: "${cierresCol[0].reason}".`);
      return;
    }

    const precioBaseOriginal = Number(editForm.precio_base) || 0;
    let calculatedDiscount = 0;
    let finalNotes = editForm.admin_notes;

    const numericValue = Number(editForm.discount_value) || 0;
    if (numericValue > 0) {
      if (editForm.discount_type === 'percentage') {
        calculatedDiscount = precioBaseOriginal * (numericValue / 100);
        const discountString = `[Descuento aplicado: ${numericValue}%]`;
        if (!finalNotes.includes(discountString)) {
          finalNotes = finalNotes ? `${finalNotes} ${discountString}` : discountString;
        }
      } else {
        calculatedDiscount = numericValue;
      }
    }

    // Calcular nuevo total a pagar por el huésped usando las fórmulas correctas
    const precioBaseNeto = Math.max(0, precioBaseOriginal - calculatedDiscount);
    const platId = editForm.plataforma_id;
    const platComPct = Number(editForm.plataforma_comision_aplicada) || 0;
    const adminComPct = Number(editForm.admin_comision_porcentaje) || 0;
    const isInvoice = !!editForm.requires_invoice;

    const comisionPlataformaMonto = precioBaseNeto * (platComPct / 100);
    const ivaMonto = isInvoice ? (precioBaseNeto + comisionPlataformaMonto) * 0.19 : 0;
    
    // Total a pagar final es la suma de Precio Base Neto + Comisión Plataforma + IVA
    const nuevoTotalAPagar = Math.round(precioBaseNeto + comisionPlataformaMonto + ivaMonto);

    // Aquí actualizamos cabaña y/o fechas en Supabase
    const { error } = await supabase
      .from('bookings')
      .update({
        cabin_id: editForm.cabin_id,
        check_in: editForm.check_in,
        check_out: editForm.check_out,
        discount_applied: Math.round(calculatedDiscount),
        admin_notes: finalNotes,
        plataforma_id: platId || null,
        plataforma_comision_aplicada: platComPct,
        admin_comision_porcentaje: adminComPct,
        requires_invoice: editForm.requires_invoice,
        total_price: nuevoTotalAPagar,
        guest_rut: editForm.guest_rut || null,
        vehicle_plate: editForm.vehicle_plate || null,
        guest_nationality: editForm.guest_nationality || null,
        guest_preferences: editForm.guest_preferences || null,
        guest_birthdate: editForm.guest_birthdate || null
      })
      .eq('id', editingBooking.id);

    if (error) {
      alert('Error al actualizar: ' + error.message);
    } else {
      // Actualizamos el estado local
      const updatedCabin = availableCabins.find(c => c.id === editForm.cabin_id);
      const updatedPlataforma = plataformas.find(p => p.id === platId);
      setBookings(bookings.map(b => b.id === editingBooking.id 
        ? { 
            ...b, 
            cabin_id: editForm.cabin_id, 
            check_in: editForm.check_in, 
            check_out: editForm.check_out,
            discount_applied: Math.round(calculatedDiscount),
            admin_notes: finalNotes,
            plataforma_id: platId || undefined,
            plataforma_comision_aplicada: platComPct,
            admin_comision_porcentaje: adminComPct,
            requires_invoice: editForm.requires_invoice,
            total_price: nuevoTotalAPagar,
            cabin: updatedCabin ? { name: updatedCabin.name } : b.cabin,
            plataforma: updatedPlataforma ? { nombre: updatedPlataforma.nombre } : undefined,
            guest_rut: editForm.guest_rut || undefined,
            vehicle_plate: editForm.vehicle_plate || undefined,
            guest_nationality: editForm.guest_nationality || undefined,
            guest_preferences: editForm.guest_preferences || undefined,
            guest_birthdate: editForm.guest_birthdate || undefined
          } 
        : b
      ));
      setEditingBooking(null);
      fetchBookings();
    }
  };

  const createBooking = async () => {
    setIsCreating(true);
    try {
      // 1. VALIDACIÓN ESTRICTA DE CIERRES TEMPORALES
      const { data: cierresCol, error: cierresError } = await supabase
        .from('cabin_closures')
        .select('reason')
        .or(`cabin_id.eq.${createForm.cabin_id},cabin_id.is.null`)
        .lte('start_date', createForm.check_out)
        .gte('end_date', createForm.check_in);

      if (cierresError) throw cierresError;

      if (cierresCol && cierresCol.length > 0) {
        alert(`❌ Error Absoluto: No se puede guardar la reserva debido a que la cabaña se encuentra bajo un CIERRE TEMPORAL programado por: "${cierresCol[0].reason}".`);
        setIsCreating(false);
        return;
      }

      // 2. VALIDACIÓN DE CAPACIDAD MÁXIMA
      const selectedCabin = availableCabins.find(c => c.id === createForm.cabin_id);
      const maxTotalGuests = selectedCabin ? (selectedCabin.capacity || 2) + (selectedCabin.max_extra_guests || 0) : 0;
      const totalGuestsRequested = Number(createForm.adults) + Number(createForm.children);
      if (selectedCabin && totalGuestsRequested > maxTotalGuests) {
        alert(`❌ Error: El total de huéspedes (${totalGuestsRequested}) excede la capacidad máxima permitida para la cabaña (${maxTotalGuests} personas). Ajusta la cantidad de huéspedes antes de guardar.`);
        setIsCreating(false);
        return;
      }

      const totalPriceNum = Number(createForm.total_price) || 0;
      let calculatedDiscount = 0;
      let finalNotes = createForm.admin_notes || '';

      const numericValue = Number(createForm.discount_value) || 0;
      if (numericValue > 0) {
        if (createForm.discount_type === 'percentage') {
          calculatedDiscount = totalPriceNum * (numericValue / 100);
          const discountString = `[Descuento aplicado: ${numericValue}%]`;
          if (!finalNotes.includes(discountString)) {
            finalNotes = finalNotes ? `${finalNotes} ${discountString}` : discountString;
          }
        } else {
          calculatedDiscount = numericValue;
        }
      }

      const plataformaComisionNum = Number(createForm.plataforma_comision_aplicada) || 0;
      const adminComisionNum = Number(createForm.admin_comision_porcentaje) || 0;

      // Calcular nuevo total a pagar por el huésped usando las fórmulas correctas
      const precioBaseNeto = Math.max(0, totalPriceNum - calculatedDiscount);
      const platId = createForm.plataforma_id;
      const isInvoice = !!createForm.requires_invoice;

      const comisionPlataformaMonto = precioBaseNeto * (plataformaComisionNum / 100);
      const ivaMonto = isInvoice ? (precioBaseNeto + comisionPlataformaMonto) * 0.19 : 0;
      
      // Total a pagar final es la suma de Precio Base Neto + Comisión Plataforma + IVA
      const nuevoTotalAPagar = Math.round(precioBaseNeto + comisionPlataformaMonto + ivaMonto);

      const { data, error } = await supabase
        .from('bookings')
        .insert([{
          guest_name: createForm.guest_name,
          guest_email: createForm.guest_email,
          guest_phone: createForm.guest_phone || null,
          cabin_id: createForm.cabin_id,
          check_in: createForm.check_in,
          check_out: createForm.check_out,
          adults: Number(createForm.adults) || 1,
          children: Number(createForm.children) || 0,
          requires_invoice: createForm.requires_invoice,
          total_price: nuevoTotalAPagar,
          discount_applied: Math.round(calculatedDiscount),
          plataforma_id: platId || null,
          plataforma_comision_aplicada: plataformaComisionNum,
          admin_comision_porcentaje: adminComisionNum,
          admin_notes: finalNotes || null,
          status: createForm.status,
          guest_rut: createForm.guest_rut || null,
          vehicle_plate: createForm.vehicle_plate || null,
          guest_nationality: createForm.guest_nationality || null,
          guest_preferences: createForm.guest_preferences || null,
          guest_birthdate: createForm.guest_birthdate || null
        }])
        .select(`
          *,
          cabin:cabins (name),
          plataforma:plataformas (nombre)
        `)
        .single();

      if (error) throw error;

      setBookings([data, ...bookings]);
      setCreateModalOpen(false);
    } catch (err: any) {
      alert('Error al crear la reserva: ' + err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const getOverbookingConflict = (booking: Booking) => {
    if (booking.status === 'Cancelada') return null;

    const startA = new Date(booking.check_in);
    const endA = new Date(booking.check_out);

    const collidingBookings = bookings.filter(other => {
      if (other.id === booking.id || other.status === 'Cancelada' || other.cabin_id !== booking.cabin_id) return false;
      const startB = new Date(other.check_in);
      const endB = new Date(other.check_out);
      return startA < endB && endA > startB;
    });

    if (collidingBookings.length === 0) return null;

    const allColliding = [booking, ...collidingBookings];

    // Ordenar: Confirmadas primero, luego por confirmed_at más antiguo. Si son pendientes, por created_at más antiguo.
    allColliding.sort((x, y) => {
      const xIsConf = x.status === 'Confirmada' ? 1 : 0;
      const yIsConf = y.status === 'Confirmada' ? 1 : 0;

      if (xIsConf !== yIsConf) {
        return yIsConf - xIsConf;
      }

      if (x.status === 'Confirmada') {
        const timeX = x.confirmed_at ? new Date(x.confirmed_at).getTime() : new Date(x.created_at).getTime();
        const timeY = y.confirmed_at ? new Date(y.confirmed_at).getTime() : new Date(y.created_at).getTime();
        return timeX - timeY;
      } else {
        const timeX = new Date(x.created_at).getTime();
        const timeY = new Date(y.created_at).getTime();
        return timeX - timeY;
      }
    });

    const priorityBooking = allColliding[0];
    const isPriority = priorityBooking.id === booking.id;

    return {
      hasConflict: true,
      isPriority,
      priorityBooking,
      otherBookings: allColliding.filter(x => x.id !== booking.id)
    };
  };

  const toggleConflictNotification = async (bookingId: string, currentStatus: boolean) => {
    const nextVal = !currentStatus;
    const { error } = await supabase
      .from('bookings')
      .update({ admin_notified_conflict: nextVal })
      .eq('id', bookingId);
      
    if (error) {
      alert('Error al actualizar notificación: ' + error.message);
    } else {
      setBookings(bookings.map(b => b.id === bookingId ? { ...b, admin_notified_conflict: nextVal } : b));
    }
  };




  const [activeTab, setActiveTab] = useState<'todas' | 'conflictos' | 'contabilidad'>('todas');

  const checkHasClosureConflict = (b: Booking) => {
    if (b.status === 'Cancelada') return false;
    return closures.some((c: any) => {
      const bIn = new Date(b.check_in);
      const bOut = new Date(b.check_out);
      const cIn = new Date(c.start_date);
      const cOut = new Date(c.end_date);
      const dateOverlap = bIn <= cOut && bOut >= cIn;
      const cabinMatches = !c.cabin_id || c.cabin_id === b.cabin_id;
      return dateOverlap && cabinMatches;
    });
  };

  const checkHasOverbookingConflict = (b: Booking) => {
    if (b.status === 'Cancelada') return false;
    const startA = new Date(b.check_in);
    const endA = new Date(b.check_out);
    return bookings.some(other => {
      if (other.id === b.id || other.status === 'Cancelada' || other.cabin_id !== b.cabin_id) return false;
      const startB = new Date(other.check_in);
      const endB = new Date(other.check_out);
      return startA < endB && endA > startB;
    });
  };

  const conflictiveBookingsCount = bookings.filter(b => checkHasClosureConflict(b) || checkHasOverbookingConflict(b)).length;

  const getFilteredAndTabbedBookings = () => {
    let result = bookings;
    if (bookingIdFilter) {
      result = bookings.filter(b => b.id === bookingIdFilter);
    }
    if (activeTab === 'conflictos') {
      result = result.filter(b => checkHasClosureConflict(b) || checkHasOverbookingConflict(b));
    }
    return result;
  };

  const finalDisplayedBookings = getFilteredAndTabbedBookings();

  const selectedCabinForCreate = availableCabins.find(c => c.id === createForm.cabin_id);
  const maxTotalGuestsForCreate = selectedCabinForCreate ? (selectedCabinForCreate.capacity || 2) + (selectedCabinForCreate.max_extra_guests || 0) : 0;
  const totalGuestsRequestedForCreate = Number(createForm.adults) + Number(createForm.children);
  const isCapacityExceededForCreate = selectedCabinForCreate && totalGuestsRequestedForCreate > maxTotalGuestsForCreate;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Reservas</h2>
          <p className="text-gray-500">Administra todas las reservaciones de Rancho Carmelitas.</p>
        </div>

      {closureConflicts.length > 0 && (
        <div className="w-full bg-red-50 border-2 border-red-200 p-6 rounded-[24px] shadow-lg animate-pulse mb-4">
          <div className="flex items-start gap-4">
            <div className="text-3xl animate-bounce">🚨</div>
            <div className="flex-1 space-y-2">
              <h3 className="text-lg font-bold text-red-800 uppercase tracking-wide">
                ALERTA CRÍTICA: Hay {closureConflicts.length} Reservas en Conflicto con Cierres Temporales
              </h3>
              <p className="text-red-700 text-sm font-semibold">
                Existen reservas activas que colisionan con periodos en los que las cabañas han sido declaradas cerradas/desactivadas. Por favor, reubica las reservas afectadas o ajusta los cierres temporales de inmediato:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs text-red-600 font-bold">
                {closureConflicts.map((c, idx) => (
                  <li key={idx} className="hover:text-red-950 transition-colors">
                    Huésped: <Link href={`/admin/reservas?id=${c.booking.id}`} className="underline decoration-dashed hover:decoration-solid font-extrabold text-red-700 hover:text-red-950">
                      {c.booking.guest_name}
                    </Link> en <span className="font-extrabold">{c.booking.cabin?.name}</span> para las fechas del <span className="underline">{c.booking.check_in} al {c.booking.check_out}</span> (Motivo de cierre: "{c.closure.reason}")
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
        <button
          onClick={() => {
            const defaultCabin = availableCabins[0];
            setCreateForm({
              guest_name: '',
              guest_email: '',
              guest_phone: '',
              cabin_id: defaultCabin?.id || '',
              check_in: '',
              check_out: '',
              adults: 1,
              children: 0,
              requires_invoice: false,
              total_price: defaultCabin?.price_per_night?.toString() || '',
              discount_type: 'fixed',
              discount_value: '0',
              plataforma_id: '',
              plataforma_comision_aplicada: '0',
              admin_comision_porcentaje: defaultCommission,
              admin_notes: '',
              status: 'Pendiente',
              guest_rut: '',
              vehicle_plate: '',
              guest_nationality: '',
              guest_preferences: '',
              guest_birthdate: ''
            });
            setAllowOverCapacity(false);
            setCreateModalOpen(true);
          }}
          className="bg-[#11d442] hover:bg-[#0fb337] text-white px-5 py-3 rounded-[12px] font-bold text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 self-start sm:self-auto"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
          </svg>
          Nueva Reserva Manual
        </button>
      </div>

      {bookingIdFilter && (
        <div className="bg-blue-50 border border-blue-100 rounded-3xl p-6 flex flex-col gap-4 animate-in slide-in-from-top-3 duration-300 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 shadow-inner">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
              </div>
              <div>
                <p className="text-base font-bold text-blue-900">Filtro Activo por Reserva</p>
                {(() => {
                  const filteredBooking = bookings.find(b => b.id === bookingIdFilter);
                  if (filteredBooking) {
                    return (
                      <p className="text-xs text-blue-700 font-medium">
                        Mostrando a: <strong className="text-blue-950 font-extrabold">{filteredBooking.guest_name}</strong> en <strong className="text-blue-950 font-extrabold">{filteredBooking.cabin?.name || 'Cabaña'}</strong> ({new Date(filteredBooking.check_in).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })} al {new Date(filteredBooking.check_out).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })})
                      </p>
                    );
                  }
                  return <p className="text-xs text-blue-600 font-medium">Mostrando la reserva seleccionada desde el Dashboard.</p>
                })()}
              </div>
            </div>
            <button 
              onClick={clearFilter}
              className="w-full md:w-auto px-5 py-2.5 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 transition-all shadow-sm active:scale-95"
            >
              Mostrar Todas las Reservas
            </button>
          </div>

          {/* Selector interactivo de reservas en conflicto para alternar rápidamente */}
          {bookings.filter(b => checkHasClosureConflict(b) || checkHasOverbookingConflict(b)).length > 0 && (
            <div className="pt-4 border-t border-blue-100 flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <span className="text-xs font-bold text-blue-800 uppercase tracking-wider whitespace-nowrap">🔄 Alternar entre conflictos:</span>
              <select
                className="w-full sm:w-auto p-2.5 border border-blue-200 rounded-xl text-xs font-semibold text-blue-900 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={bookingIdFilter || ''}
                onChange={e => {
                  if (e.target.value === 'todas') {
                    clearFilter();
                  } else {
                    router.push(`/admin/reservas?id=${e.target.value}`);
                  }
                }}
              >
                <option value="todas">Mostrar Todas</option>
                {bookings
                  .filter(b => checkHasClosureConflict(b) || checkHasOverbookingConflict(b))
                  .map(b => (
                    <option key={b.id} value={b.id}>
                      {b.guest_name} - {b.cabin?.name || 'Cabaña'} ({b.check_in} al {b.check_out})
                    </option>
                  ))
                }
              </select>
            </div>
          )}
        </div>
      )}

      {/* Pestañas de Navegación del Panel de Reservas */}
      <div className="flex border-b border-gray-200 gap-6">
        <button
          onClick={() => setActiveTab('todas')}
          className={`pb-4 text-sm font-bold transition-all relative ${activeTab === 'todas' ? 'text-[#11d442]' : 'text-gray-500 hover:text-gray-800'}`}
        >
          Todas las Reservas
        </button>
        <button
          onClick={() => setActiveTab('conflictos')}
          className={`pb-4 text-sm font-bold transition-all relative flex items-center gap-2 ${activeTab === 'conflictos' ? 'text-red-600' : 'text-gray-500 hover:text-gray-800'}`}
        >
          <span>⚠️ Reservas en Conflicto</span>
          {conflictiveBookingsCount > 0 && (
            <span className="bg-red-100 text-red-700 text-[10px] px-2 py-0.5 rounded-full font-extrabold animate-pulse">
              {conflictiveBookingsCount}
            </span>
          )}
          {activeTab === 'conflictos' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600 rounded-full" />}
        </button>
        <button
          onClick={() => setActiveTab('contabilidad')}
          className={`pb-4 text-sm font-bold transition-all relative flex items-center gap-2 ${activeTab === 'contabilidad' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-800'}`}
        >
          <span>📊 Reporte Financiero & SII</span>
          {activeTab === 'contabilidad' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />}
        </button>
      </div>

      {activeTab === 'contabilidad' ? (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Liquidación y Reportabilidad SII</h3>
              <p className="text-xs text-gray-500">Calcula los ingresos mensuales, IVA para SII Chile y comisiones de plataforma.</p>
            </div>
            <div className="flex gap-3">
              <select
                className="p-2.5 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 bg-gray-50/50"
                value={reportYear}
                onChange={e => setReportYear(e.target.value)}
              >
                <option value="2026">Año 2026</option>
                <option value="2025">Año 2025</option>
              </select>
              <select
                className="p-2.5 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 bg-gray-50/50"
                value={reportMonth}
                onChange={e => setReportMonth(e.target.value)}
              >
                <option value="all">Todos los meses</option>
                <option value="1">Enero</option>
                <option value="2">Febrero</option>
                <option value="3">Marzo</option>
                <option value="4">Abril</option>
                <option value="5">Mayo</option>
                <option value="6">Junio</option>
                <option value="7">Julio</option>
                <option value="8">Agosto</option>
                <option value="9">Septiembre</option>
                <option value="10">Octubre</option>
                <option value="11">Noviembre</option>
                <option value="12">Diciembre</option>
              </select>
            </div>
          </div>

          {/* Lógica de Cálculo de Reporte */}
          {(() => {
            // Filtrar las reservas activas (no canceladas) según el mes/año del check_in
            const periodBookings = bookings.filter(b => {
              if (b.status === 'Cancelada') return false;
              const date = new Date(b.check_in + 'T00:00:00');
              const matchesYear = date.getFullYear().toString() === reportYear;
              const matchesMonth = reportMonth === 'all' || (date.getMonth() + 1).toString() === reportMonth;
              return matchesYear && matchesMonth;
            });

            let brutoTotal = 0;
            let ivaRecaudado = 0;
            let comisionesPlataformas = 0;
            let comisionesAdmin = 0;
            let netoParaDuenio = 0;

            periodBookings.forEach(b => {
              const breakdown = getBookingBreakdown(b);
              // Suma de pagos reales confirmados o total de la reserva si está completada/checkin
              let totalPagado = b.booking_payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
              if (totalPagado === 0 && b.payment_amount) {
                totalPagado = b.payment_amount;
              }
              // Para contabilidad, si ya está confirmada o checkin se asume el devengo del total o lo cobrado
              const montoEstadía = totalPagado || breakdown.totalCliente;
              
              brutoTotal += montoEstadía;
              ivaRecaudado += breakdown.ivaMonto;
              comisionesPlataformas += breakdown.comisionPlataformaMonto;
              comisionesAdmin += breakdown.adminComisionMonto;
              netoParaDuenio += breakdown.pagoNetoDueño;
            });

            return (
              <div className="space-y-6 animate-in fade-in duration-300">
                {/* Panel de KPIS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm text-center">
                    <p className="text-[10px] uppercase font-bold text-gray-400 font-sans">Ingreso Bruto Total</p>
                    <p className="text-2xl font-extrabold text-gray-900 mt-1">{formatMoney(brutoTotal)}</p>
                    <span className="text-[9px] text-gray-400 font-medium">Pagos y abonos recibidos</span>
                  </div>
                  <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100/50 text-center">
                    <p className="text-[10px] uppercase font-bold text-blue-700">IVA SII Recaudado</p>
                    <p className="text-2xl font-extrabold text-blue-900 mt-1">{formatMoney(ivaRecaudado)}</p>
                    <span className="text-[9px] text-blue-500 font-medium">19% de reservas c/boleta</span>
                  </div>
                  <div className="bg-orange-50/50 p-5 rounded-2xl border border-orange-100/50 text-center">
                    <p className="text-[10px] uppercase font-bold text-orange-700">Comisión Canales</p>
                    <p className="text-2xl font-extrabold text-orange-950 mt-1">{formatMoney(comisionesPlataformas)}</p>
                    <span className="text-[9px] text-orange-500 font-medium">Airbnb, Booking, etc.</span>
                  </div>
                  <div className="bg-purple-50/50 p-5 rounded-2xl border border-purple-100/50 text-center">
                    <p className="text-[10px] uppercase font-bold text-purple-700">Comisión Admin</p>
                    <p className="text-2xl font-extrabold text-purple-900 mt-1">{formatMoney(comisionesAdmin)}</p>
                    <span className="text-[9px] text-purple-500 font-medium">PMS Rancho Carmelitas</span>
                  </div>
                  <div className="bg-emerald-50/60 p-5 rounded-2xl border border-emerald-100/60 text-center shadow-inner">
                    <p className="text-[10px] uppercase font-bold text-emerald-800">Neto al Dueño</p>
                    <p className="text-2xl font-extrabold text-emerald-950 mt-1">{formatMoney(netoParaDuenio)}</p>
                    <span className="text-[9px] text-emerald-600 font-bold">Monto final transferido</span>
                  </div>
                </div>

                {/* Tabla de Detalle Contable */}
                <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase">
                        <tr>
                          <th className="px-6 py-4">Huésped</th>
                          <th className="px-6 py-4">Cabaña</th>
                          <th className="px-6 py-4">Boleta / SII</th>
                          <th className="px-6 py-4">Total Cliente</th>
                          <th className="px-6 py-4">Comisión Canales</th>
                          <th className="px-6 py-4">Comisión Admin</th>
                          <th className="px-6 py-4 text-right">Neto Dueño</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                        {periodBookings.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="px-6 py-10 text-center text-gray-400 italic">
                              No hay registros financieros para el periodo seleccionado.
                            </td>
                          </tr>
                        ) : (
                          periodBookings.map(b => {
                            const breakdown = getBookingBreakdown(b);
                            return (
                              <tr key={b.id} className="hover:bg-gray-55/40 transition-colors">
                                <td className="px-6 py-4 font-bold text-gray-900">{b.guest_name}</td>
                                <td className="px-6 py-4">{b.cabin?.name || 'Cabaña'}</td>
                                <td className="px-6 py-4">
                                  {b.requires_invoice ? (
                                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-bold text-[9px] uppercase">
                                      🧾 Boleta (19% IVA)
                                    </span>
                                  ) : (
                                    <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded text-[9px] uppercase">
                                      👤 Sin Factura
                                    </span>
                                  )}
                                </td>
                                <td className="px-6 py-4 font-semibold text-gray-800">{formatMoney(breakdown.totalCliente)}</td>
                                <td className="px-6 py-4 text-orange-700 font-medium">-{formatMoney(breakdown.comisionPlataformaMonto)} ({breakdown.platComPct}%)</td>
                                <td className="px-6 py-4 text-purple-700 font-medium">-{formatMoney(breakdown.adminComisionMonto)} ({breakdown.adminComPct}%)</td>
                                <td className="px-6 py-4 text-right font-extrabold text-emerald-950">{formatMoney(breakdown.pagoNetoDueño)}</td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      ) : (
        <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Huésped</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Cabaña</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Fechas</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Total</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Estado</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {finalDisplayedBookings.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                      No se encontraron reservas registradas.
                    </td>
                  </tr>
                ) : (
                  finalDisplayedBookings.map((booking) => {
                    const hoursElapsed = Math.floor((new Date().getTime() - new Date(booking.created_at).getTime()) / (1000 * 60 * 60));
                    const isExpired = booking.status === 'Pendiente' && hoursElapsed >= 24;
                    const conflict = getOverbookingConflict(booking);

                    return (
                      <tr key={booking.id} className="hover:bg-gray-55 transition-all">
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <p className="font-bold text-gray-900 flex items-center gap-1.5 flex-wrap">
                              {booking.guest_name}
                              {isExpired && (
                                <>
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-red-100 text-red-700 border border-red-200 animate-pulse">
                                    ⏰ Expirada (+{hoursElapsed}h)
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleStatusChange(booking, 'Cancelada')}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-red-650 hover:bg-red-700 text-white border border-red-700 shadow-sm transition-all active:scale-95 cursor-pointer ml-1.5"
                                    title="Expirar y liberar fechas"
                                  >
                                    ⏳ Expirar y Liberar
                                  </button>
                                </>
                              )}
                            </p>
                            <p className="text-xs text-gray-500">{booking.guest_email}</p>
                            {booking.guest_phone ? (
                              <div className="mt-1 flex items-center gap-1.5">
                                <span className="text-xs" title="Número de Contacto">📞</span>
                                <span className="text-xs font-extrabold text-blue-900 bg-blue-50 border border-blue-150 px-2 py-0.5 rounded-lg font-mono tracking-wide shadow-sm">
                                  {booking.guest_phone}
                                </span>
                              </div>
                            ) : (
                              <p className="text-xs text-gray-400 font-medium italic mt-1">Sin teléfono</p>
                            )}

                            {/* Ficha de Registro de Huésped y Vehículo (Stitch UI Premium) */}
                            {(booking.guest_rut || booking.vehicle_plate || booking.guest_nationality || booking.guest_birthdate || booking.guest_preferences) && (
                              <div className="mt-2.5 p-3 rounded-2xl bg-gray-50/70 border border-gray-150 text-[11px] space-y-1.5 leading-relaxed text-gray-700 max-w-[280px]">
                                <p className="font-bold text-[9px] uppercase tracking-wider text-gray-400 mb-1 flex items-center gap-1">
                                  🪪 Ficha de Check-in
                                </p>
                                {booking.guest_rut && (
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs" title="RUT / Pasaporte">🪪</span>
                                    <span className="font-semibold text-gray-900">{booking.guest_rut}</span>
                                  </div>
                                )}
                                {booking.vehicle_plate && (
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs" title="Patente / Matrícula">🚗</span>
                                    <span className="font-semibold text-gray-800 uppercase bg-yellow-150/40 border border-yellow-250 px-1.5 py-0.2 rounded font-mono text-[10px]">{booking.vehicle_plate}</span>
                                  </div>
                                )}
                                {booking.guest_nationality && (
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs" title="Nacionalidad / Origen">🌎</span>
                                    <span>{booking.guest_nationality}</span>
                                  </div>
                                )}
                                {booking.guest_birthdate && (
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs" title="Fecha de Nacimiento">🎂</span>
                                    <span>{new Date(booking.guest_birthdate + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                                  </div>
                                )}
                                {booking.guest_preferences && (
                                  <div className="mt-1 pt-1.5 border-t border-gray-200/60 text-gray-500 italic text-[10.5px]">
                                    <span className="font-semibold not-italic text-gray-700 text-[9px] uppercase tracking-wide block mb-0.5">✨ Preferencias y Obs:</span>
                                    "{booking.guest_preferences}"
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {/* Banner de Conflicto de Overbooking */}
                            {conflict && !conflict.isPriority && (
                              booking.admin_notified_conflict ? (
                                <div className="mt-2.5 p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-100 text-[11px] flex flex-col gap-1 shadow-sm leading-tight max-w-[280px]">
                                  <p className="font-bold flex items-center gap-1">
                                    ✓ Huésped Notificado
                                  </p>
                                  <p className="text-gray-500 text-[10px]">
                                    A la espera de confirmación de cambio de fecha/cabaña.
                                  </p>
                                  <button 
                                    type="button" 
                                    onClick={() => toggleConflictNotification(booking.id, true)} 
                                    className="text-left text-[9px] underline text-emerald-700 font-bold hover:text-emerald-950 mt-1 cursor-pointer self-start"
                                  >
                                    Desmarcar / Revertir
                                  </button>
                                </div>
                              ) : (
                                <div className="mt-2.5 p-3 rounded-xl bg-red-50 text-red-800 border border-red-100 text-[11px] flex flex-col gap-1.5 shadow-sm leading-tight max-w-[280px]">
                                  <p className="font-bold flex items-center gap-1 text-red-900 uppercase tracking-wider text-[9px]">
                                    ⚠️ Overbooking
                                  </p>
                                  <p className="text-gray-600 text-[10px]">
                                    Colisiona con la reserva prioritaria de <strong className="text-gray-900">{conflict.priorityBooking.guest_name}</strong>.
                                  </p>
                                  <button
                                    type="button"
                                    onClick={() => toggleConflictNotification(booking.id, false)}
                                    className="mt-0.5 bg-white hover:bg-red-100 text-red-950 border border-red-200 px-2 py-1 rounded-lg text-[9px] font-bold flex items-center gap-1 self-start transition-colors active:scale-95 shadow-sm cursor-pointer"
                                  >
                                    📢 Marcar: Ya le avisé
                                  </button>
                                </div>
                              )
                            )}
                          </div>
                        </td>

                      {/* Lógica condicional si estamos editando esta fila */}
                      {editingBooking?.id === booking.id ? (
                        <td colSpan={2} className="px-6 py-5 bg-blue-50/50 rounded-xl my-2">
                          <div className="flex flex-col gap-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <label className="block text-[10px] uppercase font-bold text-blue-700 mb-1">Cabaña</label>
                                <select 
                                  className="p-2.5 border border-gray-200 rounded-xl text-sm w-full bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                                  value={editForm.cabin_id}
                                  onChange={e => handleEditFormChange({ cabin_id: e.target.value })}
                                >
                                  {availableCabins.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-[10px] uppercase font-bold text-blue-700 mb-1">Fechas Estadía</label>
                                <div className="flex gap-2">
                                  <input 
                                    type="text" 
                                    readOnly
                                    placeholder="Clic en calendario..."
                                    className="p-2 border border-gray-200 rounded-xl text-sm w-full bg-gray-50 font-semibold text-gray-800 cursor-default shadow-inner text-center"
                                    value={editForm.check_in}
                                  />
                                  <span className="text-gray-400 self-center">-</span>
                                  <input 
                                    type="text" 
                                    readOnly
                                    placeholder="Clic en calendario..."
                                    className="p-2 border border-gray-200 rounded-xl text-sm w-full bg-gray-50 font-semibold text-gray-800 cursor-default shadow-inner text-center"
                                    value={editForm.check_out}
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="block text-[10px] uppercase font-bold text-blue-700 mb-1">Precio Base Estadía ($)</label>
                                <input 
                                  type="number" 
                                  className="p-2 border border-gray-205 rounded-xl text-sm w-full bg-white shadow-sm"
                                  value={editForm.precio_base}
                                  onChange={e => setEditForm({...editForm, precio_base: e.target.value})}
                                  min="0"
                                />
                              </div>
                            </div>

                            {/* Ficha de Registro de Huésped (Edición Check-in) */}
                            <div className="bg-white p-4 rounded-2xl border border-blue-100 shadow-sm space-y-3">
                              <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                                🪪 Ficha de Registro de Huésped (Check-in)
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                                <div>
                                  <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">RUT o Pasaporte *</label>
                                  <input
                                    type="text"
                                    placeholder="Ej: 12.345.678-9"
                                    className="p-2 border border-gray-250 rounded-xl text-xs w-full bg-white shadow-sm font-semibold focus:ring-1 focus:ring-blue-400 focus:outline-none"
                                    value={editForm.guest_rut}
                                    onChange={e => setEditForm({...editForm, guest_rut: formatRut(e.target.value)})}
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Patente del Vehículo</label>
                                  <input
                                    type="text"
                                    placeholder="Ej: ABCD12"
                                    className="p-2 border border-gray-250 rounded-xl text-xs w-full bg-white shadow-sm font-semibold uppercase focus:ring-1 focus:ring-blue-400 focus:outline-none"
                                    value={editForm.vehicle_plate}
                                    onChange={e => setEditForm({...editForm, vehicle_plate: e.target.value})}
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Nacionalidad / Ciudad</label>
                                  <input
                                    type="text"
                                    placeholder="Ej: Chilena / Santiago"
                                    className="p-2 border border-gray-250 rounded-xl text-xs w-full bg-white shadow-sm focus:ring-1 focus:ring-blue-400 focus:outline-none"
                                    value={editForm.guest_nationality}
                                    onChange={e => setEditForm({...editForm, guest_nationality: e.target.value})}
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Fecha de Nacimiento</label>
                                  <input
                                    type="date"
                                    className="p-2 border border-gray-250 rounded-xl text-xs w-full bg-white shadow-sm focus:ring-1 focus:ring-blue-400 focus:outline-none"
                                    value={editForm.guest_birthdate}
                                    onChange={e => setEditForm({...editForm, guest_birthdate: e.target.value})}
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Preferencias u Observaciones</label>
                                <textarea
                                  placeholder="Ej: Prefiere sábanas extra, vegetariano, etc."
                                  className="p-2 border border-gray-250 rounded-xl text-xs w-full bg-white shadow-sm focus:ring-1 focus:ring-blue-400 focus:outline-none min-h-[45px]"
                                  value={editForm.guest_preferences}
                                  onChange={e => setEditForm({...editForm, guest_preferences: e.target.value})}
                                />
                              </div>
                            </div>

                            {/* Calendario Interactivo de Ocupación para Edición */}
                            <div className="space-y-1">
                              <label className="block text-[10px] uppercase font-bold text-blue-700 mb-1">Calendario de Disponibilidad (Haz clic para seleccionar fechas) *</label>
                              {loadingCabinOcupancy ? (
                                <div className="flex items-center justify-center p-8 bg-white rounded-2xl border border-gray-250 shadow-sm">
                                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#11d442]"></div>
                                  <span className="ml-2 text-xs text-gray-500 font-semibold">Cargando ocupación de cabaña...</span>
                                </div>
                              ) : (
                                renderCalendarEditAdmin()
                              )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-blue-100">
                              <div>
                                <label className="block text-[10px] uppercase font-bold text-blue-700 mb-1">Descuento</label>
                                <div className="flex gap-2">
                                  <div className="flex bg-white rounded-xl border border-gray-200 p-0.5 shadow-sm">
                                    <button 
                                      type="button"
                                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${editForm.discount_type === 'percentage' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-50'}`}
                                      onClick={() => setEditForm({...editForm, discount_type: 'percentage', discount_value: ''})}
                                    >%</button>
                                    <button 
                                      type="button"
                                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${editForm.discount_type === 'fixed' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-50'}`}
                                      onClick={() => setEditForm({...editForm, discount_type: 'fixed', discount_value: ''})}
                                    >$</button>
                                  </div>
                                  <input 
                                    type="number"
                                    className="p-2 border border-gray-200 rounded-xl text-sm w-full bg-white shadow-sm"
                                    value={editForm.discount_value === 0 || editForm.discount_value === '' ? '' : editForm.discount_value}
                                    placeholder="0"
                                    min="0"
                                    onChange={e => setEditForm({...editForm, discount_value: e.target.value === '' ? '' : e.target.value})}
                                  />
                                </div>
                              </div>
                              
                              <div>
                                <label className="block text-[10px] uppercase font-bold text-blue-700 mb-1">Plataforma Origen</label>
                                <select
                                  className="p-2.5 border border-gray-200 rounded-xl text-sm w-full bg-white shadow-sm focus:outline-none"
                                  value={editForm.plataforma_id}
                                  onChange={e => {
                                    const platId = e.target.value;
                                    const plat = plataformas.find(p => p.id === platId);
                                    setEditForm({
                                      ...editForm,
                                      plataforma_id: platId,
                                      plataforma_comision_aplicada: plat ? plat.comision_porcentaje : 0
                                    });
                                  }}
                                >
                                  <option value="">Sin Plataforma (Directo)</option>
                                  {plataformas.map(p => (
                                    <option key={p.id} value={p.id}>{p.nombre}</option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label className="block text-[10px] uppercase font-bold text-blue-700 mb-1">Comisión Plataforma (%)</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  className="p-2 border border-gray-200 rounded-xl text-sm w-full bg-white shadow-sm"
                                  value={editForm.plataforma_comision_aplicada ?? ''}
                                  onChange={e => setEditForm({...editForm, plataforma_comision_aplicada: e.target.value === '' ? '' : e.target.value})}
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <label className="block text-[10px] uppercase font-bold text-blue-700 mb-1">Comisión Administración Interna (%)</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  className="p-2 border border-gray-200 rounded-xl text-sm w-full bg-white shadow-sm"
                                  value={editForm.admin_comision_porcentaje ?? ''}
                                  onChange={e => setEditForm({...editForm, admin_comision_porcentaje: e.target.value === '' ? '' : e.target.value})}
                                />
                              </div>
                              <div className="md:col-span-2">
                                <label className="block text-[10px] uppercase font-bold text-blue-700 mb-1">Notas Administrativas</label>
                                <input 
                                  type="text"
                                  className="p-2 border border-gray-200 rounded-xl text-sm w-full bg-white shadow-sm"
                                  placeholder="Ej: Descuento por promoción de invierno..."
                                  value={editForm.admin_notes ?? ''}
                                  onChange={e => setEditForm({...editForm, admin_notes: e.target.value})}
                                />
                              </div>
                            </div>

                            <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-blue-100 shadow-sm">
                              <input 
                                type="checkbox"
                                id={`edit-invoice-${booking.id}`}
                                className="w-4 h-4 text-blue-600 focus:ring-blue-500 rounded border-gray-300"
                                checked={editForm.requires_invoice}
                                onChange={e => setEditForm({...editForm, requires_invoice: e.target.checked})}
                              />
                              <label htmlFor={`edit-invoice-${booking.id}`} className="text-xs font-bold text-blue-900 cursor-pointer">
                                Requiere Boleta / Factura (Suma 19% de IVA para cálculo del Precio Bruto)
                              </label>
                            </div>

                            {/* Previsualización del Desglose de Liquidación */}
                            {(() => {
                              const precioBaseOriginal = Number(editForm.precio_base) || 0;
                              const discVal = Number(editForm.discount_value) || 0;
                              let discAmt = 0;
                              if (discVal > 0) {
                                discAmt = editForm.discount_type === 'percentage' 
                                  ? precioBaseOriginal * (discVal / 100) 
                                  : discVal;
                              }
                              const precioBaseNeto = Math.max(0, precioBaseOriginal - discAmt);
                              
                              const platComPct = Number(editForm.plataforma_comision_aplicada) || 0;
                              const comisionPlataformaMonto = precioBaseNeto * (platComPct / 100);

                              const tienePlataforma = !!editForm.plataforma_id;
                              const aplicaIVA = tienePlataforma || editForm.requires_invoice;
                              const ivaMonto = aplicaIVA ? (precioBaseNeto + comisionPlataformaMonto) * 0.19 : 0;

                              const totalCliente = precioBaseNeto + comisionPlataformaMonto + ivaMonto;

                              const adminComPct = Number(editForm.admin_comision_porcentaje) || 0;
                              const adminComisionMonto = totalCliente * (adminComPct / 100);
                              const pagoNetoDueño = totalCliente - adminComisionMonto;

                              return (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-xs space-y-1.5">
                                    <h4 className="text-[10px] uppercase font-bold text-gray-500 mb-1">Resumen Estadía (Huésped)</h4>
                                    <div className="flex justify-between text-gray-600">
                                      <span>Precio Base Estadía:</span>
                                      <span>{formatMoney(precioBaseOriginal)}</span>
                                    </div>
                                    {discAmt > 0 && (
                                      <div className="flex justify-between text-green-600 font-medium">
                                        <span>Descuento aplicado:</span>
                                        <span>-{formatMoney(discAmt)}</span>
                                      </div>
                                    )}
                                    {discAmt > 0 && (
                                      <div className="flex justify-between text-gray-500 text-[11px]">
                                        <span>Precio Base Neto:</span>
                                        <span>{formatMoney(precioBaseNeto)}</span>
                                      </div>
                                    )}
                                    {tienePlataforma && (
                                      <div className="flex justify-between text-gray-600">
                                        <span>Comisión Plataforma ({platComPct}%):</span>
                                        <span>+{formatMoney(comisionPlataformaMonto)}</span>
                                      </div>
                                    )}
                                    {aplicaIVA && (
                                      <div className="flex justify-between text-gray-600">
                                        <span>IVA (19%):</span>
                                        <span>+{formatMoney(ivaMonto)}</span>
                                      </div>
                                    )}
                                    <div className="flex justify-between font-bold text-gray-900 pt-1.5 border-t border-gray-150">
                                      <span>Total a Pagar (Post-IVA):</span>
                                      <span>{formatMoney(totalCliente)}</span>
                                    </div>
                                    {aplicaIVA && (
                                      <div className="flex justify-between text-gray-400 text-[10px] pt-1">
                                        <span>Precio Bruto (Sin IVA):</span>
                                        <span>{formatMoney(totalCliente / 1.19)}</span>
                                      </div>
                                    )}
                                  </div>

                                  <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 shadow-sm text-xs space-y-1.5">
                                    <h4 className="text-[10px] uppercase font-bold text-emerald-800 mb-1 flex items-center gap-1">
                                      🛡️ Ficha de Liquidación <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase">Uso Interno</span>
                                    </h4>
                                    {tienePlataforma && (
                                      <div className="flex justify-between text-emerald-750">
                                        <span>Comisión Plataforma ({platComPct}% s/Neto):</span>
                                        <span>{formatMoney(comisionPlataformaMonto)}</span>
                                      </div>
                                    )}
                                    <div className="flex justify-between text-emerald-800 font-bold pt-1.5 border-t border-emerald-100">
                                      <span>Comisión Administración ({adminComPct}% s/Total):</span>
                                      <span>{formatMoney(adminComisionMonto)}</span>
                                    </div>
                                    <div className="flex justify-between text-emerald-950 font-extrabold text-sm pt-1 mt-1 border-t border-dashed border-emerald-200">
                                      <span>Pago Neto Estimado al Dueño:</span>
                                      <span>{formatMoney(pagoNetoDueño)}</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        </td>
                      ) : (
                        <>
                          <td className="px-6 py-4">
                            <p className="text-sm font-semibold text-gray-800">{booking.cabin?.name || 'Cabaña Desconocida'}</p>
                            {booking.plataforma ? (
                              <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                                🔌 {booking.plataforma.nombre}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-50 text-gray-500 border border-gray-150">
                                👤 Directo
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {new Date(booking.check_in).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })} al {new Date(booking.check_out).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                          </td>
                        </>
                      )}

                      <td className="px-6 py-4">
                        {(() => {
                          const breakdown = getBookingBreakdown(booking);
                          let totalAbonado = booking.booking_payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
                          if (totalAbonado === 0 && booking.payment_amount) {
                            totalAbonado = booking.payment_amount;
                          }
                          const saldoPendiente = Math.max(0, breakdown.totalCliente - totalAbonado);
                          return (
                            <div className="bg-gray-55 rounded-xl p-3 border border-gray-100 w-full max-w-[220px]">
                              <div className="space-y-1.5 text-xs">
                                <div className="flex justify-between items-center text-gray-500">
                                  <span>Total Cliente:</span>
                                  <span className="font-bold text-gray-900">{formatMoney(breakdown.totalCliente)}</span>
                                </div>
                                <div className="flex justify-between items-center text-blue-600 font-medium">
                                  <span>Abono:</span>
                                  <span>{formatMoney(totalAbonado)}</span>
                                </div>
                                <div className="flex justify-between items-center font-semibold pt-1 border-t border-gray-200 mt-1">
                                  <span>Saldo:</span>
                                  {saldoPendiente === 0 ? (
                                    <span className="text-green-600 flex items-center gap-0.5 text-[11px] bg-green-50 px-1.5 py-0.5 rounded border border-green-150">
                                      ✓ Pagado
                                    </span>
                                  ) : (
                                    <span className="text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-150">
                                      -{formatMoney(saldoPendiente)}
                                    </span>
                                  )}
                                </div>
                                
                                {/* Botón interactivo para ver/gestionar pagos */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedBookingForPayments(booking);
                                    setPaymentsModalOpen(true);
                                  }}
                                  className="w-full mt-2 py-1 px-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-[10px] uppercase tracking-wider transition-colors border border-blue-200/60 shadow-sm flex items-center justify-center gap-1 cursor-pointer"
                                >
                                  💳 Pagos ({booking.booking_payments?.length || (booking.payment_amount ? 1 : 0)})
                                </button>
                              </div>

                              {/* Micro-ficha de liquidación interna (solo admin, uso privado) */}
                              {breakdown.adminComPct > 0 || breakdown.comisionPlataformaMonto > 0 ? (
                                <div className="mt-2.5 pt-2 border-t border-dashed border-gray-250 text-[10px] space-y-1 bg-emerald-50/40 p-2 rounded-lg text-emerald-800">
                                  <p className="font-bold text-[9px] uppercase tracking-wider text-emerald-950 flex items-center justify-between">
                                    <span>🛡️ Liquidación</span>
                                    <span className="bg-emerald-100 text-emerald-700 px-1 py-0.2 rounded text-[7px]">Privado</span>
                                  </p>
                                  {breakdown.comisionPlataformaMonto > 0 && (
                                    <div className="flex justify-between text-gray-500">
                                      <span>Com. Plataforma:</span>
                                      <span>{formatMoney(breakdown.comisionPlataformaMonto)}</span>
                                    </div>
                                  )}
                                  {breakdown.adminComPct > 0 && (
                                    <div className="flex justify-between text-gray-500">
                                      <span>Com. Admin ({breakdown.adminComPct}%):</span>
                                      <span>{formatMoney(breakdown.adminComisionMonto)}</span>
                                    </div>
                                  )}
                                  <div className="flex justify-between text-emerald-950 font-semibold pt-1 border-t border-emerald-200/50 mt-1">
                                    <span>Neto Dueño:</span>
                                    <span>{formatMoney(breakdown.pagoNetoDueño)}</span>
                                  </div>
                                </div>
                              ) : null}
                            </div>
                          );
                        })()}
                      </td>

                      {/* Celda de Estado */}
                      <td className="px-6 py-4">
                        {(() => {
                          switch (booking.status) {
                            case 'Pendiente':
                              return (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-50 text-yellow-750 border border-yellow-150">
                                  🟡 Pendiente
                                </span>
                              );
                            case 'Confirmada':
                              return (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-750 border border-orange-150">
                                  🟠 Confirmada
                                </span>
                              );
                            case 'checkin':
                              return (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-green-50 text-green-750 border border-green-150 animate-pulse">
                                  🟢 En Cabaña
                                </span>
                              );
                            case 'checkout':
                              return (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-750 border border-blue-150">
                                  🔵 Completada
                                </span>
                              );
                            case 'Cancelada':
                              return (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-750 border border-red-150">
                                  🔴 Cancelada
                                </span>
                              );
                            default:
                              return (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-50 text-gray-750 border border-gray-150">
                                  {booking.status}
                                </span>
                              );
                          }
                        })()}
                      </td>

                      {/* Celda de Acciones */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2.5">
                          {editingBooking?.id === booking.id ? (
                            <>
                              <button
                                type="button"
                                onClick={() => saveEdit()}
                                className="px-3 py-1.5 bg-[#11d442] hover:bg-[#0fb337] text-white font-bold rounded-xl text-xs shadow transition-all active:scale-95 cursor-pointer"
                              >
                                💾 Guardar
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingBooking(null);
                                }}
                                className="px-3 py-1.5 bg-gray-150 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition-all active:scale-95 cursor-pointer"
                              >
                                ❌ Cancelar
                              </button>
                            </>
                          ) : (
                            <>
                              {/* Botones del ciclo de vida PMS */}
                              {booking.status === 'Pendiente' && (
                                <button
                                  type="button"
                                  onClick={() => handleStatusChange(booking, 'Confirmada')}
                                  className="px-2.5 py-1.5 bg-yellow-50 hover:bg-yellow-100 text-yellow-750 font-bold rounded-xl text-xs border border-yellow-250/50 shadow-sm transition-all active:scale-95 flex items-center gap-1 cursor-pointer animate-in fade-in"
                                  title="Confirmar reserva y registrar abono inicial"
                                >
                                  ✓ Confirmar
                                </button>
                              )}

                              {booking.status === 'Confirmada' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedBookingForCheckIn(booking);
                                    setCheckInForm({
                                      guest_rut: booking.guest_rut || '',
                                      vehicle_plate: booking.vehicle_plate || '',
                                      guest_nationality: booking.guest_nationality || '',
                                      guest_preferences: booking.guest_preferences || '',
                                      guest_birthdate: booking.guest_birthdate || ''
                                    });
                                    setCheckInModalOpen(true);
                                  }}
                                  className="px-2.5 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 font-bold rounded-xl text-xs border border-green-200/50 shadow-sm transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
                                >
                                  🚗 Check-In
                                </button>
                              )}

                              {booking.status === 'checkin' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedBookingForCheckOut(booking);
                                    setCheckOutNotes('');
                                    setCheckOutModalOpen(true);
                                  }}
                                  className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl text-xs border border-blue-200/50 shadow-sm transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
                                >
                                  🔑 Check-Out
                                </button>
                              )}

                              {/* Editar Inline */}
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingBooking(booking);
                                  setEditForm({
                                    cabin_id: booking.cabin_id,
                                    check_in: formatDateString(booking.check_in),
                                    check_out: formatDateString(booking.check_out),
                                    discount_type: booking.discount_applied ? 'fixed' : 'fixed',
                                    discount_value: booking.discount_applied || '',
                                    admin_notes: booking.admin_notes || '',
                                    plataforma_id: booking.plataforma_id || '',
                                    plataforma_comision_aplicada: booking.plataforma_comision_aplicada || '',
                                    admin_comision_porcentaje: booking.admin_comision_porcentaje || '',
                                    requires_invoice: !!booking.requires_invoice,
                                    precio_base: booking.total_price ? booking.total_price.toString() : '',
                                    guest_rut: booking.guest_rut || '',
                                    vehicle_plate: booking.vehicle_plate || '',
                                    guest_nationality: booking.guest_nationality || '',
                                    guest_preferences: booking.guest_preferences || '',
                                    guest_birthdate: booking.guest_birthdate || ''
                                  });
                                }}
                                className="text-gray-500 hover:text-blue-600 p-1.5 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                                title="Editar reserva"
                              >
                                ✏️
                              </button>

                              {/* Cancelar */}
                              {booking.status !== 'Cancelada' && booking.status !== 'checkout' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setBookingToCancel(booking);
                                    setCancelForm({
                                      sendEmail: true,
                                      sendWhatsapp: !!booking.guest_phone,
                                      reasonType: 'no_payment'
                                    });
                                    setCancelModalOpen(true);
                                  }}
                                  className="text-gray-400 hover:text-red-650 p-1.5 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                  title="Cancelar reserva"
                                >
                                  🗑️
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Modal Cancelación de Reserva Multicanal */}
      {cancelModalOpen && bookingToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-[24px] p-8 w-full max-w-md shadow-2xl relative border border-gray-150">
            <button 
              onClick={() => {
                setCancelModalOpen(false);
                setBookingToCancel(null);
              }}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-xl font-bold text-gray-900 mb-2">Cancelar Reserva</h3>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              Estás a punto de cancelar la reserva de <strong className="text-gray-800">{bookingToCancel.guest_name}</strong> para la cabaña <strong>{bookingToCancel.cabin?.name}</strong>.
            </p>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Razón de la Cancelación</label>
                <select
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-sm font-semibold focus:bg-white focus:outline-none"
                  value={cancelForm.reasonType}
                  onChange={e => setCancelForm({...cancelForm, reasonType: e.target.value as any})}
                >
                  <option value="no_payment">⏳ Falta de Abono (Plazo 24h vencido)</option>
                  <option value="conflict">⚠️ Conflicto de Overbooking / Reubicación</option>
                  <option value="other">⚙️ Otro Motivo / Cancelación General</option>
                </select>
              </div>

              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-150 space-y-3">
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">📢 Notificar al Huésped por:</h4>
                
                <label className="flex items-center gap-3 cursor-pointer py-1 select-none">
                  <input 
                    type="checkbox"
                    className="w-4 h-4 text-[#11d442] focus:ring-[#11d442]/30 rounded border-gray-300 cursor-pointer"
                    checked={cancelForm.sendEmail}
                    onChange={e => setCancelForm({...cancelForm, sendEmail: e.target.checked})}
                  />
                  <span className="text-xs font-bold text-gray-700 flex items-center gap-1">
                    📧 Correo Electrónico {bookingToCancel.guest_email ? <span className="text-[10px] text-gray-400 font-medium">({bookingToCancel.guest_email})</span> : <span className="text-red-500 text-[10px] font-medium">(No registrado)</span>}
                  </span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer py-1 select-none">
                  <input 
                    type="checkbox"
                    className="w-4 h-4 text-[#11d442] focus:ring-[#11d442]/30 rounded border-gray-300 cursor-pointer"
                    checked={cancelForm.sendWhatsapp}
                    onChange={e => setCancelForm({...cancelForm, sendWhatsapp: e.target.checked})}
                    disabled={!bookingToCancel.guest_phone}
                  />
                  <span className={`text-xs font-bold flex items-center gap-1 ${!bookingToCancel.guest_phone ? 'text-gray-400' : 'text-gray-700'}`}>
                    💬 WhatsApp Web {bookingToCancel.guest_phone ? <span className="text-[10px] text-gray-400 font-medium">({bookingToCancel.guest_phone})</span> : <span className="text-red-500 text-[10px] font-medium">(No registrado)</span>}
                  </span>
                </label>
              </div>

              {cancelForm.sendWhatsapp && bookingToCancel.guest_phone && (
                <p className="text-[10px] text-amber-600 bg-amber-50 border border-amber-100 p-3 rounded-xl leading-relaxed">
                  💡 **Nota de WhatsApp:** Al confirmar, se abrirá automáticamente una pestaña de WhatsApp Web con un mensaje cortés pre-redactado y adaptado al motivo de la cancelación.
                </p>
              )}

              <div className="pt-2 flex gap-3">
                <button 
                  onClick={confirmCancelation}
                  disabled={isCanceling}
                  className="flex-1 bg-red-500 hover:bg-red-650 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 text-sm flex items-center justify-center gap-2"
                >
                  {isCanceling ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Cancelando...
                    </>
                  ) : 'Confirmar Cancelación'}
                </button>
                <button 
                  onClick={() => {
                    setCancelModalOpen(false);
                    setBookingToCancel(null);
                  }}
                  disabled={isCanceling}
                  className="px-6 py-3 font-bold text-gray-500 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors text-sm"
                >
                  Volver
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmación de Pago */}
      {confirmModalOpen && bookingToConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-[24px] p-8 w-full max-w-md shadow-2xl relative">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Registrar Pago</h3>
            <p className="text-sm text-gray-500 mb-6">
              Para confirmar la reserva de <strong>{bookingToConfirm.guest_name}</strong>, registra los datos del abono. Al guardar, se le enviará un correo con el comprobante de reserva definitiva.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Monto del Abono Recibido ($)</label>
                {(() => {
                  const prevPayments = bookingToConfirm.booking_payments?.reduce((sum: number, p: any) => sum + p.amount, 0) || 0;
                  const totalAbonadoPrevio = prevPayments === 0 && bookingToConfirm.payment_amount 
                    ? bookingToConfirm.payment_amount 
                    : prevPayments;
                  const totalNeto = bookingToConfirm.total_price || 0;
                  const sugerido50 = Math.round(totalNeto * 0.5);
                  const faltaPara50 = Math.max(0, sugerido50 - totalAbonadoPrevio);
                  
                  return (
                    <div className="space-y-1.5 mb-2.5 bg-gray-50/50 p-3 rounded-2xl border border-gray-150 shadow-sm animate-in fade-in">
                      <div className="flex justify-between text-xs font-semibold text-gray-500">
                        <span>Total Reserva:</span>
                        <span className="text-gray-900 font-extrabold">{formatMoney(totalNeto)}</span>
                      </div>
                      {totalAbonadoPrevio > 0 && (
                        <div className="flex justify-between text-xs font-semibold text-blue-600">
                          <span>Abonado Previamente:</span>
                          <span className="font-extrabold">{formatMoney(totalAbonadoPrevio)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1.5 rounded-xl border border-emerald-100 mt-1 flex-wrap">
                        {faltaPara50 > 0 ? (
                          <>
                            <span>Sugerido (Faltante 50%):</span>
                            <span className="font-extrabold text-emerald-800">{formatMoney(faltaPara50)}</span>
                          </>
                        ) : (
                          <>
                            <span>Sugerido (Saldo Restante):</span>
                            <span className="font-extrabold text-emerald-800">{formatMoney(totalNeto - totalAbonadoPrevio)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })()}
                <input 
                  type="number" 
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white"
                  placeholder="Ej: 50000"
                  value={paymentForm.amount}
                  onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">ID / Referencia (Opcional)</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white"
                  placeholder="Ej: TR-123456"
                  value={paymentForm.reference}
                  onChange={e => setPaymentForm({...paymentForm, reference: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Comprobante (Opcional)</label>
                <input 
                  type="file" 
                  accept="image/*,.pdf"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white text-sm"
                  onChange={e => {
                    const file = e.target.files?.[0] || null;
                    setPaymentForm({...paymentForm, receiptFile: file});
                  }}
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  onClick={confirmPaymentAndBooking}
                  disabled={isConfirming || !paymentForm.amount}
                  className="flex-1 bg-[#11d442] text-white font-bold py-3 px-4 rounded-xl hover:bg-[#0fb337] disabled:opacity-50"
                >
                  {isConfirming ? 'Procesando...' : 'Confirmar Reserva'}
                </button>
                <button 
                  onClick={() => setConfirmModalOpen(false)}
                  disabled={isConfirming}
                  className="px-6 py-3 font-bold text-gray-500 bg-gray-100 rounded-xl hover:bg-gray-200"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Creación de Reserva Manual */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-[24px] p-8 w-full max-w-2xl shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto border border-gray-150">
            <button 
              onClick={() => setCreateModalOpen(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-xl font-bold text-gray-900 mb-2">Crear Nueva Reserva Manual</h3>
            <p className="text-sm text-gray-500 mb-6">
              Registra una reserva recibida de forma externa o directa. Configura la plataforma y las comisiones para la liquidación.
            </p>

            <form 
              onSubmit={(e) => { 
                e.preventDefault(); 
                createBooking(); 
              }} 
              className="space-y-5"
            >
              <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 space-y-4">
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">👤 Datos del Huésped</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Nombre Completo *</label>
                    <input 
                      type="text" 
                      required
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#11d442]/30 focus:border-[#11d442] text-sm"
                      placeholder="Ej: Juan Pérez"
                      value={createForm.guest_name}
                      onChange={e => setCreateForm({...createForm, guest_name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Correo Electrónico *</label>
                    <input 
                      type="email" 
                      required
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#11d442]/30 focus:border-[#11d442] text-sm"
                      placeholder="juan@correo.com"
                      value={createForm.guest_email}
                      onChange={e => setCreateForm({...createForm, guest_email: e.target.value})}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Teléfono de Contacto</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#11d442]/30 focus:border-[#11d442] text-sm"
                      placeholder="Ej: +56 9 1234 5678"
                      value={createForm.guest_phone}
                      onChange={e => setCreateForm({...createForm, guest_phone: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 space-y-4">
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                  🪪 Ficha de Registro de Huésped (Check-in Anticipado)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">RUT o Pasaporte</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#11d442]/30 text-sm"
                      placeholder="Ej: 12.345.678-9"
                      value={createForm.guest_rut}
                      onChange={e => setCreateForm({...createForm, guest_rut: formatRut(e.target.value)})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Patente del Vehículo</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#11d442]/30 text-sm uppercase"
                      placeholder="Ej: ABCD12"
                      value={createForm.vehicle_plate}
                      onChange={e => setCreateForm({...createForm, vehicle_plate: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Nacionalidad / Ciudad de Origen</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#11d442]/30 text-sm"
                      placeholder="Ej: Chilena / Valparaíso"
                      value={createForm.guest_nationality}
                      onChange={e => setCreateForm({...createForm, guest_nationality: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Fecha de Nacimiento</label>
                    <input 
                      type="date" 
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#11d442]/30 text-sm"
                      value={createForm.guest_birthdate}
                      onChange={e => setCreateForm({...createForm, guest_birthdate: e.target.value})}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Preferencias u Observaciones del Huésped</label>
                    <textarea 
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#11d442]/30 text-sm min-h-[60px]"
                      placeholder="Ej: Requiere cuna de bebé, prefiere cama matrimonial armada con sábanas blancas, etc."
                      value={createForm.guest_preferences}
                      onChange={e => setCreateForm({...createForm, guest_preferences: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 space-y-4">
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">🏡 Detalles de Estadía</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Cabaña Seleccionada *</label>
                    <select 
                      required
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#11d442]/30 text-sm"
                      value={createForm.cabin_id}
                      onChange={e => handleCreateFormChange({ cabin_id: e.target.value })}
                    >
                      <option value="">Seleccione una cabaña...</option>
                      {availableCabins.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Estado Inicial *</label>
                    <select 
                      required
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#11d442]/30 text-sm"
                      value={createForm.status}
                      onChange={e => setCreateForm({...createForm, status: e.target.value})}
                    >
                      <option value="Pendiente">Pendiente</option>
                      <option value="Confirmada">Confirmada</option>
                      <option value="Cancelada">Cancelada</option>
                    </select>
                  </div>
                  {/* Calendario Interactivo de Ocupación */}
                  <div className="sm:col-span-2 space-y-1 mt-2">
                    <label className="block text-xs font-bold text-gray-700 mb-1">Calendario de Disponibilidad (Haz clic para seleccionar fechas) *</label>
                    {loadingCabinOcupancy ? (
                      <div className="flex items-center justify-center p-8 bg-gray-50 rounded-2xl border border-gray-200">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#11d442]"></div>
                        <span className="ml-2 text-xs text-gray-500 font-semibold">Cargando ocupación de cabaña...</span>
                      </div>
                    ) : (
                      renderCalendarAdmin()
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Fecha Check-in *</label>
                    <input 
                      type="text" 
                      required
                      readOnly
                      placeholder="Haz clic en el calendario"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-800 font-semibold text-sm focus:outline-none cursor-default shadow-inner"
                      value={createForm.check_in}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Fecha Check-out *</label>
                    <input 
                      type="text" 
                      required
                      readOnly
                      placeholder="Haz clic en el calendario"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-800 font-semibold text-sm focus:outline-none cursor-default shadow-inner"
                      value={createForm.check_out}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Adultos *</label>
                    <input 
                      type="number" 
                      min="1" 
                      required
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm"
                      value={createForm.adults}
                      onChange={e => handleCreateFormChange({ adults: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Niños</label>
                    <input 
                      type="number" 
                      min="0"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm"
                      value={createForm.children}
                      onChange={e => handleCreateFormChange({ children: Number(e.target.value) })}
                    />
                  </div>
                  {selectedCabinForCreate && isCapacityExceededForCreate && (
                    <div className="sm:col-span-2 bg-red-50 border border-red-150 rounded-xl p-4 mt-2 animate-in fade-in">
                      <p className="text-xs font-bold text-red-700 flex items-center gap-1.5 leading-tight">
                        ❌ CAPACIDAD MÁXIMA EXCEDIDA: La capacidad máxima para la cabaña {selectedCabinForCreate.name} es de {maxTotalGuestsForCreate} personas (capacidad base {selectedCabinForCreate.capacity} + {selectedCabinForCreate.max_extra_guests || 0} adicionales). Estás intentando registrar {totalGuestsRequestedForCreate} personas. Modifica la cantidad de huéspedes para habilitar el guardado.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 space-y-4">
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">💳 Finanzas y Comisiones</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Precio Total Base ($) *</label>
                    <input 
                      type="number" 
                      min="0"
                      required
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm"
                      placeholder="Ej: 150000"
                      value={createForm.total_price}
                      onChange={e => setCreateForm({...createForm, total_price: e.target.value})}
                    />
                  </div>
                                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Descuento</label>
                    <div className="flex gap-2">
                      <div className="flex bg-white rounded-xl border border-gray-200 p-0.5 shadow-sm">
                        <button 
                          type="button"
                          className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${createForm.discount_type === 'percentage' ? 'bg-[#11d442]/10 text-[#11d442]' : 'text-gray-500 hover:bg-gray-50'}`}
                          onClick={() => setCreateForm({...createForm, discount_type: 'percentage', discount_value: ''})}
                        >%</button>
                        <button 
                          type="button"
                          className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${createForm.discount_type === 'fixed' ? 'bg-[#11d442]/10 text-[#11d442]' : 'text-gray-500 hover:bg-gray-50'}`}
                          onClick={() => setCreateForm({...createForm, discount_type: 'fixed', discount_value: ''})}
                        >$</button>
                      </div>
                      <input 
                        type="number"
                        className="p-2 border border-gray-200 rounded-xl text-sm w-full bg-white shadow-sm focus:outline-none"
                        value={createForm.discount_value === '0' || createForm.discount_value === '' ? '' : createForm.discount_value}
                        placeholder="0"
                        min="0"
                        onChange={e => setCreateForm({...createForm, discount_value: e.target.value === '' ? '' : e.target.value})}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Plataforma Origen</label>
                    <select
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm focus:outline-none"
                      value={createForm.plataforma_id}
                      onChange={e => {
                        const platId = e.target.value;
                        const plat = plataformas.find(p => p.id === platId);
                        setCreateForm({
                          ...createForm,
                          plataforma_id: platId,
                          plataforma_comision_aplicada: plat ? plat.comision_porcentaje.toString() : '0'
                        });
                      }}
                    >
                      <option value="">Sin Plataforma (Directo)</option>
                      {plataformas.map(p => (
                        <option key={p.id} value={p.id}>{p.nombre}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Comisión Plataforma (%)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      min="0"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm"
                      value={createForm.plataforma_comision_aplicada ?? ''}
                      onChange={e => setCreateForm({...createForm, plataforma_comision_aplicada: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Comisión Admin Interna (%)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      min="0"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm"
                      value={createForm.admin_comision_porcentaje ?? ''}
                      onChange={e => setCreateForm({...createForm, admin_comision_porcentaje: e.target.value})}
                    />
                  </div>
                  <div className="flex items-center gap-2.5 self-end h-[42px] bg-white px-4 rounded-xl border border-gray-200">
                    <input 
                      type="checkbox"
                      id="create-invoice"
                      className="w-4 h-4 text-[#11d442] focus:ring-[#11d442] rounded border-gray-300"
                      checked={createForm.requires_invoice}
                      onChange={e => setCreateForm({...createForm, requires_invoice: e.target.checked})}
                    />
                    <label htmlFor="create-invoice" className="text-xs font-bold text-gray-700 cursor-pointer">
                      Suma 19% de IVA para Cálculo de Bruto
                    </label>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Notas Administrativas</label>
                <textarea 
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm min-h-[60px]"
                  placeholder="Notas internas..."
                  value={createForm.admin_notes}
                  onChange={e => setCreateForm({...createForm, admin_notes: e.target.value})}
                />
              </div>

              {/* Previsualización del Desglose en Tiempo Real */}
              {(() => {
                const precioBaseOriginal = Number(createForm.total_price) || 0;
                const discVal = Number(createForm.discount_value) || 0;
                let discAmt = 0;
                if (discVal > 0) {
                  discAmt = createForm.discount_type === 'percentage' 
                    ? precioBaseOriginal * (discVal / 100) 
                    : discVal;
                }
                const precioBaseNeto = Math.max(0, precioBaseOriginal - discAmt);
                
                const platComPct = Number(createForm.plataforma_comision_aplicada) || 0;
                const comisionPlataformaMonto = precioBaseNeto * (platComPct / 100);

                const tienePlataforma = !!createForm.plataforma_id;
                const aplicaIVA = !!createForm.requires_invoice;
                const ivaMonto = aplicaIVA ? (precioBaseNeto + comisionPlataformaMonto) * 0.19 : 0;

                const totalCliente = precioBaseNeto + comisionPlataformaMonto + ivaMonto;

                const adminComPct = Number(createForm.admin_comision_porcentaje) || 0;
                const adminComisionMonto = totalCliente * (adminComPct / 100);
                const pagoNetoDueño = totalCliente - adminComisionMonto;

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-gray-100 pt-4 animate-in fade-in">
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-xs space-y-1.5">
                      <h5 className="text-[10px] uppercase font-bold text-gray-500 mb-1">Previsualización Huésped</h5>
                      <div className="flex justify-between text-gray-600">
                        <span>Precio Base Estadía:</span>
                        <span>{formatMoney(precioBaseOriginal)}</span>
                      </div>
                      {discAmt > 0 && (
                        <div className="flex justify-between text-green-600 font-medium">
                          <span>Descuento aplicado:</span>
                          <span>-{formatMoney(discAmt)}</span>
                        </div>
                      )}
                      {discAmt > 0 && (
                        <div className="flex justify-between text-gray-500 text-[11px]">
                          <span>Precio Base Neto:</span>
                          <span>{formatMoney(precioBaseNeto)}</span>
                        </div>
                      )}
                      {tienePlataforma && (
                        <div className="flex justify-between text-gray-600">
                          <span>Comisión Plataforma ({platComPct}%):</span>
                          <span>+{formatMoney(comisionPlataformaMonto)}</span>
                        </div>
                      )}
                      {aplicaIVA && (
                        <div className="flex justify-between text-gray-600">
                          <span>IVA (19%):</span>
                          <span>+{formatMoney(ivaMonto)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-gray-900 pt-1.5 border-t border-gray-200 mt-1">
                        <span>Total a Pagar (Post-IVA):</span>
                        <span>{formatMoney(totalCliente)}</span>
                      </div>
                      {aplicaIVA && (
                        <div className="flex justify-between text-gray-400 text-[10px] pt-1">
                          <span>Precio Bruto (Sin IVA):</span>
                          <span>{formatMoney(totalCliente / 1.19)}</span>
                        </div>
                      )}
                    </div>

                    <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 text-xs space-y-1.5">
                      <h5 className="text-[10px] uppercase font-bold text-emerald-850 mb-1 flex items-center justify-between">
                        <span>🛡️ Ficha de Liquidación</span>
                        <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase">Uso Interno</span>
                      </h5>
                      {tienePlataforma && (
                        <div className="flex justify-between text-emerald-750">
                          <span>Comisión Plataforma ({platComPct}% s/Neto):</span>
                          <span>{formatMoney(comisionPlataformaMonto)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-emerald-800 font-bold pt-1.5 border-t border-emerald-100">
                        <span>Comisión Administración ({adminComPct}% s/Total):</span>
                        <span>{formatMoney(adminComisionMonto)}</span>
                      </div>
                      <div className="flex justify-between text-emerald-950 font-extrabold text-sm pt-1 mt-1 border-t border-dashed border-emerald-200">
                        <span>Pago Neto Estimado al Dueño:</span>
                        <span>{formatMoney(pagoNetoDueño)}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="pt-4 flex gap-3">
                <button 
                  type="submit"
                  disabled={isCreating || isCapacityExceededForCreate}
                  className={`flex-1 font-bold py-3 px-4 rounded-xl transition-colors text-sm shadow-md active:scale-95 ${
                    (isCreating || isCapacityExceededForCreate)
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-70'
                      : 'bg-[#11d442] text-white hover:bg-[#0fb337]'
                  }`}
                >
                  {isCreating ? 'Creando Reserva...' : 'Crear y Guardar Reserva'}
                </button>
                <button 
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  disabled={isCreating}
                  className="px-6 py-3 font-bold text-gray-500 bg-gray-100 rounded-xl hover:bg-gray-200 text-sm transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ========================================================================= */}
      {/* MODAL DE GESTIÓN DE PAGOS MÚLTIPLES E HISTORIAL DE TRANSACCIONES           */}
      {/* ========================================================================= */}
      {paymentsModalOpen && selectedBookingForPayments && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-[24px] p-8 w-full max-w-2xl shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto border border-gray-150">
            <button 
              onClick={() => {
                setPaymentsModalOpen(false);
                setSelectedBookingForPayments(null);
              }}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              💳 Historial y Registro de Pagos
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Gestiona los abonos y transacciones para la estadía de <strong className="text-gray-800">{selectedBookingForPayments.guest_name}</strong> en <strong className="text-gray-800">{selectedBookingForPayments.cabin?.name || 'Cabaña'}</strong>.
            </p>

            {/* Ficha Resumen de Saldos */}
            {(() => {
              const breakdown = getBookingBreakdown(selectedBookingForPayments);
              let totalAbonado = selectedBookingForPayments.booking_payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
              if (totalAbonado === 0 && selectedBookingForPayments.payment_amount) {
                totalAbonado = selectedBookingForPayments.payment_amount;
              }
              const saldoPendiente = Math.max(0, breakdown.totalCliente - totalAbonado);
              
              return (
                <>
                  <div className="grid grid-cols-3 gap-4 bg-gray-55 p-4 rounded-2xl border border-gray-150 text-center">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-gray-400">Total Reserva</p>
                      <p className="text-lg font-bold text-gray-900">{formatMoney(breakdown.totalCliente)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-blue-500">Total Abonado</p>
                      <p className="text-lg font-bold text-blue-700">{formatMoney(totalAbonado)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-gray-400">Saldo Pendiente</p>
                      {saldoPendiente === 0 ? (
                        <p className="text-lg font-bold text-green-600 flex items-center justify-center gap-1">
                          ✓ Pagado
                        </p>
                      ) : (
                        <p className="text-lg font-bold text-orange-600">{formatMoney(saldoPendiente)}</p>
                      )}
                    </div>
                  </div>

                  {/* Historial de Transacciones (Línea de Tiempo) */}
                  <div>
                    <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">🕒 Historial de Transacciones</h4>
                    {(!selectedBookingForPayments.booking_payments || selectedBookingForPayments.booking_payments.length === 0) && !selectedBookingForPayments.payment_amount ? (
                      <p className="text-xs text-gray-400 italic bg-gray-50/50 p-4 rounded-xl border border-dashed text-center">
                        No hay pagos registrados para esta reserva aún.
                      </p>
                    ) : (
                      <div className="relative border-l-2 border-gray-150 pl-4 space-y-4 ml-2">
                        {/* Pago Migrado/Inicial si aplica */}
                        {selectedBookingForPayments.payment_amount && (!selectedBookingForPayments.booking_payments || selectedBookingForPayments.booking_payments.length === 0) && (
                          <div className="relative">
                            <span className="absolute -left-[21px] mt-1.5 w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-white"></span>
                            <div className="bg-blue-50/40 p-3 rounded-xl border border-blue-100 text-xs">
                              <div className="flex justify-between font-bold text-blue-900 mb-1">
                                <span>Abono de Registro (Inicial)</span>
                                <span>{formatMoney(selectedBookingForPayments.payment_amount)}</span>
                              </div>
                              <div className="flex justify-between text-gray-500 text-[10px] mt-1">
                                <span>Método: Transferencia</span>
                                {selectedBookingForPayments.confirmed_at && (
                                  <span>Fecha: {new Date(selectedBookingForPayments.confirmed_at).toLocaleDateString('es-ES')}</span>
                                )}
                              </div>
                              {selectedBookingForPayments.payment_reference && (
                                <p className="text-[10px] text-gray-600 mt-1 font-mono">Ref: {selectedBookingForPayments.payment_reference}</p>
                              )}
                              {selectedBookingForPayments.payment_receipt_url && (
                                <a href={selectedBookingForPayments.payment_receipt_url} target="_blank" rel="noreferrer" className="text-blue-500 underline text-[10px] mt-1 block">
                                  Ver Comprobante
                                </a>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Pagos de la tabla booking_payments */}
                        {selectedBookingForPayments.booking_payments?.map((payment: any, i: number) => (
                          <div key={payment.id || i} className="relative">
                            <span className="absolute -left-[21px] mt-1.5 w-2.5 h-2.5 rounded-full bg-[#11d442] ring-4 ring-white"></span>
                            <div className="bg-gray-55/30 p-3 rounded-xl border border-gray-200 text-xs">
                              <div className="flex justify-between font-bold text-gray-900 mb-1">
                                <span>Abono Registrado #{i + 1}</span>
                                <span className="text-[#11d442] font-bold">{formatMoney(payment.amount)}</span>
                              </div>
                              <div className="flex justify-between text-gray-500 text-[10px] mt-1">
                                <span>Método: {payment.payment_method}</span>
                                <span>Fecha: {new Date(payment.created_at).toLocaleDateString('es-ES')}</span>
                              </div>
                              {payment.reference && (
                                <p className="text-[10px] text-gray-600 mt-1 font-mono">Ref: {payment.reference}</p>
                              )}
                              {payment.notes && (
                                <p className="text-[10px] text-gray-500 mt-1 italic">Obs: "{payment.notes}"</p>
                              )}
                              {payment.receipt_url && (
                                <a href={payment.receipt_url} target="_blank" rel="noreferrer" className="text-blue-500 underline text-[10px] mt-1 block">
                                  Ver Comprobante
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Formulario para añadir nuevo abono */}
                  {saldoPendiente > 0 && (
                    <div className="space-y-4">
                      {selectedBookingForPayments.status === 'Pendiente' && (
                        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 text-xs leading-relaxed text-orange-900 shadow-sm animate-in slide-in-from-top-2 duration-300">
                          <div className="flex items-center gap-2 font-bold text-orange-950 mb-1.5">
                            <span className="text-base">💡</span>
                            <span className="uppercase tracking-wider text-[10px]">Abono Sugerido (50% Inicial)</span>
                          </div>
                          <p className="text-orange-850 font-medium">
                            Para formalizar y confirmar esta estadía de forma definitiva, se sugiere un abono inicial equivalente al 50% de la tarifa total.
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2 items-center">
                            {totalAbonado === 0 ? (
                              <>
                                <span className="text-[11px] text-orange-800 font-semibold">Valor Sugerido: <strong className="text-orange-950 font-extrabold">{formatMoney(Math.round(breakdown.totalCliente * 0.5))}</strong></span>
                                <button
                                  type="button"
                                  onClick={() => setPmsPaymentForm({ ...pmsPaymentForm, amount: Math.round(breakdown.totalCliente * 0.5).toString() })}
                                  className="bg-orange-600 hover:bg-orange-700 text-white font-extrabold px-3 py-1.5 rounded-xl text-[10px] uppercase shadow-md transition-all active:scale-95 cursor-pointer ml-auto"
                                >
                                  Pre-llenar 50%
                                </button>
                              </>
                            ) : (
                              (() => {
                                const sugerido50 = Math.round(breakdown.totalCliente * 0.5);
                                const faltaPara50 = Math.max(0, sugerido50 - totalAbonado);
                                if (faltaPara50 > 0) {
                                  return (
                                    <>
                                      <span className="text-[11px] text-orange-800 font-semibold">Faltante para 50%: <strong className="text-orange-950 font-extrabold">{formatMoney(faltaPara50)}</strong> (Abonado actual: {formatMoney(totalAbonado)})</span>
                                      <button
                                        type="button"
                                        onClick={() => setPmsPaymentForm({ ...pmsPaymentForm, amount: faltaPara50.toString() })}
                                        className="bg-orange-600 hover:bg-orange-700 text-white font-extrabold px-3 py-1.5 rounded-xl text-[10px] uppercase shadow-md transition-all active:scale-95 cursor-pointer ml-auto"
                                      >
                                        Pre-llenar Faltante
                                      </button>
                                    </>
                                  );
                                }
                                return (
                                  <span className="text-[11px] text-emerald-800 font-bold flex items-center gap-1">
                                    ✓ ¡Monto del 50% alcanzado! (Total abonado actual: {formatMoney(totalAbonado)})
                                  </span>
                                );
                              })()
                            )}
                          </div>
                        </div>
                      )}

                      <div className="bg-blue-50/30 p-6 rounded-2xl border border-blue-100/70 space-y-4">
                        <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1">
                          ➕ Registrar Pago / Abono
                        </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Monto a Abonar ($) *</label>
                          <input 
                            type="number"
                            placeholder="Monto en pesos"
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white text-xs text-gray-800 font-semibold"
                            value={pmsPaymentForm.amount}
                            max={saldoPendiente}
                            onChange={e => setPmsPaymentForm({...pmsPaymentForm, amount: e.target.value})}
                          />
                          <p className="text-[9px] text-blue-500 mt-1 font-semibold flex justify-between">
                            <span>Sugerido (Total Restante):</span>
                            <button 
                              type="button" 
                              onClick={() => setPmsPaymentForm({...pmsPaymentForm, amount: saldoPendiente.toString()})}
                              className="underline hover:text-blue-700 cursor-pointer"
                            >
                              {formatMoney(saldoPendiente)}
                            </button>
                          </p>
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Método de Pago *</label>
                          <select
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white text-xs font-semibold"
                            value={pmsPaymentForm.payment_method}
                            onChange={e => setPmsPaymentForm({...pmsPaymentForm, payment_method: e.target.value})}
                          >
                            <option value="Transferencia">Transferencia Bancaria</option>
                            <option value="Efectivo">Efectivo</option>
                            <option value="Tarjeta">Tarjeta de Crédito / Débito</option>
                            <option value="Otro">Otro Método</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">ID / Referencia de Pago</label>
                          <input 
                            type="text"
                            placeholder="Ej: Código de transferencia"
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white text-xs"
                            value={pmsPaymentForm.reference}
                            onChange={e => setPmsPaymentForm({...pmsPaymentForm, reference: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Comprobante de Pago (Imagen)</label>
                          <input 
                            type="file"
                            accept="image/*"
                            className="w-full px-3 py-1.5 border border-gray-200 rounded-xl bg-white text-xs text-gray-500"
                            onChange={e => setPmsPaymentForm({...pmsPaymentForm, receiptFile: e.target.files?.[0] || null})}
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Observaciones</label>
                          <input 
                            type="text"
                            placeholder="Ej: Pago realizado por el acompañante..."
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white text-xs"
                            value={pmsPaymentForm.notes}
                            onChange={e => setPmsPaymentForm({...pmsPaymentForm, notes: e.target.value})}
                          />
                        </div>
                      </div>
                      {(() => {
                        const montoIngresado = Number(pmsPaymentForm.amount) || 0;
                        const proyectadoTotal = totalAbonado + montoIngresado;
                        const esPendiente = selectedBookingForPayments.status === 'Pendiente';
                        const alcanza50 = proyectadoTotal >= Math.round(breakdown.totalCliente * 0.5);
                        
                        let buttonText = '✓ Registrar Abono';
                        let buttonStyles = "w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-colors active:scale-95 shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer";
                        
                        if (isAddingPayment) {
                          buttonText = 'Registrando...';
                        } else if (esPendiente && alcanza50) {
                          buttonText = '✓ Registrar y Confirmar Reserva';
                          buttonStyles = "w-full py-2.5 bg-[#11d442] hover:bg-[#0fb337] text-white font-extrabold rounded-xl text-xs uppercase tracking-wider transition-all active:scale-95 shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer animate-in fade-in";
                        }
                        
                        return (
                          <button
                            type="button"
                            disabled={isAddingPayment || !pmsPaymentForm.amount}
                            onClick={() => handleAddPmsPayment(selectedBookingForPayments.id)}
                            className={buttonStyles}
                          >
                            {buttonText}
                          </button>
                        );
                      })()}
                    </div>
                    </div>
                  )}

                  <div className="pt-2 border-t border-gray-150 flex justify-end">
                    <button 
                      type="button" 
                      onClick={() => {
                        setPaymentsModalOpen(false);
                        setSelectedBookingForPayments(null);
                      }}
                      className="px-6 py-2.5 font-bold text-gray-500 bg-gray-100 rounded-xl hover:bg-gray-200 text-xs transition-colors"
                    >
                      Cerrar Panel
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL DE CHECK-IN OPERATIVO RESTRICTIVO (PMS FASE 2)                      */}
      {/* ========================================================================= */}
      {checkInModalOpen && selectedBookingForCheckIn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-[24px] p-8 w-full max-w-2xl shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto border border-gray-150">
            <button 
              onClick={() => {
                setCheckInModalOpen(false);
                setSelectedBookingForCheckIn(null);
              }}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-1.5">
              🚗 Iniciar Check-In del Huésped
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Valida la ficha de registro y corrobora el pago del 100% para la cabaña <strong className="text-gray-800">{selectedBookingForCheckIn.cabin?.name || 'Cabaña'}</strong>.
            </p>

            {(() => {
              const breakdown = getBookingBreakdown(selectedBookingForCheckIn);
              let totalAbonado = selectedBookingForCheckIn.booking_payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
              if (totalAbonado === 0 && selectedBookingForCheckIn.payment_amount) {
                totalAbonado = selectedBookingForCheckIn.payment_amount;
              }
              const saldoPendiente = Math.max(0, breakdown.totalCliente - totalAbonado);

              return (
                <div className="space-y-6">
                  {/* Ficha obligatoria de huésped */}
                  <div className="bg-gray-50 p-5 rounded-2xl border border-gray-150 space-y-4">
                    <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1">
                      🪪 Ficha de Registro de Alojamiento (Obligatoria)
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">RUT o Pasaporte *</label>
                        <input
                          type="text"
                          required
                          placeholder="Ej: 12.345.678-9"
                          className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white text-xs font-semibold"
                          value={checkInForm.guest_rut}
                          onChange={e => setCheckInForm({...checkInForm, guest_rut: formatRut(e.target.value)})}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Patente de Vehículo</label>
                        <input
                          type="text"
                          placeholder="Ej: ABCD12"
                          className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white text-xs font-semibold uppercase"
                          value={checkInForm.vehicle_plate}
                          onChange={e => setCheckInForm({...checkInForm, vehicle_plate: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Nacionalidad / Ciudad Origen</label>
                        <input
                          type="text"
                          placeholder="Ej: Chilena / Santiago"
                          className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white text-xs"
                          value={checkInForm.guest_nationality}
                          onChange={e => setCheckInForm({...checkInForm, guest_nationality: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Fecha de Nacimiento</label>
                        <input
                          type="date"
                          className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white text-xs"
                          value={checkInForm.guest_birthdate}
                          onChange={e => setCheckInForm({...checkInForm, guest_birthdate: e.target.value})}
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Preferencias y Observaciones</label>
                        <textarea
                          placeholder="Ej: Alérgico a las plumas, prefiere calefacción encendida..."
                          className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white text-xs min-h-[50px]"
                          value={checkInForm.guest_preferences}
                          onChange={e => setCheckInForm({...checkInForm, guest_preferences: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Estado Financiero y Restricción de Check-In */}
                  <div className="bg-gray-50 p-5 rounded-2xl border border-gray-150 space-y-4">
                    <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1">
                      💰 Verificación y Cobro de Saldo Restante
                    </h4>
                    <div className="flex justify-between items-center text-sm p-3 bg-white rounded-xl border border-gray-200">
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Saldo Pendiente de Cobro:</p>
                        <p className="text-xl font-bold text-gray-900">{formatMoney(saldoPendiente)}</p>
                      </div>
                      {saldoPendiente === 0 ? (
                        <div className="bg-green-100 text-green-700 px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1">
                          ✓ Pagado 100%
                        </div>
                      ) : (
                        <div className="bg-red-50 text-red-700 border border-red-150 px-3 py-1.5 rounded-xl font-bold text-xs animate-pulse">
                          ⚠️ Cobro Pendiente
                        </div>
                      )}
                    </div>

                    {/* Si tiene saldo pendiente, habilitar formulario de cobro rápido */}
                    {saldoPendiente > 0 && (
                      <div className="bg-white p-4 rounded-xl border border-gray-200/80 space-y-3">
                        <p className="text-xs text-gray-600 font-semibold leading-relaxed">
                          💡 **Pago Requerido:** Deberás cobrar el saldo restante de <strong className="text-gray-900">{formatMoney(saldoPendiente)}</strong> para poder habilitar el check-in en el sistema. Registra el pago a continuación:
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[9px] uppercase font-bold text-gray-500 mb-0.5">Monto Cobrado ($) *</label>
                            <input 
                              type="number"
                              className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold"
                              value={pmsPaymentForm.amount}
                              onChange={e => setPmsPaymentForm({...pmsPaymentForm, amount: e.target.value})}
                              placeholder={saldoPendiente.toString()}
                            />
                            <button 
                              type="button" 
                              onClick={() => setPmsPaymentForm({...pmsPaymentForm, amount: saldoPendiente.toString()})}
                              className="text-[9px] text-blue-500 underline font-semibold mt-0.5"
                            >
                              Copiar saldo restante
                            </button>
                          </div>
                          <div>
                            <label className="block text-[9px] uppercase font-bold text-gray-500 mb-0.5">Método de Pago *</label>
                            <select
                              className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold"
                              value={pmsPaymentForm.payment_method}
                              onChange={e => setPmsPaymentForm({...pmsPaymentForm, payment_method: e.target.value})}
                            >
                              <option value="Transferencia">Transferencia</option>
                              <option value="Efectivo">Efectivo en Check-in</option>
                              <option value="Tarjeta">Tarjeta de Crédito/Débito</option>
                            </select>
                          </div>
                        </div>
                        <button
                          type="button"
                          disabled={isAddingPayment || !pmsPaymentForm.amount}
                          onClick={async () => {
                            await handleAddPmsPayment(selectedBookingForCheckIn.id);
                          }}
                          className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs uppercase transition-colors"
                        >
                          {isAddingPayment ? 'Registrando Pago...' : '✓ Registrar Pago de Saldo'}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Acciones del Check-in */}
                  <div className="pt-4 border-t border-gray-150 flex gap-3">
                    <button
                      type="button"
                      onClick={handlePmsCheckIn}
                      disabled={isProcessingCheckIn || saldoPendiente > 0 || !checkInForm.guest_rut}
                      className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm text-white shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5 ${
                        saldoPendiente > 0 || !checkInForm.guest_rut
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-70'
                          : 'bg-[#11d442] hover:bg-[#0fb337]'
                      }`}
                      title={saldoPendiente > 0 ? 'Falta liquidar el saldo pendiente' : !checkInForm.guest_rut ? 'RUT del huésped requerido' : 'Ingresar Huésped'}
                    >
                      {isProcessingCheckIn ? 'Procesando Check-In...' : '🚗 Completar Check-In & Entregar Cabaña'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCheckInModalOpen(false);
                        setSelectedBookingForCheckIn(null);
                      }}
                      className="px-6 py-3 font-bold text-gray-500 bg-gray-100 rounded-xl hover:bg-gray-200 text-sm"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL DE CHECK-OUT OPERATIVO (PMS FASE 2)                                 */}
      {/* ========================================================================= */}
      {checkOutModalOpen && selectedBookingForCheckOut && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-[24px] p-8 w-full max-w-md shadow-2xl relative border border-gray-150">
            <button 
              onClick={() => {
                setCheckOutModalOpen(false);
                setSelectedBookingForCheckOut(null);
              }}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-1.5">
              🔑 Registrar Check-Out
            </h3>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              Confirma la salida física de <strong className="text-gray-800">{selectedBookingForCheckOut.guest_name}</strong> de la cabaña <strong>{selectedBookingForCheckOut.cabin?.name}</strong>.
            </p>

            <div className="space-y-5">
              {/* Checklist de Entrega */}
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-150 space-y-3">
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">📋 Auditoría Física de Salida:</h4>
                <label className="flex items-center gap-3 cursor-pointer py-1 select-none">
                  <input type="checkbox" required className="w-4 h-4 text-blue-600 rounded border-gray-300 cursor-pointer" />
                  <span className="text-xs font-bold text-gray-700">🔑 Llaves de Rancho Carmelitas devueltas</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer py-1 select-none">
                  <input type="checkbox" required className="w-4 h-4 text-blue-600 rounded border-gray-300 cursor-pointer" />
                  <span className="text-xs font-bold text-gray-700">🔍 Cabaña inspeccionada y sin daños mayores</span>
                </label>
              </div>

              {/* Registro de Observaciones/Daños */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Observaciones, Daños o Pérdidas</label>
                <textarea
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-xs font-semibold focus:bg-white focus:outline-none min-h-[60px]"
                  placeholder="Ej: Todo en orden, o: Taza de baño trizada..."
                  value={checkOutNotes}
                  onChange={e => setCheckOutNotes(e.target.value)}
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button 
                  onClick={handlePmsCheckOut}
                  disabled={isProcessingCheckOut}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 text-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isProcessingCheckOut ? 'Procesando...' : 'Confirmar Check-Out'}
                </button>
                <button 
                  onClick={() => {
                    setCheckOutModalOpen(false);
                    setSelectedBookingForCheckOut(null);
                  }}
                  disabled={isProcessingCheckOut}
                  className="px-6 py-3 font-bold text-gray-500 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors text-sm"
                >
                  Volver
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ReservasPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#11d442]"></div>
      </div>
    }>
      <ReservasContent />
    </Suspense>
  );
}
