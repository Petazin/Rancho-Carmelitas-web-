'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { compressImage } from '@/lib/image-compress';

/* 
 * COMENTARIO DEL DESARROLLADOR:
 * MEJORA ARQUITECTÓNICA - INTERFAZ DE CONFIGURACIONES GENERALES
 * Hemos extendido la interfaz `LandingSettings` para reflejar todas las nuevas columnas de la base de datos Supabase,
 * permitiendo así unificar la carga y persistencia del Hero, Logo, Cabañas, Galería, Sello SERNATUR y Reglas de Convivencia.
 */
interface LandingSettings {
  id: number;
  hero_title: string;
  hero_subtitle: string;
  hero_bg_url: string;
  logo_url?: string;
  cabins_title?: string;
  cabins_subtitle?: string;
  gallery_title?: string;
  gallery_subtitle?: string;
  team_title?: string;
  team_subtitle?: string;
  sernatur_title?: string;
  sernatur_subtitle?: string;
  sernatur_badge?: string;
  rules_title?: string;
  rules_list?: string[];
  contact_address?: string;
  contact_phone?: string;
  contact_email?: string;
  contact_maps_url?: string;
  contact_location_legend?: string;
}

interface LandingGalleryItem {
  id: string;
  image_url: string;
  alt_text: string;
  order_index: number;
}

interface LandingTeamMember {
  id: string;
  name: string;
  role: string;
  description: string;
  image_url: string | null;
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
  const [teamMembers, setTeamMembers] = useState<LandingTeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [selectedGalleryFiles, setSelectedGalleryFiles] = useState<File[]>([]);
  const [newHeroBgFile, setNewHeroBgFile] = useState<File | null>(null);
  const [newLogoFile, setNewLogoFile] = useState<File | null>(null);

  // Estados editables locales para textos de la Landing Page
  const [editTitle, setEditTitle] = useState('');
  const [editSubtitle, setEditSubtitle] = useState('');
  const [cabinsTitle, setCabinsTitle] = useState('');
  const [cabinsSubtitle, setCabinsSubtitle] = useState('');
  const [galleryTitle, setGalleryTitle] = useState('');
  const [gallerySubtitle, setGallerySubtitle] = useState('');
  const [teamTitle, setTeamTitle] = useState('');
  const [teamSubtitle, setTeamSubtitle] = useState('');
  const [sernaturTitle, setSernaturTitle] = useState('');
  const [sernaturSubtitle, setSernaturSubtitle] = useState('');
  const [sernaturBadge, setSernaturBadge] = useState('');
  const [rulesTitle, setRulesTitle] = useState('');
  const [rulesList, setRulesList] = useState<string[]>([]);
  const [contactAddress, setContactAddress] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMapsUrl, setContactMapsUrl] = useState('');
  const [contactLocationLegend, setContactLocationLegend] = useState('');

  // Estados para modal y edición de miembros del equipo
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [editingTeamMember, setEditingTeamMember] = useState<LandingTeamMember | null>(null);
  const [memberFormName, setMemberFormName] = useState('');
  const [memberFormRole, setMemberFormRole] = useState('');
  const [memberFormDescription, setMemberFormDescription] = useState('');
  const [memberFormImageUrl, setMemberFormImageUrl] = useState('');
  const [memberFormFile, setMemberFormFile] = useState<File | null>(null);
  const [savingMember, setSavingMember] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      // 1. Obtener configuraciones del Hero y Secciones
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
        setCabinsTitle(settingsData.cabins_title || 'Nuestras Cabañas');
        setCabinsSubtitle(settingsData.cabins_subtitle || 'Espacios diseñados para tu confort. Cabañas con cocina equipada, aire acondicionado y todo lo necesario para tu descanso en Rancho Carmelitas.');
        setGalleryTitle(settingsData.gallery_title || 'Galería de Momentos');
        setGallerySubtitle(settingsData.gallery_subtitle || 'Vistas reales de nuestro entorno, piscina y confortables interiores.');
        setTeamTitle(settingsData.team_title || 'Nuestro Equipo');
        setTeamSubtitle(settingsData.team_subtitle || 'Conoce a las personas dedicadas a cuidar cada detalle de tu descanso y estadía en Rancho Carmelitas.');
        setSernaturTitle(settingsData.sernatur_title || 'Servicio Turístico Registrado');
        setSernaturSubtitle(settingsData.sernatur_subtitle || 'Vigencia hasta Enero 2026 • Registro № 71034');
        setSernaturBadge(settingsData.sernatur_badge || 'Calidad y Confianza');
        const cleanRulesTitle = (settingsData.rules_title || 'Reglas de Convivencia')
          .replace(/\s*hola\b/gi, '')
          .trim() || 'Reglas de Convivencia';

        let rawRulesList = settingsData.rules_list;
        if (typeof rawRulesList === 'string') {
          try {
            rawRulesList = JSON.parse(rawRulesList);
          } catch {
            rawRulesList = null;
          }
        }
        const cleanRulesList = Array.isArray(rawRulesList) && rawRulesList.length > 0 ? rawRulesList.map((r: string) => {
          if (/amigos peludos|mascota/i.test(r)) {
            return 'Mascotas: Está prohibido el ingreso de mascotas en todo el recinto.';
          }
          if (/check-out:\s*11:00/i.test(r)) {
            return 'Check-in: 15:00 a 21:00 hrs. Check-out: hasta las 12:00 hrs.';
          }
          if (/silencio nocturno/i.test(r)) {
            return 'Descanso y Música: Cabañas de descanso; prohibidas fiestas y uso de parlantes o música al aire libre.';
          }
          return r.replace(/\s*hola\b/gi, '').trim();
        }) : [
          'Check-in: 15:00 a 21:00 hrs. Check-out: hasta las 12:00 hrs.',
          'Prohibido fumar: Por seguridad forestal e higiene, prohibido fumar en cabañas y piscina.',
          'Mascotas: Está prohibido el ingreso de mascotas en todo el recinto.',
          'Descanso y Música: Cabañas de descanso; prohibidas fiestas y uso de parlantes o música al aire libre.'
        ];

        setRulesTitle(cleanRulesTitle);
        setRulesList(cleanRulesList);
        setContactAddress(settingsData.contact_address || 'Avenida Las Salinas № 104 D-4, Pullally, Papudo, Región de Valparaíso, Chile');
        setContactPhone(settingsData.contact_phone || '+56 9 8401 2748');
        setContactEmail(settingsData.contact_email || 'contacto@ranchocarmelitas.cl');
        setContactMapsUrl(settingsData.contact_maps_url || 'https://maps.app.goo.gl/6W1fhgChaMWaQzbK8');
        setContactLocationLegend(settingsData.contact_location_legend || '* Pullally está ubicado en la Región de Valparaíso, a sólo 2 horas de Santiago.');
      } else {
        // Inicializar textos de edición si la fila de Supabase está vacía
        setEditTitle(settings.hero_title);
        setEditSubtitle(settings.hero_subtitle);
        setCabinsTitle('Nuestras Cabañas');
        setCabinsSubtitle('Espacios diseñados para tu confort. Cabañas con cocina equipada, aire acondicionado y todo lo necesario para tu descanso en Rancho Carmelitas.');
        setGalleryTitle('Galería de Momentos');
        setGallerySubtitle('Vistas reales de nuestro entorno, piscina y confortables interiores.');
        setTeamTitle('Nuestro Equipo');
        setTeamSubtitle('Conoce a las personas dedicadas a cuidar cada detalle de tu descanso y estadía en Rancho Carmelitas.');
        setSernaturTitle('Servicio Turístico Registrado');
        setSernaturSubtitle('Vigencia hasta Enero 2026 • Registro № 71034');
        setSernaturBadge('Calidad y Confianza');
        setRulesTitle('Reglas de Convivencia');
        setRulesList([
          'Check-in: 15:00 a 21:00 hrs. Check-out: hasta las 12:00 hrs.',
          'Prohibido fumar: Por seguridad forestal e higiene, prohibido fumar en cabañas y piscina.',
          'Mascotas: Está prohibido el ingreso de mascotas en todo el recinto.',
          'Descanso y Música: Cabañas de descanso; prohibidas fiestas y uso de parlantes o música al aire libre.'
        ]);
        setContactAddress('Avenida Las Salinas № 104 D-4, Pullally, Papudo, Región de Valparaíso, Chile');
        setContactPhone('+56 9 8401 2748');
        setContactEmail('contacto@ranchocarmelitas.cl');
        setContactMapsUrl('https://maps.app.goo.gl/6W1fhgChaMWaQzbK8');
        setContactLocationLegend('* Pullally está ubicado en la Región de Valparaíso, a sólo 2 horas de Santiago.');
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

      // 3. Obtener equipo de trabajo
      const { data: teamData, error: teamError } = await supabase
        .from('landing_team')
        .select('*')
        .order('order_index', { ascending: true });

      if (teamError) {
        console.warn('Advertencia cargando landing_team (¿falta aplicar script SQL?):', teamError);
      } else {
        setTeamMembers(teamData || []);
      }
    } catch (err) {
      console.error('Error general cargando datos de Landing:', err);
    } finally {
      setLoading(false);
    }
  }

  // Guardar cambios en el Hero y Secciones (Textos, reglas y opcionalmente imágenes)
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
        const compressedHeroBg = await compressImage(newHeroBgFile, 1920, 0.8);
        const fileExt = compressedHeroBg.name.split('.').pop();
        const fileName = `hero_bg_${Date.now()}.${fileExt}`;
        const filePath = `landing/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('cabin-images')
          .upload(filePath, compressedHeroBg);

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
        const compressedLogo = await compressImage(newLogoFile, 400, 0.8);
        const fileExt = compressedLogo.name.split('.').pop();
        const fileName = `logo_${Date.now()}.${fileExt}`;
        const filePath = `landing/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('cabin-images')
          .upload(filePath, compressedLogo);

        if (uploadError) {
          throw new Error(`Fallo al subir Logo del Rancho: ${uploadError.message}`);
        }

        const { data: { publicUrl } } = supabase.storage
          .from('cabin-images')
          .getPublicUrl(filePath);
        finalLogoUrl = publicUrl;
      }

      // Upsert en la tabla landing_settings con los campos extendidos
      const { error: upsertError } = await supabase
        .from('landing_settings')
        .upsert({
          id: 1,
          hero_title: editTitle,
          hero_subtitle: editSubtitle,
          hero_bg_url: finalBgUrl,
          logo_url: finalLogoUrl,
          cabins_title: cabinsTitle,
          cabins_subtitle: cabinsSubtitle,
          gallery_title: galleryTitle,
          gallery_subtitle: gallerySubtitle,
          team_title: teamTitle,
          team_subtitle: teamSubtitle,
          sernatur_title: sernaturTitle,
          sernatur_subtitle: sernaturSubtitle,
          sernatur_badge: sernaturBadge,
          rules_title: rulesTitle,
          rules_list: rulesList,
          contact_address: contactAddress,
          contact_phone: contactPhone,
          contact_email: contactEmail,
          contact_maps_url: contactMapsUrl,
          contact_location_legend: contactLocationLegend
        });

      if (upsertError) {
        throw new Error(upsertError.message);
      }

      alert('¡Configuración de Landing Page guardada exitosamente!');
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

  // Apertura de modal para nuevo integrante
  const handleOpenAddMember = () => {
    setEditingTeamMember(null);
    setMemberFormName('');
    setMemberFormRole('');
    setMemberFormDescription('');
    setMemberFormImageUrl('');
    setMemberFormFile(null);
    setIsTeamModalOpen(true);
  };

  // Apertura de modal para editar integrante existente
  const handleOpenEditMember = (member: LandingTeamMember) => {
    setEditingTeamMember(member);
    setMemberFormName(member.name);
    setMemberFormRole(member.role);
    setMemberFormDescription(member.description);
    setMemberFormImageUrl(member.image_url || '');
    setMemberFormFile(null);
    setIsTeamModalOpen(true);
  };

  // Guardar (crear o actualizar) un integrante del equipo
  const handleSaveTeamMember = async () => {
    if (!memberFormName.trim() || !memberFormRole.trim() || !memberFormDescription.trim()) {
      alert('Por favor completa el nombre, el rol y la descripción del integrante.');
      return;
    }

    setSavingMember(true);
    try {
      let finalImageUrl = memberFormImageUrl;

      if (memberFormFile) {
        const compressed = await compressImage(memberFormFile, 800, 0.85);
        const fileExt = compressed.name.split('.').pop() || 'jpg';
        const fileName = `team_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `team/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('cabin-images')
          .upload(filePath, compressed);

        if (uploadError) {
          throw new Error(`Fallo al subir fotografía del integrante: ${uploadError.message}`);
        }

        const { data: { publicUrl } } = supabase.storage
          .from('cabin-images')
          .getPublicUrl(filePath);

        finalImageUrl = publicUrl;
      }

      if (editingTeamMember) {
        const { error: updateError } = await supabase
          .from('landing_team')
          .update({
            name: memberFormName.trim(),
            role: memberFormRole.trim(),
            description: memberFormDescription.trim(),
            image_url: finalImageUrl,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingTeamMember.id);

        if (updateError) throw updateError;
        alert('¡Integrante actualizado exitosamente!');
      } else {
        const nextOrder = teamMembers.length > 0 ? Math.max(...teamMembers.map(m => m.order_index)) + 1 : 0;
        const { error: insertError } = await supabase
          .from('landing_team')
          .insert({
            name: memberFormName.trim(),
            role: memberFormRole.trim(),
            description: memberFormDescription.trim(),
            image_url: finalImageUrl,
            order_index: nextOrder
          });

        if (insertError) throw insertError;
        alert('¡Integrante añadido al equipo exitosamente!');
      }

      setIsTeamModalOpen(false);
      setMemberFormFile(null);
      fetchData();
    } catch (err: any) {
      alert('Error al guardar integrante: ' + err.message);
    } finally {
      setSavingMember(false);
    }
  };

  // Eliminar un integrante del equipo
  const handleDeleteTeamMember = async (member: LandingTeamMember) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar a ${member.name} del equipo?`)) return;

    try {
      const { error: dbError } = await supabase
        .from('landing_team')
        .delete()
        .eq('id', member.id);

      if (dbError) throw dbError;

      if (member.image_url && member.image_url.includes('cabin-images/team/')) {
        const pathParts = member.image_url.split('/cabin-images/');
        if (pathParts[1]) {
          const filePath = decodeURIComponent(pathParts[1]);
          await supabase.storage.from('cabin-images').remove([filePath]);
        }
      }

      fetchData();
    } catch (err: any) {
      alert('Error al eliminar integrante: ' + err.message);
    }
  };

  // Intercambiar orden de dos integrantes
  const handleSwapTeamOrder = async (index1: number, index2: number) => {
    if (index1 < 0 || index1 >= teamMembers.length || index2 < 0 || index2 >= teamMembers.length) return;

    const item1 = teamMembers[index1];
    const item2 = teamMembers[index2];

    try {
      const { error: err1 } = await supabase
        .from('landing_team')
        .update({ order_index: item2.order_index })
        .eq('id', item1.id);

      const { error: err2 } = await supabase
        .from('landing_team')
        .update({ order_index: item1.order_index })
        .eq('id', item2.id);

      if (err1 || err2) throw new Error('Error al intercambiar orden de integrantes');

      fetchData();
    } catch (err: any) {
      alert('Error al reordenar equipo: ' + err.message);
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
        const compressedFile = await compressImage(file, 1600, 0.8);
        const fileExt = compressedFile.name.split('.').pop();
        const fileName = `gallery_${Math.random()}.${fileExt}`;
        const filePath = `landing/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('cabin-images')
          .upload(filePath, compressedFile);

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
            {savingSettings ? 'Guardando...' : '✓ Guardar Toda la Configuración de Landing'}
          </button>
        </div>
      </div>

      {/* SECCIÓN 2: EDICIÓN DE TEXTOS Y SECCIONES DE LA LANDING */}
      <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm space-y-6">
        <div className="border-b border-gray-100 pb-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            ✏️ Textos y Secciones de la Landing Page
          </h3>
          <p className="text-xs text-gray-400">Edita los títulos, subtítulos y reglas de convivencia generales de la Landing Page pública.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Lado izquierdo: Textos de Cabañas, Galería y SERNATUR */}
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-bold text-gray-800 border-b border-gray-50 pb-2 flex items-center gap-1.5">
                <span>🏠</span> Sección de Cabañas
              </h4>
              <div className="space-y-3 mt-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Título Sección Cabañas</label>
                  <input 
                    type="text"
                    className="w-full px-3 py-2 bg-gray-50/50 border border-gray-250 rounded-xl outline-none focus:ring-2 focus:ring-[#11d442] focus:bg-white text-xs font-semibold text-gray-800 transition-all"
                    value={cabinsTitle}
                    onChange={e => setCabinsTitle(e.target.value)}
                    placeholder="Ej. Nuestras Cabañas"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Subtítulo Descriptivo Cabañas</label>
                  <textarea 
                    className="w-full px-3 py-2 bg-gray-50/50 border border-gray-250 rounded-xl outline-none focus:ring-2 focus:ring-[#11d442] focus:bg-white text-xs text-gray-600 transition-all min-h-[70px] resize-none"
                    value={cabinsSubtitle}
                    onChange={e => setCabinsSubtitle(e.target.value)}
                    placeholder="Escribe el subtítulo de la sección de cabañas..."
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-50">
              <h4 className="text-sm font-bold text-gray-800 border-b border-gray-50 pb-2 flex items-center gap-1.5">
                <span>🖼️</span> Sección de Galería de Momentos
              </h4>
              <div className="space-y-3 mt-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Título Sección Galería</label>
                  <input 
                    type="text"
                    className="w-full px-3 py-2 bg-gray-50/50 border border-gray-250 rounded-xl outline-none focus:ring-2 focus:ring-[#11d442] focus:bg-white text-xs font-semibold text-gray-800 transition-all"
                    value={galleryTitle}
                    onChange={e => setGalleryTitle(e.target.value)}
                    placeholder="Ej. Galería de Momentos"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Subtítulo Descriptivo Galería</label>
                  <textarea 
                    className="w-full px-3 py-2 bg-gray-50/50 border border-gray-250 rounded-xl outline-none focus:ring-2 focus:ring-[#11d442] focus:bg-white text-xs text-gray-600 transition-all min-h-[70px] resize-none"
                    value={gallerySubtitle}
                    onChange={e => setGallerySubtitle(e.target.value)}
                    placeholder="Escribe el subtítulo de la sección de galería..."
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-50">
              <h4 className="text-sm font-bold text-gray-800 border-b border-gray-50 pb-2 flex items-center gap-1.5">
                <span>👥</span> Sección de Equipo de Trabajo
              </h4>
              <div className="space-y-3 mt-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Título Sección Equipo</label>
                  <input 
                    type="text"
                    className="w-full px-3 py-2 bg-gray-50/50 border border-gray-250 rounded-xl outline-none focus:ring-2 focus:ring-[#11d442] focus:bg-white text-xs font-semibold text-gray-800 transition-all"
                    value={teamTitle}
                    onChange={e => setTeamTitle(e.target.value)}
                    placeholder="Ej. Nuestro Equipo"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Subtítulo Descriptivo Equipo</label>
                  <textarea 
                    className="w-full px-3 py-2 bg-gray-50/50 border border-gray-250 rounded-xl outline-none focus:ring-2 focus:ring-[#11d442] focus:bg-white text-xs text-gray-600 transition-all min-h-[70px] resize-none"
                    value={teamSubtitle}
                    onChange={e => setTeamSubtitle(e.target.value)}
                    placeholder="Escribe el subtítulo de la sección de equipo..."
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-50">
              <h4 className="text-sm font-bold text-gray-800 border-b border-gray-50 pb-2 flex items-center gap-1.5">
                <span>🎖️</span> Sello de Confianza SERNATUR
              </h4>
              <div className="space-y-3 mt-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Título SERNATUR</label>
                  <input 
                    type="text"
                    className="w-full px-3 py-2 bg-gray-50/50 border border-gray-250 rounded-xl outline-none focus:ring-2 focus:ring-[#11d442] focus:bg-white text-xs font-semibold text-gray-800 transition-all"
                    value={sernaturTitle}
                    onChange={e => setSernaturTitle(e.target.value)}
                    placeholder="Ej. Servicio Turístico Registrado"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Subtítulo (Vigencia)</label>
                    <input 
                      type="text"
                      className="w-full px-3 py-2 bg-gray-50/50 border border-gray-250 rounded-xl outline-none focus:ring-2 focus:ring-[#11d442] focus:bg-white text-[11px] font-semibold text-gray-700 transition-all"
                      value={sernaturSubtitle}
                      onChange={e => setSernaturSubtitle(e.target.value)}
                      placeholder="Ej. Vigencia hasta Enero 2026..."
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Badge de Confianza</label>
                    <input 
                      type="text"
                      className="w-full px-3 py-2 bg-gray-50/50 border border-gray-250 rounded-xl outline-none focus:ring-2 focus:ring-[#11d442] focus:bg-white text-[11px] font-semibold text-gray-750 transition-all"
                      value={sernaturBadge}
                      onChange={e => setSernaturBadge(e.target.value)}
                      placeholder="Ej. Calidad y Confianza"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Lado derecho: Reglas de Convivencia con editor dinámico de array */}
          <div className="space-y-4 flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-50 pb-2">
              <h4 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                <span>📋</span> Reglas de Convivencia
              </h4>
              <button
                type="button"
                onClick={() => setRulesList([...rulesList, ''])}
                className="bg-green-50 text-[#11d442] hover:bg-[#11d442] hover:text-white text-[11px] px-2.5 py-1.5 rounded-lg font-bold transition-all border border-green-200/50 flex items-center gap-1 shadow-sm"
              >
                <span>➕</span> Añadir Regla
              </button>
            </div>

            <div className="space-y-4 flex-1">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Título de Sección de Reglas</label>
                <input 
                  type="text"
                  className="w-full px-3 py-2 bg-gray-50/50 border border-gray-250 rounded-xl outline-none focus:ring-2 focus:ring-[#11d442] focus:bg-white text-xs font-semibold text-gray-800 transition-all"
                  value={rulesTitle}
                  onChange={e => setRulesTitle(e.target.value)}
                  placeholder="Ej. Reglas de Convivencia"
                />
              </div>

              {/* Editor de array rulesList */}
              <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">Listado de Reglas Individuales</label>
                
                {rulesList.map((rule, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-gray-50/50 p-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
                    <span className="text-[10px] font-bold text-gray-400 w-5 text-center">#{idx + 1}</span>
                    <input 
                      type="text"
                      className="flex-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-[#11d442] text-xs font-medium text-gray-700 transition-all"
                      value={rule}
                      onChange={e => {
                        const newList = [...rulesList];
                        newList[idx] = e.target.value;
                        setRulesList(newList);
                      }}
                      placeholder="Ej. Check-in: 15:00 a 21:00 hrs. Check-out: hasta las 12:00 hrs."
                    />
                    
                    {/* Botones de control del array */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => {
                          const newList = [...rulesList];
                          const temp = newList[idx];
                          newList[idx] = newList[idx - 1];
                          newList[idx - 1] = temp;
                          setRulesList(newList);
                        }}
                        className="w-6 h-6 rounded bg-white hover:bg-gray-100 flex items-center justify-center text-[10px] text-gray-500 border border-gray-200 transition-colors disabled:opacity-30"
                        title="Subir prioridad"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        disabled={idx === rulesList.length - 1}
                        onClick={() => {
                          const newList = [...rulesList];
                          const temp = newList[idx];
                          newList[idx] = newList[idx + 1];
                          newList[idx + 1] = temp;
                          setRulesList(newList);
                        }}
                        className="w-6 h-6 rounded bg-white hover:bg-gray-100 flex items-center justify-center text-[10px] text-gray-500 border border-gray-200 transition-colors disabled:opacity-30"
                        title="Bajar prioridad"
                      >
                        ▼
                      </button>
                      <button
                        type="button"
                        onClick={() => setRulesList(rulesList.filter((_, i) => i !== idx))}
                        className="w-6 h-6 rounded bg-red-50 hover:bg-red-150 flex items-center justify-center text-xs text-red-600 border border-red-200/50 transition-colors"
                        title="Eliminar regla"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}

                {rulesList.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-4 italic">No hay reglas registradas. Se usarán las reglas por defecto en la web pública.</p>
                )}
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
            {savingSettings ? 'Guardando...' : '✓ Guardar Toda la Configuración de Landing'}
          </button>
        </div>
      </div>

      {/* SECCIÓN 1.5: DATOS DE CONTACTO Y UBICACIÓN */}
      <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm space-y-6">
        <div className="border-b border-gray-100 pb-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            📍 Datos de Contacto y Ubicación
          </h3>
          <p className="text-xs text-gray-400">Administra la dirección, teléfono, email, leyenda al pie e hipervínculo del mapa del Rancho.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Dirección Oficial</label>
            <input 
              type="text"
              className="w-full px-3 py-2 bg-gray-50/50 border border-gray-250 rounded-xl outline-none focus:ring-2 focus:ring-[#11d442] focus:bg-white text-xs font-semibold text-gray-800 transition-all"
              value={contactAddress}
              onChange={e => setContactAddress(e.target.value)}
              placeholder="Ej. Avenida Las Salinas № 104 D-4, Pullally, Papudo, Región de Valparaíso, Chile"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Teléfono de Llamada</label>
            <input 
              type="text"
              className="w-full px-3 py-2 bg-gray-50/50 border border-gray-250 rounded-xl outline-none focus:ring-2 focus:ring-[#11d442] focus:bg-white text-xs font-semibold text-gray-800 transition-all"
              value={contactPhone}
              onChange={e => setContactPhone(e.target.value)}
              placeholder="Ej. +56 9 8401 2748"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Correo Electrónico de Consultas</label>
            <input 
              type="text"
              className="w-full px-3 py-2 bg-gray-50/50 border border-gray-250 rounded-xl outline-none focus:ring-2 focus:ring-[#11d442] focus:bg-white text-xs font-semibold text-gray-800 transition-all"
              value={contactEmail}
              onChange={e => setContactEmail(e.target.value)}
              placeholder="Ej. contacto@ranchocarmelitas.cl"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Enlace del Mapa (Google Maps URL)</label>
            <input 
              type="text"
              className="w-full px-3 py-2 bg-gray-50/50 border border-gray-250 rounded-xl outline-none focus:ring-2 focus:ring-[#11d442] focus:bg-white text-xs font-semibold text-gray-800 transition-all"
              value={contactMapsUrl}
              onChange={e => setContactMapsUrl(e.target.value)}
              placeholder="Ej. https://maps.app.goo.gl/6W1fhgChaMWaQzbK8"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Leyenda Explicativa de Ubicación (Pie de Mapa)</label>
            <input 
              type="text"
              className="w-full px-3 py-2 bg-gray-50/50 border border-gray-250 rounded-xl outline-none focus:ring-2 focus:ring-[#11d442] focus:bg-white text-xs font-semibold text-gray-800 transition-all"
              value={contactLocationLegend}
              onChange={e => setContactLocationLegend(e.target.value)}
              placeholder="Ej. * Pullally está ubicado en la Región de Valparaíso, a sólo 2 horas de Santiago."
            />
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-gray-50">
          <button 
            onClick={handleSaveSettings}
            disabled={savingSettings}
            className="bg-[#11d442] hover:bg-green-600 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-md flex items-center gap-2 text-sm disabled:opacity-50"
          >
            {savingSettings ? 'Guardando...' : '✓ Guardar Datos de Contacto y Ubicación'}
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

      {/* SECCIÓN 3: EQUIPO DE TRABAJO Y HOSPITALIDAD */}
      <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm space-y-6">
        <div className="border-b border-gray-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              👥 Equipo de Trabajo y Hospitalidad
            </h3>
            <p className="text-xs text-gray-400">Administra a las personas que atienden Rancho Carmelitas (fotografía, nombre, rol y breve descripción).</p>
          </div>
          <div>
            <button
              type="button"
              onClick={handleOpenAddMember}
              className="bg-[#11d442] hover:bg-green-600 text-white px-4 py-2.5 rounded-xl font-bold transition-all shadow-sm flex items-center gap-2 text-xs"
            >
              <span>➕</span> Añadir Integrante
            </button>
          </div>
        </div>

        {/* Guía informativa de fotos */}
        <div className="p-4 bg-emerald-50/40 border border-emerald-100 rounded-2xl flex flex-col md:flex-row md:items-center gap-4 justify-between text-xs text-emerald-900">
          <div className="space-y-0.5">
            <p className="font-bold flex items-center gap-1.5">
              <span>📐</span> Fotografía Recomendada (Aspect Ratio Vertical):
            </p>
            <p className="text-emerald-700">Aspecto vertical o tipo retrato de **800x1000 px (4:5)** o cuadrado de alta definición. El sistema optimiza y comprime automáticamente la imagen.</p>
          </div>
        </div>

        {/* Listado de Miembros del Equipo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pt-2">
          {teamMembers.map((member, index) => (
            <div 
              key={member.id} 
              className="border border-gray-100 bg-white rounded-3xl overflow-hidden shadow-sm flex flex-col justify-between hover:shadow-md transition-all group"
            >
              <div>
                {/* Fotografía del Integrante */}
                <div className="relative aspect-[4/5] bg-gray-100 overflow-hidden">
                  {member.image_url ? (
                    <img 
                      src={member.image_url} 
                      alt={member.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 text-gray-400">
                      <span className="text-4xl">🌿</span>
                      <span className="text-[10px] font-bold text-gray-500 mt-2">Sin Foto</span>
                    </div>
                  )}

                  {/* Badge de Posición / Orden */}
                  <span className="absolute top-2 left-2 bg-gray-900/80 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                    #{index + 1}
                  </span>

                  {/* Acciones Rápidas en Hover */}
                  <div className="absolute inset-0 bg-black/50 text-white flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleSwapTeamOrder(index, index - 1)}
                      className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-sm transition-colors disabled:opacity-20"
                      title="Mover a la izquierda / subir"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      disabled={index === teamMembers.length - 1}
                      onClick={() => handleSwapTeamOrder(index, index + 1)}
                      className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-sm transition-colors disabled:opacity-20"
                      title="Mover a la derecha / bajar"
                    >
                      ▼
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEditMember(member)}
                      className="w-8 h-8 rounded-full bg-[#11d442] hover:bg-green-600 flex items-center justify-center text-xs transition-colors"
                      title="Editar datos del integrante"
                    >
                      ✏️
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteTeamMember(member)}
                      className="w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-xs transition-colors"
                      title="Eliminar integrante"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Datos del Integrante */}
                <div className="p-4 space-y-2">
                  <div>
                    <span className="inline-block bg-[#11d442]/10 text-[#0fa836] border border-[#11d442]/30 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                      {member.role}
                    </span>
                  </div>
                  <h4 className="font-bold text-gray-900 text-sm">{member.name}</h4>
                  <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">
                    {member.description}
                  </p>
                </div>
              </div>

              {/* Pie de tarjeta con botón rápido de edición */}
              <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-[11px]">
                <button
                  type="button"
                  onClick={() => handleOpenEditMember(member)}
                  className="text-gray-600 hover:text-[#11d442] font-semibold flex items-center gap-1"
                >
                  <span>✏️</span> Editar Ficha
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteTeamMember(member)}
                  className="text-red-500 hover:text-red-700 font-semibold"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}

          {teamMembers.length === 0 && (
            <div className="col-span-full text-center py-12 border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50/50 space-y-2">
              <span className="text-4xl">👥</span>
              <p className="text-sm text-gray-600 font-bold">No hay integrantes registrados en la base de datos de Supabase.</p>
              <p className="text-xs text-gray-400 max-w-md mx-auto">
                Actualmente se muestran los 4 integrantes provisionales de muestra en la Landing Page pública. Haz clic en <strong>"Añadir Integrante"</strong> para registrar a tu equipo real.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL PARA AÑADIR / EDITAR INTEGRANTE DEL EQUIPO */}
      {isTeamModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <span>{editingTeamMember ? '✏️ Editar Integrante' : '➕ Añadir Nuevo Integrante'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsTeamModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 text-sm transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              {/* Fotografía del Integrante */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-600 uppercase">Fotografía del Integrante</label>
                <div className="flex items-center gap-4">
                  <div className="relative w-24 h-28 rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 shadow-inner flex items-center justify-center flex-shrink-0">
                    {memberFormFile ? (
                      <img 
                        src={URL.createObjectURL(memberFormFile)} 
                        alt="Preview" 
                        className="w-full h-full object-cover" 
                      />
                    ) : memberFormImageUrl ? (
                      <img 
                        src={memberFormImageUrl} 
                        alt="Preview" 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <span className="text-3xl text-gray-300">👤</span>
                    )}
                  </div>

                  <div className="space-y-2 flex-1">
                    <label className="bg-white border border-gray-200 hover:border-[#11d442] hover:bg-green-50/30 text-gray-700 px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-sm">
                      <span>📁 Subir Foto</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => {
                          if (e.target.files && e.target.files.length > 0) {
                            setMemberFormFile(e.target.files[0]);
                          }
                        }}
                      />
                    </label>

                    {memberFormFile && (
                      <p className="text-[11px] text-[#11d442] font-semibold">
                        ✓ Archivo seleccionado: {memberFormFile.name}
                      </p>
                    )}

                    <div>
                      <span className="text-[10px] text-gray-400 block mb-1">O ingresa una URL de imagen:</span>
                      <input
                        type="url"
                        className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-[#11d442] text-xs font-medium text-gray-700 transition-all"
                        placeholder="https://ejemplo.com/foto.jpg"
                        value={memberFormImageUrl}
                        onChange={e => setMemberFormImageUrl(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Nombre Completo */}
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#11d442] focus:bg-white text-xs font-semibold text-gray-800 transition-all"
                  placeholder="Ej. Carmen Gloria Morales"
                  value={memberFormName}
                  onChange={e => setMemberFormName(e.target.value)}
                />
              </div>

              {/* Rol / Cargo en el Rancho */}
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Rol / Cargo dentro del Rancho *</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#11d442] focus:bg-white text-xs font-semibold text-gray-800 transition-all"
                  placeholder="Ej. Anfitriona & Administración"
                  value={memberFormRole}
                  onChange={e => setMemberFormRole(e.target.value)}
                />
              </div>

              {/* Pequeña Descripción */}
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Pequeña Descripción *</label>
                <textarea
                  required
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#11d442] focus:bg-white text-xs text-gray-700 transition-all resize-none"
                  placeholder="Describe brevemente su labor y cómo contribuye al descanso y bienestar de los huéspedes..."
                  value={memberFormDescription}
                  onChange={e => setMemberFormDescription(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIsTeamModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveTeamMember}
                disabled={savingMember}
                className="bg-[#11d442] hover:bg-green-600 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md transition-all disabled:opacity-50 flex items-center gap-1.5"
              >
                {savingMember ? 'Guardando...' : '✓ Guardar Integrante'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
