'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { compressImage } from '@/lib/image-compress';

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
  category?: string;
}

interface LandingTeamMember {
  id: string;
  name: string;
  role: string;
  description: string;
  image_url: string | null;
  order_index: number;
}

type TabType = 'hero' | 'galeria_portada' | 'galeria_recinto' | 'textos_reglas' | 'equipo' | 'contacto';

export default function AdminLandingPage() {
  const [activeTab, setActiveTab] = useState<TabType>('hero');
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
  
  // Archivos para Hero y Logo
  const [newHeroBgFile, setNewHeroBgFile] = useState<File | null>(null);
  const [newLogoFile, setNewLogoFile] = useState<File | null>(null);

  // Archivos para Galería Portada y Recinto
  const [selectedPortadaFiles, setSelectedPortadaFiles] = useState<File[]>([]);
  const [selectedRecintoFiles, setSelectedRecintoFiles] = useState<File[]>([]);
  const [uploadingPortada, setUploadingPortada] = useState(false);
  const [uploadingRecinto, setUploadingRecinto] = useState(false);

  // Estados locales editables para textos
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

  // Modal y edición de miembros del equipo
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [editingTeamMember, setEditingTeamMember] = useState<LandingTeamMember | null>(null);
  const [memberFormName, setMemberFormName] = useState('');
  const [memberFormRole, setMemberFormRole] = useState('');
  const [memberFormDescription, setMemberFormDescription] = useState('');
  const [memberFormImageUrl, setMemberFormImageUrl] = useState('');
  const [memberFormFile, setMemberFormFile] = useState<File | null>(null);
  const [savingMember, setSavingMember] = useState(false);

  // Mensajes de Toast no bloqueantes
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

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
        console.warn('Advertencia cargando landing_settings:', settingsError);
      } else if (settingsData) {
        setSettings(settingsData);
        setEditTitle(settingsData.hero_title || '');
        setEditSubtitle(settingsData.hero_subtitle || '');
        setCabinsTitle(settingsData.cabins_title || 'Nuestras Cabañas');
        setCabinsSubtitle(settingsData.cabins_subtitle || 'Espacios diseñados para tu confort. Cabañas con cocina equipada, aire acondicionado y todo lo necesario para tu descanso en Rancho Carmelitas.');
        setGalleryTitle(settingsData.gallery_title || 'Galería de Momentos');
        setGallerySubtitle(settingsData.gallery_subtitle || 'Vistas reales de nuestro entorno, piscina y confortables interiores.');
        setTeamTitle(settingsData.team_title || 'Nuestro Equipo');
        setTeamSubtitle(settingsData.team_subtitle || 'Conoce a las personas dedicadas a cuidar cada detalle de tu descanso y estadía en Rancho Carmelitas.');
        setSernaturTitle(settingsData.sernatur_title || 'Servicio Turístico Registrado');
        setSernaturSubtitle(settingsData.sernatur_subtitle || 'Vigencia hasta Enero 2026 • Registro № 71034');
        setSernaturBadge(settingsData.sernatur_badge || 'Calidad y Confianza');

        const cleanRulesTitle = (settingsData.rules_title || 'Reglas de Convivencia').replace(/\s*hola\b/gi, '').trim() || 'Reglas de Convivencia';
        let rawRulesList = settingsData.rules_list;
        if (typeof rawRulesList === 'string') {
          try {
            rawRulesList = JSON.parse(rawRulesList);
          } catch {
            rawRulesList = null;
          }
        }
        const cleanRulesList = Array.isArray(rawRulesList) && rawRulesList.length > 0 ? rawRulesList.map((r: string) => {
          if (/amigos peludos|mascota/i.test(r)) return 'Mascotas: Está prohibido el ingreso de mascotas en todo el recinto.';
          if (/check-out:\s*11:00/i.test(r)) return 'Check-in: 15:00 a 21:00 hrs. Check-out: hasta las 12:00 hrs.';
          if (/silencio nocturno/i.test(r)) return 'Descanso y Música: Cabañas de descanso; prohibidas fiestas y uso de parlantes o música al aire libre.';
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
      }

      // 2. Obtener galería completa
      const { data: galleryData, error: galleryError } = await supabase
        .from('landing_gallery')
        .select('*')
        .order('order_index', { ascending: true });

      if (!galleryError && galleryData) {
        setGallery(galleryData);
      }

      // 3. Obtener equipo
      const { data: teamData, error: teamError } = await supabase
        .from('landing_team')
        .select('*')
        .order('order_index', { ascending: true });

      if (!teamError && teamData) {
        setTeamMembers(teamData);
      }
    } catch (err) {
      console.error('Error cargando datos de Landing:', err);
    } finally {
      setLoading(false);
    }
  }

  // Filtrado de galerías por categoría
  const portadaGallery = gallery.filter(item => !item.category || item.category === 'general');
  const recintoGallery = gallery.filter(item => item.category === 'recinto');

  // Guardar configuraciones de Landing (Hero, Textos, Contacto)
  const handleSaveSettings = async () => {
    if (!editTitle.trim()) {
      showToast('El título principal del Hero no puede estar vacío.', 'error');
      return;
    }

    setSavingSettings(true);
    let finalBgUrl = settings.hero_bg_url;
    let finalLogoUrl = settings.logo_url || '';

    try {
      if (newHeroBgFile) {
        const compressedHeroBg = await compressImage(newHeroBgFile, 1920, 0.8);
        const fileExt = compressedHeroBg.name.split('.').pop();
        const fileName = `hero_bg_${Date.now()}.${fileExt}`;
        const filePath = `landing/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('cabin-images')
          .upload(filePath, compressedHeroBg);

        if (uploadError) throw new Error(`Fallo al subir fondo de Hero: ${uploadError.message}`);

        const { data: { publicUrl } } = supabase.storage
          .from('cabin-images')
          .getPublicUrl(filePath);

        finalBgUrl = publicUrl;
      }

      if (newLogoFile) {
        const compressedLogo = await compressImage(newLogoFile, 600, 0.9);
        const fileExt = compressedLogo.name.split('.').pop();
        const fileName = `logo_${Date.now()}.${fileExt}`;
        const filePath = `landing/${fileName}`;

        const { error: logoUploadError } = await supabase.storage
          .from('cabin-images')
          .upload(filePath, compressedLogo);

        if (logoUploadError) throw new Error(`Fallo al subir logotipo: ${logoUploadError.message}`);

        const { data: { publicUrl } } = supabase.storage
          .from('cabin-images')
          .getPublicUrl(filePath);

        finalLogoUrl = publicUrl;
      }

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

      if (upsertError) throw upsertError;

      setSettings(prev => ({
        ...prev,
        hero_title: editTitle,
        hero_subtitle: editSubtitle,
        hero_bg_url: finalBgUrl,
        logo_url: finalLogoUrl
      }));
      setNewHeroBgFile(null);
      setNewLogoFile(null);

      showToast('✓ Configuración guardada exitosamente.', 'success');
    } catch (err: any) {
      showToast('Error al guardar: ' + err.message, 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  // Subir fotos a la galería (Portada o Recinto)
  const handleUploadGallery = async (category: 'general' | 'recinto') => {
    const filesToUpload = category === 'recinto' ? selectedRecintoFiles : selectedPortadaFiles;
    if (filesToUpload.length === 0) {
      showToast('Por favor, selecciona al menos una fotografía para subir.', 'error');
      return;
    }

    if (category === 'recinto') setUploadingRecinto(true);
    else setUploadingPortada(true);

    try {
      const targetGallery = category === 'recinto' ? recintoGallery : portadaGallery;
      let maxOrder = targetGallery.length > 0 ? Math.max(...targetGallery.map(item => item.order_index)) : -1;

      for (const file of filesToUpload) {
        const compressedFile = await compressImage(file, 1600, 0.8);
        const fileExt = compressedFile.name.split('.').pop();
        const subfolder = category === 'recinto' ? 'landing/recinto' : 'landing';
        const fileName = `${category}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
        const filePath = `${subfolder}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('cabin-images')
          .upload(filePath, compressedFile);

        if (uploadError) {
          console.error(`Error subiendo foto ${file.name}:`, uploadError);
          showToast(`Error al subir ${file.name}: ${uploadError.message}`, 'error');
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
            alt_text: file.name.split('.')[0] || (category === 'recinto' ? 'Piscina y Quincho para Eventos' : 'Foto de momentos Rancho Carmelitas'),
            order_index: maxOrder,
            category: category
          });

        if (insertError) {
          console.error('Error insertando en landing_gallery:', insertError);
        }
      }

      showToast(category === 'recinto' ? '✓ Fotos de Recinto subidas exitosamente.' : '✓ Fotos de Portada subidas exitosamente.', 'success');
      if (category === 'recinto') setSelectedRecintoFiles([]);
      else setSelectedPortadaFiles([]);
      fetchData();
    } catch (err: any) {
      showToast('Error en la carga: ' + err.message, 'error');
    } finally {
      if (category === 'recinto') setUploadingRecinto(false);
      else setUploadingPortada(false);
    }
  };

  // Eliminar imagen de galería con purga segura de Storage
  const handleDeleteGalleryItem = async (item: LandingGalleryItem) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta fotografía?')) return;

    try {
      const { error: dbError } = await supabase
        .from('landing_gallery')
        .delete()
        .eq('id', item.id);

      if (dbError) throw dbError;

      if (item.image_url.includes('cabin-images')) {
        const pathParts = item.image_url.split('/cabin-images/');
        if (pathParts[1]) {
          const rawPath = pathParts[1].split('?')[0];
          const filePath = decodeURIComponent(rawPath);
          await supabase.storage.from('cabin-images').remove([filePath]);
        }
      }

      showToast('Fotografía eliminada exitosamente.', 'success');
      fetchData();
    } catch (err: any) {
      showToast('Error al eliminar: ' + err.message, 'error');
    }
  };

  // Actualizar texto alternativo / título de foto
  const handleUpdateAltText = async (id: string, altText: string) => {
    try {
      await supabase
        .from('landing_gallery')
        .update({ alt_text: altText })
        .eq('id', id);
    } catch (err: any) {
      console.error('Error al actualizar título SEO:', err);
    }
  };

  // Reordenar imágenes dentro de su categoría
  const handleSwapOrder = async (targetList: LandingGalleryItem[], index1: number, index2: number) => {
    if (index1 < 0 || index1 >= targetList.length || index2 < 0 || index2 >= targetList.length) return;

    const item1 = targetList[index1];
    const item2 = targetList[index2];

    try {
      await supabase
        .from('landing_gallery')
        .update({ order_index: item2.order_index })
        .eq('id', item1.id);

      await supabase
        .from('landing_gallery')
        .update({ order_index: item1.order_index })
        .eq('id', item2.id);

      fetchData();
    } catch (err: any) {
      showToast('Error al reordenar: ' + err.message, 'error');
    }
  };

  // Manejo de reglas dinámicas
  const handleAddRule = () => {
    setRulesList(prev => [...prev, 'Nueva regla de convivencia']);
  };

  const handleUpdateRule = (index: number, val: string) => {
    setRulesList(prev => {
      const updated = [...prev];
      updated[index] = val;
      return updated;
    });
  };

  const handleDeleteRule = (index: number) => {
    setRulesList(prev => prev.filter((_, i) => i !== index));
  };

  // Manejo de equipo de trabajo
  const handleOpenAddMember = () => {
    setEditingTeamMember(null);
    setMemberFormName('');
    setMemberFormRole('');
    setMemberFormDescription('');
    setMemberFormImageUrl('');
    setMemberFormFile(null);
    setIsTeamModalOpen(true);
  };

  const handleOpenEditMember = (member: LandingTeamMember) => {
    setEditingTeamMember(member);
    setMemberFormName(member.name);
    setMemberFormRole(member.role);
    setMemberFormDescription(member.description);
    setMemberFormImageUrl(member.image_url || '');
    setMemberFormFile(null);
    setIsTeamModalOpen(true);
  };

  const handleSaveTeamMember = async () => {
    if (!memberFormName.trim() || !memberFormRole.trim() || !memberFormDescription.trim()) {
      showToast('Por favor completa los campos obligatorios del integrante.', 'error');
      return;
    }

    setSavingMember(true);
    let finalImageUrl = memberFormImageUrl;

    try {
      if (memberFormFile) {
        const compressed = await compressImage(memberFormFile, 800, 0.85);
        const fileExt = compressed.name.split('.').pop();
        const fileName = `team_${Date.now()}.${fileExt}`;
        const filePath = `team/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('cabin-images')
          .upload(filePath, compressed);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('cabin-images')
          .getPublicUrl(filePath);

        finalImageUrl = publicUrl;
      }

      if (editingTeamMember) {
        const { error } = await supabase
          .from('landing_team')
          .update({
            name: memberFormName,
            role: memberFormRole,
            description: memberFormDescription,
            image_url: finalImageUrl
          })
          .eq('id', editingTeamMember.id);

        if (error) throw error;
        showToast('Integrante actualizado exitosamente.', 'success');
      } else {
        const maxOrder = teamMembers.length > 0 ? Math.max(...teamMembers.map(m => m.order_index)) : -1;
        const { error } = await supabase
          .from('landing_team')
          .insert({
            name: memberFormName,
            role: memberFormRole,
            description: memberFormDescription,
            image_url: finalImageUrl,
            order_index: maxOrder + 1
          });

        if (error) throw error;
        showToast('Nuevo integrante añadido al equipo.', 'success');
      }

      setIsTeamModalOpen(false);
      fetchData();
    } catch (err: any) {
      showToast('Error al guardar integrante: ' + err.message, 'error');
    } finally {
      setSavingMember(false);
    }
  };

  const handleDeleteTeamMember = async (member: LandingTeamMember) => {
    if (!confirm(`¿Eliminar a ${member.name} del equipo de trabajo?`)) return;

    try {
      const { error } = await supabase
        .from('landing_team')
        .delete()
        .eq('id', member.id);

      if (error) throw error;

      showToast('Integrante eliminado del equipo.', 'success');
      fetchData();
    } catch (err: any) {
      showToast('Error al eliminar integrante: ' + err.message, 'error');
    }
  };

  const handleSwapTeamOrder = async (index1: number, index2: number) => {
    if (index1 < 0 || index1 >= teamMembers.length || index2 < 0 || index2 >= teamMembers.length) return;

    const item1 = teamMembers[index1];
    const item2 = teamMembers[index2];

    try {
      await supabase
        .from('landing_team')
        .update({ order_index: item2.order_index })
        .eq('id', item1.id);

      await supabase
        .from('landing_team')
        .update({ order_index: item1.order_index })
        .eq('id', item2.id);

      fetchData();
    } catch (err: any) {
      showToast('Error al reordenar equipo: ' + err.message, 'error');
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500 font-medium">Cargando gestión de Landing Page...</div>;
  }

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Encabezado Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">🎨 Gestión de Landing Page</h2>
          <p className="text-sm text-gray-500">Administra los textos, fotografías, reglas y secciones visibles en el portal web.</p>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className={`p-4 rounded-xl text-sm font-bold flex items-center justify-between transition-all shadow-sm ${
          toastMessage.type === 'error' 
            ? 'bg-red-50 text-red-600 border border-red-200' 
            : 'bg-green-50 text-green-700 border border-green-200'
        }`}>
          <span>{toastMessage.text}</span>
          <button onClick={() => setToastMessage(null)} className="text-xs opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Selector de Pestañas Superior (Estilo /admin/reservas) */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 pb-4">
        <button
          type="button"
          onClick={() => setActiveTab('hero')}
          className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
            activeTab === 'hero'
              ? 'bg-[#11d442] text-white shadow-sm'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          🌌 Hero & Portada
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('galeria_portada')}
          className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
            activeTab === 'galeria_portada'
              ? 'bg-[#11d442] text-white shadow-sm'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          🖼️ Galería Portada ({portadaGallery.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('galeria_recinto')}
          className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
            activeTab === 'galeria_recinto'
              ? 'bg-[#11d442] text-white shadow-sm'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          🎉 Galería Recinto (8h) ({recintoGallery.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('textos_reglas')}
          className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
            activeTab === 'textos_reglas'
              ? 'bg-[#11d442] text-white shadow-sm'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          📋 Textos & Reglas
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('equipo')}
          className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
            activeTab === 'equipo'
              ? 'bg-[#11d442] text-white shadow-sm'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          👥 Equipo ({teamMembers.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('contacto')}
          className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
            activeTab === 'contacto'
              ? 'bg-[#11d442] text-white shadow-sm'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          📍 Contacto & Ubicación
        </button>
      </div>

      {/* ========================================================================= */}
      {/* PESTAÑA 1: HERO & PORTADA PRINCIPAL                                      */}
      {/* ========================================================================= */}
      <div className={activeTab === 'hero' ? 'space-y-6 block' : 'hidden'}>
        <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              🌌 Banner del Hero Principal y Logotipo
            </h3>
            <p className="text-xs text-gray-400">Personaliza la primera sección de impacto visual de la portada web pública.</p>
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
                <p className="text-[10px] text-gray-400">📐 Recomendado: 1920x1080 px (16:9).</p>
                
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
                      <label className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold cursor-pointer">
                        ✕ Cambiar Fondo
                        <input 
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={e => e.target.files && e.target.files.length > 0 && setNewHeroBgFile(e.target.files[0])}
                        />
                      </label>
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
                <label className="block text-xs font-bold text-gray-500 uppercase">Logo Oficial del Rancho</label>
                <p className="text-[10px] text-gray-400">📐 Recomendado: Cuadrado (1:1).</p>
                
                <div className="flex items-center gap-4">
                  {newLogoFile ? (
                    <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-[#11d442] shadow-sm group">
                      <img src={URL.createObjectURL(newLogoFile)} alt="Preview Logo" className="w-full h-full object-cover" />
                      <button 
                        onClick={() => setNewLogoFile(null)}
                        type="button"
                        className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold"
                      >
                        ✕
                      </button>
                    </div>
                  ) : settings.logo_url ? (
                    <div className="relative w-16 h-16 rounded-full overflow-hidden border border-gray-200 shadow-sm group">
                      <img src={settings.logo_url} alt="Logo Actual" className="w-full h-full object-cover" />
                      <label className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[9px] font-bold cursor-pointer">
                        Cambiar
                        <input 
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={e => e.target.files && e.target.files.length > 0 && setNewLogoFile(e.target.files[0])}
                        />
                      </label>
                    </div>
                  ) : (
                    <label className="w-16 h-16 rounded-full border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-[#11d442] transition-colors bg-gray-50/50">
                      <span className="text-lg text-gray-400">🏷️</span>
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
                    <p className="text-[10px] text-gray-400">Se muestra en el Header y correos.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-50">
            <button 
              onClick={handleSaveSettings}
              disabled={savingSettings}
              className="bg-[#11d442] hover:bg-green-600 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-sm flex items-center gap-2 text-sm disabled:opacity-50"
            >
              {savingSettings ? 'Guardando...' : '✓ Guardar Configuración de Hero'}
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PESTAÑA 2: GALERÍA DE PORTADA (CABAÑAS Y GENERAL)                        */}
      {/* ========================================================================= */}
      <div className={activeTab === 'galeria_portada' ? 'space-y-6 block' : 'hidden'}>
        <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm space-y-6">
          <div className="border-b border-gray-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                🖼️ Galería de Momentos e Instalaciones (Portada General)
              </h3>
              <p className="text-xs text-gray-400">Fotografías del entorno de cabañas, tinajas y bosques que se muestran en la página principal.</p>
            </div>
            <div>
              <label className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm">
                <span>+ Seleccionar Fotos</span>
                <input 
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={e => {
                    if (e.target.files && e.target.files.length > 0) {
                      setSelectedPortadaFiles(prev => [...prev, ...Array.from(e.target.files!)]);
                    }
                  }}
                />
              </label>
            </div>
          </div>

          {/* Fotos seleccionadas en espera de subir */}
          {selectedPortadaFiles.length > 0 && (
            <div className="p-4 bg-blue-50/40 rounded-2xl border border-blue-100 space-y-3">
              <h4 className="text-xs font-bold text-blue-900 uppercase">Nuevas Fotos de Portada Seleccionadas ({selectedPortadaFiles.length})</h4>
              <div className="flex flex-wrap gap-3">
                {selectedPortadaFiles.map((file, i) => (
                  <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-blue-400 group shadow-sm">
                    <img src={URL.createObjectURL(file)} alt="Preview" className="w-full h-full object-cover" />
                    <button 
                      type="button"
                      onClick={() => setSelectedPortadaFiles(prev => prev.filter((_, idx) => idx !== i))}
                      className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex justify-end">
                <button 
                  onClick={() => handleUploadGallery('general')}
                  disabled={uploadingPortada}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md transition-colors disabled:opacity-50"
                >
                  {uploadingPortada ? 'Subiendo...' : '📤 Subir Imágenes a Portada'}
                </button>
              </div>
            </div>
          )}

          {/* Cuadrícula de fotos existentes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 pt-2">
            {portadaGallery.map((item, index) => (
              <div key={item.id} className="border border-gray-100 bg-white rounded-2xl overflow-hidden shadow-sm flex flex-col transition-all hover:shadow-md">
                <div className="relative aspect-[4/3] bg-gray-50 border-b border-gray-100 group">
                  <img src={item.image_url} alt={item.alt_text} className="w-full h-full object-cover" />
                  <span className="absolute top-2 left-2 bg-gray-900/80 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                    #{index + 1}
                  </span>
                  <div className="absolute inset-0 bg-black/50 text-white flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleSwapOrder(portadaGallery, index, index - 1)}
                      className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-sm disabled:opacity-20"
                      title="Mover arriba"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      disabled={index === portadaGallery.length - 1}
                      onClick={() => handleSwapOrder(portadaGallery, index, index + 1)}
                      className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-sm disabled:opacity-20"
                      title="Mover abajo"
                    >
                      ▼
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteGalleryItem(item)}
                      className="w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-xs"
                      title="Eliminar foto"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                <div className="p-3">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Título / SEO:</label>
                  <input 
                    type="text" 
                    defaultValue={item.alt_text}
                    onBlur={e => handleUpdateAltText(item.id, e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                    placeholder="Descripción de la foto..."
                  />
                </div>
              </div>
            ))}

            {portadaGallery.length === 0 && (
              <div className="col-span-full text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                <span className="text-3xl">🖼️</span>
                <p className="text-xs text-gray-500 font-bold mt-2">No hay imágenes en la galería de portada de Supabase.</p>
                <p className="text-[10px] text-gray-400 max-w-xs mx-auto mt-0.5">Se están mostrando las fotos estáticas locales por defecto en la portada web.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PESTAÑA 3: GALERÍA DE RECINTO COMPLETO / EVENTOS (NUEVA FUNCIÓN)          */}
      {/* ========================================================================= */}
      <div className={activeTab === 'galeria_recinto' ? 'space-y-6 block' : 'hidden'}>
        <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm space-y-6">
          <div className="border-b border-gray-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                🎉 Galería de Instalaciones para Eventos (/recinto-completo)
              </h3>
              <p className="text-xs text-gray-400">Fotografías de la piscina principal, pérgolas, quincho equipado y prados que verán los organizadores de paseos.</p>
            </div>
            <div>
              <label className="bg-[#11d442] hover:bg-green-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm">
                <span>+ Seleccionar Fotos de Recinto</span>
                <input 
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={e => {
                    if (e.target.files && e.target.files.length > 0) {
                      setSelectedRecintoFiles(prev => [...prev, ...Array.from(e.target.files!)]);
                    }
                  }}
                />
              </label>
            </div>
          </div>

          <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl text-xs text-emerald-900 space-y-1">
            <p className="font-bold">🌟 Información para el Administrador:</p>
            <p>Las fotografías cargadas aquí aparecerán automáticamente en la sección <strong>"Instalaciones Reales"</strong> de la página pública <a href="/recinto-completo" target="_blank" className="underline font-bold">/recinto-completo</a>. Además, la primera foto de la lista se utilizará como fondo de bienvenida.</p>
          </div>

          {/* Fotos de Recinto en espera de subir */}
          {selectedRecintoFiles.length > 0 && (
            <div className="p-4 bg-emerald-50/40 rounded-2xl border border-emerald-100 space-y-3">
              <h4 className="text-xs font-bold text-emerald-900 uppercase">Fotos de Recinto Seleccionadas ({selectedRecintoFiles.length})</h4>
              <div className="flex flex-wrap gap-3">
                {selectedRecintoFiles.map((file, i) => (
                  <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-[#11d442] group shadow-sm">
                    <img src={URL.createObjectURL(file)} alt="Preview" className="w-full h-full object-cover" />
                    <button 
                      type="button"
                      onClick={() => setSelectedRecintoFiles(prev => prev.filter((_, idx) => idx !== i))}
                      className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex justify-end">
                <button 
                  onClick={() => handleUploadGallery('recinto')}
                  disabled={uploadingRecinto}
                  className="bg-[#11d442] hover:bg-green-600 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md transition-colors disabled:opacity-50"
                >
                  {uploadingRecinto ? 'Subiendo...' : '📤 Subir Fotos a Recinto Completo'}
                </button>
              </div>
            </div>
          )}

          {/* Cuadrícula de fotos de recinto existentes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 pt-2">
            {recintoGallery.map((item, index) => (
              <div key={item.id} className="border border-gray-100 bg-white rounded-2xl overflow-hidden shadow-sm flex flex-col transition-all hover:shadow-md">
                <div className="relative aspect-[4/3] bg-gray-50 border-b border-gray-100 group">
                  <img src={item.image_url} alt={item.alt_text} className="w-full h-full object-cover" />
                  <span className="absolute top-2 left-2 bg-[#11d442] text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                    Recinto #{index + 1}
                  </span>
                  <div className="absolute inset-0 bg-black/50 text-white flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleSwapOrder(recintoGallery, index, index - 1)}
                      className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-sm disabled:opacity-20"
                      title="Mover arriba"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      disabled={index === recintoGallery.length - 1}
                      onClick={() => handleSwapOrder(recintoGallery, index, index + 1)}
                      className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-sm disabled:opacity-20"
                      title="Mover abajo"
                    >
                      ▼
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteGalleryItem(item)}
                      className="w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-xs"
                      title="Eliminar foto"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                <div className="p-3">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Título de la Instalación:</label>
                  <input 
                    type="text" 
                    defaultValue={item.alt_text}
                    onBlur={e => handleUpdateAltText(item.id, e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-[#11d442] font-medium"
                    placeholder="Ej. Piscina y Prados Verdes..."
                  />
                </div>
              </div>
            ))}

            {recintoGallery.length === 0 && (
              <div className="col-span-full text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50 space-y-1">
                <span className="text-3xl">🎉</span>
                <p className="text-xs text-gray-500 font-bold mt-2">No hay fotos personalizadas de recinto cargadas aún.</p>
                <p className="text-[10px] text-gray-400 max-w-sm mx-auto">
                  La página web de eventos actualmente muestra las 4 fotos oficiales de muestra (piscina principal, pérgolas y quincho). Sube fotos aquí para personalizarla.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PESTAÑA 4: TEXTOS DE SECCIONES Y REGLAS DE CONVIVENCIA                    */}
      {/* ========================================================================= */}
      <div className={activeTab === 'textos_reglas' ? 'space-y-6 block' : 'hidden'}>
        <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              📋 Textos Informativos y Reglas de Convivencia
            </h3>
            <p className="text-xs text-gray-400">Configura los títulos descriptivos y las normas oficiales de la estadía.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Lado izquierdo: Textos de Cabañas y SERNATUR */}
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
                      className="w-full px-3 py-2 bg-gray-50/50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#11d442] focus:bg-white text-xs font-semibold text-gray-800"
                      value={cabinsTitle}
                      onChange={e => setCabinsTitle(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Subtítulo Descriptivo Cabañas</label>
                    <textarea 
                      className="w-full px-3 py-2 bg-gray-50/50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#11d442] focus:bg-white text-xs text-gray-600 min-h-[60px] resize-none"
                      value={cabinsSubtitle}
                      onChange={e => setCabinsSubtitle(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-gray-800 border-b border-gray-50 pb-2 flex items-center gap-1.5">
                  <span>🖼️</span> Sección de Galería de Portada
                </h4>
                <div className="space-y-3 mt-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Título Sección Galería</label>
                    <input 
                      type="text"
                      className="w-full px-3 py-2 bg-gray-50/50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#11d442] focus:bg-white text-xs font-semibold text-gray-800"
                      value={galleryTitle}
                      onChange={e => setGalleryTitle(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Subtítulo Descriptivo Galería</label>
                    <textarea 
                      className="w-full px-3 py-2 bg-gray-50/50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#11d442] focus:bg-white text-xs text-gray-600 min-h-[60px] resize-none"
                      value={gallerySubtitle}
                      onChange={e => setGallerySubtitle(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-gray-800 border-b border-gray-50 pb-2 flex items-center gap-1.5">
                  <span>🎖️</span> Sello SERNATUR
                </h4>
                <div className="space-y-3 mt-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Título del Registro</label>
                    <input 
                      type="text"
                      className="w-full px-3 py-2 bg-gray-50/50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#11d442] focus:bg-white text-xs font-semibold text-gray-800"
                      value={sernaturTitle}
                      onChange={e => setSernaturTitle(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Subtítulo / Vigencia</label>
                    <input 
                      type="text"
                      className="w-full px-3 py-2 bg-gray-50/50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#11d442] focus:bg-white text-xs text-gray-600"
                      value={sernaturSubtitle}
                      onChange={e => setSernaturSubtitle(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Lado derecho: Reglas de Convivencia */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-gray-50 pb-2">
                <h4 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                  <span>📋</span> Reglas de Convivencia
                </h4>
                <button
                  type="button"
                  onClick={handleAddRule}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-2.5 py-1 rounded-lg text-xs font-bold transition-colors"
                >
                  + Añadir Regla
                </button>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Título de Sección de Reglas</label>
                <input 
                  type="text"
                  className="w-full px-3 py-2 bg-gray-50/50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#11d442] focus:bg-white text-xs font-semibold text-gray-800"
                  value={rulesTitle}
                  onChange={e => setRulesTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {rulesList.map((rule, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-400 w-5 text-right">{idx + 1}.</span>
                    <input 
                      type="text"
                      className="flex-1 px-3 py-2 bg-gray-50/50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#11d442] focus:bg-white text-xs text-gray-700"
                      value={rule}
                      onChange={e => handleUpdateRule(idx, e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteRule(idx)}
                      className="text-red-400 hover:text-red-600 text-sm font-bold px-2 py-1"
                      title="Eliminar regla"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-50">
            <button 
              onClick={handleSaveSettings}
              disabled={savingSettings}
              className="bg-[#11d442] hover:bg-green-600 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-sm flex items-center gap-2 text-sm disabled:opacity-50"
            >
              {savingSettings ? 'Guardando...' : '✓ Guardar Textos y Reglas'}
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PESTAÑA 5: EQUIPO DE TRABAJO                                              */}
      {/* ========================================================================= */}
      <div className={activeTab === 'equipo' ? 'space-y-6 block' : 'hidden'}>
        <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm space-y-6">
          <div className="border-b border-gray-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                👥 Equipo de Trabajo y Hospitalidad
              </h3>
              <p className="text-xs text-gray-400">Administra a las personas que atienden Rancho Carmelitas (foto, nombre, rol y breve descripción).</p>
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

          {/* Cuadrícula del equipo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pt-2">
            {teamMembers.map((member, index) => (
              <div 
                key={member.id} 
                className="border border-gray-100 bg-white rounded-3xl overflow-hidden shadow-sm flex flex-col justify-between hover:shadow-md transition-all group"
              >
                <div>
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
                    <span className="absolute top-2 left-2 bg-gray-900/80 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                      #{index + 1}
                    </span>
                    <div className="absolute inset-0 bg-black/50 text-white flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => handleSwapTeamOrder(index, index - 1)}
                        className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-sm disabled:opacity-20"
                        title="Mover arriba"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        disabled={index === teamMembers.length - 1}
                        onClick={() => handleSwapTeamOrder(index, index + 1)}
                        className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-sm disabled:opacity-20"
                        title="Mover abajo"
                      >
                        ▼
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEditMember(member)}
                        className="w-8 h-8 rounded-full bg-[#11d442] hover:bg-green-600 flex items-center justify-center text-xs"
                        title="Editar integrante"
                      >
                        ✏️
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteTeamMember(member)}
                        className="w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-xs"
                        title="Eliminar integrante"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  <div className="p-4 space-y-2">
                    <span className="inline-block bg-[#11d442]/10 text-[#0fa836] border border-[#11d442]/30 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                      {member.role}
                    </span>
                    <h4 className="font-bold text-gray-900 text-sm">{member.name}</h4>
                    <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">
                      {member.description}
                    </p>
                  </div>
                </div>

                <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-[11px]">
                  <button
                    type="button"
                    onClick={() => handleOpenEditMember(member)}
                    className="text-gray-600 hover:text-[#11d442] font-semibold flex items-center gap-1"
                  >
                    <span>✏️</span> Editar
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
              <div className="col-span-full text-center py-12 border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50/50 space-y-1">
                <span className="text-4xl">👥</span>
                <p className="text-sm text-gray-600 font-bold">No hay integrantes registrados en la base de datos.</p>
                <p className="text-xs text-gray-400 max-w-sm mx-auto">
                  Haz clic en "Añadir Integrante" para registrar a los miembros reales del equipo.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PESTAÑA 6: DATOS DE CONTACTO Y UBICACIÓN                                 */}
      {/* ========================================================================= */}
      <div className={activeTab === 'contacto' ? 'space-y-6 block' : 'hidden'}>
        <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              📍 Datos de Contacto y Ubicación en Mapa
            </h3>
            <p className="text-xs text-gray-400">Información visible en el pie de página y enlace a Google Maps para los visitantes.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Dirección Física</label>
              <input 
                type="text"
                className="w-full px-3 py-2 bg-gray-50/50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#11d442] focus:bg-white text-xs font-semibold text-gray-800"
                value={contactAddress}
                onChange={e => setContactAddress(e.target.value)}
                placeholder="Avenida Las Salinas..."
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Teléfono Visible</label>
              <input 
                type="text"
                className="w-full px-3 py-2 bg-gray-50/50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#11d442] focus:bg-white text-xs font-semibold text-gray-800"
                value={contactPhone}
                onChange={e => setContactPhone(e.target.value)}
                placeholder="+56 9..."
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Email de Contacto</label>
              <input 
                type="email"
                className="w-full px-3 py-2 bg-gray-50/50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#11d442] focus:bg-white text-xs font-semibold text-gray-800"
                value={contactEmail}
                onChange={e => setContactEmail(e.target.value)}
                placeholder="contacto@ranchocarmelitas.cl"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Enlace a Google Maps</label>
              <input 
                type="url"
                className="w-full px-3 py-2 bg-gray-50/50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#11d442] focus:bg-white text-xs font-semibold text-gray-800"
                value={contactMapsUrl}
                onChange={e => setContactMapsUrl(e.target.value)}
                placeholder="https://maps.app.goo.gl/..."
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Leyenda de Ubicación</label>
              <input 
                type="text"
                className="w-full px-3 py-2 bg-gray-50/50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#11d442] focus:bg-white text-xs font-semibold text-gray-800"
                value={contactLocationLegend}
                onChange={e => setContactLocationLegend(e.target.value)}
                placeholder="* Pullally está ubicado en la Región de Valparaíso..."
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-50">
            <button 
              onClick={handleSaveSettings}
              disabled={savingSettings}
              className="bg-[#11d442] hover:bg-green-600 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-sm flex items-center gap-2 text-sm disabled:opacity-50"
            >
              {savingSettings ? 'Guardando...' : '✓ Guardar Contacto y Ubicación'}
            </button>
          </div>
        </div>
      </div>

      {/* MODAL PARA AÑADIR / EDITAR INTEGRANTE DEL EQUIPO */}
      {isTeamModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 space-y-5">
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
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Fotografía del Integrante</label>
                <div className="flex items-center gap-4">
                  <div className="relative w-20 h-24 rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
                    {memberFormFile ? (
                      <img src={URL.createObjectURL(memberFormFile)} alt="Preview" className="w-full h-full object-cover" />
                    ) : memberFormImageUrl ? (
                      <img src={memberFormImageUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl text-gray-300">👤</span>
                    )}
                  </div>

                  <div className="space-y-2 flex-1">
                    <label className="bg-white border border-gray-200 hover:border-[#11d442] text-gray-700 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-sm">
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
                        ✓ Archivo: {memberFormFile.name}
                      </p>
                    )}

                    <input
                      type="url"
                      className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-[#11d442] text-xs"
                      placeholder="O URL directa..."
                      value={memberFormImageUrl}
                      onChange={e => setMemberFormImageUrl(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#11d442] text-xs font-semibold text-gray-800"
                  placeholder="Ej. Carmen Gloria Morales"
                  value={memberFormName}
                  onChange={e => setMemberFormName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Rol / Cargo *</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#11d442] text-xs font-semibold text-gray-800"
                  placeholder="Ej. Anfitriona & Administración"
                  value={memberFormRole}
                  onChange={e => setMemberFormRole(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Breve Descripción *</label>
                <textarea
                  required
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#11d442] text-xs text-gray-700 resize-none"
                  placeholder="Describe su labor en el rancho..."
                  value={memberFormDescription}
                  onChange={e => setMemberFormDescription(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIsTeamModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveTeamMember}
                disabled={savingMember}
                className="bg-[#11d442] hover:bg-green-600 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md transition-all disabled:opacity-50"
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
