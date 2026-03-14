'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Booking {
  id: string;
  guest_name: string;
  guest_email: string;
  cabin_id: string;
  check_in: string;
  check_out: string;
  total_price: number;
  status: string;
  created_at: string;
  confirmed_at?: string;
  confirmed_by?: string;
  cabin?: { name: string };
}

export default function ReservasPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para la Edición de Reserva
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [editForm, setEditForm] = useState({
    cabin_id: '',
    check_in: '',
    check_out: '',
  });
  const [availableCabins, setAvailableCabins] = useState<any[]>([]);

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

  const startEditing = (booking: Booking) => {
    setEditingBooking(booking);
    setEditForm({
      cabin_id: booking.cabin_id,
      check_in: booking.check_in,
      check_out: booking.check_out,
    });
  };

  const saveEdit = async () => {
    if (!editingBooking) return;
    
    // Aquí actualizamos cabaña y/o fechas en Supabase
    const { error } = await supabase
      .from('bookings')
      .update({
        cabin_id: editForm.cabin_id,
        check_in: editForm.check_in,
        check_out: editForm.check_out,
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
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    No se encontraron reservas registradas.
                  </td>
                </tr>
              ) : (
                bookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50 transition-all">
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-900">{booking.guest_name}</p>
                      <p className="text-xs text-gray-500">{booking.guest_email}</p>
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

                    <td className="px-6 py-4 text-sm font-bold text-gray-900">
                      ${booking.total_price?.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      {editingBooking?.id === booking.id ? (
                        <span className="text-gray-400 italic text-xs">Editando...</span>
                      ) : (
                        <>
                          <select 
                            value={booking.status || 'Pendiente'} 
                            onChange={(e) => updateStatus(booking.id, e.target.value)}
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
                          Editar Fechas/Cabaña
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
    </div>
  );
}
