'use client';

import React, { useState } from 'react';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'general' | 'piscina';
}

export function RulesModal({ isOpen, onClose, defaultTab = 'general' }: RulesModalProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'piscina'>(defaultTab);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-gray-100 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera del Modal */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 via-white to-gray-50">
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#11d442] bg-[#11d442]/10 px-2.5 py-1 rounded-full">
              Normas Oficiales
            </span>
            <h3 className="text-xl font-bold text-gray-900 mt-1">
              Reglamento Rancho Carmelitas
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Cerrar modal"
          >
            ✕
          </button>
        </div>

        {/* Pestañas de Navegación */}
        <div className="flex border-b border-gray-100 bg-gray-50/50 px-6 pt-2">
          <button
            onClick={() => setActiveTab('general')}
            className={`py-3 px-4 font-bold text-sm border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'general'
                ? 'border-[#11d442] text-gray-900 bg-white rounded-t-xl'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <span>🏡</span>
            <span>Reglamento General de Cabañas</span>
          </button>
          <button
            onClick={() => setActiveTab('piscina')}
            className={`py-3 px-4 font-bold text-sm border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'piscina'
                ? 'border-[#009EE3] text-gray-900 bg-white rounded-t-xl'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <span>🏊</span>
            <span>Reglamento de Piscina</span>
          </button>
        </div>

        {/* Contenido scrolleable */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-gray-700 text-sm leading-relaxed">
          {activeTab === 'general' ? (
            <div className="space-y-6">
              <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-4 text-emerald-950 flex items-start gap-3">
                <span className="text-2xl">🌿</span>
                <div>
                  <h4 className="font-bold text-sm">REGLAMENTO GENERAL CABAÑAS RANCHO CARMELITAS</h4>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    Normas de convivencia y cuidado orientadas al descanso, la tranquilidad y el bienestar familiar.
                  </p>
                </div>
              </div>

              <ol className="space-y-3.5 list-none">
                {[
                  {
                    num: 1,
                    title: 'Horarios de Check-in y Check-out',
                    desc: 'El horario de check in (ingreso) es de 15:00 hrs a 21:00 hrs y el horario de check out (salida) es hasta las 12:00 hrs.'
                  },
                  {
                    num: 2,
                    title: 'Condición de Pago de la Reserva',
                    desc: 'Al reservar se cancela el 50% del valor y el 50% restante, en el check-in.'
                  },
                  {
                    num: 3,
                    title: 'Visitas y Pasajeros Adicionales',
                    desc: 'No se aceptarán visitas, de haber huéspedes adicionales se debe coordinar previo a la llegada y se debe cancelar un monto desde $10.000 por persona por noche por cada adicional.'
                  },
                  {
                    num: 4,
                    title: 'Destino Exclusivo para Descanso',
                    desc: 'No está permitido las celebraciones ni fiestas, son cabañas para descanso.'
                  },
                  {
                    num: 5,
                    title: 'Prohibición de Mascotas',
                    desc: 'Está prohibido el ingreso de mascotas en todo el recinto.'
                  },
                  {
                    num: 6,
                    title: 'Normas de la Piscina',
                    desc: 'Debe respetar las normas de la piscina en todo momento.'
                  },
                  {
                    num: 7,
                    title: 'Uso de Áreas Verdes',
                    desc: 'El uso de áreas verdes estará únicamente destinado para el uso de reposeras, toallas y descanso.'
                  },
                  {
                    num: 8,
                    title: 'Consumo de Alimentos en Jardines',
                    desc: 'Si ingiere alimentos en los jardines, se debe depositar los residuos en los recipientes de basura correspondientes.'
                  },
                  {
                    num: 9,
                    title: 'Prohibición de Música y Parlantes',
                    desc: 'No está permitido el uso de aparatos de reproducción de música (parlantes, celulares, etc).'
                  },
                  {
                    num: 10,
                    title: 'Responsabilidad por Daños',
                    desc: 'Los pasajeros son responsables de la reposición de cualquier utensilio y/o artefacto que se vea dañado/afectado.'
                  },
                  {
                    num: 11,
                    title: 'Entrega de la Cabaña',
                    desc: 'Se debe entregar la cabaña bajo el mismo orden y aseo encontrado.'
                  },
                  {
                    num: 12,
                    title: 'Uso del Quincho',
                    desc: 'El quincho puede ser utilizado, previa coordinación. Éste se encuentra equipado y rigen las mismas exigencias que con los implementos de las cabañas.'
                  },
                  {
                    num: 13,
                    title: 'Manejo de Residuos',
                    desc: 'El pasajero, deberá depositar todos sus residuos sólo en los recipientes habilitados.'
                  },
                  {
                    num: 14,
                    title: 'Cuidado de Jardines y Riego Automático',
                    desc: 'Los jardines y las áreas de paisajismo del recinto cuentan con sistemas de regadío automático, que no están adecuados para la realización de juegos con balones, bicicletas u otros. Cualquier daño ocasionado a este equipamiento u otro elemento de las áreas comunes será a cuenta del pasajero responsable como del menor a su cargo y será cobrado para su reposición o reparación.'
                  }
                ].map((item) => (
                  <li key={item.num} className="p-3.5 bg-gray-50/80 rounded-2xl border border-gray-100 flex items-start gap-3.5">
                    <span className="w-6 h-6 rounded-full bg-[#11d442] text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {item.num}
                    </span>
                    <div className="flex-1">
                      <strong className="text-gray-900 block text-xs uppercase tracking-wider mb-0.5">
                        {item.title}
                      </strong>
                      <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ol>

              <div className="text-center pt-2 text-xs font-bold text-gray-500 uppercase tracking-widest border-t border-gray-100">
                ADMINISTRACIÓN RANCHO CARMELITAS
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Información General de la Piscina */}
              <div className="bg-sky-50/70 border border-sky-200 rounded-2xl p-4 text-sky-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold text-sm">REGLAMENTO PARA EL USO DE LA PISCINA</h4>
                  <p className="text-xs text-sky-800 mt-0.5">
                    Seguridad, higiene y convivencia en el área de piscina.
                  </p>
                </div>
                <div className="flex gap-2 text-xs font-bold">
                  <span className="bg-sky-100 text-sky-800 px-3 py-1 rounded-lg">
                    🗓️ Sep - Abr
                  </span>
                  <span className="bg-sky-100 text-sky-800 px-3 py-1 rounded-lg">
                    ⏰ 9:00 a 20:00 hrs
                  </span>
                </div>
              </div>

              {/* De las Prohibiciones */}
              <div>
                <h5 className="font-bold text-red-900 text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                  De las Prohibiciones
                </h5>
                <ul className="space-y-2 text-xs sm:text-sm">
                  {[
                    'Menores de hasta 10 años deben estar acompañados por un adulto responsable.',
                    'Está prohibido escupir, sonarse, orinar o contaminar de cualquier forma el agua de la piscina.',
                    'Uso de zapatos dentro del recinto de la piscina (excepto zapatos de agua).',
                    'Tirar objetos de cualquier tipo a la piscina.',
                    'Ingreso de personas con parches, vendajes o afecciones a la piel.',
                    'Prohibido el consumo de cualquier producto comestible, bebestible, bebidas alcohólicas y de drogas, dentro del recinto piscina.',
                    'No está permitido el uso de aparatos de reproducción de música (parlantes, celulares, etc).',
                    'No pueden ingresar a la piscina personas que padezcan enfermedades estomacales o urinarias, en estado latente o tratamiento.',
                    'No podrán ingresar a la piscina las personas que estén bajo el efecto del alcohol, drogas u otros estupefacientes.',
                    'Está prohibido estrictamente fumar dentro del área de la piscina.',
                    'No se permiten juegos, tales como waterpolo, bombas, "chinas", hacer saltos de cabeza o de zambullida, correr por los bordes de la piscina u otros que puedan revestir peligro para los usuarios individuales como para los restantes. No está permitido.',
                    'No está permitido el ingreso de camas, flotadores de gran tamaño, sillones o botes inflables al interior de la piscina.',
                    'No se permite el uso de malas palabras, lenguaje obsceno o conducta indeseable.',
                    'No se permiten juegos bruscos, de mano, gritos o cualquier actividad física que atente contra la seguridad y tranquilidad de los demás visitantes.'
                  ].map((rule, idx) => (
                    <li key={idx} className="p-2.5 bg-red-50/40 border border-red-100/80 rounded-xl flex items-start gap-2.5 text-gray-700">
                      <span className="text-red-500 font-bold shrink-0">✕</span>
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* De las Obligaciones */}
              <div>
                <h5 className="font-bold text-emerald-900 text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#11d442]"></span>
                  De las Obligaciones
                </h5>
                <ul className="space-y-2 text-xs sm:text-sm">
                  {[
                    'Todo bañista cada vez que entre o salga del área de piscina deberá tomar un baño completo en la ducha antes de regresar a la piscina.',
                    'En todo momento se debe guardar una conducta apropiada a la moral y las buenas costumbres.',
                    'Será obligatorio el traje de baño para damas y para varones.',
                    'Se recomienda no portar aros, anillos, gargantillas, pulseras u otro similar en el recinto de piscina.',
                    'Sólo se podrán usar flotadores de protección.'
                  ].map((req, idx) => (
                    <li key={idx} className="p-2.5 bg-emerald-50/50 border border-emerald-100 rounded-xl flex items-start gap-2.5 text-gray-700">
                      <span className="text-[#11d442] font-bold shrink-0">✓</span>
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="text-center pt-2 text-xs font-bold text-gray-500 uppercase tracking-widest border-t border-gray-100">
                ADMINISTRACIÓN RANCHO CARMELITAS
              </div>
            </div>
          )}
        </div>

        {/* Footer del Modal */}
        <div className="p-4 sm:p-6 border-t border-gray-100 bg-gray-50/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-500 text-center sm:text-left">
            Al reservar en Rancho Carmelitas, aceptas el cumplimiento de estas normas oficiales.
          </p>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs"
          >
            Entendido y Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
