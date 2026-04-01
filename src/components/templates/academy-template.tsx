
"use client";

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FreeTrialDialog } from '@/components/landing/free-trial-dialog';
import Marquee from '@/components/landing/Marquee';
import { ScrollRevealImage } from '@/components/landing/scroll-reveal-image';
import { BackgroundPhotoRotation } from '@/components/landing/background-photo-rotation';
import { AuthModal } from '@/components/auth/auth-modal';
import { 
  Trophy, 
  Shield, 
  ArrowRight, 
  History, 
  UserCircle,
  Phone,
  Mail,
  MapPin
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { PhotoGrid } from '@/components/photo-grid';
import type { LandingPageData } from '@/lib/types';

export function AcademyTemplate({ 
  slug,
  branchName, 
  headline,
  subheadline,
  callToAction,
  contactPhone,
  contactEmail,
  address,
  heroImage,
  photos,
}: LandingPageData & { photos: string[] }) {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Tactical Header */}
      <header className="fixed top-0 w-full z-50 bg-background/20 backdrop-blur-xl border-b-2 border-border shadow-sm">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative w-10 h-10">
              <img 
                src="https://graciebarra.com/wp-content/uploads/2025/07/logos-barra-shield.svg" 
                alt="Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-headline text-2xl font-black uppercase italic text-primary tracking-tighter">GB {branchName || "ACADEMY"}</span>
              <span className="font-headline text-[10px] font-bold tracking-[0.2em] uppercase text-foreground">Official Tactical Branch</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <AuthModal 
              mode="student" 
              trigger={
                <Button variant="outline" className="hidden sm:inline-flex font-black uppercase tracking-widest text-[10px] border-2 border-primary text-primary hover:bg-primary hover:text-white rounded-none h-10 px-6">
                  <UserCircle className="mr-2 h-4 w-4" /> Unit Portal
                </Button>
              } 
            />
            <FreeTrialDialog tenantSlug={slug}>
              <Button className="bg-primary hover:bg-primary/90 text-white font-black uppercase italic tracking-widest px-8 rounded-none h-10">
                {callToAction || 'FREE TRIAL'}
              </Button>
            </FreeTrialDialog>
          </div>
        </div>
      </header>

      <main className="flex-grow pt-20">
        {/* Hero Section */}
        <section className="relative h-[85vh] flex items-center overflow-hidden bg-slate-50 dark:bg-black">
          {heroImage ? (
            <div className="absolute inset-0 z-0">
               <img src={heroImage} alt={`${branchName} Hero`} className="w-full h-full object-cover opacity-60" />
               <div className="absolute inset-0 bg-gradient-to-r from-slate-100 via-slate-100/70 dark:from-black dark:via-black/70 to-transparent" />
            </div>
          ) : (
            <PhotoGrid photoUrls={photos} />
          )}
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-2xl space-y-6">
              <div className="inline-block bg-primary px-4 py-1 text-white text-[10px] font-black uppercase tracking-[0.3em] italic shadow-sm">
                {branchName || "GRACIE BARRA"} Tactical Unit Deployed
              </div>
              <h1 className="font-headline text-6xl md:text-8xl font-black leading-none uppercase italic text-slate-900 dark:text-white tracking-tighter">
                {headline || "Jiu-Jitsu For Everyone"}
              </h1>
              <p className="text-xl text-slate-700 dark:text-white/80 max-w-lg font-bold uppercase italic tracking-tight leading-relaxed">
                {subheadline || `Join the largest and most successful Brazilian Jiu-Jitsu team in the world. Master the art at our ${branchName || "localized"} academy.`}
              </p>
              
              <FreeTrialDialog tenantSlug={slug}>
                <Button size="lg" className="bg-primary hover:bg-primary/90 px-10 py-8 text-lg font-black uppercase italic tracking-widest rounded-none h-auto shadow-2xl">
                  {callToAction || 'START YOUR MISSION'} <ArrowRight className="ml-2 h-6 w-6" />
                </Button>
              </FreeTrialDialog>
            </div>
          </div>
        </section>

        <Marquee variant="black" />

        {/* Programs Matrix */}
        <section id="programs" className="py-24 bg-white dark:bg-zinc-950">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
              <div className="space-y-4 border-l-8 border-primary pl-8">
                <h2 className="font-headline text-xs font-black uppercase tracking-[0.4em] text-primary">Operational Matrix</h2>
                <h3 className="font-headline text-6xl font-black uppercase tracking-tighter italic text-slate-900 dark:text-white leading-none">{branchName || "Academy"} Programs</h3>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-0 border-4 border-slate-900 dark:border-black">
              <ProgramCard title="GB1 Fundamentals" desc="The foundation of our mission. Designed for beginner units." />
              <ProgramCard title="GB2 Advanced" desc="Advanced tactical development. Maximum strategic engagement." featured />
              <ProgramCard title="Little Champions" desc="Future legacy initialization. Youth enrollment active." />
            </div>
          </div>
        </section>

        <Marquee variant="red" />

        {/* Contact/CTA Reveal */}
        <section className="py-32 bg-slate-100 dark:bg-secondary text-slate-900 dark:text-white relative overflow-hidden min-h-[600px] flex items-center border-y-4 border-slate-200 dark:border-border">
          <BackgroundPhotoRotation photoUrls={photos} />
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-xl space-y-8 text-left">
              <div className="space-y-4">
                <Badge className="bg-primary text-white font-black uppercase italic tracking-widest rounded-none px-4 border border-white/20">Establish Presence</Badge>
                <h2 className="font-headline text-6xl md:text-7xl font-black uppercase italic tracking-tighter leading-none text-slate-900 dark:text-white">
                  Join the <br />
                  <span className="text-primary">{branchName || "Gracie Barra"} Team</span>
                </h2>
              </div>
              
              <div className="grid grid-cols-1 gap-4 text-sm font-bold uppercase italic tracking-widest text-slate-700 dark:text-white/80">
                {address && <div className="flex items-center gap-3"><MapPin className="h-5 w-5 text-primary" /> {address}</div>}
                {contactPhone && <div className="flex items-center gap-3"><Phone className="h-5 w-5 text-primary" /> {contactPhone}</div>}
                {contactEmail && <div className="flex items-center gap-3"><Mail className="h-5 w-5 text-primary" /> {contactEmail}</div>}
              </div>

              <FreeTrialDialog tenantSlug={slug}>
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-white rounded-full font-black uppercase italic tracking-tighter w-36 h-36 flex flex-col items-center justify-center text-center leading-none shadow-2xl border-4 border-white/10 transition-transform hover:scale-110">
                  FREE<br/>TRIAL
                </Button>
              </FreeTrialDialog>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-slate-50 dark:bg-black text-slate-900 dark:text-white border-t-4 border-primary py-20 relative overflow-hidden">
        <div className="container mx-auto px-4 text-center space-y-8 relative z-10">
          <div className="flex items-center justify-center gap-3">
            <div className="relative w-8 h-8">
              <img 
                src="https://graciebarra.com/wp-content/uploads/2025/07/logos-barra-shield.svg" 
                alt="Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <span className="font-headline text-2xl font-black tracking-tighter uppercase italic text-slate-900 dark:text-white">GB {branchName?.toUpperCase() || "PILOT"}</span>
          </div>
          
          <div className="text-[9px] text-slate-500 dark:text-white/30 font-black uppercase tracking-[0.2em]">
            © 2024 GRACIE BARRA AI PILOT SYSTEM // SECTOR: {branchName?.toUpperCase() || "HQ"}
          </div>
        </div>
      </footer>
    </div>
  );
}

function ProgramCard({ title, desc, featured = false }: { title: string, desc: string, featured?: boolean }) {
  return (
    <div className={`p-10 space-y-6 flex flex-col transition-all duration-300 border-r-2 last:border-r-0 border-slate-200 dark:border-black ${featured ? 'bg-slate-100 dark:bg-secondary text-slate-900 dark:text-white scale-105 z-10 shadow-2xl relative' : 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-zinc-800'}`}>
      <h4 className="font-headline text-3xl font-black uppercase italic tracking-tighter leading-none">{title}</h4>
      <p className={`text-sm font-bold uppercase tracking-tight leading-relaxed ${featured ? 'text-slate-600 dark:text-white/80' : 'text-slate-500 dark:text-muted-foreground'}`}>{desc}</p>
      <div className="mt-auto pt-8">
        <Button variant={featured ? 'default' : 'outline'} className={`w-full font-black uppercase italic tracking-widest rounded-none h-14 text-xs transition-all ${featured ? 'bg-primary hover:bg-primary/90 border-primary text-white' : 'border-slate-900 dark:border-white hover:bg-slate-900 dark:hover:bg-white hover:text-white dark:hover:text-black bg-transparent'}`}>
          DEPLOY UNIT
        </Button>
      </div>
    </div>
  );
}
