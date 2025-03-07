// src/lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Función para combinar clases de Tailwind
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Función para formatear fechas agregar
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("es", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

// Función para generar IDs únicos
export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}
