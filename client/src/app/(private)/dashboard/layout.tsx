// client/src/app/(private)/dashboard/layout.tsx
"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/Sidebar";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Loader2 } from "lucide-react";
import { ModeToggle } from "@/components/shared/theme-toggle";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useCurrentUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/");
    }

    if (user && !isLoading && pathname === "/dashboard") {
      router.push("/dashboard/chats");
    }
  }, [pathname, router, user, isLoading]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin h-10 w-10" />
      </div>
    );
  }

  if (!user) return null;
  // Mapeo de rutas a títulos
  const titles: Record<string, string> = {
    "/dashboard/home": "Home",
    "/dashboard/chats": "Chats",
    "/dashboard/profile": "Profile",
  };

  const pageTitle = titles[pathname] || "OakChat AI";

  // In DashboardLayout component
  return (
    <div className="h-screen w-full overflow-hidden">
      <SidebarProvider>
        {/* Replace the fixed grid with a more dynamic layout */}
        <div className="flex h-full w-full">
          <AppSidebar className="h-full" /> {/* Remove the fixed w-64 */}
          <main className="flex flex-col flex-1 min-w-0">
            <div className="p-2 flex items-center justify-between border-b h-15 bg-background">
              <div className="flex items-center">
                <SidebarTrigger className="mr-4" />
                <h1 className="text-xl font-semibold">{pageTitle}</h1>
              </div>
              <ModeToggle /> {/* Colocado a la derecha */}
            </div>
            <div className="flex-1 overflow-auto p-5 bg-background">
              {children}
            </div>
          </main>
        </div>
      </SidebarProvider>
    </div>
  );
}
