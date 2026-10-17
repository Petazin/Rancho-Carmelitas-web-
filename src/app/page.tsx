import React from "react";
import Link from "next/link";
import Image from "next/image";
import { CabinCard } from "@/components/ui/CabinCard";
import { supabase } from "@/lib/supabase";
import { SocialSection } from "@/components/ui/SocialSection";
import { Logo } from "@/components/ui/Logo";
import { TeamSection, TeamMember } from "@/components/ui/TeamSection";

export const dynamic = 'force-dynamic';

export default async function Home() {
  
  // Extraemos las cabañas desde Supabase y las ordenamos por precio
  const { data: cabins, error } = await supabase
    .from('cabins')
    .select('*')
    .order('price_per_night', { ascending: true });

  if (error) {
    console.error("Error cargando cabañas desde Supabase:", error);
  }

  /* 
   * COMENTARIO DEL DESARROLLADOR:
   * MEJORA ARQUITECTÓNICA - DESACOPLAMIENTO DE TEXTOS EN DURO
   * Para permitir la autogestión completa y evitar textos en duro (hardcoded), ampliamos la tabla única
   * `landing_settings` con los textos del resto de la landing (Cabañas, Galería, Equipo, SERNATUR y Reglas de Convivencia).
   * La descripción de cabañas se ha sanitizado removiendo la frase "de madera" por requerimiento del propietario.
   * Se mantiene una lógica defensiva: si los campos nuevos o la tabla fallan por falta de migración inicial,
   * se utilizan de forma transparente los fallbacks estáticos locales.
   */
  let heroSettings = {
    hero_title: 'Escapa a la naturaleza, con total comodidad.',
    hero_subtitle: 'Descubre nuestras exclusivas cabañas totalmente equipadas en el corazón de Pullally, Papudo. Tu refugio perfecto entre el bosque y el mar.',
    hero_bg_url: '/gallery/hero.png',
    logo_url: '',
    cabins_title: 'Nuestras Cabañas',
    cabins_subtitle: 'Espacios diseñados para tu confort. Cabañas con cocina equipada, aire acondicionado y todo lo necesario para tu descanso en Rancho Carmelitas.',
    gallery_title: 'Galería de Momentos',
    gallery_subtitle: 'Vistas reales de nuestro entorno, piscina y confortables interiores.',
    team_title: 'Nuestro Equipo',
    team_subtitle: 'Conoce a las personas dedicadas a cuidar cada detalle de tu descanso y estadía en Rancho Carmelitas.',
    sernatur_title: 'Servicio Turístico Registrado',
    sernatur_subtitle: 'Vigencia hasta Enero 2026 • Registro № 71034',
    sernatur_badge: 'Calidad y Confianza',
    rules_title: 'Reglas de Convivencia',
    rules_list: [
      'Check-in: 15:00 a 21:00 hrs. Check-out: hasta las 12:00 hrs.',
      'Prohibido fumar: Por seguridad forestal e higiene, prohibido fumar en cabañas y piscina.',
      'Mascotas: Está prohibido el ingreso de mascotas en todo el recinto.',
      'Descanso y Música: Cabañas de descanso; prohibidas fiestas y uso de parlantes o música exterior.'
    ],
    contact_address: 'Avenida Las Salinas № 104 D-4, Pullally, Papudo, Región de Valparaíso, Chile',
    contact_phone: '+56 9 8401 2748',
    contact_email: 'contacto@ranchocarmelitas.cl',
    contact_maps_url: 'https://maps.app.goo.gl/6W1fhgChaMWaQzbK8',
    contact_location_legend: '* Pullally está ubicado en la Región de Valparaíso, a sólo 2 horas de Santiago.'
  };

  try {
    const { data: settingsData, error: settingsError } = await supabase
      .from('landing_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle();

    if (!settingsError && settingsData) {
      // Sanitización defensiva de textos para asegurar congruencia absoluta con el reglamento oficial
      const sanitizedRulesTitle = (settingsData.rules_title || 'Reglas de Convivencia')
        .replace(/\s*hola\b/gi, '')
        .trim() || 'Reglas de Convivencia';

      let sanitizedRulesList = settingsData.rules_list;
      if (typeof sanitizedRulesList === 'string') {
        try {
          sanitizedRulesList = JSON.parse(sanitizedRulesList);
        } catch {
          sanitizedRulesList = null;
        }
      }
      if (Array.isArray(sanitizedRulesList)) {
        sanitizedRulesList = sanitizedRulesList.map((r: string) => {
          if (/amigos peludos|mascota/i.test(r)) {
            return 'Mascotas: Está prohibido el ingreso de mascotas en todo el recinto.';
          }
          if (/check-out:\s*11:00/i.test(r)) {
            return 'Check-in: 15:00 a 21:00 hrs. Check-out: hasta las 12:00 hrs.';
          }
          if (/silencio nocturno/i.test(r)) {
            return 'Descanso y Música: Cabañas de descanso; prohibidas las fiestas y el uso de parlantes o música al aire libre.';
          }
          return r.replace(/\s*hola\b/gi, '').trim();
        });
      }

      heroSettings = {
        ...heroSettings,
        ...settingsData,
        rules_title: sanitizedRulesTitle,
        rules_list: sanitizedRulesList && sanitizedRulesList.length > 0 ? sanitizedRulesList : heroSettings.rules_list
      };
    }
  } catch (err) {
    console.warn("Advertencia cargando landing_settings (usando fallback estático local):", err);
  }

  // Formatear dinámicamente el título del Hero destacando "comodidad" en verde Rancho
  const titleText = heroSettings.hero_title;
  const highlightWord = "comodidad";
  let formattedTitle: React.ReactNode = titleText;
  if (titleText.includes(highlightWord)) {
    const parts = titleText.split(highlightWord);
    formattedTitle = (
      <>
        {parts[0]}
        <span className="text-[#11d442]">{highlightWord}</span>
        {parts[1]}
      </>
    );
  }

  // 2. Cargar fotos de la galería de momentos de forma defensiva
  let galleryItems = [
    { src: '/gallery/piscina_principal.jpg', alt: 'Piscina principal y entorno familiar en Rancho Carmelitas' },
    { src: '/gallery/areas_verdes.jpg', alt: 'Jardines, toldos de sombra y áreas verdes' },
    { src: '/gallery/entorno_hd.png', alt: 'Senderos y áreas verdes exteriores' },
    { src: '/gallery/dormitorio.png', alt: 'Dormitorio matrimonial confortable' },
    { src: '/gallery/interior.png', alt: 'Cocina equipada y comodidades' },
    { src: '/gallery/piscina.png', alt: 'Diversión familiar en la piscina' },
  ];

  try {
    const { data: dbGallery, error: galleryError } = await supabase
      .from('landing_moments')
      .select('*')
      .order('position', { ascending: true });

    if (!galleryError && dbGallery && dbGallery.length > 0) {
      galleryItems = dbGallery.map((item: { image_url: string; caption?: string }) => ({
        src: item.image_url,
        alt: item.caption || 'Momento en Rancho Carmelitas'
      }));
    }
  } catch (err) {
    console.warn("Advertencia cargando landing_moments (usando fallback estático local):", err);
  }

  // 3. Cargar integrantes del equipo de trabajo desde Supabase (sin datos ficticios en duro)
  let teamMembers: TeamMember[] = [];

  try {
    const { data: dbTeam, error: teamError } = await supabase
      .from('landing_team')
      .select('*')
      .order('order_index', { ascending: true });

    if (!teamError && dbTeam && dbTeam.length > 0) {
      teamMembers = dbTeam
        .filter((item: any) => item.name && item.name.trim().length > 0)
        .map((item: any) => ({
          id: String(item.id),
          name: item.name,
          role: item.role || '',
          description: item.description || '',
          image_url: item.image_url || null,
          order_index: item.order_index
        }));
    }
  } catch (err) {
    console.warn("Advertencia cargando landing_team:", err);
  }

  // 4. Preguntas Frecuentes con Schema.org FAQPage para Rich Snippets en Google
  const faqs = [
    {
      q: "¿Cuáles son los horarios de Check-in y Check-out?",
      a: "El Check-in se realiza entre las 15:00 y las 21:00 hrs. El Check-out es hasta las 12:00 hrs para garantizar la preparación higiénica óptima de cada cabaña."
    },
    {
      q: "¿Cómo se confirma la reserva y qué formas de pago aceptan?",
      a: "Para reservar solicitamos un abono inicial del 50% vía transferencia bancaria o Mercado Pago. El 50% restante se cancela directamente al momento de realizar el check-in en el rancho."
    },
    {
      q: "¿Se permite el ingreso de mascotas?",
      a: "Por respeto a la tranquilidad de los huéspedes, resguardo de la fauna del bosque y motivos de higiene, está estrictamente prohibido el ingreso de mascotas en todo el recinto."
    },
    {
      q: "¿Qué comodidades y equipamiento incluyen las cabañas?",
      a: "Cada cabaña cuenta con cocina totalmente equipada (refrigerador, encimera y vajilla), baño privado con agua caliente, aire acondicionado frío/calor, televisión satelital, parrilla individual, estacionamiento privado y acceso libre a piscina y áreas verdes."
    },
    {
      q: "¿A qué distancia está Rancho Carmelitas de la playa de Papudo y de Santiago?",
      a: "Estamos ubicados en Pullally, a sólo 2 horas de Santiago por la Ruta 5 Norte. Las playas y la bahía de Papudo están a escasos 10 a 15 minutos en vehículo."
    }
  ];

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map((f) => ({
      "@type": "Question",
      "name": f.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": f.a
      }
    }))
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface font-sans">
      {/* Header flotante minimalista */}
      <header className="fixed top-0 z-50 w-full glass-effect border-b border-gray-200/50">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo className="w-10 h-10 rounded-full object-cover border border-gray-200/50 shadow-sm" logoUrl={heroSettings.logo_url} />
            <span className="text-xl font-bold tracking-tight text-gray-900">
              Rancho<span className="text-[#11d442]">Carmelitas</span>
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
            <a href="#cabins" className="hover:text-[#11d442] transition-colors">Cabañas</a>
            <a href="#gallery" className="hover:text-[#11d442] transition-colors">Galería</a>
            {teamMembers.length > 0 && (
              <a href="#team" className="hover:text-[#11d442] transition-colors">Equipo</a>
            )}
            <a href="#location-social" className="hover:text-[#11d442] transition-colors">Ubicación</a>
            <a href="#faq" className="hover:text-[#11d442] transition-colors">Preguntas</a>
            <Link href="/reglamento" className="hover:text-[#11d442] transition-colors">Reglamento</Link>
            <Link href="/reserva" className="hover:text-[#11d442] transition-colors text-gray-800 font-semibold flex items-center gap-1">
              <span>🔍 Mi Reserva</span>
            </Link>
            <a href="/admin" className="hover:text-[#11d442] transition-colors text-gray-400">Admin</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/reserva" className="md:hidden text-xs font-bold text-gray-700 bg-gray-100 px-2.5 py-1.5 rounded-lg">
              Mi Reserva
            </Link>
            <a href="#cabins" className="btn-primary">
              Reservar Ahora
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative min-h-[85vh] py-20 sm:py-24 md:py-28 flex items-center justify-center bg-gray-900">
          {/* Background image optimizada con Next.js Image y priority para máximo rendimiento LCP */}
          <div className="absolute inset-0 z-0 overflow-hidden">
            <Image
              src={heroSettings.hero_bg_url || "/gallery/piscina_principal.jpg"}
              alt="Cabañas y piscina en Rancho Carmelitas, Pullally, Papudo"
              fill
              priority
              sizes="100vw"
              className="object-cover object-center"
              quality={85}
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-br from-black/80 to-black/30 z-10" />
          
          <div className="relative z-20 text-center px-4 max-w-4xl mx-auto mt-16 hover-lift flex flex-col items-center justify-center">
            <Logo 
              className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-white/20 shadow-2xl mb-8 hover:scale-[1.05] transition-transform duration-500 bg-white/10 backdrop-blur-sm" 
              logoUrl={heroSettings.logo_url} 
            />
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight leading-tight">
              {formattedTitle}
            </h1>
            <p className="text-lg md:text-xl text-gray-200 mb-10 max-w-2xl mx-auto font-light">
              {heroSettings.hero_subtitle}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a href="#cabins" className="btn-primary text-center text-lg px-8 py-4 w-full sm:w-auto">
                Ver Disponibilidad
              </a>
              <a href="#gallery" className="bg-white/10 text-white border border-white/20 hover:bg-white/20 transition-colors backdrop-blur-sm rounded-xl px-8 py-4 font-semibold w-full sm:w-auto text-center">
                Ver Instalaciones
              </a>

            </div>
          </div>
        </section>

        {/* Cabins Section with DB Data */}
        <section id="cabins" className="py-24 bg-surface">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16 flex flex-col items-center justify-center">
              <Logo className="w-24 h-24 md:w-28 md:h-28 rounded-full object-cover border border-gray-200/50 shadow-md mb-4 hover:scale-105 transition-transform duration-300" logoUrl={heroSettings.logo_url} />
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">{heroSettings.cabins_title || 'Nuestras Cabañas'}</h2>
              <p className="text-gray-500 max-w-2xl mx-auto text-lg">
                {heroSettings.cabins_subtitle}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {cabins && cabins.length > 0 ? (
                cabins.map((cabin) => (
                  <CabinCard 
                    key={cabin.id}
                    id={cabin.id}
                    name={cabin.name}
                    description={cabin.description || ""}
                    price={cabin.price_per_night}
                    imageUrl={cabin.gallery_urls?.[0] || '/gallery/interior.png'}
                    capacity={cabin.capacity}
                    bedrooms={cabin.bedrooms !== null && cabin.bedrooms !== undefined ? cabin.bedrooms : Math.floor(cabin.capacity / 2)}
                  />
                ))
              ) : (
                <div className="col-span-full text-center text-gray-500 py-12">
                  <p>Aún no hay cabañas publicadas en el sistema.</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Gallery Section */}
        <section id="gallery" className="py-24 bg-white border-t border-gray-100">
          <div className="container mx-auto px-4 text-center flex flex-col items-center justify-center">
            <Logo className="w-24 h-24 md:w-28 md:h-28 rounded-full object-cover border border-gray-200/50 shadow-md mb-4 hover:scale-105 transition-transform duration-300" logoUrl={heroSettings.logo_url} />
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">{heroSettings.gallery_title || 'Galería de Momentos'}</h2>
            <p className="text-gray-500 mb-12 max-w-2xl mx-auto">{heroSettings.gallery_subtitle}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {galleryItems.map((img, i) => (
                <div key={i} className="aspect-[4/3] bg-gray-100 rounded-2xl overflow-hidden hover:scale-[1.02] transition-transform duration-300 shadow-sm will-change-transform transform-gpu">
                  <img 
                    src={img.src} 
                    alt={img.alt} 
                    className="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Sección de Equipo de Trabajo y Hospitalidad (solo si el administrador ha registrado integrantes) */}
        {teamMembers && teamMembers.length > 0 && (
          <TeamSection 
            title={heroSettings.team_title}
            subtitle={heroSettings.team_subtitle}
            logoUrl={heroSettings.logo_url}
            members={teamMembers}
          />
        )}

        {/* Trust / SERNATUR Section */}
        <section className="py-12 bg-white border-y border-gray-100">
          <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-center gap-8 opacity-80 grayscale hover:grayscale-0 transition-all">
            <div className="flex items-center gap-4">
              <Logo className="w-16 h-16 rounded-full object-cover border border-[#11d442]/30 shadow-sm" logoUrl={heroSettings.logo_url} />
              <div>
                <h4 className="font-bold text-gray-900">{heroSettings.sernatur_title || 'Servicio Turístico Registrado'}</h4>
                <p className="text-sm text-gray-500">{heroSettings.sernatur_subtitle}</p>
              </div>
            </div>
            <div className="h-8 w-px bg-gray-200 hidden md:block" />
            <div className="text-center md:text-left">
              <p className="text-sm font-semibold text-gray-400 tracking-widest uppercase">{heroSettings.sernatur_badge || 'Calidad y Confianza'}</p>
            </div>
          </div>
        </section>

        {/* Ubicación y Comunidad en Redes Sociales */}
        <SocialSection 
          address={heroSettings.contact_address}
          phone={heroSettings.contact_phone}
          email={heroSettings.contact_email}
          mapsUrl={heroSettings.contact_maps_url}
          locationLegend={heroSettings.contact_location_legend}
        />

        {/* Sección de Preguntas Frecuentes (FAQ) optimizada para SEO y Rich Snippets de Google */}
        <section id="faq" className="py-24 bg-white border-t border-gray-100">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="text-center mb-16">
              <span className="text-[#11d442] font-semibold text-sm uppercase tracking-widest">
                Resolvemos tus Dudas
              </span>
              <h2 className="text-3xl md:text-4xl font-bold mt-3 text-gray-900 tracking-tight">
                Preguntas Frecuentes
              </h2>
              <p className="text-gray-500 mt-4 text-base md:text-lg font-light max-w-2xl mx-auto">
                Todo lo que necesitas saber para planificar tu escapada y descanso en Rancho Carmelitas, Pullally.
              </p>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <details
                  key={index}
                  className="group bg-surface rounded-2xl p-6 border border-gray-100 transition-all open:shadow-xs"
                >
                  <summary className="font-bold text-gray-900 text-base md:text-lg cursor-pointer flex items-center justify-between list-none">
                    <span>{faq.q}</span>
                    <span className="text-[#11d442] text-xl font-bold transition-transform group-open:rotate-45 ml-4 shrink-0">
                      +
                    </span>
                  </summary>
                  <p className="mt-4 text-gray-600 text-sm md:text-base font-light leading-relaxed border-t border-gray-100/80 pt-4">
                    {faq.a}
                  </p>
                </details>
              ))}
            </div>

            {/* Structured Data JSON-LD para Google Rich Results FAQPage */}
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
            />
          </div>
        </section>

        {/* Rules Section */}
        <section id="rules" className="py-24 bg-surface border-t border-gray-100">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto bg-white p-12 rounded-[32px] shadow-sm border border-gray-100">
              <div className="flex flex-col items-center justify-center mb-8">
                <Logo className="w-24 h-24 md:w-28 md:h-28 rounded-full object-cover border border-gray-200/50 shadow-md mb-4 hover:scale-105 transition-transform duration-300" logoUrl={heroSettings.logo_url} />
                <h2 className="text-3xl font-bold text-center text-gray-900">{heroSettings.rules_title || 'Reglas de Convivencia'}</h2>
              </div>
              <ul className="space-y-4 text-gray-600">
                {heroSettings.rules_list && heroSettings.rules_list.length > 0 ? (
                  heroSettings.rules_list.map((rule, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span className="text-[#11d442] mt-1">✓</span>
                      <span className="text-sm md:text-base">{rule}</span>
                    </li>
                  ))
                ) : (
                  <>
                    <li className="flex items-start gap-3">
                      <span className="text-[#11d442] mt-1">✓</span>
                      <span><strong>Check-in:</strong> 15:00 a 21:00 hrs. <strong>Check-out:</strong> hasta las 12:00 hrs.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#11d442] mt-1">✓</span>
                      <span><strong>Prohibido fumar:</strong> En cabañas y sector de piscina por seguridad forestal e higiene.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#11d442] mt-1">✓</span>
                      <span><strong>Mascotas:</strong> Está prohibido el ingreso de mascotas en todo el recinto.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#11d442] mt-1">✓</span>
                      <span><strong>Descanso y Música:</strong> No se permiten fiestas ni música con parlantes en áreas comunes o exteriores.</span>
                    </li>
                  </>
                )}
              </ul>

              {/* Botón hacia el documento oficial completo */}
              <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-xs text-gray-500 text-center sm:text-left">
                  Consulta las 14 normas generales y el reglamento de uso de piscina oficiales.
                </p>
                <Link 
                  href="/reglamento"
                  className="inline-flex items-center gap-2 text-xs font-bold text-gray-900 bg-gray-100 hover:bg-[#11d442] hover:text-white px-5 py-2.5 rounded-xl transition-all shadow-2xs"
                >
                  <span>Ver Reglamento Completo Oficial</span>
                  <span>→</span>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 border-t border-gray-800">
        <div className="container mx-auto px-4 text-center text-sm">
          <div className="flex flex-col items-center justify-center gap-6">
            <div className="flex items-center gap-3">
              <Logo className="w-14 h-14 rounded-full object-cover border border-zinc-800 shadow-sm hover:scale-105 transition-transform duration-300" logoUrl={heroSettings.logo_url} />
              <span className="text-2xl font-bold tracking-tight text-white">
                Rancho<span className="text-[#11d442]">Carmelitas</span>
              </span>
            </div>
            <div className="flex flex-wrap justify-center gap-6">
              <a href="#cabins" className="hover:text-white transition-colors">Cabañas</a>
              <a href="#faq" className="hover:text-white transition-colors">Preguntas Frecuentes</a>
              <Link href="/reglamento" className="hover:text-white transition-colors">Reglamento</Link>
              <Link href="/privacidad" className="hover:text-white transition-colors">Privacidad</Link>
              <a href="https://www.instagram.com/ranchocarmelitas/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Instagram</a>
              <a href="https://www.facebook.com/rancho.c.pullally?mibextid=ZbWKwL" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Facebook</a>
              <a href="https://maps.app.goo.gl/6W1fhgChaMWaQzbK8" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Google Maps</a>
            </div>
            <p>© {new Date().getFullYear()} Rancho Carmelitas. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
