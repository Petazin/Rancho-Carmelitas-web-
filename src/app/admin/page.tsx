'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    bookingsCount: 0,
    activeCabins: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
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
        .select('total_price');
      
      const revenue = revenueData?.reduce((acc, curr) => acc + (curr.total_price || 0), 0) || 0;

      setStats({
        bookingsCount: bookingsCount || 0,
        activeCabins: cabinsCount || 0,
        totalRevenue: revenue,
      });
      setLoading(false);
    }

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#11d442]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-gray-900">Bienvenido al Dashboard</h2>
        <p className="text-gray-500">Esto es lo que está pasando en Rancho Carmelitas.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1 */}
        <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-gray-500 text-sm font-medium">Reservas Totales</p>
          <h3 className="text-3xl font-bold text-gray-900 mt-1">{stats.bookingsCount}</h3>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <p className="text-gray-500 text-sm font-medium">Cabañas Activas</p>
          <h3 className="text-3xl font-bold text-gray-900 mt-1">{stats.activeCabins}</h3>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-yellow-50 flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-gray-500 text-sm font-medium">Ingresos Proyectados</p>
          <h3 className="text-3xl font-bold text-gray-900 mt-1">${stats.totalRevenue.toLocaleString()}</h3>
        </div>
      </div>

      {/* Placeholder para próximas llegadas */}
      <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-900">Próximas Reservas</h3>
          <button className="text-sm text-[#11d442] font-medium hover:underline">Ver todas</button>
        </div>
        <div className="p-8 text-center text-gray-400">
          <p>Próximamente: Lista detallada de reservaciones filtradas por fecha.</p>
        </div>
      </div>
    </div>
  );
}
