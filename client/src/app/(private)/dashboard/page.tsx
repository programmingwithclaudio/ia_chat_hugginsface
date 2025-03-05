// src/app/(private)/dashboard/page.tsx
"use client";

// import { UploadModal } from "@/components/modals/upload-modal";
//import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/use-current-user";
//import UserContracts from "@/components/dashboard/user-contracts";
import { Loader2 } from "lucide-react";

const Dashboard = () => {
  const { user, isLoading } = useCurrentUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/"); // Redirecciona a la página principal o de login
    }
  }, [isLoading, user, router]);

  // Agrega esto para evitar flickering
  // if (typeof window !== "undefined" && !isLoading && !user) {
  //   return null;
  // }

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin h-10 w-10" />
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Bienvenido, {user.displayName}</h1>
      <p className="mt-2">Tu email: {user.email}</p>
      <p className="mt-2">Método de autenticación: {user.authProvider}</p>
      {/* Aquí puedes incluir más información o funcionalidades específicas */}
    </div>
  );
};

export default Dashboard;
