// client/src/app/(public)/page.tsx
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Loader2 } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const { user, isLoading } = useCurrentUser();

  // Si está autenticado, redirigir automáticamente al chat
  useEffect(() => {
    if (!isLoading && user) {
      router.push("/dashboard/chats");
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Loader2 className="animate-spin h-10 w-10" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-8">
      <h1 className="text-4xl font-bold mb-4">Bienvenido a ChatGPT Clone</h1>
      <p className="text-lg text-center mb-8 max-w-2xl">
        Esta aplicación te permite chatear con una IA avanzada. Inicia sesión
        para comenzar.
      </p>
      <div className="flex gap-4">
        <Button asChild>
          <Link href="/dashboard/chats">Comenzar a chatear</Link>
        </Button>
      </div>
    </div>
  );
}
