// client/src/components/HeaderWrapper.tsx (Componente del cliente)
"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/Header";

export function HeaderWrapper() {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith("/dashboard");

  // Solo mostrar el header en rutas públicas
  if (isDashboard) {
    return null;
  }

  return <Header />;
}
