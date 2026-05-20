'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface Booking {
  id: string;
  guest_name: string;
  check_in: string;
  check_out: string;
  total_price: number;
  status: string;
  cabin_id: string;
  cabin?: { name: string };
  isConflict?: boolean;
  payment_amount?: number;
  discount_applied?: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    bookingsCount: 0,
    activeCabins: 0,
    totalRevenue: 0,
  });
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    fetchData();
  }, [currentDate]);

  async function fetchData() {
    setLoading(true);
    // Obtener conteo de reservas
    const { count: bookingsCount } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true });

    // Obtener conteo de cabañas
    const { count: cabinsCount } = await supabase
      .from('cabins')
      .select('*', { count: 'exact', head: true });

    // Obtener ingresos totales (aproximado)
    const { data: revenueData } = await supabase
      .from('bookings')
      .select('total_price')
      .neq('status', 'Cancelada'); 
    
    const revenue = revenueData?.reduce((acc, curr) => acc + (curr.total_price || 0), 0) || 0;

    // Obtener reservas para el mes actual mostrado en el calendario (margen de -1 a +1 mes por si acaso)
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const startDateDate = new Date(year, month - 1, 1);
    const endDateDate = new Date(year, month + 2, 0);

    const startDate = `${startDateDate.getFullYear()}-${String(startDateDate.getMonth() + 1).padStart(2, '0')}-01`;
    const endDate = `${endDateDate.getFullYear()}-${String(endDateDate.getMonth() + 1).padStart(2, '0')}-${String(endDateDate.getDate()).padStart(2, '0')}`;

    const { data: bookingsData } = await supabase
      .from('bookings')
      .select(`
        id,
        guest_name,
        check_in,
        check_out,
        total_price,
        status,
        cabin_id,
        payment_amount,
        discount_applied,
        cabin:cabins (name)
      `)
      .gte('check_out', startDate)
      .lte('check_in', endDate)
      .order('check_in', { ascending: true });

    const rawBookings = (bookingsData as any) || [];

    // Lógica de detección de conflictos (overbooking)
    const bookingsWithConflicts = rawBookings.map((b: Booking) => {
      const conflict = rawBookings.find((other: Booking) => {
        if (other.id === b.id) return false;
        if (other.status === 'Cancelada' || b.status === 'Cancelada') return false;
        if (other.cabin_id !== b.cabin_id) return false;
        
        // Verifica si los rangos de fecha se cruzan (solapamiento)
        return b.check_in < other.check_out && b.check_out > other.check_in;
      });
      return { ...b, isConflict: !!conflict };
    });

    setStats({
      bookingsCount: bookingsCount || 0,
      activeCabins: cabinsCount || 0,
      totalRevenue: revenue,
    });
    setUpcomingBookings(bookingsWithConflicts);
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

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay(); // 0 is Sunday
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    // Espacios vacíos al principio del mes
    for (let i = 0; i < firstDay; i++) {
        days.push(<div key={`empty-${i}`} className="p-2 bg-gray-50/50 min-h-[100px]"></div>);
    }
    
    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month+1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        
        // Reservas que chocaban con este día
        const dayBookings = upcomingBookings.filter(b => {
             // asumiendo check_out es salida por la mañana, por lo que la noche anterior cuenta.
             return dateStr >= b.check_in && dateStr < b.check_out && b.status !== 'Cancelada'; 
        });
        
        const isToday = new Date().toISOString().split('T')[0] === dateStr;

        days.push(
            <div key={d} className={`p-2 border-l border-t border-gray-100 min-h-[100px] bg-white transition-all hover:bg-gray-50 ${isToday ? 'ring-2 ring-inset ring-[#11d442] bg-green-50/10' : ''}`}>
                <div className={`text-xs font-bold mb-1 ${isToday ? 'text-[#11d442]' : 'text-gray-500'}`}>
                  {d}
                </div>
                <div className="flex flex-col gap-1">
                    {dayBookings.map(b => {
                        const statusLower = (b.status || 'Pendiente').toLowerCase();
                        const isConfirmed = statusLower === 'confirmada';
                        const totalToPay = (b.total_price || 0) - (b.discount_applied || 0);
                        const isFullyPaid = isConfirmed && (b.payment_amount || 0) >= totalToPay;
                        const isAbonada = isConfirmed && !isFullyPaid && (b.payment_amount || 0) > 0;

                        let colorClasses = "bg-yellow-50 text-yellow-700 border-yellow-200"; // Default: Pendiente (Amarillo)
                        let labelPrefix = "🟡 ";

                        if (b.isConflict) {
                          colorClasses = "bg-red-100 text-red-700 border-red-300";
                          labelPrefix = "⚠️ ";
                        } else if (isFullyPaid) {
                          colorClasses = "bg-blue-50 text-blue-700 border-blue-200";
                          labelPrefix = "🔵 ";
                        } else if (isAbonada) {
                          colorClasses = "bg-green-50 text-green-700 border-green-200";
                          labelPrefix = "🟢 ";
                        } else if (isConfirmed) {
                          // Confirmada pero sin abono aún (0 o nulo)
                          colorClasses = "bg-orange-50 text-orange-700 border-orange-200";
                          labelPrefix = "🟠 ";
                        }

                        return (
                          <Link 
                            key={b.id} 
                            href={`/admin/reservas?id=${b.id}`}
                            className={`text-[10px] px-1.5 py-1 rounded font-bold truncate border transition-all block cursor-pointer hover:shadow-sm ${colorClasses}`} 
                            title={`${b.guest_name} - ${b.cabin?.name || ''}${b.isConflict ? ' (⚠️ Requiere atención por conflicto de fechas)' : ''} - Estado: ${b.status}`}
                          >
                              {labelPrefix}
                              {b.guest_name}: {b.cabin?.name || 'Cabaña'}
                          </Link>
                        );
                    })}
                </div>
            </div>
        );
    }
    
    return (
        <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <button 
                  onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
                  className="px-3 py-1.5 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-gray-200 transition-all font-bold text-gray-600 text-sm"
                >&lt; Anterior</button>
                <h3 className="font-bold text-gray-900 text-lg capitalize">
                  {currentDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}
                </h3>
                <button 
                  onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
                  className="px-3 py-1.5 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-gray-200 transition-all font-bold text-gray-600 text-sm"
                >Siguiente &gt;</button>
            </div>
            <div className="grid grid-cols-7 border-t border-l border-gray-100">
                {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(d => (
                    <div key={d} className="bg-gray-50 p-3 text-center text-xs font-bold text-gray-500 uppercase border-r border-b border-gray-100">{d}</div>
                ))}
                {days.map((day, i) => (
                  <div key={i} className="border-r border-b border-gray-100">{day}</div>
                ))}
            </div>
            <div className="flex flex-wrap gap-4 p-4 border-t border-gray-100 bg-gray-50/50 justify-center text-[10px] font-bold uppercase tracking-wider text-gray-500">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-yellow-400"></span> 🟡 Pendiente (No Confirmada)</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-400"></span> 🟠 Confirmada (Sin Abono)</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#11d442]"></span> 🟢 Abonada (50%)</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> 🔵 Totalmente Pagada</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> 🔴 Conflicto de Fechas</span>
            </div>
        </div>
    );
  };

  if (loading && upcomingBookings.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#11d442]"></div>
      </div>
    );
  }

  // Filtrar próximas llegadas a partir de HOY para la vista de lista (max 5)
  const localDate = new Date();
  const todayStr = `${localDate.getFullYear()}-${String(localDate.getMonth() + 1).padStart(2, '0')}-${String(localDate.getDate()).padStart(2, '0')}`;
  
  const nextListBookings = upcomingBookings
    .filter(b => b.check_in >= todayStr)
    .sort((a, b) => a.check_in.localeCompare(b.check_in))
    .slice(0, 5);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-gray-900">Bienvenido al Dashboard</h2>
        <p className="text-gray-500">Esto es lo que está pasando en Rancho Carmelitas.</p>
      </div>

      {/* Tarjetas de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1 */}
        <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-500" />
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm font-medium">Reservas Registradas</p>
            <h3 className="text-3xl font-bold text-gray-900 mt-1">{stats.bookingsCount}</h3>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-500" />
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm font-medium">Cabañas Activas</p>
            <h3 className="text-3xl font-bold text-gray-900 mt-1">{stats.activeCabins}</h3>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-500" />
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-yellow-50 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm font-medium">Ingresos Históricos</p>
            <h3 className="text-3xl font-bold text-gray-900 mt-1">${stats.totalRevenue.toLocaleString()}</h3>
          </div>
        </div>
      </div>

      {/* Sección Próximas Reservas */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900">Agenda de Reservas</h3>
          
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button 
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Lista
            </button>
            <button 
              onClick={() => setViewMode('calendar')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'calendar' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Calendario
            </button>
          </div>
        </div>

        {viewMode === 'list' ? (
          <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden animate-in fade-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Próximas Llegadas Inminentes</h3>
              <Link href="/admin/reservas" className="text-sm text-[#11d442] font-medium hover:underline focus:outline-none">
                Ir a todas
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50/50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Huésped</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Cabaña</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Check-in</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {nextListBookings.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-gray-400 text-sm">
                        No hay reservas inminentes registradas.
                      </td>
                    </tr>
                  ) : (
                    nextListBookings.map((booking) => (
                      <tr key={booking.id} className="hover:bg-gray-50/80 transition-all">
                        <td className="px-6 py-4 font-bold text-[#11d442] hover:underline text-sm">
                          <Link href={`/admin/reservas?id=${booking.id}`} className="flex items-center gap-2">
                            {booking.guest_name}
                            {booking.isConflict && (
                              <span className="flex items-center gap-1 bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-[10px] uppercase whitespace-nowrap" title="Conflicto de fechas en la misma cabaña">
                                ⚠️ Conflicto
                              </span>
                            )}
                          </Link>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {booking.cabin?.name || 'Cabaña Desconocida'}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {new Date(booking.check_in).toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: 'short' })}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-[10px] uppercase font-bold ${getStatusColor(booking.status || 'Pendiente')}`}>
                            {booking.status || 'Pendiente'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in zoom-in-95 duration-300">
            {renderCalendar()}
          </div>
        )}
      </div>
    </div>
  );
}
