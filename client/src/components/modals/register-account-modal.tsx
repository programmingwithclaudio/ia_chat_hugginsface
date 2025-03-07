"use client";
import { useRouter } from "next/navigation";
import { useModalStore } from "@/store/zustand";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Loader2 } from "lucide-react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

async function registerUser(
  email: string,
  password: string,
  displayName: string
): Promise<void> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/auth/register`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // Envía las cookies necesarias
      body: JSON.stringify({ email, password, displayName }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Error al registrar usuario");
  }

  window.location.href = "/dashboard/";
}

export function RegisterAccountModal() {
  const router = useRouter();
  const [isAgreed, setIsAgreed] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const modalKey = "registerAccountModal";
  const { isOpen, closeModal, openModal } = useModalStore();

  const registerMutation = useMutation({
    mutationFn: () => registerUser(email, password, displayName),
    onSuccess: () => {
      toast.success("Registro exitoso");
      closeModal(modalKey);
      router.replace("/dashboard/");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error desconocido al registrar usuario");
    },
  });

  const handleRegister = async () => {
    if (!email || !password || !displayName) {
      toast.error("Por favor, completa todos los campos");
      return;
    }

    if (!isAgreed) {
      toast.error("Debes aceptar los términos y condiciones");
      return;
    }

    registerMutation.mutate();
  };

  const handleLoginRedirect = () => {
    closeModal(modalKey);
    openModal("connectAccountModal");
  };

  return (
    <Dialog
      open={isOpen(modalKey)}
      onOpenChange={() => closeModal(modalKey)}
      key={modalKey}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crear una cuenta</DialogTitle>
          <DialogDescription>
            Completa tus datos para registrarte
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Label htmlFor="displayName">Nombre</Label>
          <Input
            id="displayName"
            type="text"
            placeholder="Tu nombre"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />

          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="correo@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Label htmlFor="password">Contraseña</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <div className="flex items-center gap-2 mt-4">
            <input
              type="checkbox"
              id="terms"
              checked={isAgreed}
              onChange={(e) => setIsAgreed(e.target.checked)}
            />
            <Label htmlFor="terms">Acepto los términos y condiciones</Label>
          </div>

          <Button
            onClick={handleRegister}
            disabled={registerMutation.isPending}
            className="w-full"
          >
            {registerMutation.isPending ? (
              <Loader2 className="animate-spin mr-2" />
            ) : null}
            Registrarse
          </Button>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <div className="text-sm text-gray-500">
            ¿Ya tienes una cuenta?{" "}
            <button
              className="text-blue-600 hover:underline"
              onClick={handleLoginRedirect}
            >
              Iniciar sesión
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
