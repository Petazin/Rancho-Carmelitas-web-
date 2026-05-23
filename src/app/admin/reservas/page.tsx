'use client';

import { useEffect, useState, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { useSearchParams, useRouter } from 'next/navigation';

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
  return Math.floor(totalRaw / 1000) * 1000;
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
  const [loading, setLoading] = useState(true);
  const [plataformas, setPlataformas] = useState<any[]>([]);
  
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
    precio_base: '' as string | number
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
    status: 'Pendiente'
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

  async function fetchCabinOcupancy(cabinId: string, excludeBookingId?: string) {
    setLoadingCabinOcupancy(true);
    let query = supabase
      .from('bookings')
      .select('check_in, check_out')
      .eq('cabin_id', cabinId)
      .neq('status', 'Cancelada');

    if (excludeBookingId) {
      query = query.neq('id', excludeBookingId);
    }

    const { data } = await query;
    setExistingBookingsForSelectedCabin(data || []);
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

  const isDateInSelectedRangeAdmin = (dateStr: string) => {
    const checkIn = createForm.check_in;
    const checkOut = createForm.check_out;
    if (checkIn && checkOut) {
      return dateStr > checkIn && dateStr < checkOut;
    }
    return false;
  };

  const handleDateClickAdmin = (dateStr: string) => {
    if (isDateBookedAdmin(dateStr)) return; // Ignorar ocupados

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
        // Verificar solapamiento en el medio
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
        const isCheckIn = createForm.check_in === dateStr;
        const isCheckOut = createForm.check_out === dateStr;
        const inRange = isDateInSelectedRangeAdmin(dateStr);

        let cellClasses = "h-10 w-full flex items-center justify-center text-sm font-medium rounded-full transition-all cursor-pointer relative ";
        
        if (isPast) {
            cellClasses += "text-gray-300 hover:bg-gray-50"; // Permitir pasado por ser reserva manual de administrador
        } else if (booked) {
            cellClasses += "bg-red-50 text-red-400 line-through cursor-not-allowed";
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

        // Permitimos seleccionar fechas pasadas porque el administrador puede querer registrar una reserva histórica.
        // Pero no permitimos seleccionar fechas ocupadas.
        const isSelectable = !booked;

        days.push(
            <div key={`day-admin-${d}`} className="relative py-1 px-0.5">
                {rangeBgClasses && <div className={rangeBgClasses}></div>}
                <button 
                  type="button"
                  onClick={() => isSelectable && handleDateClickAdmin(dateStr)}
                  disabled={!isSelectable}
                  className={cellClasses}
                  aria-label={dateStr}
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
            <div className="flex gap-4 mt-4 text-[9px] font-bold uppercase text-gray-500 justify-center border-t pt-3 border-gray-100">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#11d442]"></span> Seleccionado</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-100 border border-red-200"></span> Ocupado</span>
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
    if (isDateBookedAdmin(dateStr)) return; // Ignorar ocupados

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
        // Verificar solapamiento en el medio
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
        const isCheckIn = editForm.check_in === dateStr;
        const isCheckOut = editForm.check_out === dateStr;
        const inRange = isDateInSelectedRangeEditAdmin(dateStr);

        let cellClasses = "h-10 w-full flex items-center justify-center text-sm font-medium rounded-full transition-all cursor-pointer relative ";
        
        if (isPast) {
            cellClasses += "text-gray-300 hover:bg-gray-50"; // Permitir pasado por ser reserva manual de administrador
        } else if (booked) {
            cellClasses += "bg-red-50 text-red-400 line-through cursor-not-allowed";
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

        const isSelectable = !booked;

        days.push(
            <div key={`day-edit-admin-${d}`} className="relative py-1 px-0.5">
                {rangeBgClasses && <div className={rangeBgClasses}></div>}
                <button 
                  type="button"
                  onClick={() => isSelectable && handleDateClickEditAdmin(dateStr)}
                  disabled={!isSelectable}
                  className={cellClasses}
                  aria-label={dateStr}
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
            <div className="flex gap-4 mt-4 text-[9px] font-bold uppercase text-gray-500 justify-center border-t pt-3 border-gray-100">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#11d442]"></span> Seleccionado</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-100 border border-red-200"></span> Ocupado</span>
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
  }, []);

  async function fetchCabins() {
    const { data } = await supabase.from('cabins').select('id, name, price_per_night, capacity, max_extra_guests, extra_guest_surcharge_percentage').order('name');
    setAvailableCabins(data || []);
  }

  async function fetchPlataformas() {
    const { data } = await supabase.from('plataformas').select('id, nombre, comision_porcentaje').order('nombre');
    setPlataformas(data || []);
  }

  async function fetchBookings() {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        cabin:cabins (name),
        plataforma:plataformas (nombre)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching bookings:', error);
    } else {
      setBookings(data || []);
    }
    setLoading(false);
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'confirmada': return 'bg-green-100 text-green-700';
      case 'pendiente': return 'bg-yellow-100 text-yellow-700';
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
    }
  };

  const handleStatusChange = (booking: Booking, newStatus: string) => {
    if (newStatus === 'Confirmada') {
      setBookingToConfirm(booking);
      // Sugerir el 50% del total a pagar (total_price - discount_applied)
      const totalToPay = (booking.total_price || 0) - (booking.discount_applied || 0);
      const suggestedAbono = Math.round(totalToPay * 0.5);
      setPaymentForm({ 
        amount: suggestedAbono.toString(), 
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
    } catch (err: any) {
      alert('Error confirmando pago: ' + err.message);
    } finally {
      setIsConfirming(false);
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
      precio_base: Math.round(baseOriginal).toString()
    });
  };

  const saveEdit = async () => {
    if (!editingBooking) return;
    
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
        total_price: nuevoTotalAPagar
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
            plataforma: updatedPlataforma ? { nombre: updatedPlataforma.nombre } : undefined
          } 
        : b
      ));
      setEditingBooking(null);
    }
  };

  const createBooking = async () => {
    setIsCreating(true);
    try {
      // Validación rígida de exceso de capacidad
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
          status: createForm.status
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




  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#11d442]"></div>
      </div>
    );
  }

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
              discount_applied: '0',
              plataforma_id: '',
              plataforma_comision_aplicada: '0',
              admin_comision_porcentaje: '0',
              admin_notes: '',
              status: 'Pendiente'
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
        <div className="bg-blue-50 border border-blue-100 rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in slide-in-from-top-3 duration-300 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 shadow-inner">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
            </div>
            <div>
              <p className="text-base font-bold text-blue-900">Filtro Activo por Reserva</p>
              <p className="text-xs text-blue-600 font-medium">Mostrando únicamente la reserva seleccionada desde el Dashboard.</p>
            </div>
          </div>
          <button 
            onClick={clearFilter}
            className="w-full sm:w-auto px-5 py-2.5 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 transition-all shadow-sm active:scale-95"
          >
            Mostrar Todas las Reservas
          </button>
        </div>
      )}

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
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    No se encontraron reservas registradas.
                  </td>
                </tr>
              ) : (
                filteredBookings.map((booking) => {
                  const hoursElapsed = Math.floor((new Date().getTime() - new Date(booking.created_at).getTime()) / (1000 * 60 * 60));
                  const isExpired = booking.status === 'Pendiente' && hoursElapsed >= 24;
                  const conflict = getOverbookingConflict(booking);

                  return (
                    <tr key={booking.id} className="hover:bg-gray-50 transition-all">
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
                          <p className="text-xs text-gray-500 font-mono">{booking.guest_phone || 'Sin teléfono'}</p>
                          
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

                          {/* Calendario Interactivo de Ocupación para Edición */}
                          <div className="space-y-1">
                            <label className="block text-[10px] uppercase font-bold text-blue-700 mb-1">Calendario de Disponibilidad (Haz clic para seleccionar fechas) *</label>
                            {loadingCabinOcupancy ? (
                              <div className="flex items-center justify-center p-8 bg-white rounded-2xl border border-gray-200 shadow-sm">
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
                                    <span>${precioBaseOriginal.toLocaleString()}</span>
                                  </div>
                                  {discAmt > 0 && (
                                    <div className="flex justify-between text-green-600 font-medium">
                                      <span>Descuento aplicado:</span>
                                      <span>-${Math.round(discAmt).toLocaleString()}</span>
                                    </div>
                                  )}
                                  {discAmt > 0 && (
                                    <div className="flex justify-between text-gray-500 text-[11px]">
                                      <span>Precio Base Neto:</span>
                                      <span>${Math.round(precioBaseNeto).toLocaleString()}</span>
                                    </div>
                                  )}
                                  {tienePlataforma && (
                                    <div className="flex justify-between text-gray-600">
                                      <span>Comisión Plataforma ({platComPct}%):</span>
                                      <span>+${Math.round(comisionPlataformaMonto).toLocaleString()}</span>
                                    </div>
                                  )}
                                  {aplicaIVA && (
                                    <div className="flex justify-between text-gray-600">
                                      <span>IVA (19%):</span>
                                      <span>+${Math.round(ivaMonto).toLocaleString()}</span>
                                    </div>
                                  )}
                                  <div className="flex justify-between font-bold text-gray-900 pt-1.5 border-t border-gray-150">
                                    <span>Total a Pagar (Post-IVA):</span>
                                    <span>${Math.round(totalCliente).toLocaleString()}</span>
                                  </div>
                                  {aplicaIVA && (
                                    <div className="flex justify-between text-gray-400 text-[10px] pt-1">
                                      <span>Precio Bruto (Sin IVA):</span>
                                      <span>${Math.round(totalCliente / 1.19).toLocaleString()}</span>
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
                                      <span>${Math.round(comisionPlataformaMonto).toLocaleString()}</span>
                                    </div>
                                  )}
                                  <div className="flex justify-between text-emerald-800 font-bold pt-1.5 border-t border-emerald-100">
                                    <span>Comisión Administración ({adminComPct}% s/Total):</span>
                                    <span>${Math.round(adminComisionMonto).toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between text-emerald-950 font-extrabold text-sm pt-1 mt-1 border-t border-dashed border-emerald-200">
                                    <span>Pago Neto Estimado al Dueño:</span>
                                    <span>${Math.round(pagoNetoDueño).toLocaleString()}</span>
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
                        return (
                          <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 w-full max-w-[220px]">
                            <div className="space-y-1.5 text-xs">
                              <div className="flex justify-between items-center text-gray-500">
                                <span>Precio Base:</span>
                                <span>${breakdown.precioBaseOriginal.toLocaleString()}</span>
                              </div>
                              
                              {breakdown.discount > 0 && (
                                <div className="flex justify-between items-center text-[11px] text-green-600 font-medium">
                                  <span>- Descuento:</span>
                                  <span>-${breakdown.discount.toLocaleString()}</span>
                                </div>
                              )}

                              {breakdown.discount > 0 && (
                                <div className="flex justify-between items-center text-[10px] text-gray-400">
                                  <span>Base Neto:</span>
                                  <span>${breakdown.precioBaseNeto.toLocaleString()}</span>
                                </div>
                              )}

                              {breakdown.comisionPlataformaMonto > 0 && (
                                <div className="flex justify-between items-center text-[11px] text-gray-600">
                                  <span>+ Comisión Plat ({breakdown.platComPct}%):</span>
                                  <span>+${breakdown.comisionPlataformaMonto.toLocaleString()}</span>
                                </div>
                              )}

                              {breakdown.ivaMonto > 0 && (
                                <div className="flex justify-between items-center text-[11px] text-gray-600">
                                  <span>+ IVA (19%):</span>
                                  <span>+${breakdown.ivaMonto.toLocaleString()}</span>
                                </div>
                              )}
                              
                              <div className="flex justify-between items-center font-bold text-gray-900 pt-2 border-t border-gray-200 mt-1">
                                <span>Total Pagar:</span>
                                <span className="text-base">${breakdown.totalCliente.toLocaleString()}</span>
                              </div>

                              {breakdown.aplicaIVA && (
                                <div className="flex justify-between items-center text-[10px] text-gray-400 pt-0.5">
                                  <span>Bruto Sin IVA:</span>
                                  <span>${breakdown.precioBrutoSinIva.toLocaleString()}</span>
                                </div>
                              )}
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
                                    <span>Comisión Plat:</span>
                                    <span>-${breakdown.comisionPlataformaMonto.toLocaleString()}</span>
                                  </div>
                                )}
                                {breakdown.adminComPct > 0 && (
                                  <>
                                    <div className="flex justify-between text-gray-500">
                                      <span>Admin ({breakdown.adminComPct}%):</span>
                                      <span>-${breakdown.adminComisionMonto.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between font-bold text-emerald-950 border-t border-emerald-100 pt-1 mt-0.5">
                                      <span>Neto Dueño:</span>
                                      <span>${breakdown.pagoNetoDueño.toLocaleString()}</span>
                                    </div>
                                  </>
                                )}
                              </div>
                            ) : null}

                            {booking.admin_notes && (
                              <div className="mt-3 pt-2 border-t border-gray-200 text-[11px] text-gray-500 bg-white p-2 rounded-lg leading-tight" title={booking.admin_notes}>
                                📝 {booking.admin_notes}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4">
                      {editingBooking?.id === booking.id ? (
                        <span className="text-gray-400 italic text-xs">Editando...</span>
                      ) : (
                        <>
                          <select 
                            value={booking.status || 'Pendiente'} 
                            onChange={(e) => handleStatusChange(booking, e.target.value)}
                            className={`px-3 py-1 rounded-full text-xs font-bold border-none cursor-pointer outline-none transition-all block ${getStatusColor(booking.status || 'Pendiente')}`}
                          >
                            <option value="Pendiente">Pendiente</option>
                            <option value="Confirmada">Confirmada</option>
                            <option value="Cancelada">Cancelada</option>
                          </select>
                          {booking.status === 'Confirmada' && booking.confirmed_at && (
                            <div className="text-[10px] text-gray-500 mt-2 bg-gray-50 p-2 rounded-lg border border-gray-100">
                              <p><strong>Confirmado:</strong> {new Date(booking.confirmed_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                              {booking.confirmed_by && <p><strong>Por:</strong> {booking.confirmed_by}</p>}
                              {booking.payment_amount && <p className="text-blue-600 font-bold mt-1">Abono: ${booking.payment_amount.toLocaleString()}</p>}
                              {booking.payment_receipt_url && (
                                <a href={booking.payment_receipt_url} target="_blank" rel="noreferrer" className="text-blue-500 underline mt-1 block">
                                  Ver Comprobante
                                </a>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingBooking?.id === booking.id ? (
                        <div className="flex gap-2">
                          <button onClick={saveEdit} className="text-white bg-[#11d442] px-3 py-1 rounded text-sm font-medium hover:bg-green-600">Guardar</button>
                          <button onClick={() => setEditingBooking(null)} className="text-gray-500 bg-gray-100 px-3 py-1 rounded text-sm font-medium hover:bg-gray-200">Cancelar</button>
                        </div>
                      ) : (
                        <button onClick={() => startEditing(booking)} className="text-blue-500 text-sm font-medium hover:underline">
                          Editar Fechas / Cobros
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
              )}
            </tbody>
          </table>
        </div>
      </div>

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
                <p className="text-xs text-gray-500 font-semibold mb-2 flex flex-wrap justify-between gap-1">
                  <span>Total Neto: <strong className="text-gray-800">${((bookingToConfirm.total_price || 0) - (bookingToConfirm.discount_applied || 0)).toLocaleString()}</strong></span>
                  <span className="text-[#11d442]">Sugerido (50%): <strong>${Math.round(((bookingToConfirm.total_price || 0) - (bookingToConfirm.discount_applied || 0)) * 0.5).toLocaleString()}</strong></span>
                </p>
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
                        value={createForm.discount_value === 0 || createForm.discount_value === '0' || createForm.discount_value === '' ? '' : createForm.discount_value}
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
                        <span>${precioBaseOriginal.toLocaleString()}</span>
                      </div>
                      {discAmt > 0 && (
                        <div className="flex justify-between text-green-600 font-medium">
                          <span>Descuento aplicado:</span>
                          <span>-${Math.round(discAmt).toLocaleString()}</span>
                        </div>
                      )}
                      {discAmt > 0 && (
                        <div className="flex justify-between text-gray-500 text-[11px]">
                          <span>Precio Base Neto:</span>
                          <span>${Math.round(precioBaseNeto).toLocaleString()}</span>
                        </div>
                      )}
                      {tienePlataforma && (
                        <div className="flex justify-between text-gray-600">
                          <span>Comisión Plataforma ({platComPct}%):</span>
                          <span>+${Math.round(comisionPlataformaMonto).toLocaleString()}</span>
                        </div>
                      )}
                      {aplicaIVA && (
                        <div className="flex justify-between text-gray-600">
                          <span>IVA (19%):</span>
                          <span>+${Math.round(ivaMonto).toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-gray-900 pt-1.5 border-t border-gray-200 mt-1">
                        <span>Total a Pagar (Post-IVA):</span>
                        <span>${Math.round(totalCliente).toLocaleString()}</span>
                      </div>
                      {aplicaIVA && (
                        <div className="flex justify-between text-gray-400 text-[10px] pt-1">
                          <span>Precio Bruto (Sin IVA):</span>
                          <span>${Math.round(totalCliente / 1.19).toLocaleString()}</span>
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
                          <span>${Math.round(comisionPlataformaMonto).toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-emerald-800 font-bold pt-1.5 border-t border-emerald-100">
                        <span>Comisión Administración ({adminComPct}% s/Total):</span>
                        <span>${Math.round(adminComisionMonto).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-emerald-950 font-extrabold text-sm pt-1 mt-1 border-t border-dashed border-emerald-200">
                        <span>Pago Neto Estimado al Dueño:</span>
                        <span>${Math.round(pagoNetoDueño).toLocaleString()}</span>
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
