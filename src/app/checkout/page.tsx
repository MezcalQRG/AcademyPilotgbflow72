
"use client";

import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useState, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PaymentMethodForm } from "@/components/leads/payment-method-form";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ShieldCheck, Zap, CreditCard, ArrowLeft } from "lucide-react";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { cn } from "@/lib/utils";
import Link from "next/link";

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const planTitle = searchParams.get("plan") || "Strategic Plan";
  const planDetails = searchParams.get("details") || "Mission initialization details pending.";
  const itemType = searchParams.get("itemType") || "membership";
  const assetId = searchParams.get("assetId");
  const price = searchParams.get("price") || "900";

  // Tactical logic to find the correct asset for display
  const tacticalAsset = assetId 
    ? PlaceHolderImages.find(img => img.id === assetId)
    : PlaceHolderImages.find(img => img.id === 'hero-bjj');

  const handlePaymentSubmit = async (data: any) => {
    setIsProcessing(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    toast({
      title: "ENROLLMENT SECURED",
      description: `OSS! Tactical link established for ${planTitle.toUpperCase()}. Welcome to the team.`,
    });
    
    setIsProcessing(false);
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Left Sector: Intelligence Briefing */}
      <div className="w-full md:w-1/2 bg-secondary p-6 md:p-12 text-white flex flex-col justify-between relative overflow-hidden border-b-4 md:border-b-0 md:border-r-4 border-border">
        {/* Background Asset Bleed - Disabled for uniforms to ensure single image focus */}
        <div className="absolute inset-0 z-0 opacity-40">
          {tacticalAsset && itemType !== 'uniform' && (
            <Image 
              src={tacticalAsset.imageUrl} 
              alt="Mission Asset" 
              fill 
              className="object-cover"
            />
          )}
          <div className="absolute inset-0 bg-secondary/60" />
        </div>

        <div className="relative z-10 space-y-8 md:space-y-12">
          <Link href={itemType === 'uniform' ? '/store' : '/'} className="inline-flex items-center gap-2 text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-white/60 hover:text-primary transition-colors group">
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            ABORT MISSION TO BASE
          </Link>

          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-white flex items-center justify-center p-2 border-2 border-border shadow-lg">
                  <img 
                    src="https://graciebarra.com/wp-content/uploads/2025/07/logos-barra-shield.svg" 
                    alt="Logo" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex flex-col leading-none">
                  <span className="font-headline text-2xl md:text-3xl font-black uppercase italic tracking-tighter text-primary">GB AI</span>
                  <span className="font-headline text-[8px] md:text-[10px] font-bold tracking-[0.2em] uppercase opacity-60">Deployment Terminal</span>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="space-y-4 border-l-8 border-primary pl-6 md:pl-8 relative">
                <p className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.4em] text-primary italic">
                  {itemType === 'uniform' ? 'Armory Acquisition Protocol' : 'Operational Protocol Selection'}
                </p>
                <h1 className="text-4xl md:text-7xl font-black uppercase italic tracking-tighter leading-tight">{planTitle}</h1>
                <div className="inline-block bg-primary text-white px-4 py-1 text-xl md:text-2xl font-black italic shadow-lg">
                  ${price}.00
                </div>
              </div>

              {/* Zoomed Centered Visualization Block - The single high-impact image */}
              {itemType === 'uniform' && tacticalAsset && (
                <div className="mt-8 md:mt-12 border-l-8 border-primary relative h-72 md:h-[450px] bg-black/20 border-2 border-white/5 flex items-center justify-center overflow-hidden group">
                  <div className="absolute inset-0 opacity-10">
                    <div className="h-full w-full bg-[repeating-linear-gradient(90deg,transparent,transparent_20px,rgba(255,255,255,0.05)_20px,rgba(255,255,255,0.05)_21px)]" />
                    <div className="h-full w-full absolute top-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(255,255,255,0.05)_2px,rgba(255,255,255,0.05)_4px)]" />
                  </div>
                  <div className="relative w-full h-full flex items-center justify-center animate-in fade-in zoom-in-95 duration-1000">
                    <Image 
                      src={tacticalAsset.imageUrl} 
                      alt="Unit Preview" 
                      fill 
                      className="object-contain p-4 md:p-8 scale-125 drop-shadow-[0_0_30px_rgba(225,29,72,0.5)] transition-transform duration-1000 group-hover:scale-[1.35]"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="max-w-md p-6 md:p-8 bg-white/5 border-2 border-white/10 rounded-none italic shadow-2xl backdrop-blur-sm">
              <p className="text-base md:text-lg font-bold leading-relaxed opacity-90">
                {planDetails}
              </p>
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-8 md:mt-12 space-y-4">
          <div className="flex items-center gap-4 text-[8px] md:text-[10px] font-black uppercase tracking-widest opacity-60">
            <ShieldCheck className="h-5 w-5 md:h-6 md:w-6 text-primary" />
            <span>End-to-End Encrypted Tactical Handshake Active</span>
          </div>
        </div>
      </div>

      {/* Right Sector: Financial Matrix Entry */}
      <div className="w-full md:w-1/2 p-6 md:p-12 bg-card flex flex-col justify-center relative overflow-hidden">
        <Zap className="absolute top-0 right-0 h-48 w-48 md:h-64 md:w-64 text-primary opacity-5 rotate-12 -translate-y-16 translate-x-16" />
        
        <div className="max-w-md w-full mx-auto relative z-10">
          {isProcessing ? (
            <div className="flex flex-col items-center justify-center text-center space-y-8 animate-in fade-in zoom-in-95 duration-500">
              <div className="relative">
                <div className="h-24 w-24 md:h-32 md:w-32 border-8 border-primary/20 border-t-primary rounded-none rotate-45 animate-spin" />
                <Zap className="h-10 w-10 md:h-12 md:w-12 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <div className="space-y-3">
                <h4 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter">Syncing Matrix...</h4>
                <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-primary animate-pulse">Authorizing Financial Link with Central Command</p>
              </div>
            </div>
          ) : (
            <div className="space-y-8 md:space-y-10">
              <div className="flex items-center justify-between border-b-4 border-border pb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 md:p-3 bg-primary/10 border-2 border-primary rotate-45">
                    <CreditCard className="h-5 w-5 md:h-6 md:w-6 text-primary -rotate-45" />
                  </div>
                  <h4 className="text-xl md:text-2xl font-black uppercase italic tracking-tighter">Financial Matrix</h4>
                </div>
                <Badge className="rounded-none bg-secondary/10 text-foreground border-2 border-border px-3 md:px-4 py-1 font-black uppercase italic text-[8px] md:text-[10px] tracking-widest">
                  SECURE LINK
                </Badge>
              </div>
              
              <div className="bg-background border-2 border-border p-6 md:p-8 shadow-xl">
                <PaymentMethodForm 
                  onSubmit={handlePaymentSubmit} 
                  onCancel={() => router.push(itemType === 'uniform' ? '/store' : '/')} 
                />
              </div>

              <div className="text-center">
                <p className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60">
                  Mission Readiness: Your assets will be deployed immediately upon matrix verification.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
