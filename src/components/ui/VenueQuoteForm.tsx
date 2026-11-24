'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import {
  DEFAULT_MIN_ADVANCE_DAYS,
  formatLocalDateStr,
  getMinAllowedDateStr,
} from '@/lib/booking-rules';

export interface VenuePricingTier {
  id: string;
  name: string;
  min_guests: number;
  max_guests: number;
  base_price: number;
  included_guests?: number;
  extra_guest_fee?: number;
}

export interface VenueQuoteFormProps {
  initialTiers?: VenuePricingTier[];
  initialBouncyCastleFee?: number;
  initialDepositPercentage?: number;
  initialMaxCapacity?: number;
  initialWhatsapp?: string;
  initialMinAdvanceBookingDays?: number;
}

const DEFAULT_VENUE_TIERS: VenuePricingTier[] = [
  { id: 'tier-1', name: 'Paseo Estándar (hasta 20 personas)', min_guests: 1, max_guests: 20, base_price: 190000, included_guests: 20, extra_guest_fee: 0 },
  { id: 'tier-2', name: 'Paseo Mediano (21 a 40 personas)', min_guests: 21, max_guests: 40, base_price: 250000, included_guests: 40, extra_guest_fee: 0 },
  { id: 'tier-3', name: 'Paseo Grande (41 a 70 personas)', min_guests: 41, max_guests: 70, base_price: 350000, included_guests: 70, extra_guest_fee: 0 }
];

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

export function VenueQuoteForm({
  initialTiers,
  initialBouncyCastleFee,
  initialDepositPercentage,
  initialMaxCapacity,
  initialWhatsapp,
  initialMinAdvanceBookingDays,
}: VenueQuoteFormProps = {}) {
  // Parámetros dinámicos desde settings (inicializados desde props SSR para carga 100% inmediata)
  const [pricingTiers, setPricingTiers] = useState<VenuePricingTier[]>(
    initialTiers && initialTiers.length > 0 ? initialTiers : DEFAULT_VENUE_TIERS
  );
  const [bouncyCastleFee, setBouncyCastleFee] = useState<number>(
    initialBouncyCastleFee !== undefined ? initialBouncyCastleFee : 5000
  );
  const [depositPercentage, setDepositPercentage] = useState<number>(
    initialDepositPercentage !== undefined ? initialDepositPercentage : 50
  );
  const [maxCapacity, setMaxCapacity] = useState<number>(
    initialMaxCapacity !== undefined ? initialMaxCapacity : 70
  );
  const [adminWhatsapp, setAdminWhatsapp] = useState<string>(
    initialWhatsapp || '56994168853'
  );
  const [minAdvanceBookingDays, setMinAdvanceBookingDays] = useState<number>(
    initialMinAdvanceBookingDays !== undefined ? initialMinAdvanceBookingDays : DEFAULT_MIN_ADVANCE_DAYS
  );

  // Selección de fecha y horario
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [startTime, setStartTime] = useState('10:00');
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  const [occupiedDates, setOccupiedDates] = useState<string[]>([]);
  const [isLoadingDates, setIsLoadingDates] = useState(true);

  // Asistentes (inicializado dinámicamente con la base del primer tramo)
  const [adults, setAdults] = useState(() => {
    const tiers = initialTiers && initialTiers.length > 0 ? initialTiers : DEFAULT_VENUE_TIERS;
    return tiers[0]?.included_guests || 15;
  });
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

  // Sincronización reactiva con props SSR
  useEffect(() => {
    if (initialTiers && initialTiers.length > 0) {
      setPricingTiers(initialTiers);
    }
  }, [initialTiers]);

  useEffect(() => {
    if (initialBouncyCastleFee !== undefined) setBouncyCastleFee(initialBouncyCastleFee);
  }, [initialBouncyCastleFee]);

  useEffect(() => {
    if (initialDepositPercentage !== undefined) setDepositPercentage(initialDepositPercentage);
  }, [initialDepositPercentage]);

  useEffect(() => {
    if (initialMaxCapacity !== undefined) setMaxCapacity(initialMaxCapacity);
  }, [initialMaxCapacity]);

  useEffect(() => {
    if (initialWhatsapp) setAdminWhatsapp(initialWhatsapp);
  }, [initialWhatsapp]);

  // Cargar fechas ocupadas y configuración dinámica al montar
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
        console.warn('[VenueQuoteForm] Error al cargar fechas ocupadas de recinto:', err);
      } finally {
        setIsLoadingDates(false);
      }
    }

    async function loadVenueSettings() {
      try {
        const { data, error } = await supabase
          .from('settings')
          .select('key, value')
          .in('key', [
            'venue_pricing_tiers',
            'venue_bouncy_castle_fee',
            'venue_deposit_percentage',
            'venue_max_capacity',
            'whatsapp_number',
            'min_advance_booking_days'
          ]);

        if (!error && data) {
          const map: Record<string, string> = {};
          data.forEach((item: { key: string; value: string }) => {
            map[item.key] = item.value;
          });

          if (map['venue_pricing_tiers']) {
            try {
              const parsed = JSON.parse(map['venue_pricing_tiers']);
              if (Array.isArray(parsed) && parsed.length > 0) {
                setPricingTiers(parsed);
              }
            } catch (e) {
              console.warn('[VenueQuoteForm] Error parseando venue_pricing_tiers de settings, usando fallback:', e);
            }
          }

          if (map['venue_bouncy_castle_fee']) {
            const val = Number(map['venue_bouncy_castle_fee']);
            if (!isNaN(val) && val >= 0) setBouncyCastleFee(val);
          }

          if (map['venue_deposit_percentage']) {
            const val = Number(map['venue_deposit_percentage']);
            if (!isNaN(val) && val >= 10 && val <= 100) setDepositPercentage(val);
          }

          if (map['venue_max_capacity']) {
            const val = Number(map['venue_max_capacity']);
            if (!isNaN(val) && val >= 10) setMaxCapacity(val);
          }

          if (map['whatsapp_number']) {
            const clean = map['whatsapp_number'].replace(/[^0-9]/g, '');
            if (clean) setAdminWhatsapp(clean);
          }

          if (map['min_advance_booking_days']) {
            const val = parseInt(map['min_advance_booking_days'], 10);
            if (!isNaN(val) && val >= 0) setMinAdvanceBookingDays(val);
          }
        }
      } catch (err) {
        console.warn('[VenueQuoteForm] Error cargando settings de recinto:', err);
      }
    }

    loadOccupiedDates();
    loadVenueSettings();
  }, []);

  // Calcular hora de término (8 horas continuas)
  const calculateEndTime = (startStr: string) => {
    const [h, m] = startStr.split(':').map(Number);
    const endH = h + 8;
    return `${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };
  const endTime = calculateEndTime(startTime);

  // Motor financiero dinámico según tramos configurados
  const payingGuests = Math.max(1, adults + children); // Asistentes que pagan (mayores de 3 años)
  const totalGuests = payingGuests + under3Years;
  const isOverCapacity = totalGuests > maxCapacity;

  // Ordenar tramos ascendentemente por min_guests
  const sortedTiers = useMemo(() => {
    return [...pricingTiers].sort((a, b) => a.min_guests - b.min_guests);
  }, [pricingTiers]);

  // Tramo coincidente
  const currentTier = useMemo(() => {
    if (sortedTiers.length === 0) return DEFAULT_VENUE_TIERS[0];
    const matched = sortedTiers.find(t => payingGuests >= t.min_guests && payingGuests <= t.max_guests);
    if (matched) return matched;
    if (payingGuests < sortedTiers[0].min_guests) return sortedTiers[0];
    return sortedTiers[sortedTiers.length - 1];
  }, [sortedTiers, payingGuests]);

  const basePrice = currentTier ? currentTier.base_price : 190000;
  const activeBouncyCastleFee = hasBouncyCastle ? bouncyCastleFee : 0;
  const totalAmount = basePrice + activeBouncyCastleFee;
  const depositRequired = Math.round(totalAmount * (depositPercentage / 100));
  const remainingAtDoor = totalAmount - depositRequired;

  // Selección rápida de tramo al hacer clic en tarjeta
  const handleSelectTier = (tier: VenuePricingTier) => {
    if (payingGuests < tier.min_guests || payingGuests > tier.max_guests) {
      setAdults(tier.min_guests);
      setChildren(0);
    }
  };

  // Renderizado del calendario Stitch UI
  const renderCalendar = () => {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay(); // 0: Domingo
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const todayStr = formatLocalDateStr(new Date());
    const minAllowedDateStr = getMinAllowedDateStr(minAdvanceBookingDays);

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
      const isTooSoon = !isPast && dateStr < minAllowedDateStr;
      const isOccupied = occupiedDates.includes(dateStr);
      const isSelected = selectedDate === dateStr;
      const isSelectable = !isPast && !isTooSoon && !isOccupied;

      let cellClasses = "h-10 w-full flex items-center justify-center text-sm font-medium rounded-full transition-all cursor-pointer relative ";

      if (isPast || isTooSoon) {
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
            title={
              isOccupied
                ? "Fecha no disponible (con reservas o eventos)"
                : isTooSoon
                ? `Requiere al menos ${minAdvanceBookingDays} ${minAdvanceBookingDays === 1 ? 'día' : 'días'} de anticipación`
                : undefined
            }
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

    if (isOverCapacity) {
      setErrorMessage(`El número total de asistentes (${totalGuests}) supera el aforo máximo permitido (${maxCapacity} personas). Por favor contáctanos vía WhatsApp para eventos masivos.`);
      return;
    }

    if (!selectedDate) {
      setErrorMessage('Por favor selecciona una fecha disponible en el calendario para tu evento.');
      return;
    }

    const minAllowedDateStr = getMinAllowedDateStr(minAdvanceBookingDays);
    if (selectedDate < minAllowedDateStr) {
      setErrorMessage(
        `Las reservas de recinto requieren al menos ${minAdvanceBookingDays} ${
          minAdvanceBookingDays === 1 ? 'día' : 'días'
        } de anticipación.`
      );
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

      // 2. Registro seguro de la cotización en Supabase (validación Zero-Trust autoritativa en BD)
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
        p_extra_guests_cost: 0,
        p_bouncy_castle_fee: activeBouncyCastleFee,
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
        tierName: currentTier.name,
        totalAmount,
        depositRequired,
        depositPercentage,
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
      `🏷️ *Plan:* ${quoteSuccess.tierName}\n` +
      `👥 *Asistentes:* ${quoteSuccess.totalGuests} personas (${quoteSuccess.groupName})\n` +
      `💰 *Total Cotizado:* ${formatMoney(quoteSuccess.totalAmount)} (Abono ${quoteSuccess.depositPercentage}%: ${formatMoney(quoteSuccess.depositRequired)})\n\n` +
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
            <span className="text-gray-500">Tramo / Plan:</span>
            <span className="font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded text-xs">{quoteSuccess.tierName}</span>
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
            <span className="font-semibold">Abono Inicial Requerido ({quoteSuccess.depositPercentage}%):</span>
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
            2. Te contactaremos vía WhatsApp o correo con la confirmación formal y el enlace para abonar el {quoteSuccess.depositPercentage}% requerido.
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
    <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 md:p-10 border border-gray-200 shadow-xl max-w-5xl mx-auto">
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

      {/* ======================================================== */}
      {/* PASO 1 (ANCHO COMPLETO): SELECCIÓN VISUAL DE PLANES     */}
      {/* ======================================================== */}
      <div className="mb-10 pb-8 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <label className="block text-base font-bold text-gray-900">
              1. Selecciona tu Plan o Rango de Asistentes
            </label>
            <p className="text-xs text-gray-500 mt-0.5">
              Elige el plan que mejor se adapte a tu grupo o ajusta el número exacto de asistentes más abajo.
            </p>
          </div>
          <div className="self-start sm:self-auto">
            <span className={`text-xs font-bold px-3 py-1 rounded-full border shadow-2xs ${
              isOverCapacity 
                ? 'bg-red-100 text-red-800 border-red-200' 
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}>
              Aforo Total: {totalGuests} / {maxCapacity} pers.
            </span>
          </div>
        </div>

        {/* Tarjetas de Planes a Ancho Completo */}
        <div className={`grid grid-cols-1 ${
          sortedTiers.length === 2 ? 'md:grid-cols-2' : 
          sortedTiers.length >= 3 ? 'md:grid-cols-3' : ''
        } gap-4`}>
          {sortedTiers.map((tier) => {
            const isSelected = currentTier?.id === tier.id && !isOverCapacity;
            return (
              <div
                key={tier.id}
                onClick={() => handleSelectTier(tier)}
                className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                  isSelected 
                    ? 'border-[#11d442] bg-emerald-50/40 shadow-md ring-2 ring-[#11d442]/30 scale-[1.01]' 
                    : 'border-gray-200 bg-white hover:border-emerald-300 hover:bg-gray-50/70 hover:shadow-xs'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-extrabold text-sm md:text-base text-gray-900 leading-snug">
                      {tier.name}
                    </h4>
                    {isSelected ? (
                      <span className="shrink-0 text-[11px] font-bold bg-[#11d442] text-white px-2.5 py-0.5 rounded-full shadow-2xs">
                        ✓ Activo
                      </span>
                    ) : (
                      <span className="shrink-0 text-[11px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                        Plan
                      </span>
                    )}
                  </div>

                  <div className="flex items-baseline gap-1.5 my-2">
                    <span className="text-2xl md:text-3xl font-black text-gray-900">
                      {formatMoney(tier.base_price)}
                    </span>
                    <span className="text-xs font-semibold text-gray-500">
                      Tarifa Fija (8 hrs)
                    </span>
                  </div>

                  <p className="text-xs text-gray-700 bg-gray-50 rounded-lg p-2 border border-gray-100 mt-2">
                    Cubre de <strong>{tier.min_guests} a {tier.max_guests} personas</strong> con uso exclusivo de instalaciones.
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 space-y-1.5 text-xs text-gray-600">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Rango de aforo:</span>
                    <span className="font-bold text-gray-800">{tier.min_guests} a {tier.max_guests} pers.</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">Adicionales:</span>
                    <span className="font-semibold text-emerald-700">Coordinar con administración</span>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      className={`w-full py-1.5 px-3 rounded-xl text-xs font-bold transition-colors ${
                        isSelected
                          ? 'bg-[#11d442] text-white shadow-xs'
                          : 'bg-gray-100 text-gray-700 hover:bg-emerald-100 hover:text-emerald-800'
                      }`}
                    >
                      {isSelected ? '✓ Plan Seleccionado' : 'Elegir este Plan'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ======================================================== */}
      {/* GRID DE 2 COLUMNAS: FECHA/HORARIO VS ASISTENTES/TOTAL    */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Columna Izquierda: Calendario y Horario */}
        <div className="lg:col-span-6 space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              2. Selecciona la Fecha del Evento <span className="text-red-500">*</span>
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
              3. Horario de la Jornada (8 Horas continuas)
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
              4. Especifica los Asistentes de tu Grupo
            </label>

            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 space-y-4">
              <div className="flex items-center justify-between pb-1 border-b border-gray-200/50">
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Detalle de participantes:
                </span>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                  {payingGuests} personas pagan tarifa
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-sm text-gray-800 block">Adultos</span>
                  <span className="text-xs text-gray-400">Coordinadores, profesores o apoderados</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setAdults(Math.max(1, adults - 1))}
                    className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center font-bold text-gray-600 hover:bg-gray-100 cursor-pointer"
                  >
                    -
                  </button>
                  <span className="font-bold text-gray-900 w-6 text-center">{adults}</span>
                  <button
                    type="button"
                    onClick={() => setAdults(adults + 1)}
                    className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center font-bold text-gray-600 hover:bg-gray-100 cursor-pointer"
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
                    className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center font-bold text-gray-600 hover:bg-gray-100 cursor-pointer"
                  >
                    -
                  </button>
                  <span className="font-bold text-gray-900 w-6 text-center">{children}</span>
                  <button
                    type="button"
                    onClick={() => setChildren(children + 1)}
                    className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center font-bold text-gray-600 hover:bg-gray-100 cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-200/60">
                <div>
                  <span className="font-semibold text-sm text-gray-800 block">Bebés / Menores de 3 años</span>
                  <span className="text-xs text-green-600 font-semibold">¡No pagan tarifa en los tramos!</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setUnder3Years(Math.max(0, under3Years - 1))}
                    className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center font-bold text-gray-600 hover:bg-gray-100 cursor-pointer"
                  >
                    -
                  </button>
                  <span className="font-bold text-gray-900 w-6 text-center">{under3Years}</span>
                  <button
                    type="button"
                    onClick={() => setUnder3Years(under3Years + 1)}
                    className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center font-bold text-gray-600 hover:bg-gray-100 cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Alerta de Aforo Máximo Excedido */}
          {isOverCapacity && (
            <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl text-amber-900 space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-2xl">⚠️</span>
                <div>
                  <h5 className="font-bold text-sm">
                    Aforo Máximo Superado ({totalGuests} de {maxCapacity} personas)
                  </h5>
                  <p className="text-xs text-amber-800 mt-1">
                    El aforo estándar configurado para el recinto es de <strong>{maxCapacity} personas</strong>. Para grupos masivos o requerimientos corporativos especiales que superen este aforo, contáctanos directamente a través de WhatsApp para coordinar una propuesta a tu medida.
                  </p>
                </div>
              </div>
              <a
                href={`https://wa.me/${adminWhatsapp}?text=${encodeURIComponent(
                  `¡Hola Rancho Carmelitas! Quisiera consultar por un evento especial para un grupo de ${totalGuests} personas (${adults} adultos, ${children} niños y ${under3Years} menores de 3 años). ¿Tienen disponibilidad y opciones para este aforo?`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba59] text-white px-4 py-3 rounded-xl font-bold text-xs transition-colors shadow-sm"
              >
                <span>💬 Consultar Evento Masivo ({totalGuests} personas) por WhatsApp</span>
              </a>
            </div>
          )}

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
                  ¿Traerán Juegos Inflables? (+{formatMoney(bouncyCastleFee)})
                </span>
                <span className="text-xs text-gray-500">
                  Cubre el costo por consumo eléctrico extra de turbinas durante las 8 horas.
                </span>
              </div>
            </label>
          </div>

          {/* Tarjeta de Resumen Financiero en Vivo */}
          <div className="bg-[#11d442]/5 border-2 border-[#11d442]/20 rounded-2xl p-5 space-y-2">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-gray-900 text-sm uppercase tracking-wider">
                Desglose de Cotización
              </h4>
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                {currentTier.name}
              </span>
            </div>

            <div className="flex justify-between text-xs text-gray-600">
              <span>Tarifa del Plan ({currentTier.min_guests} a {currentTier.max_guests} pers.):</span>
              <span className="font-semibold">{formatMoney(basePrice)}</span>
            </div>

            {hasBouncyCastle && (
              <div className="flex justify-between text-xs text-gray-600">
                <span>Recargo por Juego Inflable:</span>
                <span className="font-semibold">{formatMoney(bouncyCastleFee)}</span>
              </div>
            )}

            <div className="pt-2 border-t border-gray-200 flex justify-between items-baseline">
              <div>
                <span className="text-base font-black text-gray-900 block">Monto Total</span>
                <span className="text-[11px] text-gray-500">
                  {totalGuests} persona{totalGuests > 1 ? 's' : ''} en total ({payingGuests} que pagan + {under3Years} menores de 3 años)
                </span>
              </div>
              <span className="text-2xl font-black text-[#11d442]">{formatMoney(totalAmount)}</span>
            </div>

            <div className="pt-2 border-t border-dashed border-gray-200 flex justify-between text-xs text-gray-700">
              <span className="font-semibold">Abono {depositPercentage}% para Reservar:</span>
              <span className="font-black text-gray-900">{formatMoney(depositRequired)}</span>
            </div>

            <div className="flex justify-between text-xs text-gray-500">
              <span>Saldo {100 - depositPercentage}% restante (al ingresar):</span>
              <span>{formatMoney(remainingAtDoor)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* PASO 5 (ANCHO COMPLETO): DATOS DEL RESPONSABLE Y ENVÍO   */}
      {/* ======================================================== */}
      <div className="mt-10 pt-8 border-t border-gray-200">
        <h4 className="text-lg font-bold text-gray-900 mb-4">
          5. Datos del Responsable del Grupo
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
            rows={3}
            value={extraNotes}
            onChange={(e) => setExtraNotes(e.target.value)}
            placeholder="¿Tienen personas adicionales por coordinar con administración?, ¿traerán carritos de comida, animación o alguna consulta sobre el quincho?"
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
            disabled={isSubmitting || !selectedDate || isOverCapacity}
            className={`w-full sm:w-auto px-10 py-4 text-base font-bold ${
              isOverCapacity 
                ? 'opacity-50 cursor-not-allowed bg-gray-400 hover:bg-gray-400' 
                : 'btn-primary'
            }`}
          >
            {isSubmitting 
              ? 'Enviando Solicitud...' 
              : isOverCapacity 
                ? `Aforo Máximo Superado (${totalGuests}/${maxCapacity} pers.)` 
                : 'Solicitar Cotización de Recinto Exclusivo'}
          </Button>
          <p className="text-xs text-gray-400 mt-2">
            * Al enviar la cotización, nuestro equipo verificará la fecha y te remitirá el enlace oficial para abonar el {depositPercentage}% de reserva.
          </p>
        </div>
      </div>
    </form>
  );
}
