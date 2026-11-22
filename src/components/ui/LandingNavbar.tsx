'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';

interface LandingNavbarProps {
  logoUrl?: string;
  hasTeam?: boolean;
}

export function LandingNavbar({ logoUrl, hasTeam = false }: LandingNavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <header className="fixed top-0 z-50 w-full glass-effect border-b border-gray-200/50">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        {/* Brand / Logo */}
        <Link href="/" onClick={closeMenu} className="flex items-center gap-3">
          <Logo className="w-10 h-10 rounded-full object-cover border border-gray-200/50 shadow-sm" logoUrl={logoUrl} />
          <span className="text-xl font-bold tracking-tight text-gray-900">
            Rancho<span className="text-[#11d442]">Carmelitas</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
          <a href="#cabins" className="hover:text-[#11d442] transition-colors">Cabañas</a>
          <Link href="/recinto-completo" className="text-[#11d442] font-semibold hover:text-[#0fb839] transition-colors flex items-center gap-1">
            <span>🎉 Recinto Completo</span>
          </Link>
          <a href="#gallery" className="hover:text-[#11d442] transition-colors">Galería</a>
          {hasTeam && (
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

        {/* Action Buttons & Mobile Toggle */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/reserva" className="hidden sm:inline-flex md:hidden text-xs font-bold text-gray-700 bg-gray-100 px-2.5 py-1.5 rounded-lg">
            Mi Reserva
          </Link>
          <a href="#cabins" onClick={closeMenu} className="btn-primary text-xs sm:text-sm px-3.5 py-2 sm:px-5 sm:py-2.5">
            Reservar Ahora
          </a>
          
          {/* Mobile Hamburger Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 transition-colors cursor-pointer"
            aria-label={mobileMenuOpen ? 'Cerrar menú principal' : 'Abrir menú principal'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-xl px-4 py-5 animate-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col space-y-3 text-sm font-semibold text-gray-700">
            <a 
              href="#cabins" 
              onClick={closeMenu}
              className="px-3 py-2 rounded-xl hover:bg-gray-100 flex items-center justify-between"
            >
              <span>🏡 Nuestras Cabañas</span>
              <span className="text-gray-400 text-xs">→</span>
            </a>
            <Link 
              href="/recinto-completo" 
              onClick={closeMenu}
              className="px-3 py-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-100 flex items-center justify-between font-bold"
            >
              <span>🎉 Arriendo Recinto Completo (8h)</span>
              <span className="text-emerald-600 text-xs font-bold">Nuevo</span>
            </Link>
            <a 
              href="#gallery" 
              onClick={closeMenu}
              className="px-3 py-2 rounded-xl hover:bg-gray-100 flex items-center justify-between"
            >
              <span>🖼️ Galería de Fotos</span>
              <span className="text-gray-400 text-xs">→</span>
            </a>
            {hasTeam && (
              <a 
                href="#team" 
                onClick={closeMenu}
                className="px-3 py-2 rounded-xl hover:bg-gray-100 flex items-center justify-between"
              >
                <span>👥 Nuestro Equipo</span>
                <span className="text-gray-400 text-xs">→</span>
              </a>
            )}
            <a 
              href="#location-social" 
              onClick={closeMenu}
              className="px-3 py-2 rounded-xl hover:bg-gray-100 flex items-center justify-between"
            >
              <span>📍 Ubicación y Contacto</span>
              <span className="text-gray-400 text-xs">→</span>
            </a>
            <a 
              href="#faq" 
              onClick={closeMenu}
              className="px-3 py-2 rounded-xl hover:bg-gray-100 flex items-center justify-between"
            >
              <span>❓ Preguntas Frecuentes</span>
              <span className="text-gray-400 text-xs">→</span>
            </a>
            <Link 
              href="/reglamento" 
              onClick={closeMenu}
              className="px-3 py-2 rounded-xl hover:bg-gray-100 flex items-center justify-between"
            >
              <span>📜 Reglamento Oficial</span>
              <span className="text-gray-400 text-xs">→</span>
            </Link>
            <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-3">
              <Link 
                href="/reserva" 
                onClick={closeMenu}
                className="flex-1 text-center py-2.5 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs"
              >
                🔍 Consultar Mi Reserva
              </Link>
              <a 
                href="/admin" 
                onClick={closeMenu}
                className="py-2.5 px-4 rounded-xl text-gray-400 hover:text-gray-600 text-xs font-semibold"
              >
                Admin
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
