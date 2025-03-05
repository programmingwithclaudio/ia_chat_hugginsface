// client/src/hooks/use-current-user.ts
import { api, logout } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import axios from "axios";

export interface User {
  id: string;
  displayName: string;
  email: string;
  profilePicture?: string;
  authProvider: "google" | "manual";
}

export const useCurrentUser = () => {
  const router = useRouter();

  const {
    isLoading,
    data: user,
    refetch,
  } = useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      try {
        const response = await api.get("/auth/current-user");
        return response.data as User;
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          return null;
        }
        console.error("Error inesperado de autenticación:", error);
        return null;
      }
    },
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  const logoutUser = async () => {
    try {
      await logout();
      await refetch();
      router.push("/");
    } catch (error) {
      console.error("Error al hacer logout:", error);
    }
  };

  return {
    isLoading,
    user,
    refetch,
    logoutUser,
    isAuthenticated: !!user,
  };
};
