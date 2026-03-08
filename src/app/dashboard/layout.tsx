
"use client";

import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter, SidebarTrigger } from "@/components/ui/sidebar";
import { LayoutDashboard, Users, Megaphone, Settings, LogOut, Mic, MessageSquare, CalendarCheck, Zap } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { GlobalChat } from "@/components/chat/global-chat";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { title: "Overview", icon: LayoutDashboard, href: "/dashboard" },
    { title: "Lead Management", icon: Users, href: "/dashboard/leads" },
    { title: "Tactical Automations", icon: Zap, href: "/dashboard/automations" },
    { title: "Conversations", icon: MessageSquare, href: "/dashboard/conversations" },
    { title: "Class Command", icon: CalendarCheck, href: "/dashboard/classes" },
    { title: "Ad Deployment", icon: Megaphone, href: "/dashboard/ads" },
    { title: "Voice Dispatch", icon: Mic, href: "/dashboard/voice" },
    { title: "Integrations", icon: Settings, href: "/dashboard/settings" },
  ];

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background w-full">
        <Sidebar className="border-r border-border">
          <SidebarHeader className="p-4 border-b border-border">
            <Link href="/" className="flex items-center gap-3">
              <div className="relative w-8 h-8 flex-shrink-0">
                <img 
                  src="https://graciebarra.com/wp-content/uploads/2025/07/logos-barra-shield.svg" 
                  alt="Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-headline text-lg font-black tracking-tighter uppercase italic text-primary">GRACIE BARRA AI</span>
                <span className="font-headline text-[10px] font-bold tracking-widest uppercase text-foreground">Pilot</span>
              </div>
            </Link>
          </SidebarHeader>
          <SidebarContent className="px-2 pt-4">
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))}
                    className={`rounded-none py-6 px-4 border-l-4 transition-all ${pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href)) ? 'bg-primary/10 border-primary text-primary font-black italic' : 'border-transparent hover:bg-sidebar-accent text-sidebar-foreground/70'}`}
                  >
                    <Link href={item.href}>
                      <item.icon className={`h-5 w-5 ${pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href)) ? 'text-primary' : ''}`} />
                      <span className="font-headline uppercase tracking-widest text-[10px] font-bold">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="p-4 border-t border-border">
            <SidebarMenuButton className="w-full text-destructive hover:bg-destructive/10 font-black uppercase tracking-[0.2em] text-[10px] rounded-none">
              <LogOut className="h-5 w-5 mr-2" />
              <span>Sign Out</span>
            </SidebarMenuButton>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm flex items-center px-6 justify-between">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <h2 className="font-headline text-lg font-black uppercase italic tracking-tight">
                {navItems.find(i => pathname === i.href || (i.href !== "/dashboard" && pathname.startsWith(i.href)))?.title || "Dashboard"}
              </h2>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-none bg-primary flex items-center justify-center text-white font-black italic border-2 border-primary shadow-lg">
                GB
              </div>
            </div>
          </header>
          <div className="flex-1 overflow-auto p-6 bg-background/50">
            <div className="max-w-7xl mx-auto space-y-8">
              {children}
            </div>
          </div>
        </main>
      </div>
      <GlobalChat />
    </SidebarProvider>
  );
}
