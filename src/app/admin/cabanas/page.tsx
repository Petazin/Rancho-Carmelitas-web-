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
  image_url?: string;
  gallery_urls: string[];
  description: string;
  amenities: string[];
  max_extra_guests: number;
  extra_guest_surcharge_percentage: number;
  housekeeping_status?: string;
  slogan?: string;
  origin_title?: string;
  origin_description?: string;
  fun_fact?: string;
}

export default function AdminCabanasPage() {
  const [cabins, setCabins] = useState<Cabin[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{name: string, price: number, capacity: number, image_url: string, gallery_urls: string[], description: string, amenities: string[], max_extra_guests: number, extra_guest_surcharge_percentage: number, extra_surcharge_mode: 'percentage' | 'fixed', slogan: string, origin_title: string, origin_description: string, fun_fact: string}>({ name: '', price: 0, capacity: 0, image_url: '', gallery_urls: [], description: '', amenities: [], max_extra_guests: 0, extra_guest_surcharge_percentage: 100, extra_surcharge_mode: 'percentage', slogan: '', origin_title: '¿Por qué este nombre?', origin_description: '', fun_fact: '' });
  const [isCreating, setIsCreating] = useState(false);
  const [createForm, setCreateForm] = useState<{name: string, price_per_night: number, capacity: number, image_url: string, description: string, amenities: string[], max_extra_guests: number, extra_guest_surcharge_percentage: number, extra_surcharge_mode: 'percentage' | 'fixed', slogan: string, origin_title: string, origin_description: string, fun_fact: string}>({
    name: '',
    price_per_night: 0,
    capacity: 2,
    image_url: '',
    description: '',
    amenities: [],
    max_extra_guests: 0,
    extra_guest_surcharge_percentage: 100,
    extra_surcharge_mode: 'percentage' as 'percentage' | 'fixed',
    slogan: '',
    origin_title: '¿Por qué este nombre?',
    origin_description: '',
    fun_fact: ''
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Estados de cierres temporales
  const [closures, setClosures] = useState<any[]>([]);
  const [loadingClosures, setLoadingClosures] = useState(true);
  const [isCreatingClosure, setIsCreatingClosure] = useState(false);
  const [closureForm, setClosureForm] = useState({
    cabin_id: '', // '' o 'ALL' indica cierre total
    start_date: '',
    end_date: '',
    reason: 'Vacaciones'
  });

  const [userProfile, setUserProfile] = useState<{ id: string; role: string } | null>(null);

  useEffect(() => {
    fetchCabins();
    fetchClosures();
    getUserProfile();
  }, []);

  async function getUserProfile() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('id', session.user.id)
        .single();
      
      if (!error && data) {
        setUserProfile(data);
      }
    }
  }

  async function fetchCabins() {
    const { data, error } = await supabase
      .from('cabins')
      .select('*')
      .order('name');
    
    if (error) console.error('Error fetching cabins:', error);
    else setCabins(data || []);
    setLoading(false);
  }

  async function fetchClosures() {
    setLoadingClosures(true);
    const { data, error } = await supabase
      .from('cabin_closures')
      .select(`
        *,
        cabin:cabins(name)
      `)
      .order('start_date', { ascending: true });

    if (error) console.error('Error fetching closures:', error);
    else setClosures(data || []);
    setLoadingClosures(false);
  }

  async function checkForBookingConflicts(cabinId: string | null, startStr: string, endStr: string) {
    let query = supabase
      .from('bookings')
      .select(`
        id,
        guest_name,
        check_in,
        check_out,
        cabin:cabins(name)
      `)
      .neq('status', 'Cancelada');

    if (cabinId) {
      query = query.eq('cabin_id', cabinId);
    }

    const { data: bookingsData } = await query;
    if (!bookingsData) return [];

    const selectedIn = new Date(startStr);
    const selectedOut = new Date(endStr);

    return bookingsData.filter(b => {
      const bIn = new Date(b.check_in);
      const bOut = new Date(b.check_out);
      return selectedIn <= bOut && selectedOut >= bIn;
    });
  }

  const handleCreateClosure = async () => {
    const { cabin_id, start_date, end_date, reason } = closureForm;
    if (!start_date || !end_date || !reason) {
      alert('Por favor, completa las fechas y el motivo del cierre.');
      return;
    }

    if (start_date > end_date) {
      alert('La fecha de inicio no puede ser posterior a la fecha de término.');
      return;
    }

    setUploading(true);
    const targetCabinId = (cabin_id === '' || cabin_id === 'ALL') ? null : cabin_id;

    // 1. Detección preventiva de conflictos de reservas
    const conflicts = await checkForBookingConflicts(targetCabinId, start_date, end_date);
    if (conflicts.length > 0) {
      const conflictMsg = conflicts
        .map(c => {
          const cabinObj = Array.isArray(c.cabin) ? c.cabin[0] : (c.cabin as any);
          return `- ${c.guest_name} en ${cabinObj?.name || 'Cabaña'} (${c.check_in} a ${c.check_out})`;
        })
        .join('\n');
      
      const confirmForce = window.confirm(
        `🚨 ¡ALERTA CRÍTICA DE CONFLICTO DE RESERVAS!\n\n` +
        `Existen reservas activas registradas para el periodo seleccionado:\n\n` +
        `${conflictMsg}\n\n` +
        `Si procedes, se registrará el cierre de todas formas, pero el PMS inyectará un banner rojo animado de alerta intensa hasta que canceles o reubiques esas reservas.\n\n` +
        `¿Deseas forzar la creación del cierre?`
      );

      if (!confirmForce) {
        setUploading(false);
        return;
      }
    }

    // 2. Registro del cierre en base de datos
    const { error } = await supabase
      .from('cabin_closures')
      .insert([{
        cabin_id: targetCabinId,
        start_date,
        end_date,
        reason
      }]);

    setUploading(false);
    if (error) {
      alert('Error al crear el cierre: ' + error.message);
    } else {
      setIsCreatingClosure(false);
      setClosureForm({
        cabin_id: '',
        start_date: '',
        end_date: '',
        reason: 'Vacaciones'
      });
      fetchClosures();
    }
  };

  const handleDeleteClosure = async (id: string) => {
    const confirmDelete = window.confirm('¿Estás seguro de que deseas eliminar este cierre y reactivar la disponibilidad de la cabaña?');
    if (!confirmDelete) return;

    const { error } = await supabase
      .from('cabin_closures')
      .delete()
      .eq('id', id);

    if (error) {
      alert('Error al eliminar el cierre: ' + error.message);
    } else {
      fetchClosures();
    }
  };

  const handleEdit = (cabin: Cabin) => {
    setEditingId(cabin.id);
    setEditForm({ 
      name: cabin.name, 
      price: cabin.price_per_night, 
      capacity: cabin.capacity,
      image_url: cabin.image_url || '',
      gallery_urls: cabin.gallery_urls?.length ? cabin.gallery_urls : [''],
      description: cabin.description || '',
      amenities: cabin.amenities || [],
      max_extra_guests: cabin.max_extra_guests || 0,
      extra_guest_surcharge_percentage: cabin.extra_guest_surcharge_percentage || 100,
      extra_surcharge_mode: 'percentage',
      slogan: cabin.slogan || '',
      origin_title: cabin.origin_title || '¿Por qué este nombre?',
      origin_description: cabin.origin_description || '',
      fun_fact: cabin.fun_fact || ''
    });
  };

  const handleUpdate = async (id: string) => {
    setUploading(true);
    let finalGalleryUrls = editForm.gallery_urls.filter(url => url.trim() !== '' && !url.startsWith('blob:')); // Preservar antiguas URLs válidas
    let finalImageUrl = editForm.image_url;

    // Subir nueva foto de portada si está seleccionada
    if (coverFile) {
      const fileExt = coverFile.name.split('.').pop();
      const fileName = `cover_${Math.random()}.${fileExt}`;
      const filePath = `${id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('cabin-images')
        .upload(filePath, coverFile);

      if (uploadError) {
        console.error('Error subiendo foto de portada:', uploadError);
        alert(`Hubo un error al subir la portada: ${coverFile.name}`);
      } else {
        const { data: { publicUrl } } = supabase.storage
          .from('cabin-images')
          .getPublicUrl(filePath);
        finalImageUrl = publicUrl;
      }
    }
    
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
        image_url: finalImageUrl || null,
        gallery_urls: finalGalleryUrls.length > 0 ? finalGalleryUrls : null,
        description: editForm.description,
        amenities: editForm.amenities.length > 0 ? editForm.amenities : null,
        max_extra_guests: editForm.max_extra_guests,
        extra_guest_surcharge_percentage: editForm.extra_guest_surcharge_percentage,
        slogan: editForm.slogan || null,
        origin_title: editForm.origin_title || '¿Por qué este nombre?',
        origin_description: editForm.origin_description || null,
        fun_fact: editForm.fun_fact || null
      })
      .eq('id', id);

    setUploading(false);
    if (error) {
      alert('Error al actualizar: ' + error.message);
    } else {
      setEditingId(null);
      setSelectedFiles([]);
      setCoverFile(null);
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
    let finalImageUrl = '';

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
        extra_guest_surcharge_percentage: createForm.extra_guest_surcharge_percentage,
        slogan: createForm.slogan || null,
        origin_title: createForm.origin_title || '¿Por qué este nombre?',
        origin_description: createForm.origin_description || null,
        fun_fact: createForm.fun_fact || null
      }])
      .select('id')
      .single();

    if (insertError || !newCabinData) {
      setUploading(false);
      alert('Error al crear cabaña: ' + (insertError?.message || 'ID nulo'));
      return;
    }

    const newId = newCabinData.id;

    // Subir foto de portada si está seleccionada
    if (coverFile) {
      const fileExt = coverFile.name.split('.').pop();
      const fileName = `cover_${Math.random()}.${fileExt}`;
      const filePath = `${newId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('cabin-images')
        .upload(filePath, coverFile);

      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage
          .from('cabin-images')
          .getPublicUrl(filePath);
        finalImageUrl = publicUrl;
      } else {
        console.error("Fallo al subir foto de portada", coverFile.name, uploadError);
      }
    }

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
    }

    // Actualizamos la cabaña recién creada con las nuevas URLs de Storage
    const updatePayload: any = {};
    if (finalImageUrl) updatePayload.image_url = finalImageUrl;
    if (finalGalleryUrls.length > 0) updatePayload.gallery_urls = finalGalleryUrls;

    if (Object.keys(updatePayload).length > 0) {
      await supabase.from('cabins').update(updatePayload).eq('id', newId);
    }

    setUploading(false);
    setIsCreating(false);
    setCreateForm({ name: '', price_per_night: 0, capacity: 2, image_url: '', description: '', amenities: [], max_extra_guests: 0, extra_guest_surcharge_percentage: 100, extra_surcharge_mode: 'percentage', slogan: '', origin_title: '¿Por qué este nombre?', origin_description: '', fun_fact: '' });
    setSelectedFiles([]);
    setCoverFile(null);
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

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCoverFile(e.target.files[0]);
    }
  };

  const removeCoverFile = () => {
    setCoverFile(null);
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

  const handleDeleteCabin = async (cabin: Cabin) => {
    // 1. Verificar rol de administrador
    if (userProfile?.role !== 'admin') {
      alert('Acceso Denegado: Solo los usuarios con rol Administrador pueden eliminar cabañas.');
      return;
    }

    // 2. Confirmación previa
    const confirmDelete = window.confirm(
      `⚠️ ¿Estás completamente seguro de que deseas eliminar permanentemente la cabaña "${cabin.name}"?\n\n` +
      `Esta acción no se puede deshacer, y eliminará de forma automática todos los bloqueos temporales asociados.`
    );
    if (!confirmDelete) return;

    setUploading(true);

    try {
      // 3. Consultar si existen reservas futuras o en curso (check_out >= hoy)
      const todayStr = new Date().toISOString().split('T')[0];
      const { data: futureBookings, error: bookingError } = await supabase
        .from('bookings')
        .select('id, guest_name, check_in, check_out, status')
        .eq('cabin_id', cabin.id)
        .neq('status', 'Cancelada')
        .gte('check_out', todayStr);

      if (bookingError) {
        throw new Error('Error al validar reservas futuras: ' + bookingError.message);
      }

      if (futureBookings && futureBookings.length > 0) {
        const bookingsList = futureBookings
          .map(b => `- ${b.guest_name} (${b.check_in} al ${b.check_out}) [Estado: ${b.status}]`)
          .join('\n');
        
        alert(
          `🚨 NO SE PUEDE ELIMINAR LA CABAÑA\n\n` +
          `La cabaña "${cabin.name}" tiene reservas activas programadas en el futuro o en curso:\n\n` +
          `${bookingsList}\n\n` +
          `Para poder eliminar esta cabaña, debes cambiar el estado de estas reservas a "Cancelada" o reubicarlas primero.`
        );
        setUploading(false);
        return;
      }

      // 4. Proceder a eliminar de Supabase
      const { error: deleteError } = await supabase
        .from('cabins')
        .delete()
        .eq('id', cabin.id);

      if (deleteError) {
        throw deleteError;
      }

      alert(`✅ Cabaña "${cabin.name}" eliminada exitosamente.`);
      fetchCabins();
    } catch (err: any) {
      console.error('Error al eliminar cabaña:', err);
      alert('Error al intentar eliminar la cabaña: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleCompleteCleaning = async (cabinId: string) => {
    setUploading(true);
    try {
      const { error } = await supabase
        .from('cabins')
        .update({ housekeeping_status: 'Disponible' })
        .eq('id', cabinId);

      if (error) throw error;

      alert('Limpieza registrada con éxito. La cabaña vuelve a figurar como Disponible.');
      fetchCabins();
    } catch (err: any) {
      console.error('Error al registrar limpieza:', err);
      alert('Error al registrar limpieza: ' + err.message);
    } finally {
      setUploading(false);
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

      {/* ========================================================================= */}
      {/* SECCIÓN OPERATIVA: AUDITORÍA DE ASEO Y HOUSEKEEPING (PMS FASE 2)          */}
      {/* ========================================================================= */}
      {(() => {
        const dirtyCabins = cabins.filter(c => c.housekeeping_status === 'Necesita Aseo');
        if (dirtyCabins.length === 0) return null;

        return (
          <div className="bg-red-50/50 p-6 rounded-[24px] border border-red-100 shadow-md space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-start gap-4">
              <div className="text-3xl animate-bounce">🧼</div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-red-900 uppercase tracking-wider font-sans">
                  Auditoría de Limpieza Requerida ({dirtyCabins.length})
                </h3>
                <p className="text-xs text-red-700 font-semibold leading-relaxed">
                  Las siguientes cabañas han completado Check-Out o han sido marcadas para mantención/aseo físico. El personal de aseo debe registrar la finalización del servicio para reactivar su disponibilidad pública:
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {dirtyCabins.map(cabin => (
                <div key={cabin.id} className="bg-white p-4 rounded-2xl border border-red-100 flex justify-between items-center shadow-sm">
                  <div>
                    <p className="font-bold text-gray-900 text-sm">🏡 {cabin.name}</p>
                    <span className="inline-block mt-1 text-[9px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                      🧼 Necesita Aseo
                    </span>
                  </div>
                  <button
                    onClick={() => handleCompleteCleaning(cabin.id)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs shadow-sm transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
                  >
                    🧼 Registrar Limpia
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

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
            
            {/* 🎭 Conexión e Identidad Local (Pullally) - Crear */}
            <div className="md:col-span-5 p-5 bg-[#fef9f3]/60 rounded-3xl border border-orange-100 shadow-sm space-y-4">
              <h4 className="text-sm font-bold text-orange-950 uppercase tracking-wider flex items-center gap-2">
                🎭 Conexión e Identidad Local (Pullally)
              </h4>
              <p className="text-[11px] text-orange-800 font-medium">
                Conecta esta cabaña con la historia, geografía o cultura de Pullally. Se desplegará en la pestaña interactiva de detalles de la cabaña.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Lema o Bajada</label>
                  <input 
                    placeholder="Ej: Un viaje en el tiempo"
                    className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-300 text-sm" 
                    value={createForm.slogan || ''} 
                    onChange={e => setCreateForm({...createForm, slogan: e.target.value})}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Título de la Reseña</label>
                  <input 
                    placeholder="Ej: ¿Por qué este nombre?"
                    className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-300 text-sm" 
                    value={createForm.origin_title || '¿Por qué este nombre?'} 
                    onChange={e => setCreateForm({...createForm, origin_title: e.target.value})}
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Reseña Histórica o Relación con Pullally</label>
                  <textarea 
                    placeholder="Describe por qué se llama así y qué relación tiene con Pullally..."
                    className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-300 text-sm min-h-[80px]" 
                    value={createForm.origin_description || ''} 
                    onChange={e => setCreateForm({...createForm, origin_description: e.target.value})}
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">💡 Dato Curioso o Tip Local</label>
                  <textarea 
                    placeholder="Ej: ¡Imagina que hace un siglo todo este territorio era prácticamente el patio de un solo gran 'Palacio'!"
                    className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-300 text-sm min-h-[60px]" 
                    value={createForm.fun_fact || ''} 
                    onChange={e => setCreateForm({...createForm, fun_fact: e.target.value})}
                  />
                </div>
              </div>
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
            
            {/* Foto de Portada Principal - Crear */}
            <div className="md:col-span-5 mt-4 p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
              <label className="block text-sm font-bold text-gray-800 mb-1 flex items-center gap-1.5">
                📸 FOTO DE PORTADA PRINCIPAL (OFICIAL)
              </label>
              <p className="text-xs text-gray-500 mb-3">
                📐 **Aspecto 3:2 recomendado (ej: 1200x800 px)**. Se despliega en la lista de cabañas del Home público y en resúmenes de pago.
              </p>
              
              <div className="flex items-center gap-4">
                {coverFile ? (
                  <div className="relative w-36 h-24 rounded-xl overflow-hidden border-2 border-[#11d442] shadow-sm group">
                    <img src={URL.createObjectURL(coverFile)} alt="Preview Portada" className="w-full h-full object-cover" />
                    <span className="absolute bottom-0 w-full bg-[#11d442] text-white text-[9px] text-center font-bold py-0.5">📸 PORTADA SELECCIONADA</span>
                    <button 
                      onClick={removeCoverFile}
                      type="button"
                      className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold"
                    >
                      ✕ Cambiar Foto
                    </button>
                  </div>
                ) : (
                  <label className="w-36 h-24 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:bg-white hover:border-[#11d442] transition-all bg-white/50 shadow-sm">
                    <span className="text-xl text-gray-400">📸</span>
                    <span className="text-[10px] text-gray-500 font-bold mt-1 text-center px-2">Cargar Portada</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleCoverChange}
                    />
                  </label>
                )}
                
                <div className="flex-1 text-xs text-gray-400 font-medium">
                  {coverFile ? (
                    <span className="text-[#11d442] font-semibold">✓ Imagen cargada: {coverFile.name} ({(coverFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                  ) : (
                    <span>Sube la foto principal del alojamiento. Esta foto es independiente de la galería de instalaciones.</span>
                  )}
                </div>
              </div>
            </div>

            {/* Galería de Fotos - Crear */}
            <div className="md:col-span-5 mt-4 p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
              <label className="block text-sm font-bold text-gray-800 mb-1">
                🖼️ GALERÍA DE FOTOS Y PANORÁMICAS
              </label>
              <div className="mb-4 bg-white/80 p-3 rounded-xl border border-gray-200 text-xs text-gray-600 space-y-1 shadow-sm">
                <p className="font-bold text-gray-700">📌 Guía de Posicionamiento en el Sitio Web:</p>
                <ul className="list-disc pl-4 space-y-0.5">
                  <li><span className="font-semibold text-blue-700">1ª Foto (🌌 Banner Superior):</span> Se utiliza automáticamente como fondo de pantalla panorámica en el detalle de la cabaña. Recomendado: **1920x1080 px (16:9)**.</li>
                  <li><span className="font-semibold text-gray-600">Fotos 2 en adelante (🖼️ Carrusel):</span> Se muestran en el carrusel de comodidades de la cabaña. Recomendado: **1200x800 px (3:2)**.</li>
                </ul>
              </div>
              
              <div className="flex flex-wrap gap-4 mb-3">
                {selectedFiles.map((file, i) => {
                  const isHeroBanner = i === 0;
                  return (
                    <div 
                      key={i} 
                      className={`relative w-28 h-28 rounded-xl overflow-hidden border-2 shadow-sm group transition-all ${
                        isHeroBanner ? 'border-blue-500 scale-105 z-10' : 'border-gray-200'
                      }`}
                    >
                      <img src={URL.createObjectURL(file)} alt={`Preview ${i}`} className="w-full h-full object-cover" />
                      
                      {/* Badge superior indicando su destino */}
                      <span className={`absolute top-0 w-full text-[8px] text-center font-bold py-0.5 text-white ${
                        isHeroBanner ? 'bg-blue-600' : 'bg-gray-500'
                      }`}>
                        {isHeroBanner ? '🌌 BANNER HERO (1ª)' : `🖼️ CARRUSEL (${i + 1}ª)`}
                      </span>
                      
                      {/* Badge inferior de tamaño sugerido */}
                      <span className="absolute bottom-0 w-full bg-black/75 text-white text-[8px] text-center py-0.5 font-medium">
                        {isHeroBanner ? '1920x1080 px' : '1200x800 px'}
                      </span>
                      
                      <button 
                        onClick={() => removeSelectedFile(i)}
                        type="button"
                        className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold"
                      >
                        ✕ Quitar
                      </button>
                    </div>
                  );
                })}
                
                <label className="w-28 h-28 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:bg-white hover:border-blue-400 transition-colors bg-white shadow-sm">
                  <span className="text-2xl text-gray-400">+</span>
                  <span className="text-[10px] text-gray-400 font-bold mt-1">Agregar Foto</span>
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
                
                {/* 🎭 Conexión e Identidad Local (Pullally) - Editar */}
                <div className="md:col-span-3 p-4 bg-[#fef9f3]/60 rounded-3xl border border-orange-100 shadow-sm space-y-4">
                  <h4 className="text-xs font-bold text-orange-950 uppercase tracking-wider flex items-center gap-1.5">
                    🎭 Conexión e Identidad Local (Pullally)
                  </h4>
                  <p className="text-[10px] text-orange-850 font-medium leading-relaxed">
                    Personaliza la historia y atractivos de la localidad para esta cabaña. Se despliega en la sección interactiva pública.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-1">
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-0.5">Lema o Bajada</label>
                      <input 
                        placeholder="Ej: Un viaje en el tiempo"
                        className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-300 text-xs" 
                        value={editForm.slogan || ''} 
                        onChange={e => setEditForm({...editForm, slogan: e.target.value})}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-0.5">Título de la Reseña</label>
                      <input 
                        placeholder="Ej: ¿Por qué este nombre?"
                        className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-300 text-xs" 
                        value={editForm.origin_title || '¿Por qué este nombre?'} 
                        onChange={e => setEditForm({...editForm, origin_title: e.target.value})}
                      />
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-0.5">Reseña Histórica de Pullally</label>
                      <textarea 
                        placeholder="Describe la relación con Pullally..."
                        className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-300 text-xs min-h-[60px]" 
                        value={editForm.origin_description || ''} 
                        onChange={e => setEditForm({...editForm, origin_description: e.target.value})}
                      />
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-0.5">💡 Dato Curioso Local</label>
                      <textarea 
                        placeholder="Escribe el dato curioso..."
                        className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-300 text-xs min-h-[45px]" 
                        value={editForm.fun_fact || ''} 
                        onChange={e => setEditForm({...editForm, fun_fact: e.target.value})}
                      />
                    </div>
                  </div>
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

                {/* Foto de Portada Principal - Editar */}
                <div className="md:col-span-3 mt-4 p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                  <label className="block text-xs font-bold text-gray-800 uppercase mb-1">
                    📸 Foto de Portada Principal (Oficial)
                  </label>
                  <p className="text-[10px] text-gray-500 mb-2">
                    📐 **Sugerido: 1200x800 px (3:2)**. Se muestra en el catálogo del Home y checkout público.
                  </p>
                  
                  <div className="flex items-center gap-3">
                    {coverFile ? (
                      <div className="relative w-28 h-20 rounded-xl overflow-hidden border-2 border-blue-500 shadow-sm group">
                        <img src={URL.createObjectURL(coverFile)} alt="Preview Nueva Portada" className="w-full h-full object-cover" />
                        <span className="absolute bottom-0 w-full bg-blue-500 text-white text-[8px] text-center font-bold py-0.5">NUEVA</span>
                        <button 
                          onClick={removeCoverFile}
                          type="button"
                          className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold"
                        >
                          ✕ Quitar
                        </button>
                      </div>
                    ) : editForm.image_url ? (
                      <div className="relative w-28 h-20 rounded-xl overflow-hidden border border-gray-200 shadow-sm group">
                        <img src={editForm.image_url} alt="Portada Actual" className="w-full h-full object-cover" />
                        <span className="absolute bottom-0 w-full bg-gray-700/80 text-white text-[8px] text-center font-bold py-0.5">PORTADA ACTUAL</span>
                        <button 
                          type="button"
                          className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold"
                          title="Subir una nueva portada"
                        >
                          ✕ Cambiar
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="absolute inset-0 opacity-0 cursor-pointer" 
                            onChange={handleCoverChange}
                          />
                        </button>
                      </div>
                    ) : (
                      <label className="w-28 h-20 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:bg-white hover:border-[#11d442] transition-all bg-white/50 shadow-sm">
                        <span className="text-lg text-gray-400">📸</span>
                        <span className="text-[9px] text-gray-500 font-bold mt-0.5">Cargar Portada</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={handleCoverChange}
                        />
                      </label>
                    )}
                    
                    <div className="flex-1 text-[10px] text-gray-400 font-medium">
                      {coverFile ? (
                        <span className="text-blue-600 font-semibold">✓ Nueva portada lista para subir.</span>
                      ) : editForm.image_url ? (
                        <span>Portada actual guardada. Pasa el cursor para cambiarla por una nueva.</span>
                      ) : (
                        <span>Carga la portada principal de la cabaña.</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Galería de Fotos - Editar */}
                <div className="md:col-span-3 mt-4 p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                  <label className="block text-xs font-bold text-gray-800 uppercase mb-2">
                    🖼️ Galería de Fotos e Instalaciones
                  </label>
                  
                  <div className="mb-3 bg-white/80 p-2.5 rounded-xl border border-gray-200 text-[10px] text-gray-600 space-y-1 shadow-sm">
                    <p className="font-bold text-gray-700">📌 Guía de Destino de la Imagen:</p>
                    <ul className="list-disc pl-4 space-y-0.5">
                      <li><span className="font-semibold text-blue-700">1ª Foto (🌌 Banner Superior):</span> Fondo panorámico de la cabaña. Recomendado: **1920x1080 px**.</li>
                      <li><span className="font-semibold text-gray-600">Siguientes Fotos (🖼️ Carrusel):</span> Carrusel interactivo. Recomendado: **1200x800 px**.</li>
                    </ul>
                  </div>
                  
                  <div className="flex flex-wrap gap-2.5 mb-2">
                    {/* Imágenes de Supabase (Existentes) */}
                    {editForm.gallery_urls.filter(url => url.trim() !== '').map((url, i) => {
                      const isHeroBanner = i === 0;
                      return (
                        <div 
                          key={`existing-${i}`} 
                          className={`relative w-24 h-24 rounded-lg overflow-hidden border-2 shadow-sm group transition-all ${
                            isHeroBanner ? 'border-blue-500 scale-105 z-10' : 'border-gray-200'
                          }`}
                        >
                          <img src={url} alt={`Existente ${i}`} className="w-full h-full object-cover" />
                          
                          {/* Badge superior indicando su destino */}
                          <span className={`absolute top-0 w-full text-[7px] text-center font-bold py-0.5 text-white ${
                            isHeroBanner ? 'bg-blue-600' : 'bg-gray-500'
                          }`}>
                            {isHeroBanner ? '🌌 BANNER HERO (1ª)' : `🖼️ CARRUSEL (${i + 1}ª)`}
                          </span>
                          
                          {/* Badge de tamaño */}
                          <span className="absolute bottom-0 w-full bg-black/75 text-white text-[7px] text-center py-0.5">
                            {isHeroBanner ? '1920x1080 px' : '1200x800 px'}
                          </span>
                          
                          <button 
                            type="button"
                            onClick={() => setEditForm({...editForm, gallery_urls: editForm.gallery_urls.filter((_, index) => index !== i)})}
                            className="absolute inset-0 bg-red-500/85 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold"
                            title="Eliminar de la galería"
                          >
                            ✕ Borrar
                          </button>
                        </div>
                      );
                    })}
                    
                    {/* Archivos Locales Nuevos */}
                    {selectedFiles.map((file, i) => {
                      const hasExistingGallery = editForm.gallery_urls.filter(url => url.trim() !== '').length > 0;
                      const isHeroBanner = !hasExistingGallery && i === 0;
                      const globalIndex = editForm.gallery_urls.filter(url => url.trim() !== '').length + i;
                      
                      return (
                        <div 
                          key={`new-${i}`} 
                          className={`relative w-24 h-24 rounded-lg overflow-hidden border-2 shadow-sm group transition-all ${
                            isHeroBanner ? 'border-blue-500 scale-105 z-10' : 'border-blue-400'
                          }`}
                        >
                          <img src={URL.createObjectURL(file)} alt="Preview" className="w-full h-full object-cover" />
                          <span className="absolute bottom-2 right-1 bg-blue-500 text-white text-[7px] font-bold px-1 rounded-sm">NUEVA</span>
                          
                          {/* Badge superior indicando su destino */}
                          <span className={`absolute top-0 w-full text-[7px] text-center font-bold py-0.5 text-white ${
                            isHeroBanner ? 'bg-blue-600' : 'bg-blue-500'
                          }`}>
                            {isHeroBanner ? '🌌 BANNER HERO (1ª)' : `🖼️ CARRUSEL (${globalIndex + 1}ª)`}
                          </span>
                          
                          {/* Badge de tamaño */}
                          <span className="absolute bottom-0 w-full bg-black/75 text-white text-[7px] text-center py-0.5">
                            {isHeroBanner ? '1920x1080 px' : '1200x800 px'}
                          </span>
                          
                          <button 
                            type="button"
                            onClick={() => removeSelectedFile(i)}
                            className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold"
                          >
                            ✕ Quitar
                          </button>
                        </div>
                      );
                    })}
                    
                    <label className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:bg-white hover:border-blue-400 transition-colors bg-white shadow-sm">
                      <span className="text-xl text-gray-400">+</span>
                      <span className="text-[9px] text-gray-400 mt-0.5">Subir Foto</span>
                      <input 
                        type="file" 
                        multiple 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleFileChange}
                      />
                    </label>
                  </div>
                  <p className="text-[9px] text-gray-400 font-medium">Las fotos marcadas con el contorno azul o celeste son nuevos archivos que se subirán al guardar.</p>
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
                  {cabin.housekeeping_status && (
                    <span className={`text-[10px] font-bold uppercase px-3 py-1 rounded-full border ${
                      cabin.housekeeping_status === 'Disponible' ? 'bg-green-50 text-green-700 border-green-200' :
                      cabin.housekeeping_status === 'Ocupada' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      cabin.housekeeping_status === 'Necesita Aseo' ? 'bg-red-50 text-red-700 border-red-200 animate-pulse' :
                      'bg-gray-50 text-gray-700 border-gray-200'
                    }`}>
                      🧹 {cabin.housekeeping_status}
                    </span>
                  )}
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
                <>
                  <button 
                    onClick={() => handleEdit(cabin)}
                    className="px-6 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all shadow-sm"
                  >
                    Editar Ajustes
                  </button>
                  {userProfile?.role === 'admin' && (
                    <button 
                      onClick={() => handleDeleteCabin(cabin)}
                      disabled={uploading}
                      className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-650 border border-red-100 rounded-xl text-sm font-bold hover:shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
                      title="Eliminar esta cabaña permanentemente"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Eliminar
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* SECCIÓN PREMIUM: CIERRES Y BLOQUEOS TEMPORALES (PARCIAL Y TOTAL)         */}
      {/* ========================================================================= */}
      <div className="border-t border-gray-100 pt-10 mt-10 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              ⚙️ Cierres y Bloqueos de Cabañas
            </h2>
            <p className="text-gray-500">Desactiva alojamientos por vacaciones o mantenciones bloqueando reservas automáticas.</p>
          </div>
          <button
            onClick={() => setIsCreatingClosure(!isCreatingClosure)}
            className="bg-gray-900 hover:bg-gray-800 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-md flex items-center gap-2"
          >
            {isCreatingClosure ? '✕ Cerrar Panel' : '➕ Crear Nuevo Cierre'}
          </button>
        </div>

        {isCreatingClosure && (
          <div className="bg-amber-50/50 p-6 rounded-[24px] border border-amber-100 shadow-sm animate-fade-in-up">
            <h3 className="text-lg font-bold text-amber-900 mb-4">🚫 Configurar Cierre Temporal</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cabaña a Afectar</label>
                <select
                  className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 text-sm font-semibold"
                  value={closureForm.cabin_id}
                  onChange={e => setClosureForm({ ...closureForm, cabin_id: e.target.value })}
                >
                  <option value="">🚫 CIERRE TOTAL (Todas las cabañas)</option>
                  {cabins.map(c => (
                    <option key={c.id} value={c.id}>🏡 {c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Fecha de Inicio</label>
                <input
                  type="date"
                  className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                  value={closureForm.start_date}
                  onChange={e => setClosureForm({ ...closureForm, start_date: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Fecha de Término</label>
                <input
                  type="date"
                  className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                  value={closureForm.end_date}
                  onChange={e => setClosureForm({ ...closureForm, end_date: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Motivo o Descripción</label>
                <input
                  placeholder="Ej. Mantención anual, Vacaciones"
                  className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                  value={closureForm.reason}
                  onChange={e => setClosureForm({ ...closureForm, reason: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setIsCreatingClosure(false)}
                className="px-6 py-2 bg-white text-gray-600 border border-gray-200 rounded-xl text-sm font-bold hover:bg-gray-50"
                disabled={uploading}
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateClosure}
                disabled={uploading}
                className="px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-bold shadow-lg disabled:opacity-50 flex items-center gap-2"
              >
                {uploading ? 'Registrando...' : 'Establecer Cierre'}
              </button>
            </div>
          </div>
        )}

        {loadingClosures ? (
          <div className="text-center py-6 text-gray-400">Cargando cierres...</div>
        ) : closures.length === 0 ? (
          <div className="bg-gray-50/50 border border-dashed border-gray-200 p-8 rounded-3xl text-center text-gray-500">
            🌳 No hay cierres activos o programados en el sistema. Todos los alojamientos están disponibles.
          </div>
        ) : (
          <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    <th className="p-4">Cabaña</th>
                    <th className="p-4">Periodo de Bloqueo</th>
                    <th className="p-4">Motivo / Cierre</th>
                    <th className="p-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-sm text-gray-700">
                  {closures.map((c) => {
                    const isTotal = !c.cabin_id;
                    return (
                      <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="p-4 font-semibold">
                          {isTotal ? (
                            <span className="bg-rose-100 text-rose-700 text-xs font-bold px-2.5 py-1 rounded-full uppercase">
                              🚫 Cierre Total (Todas)
                            </span>
                          ) : (
                            <span className="text-gray-900 font-bold">🏡 {c.cabin?.name}</span>
                          )}
                        </td>
                        <td className="p-4">
                          <span className="font-semibold text-gray-900">
                            {new Date(c.start_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                          <span className="text-gray-400 mx-2">hasta</span>
                          <span className="font-semibold text-gray-900">
                            {new Date(c.end_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-0.5 rounded mr-2">
                            🗂️ {c.reason}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleDeleteClosure(c.id)}
                            className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                          >
                            Quitar Bloqueo
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
