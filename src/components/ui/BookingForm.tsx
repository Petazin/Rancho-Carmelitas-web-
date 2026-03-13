'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

interface BookingFormProps {
  cabin: any;
  cabinId: string;
}

export function BookingForm({ cabin, cabinId }: BookingFormProps) {
  // Obtenemos la fecha de hoy en formato YYYY-MM-DD para el input date
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const [checkIn, setCheckIn] = useState(today);
  const [checkOut, setCheckOut] = useState(tomorrow);
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);

  // Calculamos noches y precio total estimado
  const inDate = new Date(checkIn);
  const outDate = new Date(checkOut);
  const nights = Math.max(1, Math.ceil((outDate.getTime() - inDate.getTime()) / (1000 * 60 * 60 * 24)));
  const totalEstimado = nights * cabin.price;

  // Construimos la URL con los parámetros
  const checkoutUrl = `/checkout/${cabinId}?checkIn=${checkIn}&checkOut=${checkOut}&adults=${adults}&children=${children}`;

  return (
    <div className="sticky top-24 bg-white rounded-3xl premium-shadow p-8 border border-gray-100">
      <div className="flex items-end gap-2 mb-6">
        <span className="text-3xl font-bold text-gray-900">${cabin.price}</span>
        <span className="text-gray-500 mb-1">/ noche</span>
      </div>

      <div className="border border-gray-200 rounded-2xl mb-6 overflow-hidden bg-white shadow-sm ring-1 ring-gray-900/5">
        <div className="grid grid-cols-2 border-b border-gray-200">
          <label className="p-3 border-r border-gray-200 hover:bg-gray-50 focus-within:bg-gray-50 transition-colors cursor-pointer group block">
            <span className="block font-bold text-gray-900 uppercase text-[10px] tracking-wider mb-1">Llegada</span>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-[#11d442] group-hover:scale-110 transition-transform flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <input 
                type="date" 
                min={today}
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="w-full text-sm font-semibold outline-none text-gray-900 bg-transparent cursor-pointer" 
              />
            </div>
          </label>
          <label className="p-3 hover:bg-gray-50 focus-within:bg-gray-50 transition-colors cursor-pointer group block">
            <span className="block font-bold text-gray-900 uppercase text-[10px] tracking-wider mb-1">Salida</span>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-[#11d442] group-hover:scale-110 transition-transform flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <input 
                type="date" 
                min={checkIn}
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className="w-full text-sm font-semibold outline-none text-gray-900 bg-transparent cursor-pointer" 
              />
            </div>
          </label>
        </div>
        <div className="grid grid-cols-2">
          <label className="p-3 border-r border-gray-200 block hover:bg-gray-50 focus-within:bg-gray-50 transition-colors cursor-pointer group">
            <span className="block font-bold text-gray-900 uppercase text-[10px] tracking-wider mb-1">Adultos</span>
            <div className="flex items-center gap-2 relative">
              <svg className="w-5 h-5 text-[#11d442] group-hover:scale-110 transition-transform flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <select 
                value={adults}
                onChange={(e) => setAdults(Number(e.target.value))}
                className="w-full text-sm font-semibold outline-none text-gray-900 bg-transparent cursor-pointer appearance-none pr-8"
              >
                {[...Array(cabin.capacity)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>{i + 1}</option>
                ))}
              </select>
              <div className="absolute right-0 pointer-events-none flex items-center h-full">
                <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </label>
          <label className="p-3 block hover:bg-gray-50 focus-within:bg-gray-50 transition-colors cursor-pointer group">
            <span className="block font-bold text-gray-900 uppercase text-[10px] tracking-wider mb-1">Niños</span>
            <div className="flex items-center gap-2 relative">
              <svg className="w-5 h-5 text-[#11d442] group-hover:scale-110 transition-transform flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <select 
                value={children}
                onChange={(e) => setChildren(Number(e.target.value))}
                className="w-full text-sm font-semibold outline-none text-gray-900 bg-transparent cursor-pointer appearance-none pr-8"
              >
                <option value={0}>0</option>
                {[...Array(cabin.capacity)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>{i + 1}</option>
                ))}
              </select>
              <div className="absolute right-0 pointer-events-none flex items-center h-full">
                <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </label>
        </div>
      </div>

      <div className="mb-6 space-y-2 text-sm text-gray-600">
        <div className="flex justify-between">
          <span>${cabin.price} x {nights} noche{nights > 1 ? 's' : ''}</span>
          <span>${totalEstimado}</span>
        </div>
        <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-100">
          <span>Total</span>
          <span>${totalEstimado}</span>
        </div>
      </div>

      <Link href={checkoutUrl} className="block w-full">
        <Button size="lg" fullWidth>
          Confirmar y Reservar
        </Button>
      </Link>
      <p className="text-center text-sm text-gray-400 mt-4">
        No se hará ningún cargo aún
      </p>
    </div>
  );
}
