"use client";

import React, { useState, useEffect } from "react";

interface LogoProps {
  className?: string;
  alt?: string;
  logoUrl?: string; // Prop opcional desde base de datos
}

export function Logo({ 
  className = "w-10 h-10 rounded-full object-cover border border-gray-200/50 shadow-sm", 
  alt = "Logo Rancho Carmelitas",
  logoUrl
}: LogoProps) {
  const [hasError, setHasError] = useState(false);

  // Si la prop logoUrl cambia, reseteamos el estado de error para intentar cargar la nueva URL
  useEffect(() => {
    setHasError(false);
  }, [logoUrl]);

  if (hasError) {
    return null;
  }

  // Si viene logoUrl desde Supabase y no está vacía, la priorizamos. De lo contrario, cae al fallback local /logo.png
  const finalSrc = logoUrl && logoUrl.trim() !== "" ? logoUrl : "/logo.png";

  return (
    <img
      src={finalSrc}
      alt={alt}
      className={className}
      onError={() => setHasError(true)}
    />
  );
}

