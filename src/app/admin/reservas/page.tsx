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
}

function ReservasContent() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para la Edición de Reserva
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [editForm, setEditForm] = useState({
    cabin_id: '',
    check_in: '',
    check_out: '',
    discount_type: 'percentage',
    discount_value: '' as string | number,
    admin_notes: ''
  });
  const [availableCabins, setAvailableCabins] = useState<any[]>([]);

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
  }, []);

  async function fetchCabins() {
    const { data } = await supabase.from('cabins').select('id, name').order('name');
    setAvailableCabins(data || []);
  }

  async function fetchBookings() {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        cabin:cabins (name)
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
    } else {
      updateStatus(booking.id, newStatus);
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
          bookingId: bookingToConfirm.id
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
    setEditForm({
      cabin_id: booking.cabin_id,
      check_in: booking.check_in,
      check_out: booking.check_out,
      discount_type: 'fixed',
      discount_value: booking.discount_applied || '',
      admin_notes: booking.admin_notes || ''
    });
  };

  const saveEdit = async () => {
    if (!editingBooking) return;
    
    // Calcular el descuento real y las notas
    let calculatedDiscount = 0;
    let finalNotes = editForm.admin_notes;

    const numericValue = Number(editForm.discount_value) || 0;
    if (numericValue > 0) {
      if (editForm.discount_type === 'percentage') {
        calculatedDiscount = editingBooking.total_price * (numericValue / 100);
        const discountString = `[Descuento aplicado: ${numericValue}%]`;
        if (!finalNotes.includes(discountString)) {
          finalNotes = finalNotes ? `${finalNotes} ${discountString}` : discountString;
        }
      } else {
        calculatedDiscount = numericValue;
      }
    }

    // Aquí actualizamos cabaña y/o fechas en Supabase
    const { error } = await supabase
      .from('bookings')
      .update({
        cabin_id: editForm.cabin_id,
        check_in: editForm.check_in,
        check_out: editForm.check_out,
        discount_applied: calculatedDiscount,
        admin_notes: finalNotes
      })
      .eq('id', editingBooking.id);

    if (error) {
      alert('Error al actualizar: ' + error.message);
    } else {
      // Actualizamos el estado local
      const updatedCabin = availableCabins.find(c => c.id === editForm.cabin_id);
      setBookings(bookings.map(b => b.id === editingBooking.id 
        ? { 
            ...b, 
            cabin_id: editForm.cabin_id, 
            check_in: editForm.check_in, 
            check_out: editForm.check_out,
            discount_applied: calculatedDiscount,
            admin_notes: finalNotes,
            cabin: updatedCabin ? { name: updatedCabin.name } : b.cabin 
          } 
        : b
      ));
      setEditingBooking(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#11d442]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Reservas</h2>
          <p className="text-gray-500">Administra todas las reservaciones de Rancho Carmelitas.</p>
        </div>
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
                filteredBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50 transition-all">
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-900">{booking.guest_name}</p>
                      <p className="text-xs text-gray-500">{booking.guest_email}</p>
                      <p className="text-xs text-gray-500 font-mono mt-0.5">{booking.guest_phone || 'Sin teléfono'}</p>
                    </td>

                    {/* Lógica condicional si estamos editando esta fila */}
                    {editingBooking?.id === booking.id ? (
                      <td colSpan={2} className="px-6 py-4 bg-blue-50/50 rounded-xl my-2">
                        <div className="flex gap-4 items-center">
                          <select 
                            className="p-2 border border-gray-200 rounded text-sm w-48"
                            value={editForm.cabin_id}
                            onChange={e => setEditForm({...editForm, cabin_id: e.target.value})}
                          >
                            {availableCabins.map(c => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                          <div className="flex gap-2">
                            <input 
                              type="date" 
                              className="p-2 border border-gray-200 rounded text-sm"
                              value={editForm.check_in}
                              onChange={e => setEditForm({...editForm, check_in: e.target.value})}
                            />
                            <span className="text-gray-400 self-center">-</span>
                            <input 
                              type="date" 
                              className="p-2 border border-gray-200 rounded text-sm"
                              value={editForm.check_out}
                              onChange={e => setEditForm({...editForm, check_out: e.target.value})}
                            />
                          </div>
                        </div>
                        <div className="flex flex-col gap-4 mt-3 pt-3 border-t border-blue-100">
                          <div className="flex gap-4 items-end">
                            <div>
                              <label className="block text-[10px] uppercase font-bold text-blue-700 mb-1">Descuento</label>
                              <div className="flex bg-white rounded border border-gray-200 p-0.5">
                                <button 
                                  className={`px-2 py-1 text-xs font-bold rounded transition-colors ${editForm.discount_type === 'percentage' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-50'}`}
                              onClick={() => setEditForm({...editForm, discount_type: 'percentage', discount_value: ''})}
                                >%</button>
                                <button 
                                  className={`px-2 py-1 text-xs font-bold rounded transition-colors ${editForm.discount_type === 'fixed' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-50'}`}
                              onClick={() => setEditForm({...editForm, discount_type: 'fixed', discount_value: ''})}
                                >$</button>
                              </div>
                            </div>
                            <div>
                              <label className="block text-[10px] uppercase font-bold text-blue-700 mb-1">Valor ({editForm.discount_type === 'percentage' ? '%' : '$'})</label>
                              <input 
                                type="number"
                                className="p-2 border border-gray-200 rounded text-sm w-24"
                                value={editForm.discount_value === 0 || editForm.discount_value === '' ? '' : editForm.discount_value}
                                placeholder="0"
                                min="0"
                                onChange={e => setEditForm({...editForm, discount_value: e.target.value === '' ? '' : e.target.value})}
                              />
                            </div>
                            <div className="flex-1">
                              <label className="block text-[10px] uppercase font-bold text-blue-700 mb-1">Notas Administrativas</label>
                              <input 
                                type="text"
                                className="p-2 border border-gray-200 rounded text-sm w-full"
                                placeholder="Ej: Descuento por promoción de invierno..."
                                value={editForm.admin_notes}
                                onChange={e => setEditForm({...editForm, admin_notes: e.target.value})}
                              />
                            </div>
                          </div>
                          {/* Vista previa del desglose */}
                          <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                            <h4 className="text-[10px] uppercase font-bold text-gray-500 mb-2">Vista previa del Total</h4>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between text-gray-600">
                                <span>Total Base:</span>
                                <span>${editingBooking.total_price?.toLocaleString()}</span>
                              </div>
                              {Number(editForm.discount_value) > 0 && (
                                <div className="flex justify-between text-green-600 font-medium">
                                  <span>Descuento aplicado:</span>
                                  <span>
                                    - ${editForm.discount_type === 'percentage' 
                                      ? (editingBooking.total_price * (Number(editForm.discount_value) / 100)).toLocaleString() 
                                      : Number(editForm.discount_value).toLocaleString()}
                                  </span>
                                </div>
                              )}
                              <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-100 mt-1">
                                <span>Nuevo Total a Pagar:</span>
                                <span>
                                  ${(editingBooking.total_price - (
                                    editForm.discount_type === 'percentage' 
                                      ? (editingBooking.total_price * (Number(editForm.discount_value) / 100))
                                      : (Number(editForm.discount_value) || 0)
                                  )).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    ) : (
                      <>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {booking.cabin?.name || 'Cabaña Desconocida'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(booking.check_in).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })} al {new Date(booking.check_out).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                        </td>
                      </>
                    )}

                    <td className="px-6 py-4">
                      <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 w-full max-w-[200px]">
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center text-xs text-gray-500">
                            <span>Total Base</span>
                            <span>${(booking.total_price || 0).toLocaleString()}</span>
                          </div>
                          
                          {booking.extra_guests_cost && booking.extra_guests_cost > 0 ? (
                            <div className="flex justify-between items-center text-[11px] text-orange-600 font-medium">
                              <span>+ Extras</span>
                              <span>${booking.extra_guests_cost.toLocaleString()}</span>
                            </div>
                          ) : null}

                          {booking.discount_applied && booking.discount_applied > 0 ? (
                            <div className="flex justify-between items-center text-[11px] text-green-600 font-medium">
                              <span>- Descuento</span>
                              <span>${booking.discount_applied.toLocaleString()}</span>
                            </div>
                          ) : null}
                          
                          <div className="flex justify-between items-center font-bold text-gray-900 pt-2 border-t border-gray-200 mt-1">
                            <span>Total Pagar</span>
                            <span className="text-base">${((booking.total_price || 0) - (booking.discount_applied || 0)).toLocaleString()}</span>
                          </div>
                        </div>

                        {booking.admin_notes && (
                          <div className="mt-3 pt-2 border-t border-gray-200 text-[11px] text-gray-500 bg-white p-2 rounded-lg leading-tight" title={booking.admin_notes}>
                            📝 {booking.admin_notes}
                          </div>
                        )}
                      </div>
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

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
                <p className="text-xs text-[#11d442] font-semibold mb-2">
                  Sugerido (50%): ${Math.round(((bookingToConfirm.total_price || 0) - (bookingToConfirm.discount_applied || 0)) * 0.5).toLocaleString()}
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
