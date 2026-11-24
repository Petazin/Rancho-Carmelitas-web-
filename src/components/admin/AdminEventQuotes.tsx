'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const formatMoney = (amount: number | undefined | null) => {
  if (amount === undefined || amount === null) return '$0';
  const formatted = new Intl.NumberFormat('es-CL', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
  return `$${formatted}`;
};

interface AdminEventQuotesProps {
  highlightId?: string;
}

export function AdminEventQuotes({ highlightId }: AdminEventQuotesProps = {}) {
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [cabins, setCabins] = useState<any[]>([]);

  // Modal de Pago Manual
  const [selectedQuoteForPayment, setSelectedQuoteForPayment] = useState<any | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('Transferencia');
  const [paymentReference, setPaymentReference] = useState<string>('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Modal de Cabaña de Apoyo (Excepción)
  const [selectedQuoteForCabin, setSelectedQuoteForCabin] = useState<any | null>(null);
  const [supportCabinId, setSupportCabinId] = useState<string>('');
  const [supportCabinFee, setSupportCabinFee] = useState<string>('0');
  const [isSavingCabin, setIsSavingCabin] = useState(false);

  // Modal de Edición Integral de Cotización / Reserva de Evento
  const [selectedQuoteForEdit, setSelectedQuoteForEdit] = useState<any | null>(null);
  const [editQuoteForm, setEditQuoteForm] = useState({
    event_date: '',
    start_time: '10:00',
    end_time: '18:00',
    organizer_name: '',
    organizer_email: '',
    organizer_phone: '',
    organizer_rut: '',
    group_name: '',
    group_type: 'paseo_curso',
    adults_count: 15,
    children_count: 0,
    under_3_years_count: 0,
    has_bouncy_castle: false,
    total_amount: 180000,
    deposit_required: 90000,
    deposit_paid: 0,
    status: 'Cotizacion_Pendiente',
    payment_method: 'Transferencia',
    payment_reference: '',
    admin_notes: '',
    includes_support_cabin: false,
    support_cabin_id: '',
    support_cabin_extra_fee: 0
  });
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [venuePricingTiers, setVenuePricingTiers] = useState<any[]>([]);
  const [occupiedVenueDates, setOccupiedVenueDates] = useState<string[]>([]);

  // Historial de pagos separados y operaciones de Check-in / Finalizado
  const [eventPaymentsMap, setEventPaymentsMap] = useState<Record<string, any[]>>({});
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [selectedQuoteForCheckIn, setSelectedQuoteForCheckIn] = useState<any | null>(null);
  const [checkInExceptionNote, setCheckInExceptionNote] = useState<string>('');
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [selectedQuoteForCheckOut, setSelectedQuoteForCheckOut] = useState<any | null>(null);
  const [checkOutNotes, setCheckOutNotes] = useState<string>('');
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const fetchQuotes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('event_quotes')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setQuotes(data);
      }

      // Cargar historial de pagos separado (resiliente si aún no se ejecuta la migración)
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('event_payments')
        .select('*')
        .order('created_at', { ascending: true });

      if (!paymentsError && paymentsData) {
        const grouped: Record<string, any[]> = {};
        for (const p of paymentsData) {
          if (!grouped[p.event_quote_id]) grouped[p.event_quote_id] = [];
          grouped[p.event_quote_id].push(p);
        }
        setEventPaymentsMap(grouped);
      }
    } catch (err) {
      console.error('Error al cargar cotizaciones de eventos:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCabins = async () => {
    try {
      const { data } = await supabase.from('cabins').select('id, name');
      if (data) setCabins(data);
    } catch (err) {
      console.warn('Error al cargar cabañas:', err);
    }
  };

  const fetchSettingsAndOccupancy = async () => {
    try {
      const { data: tiersData } = await supabase.from('settings').select('value').eq('key', 'venue_pricing_tiers').maybeSingle();
      if (tiersData?.value) {
        setVenuePricingTiers(JSON.parse(tiersData.value));
      }
      const { data: occData } = await supabase.rpc('get_occupied_venue_dates');
      if (occData) {
        setOccupiedVenueDates(occData.map((d: any) => d.occupied_date));
      }
    } catch (e) {
      console.warn('Error cargando configuración:', e);
    }
  };

  useEffect(() => {
    fetchQuotes();
    fetchCabins();
    fetchSettingsAndOccupancy();
  }, []);

  const handleOpenEdit = (quote: any) => {
    setSelectedQuoteForEdit(quote);
    setEditQuoteForm({
      event_date: quote.event_date || '',
      start_time: quote.start_time?.slice(0, 5) || '10:00',
      end_time: quote.end_time?.slice(0, 5) || '18:00',
      organizer_name: quote.organizer_name || '',
      organizer_email: quote.organizer_email || '',
      organizer_phone: quote.organizer_phone || '',
      organizer_rut: quote.organizer_rut || '',
      group_name: quote.group_name || '',
      group_type: quote.group_type || 'paseo_curso',
      adults_count: Number(quote.adults_count) || 15,
      children_count: Number(quote.children_count) || 0,
      under_3_years_count: Number(quote.under_3_years_count) || 0,
      has_bouncy_castle: !!quote.has_bouncy_castle,
      total_amount: Number(quote.total_amount) || 180000,
      deposit_required: Number(quote.deposit_required) || 90000,
      deposit_paid: Number(quote.deposit_paid) || 0,
      status: quote.status || 'Cotizacion_Pendiente',
      payment_method: quote.payment_method || 'Transferencia',
      payment_reference: quote.payment_reference || '',
      admin_notes: quote.admin_notes || '',
      includes_support_cabin: !!quote.includes_support_cabin,
      support_cabin_id: quote.support_cabin_id || '',
      support_cabin_extra_fee: Number(quote.support_cabin_extra_fee) || 0
    });
  };

  const handleRecalculateEditPrice = () => {
    const payingGuests = Math.max(1, (Number(editQuoteForm.adults_count) || 0) + (Number(editQuoteForm.children_count) || 0));
    const tiers = venuePricingTiers.length > 0 ? venuePricingTiers : [
      { min_guests: 1, max_guests: 20, base_price: 190000 },
      { min_guests: 21, max_guests: 40, base_price: 250000 },
      { min_guests: 41, max_guests: 70, base_price: 350000 }
    ];
    let matched = tiers.find((t: any) => payingGuests >= t.min_guests && payingGuests <= t.max_guests);
    if (!matched && tiers.length > 0) matched = tiers[tiers.length - 1];
    const base = matched ? Number(matched.base_price) || 190000 : 190000;
    const bouncy = editQuoteForm.has_bouncy_castle ? 5000 : 0;
    const support = editQuoteForm.includes_support_cabin ? (Number(editQuoteForm.support_cabin_extra_fee) || 0) : 0;
    const total = base + bouncy + support;
    const deposit = Math.round(total * 0.5);
    setEditQuoteForm(prev => ({
      ...prev,
      total_amount: total,
      deposit_required: deposit
    }));
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuoteForEdit) return;

    if (!editQuoteForm.organizer_name || !editQuoteForm.organizer_email || !editQuoteForm.organizer_phone || !editQuoteForm.event_date) {
      alert('Por favor completa todos los campos obligatorios (*).');
      return;
    }

    setIsSavingEdit(true);
    try {
      const payingGuests = Math.max(1, (Number(editQuoteForm.adults_count) || 0) + (Number(editQuoteForm.children_count) || 0));
      const totalGuests = payingGuests + (Number(editQuoteForm.under_3_years_count) || 0);

      const updateData: any = {
        event_date: editQuoteForm.event_date,
        start_time: editQuoteForm.start_time,
        end_time: editQuoteForm.end_time,
        organizer_name: editQuoteForm.organizer_name.trim(),
        organizer_email: editQuoteForm.organizer_email.trim(),
        organizer_phone: editQuoteForm.organizer_phone.trim(),
        organizer_rut: editQuoteForm.organizer_rut.trim() || null,
        group_name: editQuoteForm.group_name.trim() || null,
        group_type: editQuoteForm.group_type,
        adults_count: Number(editQuoteForm.adults_count) || 1,
        children_count: Number(editQuoteForm.children_count) || 0,
        under_3_years_count: Number(editQuoteForm.under_3_years_count) || 0,
        total_guests: totalGuests,
        has_bouncy_castle: editQuoteForm.has_bouncy_castle,
        total_amount: Number(editQuoteForm.total_amount) || 0,
        deposit_required: Number(editQuoteForm.deposit_required) || 0,
        deposit_paid: Number(editQuoteForm.deposit_paid) || 0,
        status: editQuoteForm.status,
        payment_method: editQuoteForm.payment_method || null,
        payment_reference: editQuoteForm.payment_reference.trim() || null,
        admin_notes: editQuoteForm.admin_notes.trim() || null,
        includes_support_cabin: editQuoteForm.includes_support_cabin,
        support_cabin_id: editQuoteForm.support_cabin_id || null,
        support_cabin_extra_fee: Number(editQuoteForm.support_cabin_extra_fee) || 0
      };

      // Si el evento está Confirmada, sincronizar closure en cabin_closures
      if (editQuoteForm.status === 'Confirmada') {
        const closureReason = `Evento Exclusivo Recinto: ${editQuoteForm.group_name || editQuoteForm.organizer_name}`;
        if (selectedQuoteForEdit.associated_closure_id) {
          await supabase
            .from('cabin_closures')
            .update({
              start_date: editQuoteForm.event_date,
              end_date: editQuoteForm.event_date,
              reason: closureReason
            })
            .eq('id', selectedQuoteForEdit.associated_closure_id);
        } else {
          const { data: newClosure } = await supabase
            .from('cabin_closures')
            .insert({
              cabin_id: null,
              start_date: editQuoteForm.event_date,
              end_date: editQuoteForm.event_date,
              reason: closureReason
            })
            .select('id')
            .single();
          if (newClosure) {
            updateData.associated_closure_id = newClosure.id;
          }
        }
      }

      // Si cambió de Confirmada a Cancelada/Rechazada, liberar closure si existía
      if (['Cancelada', 'Rechazada'].includes(editQuoteForm.status) && selectedQuoteForEdit.associated_closure_id) {
        await supabase
          .from('cabin_closures')
          .delete()
          .eq('id', selectedQuoteForEdit.associated_closure_id);
        updateData.associated_closure_id = null;
      }

      const { error } = await supabase
        .from('event_quotes')
        .update(updateData)
        .eq('id', selectedQuoteForEdit.id);

      if (error) throw error;

      alert('✓ Evento / cotización de recinto actualizado exitosamente.');
      setSelectedQuoteForEdit(null);
      fetchQuotes();
    } catch (err: any) {
      alert(`Error al actualizar evento: ${err?.message || 'Error desconocido'}`);
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Aprobar Cotización
  const handleApproveQuote = async (quote: any) => {
    if (!confirm(`¿Deseas aprobar la cotización para "${quote.organizer_name}" (${quote.event_date})? Esto habilitará el pago del 50% de abono.`)) {
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const adminEmail = user?.email || 'Administración';

      const { error } = await supabase
        .from('event_quotes')
        .update({
          status: 'Aprobada',
          approved_by: adminEmail,
          approved_at: new Date().toISOString()
        })
        .eq('id', quote.id);

      if (error) throw error;

      // Disparar correo de aprobación con enlace de pago al cliente
      fetch('/api/send-event-quote-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approved', quoteId: quote.id })
      }).catch(mailErr => console.warn('[AdminEventQuotes] Error enviando correo de aprobación:', mailErr));

      alert('✓ Cotización aprobada exitosamente. Se ha enviado el enlace de pago oficial al correo del cliente.');
      fetchQuotes();
    } catch (err: any) {
      alert(`Error al aprobar cotización: ${err?.message || 'Error desconocido'}`);
    }
  };

  // Cancelar o Rechazar Cotización
  const handleCancelQuote = async (quote: any) => {
    const isConfirmed = quote.status === 'Confirmada';
    const warning = isConfirmed
      ? '¡ATENCIÓN! Este evento está CONFIRMADO. Si lo cancelas, se eliminará el bloqueo de todas las cabañas y volverán a estar disponibles para el público.\n\n¿Estás seguro de cancelar?'
      : '¿Deseas cancelar esta cotización?';

    if (!confirm(warning)) return;

    try {
      if (quote.associated_closure_id) {
        try {
          await supabase.from('cabin_closures').delete().eq('id', quote.associated_closure_id);
        } catch (cErr) {
          console.warn('Error defensivo al eliminar closure:', cErr);
        }
      }

      const { error } = await supabase
        .from('event_quotes')
        .update({ status: 'Cancelada', associated_closure_id: null })
        .eq('id', quote.id);

      if (error) throw error;
      alert('✓ Cotización / evento cancelado exitosamente. Se ha liberado la disponibilidad.');
      fetchQuotes();
    } catch (err: any) {
      alert(`Error al cancelar: ${err?.message || 'Error desconocido'}`);
    }
  };

  // Registrar Abono o Saldo Manual en historial separado (event_payments)
  const handleConfirmManualPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuoteForPayment) return;

    const amount = Number(paymentAmount);
    if (!amount || amount <= 0) {
      alert('Por favor ingresa un monto válido.');
      return;
    }

    setIsProcessingPayment(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const adminUser = user?.email || 'Administración';

      const prevStatus = selectedQuoteForPayment.status;
      const currentPaid = Number(selectedQuoteForPayment.deposit_paid || 0);
      const newTotalPaid = currentPaid + amount;
      const depositNeeded = Number(selectedQuoteForPayment.deposit_required || 0);
      const totalAmount = Number(selectedQuoteForPayment.total_amount || 0);

      // Si el pago acumulado cubre o supera el abono requerido del 50%, se promueve a 'Confirmada' (si no lo estaba)
      const newStatus = prevStatus === 'Confirmada'
        ? 'Confirmada'
        : newTotalPaid >= depositNeeded
        ? 'Confirmada'
        : prevStatus;

      const defaultNote = prevStatus === 'Confirmada'
        ? (newTotalPaid >= totalAmount ? 'Pago de saldo restante (100% completado)' : 'Abono parcial posterior a confirmación')
        : 'Abono inicial registrado por administración';

      // 1. Insertar registro independiente en event_payments
      const { error: payInsertError } = await supabase
        .from('event_payments')
        .insert([{
          event_quote_id: selectedQuoteForPayment.id,
          amount,
          payment_method: paymentMethod,
          reference: paymentReference.trim() || 'Registro manual PMS',
          notes: paymentNotes.trim() || defaultNote,
          recorded_by: adminUser
        }]);

      if (payInsertError) {
        console.warn('[AdminEventQuotes] Aviso al insertar en event_payments (¿migración pendiente?):', payInsertError);
      }

      // 2. Actualizar estado (y deposit_paid como respaldo inmediato si el trigger aún no está activo)
      const { error } = await supabase
        .from('event_quotes')
        .update({
          deposit_paid: newTotalPaid,
          status: newStatus,
          payment_method: paymentMethod,
          payment_reference: paymentReference.trim() || selectedQuoteForPayment.payment_reference || 'Pago registrado por admin'
        })
        .eq('id', selectedQuoteForPayment.id);

      if (error) throw error;

      // Solo enviar correo de recinto confirmado/bloqueado la primera vez que pasa a 'Confirmada'
      if (prevStatus !== 'Confirmada' && newStatus === 'Confirmada') {
        fetch('/api/send-event-quote-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'confirmed', quoteId: selectedQuoteForPayment.id })
        }).catch(mailErr => console.warn('[AdminEventQuotes] Error enviando correo de confirmación:', mailErr));
      }

      const remainingAfter = Math.max(0, totalAmount - newTotalPaid);
      alert(
        prevStatus !== 'Confirmada' && newStatus === 'Confirmada'
          ? '🎉 ¡Abono acreditado! El evento ha pasado a estado CONFIRMADA y todas las cabañas han quedado bloqueadas automáticamente.'
          : remainingAfter === 0
          ? `🎉 ¡Pago de ${formatMoney(amount)} registrado! El arriendo del recinto se encuentra 100% pagado (Saldo: $0).`
          : `✓ Pago de ${formatMoney(amount)} registrado con éxito en el historial. Saldo restante: ${formatMoney(remainingAfter)}.`
      );

      setSelectedQuoteForPayment(null);
      setPaymentAmount('');
      setPaymentReference('');
      setPaymentNotes('');
      fetchQuotes();
    } catch (err: any) {
      alert(`Error al registrar abono: ${err?.message || 'Error desconocido'}`);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Eliminar un pago específico del historial (por error de digitación)
  const handleDeletePayment = async (paymentId: string, amount: number) => {
    if (!confirm(`¿Deseas eliminar este registro de pago por ${formatMoney(amount)} del historial? El total abonado se recalculará automáticamente.`)) {
      return;
    }
    try {
      const { error } = await supabase.from('event_payments').delete().eq('id', paymentId);
      if (error) throw error;
      fetchQuotes();
    } catch (err: any) {
      alert(`Error al eliminar pago: ${err?.message || 'Error desconocido'}`);
    }
  };

  // Check-in de Recinto Completo (Inicio de uso del local)
  const handleConfirmCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuoteForCheckIn) return;

    const totalAmount = Number(selectedQuoteForCheckIn.total_amount || 0);
    const totalPaid = Number(selectedQuoteForCheckIn.deposit_paid || 0);
    const remaining = Math.max(0, totalAmount - totalPaid);

    if (remaining > 0 && !checkInExceptionNote.trim()) {
      alert('El evento aún tiene saldo pendiente. Por favor cobra el saldo o ingresa un motivo de autorización excepcional.');
      return;
    }

    setIsCheckingIn(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const adminUser = user?.email || 'Administración';

      const updatedNotes = checkInExceptionNote.trim()
        ? `${selectedQuoteForCheckIn.admin_notes ? selectedQuoteForCheckIn.admin_notes + '\n' : ''}[Check-in Autorizado con Saldo ${formatMoney(remaining)}]: ${checkInExceptionNote.trim()}`
        : selectedQuoteForCheckIn.admin_notes;

      const { error } = await supabase
        .from('event_quotes')
        .update({
          operational_status: 'En_Curso',
          checked_in_at: new Date().toISOString(),
          checked_in_by: adminUser,
          admin_notes: updatedNotes
        })
        .eq('id', selectedQuoteForCheckIn.id);

      if (error) throw error;

      alert('🔑 ¡Check-in realizado! El grupo ya se encuentra haciendo uso oficial del recinto completo.');
      setSelectedQuoteForCheckIn(null);
      setCheckInExceptionNote('');
      fetchQuotes();
    } catch (err: any) {
      alert(`Error al realizar Check-in: ${err?.message || 'Error desconocido'}`);
    } finally {
      setIsCheckingIn(false);
    }
  };

  // Finalizar Evento / Check-out (Entrega del recinto en las mismas condiciones)
  const handleConfirmCheckOut = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuoteForCheckOut) return;

    setIsCheckingOut(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const adminUser = user?.email || 'Administración';

      const { error } = await supabase
        .from('event_quotes')
        .update({
          operational_status: 'Finalizado',
          checked_out_at: new Date().toISOString(),
          checked_out_by: adminUser,
          checkout_notes: checkOutNotes.trim() || 'Recinto entregado conforme en las mismas condiciones iniciales.'
        })
        .eq('id', selectedQuoteForCheckOut.id);

      if (error) throw error;

      alert('🏁 ¡Evento finalizado con éxito! Se ha registrado la entrega conforme del recinto.');
      setSelectedQuoteForCheckOut(null);
      setCheckOutNotes('');
      fetchQuotes();
    } catch (err: any) {
      alert(`Error al finalizar evento: ${err?.message || 'Error desconocido'}`);
    } finally {
      setIsCheckingOut(false);
    }
  };

  // Asignar Cabaña de Apoyo (Excepción conversada)
  const handleSaveSupportCabin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuoteForCabin) return;

    setIsSavingCabin(true);
    try {
      const fee = Number(supportCabinFee) || 0;
      const cabinId = supportCabinId || null;

      const { error } = await supabase
        .from('event_quotes')
        .update({
          includes_support_cabin: !!cabinId,
          support_cabin_id: cabinId,
          support_cabin_extra_fee: fee
        })
        .eq('id', selectedQuoteForCabin.id);

      if (error) throw error;
      alert('✓ Información de cabaña de apoyo guardada exitosamente.');
      setSelectedQuoteForCabin(null);
      fetchQuotes();
    } catch (err: any) {
      alert(`Error al guardar cabaña: ${err?.message || 'Error desconocido'}`);
    } finally {
      setIsSavingCabin(false);
    }
  };

  const filteredQuotes = quotes.filter(q => {
    if (statusFilter === 'todos') return true;
    return q.status === statusFilter;
  });

  const pendingCount = quotes.filter(q => q.status === 'Cotizacion_Pendiente').length;

  return (
    <div className="space-y-6">
      {/* Header y Filtros */}
      <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-extrabold text-gray-900">
              Arriendos de Recinto Completo (Eventos de 8 Horas)
            </h3>
            {pendingCount > 0 && (
              <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-1 rounded-full font-bold animate-pulse">
                {pendingCount} pendientes
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Administra las solicitudes de paseos de curso, adulto mayor y eventos de recinto exclusivo.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full md:w-auto p-2.5 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 bg-gray-50 focus:ring-2 focus:ring-[#11d442]"
          >
            <option value="todos">Todos los Estados ({quotes.length})</option>
            <option value="Cotizacion_Pendiente">🟡 Pendientes de Aprobación</option>
            <option value="Aprobada">🔵 Aprobadas (Esperando Abono)</option>
            <option value="Confirmada">🟢 Confirmadas (Cierre Activo)</option>
            <option value="Cancelada">🔴 Canceladas</option>
          </select>
          <button
            onClick={fetchQuotes}
            className="p-2.5 border border-gray-200 hover:bg-gray-100 rounded-xl text-gray-600 transition-colors"
            title="Refrescar lista"
          >
            🔄
          </button>
        </div>
      </div>

      {/* Lista de Cotizaciones */}
      {loading ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-gray-100 text-sm text-gray-400">
          Cargando cotizaciones de eventos...
        </div>
      ) : filteredQuotes.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-gray-100 text-sm text-gray-400">
          No hay cotizaciones registradas en este estado.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredQuotes.map((q) => {
            const isPending = q.status === 'Cotizacion_Pendiente';
            const isApproved = q.status === 'Aprobada';
            const isConfirmed = q.status === 'Confirmada';
            const isCancelled = q.status === 'Cancelada';
            const isRejected = q.status === 'Rechazada';

            const isCheckedIn = q.operational_status === 'En_Curso';
            const isFinished = q.operational_status === 'Finalizado';
            const isPendingCheckIn = isConfirmed && !isCheckedIn && !isFinished;

            const paymentsList = eventPaymentsMap[q.id] || [];
            const totalPaid = paymentsList.length > 0
              ? paymentsList.reduce((acc: number, p: any) => acc + Number(p.amount || 0), 0)
              : Number(q.deposit_paid || 0);
            const totalAmount = Number(q.total_amount || 0);
            const remainingBalance = Math.max(0, totalAmount - totalPaid);

            const paying = (q.adults_count || 0) + (q.children_count || 0);
            const total = paying + (q.under_3_years_count || 0);

            const whatsappApprovalMsg = encodeURIComponent(
              `¡Hola ${q.organizer_name}! Te saludamos de *Rancho Carmelitas*.\n\n` +
              `Hemos revisado y *APROBADO* tu solicitud de Arriendo de Recinto Completo para el día *${q.event_date}* (${q.start_time?.slice(0, 5)} a ${q.end_time?.slice(0, 5)} hrs).\n\n` +
              `👥 *Grupo:* ${q.group_name || q.organizer_name} (${total} asistentes)\n` +
              `💰 *Total:* ${formatMoney(q.total_amount)}\n` +
              `💳 *Abono 50% requerido:* ${formatMoney(q.deposit_required)}\n\n` +
              `Puedes coordinar la transferencia bancaria con nosotros o pagar directamente en nuestra página web. ¡Quedamos atentos para reservar formalmente tu fecha!`
            );

            const isHighlighted = highlightId && q.id === highlightId;

            return (
              <div
                key={q.id}
                id={`event-quote-${q.id}`}
                className={`bg-white rounded-2xl border p-6 shadow-sm transition-all space-y-4 ${
                  isHighlighted
                    ? 'border-purple-500 ring-2 ring-purple-400/60 shadow-lg bg-purple-50/10'
                    : 'border-gray-200 hover:shadow-md'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">
                      {q.group_type === 'paseo_curso' ? '🎒' : q.group_type === 'adulto_mayor' ? '👴' : '🎉'}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-gray-900 text-base">
                          {q.group_name || q.organizer_name}
                        </h4>
                        {isHighlighted && (
                          <span className="bg-purple-100 text-purple-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-purple-200">
                            ✨ Seleccionado desde Dashboard
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        Responsable: <span className="font-semibold text-gray-700">{q.organizer_name}</span> ({q.organizer_email} • {q.organizer_phone})
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {isPending && (
                      <span className="bg-amber-100 text-amber-800 text-xs px-3 py-1 rounded-full font-bold">
                        🟡 Pendiente de Aprobación
                      </span>
                    )}
                    {isApproved && (
                      <span className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full font-bold">
                        🔵 Aprobada (Esperando Abono)
                      </span>
                    )}
                    {isConfirmed && (
                      <span className="bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1">
                        <span>🟢 Confirmada</span>
                        <span className="text-[10px] bg-green-200 px-1.5 py-0.2 rounded font-extrabold">Cierre Activo</span>
                      </span>
                    )}
                    {isPendingCheckIn && (
                      <span className="bg-amber-50 text-amber-800 border border-amber-200 text-xs px-3 py-1 rounded-full font-bold">
                        ⏳ Pendiente de Ingreso
                      </span>
                    )}
                    {isConfirmed && isCheckedIn && (
                      <span className="bg-emerald-600 text-white text-xs px-3 py-1 rounded-full font-bold animate-pulse">
                        🔑 En Uso (Check-in OK)
                      </span>
                    )}
                    {isConfirmed && isFinished && (
                      <span className="bg-slate-800 text-white text-xs px-3 py-1 rounded-full font-bold">
                        🏁 Finalizado (Entregado)
                      </span>
                    )}
                    {isCancelled && (
                      <span className="bg-red-100 text-red-800 text-xs px-3 py-1 rounded-full font-bold">
                        🔴 Cancelada
                      </span>
                    )}
                    {isRejected && (
                      <span className="bg-gray-200 text-gray-700 text-xs px-3 py-1 rounded-full font-bold">
                        ✖ Rechazada
                      </span>
                    )}
                  </div>
                </div>

                {/* Detalles de la Jornada y Asistentes */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <div>
                    <span className="text-gray-400 block mb-0.5">Fecha del Evento:</span>
                    <span className="font-bold text-gray-900 text-sm">{q.event_date}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block mb-0.5">Horario (8 hrs):</span>
                    <span className="font-semibold text-gray-800">{q.start_time?.slice(0, 5)} a {q.end_time?.slice(0, 5)} hrs</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block mb-0.5">Asistentes:</span>
                    <span className="font-semibold text-gray-800">
                      {total} pers. ({q.adults_count} ad. + {q.children_count} niñ. {q.under_3_years_count > 0 ? `+ ${q.under_3_years_count} <3a` : ''})
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block mb-0.5">Juegos Inflables:</span>
                    <span className="font-semibold text-gray-800">{q.has_bouncy_castle ? '✓ Sí (+$5.000)' : 'No'}</span>
                  </div>
                </div>

                {/* Historial de Pagos Separado (Registros individuales) */}
                {paymentsList.length > 0 && (
                  <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      <span>🧾 Historial de Pagos Registrados ({paymentsList.length})</span>
                      <span className="text-emerald-700">Total acumulado: {formatMoney(totalPaid)}</span>
                    </div>
                    <div className="space-y-1.5">
                      {paymentsList.map((pay: any, idx: number) => (
                        <div
                          key={pay.id}
                          className="flex flex-wrap items-center justify-between gap-2 bg-white px-3 py-2 rounded-lg border border-slate-200/70 text-xs"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="bg-slate-100 text-slate-600 font-bold px-1.5 py-0.5 rounded text-[10px]">
                              #{idx + 1}
                            </span>
                            <span className="font-extrabold text-emerald-700">{formatMoney(pay.amount)}</span>
                            <span className="text-slate-600 font-semibold">• {pay.payment_method}</span>
                            {pay.reference && (
                              <span className="text-slate-400 text-[11px]">({pay.reference})</span>
                            )}
                            {pay.notes && (
                              <span className="text-slate-500 italic text-[11px]">— {pay.notes}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-400">
                              {new Date(pay.created_at).toLocaleDateString('es-CL')} {new Date(pay.created_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeletePayment(pay.id, Number(pay.amount))}
                              className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1 rounded transition-colors cursor-pointer"
                              title="Eliminar este registro de pago"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Registro de Check-in / Check-out si aplica */}
                {(q.checked_in_at || q.checked_out_at) && (
                  <div className="flex flex-wrap gap-3 text-[11px] bg-emerald-50/60 border border-emerald-200/70 rounded-xl px-3 py-2 text-emerald-900">
                    {q.checked_in_at && (
                      <span>
                        <strong>🔑 Ingreso (Check-in):</strong> {new Date(q.checked_in_at).toLocaleString('es-CL')} ({q.checked_in_by || 'Admin'})
                      </span>
                    )}
                    {q.checked_out_at && (
                      <span>
                        <strong>🏁 Entrega (Finalizado):</strong> {new Date(q.checked_out_at).toLocaleString('es-CL')} ({q.checked_out_by || 'Admin'})
                        {q.checkout_notes ? ` — "${q.checkout_notes}"` : ''}
                      </span>
                    )}
                  </div>
                )}

                {/* Desglose Financiero */}
                <div className="flex flex-wrap items-center justify-between text-xs pt-2 gap-4">
                  <div className="flex flex-wrap items-center gap-5">
                    <div>
                      <span className="text-gray-400 block">Total Arriendo:</span>
                      <span className="font-black text-gray-900 text-base">{formatMoney(totalAmount)}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Total Pagado:</span>
                      <span className={`font-bold text-sm ${totalPaid >= totalAmount ? 'text-emerald-600' : 'text-blue-700'}`}>
                        {formatMoney(totalPaid)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Saldo Pendiente:</span>
                      {remainingBalance <= 0 ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-extrabold text-xs">
                          ✓ 100% Pagado ($0)
                        </span>
                      ) : (
                        <span className="font-black text-amber-600 text-sm">
                          {formatMoney(remainingBalance)}
                        </span>
                      )}
                    </div>
                    {q.includes_support_cabin && (
                      <div className="bg-purple-50 text-purple-800 px-3 py-1.5 rounded-lg border border-purple-200">
                        <span className="block font-bold">🏠 Cabaña de Apoyo Incluida:</span>
                        <span>{cabins.find(c => c.id === q.support_cabin_id)?.name || 'Cabaña asignada'} (+{formatMoney(q.support_cabin_extra_fee)})</span>
                      </div>
                    )}
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {isPending && (
                      <button
                        onClick={() => handleApproveQuote(q)}
                        className="bg-[#11d442] hover:bg-[#0fb839] text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                      >
                        ✓ Aprobar Cotización
                      </button>
                    )}

                    {/* Botón de Pago / Cobro de Saldo: Disponible tanto antes como después de confirmar mientras falte saldo o para pagos adicionales */}
                    {!isCancelled && !isRejected && (remainingBalance > 0 || isPending || isApproved) && (
                      <button
                        onClick={() => {
                          setSelectedQuoteForPayment(q);
                          const defaultAmt = isConfirmed
                            ? remainingBalance
                            : Math.max(0, Number(q.deposit_required || 0) - totalPaid) || remainingBalance;
                          setPaymentAmount(String(defaultAmt));
                          setPaymentNotes('');
                          setPaymentReference('');
                        }}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer text-white ${
                          isConfirmed && remainingBalance > 0
                            ? 'bg-emerald-600 hover:bg-emerald-700 shadow-sm'
                            : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                      >
                        {isConfirmed && remainingBalance > 0
                          ? `💵 Cobrar Saldo (${formatMoney(remainingBalance)})`
                          : '💳 Registrar Abono'}
                      </button>
                    )}

                    {/* Botón Check-in: Cuando el evento está Confirmado y aún no ha iniciado uso */}
                    {isPendingCheckIn && (
                      <button
                        onClick={() => {
                          setSelectedQuoteForCheckIn(q);
                          setCheckInExceptionNote('');
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-sm"
                        title="Registrar ingreso del grupo y entrega del recinto completo"
                      >
                        🔑 Check-in (Iniciar Uso)
                      </button>
                    )}

                    {/* Botón Finalizado: Cuando el grupo ya hizo Check-in y está en curso */}
                    {isConfirmed && isCheckedIn && (
                      <button
                        onClick={() => {
                          setSelectedQuoteForCheckOut(q);
                          setCheckOutNotes('');
                        }}
                        className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-sm"
                        title="Confirmar entrega conforme del local al término de la jornada"
                      >
                        🏁 Finalizar (Entrega)
                      </button>
                    )}

                    {/* Botón para Cabaña de Apoyo */}
                    <button
                      onClick={() => {
                        setSelectedQuoteForCabin(q);
                        setSupportCabinId(q.support_cabin_id || '');
                        setSupportCabinFee(String(q.support_cabin_extra_fee || 0));
                      }}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-xl text-xs font-medium transition-colors"
                      title="Asignar cabaña de apoyo si fue conversada"
                    >
                      🏠 Cabaña de Apoyo
                    </button>

                    {/* Botón WhatsApp */}
                    <a
                      href={`https://wa.me/${q.organizer_phone?.replace(/[^0-9]/g, '')}?text=${whatsappApprovalMsg}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-[#25D366] hover:bg-[#20ba59] text-white px-3 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
                    >
                      <span>💬 WhatsApp</span>
                    </a>

                    {/* Botón Editar Evento */}
                    <button
                      onClick={() => handleOpenEdit(q)}
                      className="bg-purple-100 hover:bg-purple-200 text-purple-800 px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                      title="Editar fechas, asistentes, valores o estado de este evento"
                    >
                      <span>✏️ Editar</span>
                    </button>

                    {!isCancelled && (
                      <button
                        onClick={() => handleCancelQuote(q)}
                        className="text-red-500 hover:bg-red-50 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Registrar Abono o Saldo Manual */}
      {selectedQuoteForPayment && (() => {
        const payList = eventPaymentsMap[selectedQuoteForPayment.id] || [];
        const currentTotalPaid = payList.length > 0
          ? payList.reduce((acc: number, p: any) => acc + Number(p.amount || 0), 0)
          : Number(selectedQuoteForPayment.deposit_paid || 0);
        const totalEvt = Number(selectedQuoteForPayment.total_amount || 0);
        const currentRemaining = Math.max(0, totalEvt - currentTotalPaid);

        return (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
              <h4 className="text-lg font-bold text-gray-900">
                {selectedQuoteForPayment.status === 'Confirmada'
                  ? '💵 Registrar Cobro de Saldo / Pago'
                  : '💳 Registrar Abono Manual'}
              </h4>
              <p className="text-xs text-gray-500">
                Organizador: <span className="font-semibold text-gray-800">{selectedQuoteForPayment.organizer_name}</span> ({selectedQuoteForPayment.event_date})
              </p>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                  <span className="text-[10px] text-gray-400 block">Total</span>
                  <span className="font-bold text-gray-900">{formatMoney(totalEvt)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 block">Ya Pagado</span>
                  <span className="font-bold text-emerald-700">{formatMoney(currentTotalPaid)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 block">Saldo</span>
                  <span className="font-black text-amber-600">{formatMoney(currentRemaining)}</span>
                </div>
              </div>

              <form onSubmit={handleConfirmManualPayment} className="space-y-4 text-xs">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-semibold text-gray-700">Monto a Registrar ($ CLP)</label>
                    {currentRemaining > 0 && (
                      <button
                        type="button"
                        onClick={() => setPaymentAmount(String(currentRemaining))}
                        className="text-[11px] text-emerald-700 font-bold hover:underline cursor-pointer"
                      >
                        Usar saldo exacto ({formatMoney(currentRemaining)})
                      </button>
                    )}
                  </div>
                  <input
                    type="number"
                    required
                    min={1}
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-bold text-gray-900 focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Método de Pago</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-semibold text-gray-800"
                  >
                    <option value="Transferencia">🏦 Transferencia Bancaria</option>
                    <option value="Efectivo">💵 Efectivo (Caja)</option>
                    <option value="POS Mercado Pago">📱 POS Mercado Pago / Tarjeta</option>
                    <option value="Otro">Otro Medio</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Referencia o Nº de Comprobante</label>
                  <input
                    type="text"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    placeholder="Ej: Transf. Banco Estado #928374 o Caja"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Nota del Pago (Opcional)</label>
                  <input
                    type="text"
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    placeholder="Ej: Pago del 50% restante al ingresar al recinto"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedQuoteForPayment(null)}
                    className="px-4 py-2 rounded-xl text-gray-500 hover:bg-gray-100 font-semibold"
                  >
                    Cerrar
                  </button>
                  <button
                    type="submit"
                    disabled={isProcessingPayment}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm cursor-pointer"
                  >
                    {isProcessingPayment ? 'Guardando...' : '✓ Registrar Pago'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* Modal: Check-in de Recinto Completo (Inicio de Uso) */}
      {selectedQuoteForCheckIn && (() => {
        const payList = eventPaymentsMap[selectedQuoteForCheckIn.id] || [];
        const totalPaid = payList.length > 0
          ? payList.reduce((acc: number, p: any) => acc + Number(p.amount || 0), 0)
          : Number(selectedQuoteForCheckIn.deposit_paid || 0);
        const totalEvt = Number(selectedQuoteForCheckIn.total_amount || 0);
        const remaining = Math.max(0, totalEvt - totalPaid);

        return (
          <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center text-xl">🔑</span>
                <div>
                  <h4 className="text-base font-extrabold text-gray-900">Check-in: Inicio de Uso del Recinto</h4>
                  <p className="text-xs text-gray-500">{selectedQuoteForCheckIn.group_name || selectedQuoteForCheckIn.organizer_name} • {selectedQuoteForCheckIn.event_date}</p>
                </div>
              </div>

              {remaining > 0 ? (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2 text-xs text-amber-900">
                  <div className="font-extrabold flex items-center gap-1.5 text-amber-800">
                    <span>⚠️ Saldo Pendiente por Pagar: {formatMoney(remaining)}</span>
                  </div>
                  <p className="leading-relaxed">
                    El arriendo aún no está pagado al 100%. Se recomienda cobrar el saldo antes de entregar el recinto, o bien ingresar un motivo de autorización excepcional.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      const q = selectedQuoteForCheckIn;
                      setSelectedQuoteForCheckIn(null);
                      setSelectedQuoteForPayment(q);
                      setPaymentAmount(String(remaining));
                    }}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    💵 Ir a Cobrar Saldo Ahora ({formatMoney(remaining)})
                  </button>
                </div>
              ) : (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-900">
                  <div className="font-extrabold flex items-center gap-1.5">
                    <span>✓ Saldo 100% Pagado ({formatMoney(totalPaid)})</span>
                  </div>
                  <p className="mt-1 text-emerald-700">
                    Todo listo para entregar las instalaciones completas (quincho, piscina, áreas verdes y baños{selectedQuoteForCheckIn.includes_support_cabin ? ' + cabaña de apoyo' : ''}).
                  </p>
                </div>
              )}

              <form onSubmit={handleConfirmCheckIn} className="space-y-4 text-xs">
                {remaining > 0 && (
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      Motivo de autorización excepcional (para ingresar con saldo pendiente) *
                    </label>
                    <textarea
                      required
                      rows={2}
                      value={checkInExceptionNote}
                      onChange={(e) => setCheckInExceptionNote(e.target.value)}
                      placeholder="Ej: Organizador transferirá el saldo durante la tarde por acuerdo con administración..."
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs"
                    />
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedQuoteForCheckIn(null)}
                    className="px-4 py-2 rounded-xl text-gray-500 hover:bg-gray-100 font-semibold cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isCheckingIn}
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-sm cursor-pointer"
                  >
                    {isCheckingIn ? 'Registrando...' : '✓ Confirmar Check-in'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* Modal: Finalizar Evento / Entrega Conforme */}
      {selectedQuoteForCheckOut && (
        <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-800 flex items-center justify-center text-xl">🏁</span>
              <div>
                <h4 className="text-base font-extrabold text-gray-900">Finalizar Evento (Entrega del Recinto)</h4>
                <p className="text-xs text-gray-500">{selectedQuoteForCheckOut.group_name || selectedQuoteForCheckOut.organizer_name} • {selectedQuoteForCheckOut.event_date}</p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-xs text-slate-700 space-y-1.5">
              <p className="font-bold text-slate-900">Checklist de Recepción del Local:</p>
              <ul className="list-disc list-inside space-y-1 text-[11px]">
                <li>Quincho, parrilla, fogón y refrigeradores en buen estado.</li>
                <li>Piscina, áreas verdes y baños exteriores sin daños.</li>
                {selectedQuoteForCheckOut.includes_support_cabin && (
                  <li>Llaves e inventario de Cabaña de Apoyo revisados.</li>
                )}
              </ul>
            </div>

            <form onSubmit={handleConfirmCheckOut} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Observaciones de Entrega (Opcional)</label>
                <textarea
                  rows={2}
                  value={checkOutNotes}
                  onChange={(e) => setCheckOutNotes(e.target.value)}
                  placeholder="Ej: Recinto entregado limpio y en las mismas condiciones del inicio..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedQuoteForCheckOut(null)}
                  className="px-4 py-2 rounded-xl text-gray-500 hover:bg-gray-100 font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCheckingOut}
                  className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold shadow-sm cursor-pointer"
                >
                  {isCheckingOut ? 'Finalizando...' : '🏁 Confirmar Entrega y Finalizar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Asignar Cabaña de Apoyo */}
      {selectedQuoteForCabin && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h4 className="text-lg font-bold text-gray-900">
              Cabaña de Apoyo (Excepción Conversada)
            </h4>
            <p className="text-xs text-gray-500">
              Si el grupo conversó el arriendo de 1 cabaña puntual (ej: descanso, lactancia o apoyo), asígnala aquí para el control de aseo y llaves.
            </p>

            <form onSubmit={handleSaveSupportCabin} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Seleccionar Cabaña</label>
                <select
                  value={supportCabinId}
                  onChange={(e) => setSupportCabinId(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-semibold text-gray-800"
                >
                  <option value="">-- Ninguna (Solo áreas exteriores) --</option>
                  {cabins.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Recargo Conversado de Cabaña ($ CLP)</label>
                <input
                  type="number"
                  value={supportCabinFee}
                  onChange={(e) => setSupportCabinFee(e.target.value)}
                  placeholder="0"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5"
                />
                <span className="text-[11px] text-gray-400 mt-1 block">
                  Cubre el costo de sábanas, preparación y aseo posterior.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedQuoteForCabin(null)}
                  className="px-4 py-2 rounded-xl text-gray-500 hover:bg-gray-100 font-semibold"
                >
                  Cerrar
                </button>
                <button
                  type="submit"
                  disabled={isSavingCabin}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold"
                >
                  {isSavingCabin ? 'Guardando...' : 'Guardar Cabaña'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Editar Integralmente Reserva de Recinto Completo */}
      {selectedQuoteForEdit && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Header del Modal */}
            <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-purple-900 to-indigo-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🎪</span>
                <div>
                  <h3 className="font-extrabold text-base">Editar Reserva de Recinto Completo</h3>
                  <p className="text-purple-200 text-xs">
                    Folio: #{selectedQuoteForEdit.id?.slice(0, 8).toUpperCase()} • {selectedQuoteForEdit.group_name || selectedQuoteForEdit.organizer_name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedQuoteForEdit(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Contenido scrolleable */}
            <form onSubmit={handleSaveEdit} className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
              {/* Bloque 1: Fecha y Horario */}
              <div className="bg-gray-50/70 p-4 rounded-2xl border border-gray-100 space-y-3">
                <h4 className="font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                  📅 Fecha y Horario
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Fecha del Evento *</label>
                    <input
                      type="date"
                      required
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-400"
                      value={editQuoteForm.event_date}
                      onChange={e => setEditQuoteForm({ ...editQuoteForm, event_date: e.target.value })}
                    />
                    {editQuoteForm.event_date && occupiedVenueDates.includes(editQuoteForm.event_date) && editQuoteForm.event_date !== selectedQuoteForEdit.event_date && (
                      <span className="text-[10px] text-amber-600 font-bold block mt-1">
                        ⚠️ Fecha con otra reserva o evento registrado
                      </span>
                    )}
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Hora Ingreso</label>
                    <input
                      type="time"
                      required
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold"
                      value={editQuoteForm.start_time}
                      onChange={e => setEditQuoteForm({ ...editQuoteForm, start_time: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Hora Salida</label>
                    <input
                      type="time"
                      required
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold"
                      value={editQuoteForm.end_time}
                      onChange={e => setEditQuoteForm({ ...editQuoteForm, end_time: e.target.value })}
                    />
                  </div>
                </div>

                {/* Atajos de Horario */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
                  <span className="text-gray-400 font-medium">Atajos estándar:</span>
                  <button
                    type="button"
                    onClick={() => setEditQuoteForm({ ...editQuoteForm, start_time: '10:00', end_time: '18:00' })}
                    className="px-2 py-0.5 rounded bg-white hover:bg-purple-50 text-purple-700 border border-purple-200 font-bold"
                  >
                    10:00 a 18:00
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditQuoteForm({ ...editQuoteForm, start_time: '11:00', end_time: '19:00' })}
                    className="px-2 py-0.5 rounded bg-white hover:bg-purple-50 text-purple-700 border border-purple-200 font-bold"
                  >
                    11:00 a 19:00
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditQuoteForm({ ...editQuoteForm, start_time: '12:00', end_time: '20:00' })}
                    className="px-2 py-0.5 rounded bg-white hover:bg-purple-50 text-purple-700 border border-purple-200 font-bold"
                  >
                    12:00 a 20:00 (Máx)
                  </button>
                </div>
              </div>

              {/* Bloque 2: Datos del Organizador y Grupo */}
              <div className="bg-gray-50/70 p-4 rounded-2xl border border-gray-100 space-y-3">
                <h4 className="font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                  👤 Organizador y Delegación
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Nombre Organizador *</label>
                    <input
                      type="text"
                      required
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs"
                      value={editQuoteForm.organizer_name}
                      onChange={e => setEditQuoteForm({ ...editQuoteForm, organizer_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Correo Electrónico *</label>
                    <input
                      type="email"
                      required
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs"
                      value={editQuoteForm.organizer_email}
                      onChange={e => setEditQuoteForm({ ...editQuoteForm, organizer_email: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Teléfono / WhatsApp *</label>
                    <input
                      type="text"
                      required
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs"
                      value={editQuoteForm.organizer_phone}
                      onChange={e => setEditQuoteForm({ ...editQuoteForm, organizer_phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">RUT Organizador</label>
                    <input
                      type="text"
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs"
                      placeholder="Ej: 12.345.678-9"
                      value={editQuoteForm.organizer_rut}
                      onChange={e => setEditQuoteForm({ ...editQuoteForm, organizer_rut: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Nombre del Grupo / Institución</label>
                    <input
                      type="text"
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold"
                      placeholder="Ej: 4to Básico Colegio Alemán"
                      value={editQuoteForm.group_name}
                      onChange={e => setEditQuoteForm({ ...editQuoteForm, group_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Tipo de Delegación</label>
                    <select
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs"
                      value={editQuoteForm.group_type}
                      onChange={e => setEditQuoteForm({ ...editQuoteForm, group_type: e.target.value })}
                    >
                      <option value="paseo_curso">🎒 Paseo de Curso</option>
                      <option value="adulto_mayor">👵 Delegación Adulto Mayor</option>
                      <option value="familiar">👨‍👩‍👦 Cumpleaños / Familiar</option>
                      <option value="empresa">🏢 Empresa / Institución</option>
                      <option value="otro">✨ Otro Evento</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Bloque 3: Asistentes e Inflable */}
              <div className="bg-gray-50/70 p-4 rounded-2xl border border-gray-100 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                    👥 Asistentes y Servicios
                  </h4>
                  <button
                    type="button"
                    onClick={handleRecalculateEditPrice}
                    className="text-[11px] font-bold text-purple-700 bg-purple-100 hover:bg-purple-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                  >
                    ⚡ Recalcular Monto con Tramos
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Adultos *</label>
                    <input
                      type="number"
                      min={1}
                      required
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold"
                      value={editQuoteForm.adults_count}
                      onChange={e => setEditQuoteForm({ ...editQuoteForm, adults_count: Math.max(1, Number(e.target.value)) })}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Niños (&gt;3 años)</label>
                    <input
                      type="number"
                      min={0}
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold"
                      value={editQuoteForm.children_count}
                      onChange={e => setEditQuoteForm({ ...editQuoteForm, children_count: Math.max(0, Number(e.target.value)) })}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Bebés (&lt;3 años)</label>
                    <input
                      type="number"
                      min={0}
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold"
                      value={editQuoteForm.under_3_years_count}
                      onChange={e => setEditQuoteForm({ ...editQuoteForm, under_3_years_count: Math.max(0, Number(e.target.value)) })}
                    />
                  </div>
                  <div className="flex items-center">
                    <label className="flex items-center gap-2 cursor-pointer pt-3">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                        checked={editQuoteForm.has_bouncy_castle}
                        onChange={e => setEditQuoteForm({ ...editQuoteForm, has_bouncy_castle: e.target.checked })}
                      />
                      <span className="font-semibold text-gray-800">Trae Inflables (+$5.000)</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Bloque 4: Aspectos Financieros y Estado */}
              <div className="bg-gray-50/70 p-4 rounded-2xl border border-gray-100 space-y-3">
                <h4 className="font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                  💰 Aspectos Financieros y Estado
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Total Cotizado ($ CLP) *</label>
                    <input
                      type="number"
                      min={0}
                      required
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-black text-gray-900"
                      value={editQuoteForm.total_amount}
                      onChange={e => setEditQuoteForm({ ...editQuoteForm, total_amount: Math.max(0, Number(e.target.value)) })}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Abono Requerido ($ CLP) *</label>
                    <input
                      type="number"
                      min={0}
                      required
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-purple-700"
                      value={editQuoteForm.deposit_required}
                      onChange={e => setEditQuoteForm({ ...editQuoteForm, deposit_required: Math.max(0, Number(e.target.value)) })}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Abono Registrado ($ CLP)</label>
                    <input
                      type="number"
                      min={0}
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-emerald-700"
                      value={editQuoteForm.deposit_paid}
                      onChange={e => setEditQuoteForm({ ...editQuoteForm, deposit_paid: Math.max(0, Number(e.target.value)) })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Estado del Evento *</label>
                    <select
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold"
                      value={editQuoteForm.status}
                      onChange={e => setEditQuoteForm({ ...editQuoteForm, status: e.target.value })}
                    >
                      <option value="Confirmada">🟢 Confirmada (Cierre Total)</option>
                      <option value="Aprobada">🟡 Aprobada (Esperando Pago)</option>
                      <option value="Cotizacion_Pendiente">⚪ Cotización Pendiente</option>
                      <option value="Cancelada">🔴 Cancelada</option>
                      <option value="Rechazada">✖ Rechazada</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Método de Pago</label>
                    <select
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs"
                      value={editQuoteForm.payment_method}
                      onChange={e => setEditQuoteForm({ ...editQuoteForm, payment_method: e.target.value })}
                    >
                      <option value="Transferencia">🏦 Transferencia Bancaria</option>
                      <option value="Efectivo">💵 Pago en Efectivo</option>
                      <option value="POS Mercado Pago">📱 POS Mercado Pago</option>
                      <option value="Mercado Pago (Link)">💳 Link de Pago Web</option>
                      <option value="Otro">Otro Medio</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Nº Comprobante / Referencia</label>
                    <input
                      type="text"
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs"
                      placeholder="Ej: Transf #123456"
                      value={editQuoteForm.payment_reference}
                      onChange={e => setEditQuoteForm({ ...editQuoteForm, payment_reference: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Bloque 5: Notas Administrativas */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Notas Administrativas</label>
                <textarea
                  rows={2}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs"
                  placeholder="Detalles acordados, observaciones sobre el grupo..."
                  value={editQuoteForm.admin_notes}
                  onChange={e => setEditQuoteForm({ ...editQuoteForm, admin_notes: e.target.value })}
                />
              </div>

              {/* Botones de acción */}
              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setSelectedQuoteForEdit(null)}
                  disabled={isSavingEdit}
                  className="px-5 py-2.5 rounded-xl text-gray-600 bg-gray-100 hover:bg-gray-200 font-bold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  {isSavingEdit ? 'Guardando Cambios...' : '✓ Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
