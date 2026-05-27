import React from "react";

interface SocialSectionProps {
  facebookUrl?: string;
  instagramUrl?: string;
  mapsUrl?: string;
  address?: string;
  phone?: string;
  email?: string;
}

export function SocialSection({
  facebookUrl = "https://www.facebook.com/rancho.c.pullally?mibextid=ZbWKwL",
  instagramUrl = "https://www.instagram.com/ranchocarmelitas/",
  mapsUrl = "https://maps.app.goo.gl/6W1fhgChaMWaQzbK8",
  address = "Avenida Las Salinas № 104 D-4, Pullally, Papudo, Región de Valparaíso, Chile",
  phone = "+56 9 8401 2748",
  email = "contacto@ranchocarmelitas.cl"
}: SocialSectionProps) {
  return (
    <section id="location-social" className="py-24 bg-surface border-t border-gray-100 dark:bg-[#0c0c0c] dark:border-zinc-800">
      <div className="container mx-auto px-4">
        {/* Cabecera de la sección */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-[#11d442] font-semibold text-sm uppercase tracking-widest">
            Ubicación y Comunidad
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mt-3 text-gray-900 dark:text-white tracking-tight">
            Ven a Disfrutar y Conéctate
          </h2>
          <p className="text-gray-500 dark:text-zinc-400 mt-4 text-lg font-light leading-relaxed">
            Descubre el encanto campestre de Pullally, a pasos de las playas de Papudo. Sigue nuestro día a día y forma parte de nuestra comunidad de amantes de la naturaleza.
          </p>
        </div>

        {/* Grilla Asimétrica Premium */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
          {/* LADO IZQUIERDO: Google Maps Interactivo */}
          <div className="lg:col-span-7 flex flex-col">
            <div className="bg-white dark:bg-[#141414] rounded-[24px] overflow-hidden border border-gray-100 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col h-full">
              {/* Mapa Embebido sin clave API, estable y rápido */}
              <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] min-h-[300px] bg-zinc-100 dark:bg-zinc-900 overflow-hidden">
                <iframe
                  title="Ubicación de Rancho Carmelitas Cabañas"
                  src="https://maps.google.com/maps?q=Rancho%20Carmelitas%20Cabañas%20Pullally&t=&z=15&ie=UTF8&iwloc=&output=embed"
                  className="absolute inset-0 w-full h-full border-0 grayscale dark:invert-[0.9] dark:hue-rotate-[180deg] opacity-90"
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>

              {/* Detalles de Ubicación e Información útil */}
              <div className="p-8 flex-1 flex flex-col justify-between">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <svg className="w-5 h-5 text-[#11d442]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.792 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                      </svg>
                      Nuestra Dirección
                    </h3>
                    <p className="text-gray-600 dark:text-zinc-400 mt-2 text-base font-normal leading-relaxed">
                      {address}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="flex items-center gap-3 text-gray-600 dark:text-zinc-400">
                      <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-zinc-800 flex items-center justify-center text-[#11d442] border border-gray-100 dark:border-zinc-700">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-2.824-1.802-5.127-4.1-6.93-6.93l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 dark:text-zinc-500 uppercase tracking-wider font-semibold">Llámanos</p>
                        <a href={`tel:${phone}`} className="text-sm font-semibold hover:text-[#11d442] transition-colors">{phone}</a>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-gray-600 dark:text-zinc-400">
                      <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-zinc-800 flex items-center justify-center text-[#11d442] border border-gray-100 dark:border-zinc-700">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 dark:text-zinc-500 uppercase tracking-wider font-semibold">Escríbenos</p>
                        <a href={`mailto:${email}`} className="text-sm font-semibold hover:text-[#11d442] transition-colors break-all">{email}</a>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <p className="text-xs text-gray-400 dark:text-zinc-500">
                    * Pullally está ubicado en la Región de Valparaíso, a sólo 2 horas de Santiago.
                  </p>
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary flex items-center justify-center gap-2 py-3 px-6 text-sm font-semibold text-center whitespace-nowrap hover:scale-[1.02] transition-transform"
                    id="maps-cta-button"
                  >
                    Cómo Llegar con Google Maps
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* LADO DERECHO: Tarjetas de Conexión en Redes */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {/* TARJETA 1: Instagram */}
            <div className="bg-white dark:bg-[#141414] rounded-[24px] border border-gray-100 dark:border-zinc-800 shadow-sm p-6 hover-lift relative overflow-hidden flex flex-col justify-between flex-1">
              {/* Línea de color superior estilo degradado Instagram */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 via-pink-500 to-yellow-500" />
              
              <div>
                <div className="flex items-center justify-between mb-6 mt-1">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 flex items-center justify-center text-white">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                        <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white text-base">Instagram</h4>
                      <p className="text-xs text-[#11d442] font-semibold flex items-center gap-1">
                        @ranchocarmelitas
                        <span className="w-1.5 h-1.5 rounded-full bg-[#11d442] inline-block animate-pulse" />
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 bg-pink-50 dark:bg-pink-950/30 text-pink-600 dark:text-pink-400 rounded-full border border-pink-100/50 dark:border-pink-900/30">
                    Comunidad
                  </span>
                </div>

                <p className="text-sm text-gray-600 dark:text-zinc-400 mb-6 font-light leading-relaxed">
                  Únete a nosotros en Instagram. Compartimos atardeceres increíbles, momentos en la piscina, la flora y fauna local y actualizaciones en tiempo real de nuestras cabañas.
                </p>

                {/* Previsualización Simulada del Feed (Imágenes Reales del Proyecto) */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {[
                    { src: "/gallery/piscina.png", alt: "Piscina campestre" },
                    { src: "/gallery/interior.png", alt: "Cabaña acogedora" },
                    { src: "/gallery/dormitorio.png", alt: "Habitación descanso" }
                  ].map((photo, i) => (
                    <div 
                      key={i} 
                      className="aspect-square rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-950 border border-gray-100 dark:border-zinc-800 hover:scale-[1.05] transition-transform duration-300 group relative cursor-pointer"
                    >
                      <img 
                        src={photo.src} 
                        alt={photo.alt} 
                        className="w-full h-full object-cover" 
                      />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        </svg>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow-md"
                id="instagram-follow-button"
              >
                Seguir en Instagram
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
              </a>
            </div>

            {/* TARJETA 2: Facebook */}
            <div className="bg-white dark:bg-[#141414] rounded-[24px] border border-gray-100 dark:border-zinc-800 shadow-sm p-6 hover-lift relative overflow-hidden flex flex-col justify-between flex-1">
              {/* Línea de color superior estilo Facebook */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-700 to-blue-500" />
              
              <div>
                <div className="flex items-center justify-between mb-6 mt-1">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white">
                      <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white text-base">Facebook</h4>
                      <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold">
                        rancho.c.pullally
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-full border border-blue-100/50 dark:border-blue-900/30">
                    Comunidad
                  </span>
                </div>

                <p className="text-sm text-gray-600 dark:text-zinc-400 mb-6 font-light leading-relaxed">
                  Participa en nuestro grupo y página de Facebook. Entérate de testimonios de huéspedes reales, galerías de fotos históricas, promociones de temporada baja y conversa directamente con nosotros.
                </p>

                {/* Previsualización Simulada de la Comunidad */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {[
                    { src: "/gallery/entorno_hd.png", alt: "Entorno natural" },
                    { src: "/gallery/piscina_hd.png", alt: "Piscina sol" },
                    { src: "/gallery/hero.png", alt: "Vista panorámica" }
                  ].map((photo, i) => (
                    <div 
                      key={i} 
                      className="aspect-square rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-950 border border-gray-100 dark:border-zinc-800 hover:scale-[1.05] transition-transform duration-300 group relative cursor-pointer"
                    >
                      <img 
                        src={photo.src} 
                        alt={photo.alt} 
                        className="w-full h-full object-cover" 
                      />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                        </svg>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <a
                href={facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#1877f2] hover:bg-[#166fe5] text-white rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow-md"
                id="facebook-visit-button"
              >
                Visitar en Facebook
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
