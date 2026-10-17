'use client';

import React from 'react';
import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';

export default function PrivacidadPage() {
  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const sections = [
    {
      num: 1,
      title: 'Responsable del Tratamiento de Datos',
      desc: 'Rancho Carmelitas, complejo turístico ubicado en Pullally, Papudo, Región de Valparaíso, es el responsable del tratamiento y resguardo de los datos personales proporcionados por los huéspedes y visitantes.',
      badge: 'Responsable',
      icon: '🛡️'
    },
    {
      num: 2,
      title: 'Datos Personales que Recolectamos',
      desc: 'Para la correcta gestión de su reserva y estadía, solicitamos: Nombre completo, RUT o Pasaporte, Correo electrónico, Teléfono de contacto, Patente del vehículo, Nacionalidad/Ciudad de origen y Fecha de nacimiento.',
      badge: 'Recolección',
      icon: '📋'
    },
    {
      num: 3,
      title: 'Finalidad Exclusiva del Uso de Datos',
      desc: 'Sus datos se utilizan estrictamente para: (a) Confirmación y facturación de la reserva; (b) Control de acceso y seguridad vehicular en el recinto; (c) Cumplimiento de registros de hotelería exigidos por la autoridad; (d) Envío de comprobantes de pago y comunicaciones transaccionales directas.',
      badge: 'Finalidad',
      icon: '🎯'
    },
    {
      num: 4,
      title: 'No Divulgación ni Venta a Terceros',
      desc: 'Rancho Carmelitas no vende, alquila, cede ni transfiere bajo ninguna circunstancia sus datos personales a terceros con fines publicitarios, de marketing ni prospección comercial.',
      badge: 'Confidencialidad',
      icon: '🔒'
    },
    {
      num: 5,
      title: 'Pasarelas de Pago y Seguridad Financiera',
      desc: 'Los pagos en línea se procesan mediante pasarelas de pago cifradas y certificadas (Mercado Pago / Webpay). Rancho Carmelitas nunca almacena ni tiene acceso a los números de tarjetas de crédito o débito de los huéspedes.',
      badge: 'Pagos Seguros',
      icon: '💳'
    },
    {
      num: 6,
      title: 'Derechos del Titular (Ley N° 19.628)',
      desc: 'Usted tiene derecho a solicitar información, modificación, rectificación o eliminación de sus datos personales una vez finalizada su estadía, escribiéndonos a nuestro correo oficial de contacto.',
      badge: 'Derechos',
      icon: '⚖️'
    }
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-gray-800 pb-20 selection:bg-[#11d442]/20 selection:text-gray-900">
      
      {/* Header Institucional */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-150 sticky top-0 z-30 print:hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-90">
            <Logo className="w-10 h-10 object-contain drop-shadow-sm" />
            <div>
              <span className="font-extrabold text-gray-900 text-lg tracking-tight block">Rancho Carmelitas</span>
              <span className="text-[11px] font-semibold text-[#11d442] uppercase tracking-wider block -mt-1">Pullally • Papudo</span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span>Imprimir</span>
            </button>

            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#11d442] hover:bg-[#0fb337] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <span>Volver al Inicio</span>
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Principal */}
      <section className="bg-gradient-to-b from-white to-gray-50/60 border-b border-gray-150 py-12 sm:py-16 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold uppercase tracking-wider">
            <span>🛡️ Marco Legal y Transparencia</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-950 tracking-tight">
            Política de Privacidad y <br className="hidden sm:inline" />
            <span className="text-[#11d442]">Protección de Datos Personales</span>
          </h1>

          <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto leading-relaxed">
            En Rancho Carmelitas protegemos rigurosamente la privacidad y confidencialidad de la información de nuestros huéspedes conforme a la Ley N° 19.628 sobre Protección de la Vida Privada.
          </p>
        </div>
      </section>

      {/* Grid de Secciones */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-10 space-y-5">
        {sections.map((sec) => (
          <article
            key={sec.num}
            className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-7 shadow-xs hover:border-gray-300 transition-all space-y-3"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-emerald-50 text-xl flex items-center justify-center shrink-0 border border-emerald-100">
                  {sec.icon}
                </span>
                <h2 className="text-base sm:text-lg font-bold text-gray-900">
                  {sec.title}
                </h2>
              </div>
              <span className="bg-gray-100 text-gray-700 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-lg">
                {sec.badge}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed pl-13">
              {sec.desc}
            </p>
          </article>
        ))}

        {/* Footer Informativo */}
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-6 text-center space-y-2 mt-8">
          <p className="text-xs font-semibold text-emerald-900">
            ¿Tienes dudas sobre el tratamiento de tus datos personales?
          </p>
          <p className="text-xs text-emerald-800">
            Contáctanos directamente a través de nuestros canales oficiales de WhatsApp o correo electrónico institucional.
          </p>
        </div>
      </main>

    </div>
  );
}
