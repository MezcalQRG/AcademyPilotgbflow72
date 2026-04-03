
"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { ArrowLeft, Zap, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Marquee from "@/components/landing/Marquee";
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
  const headerRef = useRef<HTMLDivElement>(null);
  const shieldRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const overlaysRef = useRef<HTMLDivElement>(null);
  const registryOverlaysRef = useRef<HTMLDivElement>(null);
  const photoGridRef = useRef<HTMLDivElement>(null);
  const topMarqueeRef = useRef<HTMLDivElement>(null);
  const bottomMarqueeRef = useRef<HTMLDivElement>(null);
  const bgPhotoRef = useRef<HTMLDivElement>(null);
  const locatorContainerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!containerRef.current) return;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top top",
        end: "+=400%", // Cinematic scroll duration
        pin: true,
        scrub: 1.2,
        anticipatePin: 1,
      },
    });

    // 0. HEADER HIDE
    tl.to(headerRef.current, {
      y: -100,
      opacity: 0,
      duration: 0.5,
      ease: "power2.inOut"
    }, 0);

    // 1. SHIELD LOGO (Fly-through)
    tl.to(shieldRef.current, {
      scale: 10,
      opacity: 0,
      z: 1000,
      filter: "blur(30px)",
      ease: "power2.in",
      duration: 1,
      force3D: true
    }, 0);

    // Fade out the initial rotating background
    tl.to(bgPhotoRef.current, {
      opacity: 0,
      duration: 0.8,
      ease: "power2.inOut"
    }, 0.5);

    // 2. MASTER TITLE ASSEMBLY
    tl.fromTo(titleRef.current,
      { scale: 0.1, opacity: 0, filter: "blur(20px)", z: -1000 },
      { scale: 1, opacity: 1, filter: "blur(0px)", z: 0, ease: "power2.out", duration: 1, force3D: true }
    );

    // Fade out titles and initial overlays, manifest grid and marquees
    tl.to([titleRef.current, overlaysRef.current], {
      scale: (i) => i === 0 ? 10 : 1,
      opacity: 0,
      z: (i) => i === 0 ? 1000 : 0,
      filter: (i) => i === 0 ? "blur(30px)" : "none",
      ease: "power2.in",
      duration: 1,
      force3D: true
    }, "+=0.5");

    tl.to([topMarqueeRef.current, bottomMarqueeRef.current, photoGridRef.current], {
      opacity: 1,
      duration: 0.5,
    }, "<");

    // 3. LOCATOR CORE REVEAL
    tl.to(registryOverlaysRef.current, {
      opacity: 1,
      duration: 0.8,
      ease: "power2.out"
    }, ">");

    tl.fromTo(locatorContainerRef.current,
      { scale: 0.2, opacity: 0, z: -800, filter: "blur(20px)", y: 100 },
      { 
        scale: 1, 
        opacity: 1, 
        z: 0, 
        filter: "blur(0px)", 
        y: 0,
        ease: "power3.out", 
        duration: 1.2, 
        force3D: true 
      },
      "<"
    );

  }, { scope: containerRef });

  return (
    <section ref={containerRef} className="relative h-screen w-full bg-[#002B5B] overflow-hidden flex flex-col items-center justify-center perspective-container">
      {/* Initial Fading Background Photos */}
      <div ref={bgPhotoRef} className="absolute inset-0 z-0">
        <BackgroundPhotoRotation photoUrls={photoUrls} />
      </div>

      {/* Tactical Header */}
      <div ref={headerRef} className="absolute top-0 left-0 w-full h-24 border-b-4 border-border bg-background/40 backdrop-blur-xl z-[100] flex items-center justify-between px-12">
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

      {/* Manifested Tactical Marquees */}
      <div ref={topMarqueeRef} className="absolute top-0 left-0 w-full z-[90] opacity-0 pointer-events-none">
        <Marquee variant="black" />
      </div>

      <div ref={bottomMarqueeRef} className="absolute bottom-0 left-0 w-full z-[90] opacity-0 pointer-events-none">
        <Marquee variant="black" />
      </div>

      {/* Tactical Grid Background (High Density) */}
      <div ref={photoGridRef} className="absolute inset-0 z-0 opacity-0 pointer-events-none">
        <PhotoGrid photoUrls={photoUrls} variant="mosaic" />
      </div>

      {/* Cinematic Intro Overlays */}
      <div ref={overlaysRef} className="absolute inset-0 z-50 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black opacity-95" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/60" />
        <div className="absolute inset-0 opacity-10">
          <div className="h-full w-full bg-[repeating-linear-gradient(90deg,transparent,transparent_40px,rgba(255,255,255,0.05)_40px,rgba(255,255,255,0.05)_41px)]" />
          <div className="h-full w-full absolute top-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_40px,rgba(255,255,255,0.05)_40px,rgba(255,255,255,0.05)_41px)]" />
        </div>
      </div>

      {/* Registry Phase Atmosphere */}
      <div ref={registryOverlaysRef} className="absolute inset-0 z-10 pointer-events-none opacity-0">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black opacity-95" />
        <div className="absolute inset-0 bg-[#002B5B]/40" />
      </div>

      {/* Shield Logo Scene */}
      <div ref={shieldRef} className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-100 will-change-transform perspective-element">
        <div className="relative w-96 h-96 drop-shadow-[0_0_50px_rgba(225,29,72,0.4)]">
          <img 
            src="https://graciebarra.com/wp-content/uploads/2025/07/logos-barra-shield.svg" 
            alt="Gracie Barra Shield" 
            className="w-full h-full object-contain"
          />
        </div>
      </div>

      {/* Title Scene */}
      <div ref={titleRef} className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 will-change-transform perspective-element z-[60]">
        <h1 className="text-center">
          <span className="block text-[10vw] font-black text-white uppercase italic tracking-tighter leading-none drop-shadow-[0_0_50px_rgba(255,255,255,0.2)]">
            GRACIE BARRA
          </span>
          <span className="block text-[6vw] font-black text-primary uppercase italic tracking-tighter leading-none -mt-4 drop-shadow-[0_0_30px_rgba(225,29,72,0.5)]">
            FIND LOCATION
          </span>
        </h1>
      </div>

      {/* Locator Core reveal */}
      <div 
        ref={locatorContainerRef}
        className="absolute inset-0 flex flex-col items-center justify-start opacity-0 will-change-transform perspective-element z-[70] pt-24 pb-20 overflow-y-auto"
      >
        <div className="container mx-auto px-4 py-16 space-y-16">
          <div className="max-w-3xl border-l-8 border-primary pl-10 space-y-4">
            <div className="inline-block bg-primary text-white px-4 py-1 text-[10px] font-black uppercase tracking-[0.3em] italic mb-2 shadow-lg">
              MISSION: FIND YOUR TEAM
            </div>
            <h2 className="text-6xl md:text-8xl font-headline font-black uppercase italic tracking-tighter leading-none text-white drop-shadow-lg">
              Locate the Nearest <br /><span className="text-primary drop-shadow-[0_2px_4px_rgba(0,0,0,0.1)]">Jiu-Jitsu</span> Academy
            </h2>
            <p className="text-xl text-white font-black uppercase italic tracking-tight max-w-xl drop-shadow-md bg-black/20 p-2 inline-block">
              Find a certified Gracie Barra training center in your area. Join our global brotherhood and start your journey with a free trial class today.
            </p>
          </div>

          <AcademyLocator />
        </div>
      </div>
    </section>
  );
}
