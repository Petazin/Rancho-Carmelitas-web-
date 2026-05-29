'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface LandingSettings {
  id: number;
  hero_title: string;
  hero_subtitle: string;
  hero_bg_url: string;
  logo_url?: string;
}

interface LandingGalleryItem {
  id: string;
  image_url: string;
  alt_text: string;
  order_index: number;
}

export default function AdminLandingPage() {
  const [settings, setSettings] = useState<LandingSettings>({
    id: 1,
    hero_title: 'Escapa a la naturaleza, con total comodidad.',
    hero_subtitle: 'Descubre nuestras exclusivas cabañas totalmente equipadas en el corazón de Pullally, Papudo. Tu refugio perfecto entre el bosque y el mar.',
    hero_bg_url: '/gallery/hero.png'
  });
  const [gallery, setGallery] = useState<LandingGalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [selectedGalleryFiles, setSelectedGalleryFiles] = useState<File[]>([]);
  const [newHeroBgFile, setNewHeroBgFile] = useState<File | null>(null);
  const [newLogoFile, setNewLogoFile] = useState<File | null>(null);

  // Estados editables locales para textos de Hero
  const [editTitle, setEditTitle] = useState('');
  const [editSubtitle, setEditSubtitle] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      // 1. Obtener configuraciones del Hero
      const { data: settingsData, error: settingsError } = await supabase
        .from('landing_settings')
        .select('*')
        .eq('id', 1)
        .maybeSingle();

      if (settingsError) {
        console.warn('Advertencia cargando landing_settings (¿falta aplicar script SQL?):', settingsError);
      } else if (settingsData) {
        setSettings(settingsData);
        setEditTitle(settingsData.hero_title);
        setEditSubtitle(settingsData.hero_subtitle);
      } else {
        // Inicializar textos de edición si la fila de Supabase está vacía
        setEditTitle(settings.hero_title);
        setEditSubtitle(settings.hero_subtitle);
      }

      // 2. Obtener galería de momentos
      const { data: galleryData, error: galleryError } = await supabase
        .from('landing_gallery')
        .select('*')
        .order('order_index', { ascending: true });

      if (galleryError) {
        console.warn('Advertencia cargando landing_gallery (¿falta aplicar script SQL?):', galleryError);
      } else {
        setGallery(galleryData || []);
      }
    } catch (err) {
      console.error('Error general cargando datos de Landing:', err);
    } finally {
      setLoading(false);
    }
  }

  // Guardar cambios en el Hero (Textos y opcionalmente fondo)
  const handleSaveSettings = async () => {
    if (!editTitle.trim()) {
      alert('El título principal no puede estar vacío.');
      return;
    }

    setSavingSettings(true);
    let finalBgUrl = settings.hero_bg_url;
    let finalLogoUrl = settings.logo_url || '';

    try {
      // Subir nueva imagen del Hero si está seleccionada
      if (newHeroBgFile) {
        const fileExt = newHeroBgFile.name.split('.').pop();
        const fileName = `hero_bg_${Date.now()}.${fileExt}`;
        const filePath = `landing/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('cabin-images')
          .upload(filePath, newHeroBgFile);

        if (uploadError) {
          throw new Error(`Fallo al subir fondo de Hero: ${uploadError.message}`);
        }

        const { data: { publicUrl } } = supabase.storage
          .from('cabin-images')
          .getPublicUrl(filePath);
        finalBgUrl = publicUrl;
      }

      // Subir nueva imagen del Logo si está seleccionada
      if (newLogoFile) {
        const fileExt = newLogoFile.name.split('.').pop();
        const fileName = `logo_${Date.now()}.${fileExt}`;
        const filePath = `landing/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('cabin-images')
          .upload(filePath, newLogoFile);

        if (uploadError) {
          throw new Error(`Fallo al subir Logo del Rancho: ${uploadError.message}`);
        }

        const { data: { publicUrl } } = supabase.storage
          .from('cabin-images')
          .getPublicUrl(filePath);
        finalLogoUrl = publicUrl;
      }

      // Upsert en la tabla landing_settings
      const { error: upsertError } = await supabase
        .from('landing_settings')
        .upsert({
          id: 1,
          hero_title: editTitle,
          hero_subtitle: editSubtitle,
          hero_bg_url: finalBgUrl,
          logo_url: finalLogoUrl
        });

      if (upsertError) {
        throw new Error(upsertError.message);
      }

      alert('¡Configuración de Landing guardada exitosamente!');
      setNewHeroBgFile(null);
      setNewLogoFile(null);
      fetchData();
    } catch (err: any) {
      alert('Error al guardar configuración: ' + err.message);
      console.error(err);
    } finally {
      setSavingSettings(false);
    }
  };

  // Subir archivos a la Galería de Momentos
  const handleUploadGallery = async () => {
    if (selectedGalleryFiles.length === 0) {
      alert('Por favor, selecciona al menos una foto para subir.');
      return;
    }

    setUploadingGallery(true);
    try {
      let maxOrder = gallery.length > 0 ? Math.max(...gallery.map(item => item.order_index)) : -1;

      for (const file of selectedGalleryFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `gallery_${Math.random()}.${fileExt}`;
        const filePath = `landing/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('cabin-images')
          .upload(filePath, file);

        if (uploadError) {
          console.error(`Error subiendo foto de galería ${file.name}:`, uploadError);
          alert(`Hubo un error al subir ${file.name}`);
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('cabin-images')
          .getPublicUrl(filePath);

        maxOrder += 1;

        const { error: insertError } = await supabase
          .from('landing_gallery')
          .insert({
            image_url: publicUrl,
            alt_text: file.name.split('.')[0] || 'Foto de momentos Rancho Carmelitas',
            order_index: maxOrder
          });

        if (insertError) {
          console.error('Error insertando registro de galería:', insertError);
        }
      }

      alert('¡Imágenes subidas a la galería exitosamente!');
      setSelectedGalleryFiles([]);
      fetchData();
    } catch (err: any) {
      alert('Error en la carga de galería: ' + err.message);
    } finally {
      setUploadingGallery(false);
    }
  };

  // Eliminar imagen de la Galería de Momentos
  const handleDeleteGalleryItem = async (item: LandingGalleryItem) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta foto de la galería?')) return;

    try {
      // 1. Eliminar de la base de datos
      const { error: dbError } = await supabase
        .from('landing_gallery')
        .delete()
        .eq('id', item.id);

      if (dbError) throw dbError;

      // 2. Intentar borrar del Storage físico si es una URL de Supabase
      if (item.image_url.includes('cabin-images')) {
        const pathParts = item.image_url.split('/cabin-images/');
        if (pathParts[1]) {
          const filePath = decodeURIComponent(pathParts[1]);
          await supabase.storage.from('cabin-images').remove([filePath]);
        }
      }

      fetchData();
    } catch (err: any) {
      alert('Error al eliminar imagen: ' + err.message);
    }
  };

  // Actualizar el Texto Alternativo (SEO) de una imagen de la galería
  const handleUpdateAltText = async (id: string, altText: string) => {
    try {
      const { error } = await supabase
        .from('landing_gallery')
        .update({ alt_text: altText })
        .eq('id', id);

      if (error) throw error;
    } catch (err: any) {
      console.error('Error al actualizar SEO:', err);
    }
  };

  // Intercambiar orden de dos elementos en la galería (Reordenamiento)
  const handleSwapOrder = async (index1: number, index2: number) => {
    if (index1 < 0 || index1 >= gallery.length || index2 < 0 || index2 >= gallery.length) return;

    const item1 = gallery[index1];
    const item2 = gallery[index2];

    try {
      // Intercambiar order_index en Supabase
      const { error: err1 } = await supabase
        .from('landing_gallery')
        .update({ order_index: item2.order_index })
        .eq('id', item1.id);

      const { error: err2 } = await supabase
        .from('landing_gallery')
        .update({ order_index: item1.order_index })
        .eq('id', item2.id);

      if (err1 || err2) throw new Error('Error al actualizar orden en Supabase');

      fetchData();
    } catch (err: any) {
      alert('Error al reordenar: ' + err.message);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setSelectedGalleryFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeSelectedFile = (index: number) => {
    setSelectedGalleryFiles(prev => prev.filter((_, i) => i !== index));
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Cargando gestión de Landing Page...</div>;

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">🎨 Gestión de Landing Page</h2>
        <p className="text-gray-500">Controla los textos, banners y fotos generales que ven los huéspedes al abrir la web.</p>
      </div>

      {/* SECCIÓN 1: CONFIGURACIÓN GENERAL DEL HERO BANNER */}
      <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm space-y-6">
        <div className="border-b border-gray-100 pb-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            🌌 Banner del Hero Principal
          </h3>
          <p className="text-xs text-gray-400">Personaliza la primera sección de impacto visual de la landing page pública.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Título del Banner Principal</label>
              <input 
                type="text"
                className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#11d442] focus:bg-white text-sm font-semibold text-gray-800 transition-all"
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                placeholder="Ej. Escapa a la naturaleza, con total comodidad."
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Subtítulo Descriptivo</label>
              <textarea 
                className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#11d442] focus:bg-white text-sm text-gray-600 transition-all min-h-[100px]"
                value={editSubtitle}
                onChange={e => setEditSubtitle(e.target.value)}
                placeholder="Escribe la descripción de bienvenida a Rancho Carmelitas..."
              />
            </div>
          </div>

          <div className="space-y-6">
            {/* Fondo del Banner */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-gray-500 uppercase">Fondo del Banner</label>
              <p className="text-[10px] text-gray-400">📐 **Recomendado: 1920x1080 px (16:9)**. Imagen panorámica de alta calidad.</p>
              
              <div className="flex flex-col items-center justify-center">
                {newHeroBgFile ? (
                  <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden border-2 border-[#11d442] shadow-sm group">
                    <img src={URL.createObjectURL(newHeroBgFile)} alt="Preview Fondo" className="w-full h-full object-cover" />
                    <span className="absolute bottom-0 w-full bg-[#11d442] text-white text-[9px] text-center font-bold py-0.5">NUEVO BANNER</span>
                    <button 
                      onClick={() => setNewHeroBgFile(null)}
                      type="button"
                      className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold"
                    >
                      ✕ Cancelar Selección
                    </button>
                  </div>
                ) : settings.hero_bg_url ? (
                  <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden border border-gray-200 shadow-sm group">
                    <img src={settings.hero_bg_url} alt="Fondo Actual" className="w-full h-full object-cover" />
                    <span className="absolute bottom-0 w-full bg-gray-900/80 text-white text-[8px] text-center font-semibold py-0.5">Fondo Actual</span>
                    <button 
                      type="button"
                      className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold"
                    >
                      ✕ Cambiar Fondo
                      <input 
                        type="file"
                        accept="image/*"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={e => e.target.files && e.target.files.length > 0 && setNewHeroBgFile(e.target.files[0])}
                      />
                    </button>
                  </div>
                ) : (
                  <label className="w-full aspect-[16/9] rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-[#11d442] transition-colors bg-gray-50/50">
                    <span className="text-2xl text-gray-400">🌌</span>
                    <span className="text-[10px] text-gray-500 font-bold mt-1">Subir Imagen Fondo</span>
                    <input 
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => e.target.files && e.target.files.length > 0 && setNewHeroBgFile(e.target.files[0])}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Logo Oficial del Rancho */}
            <div className="space-y-3 pt-4 border-t border-gray-50">
              <label className="block text-xs font-bold text-gray-500 uppercase text-gray-800">Logo Oficial del Rancho</label>
              <p className="text-[10px] text-gray-400">📐 **Recomendado: Aspecto 1:1 (cuadrado)**. Se mostrará de forma circular en Header y Footer.</p>
              
              <div className="flex items-center gap-4">
                {newLogoFile ? (
                  <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-[#11d442] shadow-sm group">
                    <img src={URL.createObjectURL(newLogoFile)} alt="Preview Logo" className="w-full h-full object-cover" />
                    <span className="absolute bottom-0 w-full bg-[#11d442] text-white text-[8px] text-center font-bold py-0.5">NUEVO</span>
                    <button 
                      onClick={() => setNewLogoFile(null)}
                      type="button"
                      className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold"
                    >
                      ✕ Quitar
                    </button>
                  </div>
                ) : settings.logo_url ? (
                  <div className="relative w-20 h-20 rounded-full overflow-hidden border border-gray-200 shadow-sm group">
                    <img src={settings.logo_url} alt="Logo Actual" className="w-full h-full object-cover" />
                    <span className="absolute bottom-0 w-full bg-gray-900/80 text-white text-[8px] text-center font-semibold py-0.5">Actual</span>
                    <button 
                      type="button"
                      className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold"
                    >
                      ✕ Cambiar
                      <input 
                        type="file"
                        accept="image/*"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={e => e.target.files && e.target.files.length > 0 && setNewLogoFile(e.target.files[0])}
                      />
                    </button>
                  </div>
                ) : (
                  <label className="w-20 h-20 rounded-full border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-[#11d442] transition-colors bg-gray-50/50">
                    <span className="text-xl text-gray-400">🏷️</span>
                    <span className="text-[9px] text-gray-500 font-bold mt-1">Subir Logo</span>
                    <input 
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => e.target.files && e.target.files.length > 0 && setNewLogoFile(e.target.files[0])}
                    />
                  </label>
                )}
                <div>
                  <p className="text-xs font-semibold text-gray-700">Identidad Visual</p>
                  <p className="text-[10px] text-gray-400">Administra el isotipo/logo principal.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-gray-50">
          <button 
            onClick={handleSaveSettings}
            disabled={savingSettings}
            className="bg-[#11d442] hover:bg-green-600 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-md flex items-center gap-2 text-sm disabled:opacity-50"
          >
            {savingSettings ? 'Guardando...' : '✓ Guardar Cambios del Hero'}
          </button>
        </div>
      </div>

      {/* SECCIÓN 2: GALERÍA DE MOMENTOS GENERAL */}
      <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm space-y-6">
        <div className="border-b border-gray-100 pb-4 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              🖼️ Galería de Momentos e Instalaciones
            </h3>
            <p className="text-xs text-gray-400">Administra las fotos reales del entorno de Rancho Carmelitas (piscina, tinaja, bosques).</p>
          </div>
        </div>

        <div className="p-4 bg-blue-50/30 border border-blue-100 rounded-2xl flex flex-col md:flex-row md:items-center gap-4 justify-between">
          <div className="text-xs text-blue-800 space-y-0.5">
            <p className="font-bold">📐 Especificación Recomendada:</p>
            <p>Aspecto rectangular estándar de **1200x800 px (3:2)** para mantener la consistencia estética.</p>
          </div>
          <div>
            <label className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm">
              <span>+ Seleccionar Fotos</span>
              <input 
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          </div>
        </div>

        {/* Archivos Locales en Espera */}
        {selectedGalleryFiles.length > 0 && (
          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-4">
            <h4 className="text-xs font-bold text-gray-700 uppercase">Nuevas Fotos Seleccionadas (En espera de subir)</h4>
            <div className="flex flex-wrap gap-4">
              {selectedGalleryFiles.map((file, i) => (
                <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden border-2 border-blue-400 group shadow-sm">
                  <img src={URL.createObjectURL(file)} alt="Preview Nueva" className="w-full h-full object-cover" />
                  <span className="absolute bottom-0 w-full bg-blue-500 text-white text-[8px] text-center font-bold py-0.5">LISTA</span>
                  <button 
                    onClick={() => removeSelectedFile(i)}
                    className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold"
                  >
                    ✕ Quitar
                  </button>
                </div>
              ))}
            </div>
            <div className="flex justify-end">
              <button 
                onClick={handleUploadGallery}
                disabled={uploadingGallery}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md transition-colors disabled:opacity-50"
              >
                {uploadingGallery ? 'Subiendo...' : '📤 Subir Imágenes a Supabase'}
              </button>
            </div>
          </div>
        )}

        {/* Galería Dinámica e Interactiva */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 pt-2">
          {gallery.map((item, index) => {
            return (
              <div key={item.id} className="border border-gray-100 bg-white rounded-2xl overflow-hidden shadow-sm flex flex-col transition-all hover:shadow-md">
                {/* Imagen */}
                <div className="relative aspect-[4/3] bg-gray-50 border-b border-gray-100 group">
                  <img src={item.image_url} alt={item.alt_text} className="w-full h-full object-cover" />
                  
                  {/* Badge de Orden */}
                  <span className="absolute top-2 left-2 bg-gray-900/80 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                    Posición {index + 1}
                  </span>

                  {/* Acciones Rápidas */}
                  <div className="absolute inset-0 bg-black/50 text-white flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleSwapOrder(index, index - 1)}
                      className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-sm transition-colors disabled:opacity-20"
                      title="Mover a la izquierda / subir"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      disabled={index === gallery.length - 1}
                      onClick={() => handleSwapOrder(index, index + 1)}
                      className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-sm transition-colors disabled:opacity-20"
                      title="Mover a la derecha / bajar"
                    >
                      ▼
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteGalleryItem(item)}
                      className="w-8 h-8 rounded-full bg-red-500/80 hover:bg-red-600 flex items-center justify-center text-xs transition-colors"
                      title="Eliminar foto"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Formulario SEO */}
                <div className="p-3 space-y-1">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase">Texto Descriptivo (SEO)</label>
                  <input
                    type="text"
                    defaultValue={item.alt_text}
                    className="w-full px-2 py-1.5 border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-[#11d442] text-[11px] font-medium text-gray-700 transition-all"
                    placeholder="Describe la foto para Google..."
                    onBlur={(e) => handleUpdateAltText(item.id, e.target.value)}
                  />
                </div>
              </div>
            );
          })}

          {gallery.length === 0 && (
            <div className="col-span-full text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
              <span className="text-3xl">🖼️</span>
              <p className="text-xs text-gray-400 font-bold mt-2">No hay imágenes en la galería de momentos de Supabase.</p>
              <p className="text-[10px] text-gray-400 max-w-xs mx-auto mt-0.5">Se están mostrando las fotos estáticas locales por defecto en el sitio web público.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
