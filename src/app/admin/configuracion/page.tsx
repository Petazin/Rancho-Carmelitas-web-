'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminConfiguracionCanalesPage() {
  const [plataformas, setPlataformas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPlatName, setNewPlatName] = useState('');
  const [newPlatCommission, setNewPlatCommission] = useState('');
  const [addingPlat, setAddingPlat] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    fetchPlataformas();
  }, []);

  async function fetchPlataformas() {
    setLoading(true);
    const { data, error } = await supabase
      .from('plataformas')
      .select('id, nombre, comision_porcentaje')
      .order('nombre');
    
    if (error) {
      console.error('Error fetching plataformas:', error);
    } else {
      setPlataformas(data || []);
    }
    setLoading(false);
  }

  const handleAddPlataforma = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlatName || newPlatCommission === '') return;
    setAddingPlat(true);
    setMessage({ text: '', type: '' });
    const commissionVal = Number(newPlatCommission) || 0;

    const { error } = await supabase.from('plataformas').insert([
      { nombre: newPlatName, comision_porcentaje: commissionVal }
    ]);

    setAddingPlat(false);
    if (error) {
      setMessage({ text: 'Error al agregar plataforma: ' + error.message, type: 'error' });
    } else {
      setNewPlatName('');
      setNewPlatCommission('');
      fetchPlataformas();
      setMessage({ text: '✓ Plataforma agregada con éxito.', type: 'success' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    }
  };

  const handleDeletePlataforma = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta plataforma de venta? Las reservas vigentes mantendrán su comisión estática pero ya no podrás seleccionarla en nuevos registros.')) return;
    setMessage({ text: '', type: '' });
    
    const { error } = await supabase.from('plataformas').delete().eq('id', id);
    if (error) {
      setMessage({ text: 'Error al eliminar plataforma: ' + error.message, type: 'error' });
    } else {
      fetchPlataformas();
      setMessage({ text: '✓ Plataforma eliminada con éxito.', type: 'success' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Configuración de Canales</h2>
        <p className="text-gray-500">Administra las plataformas externas y comisiones por defecto para tus reservas manuales.</p>
      </div>

      <div className="bg-white p-8 rounded-[24px] border border-gray-100 shadow-sm space-y-6">
        <h3 className="text-lg font-bold text-gray-900 border-b pb-4 flex items-center gap-2">
          🔌 Canales de Venta Activos
        </h3>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#11d442]"></div>
            <span className="ml-2 text-sm text-gray-500 font-semibold">Cargando canales externos...</span>
          </div>
        ) : plataformas.length === 0 ? (
          <div className="text-sm text-gray-400 italic bg-gray-50 p-6 rounded-2xl text-center border border-dashed border-gray-200">
            No hay canales externos configurados. Las reservas del PMS se clasificarán como directas.
          </div>
        ) : (
          <div className="divide-y divide-gray-100 border border-gray-150 rounded-2xl overflow-hidden bg-white shadow-inner">
            {plataformas.map((plat) => (
              <div key={plat.id} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50/50 transition-colors">
                <div>
                  <p className="font-bold text-sm text-gray-800 flex items-center gap-1.5">
                    🔌 {plat.nombre}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5 font-medium">
                    Comisión por defecto: <strong className="text-gray-700 font-bold">{plat.comision_porcentaje}%</strong>
                  </p>
                </div>
                <button
                  onClick={() => handleDeletePlataforma(plat.id)}
                  className="p-2.5 hover:bg-red-50 text-red-500 rounded-xl transition-all active:scale-95 border border-transparent hover:border-red-100 flex items-center justify-center shadow-sm hover:shadow"
                  title="Eliminar plataforma"
                >
                  <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white p-8 rounded-[24px] border border-gray-100 shadow-sm space-y-6">
        <h3 className="text-lg font-bold text-gray-900 border-b pb-4 flex items-center gap-1.5">
          ➕ Agregar Nuevo Canal de Venta
        </h3>

        <form onSubmit={handleAddPlataforma} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Nombre del Canal *</label>
              <input 
                type="text" 
                required
                className="w-full px-4 py-3 border border-gray-250 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#11d442]/30 outline-none text-sm font-semibold transition-colors"
                placeholder="Ej: Expedia, Vrbo, Booking.com"
                value={newPlatName}
                onChange={e => setNewPlatName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Comisión del Canal (%) *</label>
              <input 
                type="number" 
                required
                step="0.01"
                min="0"
                className="w-full px-4 py-3 border border-gray-250 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#11d442]/30 outline-none text-sm font-semibold transition-colors"
                placeholder="Ej: 12.5"
                value={newPlatCommission}
                onChange={e => setNewPlatCommission(e.target.value)}
              />
            </div>
          </div>
          
          <button
            type="submit"
            disabled={addingPlat || !newPlatName || newPlatCommission === ''}
            className="bg-[#11d442] hover:bg-[#0fb337] text-white px-6 py-3 rounded-xl font-bold text-sm shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
          >
            {addingPlat ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Guardando Canal...
              </>
            ) : 'Guardar y Activar Canal'}
          </button>
        </form>
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl text-sm font-bold ${message.type === 'error' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'} animate-in fade-in`}>
          {message.text}
        </div>
      )}
    </div>
  );
}
