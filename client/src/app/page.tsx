// client/src/app/page.tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-8">
      <h1 className="text-4xl font-bold mb-4">
        Bienvenido a nuestra aplicación
      </h1>
      <p className="text-lg text-center mb-8 max-w-2xl">
        Esta es la página principal pública. Para acceder al dashboard,
        necesitas iniciar sesión.
      </p>
      <div className="flex gap-4">
        <Button asChild>
          <Link href="/dashboard">Ir al Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
