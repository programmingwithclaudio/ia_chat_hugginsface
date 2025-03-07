// client/src/app/(private)/dashboard/layout.tsx
"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/Sidebar";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Loader2 } from "lucide-react";

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

  return (
    <div className="h-screen w-full overflow-hidden">
      <SidebarProvider>
        <div className="grid grid-cols-[minmax(16rem,auto)_1fr] h-full w-full">
          {" "}
          {/* Usamos CSS Grid */}
          {/* Sidebar con ancho fijo */}
          <AppSidebar className="w-64 flex-shrink-0" />
          {/* Contenido principal */}
          <main className="flex flex-col min-w-0">
            <div className="p-2 flex items-center border-b h-15 bg-background">
              <SidebarTrigger className="mr-4" />
              <h1 className="text-xl font-semibold">ChatGPT Clone</h1>
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
