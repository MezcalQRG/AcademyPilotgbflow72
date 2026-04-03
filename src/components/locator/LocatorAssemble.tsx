
"use client";

import React, { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { ArrowLeft, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PhotoGrid } from "@/components/photo-grid";
import { BackgroundPhotoRotation } from "@/components/landing/background-photo-rotation";
import { ThemeToggle } from "@/components/theme-toggle";
import { AcademyLocator } from "@/components/locator/academy-locator";

gsap.registerPlugin(ScrollTrigger);

interface LocatorAssembleProps {
  photoUrls: string[];
}

export default function LocatorAssemble({ photoUrls }: LocatorAssembleProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const introWrapperRef = useRef<HTMLDivElement>(null);
  const shieldRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const photoGridRef = useRef<HTMLDivElement>(null);
  const bgPhotoRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!containerRef.current) return;

    // 1. PINNED INTRO TIMELINE
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: introWrapperRef.current,
        start: "top top",
        end: "+=150%", // Scroll distance for cinematic intro sequence
        pin: true,
        scrub: 1,
      },
    });

    // Fly-through shield logo
    tl.to(shieldRef.current, {
      scale: 10,
      opacity: 0,
      filter: "blur(30px)",
      ease: "power2.in",
      duration: 1,
    }, 0);

    // Transition initial background rotation to tactical mosaic
    tl.to(bgPhotoRef.current, {
      opacity: 0,
      duration: 0.8,
    }, 0.2);

    // Title assembly reveal ("GRACIE BARRA FIND LOCATION")
    tl.fromTo(titleRef.current,
      { scale: 0.1, opacity: 0, filter: "blur(20px)" },
      { scale: 1, opacity: 1, filter: "blur(0px)", ease: "power2.out", duration: 1 },
      0.5
    );

    // Zoom title out and fully reveal mosaic grid
    tl.to(titleRef.current, {
      scale: 10,
      opacity: 0,
      filter: "blur(30px)",
      duration: 1,
    }, 1.5);

    tl.to(photoGridRef.current, {
      opacity: 1,
      duration: 0.5,
    }, 1.5);

    // 2. HEADER TACTICAL FADE
    gsap.to(headerRef.current, {
      scrollTrigger: {
        trigger: containerRef.current,
        start: "100px top",
        scrub: true,
      },
      y: -100,
      opacity: 0,
    });

  }, { scope: containerRef });

  return (
    <div ref={containerRef} className="relative bg-[#002B5B]">
      {/* TACTICAL HEADER PROTOCOL */}
      <div 
        ref={headerRef} 
        className="fixed top-0 left-0 w-full h-24 border-b-4 border-border bg-background/40 backdrop-blur-xl z-[100] flex items-center justify-between px-12"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 flex items-center justify-center">
            <img 
              src="https://graciebarra.com/wp-content/uploads/2025/07/logos-barra-shield.svg" 
              alt="Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex flex-col">
            <span className="font-headline text-2xl font-black uppercase italic tracking-tighter text-primary leading-none">GRACIE BARRA AI</span>
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-700 dark:text-white/60">Locator Matrix Deployed</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Button asChild variant="ghost" className="text-slate-900 dark:text-white hover:text-primary rounded-none font-black uppercase italic text-xs tracking-widest p-0 h-auto">
            <Link href="/" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" /> ABORT TO BASE
            </Link>
          </Button>
        </div>
      </div>

      {/* PERSISTENT BACKGROUND MATRIX (OLED DEPTH) */}
      <div className="fixed inset-0 z-0">
        <div ref={bgPhotoRef} className="absolute inset-0">
          <BackgroundPhotoRotation photoUrls={photoUrls} />
        </div>
        <div ref={photoGridRef} className="absolute inset-0 opacity-0">
          <PhotoGrid photoUrls={photoUrls} variant="mosaic" />
        </div>
        
        {/* Cinematic Atmospheric Overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black opacity-90" />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 opacity-10">
          <div className="h-full w-full bg-[repeating-linear-gradient(90deg,transparent,transparent_40px,rgba(255,255,255,0.05)_40px,rgba(255,255,255,0.05)_41px)]" />
          <div className="h-full w-full absolute top-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_40px,rgba(255,255,255,0.05)_40px,rgba(255,255,255,0.05)_41px)]" />
        </div>
      </div>

      {/* INTRO PHASE (Pinned for sequence) */}
      <div ref={introWrapperRef} className="relative z-10 h-screen w-full flex items-center justify-center overflow-hidden">
        {/* Shield Logo Fly-through */}
        <div ref={shieldRef} className="relative w-64 h-64 md:w-96 md:h-96 z-20">
          <img 
            src="https://graciebarra.com/wp-content/uploads/2025/07/logos-barra-shield.svg" 
            alt="Shield" 
            className="w-full h-full object-contain drop-shadow-[0_0_50px_rgba(225,29,72,0.4)]"
          />
        </div>

        {/* Title Assembly Overlay */}
        <div ref={titleRef} className="absolute inset-0 flex items-center justify-center opacity-0 z-30 pointer-events-none">
          <h1 className="text-center px-4">
            <span className="block text-[10vw] font-black text-white uppercase italic tracking-tighter leading-none drop-shadow-[0_0_50px_rgba(255,255,255,0.2)]">
              GRACIE BARRA
            </span>
            <span className="block text-[6vw] font-black text-primary uppercase italic tracking-tighter leading-none -mt-4 drop-shadow-[0_0_30px_rgba(225,29,72,0.5)]">
              FIND LOCATION
            </span>
          </h1>
        </div>
      </div>

      {/* LOCATOR MISSION PHASE (Standard Flow) */}
      <div className="relative z-20 pb-32 pt-16">
        <div className="container mx-auto px-4 space-y-16">
          <div className="max-w-3xl border-l-8 border-primary pl-10 space-y-4">
            <div className="inline-block bg-primary text-white px-4 py-1 text-[10px] font-black uppercase tracking-[0.3em] italic mb-2 shadow-lg">
              MISSION: FIND YOUR TEAM
            </div>
            <h2 className="text-6xl md:text-8xl font-headline font-black uppercase italic tracking-tighter leading-none text-white drop-shadow-lg">
              Locate the Nearest <br /><span className="text-primary">Jiu-Jitsu</span> Academy
            </h2>
            <p className="text-xl text-white font-black uppercase italic tracking-tight max-w-xl drop-shadow-md bg-black/40 p-4 inline-block">
              Find a certified Gracie Barra training center in your area. Join our global brotherhood and start your journey with a free trial class today.
            </p>
          </div>

          <AcademyLocator />
        </div>
      </div>
    </div>
  );
}
