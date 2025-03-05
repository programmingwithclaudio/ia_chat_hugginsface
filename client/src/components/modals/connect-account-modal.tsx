// client/src/components/modals/connect-account-modal.tsx
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
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Loader2 } from "lucide-react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

async function googleSignIn(): Promise<void> {
  // Redirige al flujo de autenticación de Google
  window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`;
}

async function loginUser(email: string, password: string): Promise<void> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // Envía las cookies necesarias
      body: JSON.stringify({ email, password }),
    }
  );
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Error al iniciar sesión");
  }
  window.location.href = "/dashboard";
}

export function ConnectAccountModal() {
  const router = useRouter();
  const [isAgreed, setIsAgreed] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const modalKey = "connectAccountModal";
  const { isOpen, closeModal } = useModalStore();

  const googleMutation = useMutation({ mutationFn: googleSignIn });
  const loginMutation = useMutation({
    mutationFn: () => loginUser(email, password),
    onSuccess: () => {
      toast.success("Inicio de sesión exitoso");
      closeModal(modalKey);
      router.replace("/dashboard");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error desconocido al iniciar sesión");
    },
  });

  const handleGoogleSignIn = async () => {
    if (isAgreed) {
      googleMutation.mutate();
    } else {
      toast.error("Debes aceptar los términos y condiciones");
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      toast.error("Por favor, ingresa tu correo y contraseña");
      return;
    }
    loginMutation.mutate();
  };

  return (
    <Dialog
      open={isOpen(modalKey)}
      onOpenChange={() => closeModal(modalKey)}
      key={modalKey}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Iniciar Sesión</DialogTitle>
          <DialogDescription>
            Selecciona tu método de autenticación
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Label>Email</Label>
          <Input
            type="email"
            placeholder="correo@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Label>Contraseña</Label>
          <Input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Button onClick={handleLogin} disabled={loginMutation.isPending}>
            {loginMutation.isPending ? (
              <Loader2 className="animate-spin" />
            ) : (
              "Iniciar sesión"
            )}
          </Button>
        </div>

        <Button
          onClick={handleGoogleSignIn}
          disabled={googleMutation.isPending}
          className="mt-4"
        >
          {googleMutation.isPending ? (
            <Loader2 className="animate-spin" />
          ) : (
            "Iniciar con Google"
          )}
        </Button>

        <div className="flex items-center gap-2 mt-2">
          <input
            type="checkbox"
            checked={isAgreed}
            onChange={(e) => setIsAgreed(e.target.checked)}
          />
          <Label>Acepto los términos y condiciones</Label>
        </div>
      </DialogContent>
    </Dialog>
  );
}
