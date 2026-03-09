
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PaymentMethodForm } from "@/components/leads/payment-method-form";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ShieldCheck, Zap, CreditCard } from "lucide-react";
import Image from "next/image";

interface PaymentGatewayDialogProps {
  children: React.ReactNode;
  planTitle: string;
  planDetails: string;
}

export function PaymentGatewayDialog({ children, planTitle, planDetails }: PaymentGatewayDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handlePaymentSubmit = async (data: any) => {
    setIsProcessing(true);
    // Simulated tactical handshake
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    toast({
      title: "ENROLLMENT SECURED",
      description: `OSS! Tactical link established for ${planTitle.toUpperCase()}. Welcome to the team.`,
    });
    
    setIsProcessing(false);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="rounded-none border-4 border-border bg-background shadow-2xl p-0 overflow-hidden max-w-2xl">
        <div className="flex flex-col md:flex-row h-full">
          {/* Tactical Summary Side */}
          <div className="md:w-5/12 bg-secondary p-8 text-white flex flex-col justify-between border-b-4 md:border-b-0 md:border-r-4 border-border">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="relative w-8 h-8">
                  <Image 
                    src="https://graciebarra.com/wp-content/uploads/2025/07/logos-barra-shield.svg" 
                    alt="Logo" 
                    fill
                    className="object-contain brightness-0 invert"
                  />
                </div>
                <span className="font-headline text-xl font-black uppercase italic tracking-tighter">GB AI</span>
              </div>
              
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary italic">Protocol Selection</p>
                <DialogHeader className="p-0 space-y-0 text-left">
                  <DialogTitle className="text-3xl font-black uppercase italic tracking-tighter leading-tight">
                    {planTitle}
                  </DialogTitle>
                  <DialogDescription className="sr-only">
                    Mission brief and financial matrix initialization for {planTitle}.
                  </DialogDescription>
                </DialogHeader>
              </div>

              <div className="p-4 bg-white/5 border border-white/10 rounded-none italic">
                <p className="text-sm font-bold leading-relaxed">
                  {planDetails}
                </p>
              </div>
            </div>

            <div className="mt-8 space-y-4">
              <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-widest opacity-60">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <span>Encrypted Tactical Handshake</span>
              </div>
            </div>
          </div>

          {/* Payment Form Side */}
          <div className="md:w-7/12 p-8 bg-card relative overflow-hidden">
            <Zap className="absolute top-0 right-0 h-32 w-32 text-primary opacity-5 rotate-12 -translate-y-8 translate-x-8" />
            
            {isProcessing ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in duration-500">
                <Loader2 className="h-16 w-16 text-primary animate-spin" />
                <div>
                  <h4 className="text-xl font-black uppercase italic">Syncing Matrix...</h4>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-2">Authorizing Tuition Link</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center gap-2 border-b-2 border-border pb-4">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <h4 className="text-sm font-black uppercase italic tracking-widest">Financial Matrix Entry</h4>
                </div>
                
                <PaymentMethodForm 
                  onSubmit={handlePaymentSubmit} 
                  onCancel={() => setIsOpen(false)} 
                />
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
