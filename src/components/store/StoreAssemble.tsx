"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, ArrowLeft, ShieldCheck, Zap, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Marquee from "@/components/landing/Marquee";
import { PhotoGrid } from "@/components/photo-grid";
import { BackgroundPhotoRotation } from "@/components/landing/background-photo-rotation";
import { ThemeToggle } from "@/components/theme-toggle";

gsap.registerPlugin(ScrollTrigger);

interface StoreAssembleProps {
  photoUrls: string[];
}

export default function StoreAssemble({ photoUrls }: StoreAssembleProps) {
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
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  const items = [
    {
      id: 'gb-kimono-blue',
      name: 'GB PRO KIMONO BLUE',
      price: '120',
      description: 'Engineered for maximum durability and tactical mobility. The official blue competition armor.',
      details: 'Official competition-ready Gracie Barra Kimono in Royal Blue. Durable pearl weave with reinforced stitching.',
      tag: 'OFFICIAL COMMAND ISSUE'
    },
    {
      id: 'gb-rashguard-white',
      name: 'GB TACTICAL RASHGUARD',
      price: '60',
      description: 'High-compression moisture-wicking technology. Optimized for high-intensity training.',
      details: 'White tactical rashguard with full GB identification. Compressed fit for superior performance.',
      tag: 'STEALTH LAYER'
    },
    {
      id: 'gb-shorts',
      name: 'GB TRAINING SHORTS',
      price: '50',
      description: 'Lightweight and durable grappling shorts. Full range of motion for elite movement.',
      details: 'Tactical shorts designed for Brazilian Jiu-Jitsu. Reinforced seams and flexible material.',
      tag: 'AGILITY COMPONENT'
    },
    {
      id: 'gb-kimono-white',
      name: 'GB PRO KIMONO WHITE',
      price: '120',
      description: 'The classic white uniform for the traditional martial artist. Unmatched quality.',
      details: 'Official competition-ready Gracie Barra Kimono. Premium white pearl weave construction.',
      tag: 'LEGACY TRADITION'
    }
  ];

  useGSAP(() => {
    if (!containerRef.current) return;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top top",
        end: `+=${(items.length + 2) * 150}%`,
        pin: true,
        scrub: 1.2,
        anticipatePin: 1,
      },
    });

    // 0. HEADER HIDE (Tactical Fade)
    tl.to(headerRef.current, {
      y: -100,
      opacity: 0,
      duration: 0.5,
      ease: "power2.inOut"
    }, 0);

    // 1. SHIELD LOGO (Cinematic Fly-through)
    tl.to(shieldRef.current, {
      scale: 10,
      opacity: 0,
      z: 1000,
      filter: "blur(30px)",
      ease: "power2.in",
      duration: 1,
      force3D: true
    }, 0);

    // Fade out the initial rotating background early
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

    // 3. ARMOR REGISTRY ASSEMBLY
    items.forEach((item, index) => {
      const ref = itemRefs.current[index];
      if (!ref) return;

      // Manifest the registry atmosphere (blue base + shadow) precisely with the first card
      if (index === 0) {
        tl.to(registryOverlaysRef.current, {
          opacity: 1,
          duration: 0.8,
          ease: "power2.out"
        }, ">");
      }

      tl.fromTo(ref,
        { scale: 0.2, opacity: 0, z: -800, filter: "blur(20px)", x: index % 2 === 0 ? 200 : -200 },
        { 
          scale: 1, 
          opacity: 1, 
          z: 0, 
          filter: "blur(0px)", 
          x: 0, 
          ease: "power3.out", 
          duration: 1.2, 
          force3D: true 
        },
        index === 0 ? "<" : undefined
      );

      if (index < items.length - 1) {
        tl.to(ref, {
          x: index % 2 === 0 ? -1200 : 1200,
          rotateY: index % 2 === 0 ? -45 : 45,
          opacity: 0,
          scale: 0.5,
          ease: "power2.in",
          duration: 1,
          force3D: true
        }, "+=0.8");
      }
    });

  }, { scope: containerRef });

  return (
    <section ref={containerRef} className="relative h-screen w-full bg-[#002B5B] overflow-hidden flex flex-col items-center justify-center perspective-container">
      {/* Initial Fading Background Photos */}
      <div ref={bgPhotoRef} className="absolute inset-0 z-0">
        <BackgroundPhotoRotation photoUrls={photoUrls} />
      </div>

      {/* Tactical Header */}
      <div ref={headerRef} className="absolute top-0 left-0 w-full h-24 border-b-4 border-border bg-black/40 backdrop-blur-xl z-[100] flex items-center justify-between px-12">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 flex items-center justify-center">
            <img 
              src="https://graciebarra.com/wp-content/uploads/2025/07/logos-barra-shield.svg" 
              alt="Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex flex-col">
            <span className="font-headline text-2xl font-black uppercase italic tracking-tighter text-primary leading-none">ARMORY HUB</span>
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-700 dark:text-white/60">Equipping the Global Legacy</span>
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

      {/* Tactical Grid background */}
      <div ref={photoGridRef} className="absolute inset-0 z-0 opacity-0 pointer-events-none">
        <PhotoGrid photoUrls={photoUrls} />
      </div>

      {/* Cinematic Intro Overlays */}
      <div ref={overlaysRef} className="absolute inset-0 z-50 pointer-events-none">
        {/* Strong Horizontal Shade (Top and Bottom) */}
        <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black opacity-95" />
        {/* Subtle Lateral Shade (Left and Right) */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/60" />
        
        <div className="absolute inset-0 opacity-10">
          <div className="h-full w-full bg-[repeating-linear-gradient(90deg,transparent,transparent_40px,rgba(255,255,255,0.05)_40px,rgba(255,255,255,0.05)_41px)]" />
          <div className="h-full w-full absolute top-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_40px,rgba(255,255,255,0.05)_40px,rgba(255,255,255,0.05)_41px)]" />
        </div>
      </div>

      {/* Registry Phase Atmosphere (Blue + Shadow) */}
      <div ref={registryOverlaysRef} className="absolute inset-0 z-10 pointer-events-none opacity-0">
        {/* Deep Horizontal Shade (Top and Bottom) */}
        <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black opacity-95" />
        {/* Tactical Blue Wash - manifested when items appear to "bring the blue background" back */}
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
          <span className="block text-[8vw] font-black text-primary uppercase italic tracking-tighter leading-none -mt-4 drop-shadow-[0_0_30px_rgba(225,29,72,0.5)]">
            STORE
          </span>
        </h1>
      </div>

      {/* Uniform Registry Items */}
      {items.map((item, index) => (
        <div 
          key={item.id}
          ref={el => { itemRefs.current[index] = el; }}
          className="absolute inset-0 flex items-center justify-center opacity-0 will-change-transform perspective-element px-6 z-[70]"
        >
          <Card className="max-w-4xl w-full bg-slate-50/95 dark:bg-secondary/90 backdrop-blur-2xl border-4 border-slate-300 dark:border-border rounded-none shadow-2xl overflow-hidden">
            <div className="flex flex-col md:flex-row h-full">
              <div className="p-12 flex flex-col justify-center space-y-8 w-full">
                <div className="space-y-2 border-l-8 border-primary pl-8">
                  <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] italic">{item.tag}</p>
                  <h3 className="text-5xl font-black uppercase italic tracking-tighter text-slate-900 dark:text-white leading-none">{item.name}</h3>
                </div>
                <p className="text-lg font-bold text-slate-600 dark:text-white/60 uppercase tracking-tight leading-relaxed">
                  {item.description}
                </p>
                <div className="flex items-center justify-between gap-6 pt-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-500 dark:text-muted-foreground uppercase tracking-widest">UNIT COST</span>
                    <span className="text-5xl font-black text-slate-900 dark:text-white italic">${item.price}.00</span>
                  </div>
                  <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-white rounded-none font-black uppercase italic h-16 px-10 shadow-xl">
                    <Link href={`/checkout?plan=${encodeURIComponent(item.name)}&price=${item.price}&details=${encodeURIComponent(item.details)}&itemType=uniform&assetId=${item.id}`}>
                      ACQUIRE UNIT <ShoppingCart className="ml-3 h-5 w-5" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      ))}
    </section>
  );
}
