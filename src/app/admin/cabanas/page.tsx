'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Cabin {
  id: string;
  name: string;
  price_per_night: number;
  capacity: number;
  is_active: boolean;
}

export default function AdminCabanasPage() {
  const [cabins, setCabins] = useState<Cabin[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', price: 0, capacity: 0 });

  useEffect(() => {
    fetchCabins();
  }, []);

  async function fetchCabins() {
    const { data, error } = await supabase
      .from('cabins')
      .select('*')
      .order('name');
    
    if (error) console.error('Error fetching cabins:', error);
    else setCabins(data || []);
    setLoading(false);
  }

  const handleEdit = (cabin: Cabin) => {
    setEditingId(cabin.id);
    setEditForm({ name: cabin.name, price: cabin.price_per_night, capacity: cabin.capacity });
  };

  const handleUpdate = async (id: string) => {
    const { error } = await supabase
      .from('cabins')
      .update({ 
        name: editForm.name, 
        price_per_night: editForm.price,
        capacity: editForm.capacity 
      })
      .eq('id', id);

    if (error) {
      alert('Error al actualizar: ' + error.message);
    } else {
      setEditingId(null);
      fetchCabins();
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('cabins')
      .update({ is_active: !currentStatus })
      .eq('id', id);

    if (error) {
      alert('Error: ' + error.message);
    } else {
      fetchCabins();
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Cargando cabañas...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Cabañas</h2>
          <p className="text-gray-500">Controla los precios y la configuración de tus alojamientos.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {cabins.map((cabin) => (
          <div key={cabin.id} className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all">
            {editingId === cabin.id ? (
              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Nombre</label>
                  <input 
                    className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-[#11d442]" 
                    value={editForm.name} 
                    onChange={e => setEditForm({...editForm, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Precio x Noche</label>
                  <input 
                    type="number" 
                    className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-[#11d442]" 
                    value={editForm.price} 
                    onChange={e => setEditForm({...editForm, price: parseInt(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Capacidad</label>
                  <input 
                    type="number" 
                    className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-[#11d442]" 
                    value={editForm.capacity} 
                    onChange={e => setEditForm({...editForm, capacity: parseInt(e.target.value)})}
                  />
                </div>
              </div>
            ) : (
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900">{cabin.name}</h3>
                <div className="flex flex-wrap gap-4 mt-1 items-center">
                  <span className="text-sm text-gray-500">👥 Capacidad: {cabin.capacity} pers.</span>
                  <span className="text-sm font-bold text-[#11d442]">💰 ${cabin.price_per_night.toLocaleString()} / noche</span>
                  <button 
                    onClick={() => toggleActive(cabin.id, cabin.is_active)}
                    className={`text-[10px] font-bold uppercase px-3 py-1 rounded-full transition-all cursor-pointer ${cabin.is_active ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
                  >
                    {cabin.is_active ? '● Activa' : '○ Inactiva'}
                  </button>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              {editingId === cabin.id ? (
                <>
                  <button 
                    onClick={() => handleUpdate(cabin.id)}
                    className="px-6 py-2 bg-[#11d442] text-white rounded-xl text-sm font-bold shadow-lg shadow-[#11d44222]"
                  >
                    Guardar
                  </button>
                  <button 
                    onClick={() => setEditingId(null)}
                    className="px-6 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-200"
                  >
                    Cancelar
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => handleEdit(cabin)}
                  className="px-6 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all shadow-sm"
                >
                  Editar Ajustes
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
