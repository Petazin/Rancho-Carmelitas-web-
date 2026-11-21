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
  const [paymentMethod, setPaymentMethod] = useState<string>('transferencia');
  const [paymentReference, setPaymentReference] = useState<string>('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Modal de Cabaña de Apoyo (Excepción)
  const [selectedQuoteForCabin, setSelectedQuoteForCabin] = useState<any | null>(null);
  const [supportCabinId, setSupportCabinId] = useState<string>('');
  const [supportCabinFee, setSupportCabinFee] = useState<string>('0');
  const [isSavingCabin, setIsSavingCabin] = useState(false);

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

  useEffect(() => {
    fetchQuotes();
    fetchCabins();
  }, []);

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
      ? '¡ATENCIÓN! Este evento está CONFIRMADO. Si lo cancelas, se ELIMINARÁ el bloqueo de cabin_closures y las cabañas volverán a estar disponibles para el público.\n\n¿Estás seguro de cancelar?'
      : '¿Deseas cancelar esta cotización?';

    if (!confirm(warning)) return;

    try {
      const { error } = await supabase
        .from('event_quotes')
        .update({ status: 'Cancelada' })
        .eq('id', quote.id);

      if (error) throw error;
      alert('Cotización cancelada exitosamente.');
      fetchQuotes();
    } catch (err: any) {
      alert(`Error al cancelar: ${err?.message || 'Error desconocido'}`);
    }
  };

  // Registrar Abono Manual
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
      const currentPaid = Number(selectedQuoteForPayment.deposit_paid || 0);
      const newTotalPaid = currentPaid + amount;
      const depositNeeded = Number(selectedQuoteForPayment.deposit_required || 0);

      // Si el pago acumulado cubre o supera el abono requerido del 50%, se promueve a 'Confirmada'
      const newStatus = newTotalPaid >= depositNeeded ? 'Confirmada' : selectedQuoteForPayment.status;

      const { error } = await supabase
        .from('event_quotes')
        .update({
          deposit_paid: newTotalPaid,
          status: newStatus,
          payment_method: paymentMethod,
          payment_reference: paymentReference.trim() || 'Abono manual registrado por admin'
        })
        .eq('id', selectedQuoteForPayment.id);

      if (error) throw error;

      if (newStatus === 'Confirmada') {
        // Disparar correo de confirmación de recinto bloqueado al cliente y administración
        fetch('/api/send-event-quote-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'confirmed', quoteId: selectedQuoteForPayment.id })
        }).catch(mailErr => console.warn('[AdminEventQuotes] Error enviando correo de confirmación:', mailErr));
      }

      alert(
        newStatus === 'Confirmada'
          ? '🎉 ¡Abono del 50% completado! El evento ha pasado a estado CONFIRMADA y todas las cabañas han quedado bloqueadas automáticamente en cabin_closures.'
          : `✓ Abono de ${formatMoney(amount)} registrado con éxito.`
      );

      setSelectedQuoteForPayment(null);
      setPaymentAmount('');
      setPaymentReference('');
      fetchQuotes();
    } catch (err: any) {
      alert(`Error al registrar abono: ${err?.message || 'Error desconocido'}`);
    } finally {
      setIsProcessingPayment(false);
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

                  <div>
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
                    {isCancelled && (
                      <span className="bg-red-100 text-red-800 text-xs px-3 py-1 rounded-full font-bold">
                        🔴 Cancelada
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

                {/* Desglose Financiero */}
                <div className="flex flex-wrap items-center justify-between text-xs pt-2 gap-4">
                  <div className="flex items-center gap-6">
                    <div>
                      <span className="text-gray-400 block">Total Cotizado:</span>
                      <span className="font-black text-gray-900 text-base">{formatMoney(q.total_amount)}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Abono 50% Requerido:</span>
                      <span className="font-bold text-[#11d442] text-sm">{formatMoney(q.deposit_required)}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Abono Registrado:</span>
                      <span className={`font-bold ${q.deposit_paid >= q.deposit_required ? 'text-green-600' : 'text-gray-700'}`}>
                        {formatMoney(q.deposit_paid || 0)}
                      </span>
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

                    {(isPending || isApproved) && (
                      <button
                        onClick={() => {
                          setSelectedQuoteForPayment(q);
                          setPaymentAmount(String(q.deposit_required - (q.deposit_paid || 0)));
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                      >
                        💳 Registrar Abono Manual
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

      {/* Modal: Registrar Abono Manual */}
      {selectedQuoteForPayment && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h4 className="text-lg font-bold text-gray-900">
              Registrar Abono Manual para Evento
            </h4>
            <p className="text-xs text-gray-500">
              Organizador: <span className="font-semibold text-gray-800">{selectedQuoteForPayment.organizer_name}</span> ({selectedQuoteForPayment.event_date})
            </p>

            <form onSubmit={handleConfirmManualPayment} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Monto del Abono ($ CLP)</label>
                <input
                  type="number"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-bold text-gray-900 focus:ring-2 focus:ring-blue-600"
                />
                <span className="text-[11px] text-gray-400 mt-1 block">
                  Abono del 50% requerido: {formatMoney(selectedQuoteForPayment.deposit_required)}
                </span>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Método de Pago</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-semibold text-gray-800"
                >
                  <option value="transferencia">Transferencia Bancaria</option>
                  <option value="efectivo">Efectivo</option>
                  <option value="mercadopago">Mercado Pago / Tarjeta</option>
                  <option value="otro">Otro</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Referencia o Nº de Comprobante</label>
                <input
                  type="text"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="Ej: Transf. Banco Estado #928374"
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
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  {isProcessingPayment ? 'Guardando...' : 'Confirmar Abono'}
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
    </div>
  );
}
