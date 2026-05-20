'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

const AVAILABLE_AMENITIES = [
  "Wi-Fi de alta velocidad", "Piscina compartida", "Piscina privada", "Aire Acondicionado", 
  "Calefacción", "Cocina Equipada", "Asador exterior", "Terraza Privada", "Jacuzzi", 
  "TV por cable", "Smart TV", "Pet Friendly", "Estacionamiento privado", "Ropa de cama", 
  "Toallas", "Agua Caliente", "Vista panorámica"
];

interface Cabin {
  id: string;
  name: string;
  price_per_night: number;
  capacity: number;
  is_active: boolean;
  gallery_urls: string[];
  description: string;
  amenities: string[];
  max_extra_guests: number;
  extra_guest_surcharge_percentage: number;
}

export default function AdminCabanasPage() {
  const [cabins, setCabins] = useState<Cabin[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{name: string, price: number, capacity: number, gallery_urls: string[], description: string, amenities: string[], max_extra_guests: number, extra_guest_surcharge_percentage: number, extra_surcharge_mode: 'percentage' | 'fixed'}>({ name: '', price: 0, capacity: 0, gallery_urls: [], description: '', amenities: [], max_extra_guests: 0, extra_guest_surcharge_percentage: 100, extra_surcharge_mode: 'percentage' });
  const [isCreating, setIsCreating] = useState(false);
  const [createForm, setCreateForm] = useState<{name: string, price_per_night: number, capacity: number, description: string, amenities: string[], max_extra_guests: number, extra_guest_surcharge_percentage: number}>({
    name: '',
    price_per_night: 0,
    capacity: 2,
    description: '',
    amenities: [],
    max_extra_guests: 0,
    extra_guest_surcharge_percentage: 100,
    extra_surcharge_mode: 'percentage' as 'percentage' | 'fixed'
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

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
    setEditForm({ 
      name: cabin.name, 
      price: cabin.price_per_night, 
      capacity: cabin.capacity,
      gallery_urls: cabin.gallery_urls?.length ? cabin.gallery_urls : [''],
      description: cabin.description || '',
      amenities: cabin.amenities || [],
      max_extra_guests: cabin.max_extra_guests || 0,
      extra_guest_surcharge_percentage: cabin.extra_guest_surcharge_percentage || 100,
      extra_surcharge_mode: 'percentage'
    });
  };

  const handleUpdate = async (id: string) => {
    setUploading(true);
    let finalGalleryUrls = editForm.gallery_urls.filter(url => url.trim() !== '' && !url.startsWith('blob:')); // Preservar antiguas URLs válidas
    
    // Subir nuevos archivos locales si los hay
    if (selectedFiles.length > 0) {
      for (const file of selectedFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${id}/${fileName}`; // Folder por cabaña

        const { error: uploadError } = await supabase.storage
          .from('cabin-images')
          .upload(filePath, file);

        if (uploadError) {
          console.error('Error subiendo imagen:', uploadError);
          alert(`Hubo un error al subir ${file.name}`);
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('cabin-images')
            .getPublicUrl(filePath);
          finalGalleryUrls.push(publicUrl);
        }
      }
    }

    const { error } = await supabase
      .from('cabins')
      .update({ 
        name: editForm.name, 
        price_per_night: editForm.price,
        capacity: editForm.capacity,
        gallery_urls: finalGalleryUrls.length > 0 ? finalGalleryUrls : null,
        description: editForm.description,
        amenities: editForm.amenities.length > 0 ? editForm.amenities : null,
        max_extra_guests: editForm.max_extra_guests,
        extra_guest_surcharge_percentage: editForm.extra_guest_surcharge_percentage
      })
      .eq('id', id);

    setUploading(false);
    if (error) {
      alert('Error al actualizar: ' + error.message);
    } else {
      setEditingId(null);
      setSelectedFiles([]);
      fetchCabins();
    }
  };

  const handleCreate = async () => {
    if (!createForm.name || createForm.price_per_night <= 0) {
      alert('Por favor, ingresa un nombre y precio válido.');
      return;
    }

    setUploading(true);
    let finalGalleryUrls: string[] = [];

    // Primero insertamos la cabaña para obtener un ID, usamos ese ID como folder de imágenes
    const { data: newCabinData, error: insertError } = await supabase
      .from('cabins')
      .insert([{
        name: createForm.name,
        price_per_night: createForm.price_per_night,
        capacity: createForm.capacity,
        description: createForm.description || 'Descripción pendiente...',
        amenities: createForm.amenities.length > 0 ? createForm.amenities : null,
        is_active: true,
        max_extra_guests: createForm.max_extra_guests,
        extra_guest_surcharge_percentage: createForm.extra_guest_surcharge_percentage
      }])
      .select('id')
      .single();

    if (insertError || !newCabinData) {
      setUploading(false);
      alert('Error al crear cabaña: ' + (insertError?.message || 'ID nulo'));
      return;
    }

    const newId = newCabinData.id;

    // Subir archivos al Storage a la carpeta específica de esta cabaña (ID)
    if (selectedFiles.length > 0) {
      for (const file of selectedFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${newId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('cabin-images')
          .upload(filePath, file);

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('cabin-images')
            .getPublicUrl(filePath);
          finalGalleryUrls.push(publicUrl);
        } else {
          console.error("Fallo al subir archivo", file.name, uploadError);
        }
      }

      // Actualizamos la cabaña recién creada con las nuevas URLs de Storage
      if (finalGalleryUrls.length > 0) {
        await supabase.from('cabins').update({ gallery_urls: finalGalleryUrls }).eq('id', newId);
      }
    }

    setUploading(false);
    setIsCreating(false);
    setCreateForm({ name: '', price_per_night: 0, capacity: 2, description: '', amenities: [], max_extra_guests: 0, extra_guest_surcharge_percentage: 100, extra_surcharge_mode: 'percentage' });
    setSelectedFiles([]);
    fetchCabins();
  };

  const toggleAmenity = (formType: 'create' | 'edit', amenity: string) => {
    if (formType === 'create') {
      const isSelected = createForm.amenities.includes(amenity);
      setCreateForm({
        ...createForm, 
        amenities: isSelected ? createForm.amenities.filter(a => a !== amenity) : [...createForm.amenities, amenity]
      });
    } else {
      const isSelected = editForm.amenities.includes(amenity);
      setEditForm({
        ...editForm, 
        amenities: isSelected ? editForm.amenities.filter(a => a !== amenity) : [...editForm.amenities, amenity]
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
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
          <p className="text-gray-500">Controla los precios y el inventario de tus alojamientos.</p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="bg-[#11d442] hover:bg-green-600 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-md flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Nueva Cabaña
        </button>
      </div>

      {isCreating && (
        <div className="bg-blue-50/50 p-6 rounded-[24px] border border-blue-100 shadow-sm animate-fade-in-up">
          <h3 className="text-lg font-bold text-blue-900 mb-4">✨ Crear Nueva Cabaña</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre de Cabaña</label>
              <input 
                placeholder="Ej. Cabaña Los Pinos"
                className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" 
                value={createForm.name} 
                onChange={e => setCreateForm({...createForm, name: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Precio x Noche ($)</label>
              <input 
                type="number" 
                className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" 
                value={createForm.price_per_night || ''} 
                onChange={e => setCreateForm({...createForm, price_per_night: parseInt(e.target.value) || 0})}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Capacidad (Personas)</label>
              <input 
                type="number" 
                className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" 
                value={createForm.capacity || ''} 
                onChange={e => setCreateForm({...createForm, capacity: parseInt(e.target.value) || 0})}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Extras Máximos</label>
              <input 
                type="number" 
                className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" 
                value={createForm.max_extra_guests || ''} 
                onChange={e => setCreateForm({...createForm, max_extra_guests: parseInt(e.target.value) || 0})}
              />
            </div>
            {/* Costo por persona adicional - Crear */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Costo Persona Adicional</label>
              <div className="flex gap-2">
                <div className="flex bg-white rounded-xl border border-gray-200 p-0.5">
                  <button
                    type="button"
                    className={`px-2 py-1 text-xs font-bold rounded-lg transition-colors ${
                      createForm.extra_surcharge_mode === 'percentage' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-50'
                    }`}
                    onClick={() => setCreateForm({...createForm, extra_surcharge_mode: 'percentage'})}
                  >%</button>
                  <button
                    type="button"
                    className={`px-2 py-1 text-xs font-bold rounded-lg transition-colors ${
                      createForm.extra_surcharge_mode === 'fixed' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-50'
                    }`}
                    onClick={() => setCreateForm({...createForm, extra_surcharge_mode: 'fixed'})}
                  >$</button>
                </div>
                <input 
                  type="number" 
                  className="flex-1 px-4 py-2 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" 
                  value={createForm.extra_surcharge_mode === 'percentage'
                    ? (createForm.extra_guest_surcharge_percentage || '')
                    : (createForm.price_per_night > 0 && createForm.capacity > 0
                        ? Math.round((createForm.extra_guest_surcharge_percentage / 100) * (createForm.price_per_night / createForm.capacity))
                        : '')
                  }
                  placeholder={createForm.extra_surcharge_mode === 'percentage' ? 'Ej: 80' : 'Ej: 15000'}
                  onChange={e => {
                    const val = Number(e.target.value) || 0;
                    if (createForm.extra_surcharge_mode === 'percentage') {
                      setCreateForm({...createForm, extra_guest_surcharge_percentage: val});
                    } else {
                      // Convertir monto fijo a porcentaje para guardar
                      const pricePerPerson = createForm.price_per_night / (createForm.capacity || 1);
                      const pct = pricePerPerson > 0 ? Math.round((val / pricePerPerson) * 100) : 0;
                      setCreateForm({...createForm, extra_guest_surcharge_percentage: pct});
                    }
                  }}
                />
              </div>
              {/* Equivalencia en tiempo real */}
              {createForm.price_per_night > 0 && createForm.capacity > 0 && (
                <p className="text-[11px] mt-1.5 text-blue-700 font-medium">
                  {createForm.extra_surcharge_mode === 'percentage'
                    ? `≈ $${Math.round((createForm.extra_guest_surcharge_percentage / 100) * (createForm.price_per_night / createForm.capacity)).toLocaleString()} por persona adicional / noche`
                    : `≈ ${createForm.extra_guest_surcharge_percentage}% del precio por persona`
                  }
                </p>
              )}
            </div>
            
            <div className="md:col-span-5">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Descripción Breve</label>
              <textarea 
                className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]" 
                value={createForm.description} 
                onChange={e => setCreateForm({...createForm, description: e.target.value})}
                placeholder="Describe los encantos de esta cabaña..."
              />
            </div>
            
            <div className="md:col-span-5 mt-2">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Características y Comodidades (Selección Múltiple)</label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_AMENITIES.map((amenity) => {
                  const isSelected = createForm.amenities.includes(amenity);
                  return (
                    <button
                      key={amenity}
                      onClick={() => toggleAmenity('create', amenity)}
                      type="button"
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${isSelected ? 'bg-blue-100 border-blue-300 text-blue-800' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                    >
                      {isSelected ? '✓ ' : '+ '}{amenity}
                    </button>
                  );
                })}
              </div>
            </div>
            
            <div className="md:col-span-5 mt-2">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Galería de Fotos (Sube desde tu PC)</label>
              
              <div className="flex flex-wrap gap-4 mb-3">
                {selectedFiles.map((file, i) => (
                  <div key={i} className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200 group">
                    <img src={URL.createObjectURL(file)} alt="Preview" className="w-full h-full object-cover" />
                    <button 
                      onClick={() => removeSelectedFile(i)}
                      className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ✕ Quitar
                    </button>
                  </div>
                ))}
                
                <label className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-blue-400 transition-colors">
                  <span className="text-2xl text-gray-400">+</span>
                  <span className="text-[10px] text-gray-400 font-bold mt-1">Subir Foto</span>
                  <input 
                    type="file" 
                    multiple 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleFileChange}
                  />
                </label>
              </div>
              <p className="text-[11px] text-gray-400 font-medium">Puedes seleccionar varias fotos a la vez. Al guardar, se subirán automáticamente a Supabase.</p>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button 
              onClick={() => {
                setIsCreating(false);
                setSelectedFiles([]);
              }}
              className="px-6 py-2.5 bg-white text-gray-600 border border-gray-200 rounded-xl text-sm font-bold hover:bg-gray-50"
              disabled={uploading}
            >
              Cancelar
            </button>
            <button 
              onClick={handleCreate}
              disabled={uploading}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {uploading ? (
                <> <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> 
                Subiendo imágenes... </>
              ) : 'Guardar y Publicar'}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {cabins.map((cabin) => (
          <div key={cabin.id} className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all">
            {editingId === cabin.id ? (
              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Nombre</label>
                  <input 
                    className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-[#11d442] text-sm" 
                    value={editForm.name} 
                    onChange={e => setEditForm({...editForm, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Precio x Noche</label>
                  <input 
                    type="number" 
                    className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-[#11d442] text-sm" 
                    value={editForm.price} 
                    onChange={e => setEditForm({...editForm, price: parseInt(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Capacidad</label>
                  <input 
                    type="number" 
                    className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-[#11d442] text-sm" 
                    value={editForm.capacity} 
                    onChange={e => setEditForm({...editForm, capacity: parseInt(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Extras Máximos</label>
                  <input 
                    type="number" 
                    className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-[#11d442] text-sm" 
                    value={editForm.max_extra_guests} 
                    onChange={e => setEditForm({...editForm, max_extra_guests: parseInt(e.target.value)})}
                  />
                </div>
                {/* Costo por persona adicional - Editar */}
                <div className="md:col-span-1">
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Costo Persona Adicional</label>
                  <div className="flex gap-2">
                    <div className="flex bg-gray-50 rounded-xl border border-gray-200 p-0.5">
                      <button
                        type="button"
                        className={`px-2 py-1 text-xs font-bold rounded-lg transition-colors ${
                          editForm.extra_surcharge_mode === 'percentage' ? 'bg-[#11d442] text-white' : 'text-gray-500 hover:bg-gray-100'
                        }`}
                        onClick={() => setEditForm({...editForm, extra_surcharge_mode: 'percentage'})}
                      >%</button>
                      <button
                        type="button"
                        className={`px-2 py-1 text-xs font-bold rounded-lg transition-colors ${
                          editForm.extra_surcharge_mode === 'fixed' ? 'bg-[#11d442] text-white' : 'text-gray-500 hover:bg-gray-100'
                        }`}
                        onClick={() => setEditForm({...editForm, extra_surcharge_mode: 'fixed'})}
                      >$</button>
                    </div>
                    <input 
                      type="number" 
                      className="flex-1 px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-[#11d442] text-sm"
                      value={editForm.extra_surcharge_mode === 'percentage'
                        ? (editForm.extra_guest_surcharge_percentage || '')
                        : (editForm.price > 0 && editForm.capacity > 0
                            ? Math.round((editForm.extra_guest_surcharge_percentage / 100) * (editForm.price / editForm.capacity))
                            : '')
                      }
                      placeholder={editForm.extra_surcharge_mode === 'percentage' ? 'Ej: 80' : 'Ej: 15000'}
                      onChange={e => {
                        const val = Number(e.target.value) || 0;
                        if (editForm.extra_surcharge_mode === 'percentage') {
                          setEditForm({...editForm, extra_guest_surcharge_percentage: val});
                        } else {
                          const pricePerPerson = editForm.price / (editForm.capacity || 1);
                          const pct = pricePerPerson > 0 ? Math.round((val / pricePerPerson) * 100) : 0;
                          setEditForm({...editForm, extra_guest_surcharge_percentage: pct});
                        }
                      }}
                    />
                  </div>
                  {editForm.price > 0 && editForm.capacity > 0 && (
                    <p className="text-[11px] mt-1 text-[#11d442] font-medium">
                      {editForm.extra_surcharge_mode === 'percentage'
                        ? `≈ $${Math.round((editForm.extra_guest_surcharge_percentage / 100) * (editForm.price / editForm.capacity)).toLocaleString()} / pers. adicional`
                        : `≈ ${editForm.extra_guest_surcharge_percentage}% del precio por persona`
                      }
                    </p>
                  )}
                </div>
                
                <div className="md:col-span-3">
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Descripción</label>
                  <textarea 
                    className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-[#11d442] text-sm min-h-[60px]" 
                    value={editForm.description} 
                    onChange={e => setEditForm({...editForm, description: e.target.value})}
                  />
                </div>
                <div className="md:col-span-3 mt-2">
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Comodidades (Selección Múltiple)</label>
                  <div className="flex flex-wrap gap-1.5">
                    {AVAILABLE_AMENITIES.map((amenity) => {
                      const isSelected = editForm.amenities.includes(amenity);
                      return (
                        <button
                          key={amenity}
                          onClick={() => toggleAmenity('edit', amenity)}
                          type="button"
                          className={`px-2 py-1 rounded-md text-[11px] font-medium border transition-colors ${isSelected ? 'bg-[#11d442] text-white border-[#11d442]' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                        >
                          {isSelected ? '✓ ' : ''}{amenity}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="md:col-span-3 mt-2">
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Galería de Fotos (Sube desde tu PC)</label>
                  
                  <div className="flex flex-wrap gap-2 mb-2">
                    {/* Imágenes de Supabase (Existentes) */}
                    {editForm.gallery_urls.filter(url => url.trim() !== '').map((url, i) => (
                      <div key={`existing-${i}`} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 group">
                        <img src={url} alt={`Existente ${i}`} className="w-full h-full object-cover opacity-80" />
                        <button 
                          onClick={() => setEditForm({...editForm, gallery_urls: editForm.gallery_urls.filter((_, index) => index !== i)})}
                          className="absolute inset-0 bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold"
                          title="Eliminar permanentemente"
                        >
                          ✕ Borrar
                        </button>
                      </div>
                    ))}
                    
                    {/* Archivos Locales (Previsualización antes de subir) */}
                    {selectedFiles.map((file, i) => (
                      <div key={`new-${i}`} className="relative w-20 h-20 rounded-lg overflow-hidden border-2 border-blue-400 group">
                        <img src={URL.createObjectURL(file)} alt="Preview" className="w-full h-full object-cover" />
                        <span className="absolute bottom-0 w-full bg-blue-500 text-white text-[9px] text-center font-bold">NUEVA</span>
                        <button 
                          onClick={() => removeSelectedFile(i)}
                          className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ✕ Quitar
                        </button>
                      </div>
                    ))}
                    
                    <label className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-[#11d442] transition-colors">
                      <span className="text-xl text-gray-400">+</span>
                      <input 
                        type="file" 
                        multiple 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleFileChange}
                      />
                    </label>
                  </div>
                  <p className="text-[10px] text-gray-400">Las fotos marcadas con "NUEVA" se subirán a la nube al guardar los cambios.</p>
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
                    disabled={uploading}
                    className="px-6 py-2 bg-[#11d442] text-white rounded-xl text-sm font-bold shadow-lg shadow-[#11d44222] disabled:opacity-50"
                  >
                    {uploading ? 'Guardando...' : 'Guardar'}
                  </button>
                  <button 
                    onClick={() => {
                      setEditingId(null);
                      setSelectedFiles([]);
                    }}
                    disabled={uploading}
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
