'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';

interface Profile {
  full_name: string;
}

interface Idea {
  id: string;
  idea: string;
  type: 'idea' | 'bug';
  description?: string;
  evidence_urls: string[];
  priority: number;
  completed: boolean;
  completed_at?: string | null;
  created_at: string;
  created_by?: string;
  profiles?: Profile | null;
}

export default function AdminDesarrolloPage() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Formulario
  const [ideaTitle, setIdeaTitle] = useState('');
  const [type, setType] = useState<'idea' | 'bug'>('idea');
  const [description, setDescription] = useState('');
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Edición
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');

  // Drag & Drop
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Detalles expandidos
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Visor de Imagen (Lightbox)
  const [activeImage, setActiveImage] = useState<string | null>(null);

  // Referencias para el área de pegado
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchSessionAndData();
  }, []);

  async function fetchSessionAndData() {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUserId(session.user.id);
      }
      await fetchIdeas();
    } catch (err) {
      console.error('Error inicializando página de desarrollo:', err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchIdeas() {
    try {
      const { data, error } = await supabase
        .from('desarrollo_ideas')
        .select(`
          *,
          profiles:created_by (
            full_name
          )
        `)
        .order('priority', { ascending: true });

      if (error) throw error;
      setIdeas(data || []);
    } catch (err) {
      console.error('Error cargando ideas:', err);
    }
  }

  // Manejadores de archivos (Subida, Arrastre y Pegado)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(Array.from(e.target.files));
    }
  };

  const addFiles = (files: File[]) => {
    const validImageFiles = files.filter(file => file.type.startsWith('image/'));
    if (validImageFiles.length === 0) return;

    setEvidenceFiles(prev => [...prev, ...validImageFiles]);

    // Crear URLs de previsualización locales
    const newPreviews = validImageFiles.map(file => URL.createObjectURL(file));
    setPreviews(prev => [...prev, ...newPreviews]);
  };

  const removeQueuedFile = (index: number) => {
    // Revocar la URL para liberar memoria
    URL.revokeObjectURL(previews[index]);
    setPreviews(prev => prev.filter((_, i) => i !== index));
    setEvidenceFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Drag and Drop de archivos sobre el Dropzone
  const handleDropzoneDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropzoneDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  // Pegado de imágenes (Ctrl+V)
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    const files: File[] = [];

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        if (blob) {
          const file = new File([blob], `clipboard_image_${Date.now()}_${i}.png`, { type: blob.type });
          files.push(file);
        }
      }
    }

    if (files.length > 0) {
      e.preventDefault();
      addFiles(files);
    }
  };

  // Crear la idea / bug
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ideaTitle.trim()) return;

    setSubmitting(true);
    const uploadedUrls: string[] = [];

    try {
      // 1. Subir archivos a Supabase Storage
      for (const file of evidenceFiles) {
        const fileExt = file.name.split('.').pop() || 'png';
        const fileName = `evidence_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `bugs/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('cabin-images')
          .upload(filePath, file);

        if (uploadError) {
          throw new Error(`Error subiendo evidencia: ${uploadError.message}`);
        }

        const { data: { publicUrl } } = supabase.storage
          .from('cabin-images')
          .getPublicUrl(filePath);

        uploadedUrls.push(publicUrl);
      }

      // 2. Determinar la prioridad (al final)
      const nextPriority = ideas.length > 0 ? Math.max(...ideas.map(i => i.priority)) + 1 : 1;

      // 3. Insertar registro en Supabase
      const { error: insertError } = await supabase
        .from('desarrollo_ideas')
        .insert({
          idea: ideaTitle,
          type,
          description: description || null,
          evidence_urls: uploadedUrls,
          priority: nextPriority,
          created_by: userId
        });

      if (insertError) throw insertError;

      // Resetear formulario
      setIdeaTitle('');
      setDescription('');
      setEvidenceFiles([]);
      // Revocar previsualizaciones
      previews.forEach(p => URL.revokeObjectURL(p));
      setPreviews([]);
      
      // Recargar datos
      await fetchIdeas();
    } catch (err) {
      console.error('Error al guardar reporte:', err);
      alert('Ocurrió un error al registrar el reporte de desarrollo. Por favor reintenta.');
    } finally {
      setSubmitting(false);
    }
  };

  // Alternar estado completado
  const handleToggleCompleted = async (id: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    const newCompletedAt = newStatus ? new Date().toISOString() : null;

    // Actualización optimista local
    setIdeas(prev =>
      prev.map(item =>
        item.id === id
          ? { ...item, completed: newStatus, completed_at: newCompletedAt }
          : item
      )
    );

    try {
      const { error } = await supabase
        .from('desarrollo_ideas')
        .update({
          completed: newStatus,
          completed_at: newCompletedAt
        })
        .eq('id', id);

      if (error) throw error;
    } catch (err: any) {
      console.error('Error al cambiar completado:', err.message || err.details || err);
      alert('Error al guardar el estado: ' + (err.message || err.details || JSON.stringify(err) || 'Error desconocido'));
      await fetchIdeas();
    }
  };

  // Guardar edición
  const handleSaveEdit = async (id: string) => {
    if (!editTitle.trim()) return;
    try {
      const { error } = await supabase
        .from('desarrollo_ideas')
        .update({
          idea: editTitle,
          description: editDescription
        })
        .eq('id', id);

      if (error) throw error;
      setEditingId(null);
      await fetchIdeas();
    } catch (err) {
      console.error('Error al editar:', err);
    }
  };

  // Eliminar idea
  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este desarrollo/mejora?')) return;

    try {
      // 1. Obtener la idea para borrar sus evidencias físicas en Storage
      const itemToDelete = ideas.find(i => i.id === id);
      if (itemToDelete && itemToDelete.evidence_urls && itemToDelete.evidence_urls.length > 0) {
        for (const url of itemToDelete.evidence_urls) {
          // Extraer la ruta relativa del Storage desde la URL pública
          // URL típica: https://.../storage/v1/object/public/cabin-images/bugs/nombre.png
          const parts = url.split('/cabin-images/');
          if (parts.length > 1) {
            const filePath = parts[1];
            await supabase.storage.from('cabin-images').remove([filePath]);
          }
        }
      }

      // 2. Eliminar de la base de datos
      const { error } = await supabase
        .from('desarrollo_ideas')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // 3. Reordenar prioridades locales consecutivamente para no dejar huecos
      const remaining = ideas.filter(i => i.id !== id);
      const reordered = remaining.map((item, index) => ({
        id: item.id,
        idea: item.idea,
        type: item.type,
        description: item.description,
        evidence_urls: item.evidence_urls,
        priority: index + 1,
        created_by: item.created_by
      }));

      if (reordered.length > 0) {
        await supabase.from('desarrollo_ideas').upsert(reordered);
      }

      await fetchIdeas();
    } catch (err) {
      console.error('Error al eliminar:', err);
    }
  };

  // --- Lógica Drag & Drop Nativo (HTML5) para Reordenamiento por Prioridad ---

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    // Crear una previsualización de arrastre sutil en Firefox/Chrome
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragEnter = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    // Reordenamiento reactivo en la UI local para dar feedback premium al arrastrar
    const updated = [...ideas];
    const item = updated[draggedIndex];
    updated.splice(draggedIndex, 1);
    updated.splice(index, 0, item);

    setDraggedIndex(index);
    setIdeas(updated);
  };

  const handleDragEnd = async () => {
    setDraggedIndex(null);
    setDragOverIndex(null);

    // Persistir el nuevo orden en Supabase mapeando el índice consecutivamente
    const updates = ideas.map((item, index) => ({
      id: item.id,
      idea: item.idea,
      type: item.type,
      description: item.description,
      evidence_urls: item.evidence_urls,
      priority: index + 1,
      created_by: item.created_by,
      created_at: item.created_at
    }));

    try {
      const { error } = await supabase
        .from('desarrollo_ideas')
        .upsert(updates);

      if (error) throw error;
      await fetchIdeas();
    } catch (err) {
      console.error('Error persistiendo reordenamiento de prioridades:', err);
      alert('Error al guardar el orden de prioridades. Se restaurará el orden previo.');
      fetchIdeas();
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('es-CL', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#11d442] mb-4"></div>
        <p className="text-gray-500 text-sm">Cargando roadmap de desarrollo...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8" onPaste={handlePaste}>
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <span className="p-2 bg-green-50 text-[#11d442] rounded-xl text-lg">💡</span>
            Desarrollo, Correcciones y Roadmap
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Visualiza, propone y prioriza las ideas de desarrollo o reporta fallas en el sistema. Arrastra las tarjetas para cambiar su orden de prioridad.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-[#f0fdf4] border border-green-150 px-4 py-2 rounded-xl text-center">
            <p className="text-2xl font-bold text-[#11d442]">{ideas.filter(i => i.type === 'idea').length}</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Propuestas</p>
          </div>
          <div className="bg-red-50 border border-red-150 px-4 py-2 rounded-xl text-center">
            <p className="text-2xl font-bold text-red-600">{ideas.filter(i => i.type === 'bug').length}</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Bugs</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 px-4 py-2 rounded-xl text-center">
            <p className="text-2xl font-bold text-blue-600">{ideas.filter(i => i.completed).length}</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Completadas</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulario de Alta */}
        <div className="lg:col-span-1">
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6 sticky top-6">
            <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
              📝 Registrar Requerimiento
            </h3>

            {/* Selector de Tipo */}
            <div className="grid grid-cols-2 p-1 bg-gray-100 rounded-xl border border-gray-200">
              <button
                type="button"
                onClick={() => setType('idea')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  type === 'idea'
                    ? 'bg-white text-gray-900 shadow-sm font-bold'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <span>💡</span> Idea / Mejora
              </button>
              <button
                type="button"
                onClick={() => setType('bug')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  type === 'bug'
                    ? 'bg-white text-red-600 shadow-sm font-bold'
                    : 'text-gray-500 hover:text-red-500'
                }`}
              >
                <span>🐛</span> Reportar Bug
              </button>
            </div>

            {/* Input Título */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider">
                {type === 'idea' ? 'Idea de Desarrollo' : 'Título del Bug'}
              </label>
              <input
                type="text"
                required
                value={ideaTitle}
                onChange={(e) => setIdeaTitle(e.target.value)}
                placeholder={type === 'idea' ? 'Ej: Crear exportación de reservas a Excel' : 'Ej: El botón de guardar se bloquea en Safari'}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#11d442] focus:border-transparent text-sm bg-gray-50/50"
              />
            </div>

            {/* Sección de Descripción y Evidencias */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider">
                {type === 'idea' ? 'Descripción de la propuesta' : 'Explicación de la falla'}
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={type === 'idea' ? 'Describe los detalles de la idea, beneficios y cómo debería funcionar...' : 'Describe los pasos para reproducir el bug, comportamiento esperado y comportamiento observado...'}
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#11d442] focus:border-transparent text-sm bg-gray-50/50 resize-none"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider">
                {type === 'idea' ? 'Imágenes de Referencia' : 'Evidencia en Fotos'}
              </label>
              
              {/* Dropzone */}
              <div
                onDragOver={handleDropzoneDragOver}
                onDrop={handleDropzoneDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-200 hover:border-[#11d442] rounded-xl p-4 text-center cursor-pointer transition-colors bg-gray-50/50 flex flex-col items-center justify-center gap-2 group"
              >
                <svg className="w-8 h-8 text-gray-400 group-hover:text-[#11d442] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-xs font-medium text-gray-600">
                  Arrastra fotos aquí, haz clic para explorar o presiona <span className="bg-gray-200 px-1 rounded">Ctrl+V</span> para pegar una captura.
                </p>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  multiple
                  className="hidden"
                />
              </div>

              {/* Previsualización local de archivos en cola */}
              {previews.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mt-2 pt-2 border-t border-gray-100">
                  {previews.map((preview, index) => (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden group border border-gray-200 bg-gray-100">
                      <img src={preview} alt="Vista previa" className="object-cover w-full h-full" />
                      <button
                        type="button"
                        onClick={() => removeQueuedFile(index)}
                        className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-sm opacity-90 hover:opacity-100 transition-opacity"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Botón de Envío */}
            <button
              type="submit"
              disabled={submitting || !ideaTitle.trim()}
              className={`w-full py-3 px-4 rounded-xl font-semibold text-white transition-all shadow-sm flex items-center justify-center gap-2 ${
                submitting || !ideaTitle.trim()
                  ? 'bg-gray-300 cursor-not-allowed'
                  : type === 'bug'
                    ? 'bg-red-600 hover:bg-red-700 hover:shadow-md'
                    : 'bg-[#11d442] hover:bg-[#0fb337] hover:shadow-md'
              }`}
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Guardando reporte...
                </>
              ) : (
                <>
                  <span>{type === 'bug' ? '🐛 Reportar Fallo' : '💡 Agregar Requerimiento'}</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Lista de Ideas y Roadmap (Drag & Drop) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
              📌 Tareas y Prioridades
            </h3>
            <span className="text-xs text-gray-400 italic">Arrastra las tarjetas para reordenar la prioridad</span>
          </div>

          {ideas.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center shadow-sm">
              <span className="text-4xl">🎉</span>
              <h4 className="font-bold text-gray-700 mt-3">¡Todo al día!</h4>
              <p className="text-gray-400 text-sm mt-1">No hay tareas o correcciones reportadas en este momento.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {ideas.map((item, index) => {
                const isEditing = editingId === item.id;
                const isExpanded = expandedId === item.id;
                const isDragged = draggedIndex === index;

                return (
                  <div
                    key={item.id}
                    draggable={!isEditing}
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnter={(e) => handleDragEnter(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`rounded-2xl border transition-all ${
                      item.completed 
                        ? 'bg-gray-50/70 border-gray-200/60 opacity-80' 
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    } ${
                      isDragged 
                        ? 'opacity-40 border-dashed border-[#11d442] shadow-inner scale-[0.99]' 
                        : dragOverIndex === index
                          ? 'border-[#11d442] shadow-md scale-[1.01] bg-green-50/5'
                          : 'shadow-sm'
                    }`}
                  >
                    {/* Fila principal de la tarjeta */}
                    <div className="p-5 flex items-start gap-4">
                      {/* Control de Arrastre */}
                      <div className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 py-1 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 8h16M4 16h16" />
                        </svg>
                      </div>

                      {/* Checkbox de completado */}
                      <div className="flex items-center self-start py-0.5">
                        <button
                          type="button"
                          onClick={() => handleToggleCompleted(item.id, item.completed)}
                          className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                            item.completed
                              ? 'bg-[#11d442] border-[#11d442] text-white shadow-sm'
                              : 'bg-white border-gray-300 hover:border-[#11d442]'
                          }`}
                          title={item.completed ? "Marcar como pendiente" : "Marcar como completado"}
                        >
                          {item.completed && (
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      </div>

                      {/* Contenido principal */}
                      <div className="flex-1 min-w-0">
                        {isEditing ? (
                          <div className="space-y-3">
                            <input
                              type="text"
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#11d442]"
                            />
                            {item.type === 'bug' && (
                              <textarea
                                value={editDescription}
                                onChange={(e) => setEditDescription(e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#11d442] resize-none"
                                rows={3}
                              />
                            )}
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => setEditingId(null)}
                                className="px-3 py-1.5 text-xs font-semibold text-gray-500 hover:bg-gray-100 rounded-lg"
                              >
                                Cancelar
                              </button>
                              <button
                                onClick={() => handleSaveEdit(item.id)}
                                className="px-3 py-1.5 text-xs font-semibold text-white bg-[#11d442] hover:bg-[#0fb337] rounded-lg shadow-sm"
                              >
                                Guardar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              {/* Badge Prioridad */}
                              <span className="bg-gray-100 text-gray-700 text-xs font-extrabold px-2.5 py-0.5 rounded-full border border-gray-200">
                                #{index + 1}
                              </span>

                              {/* Badge Tipo */}
                              {item.type === 'bug' ? (
                                <span className="bg-red-50 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-md border border-red-100 uppercase flex items-center gap-0.5">
                                  <span>🐛</span> bug
                                </span>
                              ) : (
                                <span className="bg-green-50 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-md border border-green-100 uppercase flex items-center gap-0.5">
                                  <span>💡</span> mejora
                                </span>
                              )}

                              {/* Badge Completado */}
                              {item.completed && item.completed_at ? (
                                <span className="bg-green-100 text-green-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-md border border-green-200 flex items-center gap-0.5 shadow-sm">
                                  <span>✓</span> completado el {formatDate(item.completed_at)}
                                </span>
                              ) : (
                                <span className="bg-yellow-50 text-yellow-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-md border border-yellow-200 flex items-center gap-0.5">
                                  <span>⏳</span> pendiente
                                </span>
                              )}

                              {/* Fecha */}
                              <span className="text-xs text-gray-400">
                                Creado: {formatDate(item.created_at)}
                              </span>

                              {/* Reportado por */}
                              {item.profiles?.full_name && (
                                <span className="text-xs text-gray-400 bg-gray-50 border border-gray-100 px-1.5 py-0.5 rounded">
                                  Por: {item.profiles.full_name}
                                </span>
                              )}
                            </div>

                            {/* Título de la idea */}
                            <h4 className={`text-sm font-bold break-words transition-all ${
                              item.completed 
                                ? 'text-gray-400 line-through decoration-gray-300 decoration-1' 
                                : 'text-gray-900'
                            }`}>
                              {item.idea}
                            </h4>
                          </div>
                        )}
                      </div>

                      {/* Botones de acción */}
                      {!isEditing && (
                        <div className="flex items-center gap-1.5 self-start">
                          {/* Botón expandir detalles (para bugs o tareas con descripción) */}
                          {(item.description || (item.evidence_urls && item.evidence_urls.length > 0)) && (
                            <button
                              onClick={() => setExpandedId(isExpanded ? null : item.id)}
                              className={`p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors ${
                                isExpanded ? 'bg-gray-100 text-gray-700' : ''
                              }`}
                              title="Ver detalles"
                            >
                              <svg className={`w-4 h-4 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                          )}

                          {/* Editar */}
                          <button
                            onClick={() => {
                              setEditingId(item.id);
                              setEditTitle(item.idea);
                              setEditDescription(item.description || '');
                            }}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-750 hover:bg-gray-50 transition-colors"
                            title="Editar"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>

                          {/* Eliminar */}
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Eliminar"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Bloque expandible de detalles (Explicación y Evidencias) */}
                    {isExpanded && !isEditing && (
                      <div className="px-5 pb-5 pt-1 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl space-y-4">
                        {/* Explicación de texto */}
                        {item.description && (
                          <div className="space-y-1.5">
                            <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                              Explicación detallada
                            </h5>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed bg-white p-3.5 rounded-xl border border-gray-200">
                              {item.description}
                            </p>
                          </div>
                        )}

                        {/* Evidencias fotográficas */}
                        {item.evidence_urls && item.evidence_urls.length > 0 && (
                          <div className="space-y-2">
                            <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                              Evidencia Visual ({item.evidence_urls.length})
                            </h5>
                            <div className="flex flex-wrap gap-2.5">
                              {item.evidence_urls.map((url, imgIndex) => (
                                <div
                                  key={imgIndex}
                                  onClick={() => setActiveImage(url)}
                                  className="relative w-24 h-24 rounded-xl overflow-hidden cursor-zoom-in border border-gray-200 bg-white hover:border-[#11d442] hover:shadow transition-all group"
                                >
                                  <img
                                    src={url}
                                    alt={`Evidencia ${imgIndex + 1}`}
                                    className="object-cover w-full h-full group-hover:scale-105 transition-transform"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox / Visor de Imagen a pantalla completa */}
      {activeImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 cursor-zoom-out"
          onClick={() => setActiveImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] flex items-center justify-center">
            <img
              src={activeImage}
              alt="Evidencia Ampliada"
              className="max-w-full max-h-[85vh] rounded-xl object-contain shadow-2xl border border-white/10"
            />
            <button
              onClick={() => setActiveImage(null)}
              className="absolute top-2 right-2 md:-top-10 md:-right-10 text-white hover:text-gray-300 bg-black/50 md:bg-transparent rounded-full p-2"
              title="Cerrar visor"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
