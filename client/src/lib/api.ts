// client/src/lib/api.ts
import axios from "axios";
import { toast } from "sonner";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true, // Crucial para enviar la cookie de sesión
});

// Interceptor para manejo global de errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      if (
        error.response.status === 401 &&
        !window.location.pathname.startsWith("/dashboard")
      ) {
        // Fallo silencioso en rutas públicas
        return Promise.reject(error);
      }
      switch (error.response.status) {
        case 400:
          toast.error("Solicitud inválida. Verifica tus datos.");
          break;
        case 401:
          toast.error("Se requiere autenticación. Por favor inicia sesión.");
          break;
        case 403:
          toast.error("No tienes permisos para acceder a este recurso.");
          break;
        case 500:
          toast.error("Error en el servidor. Inténtalo más tarde.");
          break;
        default:
          toast.error(`Error: ${error.message}`);
      }
    } else {
      toast.error("Error de red. Verifica tu conexión.");
    }
    return Promise.reject(error);
  }
);

export const logout = async () => {
  const response = await api.get("/auth/logout");
  return response.data;
};
