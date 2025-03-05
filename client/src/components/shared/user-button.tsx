// client/src/components/shared/user-button.tsx
"use client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useModalStore } from "@/store/zustand";
import { Button } from "../ui/button";
import { Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import Link from "next/link";
import { Icons } from "./icons";

export function UserButton() {
  const { user, isLoading, logoutUser } = useCurrentUser();
  const { openModal } = useModalStore();

  if (isLoading) {
    return <Loader2 className="mr-2 h-4 w-4 animate-spin" />;
  }

  if (!user) {
    return (
      <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
        <Button
          onClick={() => openModal("connectAccountModal")}
          variant="outline"
        >
          Iniciar sesión
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="rounded-full">
            <Avatar>
              <AvatarImage src={user.profilePicture || ""} />
              <AvatarFallback>{user.displayName.charAt(0)}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" forceMount>
          <DropdownMenuItem className="flex flex-col items-start">
            <div className="text-sm font-medium">{user.displayName}</div>
            <div className="text-sm text-muted-foreground">{user.email}</div>
            {user.authProvider === "google" && (
              <div className="text-xs text-blue-600">Google</div>
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/dashboard">
              <Icons.dashboard className="mr-2 h-4 w-4" />
              <span>Dashboard</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/dashboard/settings">
              <Icons.settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={logoutUser}>
            <Icons.logout className="mr-2 h-4 w-4" />
            <span>Logout</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
