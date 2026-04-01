"use client";

import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter, SidebarTrigger } from "@/components/ui/sidebar";
import { LayoutDashboard, Users, Megaphone, Settings, LogOut, Mic, MessageSquare, CalendarCheck, Zap, FileText, CreditCard, Layout, Loader2 } from "lucide-react";
import Link from "next/link";
import { usePathname, useParams, useRouter } from "next/navigation";
import { GlobalChat } from "@/components/chat/global-chat";
import { ThemeToggle } from "@/components/theme-toggle";
import { useUser, useFirestore, useAuth } from "@/firebase";
import { signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useState, useEffect } from "react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isFetchingProfile, setIsFetchingProfile] = useState(true);

  // Verify tenant access
  useEffect(() => {
    const verifyTenantAccess = async () => {
      if (isUserLoading) return;

      if (!user) {
        // User not authenticated, redirect to main landing page
        router.push("/");
        return;
      }

      try {
        // Fetch user profile to get their tenantSlug
        const userProfileRef = doc(db!, "user_profiles", user.uid);
        const userProfileSnap = await getDoc(userProfileRef);

        if (!userProfileSnap.exists()) {
          // User profile not found - redirect to main page
          router.push("/");
          return;
        }

        const userTenantSlug = userProfileSnap.data()?.tenantSlug as string | undefined;

        if (!userTenantSlug) {
          // User doesn't have a tenant assigned
          router.push("/onboarding");
          return;
        }

        // Check if the requested slug matches the user's tenant
        if (slug !== userTenantSlug) {
          // User trying to access a different tenant's dashboard
          // Redirect to their correct tenant dashboard
          router.push(`/${userTenantSlug}/dashboard`);
          return;
        }

        // User is authorized
        setIsAuthorized(true);
      } catch (error) {
        console.error("Error verifying tenant access:", error);
        router.push("/");
      } finally {
        setIsFetchingProfile(false);
      }
    };

    verifyTenantAccess();
  }, [user, isUserLoading, slug, db, router]);

  // Tenant-aware base path
  const basePath = `/${slug}/dashboard`;

  const navItems = [
    { title: "Overview", icon: LayoutDashboard, href: basePath },
    { title: "Lead Management", icon: Users, href: `${basePath}/leads` },
    { title: "Tactical Automations", icon: Zap, href: `${basePath}/automations` },
    { title: "Landing Page", icon: Layout, href: `${basePath}/landing-page` },
    { title: "Conversations", icon: MessageSquare, href: `${basePath}/conversations` },
    { title: "Class Command", icon: CalendarCheck, href: `${basePath}/classes` },
    { title: "Ad Deployment", icon: Megaphone, href: `${basePath}/ads` },
    { title: "Voice Dispatch", icon: Mic, href: `${basePath}/voice` },
    { title: "Billing Hub", icon: CreditCard, href: `${basePath}/billing` },
    { title: "Compliance Hub", icon: FileText, href: `${basePath}/compliance` },
    { title: "Integrations", icon: Settings, href: `${basePath}/settings` },
  ];

  const isActive = (href: string) => pathname === href || (href !== basePath && pathname.startsWith(href));

  // Show loading state while checking authorization
  if (isUserLoading || isFetchingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="font-headline font-black uppercase italic tracking-widest text-sm text-muted-foreground">
            Verifying Tactical Clearance...
          </p>
        </div>
      </div>
    );
  }

  // If not authorized, don't render the dashboard
  if (!isAuthorized) {
    return null;
  }

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
                <span className="font-headline text-[10px] font-bold tracking-widest uppercase text-foreground">Tenant: {slug}</span>
              </div>
            </Link>
          </SidebarHeader>
          <SidebarContent className="px-2 pt-4">
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={isActive(item.href)}
                    className={`rounded-none py-6 px-4 border-l-4 transition-all ${isActive(item.href) ? 'bg-primary/10 border-primary text-primary font-black italic' : 'border-transparent hover:bg-sidebar-accent text-sidebar-foreground/70'}`}
                  >
                    <Link href={item.href}>
                      <item.icon className={`h-5 w-5 ${isActive(item.href) ? 'text-primary' : ''}`} />
                      <span className="font-headline uppercase tracking-widest text-[10px] font-bold">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="p-4 border-t border-border">
            <SidebarMenuButton
              className="w-full text-destructive hover:bg-destructive/10 font-black uppercase tracking-[0.2em] text-[10px] rounded-none"
              onClick={async () => {
                if (auth) {
                  await signOut(auth);
                }
                router.push('/');
              }}
            >
              <LogOut className="h-5 w-5 mr-2" />
              <span>Sign Out</span>
            </SidebarMenuButton>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm flex items-center px-6 justify-between">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <h2 className="font-headline text-lg font-black uppercase italic tracking-tight text-foreground">
                {navItems.find(i => isActive(i.href))?.title || "Dashboard"}
              </h2>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <div className="w-10 h-10 rounded-none bg-primary flex items-center justify-center text-white font-black italic border-2 border-primary shadow-lg">
                GB
              </div>
            </div>
          </header>
          <div className="flex-1 overflow-auto p-6 bg-background/50">
            <div className="max-w-7xl mx-auto flex flex-col min-h-full">
              <div className="flex-grow space-y-8 pb-12">
                {children}
              </div>
              
              <footer className="pt-12 border-t border-border flex flex-col md:flex-row justify-between items-center gap-6 text-[9px] text-muted-foreground/30 font-black uppercase tracking-[0.2em] pb-8">
                <p>© 2024 GRACIE BARRA AI PILOT SYSTEM. MISSION READY.</p>
                <div className="flex gap-8">
                  <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Protocol</Link>
                  <Link href="/terms" className="hover:text-foreground transition-colors">Terms of Engagement</Link>
                  <Link href="/taxation" className="hover:text-foreground transition-colors">Taxation Compliance</Link>
                </div>
              </footer>
            </div>
          </div>
        </main>
      </div>
      <GlobalChat />
    </SidebarProvider>
  );
}