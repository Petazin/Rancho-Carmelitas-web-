'use client';

import React from 'react';
import { Logo } from '@/components/ui/Logo';

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  description: string;
  image_url?: string | null;
  order_index?: number;
}

interface TeamSectionProps {
  title?: string;
  subtitle?: string;
  logoUrl?: string;
  members: TeamMember[];
}

export function TeamSection({
  title = 'Nuestro Equipo',
  subtitle = 'Conoce a las personas dedicadas a cuidar cada detalle de tu descanso y estadía en Rancho Carmelitas.',
  logoUrl,
  members
}: TeamSectionProps) {
  // Si no hay integrantes configurados, no renderizar la sección para evitar mostrar un bloque vacío o en blanco
  if (!members || members.length === 0) {
    return null;
  }

  return (
    <section id="team" className="py-24 bg-surface border-t border-gray-100 relative overflow-hidden">
      {/* Fondo decorativo sutil con luz suave */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-green-50/40 via-transparent to-transparent pointer-events-none -z-0" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Cabecera de la Sección con Jerarquía de Marca */}
        <div className="text-center mb-16 flex flex-col items-center justify-center">
          <Logo 
            className="w-24 h-24 md:w-28 md:h-28 rounded-full object-cover border border-gray-200/50 shadow-md mb-4 hover:scale-105 transition-transform duration-300" 
            logoUrl={logoUrl} 
          />
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 tracking-tight">
            {title}
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto text-base md:text-lg font-light leading-relaxed">
            {subtitle}
          </p>
        </div>

        {/* Cuadrícula de Tarjetas Campestres Modernas (Propuesta 1) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {members && members.length > 0 ? (
            members.map((member) => (
              <div
                key={member.id}
                className="group bg-white rounded-3xl p-5 border border-gray-100 shadow-sm hover:shadow-xl hover:border-[#11d442]/30 transition-all duration-300 flex flex-col justify-between hover:-translate-y-1.5 will-change-transform transform-gpu"
              >
                <div>
                  {/* Fotografía del Integrante con Aspect Ratio Vertical */}
                  <div className="relative aspect-[4/5] w-full rounded-2xl overflow-hidden bg-gray-100 mb-5 shadow-inner">
                    {member.image_url ? (
                      <img
                        src={member.image_url}
                        alt={`Fotografía de ${member.name}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                          // Si la imagen falla al cargar, mostrar fallback elegante
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.classList.add('flex', 'items-center', 'justify-center', 'bg-green-50');
                            const fallback = document.createElement('div');
                            fallback.className = 'text-center p-4';
                            fallback.innerHTML = `<span class="text-4xl mb-1 block">🌿</span><span class="text-xs font-bold text-gray-600">${member.name}</span>`;
                            parent.appendChild(fallback);
                          }
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-green-50/70 text-gray-400 p-4">
                        <span className="text-4xl mb-2">🌿</span>
                        <span className="text-xs font-bold text-gray-600 text-center">{member.name}</span>
                      </div>
                    )}

                    {/* Sombra degradada sutil al pie de la foto */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>

                  {/* Badge de Rol con verde institucional Rancho */}
                  <div className="mb-2.5">
                    <span className="inline-block bg-[#11d442]/10 text-[#0fa836] border border-[#11d442]/30 text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                      {member.role}
                    </span>
                  </div>

                  {/* Nombre del Integrante */}
                  <h3 className="text-lg md:text-xl font-bold text-gray-900 group-hover:text-[#0fa836] transition-colors mb-2.5">
                    {member.name}
                  </h3>

                  {/* Descripción cálida */}
                  <p className="text-sm text-gray-600 font-normal leading-relaxed line-clamp-4">
                    {member.description}
                  </p>
                </div>

                {/* Sello inferior sutil */}
                <div className="mt-5 pt-3 border-t border-gray-100/70 flex items-center justify-between text-[11px] text-gray-400 font-medium">
                  <span className="flex items-center gap-1 text-[#11d442]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#11d442]"></span>
                    Rancho Carmelitas
                  </span>
                  <span>Pullally</span>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12 text-gray-400 italic">
              Pronto conocerás a nuestro equipo de trabajo.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
