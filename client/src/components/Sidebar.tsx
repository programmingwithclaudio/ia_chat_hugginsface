// client/src/components/Sidebar.tsx
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { MessageSquare, Plus, Settings, User } from "lucide-react";
import { UserButton } from "./shared/user-button";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

// Define los elementos del menú
const menuItems = [
  {
    title: "Chats",
    url: "/dashboard/chats",
    icon: MessageSquare,
  },
  {
    title: "Profile",
    url: "/dashboard/profile",
    icon: User,
  },
  {
    title: "Settings",
    url: "/dashboard/settings",
    icon: Settings,
  },
];

export function AppSidebar({ className }: { className?: string }) {
  const router = useRouter();

  // Función para navegar manualmente en lugar de usar Link
  const handleNavigation = (url: string) => {
    router.push(url);
  };

  return (
    <div className={`bg-gray-800 text-white h-full ${className || ""}`}>
      <Sidebar className="h-full border-r shrink-0">
        <SidebarHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <button
              onClick={() => handleNavigation("/dashboard/chats")}
              className="font-bold text-lg"
            >
              ChatGPT Clone
            </button>
          </div>
        </SidebarHeader>
        <SidebarContent className="flex flex-col h-[calc(100%-110px)]">
          <div className="p-4">
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={() => handleNavigation("/dashboard/chats/new")}
            >
              <Plus className="h-4 w-4 mr-2" />
              <span>Nuevo Chat</span>
            </Button>
          </div>
          <SidebarGroup className="flex-1 overflow-y-auto">
            <SidebarGroupLabel>Menu</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {menuItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      onClick={() => handleNavigation(item.url)}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="h-5 w-5" />
                        <span>{item.title}</span>
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="p-4 border-t">
          <UserButton />
        </SidebarFooter>
      </Sidebar>
    </div>
  );
}
