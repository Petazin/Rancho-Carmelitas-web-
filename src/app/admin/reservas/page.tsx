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
  cabin?: { name: string };
}

export default function ReservasPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

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
    const { error } = await supabase
      .from('bookings')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      alert('Error: ' + error.message);
    } else {
      setBookings(bookings.map(b => b.id === id ? { ...b, status: newStatus } : b));
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
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {booking.cabin?.name || 'Cabaña Desconocida'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(booking.check_in).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })} al {new Date(booking.check_out).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900">
                      ${booking.total_price?.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <select 
                        value={booking.status || 'Pendiente'} 
                        onChange={(e) => updateStatus(booking.id, e.target.value)}
                        className={`px-3 py-1 rounded-full text-xs font-bold border-none cursor-pointer outline-none transition-all ${getStatusColor(booking.status || 'Pendiente')}`}
                      >
                        <option value="Pendiente">Pendiente</option>
                        <option value="Confirmada">Confirmada</option>
                        <option value="Cancelada">Cancelada</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <button className="text-[#11d442] text-sm font-medium hover:underline">Ver Detalles</button>
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
