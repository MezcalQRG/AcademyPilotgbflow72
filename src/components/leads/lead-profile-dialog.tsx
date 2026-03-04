
"use client";

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Phone, 
  Mail, 
  CalendarDays, 
  Zap, 
  UserCircle, 
  MapPin, 
  ClipboardCheck,
  MessageSquare,
  History,
  ShieldAlert,
  CreditCard
} from "lucide-react";
import { LeadHoverSummary } from "./lead-hover-summary";
import { LeadChat } from "./lead-chat";
import { LeadBillingCalendar } from "./lead-billing-calendar";
import { LeadPaymentMethods } from "./lead-payment-methods";

interface Lead {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: string;
  source: string;
  date: string;
  billingDay?: number;
  paymentHistory?: any[];
  savedPaymentMethods?: any[];
}

interface LeadProfileDialogProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
}

export function LeadProfileDialog({ lead, isOpen, onClose }: LeadProfileDialogProps) {
  if (!lead) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl h-[90vh] rounded-none border-4 border-border shadow-2xl p-0 overflow-hidden bg-background">
        <div className="bg-primary p-8 text-white relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Zap size={120} className="rotate-12" />
          </div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
            <Avatar className="h-24 w-24 rounded-none border-4 border-white shadow-lg">
              <AvatarFallback className="rounded-none bg-white text-primary font-black italic text-3xl">
                {lead.name.split(" ").map(n => n[0]).join("")}
              </AvatarFallback>
            </Avatar>
            
            <div className="text-center md:text-left space-y-2">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                <DialogTitle className="font-headline text-4xl font-black uppercase italic tracking-tighter">
                  {lead.name}
                </DialogTitle>
                <Badge className="bg-white text-primary font-black uppercase text-[10px] tracking-widest rounded-none px-3 py-1">
                  {lead.status}
                </Badge>
              </div>
              <DialogDescription className="text-white/80 font-bold uppercase tracking-widest text-[10px] flex items-center justify-center md:justify-start gap-2">
                <UserCircle className="h-3 w-3" /> Tactical Matrix: ACT-00{lead.id}
              </DialogDescription>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1 bg-background">
          <div className="p-8 space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left Column: Intelligence & Comms */}
              <div className="lg:col-span-2 space-y-8">
                <div className="space-y-4">
                  <h4 className="font-headline text-xs font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4" /> Tactical Intelligence
                  </h4>
                  <div className="rounded-none border-2 border-primary/20 bg-primary/5">
                    <LeadHoverSummary lead={lead} />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-headline text-xs font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" /> Communication Logs
                  </h4>
                  <LeadChat leadId={lead.id} leadName={lead.name} />
                </div>
              </div>

              {/* Right Column: Billing & Details */}
              <div className="space-y-8">
                <div className="space-y-4">
                  <h4 className="font-headline text-xs font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                    <CreditCard className="h-4 w-4" /> Financial Matrix
                  </h4>
                  <LeadBillingCalendar lead={lead} />
                  <LeadPaymentMethods lead={lead} />
                </div>

                <div className="space-y-4">
                  <h4 className="font-headline text-xs font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                    <ClipboardCheck className="h-4 w-4" /> Contact Profile
                  </h4>
                  <Card className="rounded-none border-2 border-border bg-card p-4 space-y-4">
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-primary" />
                      <span className="text-xs font-bold uppercase truncate">{lead.email}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-primary" />
                      <span className="text-xs font-bold uppercase">{lead.phone}</span>
                    </div>
                    <Separator className="bg-border" />
                    <div className="flex items-center gap-3">
                      <CalendarDays className="h-4 w-4 text-primary" />
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black uppercase tracking-tighter text-muted-foreground">Captured</span>
                        <span className="text-[10px] font-bold uppercase">{lead.date}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Zap className="h-4 w-4 text-primary" />
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black uppercase tracking-tighter text-muted-foreground">Source</span>
                        <span className="text-[10px] font-bold uppercase">{lead.source}</span>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </div>

            <Separator className="bg-border border-2" />

            <div className="flex flex-col sm:flex-row gap-4 pb-8">
              <Button className="flex-1 bg-primary hover:bg-primary/90 rounded-none font-black uppercase italic tracking-widest h-14 shadow-[4px_4px_0px_rgba(0,0,0,0.1)] text-lg">
                <MessageSquare className="mr-2 h-5 w-5" /> Dispatch Final SMS
              </Button>
              <Button variant="outline" className="flex-1 rounded-none border-4 border-foreground font-black uppercase italic tracking-widest h-14 hover:bg-foreground hover:text-background transition-all text-lg">
                <CalendarDays className="mr-2 h-5 w-5" /> Schedule Trial Session
              </Button>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
