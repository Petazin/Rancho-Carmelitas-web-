import React from "react";
import { CabinCard } from "@/components/ui/CabinCard";
import { supabase } from "@/lib/supabase";

export default async function Home() {
  
  // Extraemos las cabañas desde Supabase y las ordenamos por precio
  const { data: cabins, error } = await supabase
    .from('cabins')
    .select('*')
    .order('price_per_night', { ascending: true });

  if (error) {
    console.error("Error cargando cabañas desde Supabase:", error);
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header / Navbar */}
      <header className="sticky top-0 z-50 w-full glass-effect border-b border-gray-200/50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight text-gray-900">
              Rancho<span className="text-[#11d442]">Carmelitas</span>
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
            <a href="#cabins" className="hover:text-[#11d442] transition-colors">Cabañas</a>
            <a href="#gallery" className="hover:text-[#11d442] transition-colors">Galería</a>
            <a href="#rules" className="hover:text-[#11d442] transition-colors">Reglas</a>
            <a href="/admin" className="hover:text-[#11d442] transition-colors text-gray-400">Admin</a>
          </nav>
          <div className="flex items-center gap-4">
            <button className="btn-primary">
              Reservar Ahora
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative h-[80vh] min-h-[600px] flex items-center justify-center bg-gray-900 overflow-hidden">
          {/* Background image temporal */}
          <div 
            className="absolute inset-0 z-0 bg-cover bg-center"
            style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?q=80&w=2000&auto=format&fit=crop")' }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-black/80 to-black/30 z-10" />
          
          <div className="relative z-20 text-center px-4 max-w-4xl mx-auto mt-16 hover-lift">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight leading-tight">
              Escapa a la naturaleza, con total <span className="text-[#11d442]">comodidad</span>.
            </h1>
            <p className="text-lg md:text-xl text-gray-200 mb-10 max-w-2xl mx-auto font-light">
              Descubre nuestras exclusivas cabañas equipadas, rodeadas de bosque y tranquilidad. Tu escape de fin de semana perfecto en Rancho Carmelitas.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button className="btn-primary text-lg px-8 py-4 w-full sm:w-auto">
                Ver Disponibilidad
              </button>
              <button className="bg-white/10 text-white border border-white/20 hover:bg-white/20 transition-colors backdrop-blur-sm rounded-xl px-8 py-4 font-semibold w-full sm:w-auto">
                Ver Galería
              </button>
            </div>
          </div>
        </section>

        {/* Cabins Section with DB Data */}
        <section id="cabins" className="py-24 bg-surface">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">Nuestras Cabañas</h2>
              <p className="text-gray-500 max-w-2xl mx-auto text-lg">
                Espacios diseñados para tu confort. Elige la cabaña que mejor se adapte a tu escapada ideal.
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
                    imageUrl={cabin.image_url}
                    capacity={cabin.capacity}
                    bedrooms={Math.ceil(cabin.capacity / 2)}
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
      </main>
      
      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 border-t border-gray-800">
        <div className="container mx-auto px-4 text-center text-sm">
          <div className="flex flex-col items-center justify-center gap-4">
            <span className="text-2xl font-bold tracking-tight text-white">
              Rancho<span className="text-[#11d442]">Carmelitas</span>
            </span>
            <p>© {new Date().getFullYear()} Rancho Carmelitas. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
