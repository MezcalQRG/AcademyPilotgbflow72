
import { AcademyLocator } from "@/components/locator/academy-locator";
import { ArrowLeft, Shield } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Marquee from "@/components/landing/Marquee";

export default function LocatorPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Tactical Header */}
      <header className="h-24 border-b-4 border-border bg-card/50 flex items-center px-8 lg:px-12 justify-between sticky top-0 z-50 backdrop-blur-md">
        <div className="flex items-center gap-6">
          <Button asChild variant="ghost" className="rounded-none font-black uppercase italic text-xs tracking-widest hover:text-primary p-0 h-auto">
            <Link href="/" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" /> ABORT TO BASE
            </Link>
          </Button>
          <div className="h-10 w-px bg-border hidden sm:block" />
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10">
              <img 
                src="https://graciebarra.com/wp-content/uploads/2025/07/logos-barra-shield.svg" 
                alt="Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-headline text-2xl font-black tracking-tighter uppercase italic text-primary">GRACIE BARRA AI</span>
              <span className="font-headline text-[10px] font-bold tracking-widest uppercase">Locator Link</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary flex items-center justify-center text-white font-black italic text-xl">GB</div>
        </div>
      </header>

      <main className="flex-grow py-16 lg:py-24">
        <div className="container mx-auto px-4 space-y-16">
          <div className="max-w-3xl border-l-8 border-primary pl-10 space-y-4">
            <div className="inline-block bg-primary text-white px-4 py-1 text-[10px] font-black uppercase tracking-[0.3em] italic mb-2">
              MISSION: FIND YOUR TEAM
            </div>
            <h1 className="text-6xl md:text-8xl font-headline font-black uppercase italic tracking-tighter leading-none">
              Locate the Nearest <br /><span className="text-primary">Jiu-Jitsu</span> Academy
            </h1>
            <p className="text-xl text-muted-foreground font-bold uppercase italic tracking-tight max-w-xl">
              Find a certified Gracie Barra training center in your area. Join our global brotherhood and start your journey with a free trial class today.
            </p>
          </div>

          <div className="space-y-4">
            <Marquee variant="red" />
            <Marquee variant="red" />
          </div>

          <AcademyLocator />
        </div>
      </main>

      {/* Simple Tactical Footer */}
      <footer className="bg-card border-t-4 border-border py-12 px-8 lg:px-12">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3 opacity-50">
             <Shield className="h-6 w-6" />
             <span className="font-headline font-black uppercase italic tracking-tighter text-xl">Pilot System</span>
          </div>
          <div className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
            © 2024 GRACIE BARRA AI // SECTOR: LOCATOR
          </div>
        </div>
      </footer>
    </div>
  );
}
