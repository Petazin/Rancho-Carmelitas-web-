'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface UserProfile {
  id: string;
  full_name: string;
  role: string;
  created_at: string;
  email?: string;
  phone?: string;
  is_blocked?: boolean;
  banned_until?: string;
  block_reason?: string;
}

// Definición estática de Roles y Permisos para soporte visual Premium Stitch UI
interface RolePermission {
  role: string;
  displayName: string;
  color: string;
  badgeStyle: string;
  description: string;
  permissions: {
    key: string;
    label: string;
    allowed: boolean;
  }[];
}

const ROLES_PRESETS: RolePermission[] = [
  {
    role: 'admin',
    displayName: 'Administrador (Control Total)',
    color: 'purple',
    badgeStyle: 'bg-purple-100 text-purple-700 border border-purple-200',
    description: 'Control total de la plataforma PMS, visualización de bitácoras, edición de usuarios, cierres totales y finanzas.',
    permissions: [
      { key: 'view_dashboard', label: 'Ver Dashboard y Métricas', allowed: true },
      { key: 'manage_bookings', label: 'Crear/Editar Reservas', allowed: true },
      { key: 'manage_cabins', label: 'Administrar Cabañas', allowed: true },
      { key: 'manage_closures', label: 'Crear Bloqueos Totales/Parciales', allowed: true },
      { key: 'view_audit_log', label: 'Inspeccionar Bitácora de Auditoría', allowed: true },
      { key: 'manage_users', label: 'Gestión de Equipo y Roles', allowed: true },
    ]
  },
  {
    role: 'staff',
    displayName: 'Personal (Staff)',
    color: 'blue',
    badgeStyle: 'bg-blue-100 text-blue-700 border border-blue-200',
    description: 'Acceso diario para la gestión operativa y recepción. Permite interactuar con reservas y estado de cabañas.',
    permissions: [
      { key: 'view_dashboard', label: 'Ver Dashboard y Métricas', allowed: true },
      { key: 'manage_bookings', label: 'Crear/Editar Reservas', allowed: true },
      { key: 'manage_cabins', label: 'Administrar Cabañas', allowed: false },
      { key: 'manage_closures', label: 'Crear Bloqueos Totales/Parciales', allowed: false },
      { key: 'view_audit_log', label: 'Inspeccionar Bitácora de Auditoría', allowed: false },
      { key: 'manage_users', label: 'Gestión de Equipo y Roles', allowed: false },
    ]
  },
  {
    role: 'recepcion',
    displayName: 'Recepcionista (Solo Reservas)',
    color: 'emerald',
    badgeStyle: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
    description: 'Limitado exclusivamente a registrar entradas, salidas y visualizar la disponibilidad del calendario.',
    permissions: [
      { key: 'view_dashboard', label: 'Ver Dashboard y Métricas', allowed: false },
      { key: 'manage_bookings', label: 'Crear/Editar Reservas', allowed: true },
      { key: 'manage_cabins', label: 'Administrar Cabañas', allowed: false },
      { key: 'manage_closures', label: 'Crear Bloqueos Totales/Parciales', allowed: false },
      { key: 'view_audit_log', label: 'Inspeccionar Bitácora de Auditoría', allowed: false },
      { key: 'manage_users', label: 'Gestión de Equipo y Roles', allowed: false },
    ]
  },
  {
    role: 'mantenimiento',
    displayName: 'Mantenimiento / Limpieza',
    color: 'amber',
    badgeStyle: 'bg-amber-100 text-amber-700 border border-amber-200',
    description: 'Acceso focalizado en el estado de limpieza y mantención de las cabañas. Sin acceso a datos de huéspedes o tarifas.',
    permissions: [
      { key: 'view_dashboard', label: 'Ver Dashboard y Métricas', allowed: false },
      { key: 'manage_bookings', label: 'Crear/Editar Reservas', allowed: false },
      { key: 'manage_cabins', label: 'Administrar Cabañas', allowed: true },
      { key: 'manage_closures', label: 'Crear Bloqueos Totales/Parciales', allowed: false },
      { key: 'view_audit_log', label: 'Inspeccionar Bitácora de Auditoría', allowed: false },
      { key: 'manage_users', label: 'Gestión de Equipo y Roles', allowed: false },
    ]
  }
];

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'usuarios' | 'roles'>('usuarios');
  const [selectedRolePreset, setSelectedRolePreset] = useState<RolePermission>(ROLES_PRESETS[0]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  // Form state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [invitePhone, setInvitePhone] = useState('');
  const [inviteRole, setInviteRole] = useState('staff');
  const [inviting, setInviting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setCurrentUserId(data.user.id);
      }
    });
    fetchUsuarios();
  }, []);

  async function fetchUsuarios() {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/users');
      const result = await response.json();
      if (result.error) throw new Error(result.error);
      setUsuarios(result.data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail,
          full_name: inviteName,
          role: inviteRole,
          phone: invitePhone
        }),
      });

      const result = await response.json();

      if (result.error) throw new Error(result.error);

      setMessage({ type: 'success', text: 'Invitación enviada correctamente al correo.' });
      setInviteEmail('');
      setInviteName('');
      setInvitePhone('');
      setTimeout(() => {
        setShowInviteModal(false);
        setMessage(null);
        fetchUsuarios();
      }, 2000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setInviting(false);
    }
  };

  const handleResendInvite = async (email: string, full_name: string, role: string, phone?: string) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, full_name, role, phone }),
      });
      const result = await response.json();
      if (result.error) throw new Error(result.error);
      alert(result.message || '📩 Invitación de registro reenviada correctamente.');
    } catch (err: any) {
      alert('Error al reenviar invitación: ' + err.message);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este usuario? Perderá el acceso de inmediato.')) return;

    try {
      const response = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      const result = await response.json();
      if (result.error) throw new Error(result.error);

      setUsuarios(usuarios.filter(u => u.id !== userId));
      alert('🗑️ Usuario eliminado correctamente.');
    } catch (error: any) {
      alert('Error: ' + error.message);
    }
  };

  // Edición y Bloqueo de Usuarios
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRole, setEditRole] = useState('staff');
  const [savingEdit, setSavingEdit] = useState(false);

  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockingUser, setBlockingUser] = useState<UserProfile | null>(null);
  const [blockReason, setBlockReason] = useState('');
  const [blocking, setBlocking] = useState(false);

  const handleOpenEdit = (user: UserProfile) => {
    setEditingUser(user);
    setEditName(user.full_name || '');
    setEditEmail(user.email || '');
    setEditPhone(user.phone || '');
    setEditRole(user.role || 'staff');
    setShowEditModal(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setSavingEdit(true);

    try {
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: editingUser.id,
          full_name: editName,
          email: editEmail,
          phone: editPhone,
          role: editRole,
          is_blocked: editingUser.is_blocked,
          block_reason: editingUser.block_reason
        }),
      });

      const result = await response.json();
      if (result.error) throw new Error(result.error);

      alert('👤 Datos de usuario actualizados correctamente.');
      setShowEditModal(false);
      fetchUsuarios();
    } catch (err: any) {
      alert('Error al actualizar usuario: ' + err.message);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleOpenBlock = (user: UserProfile) => {
    setBlockingUser(user);
    setBlockReason(user.block_reason || '');
    setShowBlockModal(true);
  };

  const handleToggleBlockUser = async (user: UserProfile, blockStatus: boolean, reasonText: string = '') => {
    setBlocking(true);
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          full_name: user.full_name,
          phone: user.phone,
          role: user.role,
          is_blocked: blockStatus,
          block_reason: reasonText
        }),
      });

      const result = await response.json();
      if (result.error) throw new Error(result.error);

      alert(blockStatus ? '🔒 Usuario bloqueado permanentemente.' : '🔓 Usuario desbloqueado y reactivado.');
      setShowBlockModal(false);
      fetchUsuarios();
    } catch (err: any) {
      alert('Error al modificar estado de bloqueo: ' + err.message);
    } finally {
      setBlocking(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Equipo y Control de Accesos</h2>
          <p className="text-gray-500">Administra los roles, permisos modulares y miembros de tu equipo.</p>
        </div>
        <button 
          onClick={() => setShowInviteModal(true)}
          className="bg-[#11d442] text-white px-6 py-2.5 rounded-xl font-bold hover:bg-[#0fb337] transition-all flex items-center gap-2 shadow-lg shadow-[#11d44222]"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          Invitar Usuario
        </button>
      </div>

      {/* Tabs de Selección */}
      <div className="flex border-b border-gray-200 gap-6">
        <button
          onClick={() => setActiveTab('usuarios')}
          className={`pb-4 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'usuarios'
              ? 'border-[#11d442] text-[#11d442]'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          Miembros del Equipo ({usuarios.length})
        </button>
        <button
          onClick={() => setActiveTab('roles')}
          className={`pb-4 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'roles'
              ? 'border-[#11d442] text-[#11d442]'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          Roles y Permisos Dinámicos
        </button>
      </div>

      {activeTab === 'usuarios' ? (
        loading ? (
          <div className="bg-white rounded-[24px] p-12 text-center border border-gray-100">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#11d442] mx-auto"></div>
            <p className="text-gray-500 mt-4">Cargando equipo...</p>
          </div>
        ) : (
          <div className="bg-white rounded-[24px] border border-gray-100 overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Usuario</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Contacto</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rol Asignado</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha Alta</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {usuarios.map((user) => {
                  const rolePreset = ROLES_PRESETS.find(p => p.role === user.role) || {
                    displayName: user.role,
                    badgeStyle: 'bg-gray-100 text-gray-600 border border-gray-200'
                  };
                  return (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-[#11d442] font-bold">
                            {user.full_name?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-900">{user.full_name || 'Sin Nombre'}</span>
                              {user.is_blocked && (
                                <span 
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 border border-red-200 cursor-help"
                                  title={`Baneado. Motivo: ${user.block_reason || 'No especificado'}`}
                                >
                                  🔒 BANEADO
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-400 font-mono">{user.id.substring(0, 8)}...</div>
                            {user.is_blocked && user.block_reason && (
                              <div className="text-[11px] text-red-500 italic mt-0.5">
                                Motivo: "{user.block_reason}"
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-gray-600 font-mono space-y-1">
                        <div className="flex items-center gap-1 text-gray-700">
                          <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <span>{user.email || 'No email'}</span>
                        </div>
                        {user.phone ? (
                          <div className="flex items-center gap-1 text-[#11d442]">
                            <svg className="w-3.5 h-3.5 text-[#11d442]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            <span>{user.phone}</span>
                          </div>
                        ) : (
                          <div className="text-[10px] text-gray-400 italic">
                            Sin teléfono (Editar para agregar)
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${rolePreset.badgeStyle}`}>
                          {rolePreset.displayName}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end items-center gap-2">
                          <button
                            onClick={() => handleResendInvite(user.email || '', user.full_name, user.role, user.phone)}
                            disabled={!user.email}
                            className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg text-xs font-bold transition-all border border-gray-200 flex items-center gap-1 hover:text-[#11d442]"
                            title="Reenviar correo de invitación"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            Reenviar
                          </button>

                          <button
                            onClick={() => handleOpenEdit(user)}
                            className="px-3 py-1.5 bg-gray-50 hover:bg-blue-50 text-gray-600 hover:text-blue-600 rounded-lg text-xs font-bold transition-all border border-gray-200 flex items-center gap-1"
                            title="Editar datos de usuario"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                            Editar
                          </button>

                          {user.id !== currentUserId && (
                            <>
                              {user.is_blocked ? (
                                <button
                                  onClick={() => handleToggleBlockUser(user, false)}
                                  className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-bold transition-all border border-red-200 flex items-center gap-1"
                                  title="Desbloquear usuario"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                                  </svg>
                                  Desbloquear
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleOpenBlock(user)}
                                  className="px-3 py-1.5 bg-gray-50 hover:bg-red-50 text-gray-600 hover:text-red-600 rounded-lg text-xs font-bold transition-all border border-gray-200 flex items-center gap-1"
                                  title="Bloquear usuario"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                                  </svg>
                                  Bloquear
                                </button>
                              )}

                              <button 
                                onClick={() => handleDelete(user.id)}
                                className="text-red-400 hover:text-red-600 p-2 transition-colors"
                                title="Eliminar usuario"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      ) : (
        /* UI Dinámica Premium de Roles y Permisos */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
          {/* Listado de Roles */}
          <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-6 space-y-3">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-900">Roles del Sistema</h3>
              <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold uppercase">Activos</span>
            </div>
            
            {ROLES_PRESETS.map((preset) => {
              const isSelected = selectedRolePreset.role === preset.role;
              return (
                <div
                  key={preset.role}
                  onClick={() => setSelectedRolePreset(preset)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-[#11d442] bg-[#f0fdf4]/20 ring-1 ring-[#11d442]'
                      : 'border-gray-100 hover:bg-gray-50'
                  }`}
                >
                  <p className="font-bold text-sm text-gray-900">{preset.displayName}</p>
                  <p className="text-xs text-gray-400 mt-1 line-clamp-1">{preset.description}</p>
                </div>
              );
            })}

            <button
              onClick={() => alert('¡Próximamente! En la Fase 2 podrás crear nuevos roles personalizados en caliente.')}
              className="w-full mt-4 py-3 bg-gray-50 border border-dashed border-gray-200 rounded-xl hover:bg-gray-100 transition-all font-bold text-xs text-gray-500 flex items-center justify-center gap-2"
            >
              + Agregar Rol Personalizado
            </button>
          </div>

          {/* Panel de visualización de permisos modulares */}
          <div className="lg:col-span-2 bg-white rounded-[24px] border border-gray-100 shadow-sm p-6 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Matriz de Permisos</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Especifica las pantallas y acciones permitidas.</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${selectedRolePreset.badgeStyle}`}>
                  {selectedRolePreset.role.toUpperCase()}
                </span>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl mb-6 border border-gray-100">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Descripción del Rol</span>
                <p className="text-xs text-gray-600 leading-relaxed">{selectedRolePreset.description}</p>
              </div>

              <div className="space-y-4">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Permisos en Pantalla y Backend</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedRolePreset.permissions.map((perm) => (
                    <div
                      key={perm.key}
                      className="p-4 rounded-xl border border-gray-100 flex items-center justify-between"
                    >
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{perm.label}</p>
                        <p className="text-[10px] text-gray-400 font-mono mt-0.5">{perm.key}</p>
                      </div>
                      <div className="flex items-center">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          perm.allowed ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-400'
                        }`}>
                          {perm.allowed ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          )}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100 flex justify-end gap-3 mt-6">
              <button
                onClick={() => alert('Los roles por defecto del sistema son de solo lectura para preservar la estabilidad operacional.')}
                className="px-6 py-2.5 bg-gray-100 rounded-xl text-gray-500 font-bold hover:bg-gray-200 transition-all text-xs"
              >
                Restaurar Predefinidos
              </button>
              <button
                onClick={() => alert('¡Guardado de matriz de permisos dinámicos se habilitará en base de datos en la Fase 2!')}
                className="px-6 py-2.5 bg-[#11d442] text-white rounded-xl font-bold hover:bg-[#0fb337] transition-all text-xs"
              >
                Guardar Cambios de Matriz
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] max-w-md w-full p-8 shadow-2xl animate-in fade-in zoom-in duration-200 text-left">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Invitar Nuevo Usuario</h3>
              <button 
                onClick={() => setShowInviteModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleInvite} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre Completo</label>
                <input 
                  type="text"
                  required
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#11d442] outline-none transition-all"
                  placeholder="Ej. Juan Pérez"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Correo Electrónico</label>
                <input 
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#11d442] outline-none transition-all"
                  placeholder="ejemplo@correo.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Celular / Teléfono de Contacto</label>
                <input 
                  type="text"
                  value={invitePhone}
                  onChange={(e) => setInvitePhone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#11d442] outline-none transition-all"
                  placeholder="Ej. +56912345678"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Rol asignado</label>
                <select 
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#11d442] outline-none transition-all appearance-none bg-no-repeat bg-[right_1rem_center]"
                  style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'currentColor\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\' /%3E%3C/svg%3E")' }}
                >
                  <option value="staff">Personal (Staff)</option>
                  <option value="admin">Administrador (Control Total)</option>
                  <option value="recepcion">Recepcionista (Solo Reservas)</option>
                  <option value="mantenimiento">Mantenimiento / Limpieza</option>
                </select>
              </div>

              {message && (
                <div className={`p-4 rounded-xl text-sm ${
                  message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}>
                  {message.text}
                </div>
              )}

              <button 
                type="submit"
                disabled={inviting}
                className="w-full bg-[#11d442] text-white font-bold py-3.5 rounded-xl hover:bg-[#0fb337] transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
              >
                {inviting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Enviando...
                  </>
                ) : 'Enviar Invitación'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] max-w-md w-full p-8 shadow-2xl animate-in fade-in zoom-in duration-200 text-left">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Editar Datos de Usuario</h3>
              <button 
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre Completo</label>
                <input 
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#11d442] outline-none transition-all"
                  placeholder="Ej. Juan Pérez"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Correo Electrónico</label>
                <input 
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#11d442] outline-none transition-all"
                  placeholder="ejemplo@correo.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Celular / Teléfono de Contacto</label>
                <input 
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#11d442] outline-none transition-all"
                  placeholder="Ej. +56912345678"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Rol asignado</label>
                <select 
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#11d442] outline-none transition-all appearance-none bg-no-repeat bg-[right_1rem_center]"
                  style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'currentColor\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\' /%3E%3C/svg%3E")' }}
                >
                  <option value="staff">Personal (Staff)</option>
                  <option value="admin">Administrador (Control Total)</option>
                  <option value="recepcion">Recepcionista (Solo Reservas)</option>
                  <option value="mantenimiento">Mantenimiento / Limpieza</option>
                </select>
              </div>

              <div className="flex gap-3 mt-6">
                <button 
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="w-1/2 bg-gray-100 text-gray-600 font-bold py-3 rounded-xl hover:bg-gray-200 transition-all text-sm text-center"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={savingEdit}
                  className="w-1/2 bg-[#11d442] text-white font-bold py-3 rounded-xl hover:bg-[#0fb337] transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                >
                  {savingEdit ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Block Modal */}
      {showBlockModal && blockingUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] max-w-md w-full p-8 shadow-2xl animate-in fade-in zoom-in duration-200 text-left">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Bloquear Usuario</h3>
              <button 
                onClick={() => setShowBlockModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="bg-red-50 border border-red-200 p-4 rounded-xl mb-5">
              <p className="text-xs text-red-800 leading-relaxed">
                <strong>Atención:</strong> Al bloquear a <strong>{blockingUser.full_name}</strong> se le suspenderá el acceso a la plataforma de forma inmediata y permanente hasta que sea desbloqueado manualmente.
              </p>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              handleToggleBlockUser(blockingUser, true, blockReason);
            }} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Motivo del Bloqueo</label>
                <textarea 
                  required
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-red-500 outline-none transition-all resize-none h-24"
                  placeholder="Especifica el motivo de la suspensión (ej. Renuncia del cargo, comportamiento inapropiado, etc.)"
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button 
                  type="button"
                  onClick={() => setShowBlockModal(false)}
                  className="w-1/2 bg-gray-100 text-gray-600 font-bold py-3 rounded-xl hover:bg-gray-200 transition-all text-sm text-center"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={blocking}
                  className="w-1/2 bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                >
                  {blocking ? 'Bloqueando...' : 'Confirmar Bloqueo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
