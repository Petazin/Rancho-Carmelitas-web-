'use client';

import React, { useState } from 'react';
import Image from 'next/image';

interface CabinDetailTabsProps {
  cabin: {
    name: string;
    description: string;
    galleryUrls: string[];
    amenities: string[];
    slogan?: string;
    origin_title?: string;
    origin_description?: string;
    fun_fact?: string;
  };
}

export function CabinDetailTabs({ cabin }: CabinDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<'estadia' | 'alma'>('estadia');

  const hasNarrative = !!(cabin.slogan || cabin.origin_description || cabin.fun_fact);

  return (
    <div className="w-full space-y-8">
      {/* 🎛️ Selector de pestañas dinámicas premium */}
      <div className="flex border-b border-gray-200/80 relative">
        <button
          onClick={() => setActiveTab('estadia')}
          className={`flex-1 py-4 text-center font-bold text-sm md:text-base tracking-wide uppercase transition-all duration-300 relative flex items-center justify-center gap-2 outline-none ${
            activeTab === 'estadia'
              ? 'text-gray-900 font-extrabold'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          🏡 La Estadía
          {activeTab === 'estadia' && (
            <span className="absolute bottom-0 left-0 right-0 h-1 bg-[#11d442] rounded-full animate-in fade-in zoom-in-95 duration-200" />
          )}
        </button>
        
        {hasNarrative && (
          <button
            onClick={() => setActiveTab('alma')}
            className={`flex-1 py-4 text-center font-bold text-sm md:text-base tracking-wide uppercase transition-all duration-300 relative flex items-center justify-center gap-2 outline-none ${
              activeTab === 'alma'
                ? 'text-orange-900 font-extrabold'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            🌌 El Alma de {cabin.name}
            {activeTab === 'alma' && (
              <span className="absolute bottom-0 left-0 right-0 h-1 bg-orange-500 rounded-full animate-in fade-in zoom-in-95 duration-200" />
            )}
          </button>
        )}
      </div>

      {/* 📦 Contenido de las Pestañas con Transición Suave */}
      <div className="min-h-[300px]">
        {activeTab === 'estadia' ? (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Sobre esta cabaña */}
            <div className="space-y-4">
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">
                Sobre esta cabaña
              </h3>
              <p className="text-gray-600 text-base md:text-lg leading-relaxed font-normal">
                {cabin.description || 'Una hermosa cabaña lista para tu descanso.'}
              </p>
            </div>

            {/* Galería Secundaria (Adaptativa y Responsiva) */}
            {cabin.galleryUrls.length > 1 && (
              <div className="space-y-4">
                <h3 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">
                  Galería de Fotos
                </h3>
                
                {/* 📱 Vista Móvil: Scroller horizontal táctil */}
                <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scroll-smooth custom-scrollbar md:hidden">
                  {cabin.galleryUrls.slice(1).map((url: string, index: number) => (
                    <div
                      key={index}
                      className="relative w-64 h-48 flex-shrink-0 snap-center rounded-2xl overflow-hidden border border-gray-100 shadow-sm"
                    >
                      <Image
                        src={url}
                        alt={`Vista ${index + 2} de ${cabin.name}`}
                        fill
                        className="object-cover hover:scale-105 transition-transform duration-500"
                        sizes="256px"
                      />
                    </div>
                  ))}
                </div>

                {/* 💻 Vista Tablet y PC: Grid responsivo simétrico */}
                <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {cabin.galleryUrls.slice(1).map((url: string, index: number) => (
                    <div
                      key={index}
                      className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-gray-100 shadow-sm group"
                    >
                      <Image
                        src={url}
                        alt={`Vista ${index + 2} de ${cabin.name}`}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 1024px) 50vw, 33vw"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Lo que ofrece este lugar (Amenities) */}
            <div className="space-y-6 pt-4 border-t border-gray-100">
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">
                Lo que ofrece este lugar
              </h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {cabin.amenities.map((item: string, index: number) => (
                  <li key={index} className="flex items-center gap-3 text-gray-700 font-medium">
                    <span className="w-5 h-5 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3.5 h-3.5 text-[#11d442]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          /* Pestaña: El Alma de {Nombre} - Conexión Pullally */
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Lema o Slogan Poético */}
            {cabin.slogan && (
              <div className="text-center py-6 px-4 bg-orange-50/40 rounded-2xl border border-orange-100/50">
                <span className="text-xs font-bold text-orange-600 uppercase tracking-widest block mb-2">Lema de la Cabaña</span>
                <p className="text-2xl md:text-3xl font-bold text-orange-950 italic font-serif">
                  “ {cabin.slogan} ”
                </p>
              </div>
            )}

            {/* Reseña de origen del nombre y relación con Pullally */}
            {cabin.origin_description && (
              <div className="space-y-4">
                <h3 className="text-xl md:text-2xl font-bold text-orange-950 tracking-tight flex items-center gap-2">
                  <span>🌊</span> {cabin.origin_title || '¿Por qué este nombre?'}
                </h3>
                <div className="text-gray-700 text-base md:text-lg leading-relaxed space-y-4 font-normal">
                  {cabin.origin_description.split('\n\n').map((paragraph, idx) => (
                    <p key={idx}>{paragraph}</p>
                  ))}
                </div>
              </div>
            )}

            {/* Tarjeta del Dato Curioso - Diseño Premium Tostado/Crema */}
            {cabin.fun_fact && (
              <div className="p-6 md:p-8 rounded-3xl bg-[#fef9f3] border-2 border-orange-100/70 shadow-md relative overflow-hidden group">
                {/* Patrón de fondo decorativo abstracto */}
                <div className="absolute right-0 bottom-0 opacity-5 pointer-events-none transform translate-y-1/4 translate-x-1/4 scale-150">
                  <span className="text-9xl">💡</span>
                </div>
                
                <div className="flex items-start gap-4 md:gap-5 relative z-10">
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-orange-100 flex items-center justify-center text-2xl animate-pulse shadow-sm flex-shrink-0">
                    💡
                  </div>
                  <div className="flex-1 space-y-2">
                    <h4 className="text-sm md:text-base font-extrabold text-orange-950 uppercase tracking-wider">
                      ¡Dato Curioso!
                    </h4>
                    <p className="text-orange-900 text-sm md:text-base font-medium leading-relaxed">
                      {cabin.fun_fact}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Footer de Pestaña: Invitación Turística */}
            <div className="pt-6 border-t border-orange-100/60 flex items-center gap-4 text-xs md:text-sm text-orange-850 bg-orange-50/20 p-4 rounded-2xl">
              <span className="text-xl">🌿</span>
              <p className="font-semibold leading-relaxed">
                Descubre el encanto rural y costero de la localidad de **Pullally** durante tu estadía en **Rancho Carmelitas**. Pregunta a tus anfitriones por recorridos recomendados.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
