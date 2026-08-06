'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface AuditLog {
  id: string;
  table_name: string;
  record_id: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  old_data: any;
  new_data: any;
  performed_by_id: string | null;
  performed_by_email: string | null;
  performed_by_name: string | null;
  user_role: string | null;
  created_at: string;
}

export default function AuditoriaPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // Filtros
  const [filterAction, setFilterAction] = useState<string>('ALL');
  const [filterTable, setFilterTable] = useState<string>('ALL');
  const [filterUser, setFilterUser] = useState<string>('');
  const [filterDate, setFilterDate] = useState<string>('');

  useEffect(() => {
    fetchLogs();
  }, [filterAction, filterTable, filterUser, filterDate]);

  async function fetchLogs() {
    setLoading(true);
    try {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (filterAction !== 'ALL') {
        query = query.eq('action', filterAction);
      }

      if (filterTable !== 'ALL') {
        query = query.eq('table_name', filterTable);
      }

      if (filterUser) {
        query = query.or(`performed_by_email.ilike.%${filterUser}%,performed_by_name.ilike.%${filterUser}%`);
      }

      if (filterDate) {
        // Filtro por fecha de inicio del día seleccionado
        const startOfDay = new Date(filterDate);
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date(filterDate);
        endOfDay.setHours(23, 59, 59, 999);

        query = query.gte('created_at', startOfDay.toISOString()).lte('created_at', endOfDay.toISOString());
      }

      // Limitar a 100 resultados por rendimiento y claridad
      query = query.limit(100);

      const { data, error } = await query;
      if (error) throw error;
      setLogs(data || []);
    } catch (err) {
      console.error('Error al consultar la bitácora de auditoría:', err);
    } finally {
      setLoading(false);
    }
  }

  const [cabinsMap, setCabinsMap] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchCabins();
  }, []);

  async function fetchCabins() {
    try {
      const { data } = await supabase.from('cabins').select('id, name');
      if (data) {
        const map: Record<string, string> = {};
        data.forEach((c) => {
          map[c.id] = c.name;
        });
        setCabinsMap(map);
      }
    } catch (err) {
      console.error('Error cargando cabañas para auditoría:', err);
    }
  }

  // Helper para renderizar los cambios clave en formato amigable
  const renderDataDiff = (log: AuditLog) => {
    if (log.action === 'INSERT') {
      return (
        <div className="text-xs text-gray-600 bg-green-50/50 p-3 rounded-lg border border-green-100 max-h-40 overflow-y-auto font-mono">
          <span className="font-bold text-green-700 block mb-1">Registro Creado:</span>
          {JSON.stringify(log.new_data, null, 2)}
        </div>
      );
    }
    if (log.action === 'DELETE') {
      return (
        <div className="text-xs text-gray-600 bg-red-50/50 p-3 rounded-lg border border-red-100 max-h-40 overflow-y-auto font-mono">
          <span className="font-bold text-red-700 block mb-1">Registro Eliminado:</span>
          {JSON.stringify(log.old_data, null, 2)}
        </div>
      );
    }
        // Para updates, encontrar y mostrar sólo los campos que realmente cambiaron
    const changes: Record<string, { old: any; new: any }> = {};
    if (log.old_data && log.new_data) {
      Object.keys(log.new_data).forEach((key) => {
        if (key === 'updated_at' || key === 'action_type' || key === 'status') return; // Excluir campos técnicos del diff
        const oldVal = log.old_data[key];
        const newVal = log.new_data[key];
        if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
          // Ignorar marcas de tiempo de actualización si es ruidoso, u opcionalmente mantenerlas
          changes[key] = { old: oldVal, new: newVal };
        }
      });
    }

    return (
      <div className="text-xs text-gray-600 bg-amber-50/50 p-3 rounded-lg border border-amber-100 max-h-48 overflow-y-auto">
        <span className="font-bold text-amber-700 block mb-2">Campos Modificados:</span>
        {Object.keys(changes).length === 0 ? (
          <span className="italic text-gray-400">Sin diferencias detectadas en campos de primer nivel.</span>
        ) : (
          <table className="w-full text-left font-mono">
            <thead>
              <tr className="border-b border-amber-200/50 text-[10px] text-amber-800">
                <th className="pb-1 font-semibold">Campo</th>
                <th className="pb-1 font-semibold">Valor Anterior</th>
                <th className="pb-1 font-semibold">Valor Nuevo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-200/20">
              {Object.entries(changes).map(([field, vals]) => (
                <tr key={field}>
                  <td className="py-1 font-bold text-gray-700 pr-2">{field}</td>
                  <td className="py-1 text-red-600 line-through pr-2 break-all max-w-[150px]">
                    {vals.old === null ? 'null' : typeof vals.old === 'object' ? JSON.stringify(vals.old) : String(vals.old)}
                  </td>
                  <td className="py-1 text-green-600 font-medium break-all max-w-[150px]">
                    {vals.new === null ? 'null' : typeof vals.new === 'object' ? JSON.stringify(vals.new) : String(vals.new)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    );
  };

  // Generador de explicaciones amigables en lenguaje natural de lo ocurrido
  const getNaturalLanguageExplanation = (log: AuditLog) => {
    const autor = log.performed_by_name || log.performed_by_email || 'El sistema';
    const accion = log.action === 'INSERT' ? 'creó' : log.action === 'UPDATE' ? 'modificó' : 'eliminó';
    const fecha = new Date(log.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

    if (log.table_name === 'bookings') {
      const data = log.action === 'DELETE' ? log.old_data : log.new_data;
      const huesped = data?.guest_name || 'un cliente';
      const cabinId = data?.cabin_id;
      const cabana = (cabinId && cabinsMap[cabinId]) ? cabinsMap[cabinId] : 'una cabaña';
      
      if (log.action === 'INSERT') {
        return `✨ ${autor} ingresó una nueva reserva para el huésped "${huesped}" en la cabaña "${cabana}" (${fecha}).`;
      }
      if (log.action === 'UPDATE') {
        // Buscar qué campo principal cambió
        const oldStatus = log.old_data?.status;
        const newStatus = log.new_data?.status;
        if (oldStatus !== newStatus && newStatus) {
          return `🔄 ${autor} cambió el estado de la reserva de "${huesped}" en "${cabana}" a "${newStatus}" (${fecha}).`;
        }
        return `📝 ${autor} actualizó los datos de la reserva del huésped "${huesped}" en la cabaña "${cabana}" (${fecha}).`;
      }
      return `❌ ${autor} eliminó por completo la reserva del huésped "${huesped}" que estaba programada en la cabaña "${cabana}" (${fecha}).`;
    }

    if (log.table_name === 'cabin_closures') {
      const data = log.action === 'DELETE' ? log.old_data : log.new_data;
      const motivo = data?.reason || 'un motivo';
      const inicio = data?.start_date || 'N/A';
      const fin = data?.end_date || 'N/A';
      const cabinId = data?.cabin_id;
      
      let cabanaInfo = 'todas las cabañas (Cierre Total)';
      if (cabinId) {
        cabanaInfo = cabinsMap[cabinId] ? `la cabaña "${cabinsMap[cabinId]}"` : 'una cabaña';
      }
      
      if (log.action === 'INSERT') {
        return `⚙️ ${autor} aplicó un nuevo bloqueo por "${motivo}" restringiendo ${cabanaInfo} desde el ${inicio} al ${fin} (${fecha}).`;
      }
      if (log.action === 'UPDATE') {
        return `⚙️ ${autor} modificó las condiciones o fechas del bloqueo por "${motivo}" de ${cabanaInfo} (${fecha}).`;
      }
      return `🔓 ${autor} levantó y eliminó el bloqueo por "${motivo}" de ${cabanaInfo}, restableciendo su disponibilidad normal (${fecha}).`;
    }

    if (log.table_name === 'cabins') {
      const data = log.action === 'DELETE' ? log.old_data : log.new_data;
      const cabanaName = data?.name || 'una cabaña';
      
      if (log.action === 'INSERT') {
        return `🏡 ${autor} registró una nueva cabaña en el sistema llamada "${cabanaName}" (${fecha}).`;
      }
      if (log.action === 'UPDATE') {
        const oldActive = log.old_data?.is_active;
        const newActive = log.new_data?.is_active;
        if (oldActive !== newActive && newActive !== undefined) {
          const estado = newActive ? 'disponible' : 'fuera de servicio';
          return `🏡 ${autor} cambió el estado de la cabaña "${cabanaName}" a "${estado}" (${fecha}).`;
        }
        return `🏡 ${autor} actualizó los datos informativos de la cabaña "${cabanaName}" (${fecha}).`;
      }
      return `🗑️ ${autor} eliminó del sistema la cabaña "${cabanaName}" (${fecha}).`;
    }

    if (log.table_name === 'profiles') {
      const data = log.action === 'DELETE' ? log.old_data : log.new_data;
      const usuario = data?.full_name || data?.email || 'un colaborador';
      const rol = data?.role || 'staff';
      
      if (log.action === 'INSERT') {
        return `👤 ${autor} creó el perfil de usuario para "${usuario}" asignándole el rol de "${rol}" (${fecha}).`;
      }
      if (log.action === 'UPDATE') {
        const oldRole = log.old_data?.role;
        const newRole = log.new_data?.role;
        const oldBanned = log.old_data?.banned_until || null;
        const newBanned = log.new_data?.banned_until || null;
        const oldUpdated = log.old_data?.updated_at || null;
        const newUpdated = log.new_data?.updated_at || null;
        const motivo = log.new_data?.block_reason || 'Sin motivo especificado';

        if (oldBanned !== newBanned) {
          if (newBanned) {
            return `🔒 ${autor} suspendió y bloqueó al usuario "${usuario}" de forma permanente debido a: "${motivo}" (${fecha}).`;
          } else {
            return `🔓 ${autor} reactivó y desbloqueó al usuario "${usuario}" en el sistema (${fecha}).`;
          }
        }

        if (oldRole !== newRole && newRole) {
          return `🛡️ ${autor} actualizó el rol de seguridad de "${usuario}" de "${oldRole}" a "${newRole}" (${fecha}).`;
        }

        // Detectar si fue un reenvío de invitación de correo o restablecimiento de contraseña vía action_type
        if (log.new_data?.action_type === 'invite_resent') {
          return `📩 ${autor} reenvió el correo de invitación al colaborador "${usuario}" con el rol de "${rol}" (${fecha}).`;
        }
        if (log.new_data?.action_type === 'password_reset_sent') {
          return `🔑 ${autor} solicitó y envió un correo de restablecimiento de contraseña para el colaborador "${usuario}" con el rol de "${rol}" (${fecha}).`;
        }

        // Detectar si fue un reenvío de invitación de correo (retrocompatibilidad)
        if (oldUpdated !== newUpdated && 
            oldRole === newRole && 
            log.old_data?.full_name === log.new_data?.full_name && 
            log.old_data?.phone === log.new_data?.phone && 
            log.old_data?.email === log.new_data?.email) {
          return `📩 ${autor} reenvió el correo de invitación al colaborador "${usuario}" con el rol de "${rol}" (${fecha}).`;
        }

        return `👤 ${autor} actualizó la información de perfil del usuario "${usuario}" (${fecha}).`;
      }
      return `👤 ${autor} revocó el acceso y eliminó el perfil del usuario "${usuario}" con rol de "${rol}" (${fecha}).`;
    }

    if (log.table_name === 'landing_settings') {
      const data = log.action === 'DELETE' ? log.old_data : log.new_data;
      if (log.action === 'INSERT') {
        return `✨ ${autor} inicializó la configuración de diseño visual de la Landing Page (${fecha}).`;
      }
      if (log.action === 'UPDATE') {
        const oldLogo = log.old_data?.logo_url;
        const newLogo = log.new_data?.logo_url;
        const oldHero = log.old_data?.hero_title;
        const newHero = log.new_data?.hero_title;
        const oldBg = log.old_data?.hero_bg_url;
        const newBg = log.new_data?.hero_bg_url;

        if (oldLogo !== newLogo) {
          return `🎨 ${autor} actualizó el logotipo oficial de Rancho Carmelitas a: "${newLogo || 'sin logo'}" (${fecha}).`;
        }
        if (oldHero !== newHero || log.old_data?.hero_subtitle !== log.new_data?.hero_subtitle) {
          return `🎨 ${autor} modificó los textos del banner principal (Hero) a: "${newHero}" (${fecha}).`;
        }
        if (oldBg !== newBg) {
          return `🎨 ${autor} actualizó la imagen de fondo del banner principal (Hero) (${fecha}).`;
        }
        return `🎨 ${autor} actualizó la configuración de diseño visual y de la Landing Page (${fecha}).`;
      }
      return `🗑️ ${autor} eliminó la configuración de diseño visual de la Landing Page (${fecha}).`;
    }

    if (log.table_name === 'landing_gallery') {
      const data = log.action === 'DELETE' ? log.old_data : log.new_data;
      const altText = data?.alt_text || 'Foto sin título descriptivo';
      if (log.action === 'INSERT') {
        return `📸 ${autor} subió y agregó una nueva foto a la galería de momentos ("${altText}") (${fecha}).`;
      }
      if (log.action === 'UPDATE') {
        const oldOrder = log.old_data?.order_index;
        const newOrder = log.new_data?.order_index;
        if (oldOrder !== newOrder) {
          return `📸 ${autor} reordenó una foto de la galería del orden ${oldOrder} al ${newOrder} (${fecha}).`;
        }
        return `📸 ${autor} actualizó el texto descriptivo o datos de una foto en la galería a: "${altText}" (${fecha}).`;
      }
      return `🗑️ ${autor} eliminó una foto de la galería de momentos ("${altText}") (${fecha}).`;
    }

    if (log.table_name === 'settings') {
      const data = log.action === 'DELETE' ? log.old_data : log.new_data;
      const key = data?.key || '';
      const val = data?.value || '';

      const labels: Record<string, string> = {
        whatsapp_number: 'el número de WhatsApp',
        company_name: 'el nombre de la empresa',
        company_rut: 'el RUT de la empresa',
        company_address: 'la dirección de la empresa',
        company_phone: 'el teléfono de contacto',
        company_email: 'el email de contacto',
        default_admin_commission: 'la comisión de administración por defecto'
      };

      const label = labels[key] || `la variable "${key}"`;

      if (log.action === 'INSERT') {
        return `⚙️ ${autor} agregó la variable de configuración "${key}" con el valor "${val}" (${fecha}).`;
      }
      if (log.action === 'UPDATE') {
        const displayVal = key === 'default_admin_commission' ? `${val}%` : `"${val}"`;
        return `⚙️ ${autor} actualizó ${label} del sistema a: ${displayVal} (${fecha}).`;
      }
      return `🗑️ ${autor} eliminó la variable de configuración "${key}" (${fecha}).`;
    }

    if (log.table_name === 'plataformas') {
      const data = log.action === 'DELETE' ? log.old_data : log.new_data;
      const nombre = data?.nombre || 'canal desconocido';
      const comision = data?.comision_porcentaje !== undefined ? `${data.comision_porcentaje}%` : 'N/A';

      if (log.action === 'INSERT') {
        return `🔌 ${autor} integró y habilitó el canal de venta "${nombre}" con una comisión de ${comision} (${fecha}).`;
      }
      if (log.action === 'UPDATE') {
        const oldCom = log.old_data?.comision_porcentaje;
        const newCom = log.new_data?.comision_porcentaje;
        const oldNom = log.old_data?.nombre;
        const newNom = log.new_data?.nombre;

        if (oldCom !== newCom && oldNom !== newNom) {
          return `🔌 ${autor} renombró el canal a "${newNom}" y cambió su comisión a ${newCom}% (${fecha}).`;
        }
        if (oldCom !== newCom) {
          return `🔌 ${autor} actualizó la comisión del canal "${nombre}" del ${oldCom}% al ${newCom}% (${fecha}).`;
        }
        if (oldNom !== newNom) {
          return `🔌 ${autor} cambió el nombre comercial del canal "${oldNom}" a "${newNom}" (${fecha}).`;
        }
        return `🔌 ${autor} actualizó los datos del canal de venta "${nombre}" (${fecha}).`;
      }
      return `🔌 ${autor} removió y deshabilitó el canal de venta "${nombre}" del sistema (${fecha}).`;
    }

    if (log.table_name === 'desarrollo_ideas') {
      const data = log.action === 'DELETE' ? log.old_data : log.new_data;
      const titulo = data?.idea || 'sugerencia sin título';
      const tipo = data?.type === 'bug' ? 'el reporte de bug' : 'la propuesta';
      const prefijo = data?.type === 'bug' ? '🐛' : '💡';

      if (log.action === 'INSERT') {
        return `${prefijo} ${autor} creó ${tipo} "${titulo}" (${fecha}).`;
      }
      if (log.action === 'UPDATE') {
        const oldCompleted = log.old_data?.completed;
        const newCompleted = log.new_data?.completed;
        const oldPriority = log.old_data?.priority;
        const newPriority = log.new_data?.priority;
        const oldIdea = log.old_data?.idea;
        const newIdea = log.new_data?.idea;

        if (oldCompleted !== newCompleted && newCompleted !== undefined) {
          if (newCompleted) {
            return `✅ ${autor} marcó como completado ${tipo} "${titulo}" (${fecha}).`;
          } else {
            return `🔄 ${autor} reabrió y marcó como pendiente ${tipo} "${titulo}" (${fecha}).`;
          }
        }
        if (oldPriority !== newPriority && newPriority !== undefined) {
          return `📌 ${autor} reordenó la prioridad de ${tipo} "${titulo}" al puesto #${newPriority} (${fecha}).`;
        }
        if (oldIdea !== newIdea) {
          return `📝 ${autor} editó el título de ${tipo} a: "${newIdea}" (${fecha}).`;
        }
        return `📝 ${autor} actualizó los detalles de ${tipo} "${titulo}" (${fecha}).`;
      }
      return `🗑️ ${autor} eliminó del roadmap ${tipo} "${titulo}" (${fecha}).`;
    }

    return `🔗 ${autor} realizó una acción de tipo ${log.action} en el módulo ${log.table_name} (${fecha}).`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Bitácora de Auditoría (Trace Trail)</h2>
        <p className="text-gray-500">Historial completo y seguro de cambios del PMS.</p>
      </div>

      {/* Contenedor de filtros Premium Stitch UI (#11d442, rounded-xl/24px) */}
      <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[150px]">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Acción</label>
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#11d442] outline-none transition-all appearance-none bg-no-repeat bg-[right_1rem_center]"
            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'currentColor\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\' /%3E%3C/svg%3E")' }}
          >
            <option value="ALL">Todas las acciones</option>
            <option value="INSERT">INSERT (Creaciones)</option>
            <option value="UPDATE">UPDATE (Ediciones)</option>
            <option value="DELETE">DELETE (Eliminaciones)</option>
          </select>
        </div>

        <div className="flex-1 min-w-[150px]">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Tabla / Módulo</label>
          <select
            value={filterTable}
            onChange={(e) => setFilterTable(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#11d442] outline-none transition-all appearance-none bg-no-repeat bg-[right_1rem_center]"
            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'currentColor\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\' /%3E%3C/svg%3E")' }}
          >
            <option value="ALL">Todas las tablas</option>
            <option value="bookings">bookings (Reservas)</option>
            <option value="cabins">cabins (Cabañas)</option>
            <option value="cabin_closures">cabin_closures (Bloqueos)</option>
            <option value="profiles">profiles (Usuarios/Perfiles)</option>
            <option value="landing_settings">landing_settings (Hero y Logo)</option>
            <option value="landing_gallery">landing_gallery (Galería)</option>
            <option value="settings">settings (Configuraciones)</option>
            <option value="plataformas">plataformas (Canales y Comisiones)</option>
          </select>
        </div>

        <div className="flex-[1.5] min-w-[200px]">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Usuario (Nombre / Correo)</label>
          <input
            type="text"
            value={filterUser}
            onChange={(e) => setFilterUser(e.target.value)}
            placeholder="Ej. Juan Pérez..."
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#11d442] outline-none transition-all"
          />
        </div>

        <div className="flex-1 min-w-[150px]">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Fecha del Evento</label>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#11d442] outline-none transition-all"
          />
        </div>

        <button
          onClick={() => {
            setFilterAction('ALL');
            setFilterTable('ALL');
            setFilterUser('');
            setFilterDate('');
          }}
          className="px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition-all text-sm"
        >
          Limpiar
        </button>
      </div>

      {/* Grid del Timeline e Inspección de Cambios */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline */}
        <div className="lg:col-span-2 bg-white rounded-[24px] border border-gray-100 shadow-sm p-6 overflow-hidden">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Línea de Tiempo</h3>
          
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#11d442] mx-auto"></div>
              <p className="text-gray-500 mt-3 text-sm">Consultando bitácora...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center border-2 border-dashed border-gray-100 rounded-2xl">
              <p className="text-gray-400 text-sm">No se encontraron registros de auditoría que coincidan con los filtros.</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
              {logs.map((log) => {
                const isSelected = selectedLog?.id === log.id;
                let actionColor = 'bg-blue-100 text-blue-600';
                if (log.action === 'INSERT') actionColor = 'bg-green-100 text-green-700';
                if (log.action === 'DELETE') actionColor = 'bg-red-100 text-red-600';

                return (
                  <div
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer text-left ${
                      isSelected 
                        ? 'border-[#11d442] bg-[#f0fdf4]/30 shadow-sm ring-1 ring-[#11d442]' 
                        : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50/50'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase ${actionColor}`}>
                          {log.action}
                        </span>
                        <span className="text-xs font-semibold text-gray-500 font-mono">
                          {log.table_name}
                        </span>
                      </div>
                      <span className="text-[11px] text-gray-400">
                        {new Date(log.created_at).toLocaleString('es-ES', {
                          dateStyle: 'short',
                          timeStyle: 'medium'
                        })}
                      </span>
                    </div>

                    <div className="my-2.5 p-3 rounded-lg bg-gray-50/80 border border-gray-100 text-xs font-bold text-gray-800 leading-relaxed">
                      {getNaturalLanguageExplanation(log)}
                    </div>

                    <p className="text-xs font-medium text-gray-700">
                      Operador: <span className="font-bold text-gray-900">{log.performed_by_name || log.performed_by_email || 'Sistema / Anon'}</span>
                    </p>
                    <p className="text-[10px] text-gray-400 flex items-center gap-1.5 mt-0.5">
                      <span className="capitalize px-1.5 py-0.2 bg-gray-100 rounded text-[9px] text-gray-600 font-semibold">
                        {log.user_role || 'staff'}
                      </span>
                      {log.performed_by_email && <span>• {log.performed_by_email}</span>}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Panel de Detalle / Inspector de Datos */}
        <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-6 flex flex-col h-full min-h-[400px]">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Detalle de la Operación</h3>
          
          {selectedLog ? (
            <div className="space-y-5 flex-1 flex flex-col text-left">
              <div>
                <span className="text-[10px] font-semibold text-gray-400 uppercase block">ID de Registro Afectado</span>
                <span className="text-xs font-mono font-bold text-gray-700 bg-gray-50 px-2 py-1 rounded border border-gray-100 block truncate mt-1">
                  {selectedLog.record_id || 'N/A'}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-semibold text-gray-400 uppercase block mb-1">Explicación de la Operación</span>
                <div className="p-4 bg-emerald-50 text-emerald-950 font-bold border border-emerald-100 rounded-xl text-xs leading-relaxed shadow-sm">
                  {getNaturalLanguageExplanation(selectedLog)}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-semibold text-gray-400 uppercase block mb-1">Autor de la Acción</span>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs">
                  <p className="font-bold text-gray-800">{selectedLog.performed_by_name || 'Desconocido'}</p>
                  <p className="text-gray-500 mt-0.5">{selectedLog.performed_by_email || 'No email'}</p>
                  <div className="flex gap-2 mt-2">
                    <span className="bg-[#11d442]/10 text-[#11d442] font-semibold px-2 py-0.5 rounded text-[10px] uppercase">
                      {selectedLog.user_role}
                    </span>
                    <span className="bg-gray-200 text-gray-700 font-mono px-2 py-0.5 rounded text-[10px] uppercase">
                      ID: {selectedLog.performed_by_id?.substring(0, 8) || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex-1 flex flex-col">
                <span className="text-[10px] font-semibold text-gray-400 uppercase block mb-1">Desglose de Datos</span>
                <div className="flex-1">
                  {renderDataDiff(selectedLog)}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex gap-2">
                <button
                  onClick={() => {
                    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(selectedLog, null, 2));
                    const downloadAnchor = document.createElement('a');
                    downloadAnchor.setAttribute("href", dataStr);
                    downloadAnchor.setAttribute("download", `audit_log_${selectedLog.id}.json`);
                    document.body.appendChild(downloadAnchor);
                    downloadAnchor.click();
                    downloadAnchor.remove();
                  }}
                  className="w-full py-2.5 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 text-gray-700 font-bold transition-all text-xs flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Exportar JSON
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-gray-100 rounded-2xl">
              <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              </svg>
              <p className="text-gray-400 text-sm">Selecciona una entrada del timeline para ver los desgloses de cambios detallados.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
