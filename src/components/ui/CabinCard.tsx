import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface CabinCardProps {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  capacity: number;
  bedrooms: number;
}

export const CabinCard: React.FC<CabinCardProps> = ({
  id,
  name,
  description,
  price,
  imageUrl,
  capacity,
  bedrooms
}) => {
  return (
    <div className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover-lift premium-shadow flex flex-col h-full">
      <div className="relative h-64 w-full overflow-hidden bg-gray-100">
        <Image
          src={imageUrl}
          alt={`Imagen de la ${name}`}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-105 will-change-transform transform-gpu"
        />
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-sm font-semibold text-[#11d442] shadow-sm">
          ${price}/noche
        </div>
      </div>
      
      <div className="p-6 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#11d442] transition-colors">{name}</h3>
        </div>
        
        <p className="text-gray-500 text-sm mb-4 line-clamp-2">
          {description}
        </p>
        
        <div className="flex items-center gap-4 text-sm text-gray-600 mb-6 mt-auto">
          <div className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span>{capacity} huéspedes</span>
          </div>
          <div className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span>{bedrooms} habs.</span>
          </div>
        </div>
        
        <Link href={`/cabins/${id}`} className="w-full">
          <button className="w-full bg-gray-50 text-gray-900 font-medium py-3 rounded-xl border border-gray-200 hover:bg-[#11d442] hover:text-white hover:border-[#11d442] transition-all">
            Ver Detalles
          </button>
        </Link>
      </div>
    </div>
  );
};
