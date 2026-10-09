'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';

export default function ReglamentoPage() {
  const [filter, setFilter] = useState<'all' | 'cabins' | 'pool'>('all');

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const generalRules = [
    {
      num: 1,
      title: 'Horarios de Check-in y Check-out',
      desc: 'El horario de check in (ingreso) es de 15:00 hrs a 21:00 hrs y el horario de check out (salida) es hasta las 12:00 hrs.',
      badge: 'Horarios'
    },
    {
      num: 2,
      title: 'Condición de Pago de la Reserva',
      desc: 'Al reservar se cancela el 50% del valor y el 50% restante, en el check-in.',
      badge: 'Pagos'
    },
    {
      num: 3,
      title: 'Visitas y Pasajeros Adicionales',
      desc: 'No se aceptarán visitas, de haber huéspedes adicionales se debe coordinar previo a la llegada y se debe cancelar un monto desde $10.000 por persona por noche por cada adicional.',
      badge: 'Capacidad'
    },
    {
      num: 4,
      title: 'Destino Exclusivo para Descanso',
      desc: 'No está permitido las celebraciones ni fiestas, son cabañas para descanso.',
      badge: 'Convivencia'
    },
    {
      num: 5,
      title: 'Prohibición de Mascotas',
      desc: 'Está prohibido el ingreso de mascotas en todo el recinto.',
      badge: 'Estricto'
    },
    {
      num: 6,
      title: 'Normas de la Piscina',
      desc: 'Debe respetar las normas de la piscina en todo momento.',
      badge: 'Seguridad'
    },
    {
      num: 7,
      title: 'Uso de Áreas Verdes',
      desc: 'El uso de áreas verdes estará únicamente destinado para el uso de reposeras, toallas y descanso.',
      badge: 'Jardines'
    },
    {
      num: 8,
      title: 'Consumo de Alimentos en Jardines',
      desc: 'Si ingiere alimentos en los jardines, se debe depositar los residuos en los recipientes de basura correspondientes.',
      badge: 'Limpieza'
    },
    {
      num: 9,
      title: 'Prohibición de Música y Parlantes',
      desc: 'No está permitido el uso de aparatos de reproducción de música (parlantes, celulares, etc).',
      badge: 'Silencio'
    },
    {
      num: 10,
      title: 'Responsabilidad por Daños',
      desc: 'Los pasajeros son responsables de la reposición de cualquier utensilio y/o artefacto que se vea dañado/afectado.',
      badge: 'Equipamiento'
    },
    {
      num: 11,
      title: 'Entrega de la Cabaña',
      desc: 'Se debe entregar la cabaña bajo el mismo orden y aseo encontrado.',
      badge: 'Aseo'
    },
    {
      num: 12,
      title: 'Uso del Quincho',
      desc: 'El quincho puede ser utilizado, previa coordinación. Éste se encuentra equipado y rigen las mismas exigencias que con los implementos de las cabañas.',
      badge: 'Quincho'
    },
    {
      num: 13,
      title: 'Manejo de Residuos',
      desc: 'El pasajero, deberá depositar todos sus residuos sólo en los recipientes habilitados.',
      badge: 'Ecología'
    },
    {
      num: 14,
      title: 'Cuidado de Jardines y Riego Automático',
      desc: 'Los jardines y las áreas de paisajismo del recinto cuentan con sistemas de regadío automático, que no están adecuados para la realización de juegos con balones, bicicletas u otros. Cualquier daño ocasionado a este equipamiento u otro elemento de las áreas comunes será a cuenta del pasajero responsable como del menor a su cargo y será cobrado para su reposición o reparación.',
      badge: 'Paisajismo'
    }
  ];

  const poolProhibitions = [
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
  ];

  const poolObligations = [
    'Todo bañista cada vez que entre o salga del área de piscina deberá tomar un baño completo en la ducha antes de regresar a la piscina.',
    'En todo momento se debe guardar una conducta apropiada a la moral y las buenas costumbres.',
    'Será obligatorio el traje de baño para damas y para varones.',
    'Se recomienda no portar aros, anillos, gargantillas, pulseras u otro similar en el recinto de piscina.',
    'Sólo se podrán usar flotadores de protección.'
  ];

  return (
    <div className="min-h-screen flex flex-col bg-surface font-sans text-gray-800">
      {/* Header Fijo */}
      <header className="sticky top-0 z-50 w-full glass-effect border-b border-gray-200/50 print:hidden">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            <Logo className="w-10 h-10 rounded-full object-cover border border-gray-200/50 shadow-sm" />
            <span className="text-xl font-bold tracking-tight text-gray-900">
              Rancho<span className="text-[#11d442]">Carmelitas</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
            <Link href="/" className="hover:text-[#11d442] transition-colors">Inicio</Link>
            <Link href="/#cabins" className="hover:text-[#11d442] transition-colors">Cabañas</Link>
            <Link href="/reserva" className="hover:text-[#11d442] transition-colors text-gray-800 font-semibold flex items-center gap-1">
              <span>🔍 Mi Reserva</span>
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="px-4 py-2 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-2xs"
            >
              <span>🖨️</span>
              <span className="hidden sm:inline">Imprimir / Guardar PDF</span>
            </button>
            <Link href="/#cabins" className="btn-primary text-xs sm:text-sm py-2 sm:py-2.5">
              Reservar Ahora
            </Link>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="flex-1 py-12 md:py-16">
        <div className="container mx-auto px-4 max-w-5xl">
          
          {/* Hero de Documentación */}
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#11d442]/10 text-[#11d442] text-xs font-extrabold uppercase tracking-widest mb-4">
              <span>📜 Documento Oficial de Administración</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
              Reglamento Interno y Normas de Convivencia
            </h1>
            <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
              Rancho Carmelitas es un refugio familiar concebido para el descanso y la conexión con la naturaleza. 
              El presente reglamento rige para todos nuestros pasajeros y visitantes con el fin de garantizar una estancia segura, armoniosa y confortable.
            </p>
          </div>

          {/* Barra de Filtros y Acciones (oculta al imprimir) */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-10 p-3 bg-white rounded-2xl border border-gray-100 shadow-xs print:hidden">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  filter === 'all'
                    ? 'bg-gray-900 text-white shadow-xs'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                📋 Todo el Reglamento
              </button>
              <button
                onClick={() => setFilter('cabins')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  filter === 'cabins'
                    ? 'bg-[#11d442] text-white shadow-xs'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span>🏡</span>
                <span>Cabañas y Convivencia</span>
              </button>
              <button
                onClick={() => setFilter('pool')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  filter === 'pool'
                    ? 'bg-[#009EE3] text-white shadow-xs'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span>🏊</span>
                <span>Sector Piscina</span>
              </button>
            </div>

            <span className="text-xs text-gray-400 font-medium hidden md:inline">
              Pullally, Papudo • Región de Valparaíso
            </span>
          </div>

          <div className="space-y-12">

            {/* SECCIÓN 1: REGLAMENTO GENERAL DE CABAÑAS */}
            {(filter === 'all' || filter === 'cabins') && (
              <section id="reglamento-cabanas" className="bg-white rounded-3xl p-6 sm:p-10 border border-gray-100 shadow-sm print:border-none print:shadow-none print:p-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-8 border-b border-gray-100 gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-[#11d442] flex items-center justify-center text-2xl font-bold border border-emerald-100">
                      🏡
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        Reglamento General Cabañas Rancho Carmelitas
                      </h2>
                      <p className="text-xs sm:text-sm text-gray-500">
                        14 normas de convivencia, equipamiento y cuidado del recinto
                      </p>
                    </div>
                  </div>

                  <span className="self-start sm:self-auto text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                    Obligatorio para Pasajeros
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {generalRules.map((rule) => (
                    <div 
                      key={rule.num}
                      className="p-5 rounded-2xl bg-gray-50/70 border border-gray-100/90 hover:border-gray-200 transition-all flex items-start gap-4"
                    >
                      <div className="w-8 h-8 rounded-xl bg-gray-900 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                        {rule.num}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-bold text-sm text-gray-900">
                            {rule.title}
                          </h3>
                          <span className="text-[10px] font-bold text-gray-400 bg-white px-2 py-0.5 rounded-md border border-gray-200">
                            {rule.badge}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                          {rule.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#11d442]"></span>
                    <span>El incumplimiento de estas normas faculta a la administración a solicitar la restitución inmediata de la cabaña.</span>
                  </div>
                  <strong className="tracking-wider uppercase text-gray-700">
                    ADMINISTRACIÓN RANCHO CARMELITAS
                  </strong>
                </div>
              </section>
            )}

            {/* SECCIÓN 2: REGLAMENTO DE PISCINA */}
            {(filter === 'all' || filter === 'pool') && (
              <section id="reglamento-piscina" className="bg-white rounded-3xl p-6 sm:p-10 border border-gray-100 shadow-sm print:border-none print:shadow-none print:p-0 print:mt-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-8 border-b border-gray-100 gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-sky-50 text-[#009EE3] flex items-center justify-center text-2xl font-bold border border-sky-100">
                      🏊
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        Reglamento para el Uso de la Piscina
                      </h2>
                      <p className="text-xs sm:text-sm text-gray-500">
                        Condiciones de seguridad, salubridad y convivencia en el área de baño
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs font-bold">
                    <span className="bg-sky-50 text-sky-800 border border-sky-100 px-3 py-1.5 rounded-full">
                      🗓️ Temporada: Septiembre - Abril
                    </span>
                    <span className="bg-sky-50 text-sky-800 border border-sky-100 px-3 py-1.5 rounded-full">
                      ⏰ Horario: 9:00 a 20:00 hrs
                    </span>
                  </div>
                </div>

                <div className="space-y-8">
                  {/* Bloque de Prohibiciones */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="w-3 h-3 rounded-full bg-red-500"></span>
                      <h3 className="font-extrabold text-sm uppercase tracking-wider text-red-950">
                        De las Prohibiciones
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {poolProhibitions.map((item, idx) => (
                        <div 
                          key={idx}
                          className="p-3.5 rounded-2xl bg-red-50/40 border border-red-100/70 flex items-start gap-3 text-xs sm:text-sm text-gray-700"
                        >
                          <span className="text-red-500 font-extrabold shrink-0 mt-0.5">✕</span>
                          <span className="leading-relaxed">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bloque de Obligaciones */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="w-3 h-3 rounded-full bg-[#11d442]"></span>
                      <h3 className="font-extrabold text-sm uppercase tracking-wider text-emerald-950">
                        De las Obligaciones
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {poolObligations.map((item, idx) => (
                        <div 
                          key={idx}
                          className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-100 flex items-start gap-3 text-xs sm:text-sm text-gray-700"
                        >
                          <span className="text-[#11d442] font-extrabold shrink-0 mt-0.5">✓</span>
                          <span className="leading-relaxed">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                    <span>El cuidado de los niños en el agua es de exclusiva responsabilidad de sus padres o tutores legales.</span>
                  </div>
                  <strong className="tracking-wider uppercase text-gray-700">
                    ADMINISTRACIÓN RANCHO CARMELITAS
                  </strong>
                </div>
              </section>
            )}

          </div>

          {/* Banner de Contacto / Consultas */}
          <div className="mt-12 bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 text-center space-y-3 print:hidden">
            <h3 className="text-base sm:text-lg font-bold text-gray-900">
              ¿Tienes alguna duda sobre el reglamento o tu próxima estadía?
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 max-w-xl mx-auto">
              Nuestro equipo de anfitriones y administración está a tu disposición para coordinar detalles, adicionales o requerimientos particulares.
            </p>
            <div className="pt-2 flex flex-wrap justify-center gap-4">
              <a
                href="https://wa.me/56984012748?text=Hola,%20tengo%20una%20consulta%20sobre%20el%20reglamento%20de%20Rancho%20Carmelitas"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs sm:text-sm font-bold px-5 py-2.5 rounded-xl transition-all shadow-xs"
              >
                <span>💬</span>
                <span>Contactar por WhatsApp (+56 9 8401 2748)</span>
              </a>
              <Link
                href="/#cabins"
                className="inline-flex items-center gap-2 bg-gray-900 hover:bg-black text-white text-xs sm:text-sm font-bold px-5 py-2.5 rounded-xl transition-all shadow-xs"
              >
                <span>🏡</span>
                <span>Ver Cabañas Disponibles</span>
              </Link>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 border-t border-gray-800 print:hidden">
        <div className="container mx-auto px-4 text-center text-sm">
          <div className="flex flex-col items-center justify-center gap-6">
            <div className="flex items-center gap-3">
              <Logo className="w-12 h-12 rounded-full object-cover border border-zinc-800 shadow-sm" />
              <span className="text-xl font-bold tracking-tight text-white">
                Rancho<span className="text-[#11d442]">Carmelitas</span>
              </span>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-xs sm:text-sm">
              <Link href="/" className="hover:text-white transition-colors">Portada</Link>
              <Link href="/#cabins" className="hover:text-white transition-colors">Cabañas</Link>
              <Link href="/reserva" className="hover:text-white transition-colors">Consultar Reserva</Link>
              <a href="https://www.instagram.com/ranchocarmelitas/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Instagram</a>
              <a href="https://maps.app.goo.gl/6W1fhgChaMWaQzbK8" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Ubicación</a>
            </div>
            <p className="text-xs text-gray-500">© {new Date().getFullYear()} Rancho Carmelitas. Todos los derechos reservados. Pullally, Papudo, Chile.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
