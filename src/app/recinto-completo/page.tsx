import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { Logo } from '@/components/ui/Logo';
import { VenueQuoteForm } from '@/components/ui/VenueQuoteForm';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Arriendo de Recinto Completo (8 Horas) • Paseos y Eventos en Rancho Carmelitas',
  description: 'Arrienda el recinto exclusivo de Rancho Carmelitas en Pullally, Papudo para tu paseo de curso, club de adulto mayor o evento familiar. Piscina, quincho cerrado equipado, juegos y áreas verdes por 8 horas continuas.',
  alternates: {
    canonical: '/recinto-completo',
  },
  openGraph: {
    title: 'Arriendo de Recinto Completo por el Día • Rancho Carmelitas',
    description: 'Paseos de curso, adulto mayor y eventos familiares con uso exclusivo del recinto por 8 horas. Quincho equipado, piscina y áreas verdes.',
    url: 'https://ranchocarmelitas.com/recinto-completo',
    images: [
      {
        url: '/gallery/piscina_principal.jpg',
        width: 1200,
        height: 630,
        alt: 'Piscina y áreas verdes en Rancho Carmelitas',
      },
    ],
  },
};

export default async function RecintoCompletoPage() {
  const amenities = [
    {
      icon: '🏊‍♂️',
      title: 'Piscina Principal y Prados',
      description: 'Acceso y disfrute exclusivo de nuestra piscina familiar rodeada de amplias áreas verdes y sombra natural.'
    },
    {
      icon: '🥩',
      title: 'Quincho Cerrado y Equipado',
      description: 'Parrilla para asados, fogón de 2 platos, horno industrial, 2 refrigeradores, congeladora independiente y lavaplatos.'
    },
    {
      icon: '🪑',
      title: 'Mobiliario para 70 Personas',
      description: 'Pérgola techada con mesas y sillas preparadas para recibir con holgura a todo tu grupo en comedores exteriores.'
    },
    {
      icon: '🏓',
      title: 'Juegos y Recreación',
      description: 'Mesa de Ping-Pong profesional, Taca-Taca y mesa de Air Hockey para entretenimiento de todas las edades.'
    },
    {
      icon: '🚗',
      title: 'Estacionamiento Privado',
      description: 'Capacidad interior cerrada y segura para hasta 8 vehículos dentro del propio predio.'
    },
    {
      icon: '⏰',
      title: '8 Horas Continuas',
      description: 'Jornada diurna completa a tu medida (ingreso sugerido entre 09:00 y 12:00 hrs) con límite de salida hasta las 20:00 hrs.'
    }
  ];

  // Galería dinámica desde Supabase con fallback defensivo a imágenes oficiales
  let galleryImages = [
    { src: '/gallery/piscina_principal.jpg', title: 'Piscina y Áreas Verdes' },
    { src: '/gallery/areas_verdes.jpg', title: 'Pérgolas y Jardines' },
    { src: '/gallery/entorno_hd.png', title: 'Entorno Campestre Natural' },
    { src: '/gallery/piscina.png', title: 'Diversión Grupal y Familiar' }
  ];

  // Parámetros y tramos dinámicos desde settings para SSR inmediato
  let venueTiers: any[] = [];
  let venueBouncyCastleFee = 5000;
  let venueDepositPercentage = 50;
  let venueMaxCapacity = 70;
  let venueWhatsapp = '56994168853';

  try {
    const { data: dbSettings } = await supabase
      .from('settings')
      .select('key, value')
      .in('key', [
        'venue_pricing_tiers',
        'venue_bouncy_castle_fee',
        'venue_deposit_percentage',
        'venue_max_capacity',
        'whatsapp_number'
      ]);

    if (dbSettings) {
      const map: Record<string, string> = {};
      dbSettings.forEach((item: { key: string; value: string }) => {
        map[item.key] = item.value;
      });

      if (map['venue_pricing_tiers']) {
        try {
          const parsed = JSON.parse(map['venue_pricing_tiers']);
          if (Array.isArray(parsed) && parsed.length > 0) {
            venueTiers = parsed;
          }
        } catch (e) {
          console.warn('Error al parsear venue_pricing_tiers:', e);
        }
      }

      if (map['venue_bouncy_castle_fee']) {
        const val = Number(map['venue_bouncy_castle_fee']);
        if (!isNaN(val) && val >= 0) venueBouncyCastleFee = val;
      }

      if (map['venue_deposit_percentage']) {
        const val = Number(map['venue_deposit_percentage']);
        if (!isNaN(val) && val >= 10 && val <= 100) venueDepositPercentage = val;
      }

      if (map['venue_max_capacity']) {
        const val = Number(map['venue_max_capacity']);
        if (!isNaN(val) && val >= 10) venueMaxCapacity = val;
      }

      if (map['whatsapp_number']) {
        const clean = map['whatsapp_number'].replace(/[^0-9]/g, '');
        if (clean) venueWhatsapp = clean;
      }
    }

    const { data: dbGallery } = await supabase
      .from('landing_gallery')
      .select('image_url, alt_text')
      .eq('category', 'recinto')
      .order('order_index', { ascending: true });

    if (dbGallery && dbGallery.length > 0) {
      galleryImages = dbGallery.map((item) => ({
        src: item.image_url,
        title: item.alt_text || 'Instalaciones de Rancho Carmelitas'
      }));
    }
  } catch (err) {
    console.warn('Advertencia cargando datos de recinto desde BD, aplicando fallback:', err);
  }

  const heroImageSrc = galleryImages.length > 0 ? galleryImages[0].src : '/gallery/piscina_principal.jpg';

  return (
    <div className="min-h-screen flex flex-col bg-surface font-sans">
      {/* Header flotante */}
      <header className="sticky top-0 z-50 w-full glass-effect border-b border-gray-200/50">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Logo className="w-10 h-10 rounded-full object-cover border border-gray-200/50 shadow-sm" />
            <span className="text-xl font-bold tracking-tight text-gray-900">
              Rancho<span className="text-[#11d442]">Carmelitas</span>
            </span>
          </Link>
          <nav className="flex items-center gap-4 text-sm font-medium text-gray-600">
            <Link href="/" className="hover:text-[#11d442] transition-colors hidden sm:block">
              ← Volver a Cabañas
            </Link>
            <Link href="/reglamento" className="hover:text-[#11d442] transition-colors hidden md:block">
              Reglamento
            </Link>
            <a
              href="#cotizador"
              className="btn-primary text-xs sm:text-sm px-4 py-2 sm:px-6 sm:py-2.5"
            >
              Cotizar Ahora
            </a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 md:py-28 bg-gray-900 text-white overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-40">
          <Image
            src={heroImageSrc}
            alt="Rancho Carmelitas recinto completo"
            fill
            priority
            className="object-cover object-center"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-900/80 to-transparent z-10" />

        <div className="relative z-20 container mx-auto px-4 text-center max-w-4xl">
          <span className="text-xs font-bold uppercase tracking-widest text-[#11d442] bg-[#11d442]/10 border border-[#11d442]/30 px-4 py-1.5 rounded-full inline-block mb-6">
            ✨ Nueva Modalidad de Arriendo Exclusivo
          </span>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
            El Rancho Completo para tu <span className="text-[#11d442]">Paseo o Celebración</span>
          </h1>

          <p className="text-lg md:text-xl text-gray-200 font-light max-w-2xl mx-auto mb-8">
            Disfruta de 8 horas seguidas de exclusividad total. Sin terceros ni huéspedes ajenos en el recinto. La piscina, quincho cerrado equipado, juegos y áreas verdes 100% reservados para tu grupo.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs sm:text-sm text-gray-300">
            <span className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-3.5 py-1.5 rounded-full">
              👥 Ideal para Paseos de Curso y Adulto Mayor
            </span>
            <span className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-3.5 py-1.5 rounded-full">
              ⏰ 8 Horas Continuas (hasta las 20:00 hrs)
            </span>
            <span className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-3.5 py-1.5 rounded-full">
              👶 Menores de 3 años entran Gratis
            </span>
          </div>
        </div>
      </section>

      {/* Amenidades e Instalaciones Incluidas */}
      <section className="py-20 bg-white border-b border-gray-100">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-[#11d442] bg-[#11d442]/10 px-3 py-1 rounded-full">
              Todo Incluido
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mt-3">
              ¿Qué incluye el Arriendo de Recinto?
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto mt-2">
              Todas las instalaciones comunes quedan reservadas a puerta cerrada para tu delegación.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {amenities.map((item, idx) => (
              <div
                key={idx}
                className="bg-gray-50 rounded-2xl p-6 border border-gray-200/70 hover:border-[#11d442]/40 transition-all hover:shadow-md"
              >
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>

          {/* Caja destacada del Quincho Equipado */}
          <div className="mt-12 bg-amber-50/60 border border-amber-200 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-6">
            <div className="text-5xl">🍳</div>
            <div className="flex-1">
              <h4 className="text-xl font-bold text-gray-900 mb-1">
                Equipamiento Gastronómico del Quincho
              </h4>
              <p className="text-sm text-gray-700 leading-relaxed">
                El quincho cuenta con <strong>parrilla</strong>, <strong>fogón de 2 platos</strong>, <strong>horno industrial</strong> <em>(no incluye el cilindro de gas)</em>, <strong>2 refrigeradores</strong>, <strong>1 congeladora</strong> y <strong>lavaplatos</strong> con mesón de servicio. Disponemos de mobiliario para hasta 70 personas sentadas.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Servicios Opcionales y Políticas */}
      <section className="py-16 bg-surface border-b border-gray-100">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <span className="text-2xl mb-2 block">🎪</span>
              <h4 className="font-bold text-gray-900 text-base mb-2">
                Juegos Inflables y Servicios Externos
              </h4>
              <p className="text-xs text-gray-600 mb-3 leading-relaxed">
                Puedes traer juegos inflables pagando un recargo de <strong>$5.000 CLP</strong> por el uso extra de energía eléctrica de turbinas. También se permite el ingreso de carritos de snacks, animación infantil o decoración.
              </p>
              <span className="text-[11px] font-semibold text-[#11d442] bg-[#11d442]/10 px-2.5 py-1 rounded-md">
                Recargo Inflable: $5.000
              </span>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <span className="text-2xl mb-2 block">🛡️</span>
              <h4 className="font-bold text-gray-900 text-base mb-2">
                Política de Cancelación y Abonos
              </h4>
              <p className="text-xs text-gray-600 mb-3 leading-relaxed">
                Para reservar se abona el <strong>50% inicial</strong>; el 50% restante se paga al ingresar al recinto. Puedes cancelar con <strong>devolución total hasta 5 días antes</strong> del evento. También ofrecemos opción de reagendar según disponibilidad.
              </p>
              <span className="text-[11px] font-semibold text-gray-700 bg-gray-100 px-2.5 py-1 rounded-md">
                Garantía y Reagendamiento
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Galería de Momentos en Áreas Comunes */}
      <section className="py-20 bg-white border-b border-gray-100">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900">
              Instalaciones Reales
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Pullally, Papudo • Entorno campestre seguro a sólo 10 minutos de la playa
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {galleryImages.map((img, idx) => (
              <div
                key={idx}
                className="group relative aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100 shadow-sm hover:scale-[1.02] transition-transform"
              >
                <Image
                  src={img.src}
                  alt={img.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 25vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-4">
                  <span className="text-white text-xs font-bold drop-shadow-md">
                    {img.title}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sección del Cotizador Interactivo */}
      <section id="cotizador" className="py-24 bg-surface">
        <div className="container mx-auto px-4">
          <VenueQuoteForm
            initialTiers={venueTiers}
            initialBouncyCastleFee={venueBouncyCastleFee}
            initialDepositPercentage={venueDepositPercentage}
            initialMaxCapacity={venueMaxCapacity}
            initialWhatsapp={venueWhatsapp}
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-gray-900 text-gray-400 text-xs text-center border-t border-gray-800">
        <div className="container mx-auto px-4 space-y-2">
          <p>© {new Date().getFullYear()} Rancho Carmelitas. Todos los derechos reservados. Pullally, Papudo, Chile.</p>
          <div className="flex items-center justify-center gap-4 text-gray-400">
            <Link href="/" className="hover:text-white transition-colors">Cabañas</Link>
            <span>•</span>
            <Link href="/reglamento" className="hover:text-white transition-colors">Reglamento</Link>
            <span>•</span>
            <Link href="/reserva" className="hover:text-white transition-colors">Mi Reserva</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
