import React from "react";
import { CabinCard } from "@/components/ui/CabinCard";
import { supabase } from "@/lib/supabase";
import { SocialSection } from "@/components/ui/SocialSection";
import { Logo } from "@/components/ui/Logo";

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
   * `landing_settings` con los textos del resto de la landing (Cabañas, Galería, SERNATUR y Reglas de Convivencia).
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
    sernatur_title: 'Servicio Turístico Registrado',
    sernatur_subtitle: 'Vigencia hasta Enero 2026 • Registro № 71034',
    sernatur_badge: 'Calidad y Confianza',
    rules_title: 'Reglas de Convivencia',
    rules_list: [
      'Check-in: 15:00 hrs. Check-out: 11:00 hrs.',
      'Prohibido fumar: Por seguridad forestal, no se permite fumar dentro de las cabañas.',
      'Mascotas: Aceptamos amigos peludos con previo aviso y bajo responsabilidad del dueño.',
      'Silencio nocturno: Respetamos la paz del bosque después de las 23:00 hrs.'
    ]
  };

  try {
    const { data: settingsData, error: settingsError } = await supabase
      .from('landing_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle();

    if (!settingsError && settingsData) {
      // Cruzamos los datos asegurándonos de rellenar con fallback si alguna columna está vacía
      heroSettings = {
        ...heroSettings,
        ...settingsData
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
    { src: '/gallery/hero.png', alt: 'Vista panorámica de la piscina y cabañas' },
    { src: '/gallery/interior.png', alt: 'Interior acogedor y cocina equipada' },
    { src: '/gallery/piscina_hd.png', alt: 'Piscina principal con áreas verdes' },
    { src: '/gallery/piscina.png', alt: 'Nuestros huéspedes disfrutando de la piscina' },
    { src: '/gallery/dormitorio.png', alt: 'Dormitorio matrimonial confortable' },
    { src: '/gallery/entorno_hd.png', alt: 'Terraza y zona de relajación exterior' },
  ];

  try {
    const { data: dbGallery, error: galleryError } = await supabase
      .from('landing_gallery')
      .select('*')
      .order('order_index', { ascending: true });

    if (!galleryError && dbGallery && dbGallery.length > 0) {
      galleryItems = dbGallery.map(item => ({
        src: item.image_url,
        alt: item.alt_text || 'Foto de momentos Rancho Carmelitas'
      }));
    }
  } catch (err) {
    console.warn("Advertencia cargando landing_gallery (usando fallback estático local):", err);
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header / Navbar */}
      <header className="sticky top-0 z-50 w-full glass-effect border-b border-gray-200/50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo className="w-10 h-10 rounded-full object-cover border border-gray-200/50 shadow-sm" logoUrl={heroSettings.logo_url} />
            <span className="text-xl font-bold tracking-tight text-gray-900">
              Rancho<span className="text-[#11d442]">Carmelitas</span>
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
            <a href="#cabins" className="hover:text-[#11d442] transition-colors">Cabañas</a>
            <a href="#gallery" className="hover:text-[#11d442] transition-colors">Galería</a>
            <a href="#location-social" className="hover:text-[#11d442] transition-colors">Ubicación</a>
            <a href="#rules" className="hover:text-[#11d442] transition-colors">Reglas</a>
            <a href="/admin" className="hover:text-[#11d442] transition-colors text-gray-400">Admin</a>
          </nav>
          <div className="flex items-center gap-4">
            <a href="#cabins" className="btn-primary">
              Reservar Ahora
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative min-h-[85vh] py-20 sm:py-24 md:py-28 flex items-center justify-center bg-gray-900">
          {/* Background image autogestionable */}
          <div 
            className="absolute inset-0 z-0 bg-cover bg-center"
            style={{ backgroundImage: `url("${heroSettings.hero_bg_url}")` }}
          />
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
                <div key={i} className="aspect-[4/3] bg-gray-100 rounded-2xl overflow-hidden hover:scale-[1.02] transition-transform duration-300 shadow-sm">
                  <img 
                    src={img.src} 
                    alt={img.alt} 
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

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
        <SocialSection />

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
                      <span><strong>Check-in:</strong> 15:00 hrs. <strong>Check-out:</strong> 11:00 hrs.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#11d442] mt-1">✓</span>
                      <span><strong>Prohibido fumar:</strong> Por seguridad forestal, no se permite fumar dentro de las cabañas.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#11d442] mt-1">✓</span>
                      <span><strong>Mascotas:</strong> Aceptamos amigos peludos con previo aviso y bajo responsabilidad del dueño.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#11d442] mt-1">✓</span>
                      <span><strong>Silencio nocturno:</strong> Respetamos la paz del bosque después de las 23:00 hrs.</span>
                    </li>
                  </>
                )}
              </ul>
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
            <div className="flex gap-6">
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
