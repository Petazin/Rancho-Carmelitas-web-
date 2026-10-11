import React from "react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Página no encontrada (404) • Rancho Carmelitas",
  description: "La página que buscas no existe o ha sido movida. Explora nuestras cabañas en Pullally, Papudo.",
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0e1015] text-white flex flex-col justify-between selection:bg-[#11d442] selection:text-black font-sans">
      {/* Header simple */}
      <header className="border-b border-white/10 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-tight">
            Rancho<span className="text-[#11d442]">Carmelitas</span>
          </Link>
          <Link
            href="/"
            className="text-xs uppercase tracking-widest text-zinc-400 hover:text-white transition-colors"
          >
            ← Volver al Inicio
          </Link>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-xl w-full text-center">
          <span className="inline-block text-xs font-mono font-bold tracking-widest text-[#11d442] bg-[#11d442]/10 border border-[#11d442]/20 px-3 py-1 rounded-full uppercase mb-4">
            Error 404
          </span>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-4">
            Página no encontrada
          </h1>
          <p className="text-zinc-400 text-base sm:text-lg mb-8 leading-relaxed">
            Parece que la página que buscas tomó un sendero equivocado o ya no está disponible. No te preocupes, puedes volver a nuestras secciones principales:
          </p>

          {/* Enlaces de rescate rápidos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10 text-left">
            <Link
              href="/"
              className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all hover:scale-[1.02] flex items-center justify-between group"
            >
              <div>
                <p className="text-sm font-bold text-white group-hover:text-[#11d442] transition-colors">
                  Página Principal
                </p>
                <p className="text-xs text-zinc-400">Volver a la portada de Rancho Carmelitas</p>
              </div>
              <span className="text-zinc-500 group-hover:text-[#11d442] transition-colors">→</span>
            </Link>

            <Link
              href="/#cabins"
              className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all hover:scale-[1.02] flex items-center justify-between group"
            >
              <div>
                <p className="text-sm font-bold text-white group-hover:text-[#11d442] transition-colors">
                  Nuestras Cabañas
                </p>
                <p className="text-xs text-zinc-400">Ver disponibilidad y equipamiento</p>
              </div>
              <span className="text-zinc-500 group-hover:text-[#11d442] transition-colors">→</span>
            </Link>

            <Link
              href="/reserva"
              className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all hover:scale-[1.02] flex items-center justify-between group"
            >
              <div>
                <p className="text-sm font-bold text-white group-hover:text-[#11d442] transition-colors">
                  Consultar Mi Reserva
                </p>
                <p className="text-xs text-zinc-400">Revisar estado con código de confirmación</p>
              </div>
              <span className="text-zinc-500 group-hover:text-[#11d442] transition-colors">→</span>
            </Link>

            <Link
              href="/reglamento"
              className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all hover:scale-[1.02] flex items-center justify-between group"
            >
              <div>
                <p className="text-sm font-bold text-white group-hover:text-[#11d442] transition-colors">
                  Reglamento Oficial
                </p>
                <p className="text-xs text-zinc-400">Normas y convivencia en el recinto</p>
              </div>
              <span className="text-zinc-500 group-hover:text-[#11d442] transition-colors">→</span>
            </Link>
          </div>

          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 bg-[#11d442] hover:bg-[#0eb839] text-black font-bold text-sm px-6 py-3.5 rounded-xl transition-all shadow-lg hover:shadow-[#11d442]/20"
          >
            ← Regresar al Inicio
          </Link>
        </div>
      </main>

      {/* Footer minimalista */}
      <footer className="border-t border-white/10 px-6 py-4 text-center text-xs text-zinc-500">
        © {new Date().getFullYear()} Rancho Carmelitas • Pullally, Papudo, Región de Valparaíso
      </footer>
    </div>
  );
}
