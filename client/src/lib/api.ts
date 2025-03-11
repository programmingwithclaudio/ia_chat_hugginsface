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

// client/src/lib/api.ts

// Create an axios instance with default config

// Add a request interceptor
api.interceptors.request.use(
  (config) => {
    // You can modify request config here if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle common errors
    if (error.response) {
      // Handle unauthorized errors
      if (error.response.status === 401) {
        // Redirect to login page or show auth modal
        window.location.href = "/";
        toast.error("Session expired. Please login again.");
      }

      // Handle server errors
      else if (error.response.status >= 500) {
        toast.error("Server error. Please try again later.");
      }

      // Handle validation errors
      else if (error.response.status === 400 && error.response.data.errors) {
        const errorMessages = error.response.data.errors
          .map((err: any) => err.msg)
          .join(", ");
        toast.error(errorMessages || "Invalid input");
      }
    } else if (error.request) {
      // The request was made but no response was received
      toast.error("Network error. Please check your connection.");
    } else {
      // Something happened in setting up the request
      toast.error("An unexpected error occurred");
    }

    return Promise.reject(error);
  }
);

// Helper functions for common API operations
export const apiHelpers = {
  // Get all chats
  getAllChats: () => api.get("/chat"),

  // Get a single chat by ID
  getChat: (chatId: string) => api.get(`/chat/${chatId}`),

  // Create a new chat with initial message
  createChat: (content: string) => api.post("/chat", { content, role: "user" }),

  // Delete a chat
  deleteChat: (chatId: string) => api.delete(`/chat/${chatId}`),

  // Delete all chats
  deleteAllChats: () => api.delete("/chat"),

  // Send a message to a chat
  sendMessage: (chatId: string, content: string) =>
    api.post(`/chat/${chatId}/messages`, { content, role: "user" }),

  // Upload a document to a chat
  uploadDocument: (chatId: string, file: File, content: string = "") => {
    const formData = new FormData();
    formData.append("file", file);
    if (content) formData.append("content", content);
    formData.append("role", "user");

    return api.post(`/chat/${chatId}/upload`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
};
