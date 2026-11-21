'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

const formatMoney = (amount: number | undefined | null) => {
  if (amount === undefined || amount === null) return '$0';
  const formatted = new Intl.NumberFormat('es-CL', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
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

export function VenueQuoteForm() {
  // Selección de fecha y horario
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [startTime, setStartTime] = useState('10:00');
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  const [occupiedDates, setOccupiedDates] = useState<string[]>([]);
  const [isLoadingDates, setIsLoadingDates] = useState(true);

  // Asistentes
  const [adults, setAdults] = useState(15);
  const [children, setChildren] = useState(0);
  const [under3Years, setUnder3Years] = useState(0);

  // Extras
  const [hasBouncyCastle, setHasBouncyCastle] = useState(false);
  const [extraNotes, setExtraNotes] = useState('');

  // Datos de contacto del organizador
  const [organizerName, setOrganizerName] = useState('');
  const [organizerEmail, setOrganizerEmail] = useState('');
  const [organizerPhone, setOrganizerPhone] = useState('');
  const [organizerRut, setOrganizerRut] = useState('');
  const [groupType, setGroupType] = useState('paseo_curso');
  const [groupName, setGroupName] = useState('');
  const [acceptedRules, setAcceptedRules] = useState(false);

  // Estados de proceso
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [quoteSuccess, setQuoteSuccess] = useState<any | null>(null);
  const [adminWhatsapp, setAdminWhatsapp] = useState('56994168853');

  // Cargar fechas ocupadas y número de WhatsApp al montar
  useEffect(() => {
    async function loadOccupiedDates() {
      setIsLoadingDates(true);
      try {
        const { data, error } = await supabase.rpc('get_occupied_venue_dates');
        if (!error && data) {
          const dates = data.map((item: { occupied_date: string }) => item.occupied_date);
          setOccupiedDates(dates);
        }
      } catch (err) {
        console.warn('Error al cargar fechas ocupadas de recinto:', err);
      } finally {
        setIsLoadingDates(false);
      }
    }

    async function loadWhatsappSetting() {
      try {
        const { data } = await supabase
          .from('settings')
          .select('value')
          .eq('key', 'whatsapp_number')
          .maybeSingle();
        if (data?.value) {
          const clean = data.value.replace(/[^0-9]/g, '');
          if (clean) setAdminWhatsapp(clean);
        }
      } catch (err) {
        console.warn('Error al cargar whatsapp_number de configuraciones:', err);
      }
    }

    loadOccupiedDates();
    loadWhatsappSetting();
  }, []);

  // Calcular hora de término (8 horas continuas)
  const calculateEndTime = (startStr: string) => {
    const [h, m] = startStr.split(':').map(Number);
    const endH = h + 8;
    return `${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };
  const endTime = calculateEndTime(startTime);

  // Motor financiero de tramos oficiales
  const payingGuests = Math.max(1, adults + children); // Asistentes que pagan (mayores de 3 años)
  const totalGuests = payingGuests + under3Years;

  let basePrice = 180000;
  let extraGuestsCost = 0;

  if (payingGuests <= 15) {
    basePrice = 180000;
    extraGuestsCost = 0;
  } else if (payingGuests < 30) {
    // Entre 16 y 29 personas: base 15 ($180.000) + $3.500 por adicional
    basePrice = 180000;
    extraGuestsCost = (payingGuests - 15) * 3500;
  } else {
    // 30 o más personas: Tramo 2 ($250.000 hasta 30 personas + $3.500 por cada adicional sobre 30)
    basePrice = 250000;
    extraGuestsCost = (payingGuests - 30) * 3500;
  }

  const bouncyCastleFee = hasBouncyCastle ? 5000 : 0;
  const totalAmount = basePrice + extraGuestsCost + bouncyCastleFee;
  const depositRequired = Math.round(totalAmount * 0.5);
  const remainingAtDoor = totalAmount - depositRequired;

  // Renderizado del calendario Stitch UI
  const renderCalendar = () => {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay(); // 0: Domingo
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const todayStr = new Date().toISOString().split('T')[0];

    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-2"></div>);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isPast = dateStr < todayStr;
      const isOccupied = occupiedDates.includes(dateStr);
      const isSelected = selectedDate === dateStr;
      const isSelectable = !isPast && !isOccupied;

      let cellClasses = "h-10 w-full flex items-center justify-center text-sm font-medium rounded-full transition-all cursor-pointer relative ";

      if (isPast) {
        cellClasses += "text-gray-300 cursor-not-allowed";
      } else if (isOccupied) {
        cellClasses += "bg-red-50 text-red-400 line-through cursor-not-allowed border border-dashed border-red-200";
      } else if (isSelected) {
        cellClasses += "bg-[#11d442] text-white shadow-md z-10 font-bold scale-105";
      } else {
        cellClasses += "text-gray-700 hover:bg-[#11d442]/10 hover:text-[#11d442]";
      }

      days.push(
        <div key={d} className="relative py-1 px-0.5">
          <button
            type="button"
            onClick={() => isSelectable && setSelectedDate(dateStr)}
            disabled={!isSelectable}
            className={cellClasses}
            title={isOccupied ? "Fecha no disponible (con reservas o eventos)" : undefined}
          >
            {d}
          </button>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={() => setCurrentCalendarDate(new Date(year, month - 1, 1))}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors cursor-pointer"
            aria-label="Mes anterior"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="font-bold text-gray-800 text-base">
            {monthNames[month]} {year}
          </span>
          <button
            type="button"
            onClick={() => setCurrentCalendarDate(new Date(year, month + 1, 1))}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors cursor-pointer"
            aria-label="Mes siguiente"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-gray-400 mb-2">
          <span>Do</span><span>Lu</span><span>Ma</span><span>Mi</span><span>Ju</span><span>Vi</span><span>Sá</span>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days}
        </div>

        <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#11d442]"></span>
            <span>Seleccionado</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-100 border border-red-300"></span>
            <span>Ocupado</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-gray-100"></span>
            <span>Disponible</span>
          </div>
        </div>
      </div>
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!selectedDate) {
      setErrorMessage('Por favor selecciona una fecha disponible en el calendario para tu evento.');
      return;
    }

    if (!organizerName.trim() || !organizerEmail.trim() || !organizerPhone.trim()) {
      setErrorMessage('Por favor completa todos tus datos de contacto obligatorios.');
      return;
    }

    if (!acceptedRules) {
      setErrorMessage('Debes aceptar las normas de uso del recinto y piscina para enviar tu cotización.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Verificación en el servidor de disponibilidad atómica
      const { data: availData, error: availError } = await supabase.rpc('check_full_venue_availability', {
        p_date: selectedDate
      });

      if (availError) throw availError;

      if (!availData?.available) {
        setErrorMessage(availData?.reason || 'La fecha seleccionada ya no se encuentra disponible.');
        setIsSubmitting(false);
        return;
      }

      // 2. Registro seguro de la cotización en Supabase
      const { data: quoteId, error: quoteError } = await supabase.rpc('create_public_event_quote', {
        p_event_date: selectedDate,
        p_start_time: `${startTime}:00`,
        p_end_time: `${endTime}:00`,
        p_organizer_name: organizerName.trim(),
        p_organizer_email: organizerEmail.trim(),
        p_organizer_phone: organizerPhone.trim(),
        p_organizer_rut: organizerRut.trim() || null,
        p_group_type: groupType,
        p_group_name: groupName.trim() || null,
        p_adults_count: adults,
        p_children_count: children,
        p_under_3_years_count: under3Years,
        p_has_bouncy_castle: hasBouncyCastle,
        p_extra_services_notes: extraNotes.trim() || null,
        p_base_price: basePrice,
        p_extra_guests_cost: extraGuestsCost,
        p_bouncy_castle_fee: bouncyCastleFee,
        p_total_amount: totalAmount,
        p_deposit_required: depositRequired
      });

      if (quoteError) throw quoteError;

      // 3. Disparar notificación por correo (acuse al cliente + alerta a administración)
      fetch('/api/send-event-quote-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'created', quoteId })
      }).catch(mailErr => console.warn('[VenueQuoteForm] Error en segundo plano enviando correos:', mailErr));

      setQuoteSuccess({
        id: quoteId,
        date: selectedDate,
        startTime,
        endTime,
        totalGuests,
        payingGuests,
        totalAmount,
        depositRequired,
        groupName: groupName.trim() || organizerName.trim()
      });
    } catch (err: any) {
      console.error('Error al registrar cotización:', err);
      setErrorMessage(err?.message || 'Ocurrió un error inesperado al procesar la solicitud. Por favor intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Pantalla de Confirmación de Cotización Exitosa
  if (quoteSuccess) {
    const whatsappMessage = encodeURIComponent(
      `¡Hola Rancho Carmelitas! Acabo de enviar mi solicitud de cotización para el Arriendo de Recinto Completo.\n\n` +
      `📋 *Folio de Cotización:* #${quoteSuccess.id.slice(0, 8).toUpperCase()}\n` +
      `📅 *Fecha:* ${quoteSuccess.date} (De ${quoteSuccess.startTime} a ${quoteSuccess.endTime} hrs)\n` +
      `👥 *Asistentes:* ${quoteSuccess.totalGuests} personas (${quoteSuccess.groupName})\n` +
      `💰 *Total Cotizado:* ${formatMoney(quoteSuccess.totalAmount)} (Abono 50%: ${formatMoney(quoteSuccess.depositRequired)})\n\n` +
      `Quedo atento a la confirmación de la administración para realizar el pago del abono. ¡Muchas gracias!`
    );

    return (
      <div className="bg-white rounded-3xl p-8 md:p-12 border border-gray-100 shadow-xl text-center max-w-2xl mx-auto">
        <div className="w-20 h-20 bg-green-100 text-[#11d442] rounded-full flex items-center justify-center mx-auto mb-6 text-4xl shadow-inner">
          ✓
        </div>

        <span className="text-xs font-bold uppercase tracking-widest text-[#11d442] bg-[#11d442]/10 px-3 py-1 rounded-full">
          Solicitud de Cotización Enviada
        </span>

        <h3 className="text-3xl font-bold text-gray-900 mt-4 mb-2">
          ¡Hemos recibido tu solicitud con éxito!
        </h3>

        <p className="text-gray-600 mb-6 text-sm">
          Folio de registro: <span className="font-mono font-bold text-gray-800">#{quoteSuccess.id.slice(0, 8).toUpperCase()}</span>
        </p>

        <div className="bg-gray-50 rounded-2xl p-6 text-left border border-gray-100 mb-6 space-y-3 text-sm">
          <div className="flex justify-between items-center py-1 border-b border-gray-200/60">
            <span className="text-gray-500">Fecha del Evento:</span>
            <span className="font-semibold text-gray-900">{quoteSuccess.date}</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-gray-200/60">
            <span className="text-gray-500">Horario de Uso:</span>
            <span className="font-semibold text-gray-900">{quoteSuccess.startTime} a {quoteSuccess.endTime} hrs (8 hrs continuas)</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-gray-200/60">
            <span className="text-gray-500">Total Asistentes:</span>
            <span className="font-semibold text-gray-900">{quoteSuccess.totalGuests} personas</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-gray-200/60">
            <span className="text-gray-500">Valor Total Cotizado:</span>
            <span className="font-bold text-gray-900 text-base">{formatMoney(quoteSuccess.totalAmount)}</span>
          </div>
          <div className="flex justify-between items-center py-1 text-[#11d442]">
            <span className="font-semibold">Abono Inicial Requerido (50%):</span>
            <span className="font-black text-lg">{formatMoney(quoteSuccess.depositRequired)}</span>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-xl p-4 text-left mb-8 space-y-1">
          <p className="font-bold flex items-center gap-1.5 text-amber-800">
            <span>ℹ️</span> ¿Qué sucede a continuación?
          </p>
          <p>
            1. Nuestro equipo revisará la disponibilidad y características de tu grupo en el panel de administración.
          </p>
          <p>
            2. Te contactaremos vía WhatsApp o correo con la aprobación formal y el enlace directo para pagar el 50% de abono oficial (vía Mercado Pago o Transferencia Bancaria).
          </p>
          <p>
            3. Al acreditarse el abono, el recinto completo quedará oficialmente bloqueado y reservado exclusivamente para tu celebración.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href={`https://wa.me/${adminWhatsapp}?text=${whatsappMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#25D366] text-white px-6 py-3.5 rounded-xl font-bold shadow-md hover:bg-[#20ba59] transition-colors"
          >
            <span>💬 Avisar por WhatsApp al Administrador</span>
          </a>
          <Link
            href="/"
            className="w-full sm:w-auto bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3.5 rounded-xl font-semibold transition-colors"
          >
            Volver al Inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 md:p-10 border border-gray-200 shadow-xl max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <span className="text-xs font-bold uppercase tracking-wider text-[#11d442] bg-[#11d442]/10 px-3 py-1 rounded-full">
          Cotizador en Línea
        </span>
        <h3 className="text-2xl md:text-3xl font-extrabold text-gray-900 mt-3">
          Cotiza tu Paseo o Evento de 8 Horas
        </h3>
        <p className="text-gray-500 text-sm max-w-xl mx-auto mt-2">
          Calcula en tiempo real según el número de asistentes y solicita tu fecha para uso exclusivo del recinto.
        </p>
      </div>

      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3">
          <span className="text-xl">⚠️</span>
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Columna Izquierda: Calendario y Horario */}
        <div className="lg:col-span-6 space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              1. Selecciona la Fecha del Evento <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-gray-500 mb-3">
              Las fechas tachadas en rojo ya cuentan con reservas o cierres de cabañas.
            </p>
            {isLoadingDates ? (
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-2xl border border-gray-200">
                <span className="text-sm text-gray-400">Verificando disponibilidad de fechas...</span>
              </div>
            ) : (
              renderCalendar()
            )}
            {selectedDate && (
              <div className="mt-3 p-3 bg-green-50 rounded-xl border border-green-200 text-sm text-green-800 flex items-center justify-between">
                <span>Fecha seleccionada:</span>
                <span className="font-bold">{selectedDate}</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              2. Horario de la Jornada (8 Horas continuas)
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Hora de Ingreso</label>
                <select
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#11d442]"
                >
                  <option value="09:00">09:00 hrs</option>
                  <option value="09:30">09:30 hrs</option>
                  <option value="10:00">10:00 hrs (Sugerido)</option>
                  <option value="10:30">10:30 hrs</option>
                  <option value="11:00">11:00 hrs</option>
                  <option value="11:30">11:30 hrs</option>
                  <option value="12:00">12:00 hrs (Tope 20:00)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">Hora de Salida (Máx. 20:00)</label>
                <div className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-bold text-gray-700 flex items-center justify-between">
                  <span>{endTime} hrs</span>
                  <span className="text-xs text-[#11d442] font-semibold bg-[#11d442]/10 px-2 py-0.5 rounded">8 horas</span>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              * Por normas de descanso y tranquilidad del entorno campestre, el evento finaliza a las 20:00 hrs como hora tope.
            </p>
          </div>
        </div>

        {/* Columna Derecha: Asistentes y Desglose Financiero */}
        <div className="lg:col-span-6 space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              3. Cantidad de Asistentes
            </label>
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-sm text-gray-800 block">Adultos</span>
                  <span className="text-xs text-gray-400">Coordinadores, profesores o apoderados</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setAdults(Math.max(1, adults - 1))}
                    className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center font-bold text-gray-600 hover:bg-gray-100"
                  >
                    -
                  </button>
                  <span className="font-bold text-gray-900 w-6 text-center">{adults}</span>
                  <button
                    type="button"
                    onClick={() => setAdults(adults + 1)}
                    className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center font-bold text-gray-600 hover:bg-gray-100"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-200/60">
                <div>
                  <span className="font-semibold text-sm text-gray-800 block">Niños (3 a 17 años)</span>
                  <span className="text-xs text-gray-400">Alumnos, cursos o familiares</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setChildren(Math.max(0, children - 1))}
                    className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center font-bold text-gray-600 hover:bg-gray-100"
                  >
                    -
                  </button>
                  <span className="font-bold text-gray-900 w-6 text-center">{children}</span>
                  <button
                    type="button"
                    onClick={() => setChildren(children + 1)}
                    className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center font-bold text-gray-600 hover:bg-gray-100"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-200/60">
                <div>
                  <span className="font-semibold text-sm text-gray-800 block">Bebés / Menores de 3 años</span>
                  <span className="text-xs text-green-600 font-semibold">¡No pagan ni suman a los tramos!</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setUnder3Years(Math.max(0, under3Years - 1))}
                    className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center font-bold text-gray-600 hover:bg-gray-100"
                  >
                    -
                  </button>
                  <span className="font-bold text-gray-900 w-6 text-center">{under3Years}</span>
                  <button
                    type="button"
                    onClick={() => setUnder3Years(under3Years + 1)}
                    className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center font-bold text-gray-600 hover:bg-gray-100"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Opcional Juegos Inflables */}
          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={hasBouncyCastle}
                onChange={(e) => setHasBouncyCastle(e.target.checked)}
                className="mt-1 w-5 h-5 rounded text-[#11d442] focus:ring-[#11d442] border-gray-300 cursor-pointer"
              />
              <div>
                <span className="font-bold text-sm text-gray-800 block">
                  ¿Traerán Juegos Inflables? (+$5.000)
                </span>
                <span className="text-xs text-gray-500">
                  Cubre el costo por consumo eléctrico extra de turbinas durante las 8 horas.
                </span>
              </div>
            </label>
          </div>

          {/* Tarjeta de Resumen Financiero en Vivo */}
          <div className="bg-[#11d442]/5 border-2 border-[#11d442]/20 rounded-2xl p-5 space-y-2">
            <h4 className="font-bold text-gray-900 text-sm uppercase tracking-wider mb-3">
              Desglose de Cotización
            </h4>

            <div className="flex justify-between text-xs text-gray-600">
              <span>Plan Base ({payingGuests <= 15 ? 'Hasta 15 personas' : payingGuests < 30 ? 'Base 15 personas' : 'Hasta 30 personas'}):</span>
              <span className="font-semibold">{formatMoney(basePrice)}</span>
            </div>

            {extraGuestsCost > 0 && (
              <div className="flex justify-between text-xs text-gray-600">
                <span>
                  Personas adicionales ({payingGuests < 30 ? payingGuests - 15 : payingGuests - 30} x $3.500):
                </span>
                <span className="font-semibold">{formatMoney(extraGuestsCost)}</span>
              </div>
            )}

            {hasBouncyCastle && (
              <div className="flex justify-between text-xs text-gray-600">
                <span>Recargo por Juego Inflable:</span>
                <span className="font-semibold">$5.000</span>
              </div>
            )}

            <div className="pt-2 border-t border-gray-200 flex justify-between items-baseline">
              <div>
                <span className="text-base font-black text-gray-900 block">Monto Total</span>
                <span className="text-[11px] text-gray-500">{totalGuests} personas en total</span>
              </div>
              <span className="text-2xl font-black text-[#11d442]">{formatMoney(totalAmount)}</span>
            </div>

            <div className="pt-2 border-t border-dashed border-gray-200 flex justify-between text-xs text-gray-700">
              <span className="font-semibold">Abono 50% para Reservar:</span>
              <span className="font-black text-gray-900">{formatMoney(depositRequired)}</span>
            </div>

            <div className="flex justify-between text-xs text-gray-500">
              <span>Saldo 50% restante (al ingresar):</span>
              <span>{formatMoney(remainingAtDoor)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Datos del Organizador y Formulario de Contacto */}
      <div className="mt-8 pt-8 border-t border-gray-200">
        <h4 className="text-lg font-bold text-gray-900 mb-4">
          4. Datos del Responsable del Grupo
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Nombre Completo de quien reserva <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={organizerName}
              onChange={(e) => setOrganizerName(e.target.value)}
              placeholder="Ej: Patricia Morales"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#11d442]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              RUT o Pasaporte
            </label>
            <input
              type="text"
              value={organizerRut}
              onChange={(e) => setOrganizerRut(formatRut(e.target.value))}
              placeholder="12.345.678-9"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#11d442]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Correo Electrónico <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              required
              value={organizerEmail}
              onChange={(e) => setOrganizerEmail(e.target.value)}
              placeholder="contacto@ejemplo.com"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#11d442]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Teléfono WhatsApp de Contacto <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              required
              value={organizerPhone}
              onChange={(e) => setOrganizerPhone(e.target.value)}
              placeholder="+56 9 1234 5678"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#11d442]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Tipo de Grupo / Evento
            </label>
            <select
              value={groupType}
              onChange={(e) => setGroupType(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#11d442]"
            >
              <option value="paseo_curso">Paseo de Curso / Colegio</option>
              <option value="adulto_mayor">Club de Adulto Mayor</option>
              <option value="familiar">Encuentro Familiar / Cumpleaños</option>
              <option value="empresa">Jornada Corporativa / Empresa</option>
              <option value="otro">Otro</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Nombre de la Institución o Grupo
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Ej: Colegio San José (4to Medio B)"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#11d442]"
            />
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Comentarios o requerimientos adicionales (Opcional)
          </label>
          <textarea
            rows={2}
            value={extraNotes}
            onChange={(e) => setExtraNotes(e.target.value)}
            placeholder="¿Traerán carritos de comida, animación o requieren alguna consulta sobre el quincho?"
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#11d442]"
          />
        </div>

        {/* Aceptación de Normas y Políticas Oficiales */}
        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 mb-6 space-y-2 text-xs text-gray-600">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              required
              checked={acceptedRules}
              onChange={(e) => setAcceptedRules(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-[#11d442] focus:ring-[#11d442] border-gray-300 cursor-pointer"
            />
            <span>
              He leído y acepto las condiciones de arriendo de recinto: horario hasta las 20:00 hrs, no se permiten mascotas, política de cancelación con devolución total hasta 5 días antes y el{' '}
              <Link href="/reglamento" target="_blank" className="text-[#11d442] font-semibold underline">
                Reglamento General de Piscina y Convivencia
              </Link>.
            </span>
          </label>
        </div>

        <div className="text-center">
          <Button
            type="submit"
            disabled={isSubmitting || !selectedDate}
            className="w-full sm:w-auto px-10 py-4 text-base font-bold btn-primary"
          >
            {isSubmitting ? 'Enviando Solicitud...' : 'Solicitar Cotización de Recinto Exclusivo'}
          </Button>
          <p className="text-xs text-gray-400 mt-2">
            * Al enviar la cotización, nuestro equipo verificará la fecha y te remitirá el enlace oficial para abonar el 50% de reserva.
          </p>
        </div>
      </div>
    </form>
  );
}
