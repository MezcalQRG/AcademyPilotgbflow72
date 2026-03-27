"use client";

import { useState, useEffect } from "react";
import { useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Image from 'next/image';
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { showErrorToast } from '@/lib/client-errors';
import { Loader2, PhoneOutgoing } from "lucide-react";
import { useConversation } from '@elevenlabs/react';

const formSchema = z.object({
  name: z.string().min(2, "Name is required"),
  phone: z.string().min(10, "Valid phone number required"),
  email: z.string().email("Valid email is required"), // Added Email Validation
});

export function FreeTrialDialog({ children, tenantSlug }: { children: React.ReactNode, tenantSlug: string }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [isAgentOnLine, setIsAgentOnLine] = useState(false);
  const [hasBrowserConnected, setHasBrowserConnected] = useState(false);
  const [twilioConversationId, setTwilioConversationId] = useState<string | null>(null);
  const [twilioStatus, setTwilioStatus] = useState<'dialing' | 'connected' | 'ended' | 'failed'>('dialing');
  const [countdown, setCountdown] = useState(60);
  const [typedPhone, setTypedPhone] = useState("");
  const [fullPhone, setFullPhone] = useState("");
  const [leadName, setLeadName] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const { toast } = useToast();
  const redirectGuardRef = useRef(false);
  const browserConnectedRef = useRef(false);

  const redirectToCheckout = () => {
    if (redirectGuardRef.current) return;
    redirectGuardRef.current = true;

    const plan = "Plan Anual";
    const price = "1800";
    const details = "Inversión Total: $1,800. Forma de Pago: 2 exhibiciones de $900. Regalo: 1 Kimono + Uniforme No-Gi.";
    router.push(`/${tenantSlug}/checkout?plan=${encodeURIComponent(plan)}&price=${price}&details=${encodeURIComponent(details)}`);
  };

  const conversation = useConversation({
    onConnect: () => {
      setHasBrowserConnected(true);
      browserConnectedRef.current = true;
      setIsAgentOnLine(true);
      toast({
        title: 'AGENT ON THE LINE',
        description: 'Connected in-browser with your tactical AI agent.',
      });
    },
    onDisconnect: () => {
      if (browserConnectedRef.current) {
        redirectToCheckout();
      }
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: 'VOICE LINK ERROR',
        description: 'Could not establish browser conversation.',
      });
    },
  });

  const browserAgentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID || '';

  useEffect(() => {
    if (!isCalling || !twilioConversationId) return;

    const poller = setInterval(async () => {
      try {
        const response = await fetch(`/api/elevenlabs-call-status?conversationId=${encodeURIComponent(twilioConversationId)}`);
        if (!response.ok) return;
        const data = await response.json();
        const status = (data?.status || 'dialing') as 'dialing' | 'connected' | 'ended' | 'failed';
        setTwilioStatus(status);

        if (status === 'connected') {
          setIsAgentOnLine(true);
        }

        if (status === 'ended' || status === 'failed') {
          redirectToCheckout();
        }
      } catch {
        // Polling failures should not break the UI.
      }
    }, 1500);

    return () => clearInterval(poller);
  }, [isCalling, twilioConversationId]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "", // Added default value
    },
  });

  // TACTICAL EFFECT: Countdown & Typing Loop
  useEffect(() => {
    let countdownInterval: NodeJS.Timeout;
    let typingInterval: NodeJS.Timeout;

    if (isCalling && !isAgentOnLine) {
      // Countdown Protocol: 60s to mission zero
      countdownInterval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setIsCalling(false);
            setIsOpen(false);
            redirectToCheckout();
            
            return 60;
          }
          return prev - 1;
        });
      }, 1000);

      // Typing Protocol: Looping digits entry
      let charIndex = 0;
      typingInterval = setInterval(() => {
        setTypedPhone(fullPhone.substring(0, charIndex + 1));
        charIndex++;
        if (charIndex > fullPhone.length) {
          charIndex = 0;
          setTypedPhone("");
        }
      }, 150);
    } else {
      setCountdown(60);
      setTypedPhone("");
    }

    return () => {
      clearInterval(countdownInterval);
      clearInterval(typingInterval);
    };
  }, [isCalling, isAgentOnLine, fullPhone]);

  async function handleBrowserAnswer() {
    try {
      if (!browserAgentId) {
        throw new Error('Browser agent is not configured. Set NEXT_PUBLIC_ELEVENLABS_AGENT_ID.');
      }

      await navigator.mediaDevices.getUserMedia({ audio: true });
      await conversation.startSession({
        agentId: browserAgentId,
        dynamicVariables: {
          tenant_slug: tenantSlug,
          lead_name: leadName,
          lead_email: leadEmail,
          lead_phone: fullPhone,
        },
      } as any);
    } catch (error: any) {
      showErrorToast(toast, 'BROWSER LINK FAILURE', error, 'Could not connect browser call fallback.');
    }
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    setFullPhone(values.phone);
    setLeadName(values.name);
    setLeadEmail(values.email);
    
    try {
      const response = await fetch('/api/public-intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-request-id': crypto.randomUUID() },
        body: JSON.stringify({
          action: 'ADD_LEAD',
          payload: {
            tenantSlug: tenantSlug, 
            name: values.name,
            phone: values.phone,
            email: values.email, // Passing the email to the backend
            source: 'website_free_trial'
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.requestId ? `${errorData.error || 'Failed to submit tactical data.'} (requestId: ${errorData.requestId})` : errorData?.error || 'Failed to submit tactical data.');
      }

      const outboundResponse = await fetch('/api/elevenlabs-outbound', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-request-id': crypto.randomUUID() },
        body: JSON.stringify({
          tenantSlug,
          name: values.name,
          phone: values.phone,
          email: values.email,
        }),
      });

      if (!outboundResponse.ok) {
        const outboundError = await outboundResponse.json().catch(() => null);
        throw new Error(outboundError?.error || 'Outbound call could not be started.');
      }

      const outboundData = await outboundResponse.json().catch(() => null);
      const conversationId = outboundData?.data?.conversation_id || null;
      setTwilioConversationId(conversationId);
      setTwilioStatus('dialing');

      setIsSubmitting(false);
      setIsCalling(true);
      setIsAgentOnLine(false);
      setHasBrowserConnected(false);
      
      toast({
        title: "PROTOCOL INITIALIZED",
        description: "Establishing tactical voice link. Standby for AI Dispatch.",
      });

    } catch (error) {
      setIsSubmitting(false);
      showErrorToast(toast, 'MISSION FAILURE', error, 'Could not establish link with tactical command. Please try again.');
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(val) => {
        setIsOpen(val);
        if (!val) {
            setIsCalling(false);
          setIsAgentOnLine(false);
          setHasBrowserConnected(false);
            browserConnectedRef.current = false;
          setTwilioConversationId(null);
          setTwilioStatus('dialing');
          redirectGuardRef.current = false;
            form.reset();
        }
    }}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="rounded-none border-4 border-border bg-background shadow-2xl p-0 overflow-hidden max-w-md">
        {!isCalling ? (
          <>
            <DialogHeader className="p-8 bg-primary text-white border-b-4 border-border">
              <div className="flex items-center gap-3">
                <Image 
                  src="https://graciebarra.com/wp-content/uploads/2025/07/logos-barra-shield.svg" 
                  alt="Logo" 
                  width={32} 
                  height={32} 
                  className="h-8 w-8"
                />
                <DialogTitle className="font-headline text-3xl font-black uppercase italic tracking-tighter">
                  Trial Protocol
                </DialogTitle>
              </div>
              <DialogDescription className="text-white/80 font-bold uppercase tracking-widest text-[10px] mt-2">
                Secure your spot on the mats.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="p-8 space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest">Tactical Callsign (Full Name)</FormLabel>
                      <FormControl>
                        <Input placeholder="ENTER NAME..." {...field} className="rounded-none border-2 font-bold uppercase h-12 focus-visible:ring-primary" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest">Email Address</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="ENTER EMAIL..." {...field} className="rounded-none border-2 font-bold h-12 focus-visible:ring-primary" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest">Comm Link (Phone Number)</FormLabel>
                      <FormControl>
                        <Input placeholder="+1 XXX-XXXX" {...field} className="rounded-none border-2 font-bold h-12 focus-visible:ring-primary" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full bg-primary hover:bg-primary/90 text-white rounded-none font-black uppercase italic tracking-widest h-16 shadow-xl text-lg mt-4"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    'REQUEST TRIAL CLASS'
                  )}
                </Button>
              </form>
            </Form>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 space-y-10 animate-in fade-in zoom-in-95 duration-500 relative">
            {/* TACTICAL BACKGROUND ASSET */}
            <div className="absolute inset-0 z-0 opacity-10 pointer-events-none flex items-center justify-center">
              <Image 
                src="https://graciebarrapilot.s3.us-east-1.amazonaws.com/Generated_Image_March_06__2026_-_12_01AM-removebg-preview.png"
                alt="Tactical Shield Background"
                width={400}
                height={400}
                className="object-contain"
              />
            </div>

            {/* AI Dispatch Matrix UI */}
            <div className="flex flex-col items-center gap-2 relative z-10">
                <span className={`text-[10px] font-black uppercase tracking-[0.4em] italic ${isAgentOnLine ? 'text-emerald-500' : 'text-primary'}`}>
                  {isAgentOnLine ? 'Agent On The Line' : 'Establishing Tactical Link'}
                </span>
                {!isAgentOnLine && (
                  <div className="bg-primary text-white px-6 py-2 font-black text-4xl shadow-xl italic rotate-1">
                      0:{countdown.toString().padStart(2, '0')}
                  </div>
                )}
            </div>

            <div className="relative z-10">
                <div className="absolute inset-0 bg-primary rounded-full blur-3xl opacity-20 animate-pulse" />
                <div className="h-40 w-40 border-8 border-primary rounded-none rotate-45 flex items-center justify-center bg-primary/5 shadow-[0_0_50px_rgba(225,29,72,0.3)] relative z-10">
                    <PhoneOutgoing className="h-20 w-20 text-primary -rotate-45 animate-bounce" />
                </div>
            </div>

            <div className="text-center space-y-4 w-full relative z-10">
                <div className="space-y-1">
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">DISPATCH FREQUENCY:</p>
                    <div className="font-black text-3xl italic tracking-tighter text-foreground h-10 flex items-center justify-center font-mono">
                        {typedPhone}
                        <span className="w-1 h-8 bg-primary ml-1 animate-pulse" />
                    </div>
                </div>
                <p className={`text-[10px] font-bold uppercase tracking-widest italic ${isAgentOnLine ? 'text-emerald-500' : 'text-primary animate-pulse'}`}>
                    {isAgentOnLine ? 'LIVE VOICE SESSION ACTIVE' : 'STANDBY FOR AI VOICE HANDSHAKE...'}
                </p>
                {!isAgentOnLine && (
                  <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                    PHONE STATUS: {twilioStatus}
                  </p>
                )}
            </div>

            {!isAgentOnLine && (
              <Button
                variant="secondary"
                onClick={handleBrowserAnswer}
                className="rounded-none border-2 border-emerald-600 bg-emerald-600/10 text-emerald-700 font-black uppercase italic tracking-widest text-[10px] h-12 px-8 hover:bg-emerald-600 hover:text-white transition-all relative z-10"
              >
                ANSWER IN BROWSER
              </Button>
            )}

            <Button 
                variant="outline" 
                onClick={async () => {
                  setIsCalling(false);
                  if (conversation.status === 'connected') {
                    await conversation.endSession();
                  }
                  redirectToCheckout();
                }}
                className="rounded-none border-2 font-black uppercase italic tracking-widest text-[10px] h-12 px-10 hover:bg-destructive hover:text-white hover:border-destructive transition-all relative z-10"
            >
                ABORT DISPATCH
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
