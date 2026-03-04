
"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CreditCard, PlusCircle, Edit, Trash2, ShieldCheck } from "lucide-react";
import { PaymentMethodForm, type PaymentMethodFormData } from "./payment-method-form";
import { useToast } from "@/hooks/use-toast";

interface LeadPaymentMethodsProps {
  lead: {
    id: number;
    name: string;
    savedPaymentMethods?: any[];
  };
}

export function LeadPaymentMethods({ lead }: LeadPaymentMethodsProps) {
  const { toast } = useToast();
  const [methods, setMethods] = useState(lead.savedPaymentMethods || []);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleFormSubmit = (data: PaymentMethodFormData) => {
    const newMethod = {
      id: Date.now(),
      last4: data.cardNumber.slice(-4),
      type: data.cardType || 'visa',
      exp: `${data.expiryMonth}/${data.expiryYear}`,
      name: data.cardholderName
    };
    setMethods([...methods, newMethod]);
    setIsFormOpen(false);
    toast({ title: "Tuition Link Secured", description: `Card ending in ${newMethod.last4} registered.` });
  };

  return (
    <Card className="rounded-none border-2 border-border bg-card shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between bg-secondary/5 border-b border-border py-4">
        <div>
          <CardTitle className="font-headline text-sm font-black uppercase italic tracking-widest flex items-center gap-2">
             <CreditCard className="h-4 w-4 text-primary" />
            Tuition Payment Matrix
          </CardTitle>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-primary hover:bg-primary/90 text-white rounded-none font-black uppercase italic tracking-widest text-[9px] h-8 px-4">
              <PlusCircle className="mr-2 h-3 w-3" /> Link Card
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-none border-4 border-border shadow-2xl p-0 overflow-hidden bg-background">
            <DialogHeader className="p-6 bg-primary text-white border-b border-border">
              <DialogTitle className="font-headline text-2xl font-black uppercase italic tracking-tighter">Secure Comms: Link Payment</DialogTitle>
              <DialogDescription className="text-white/80 font-bold uppercase tracking-widest text-[10px]">Encrypting new tuition data for {lead.name}</DialogDescription>
            </DialogHeader>
            <div className="p-6">
              <PaymentMethodForm onSubmit={handleFormSubmit} onCancel={() => setIsFormOpen(false)} />
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        {methods.length > 0 ? (
          methods.map((m: any) => (
            <div key={m.id} className="flex items-center justify-between p-4 border-2 border-border bg-background group hover:border-primary transition-all rounded-none">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-secondary/10 flex items-center justify-center border border-border group-hover:border-primary">
                  <CreditCard className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-black uppercase italic text-xs leading-none">{m.type} ENDING IN {m.last4}</p>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-1">EXP: {m.exp} | {m.name}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="text-destructive rounded-none hover:bg-destructive/10">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))
        ) : (
          <div className="text-center py-8 opacity-40 border-2 border-dashed border-border">
            <ShieldCheck className="h-8 w-8 mx-auto mb-2" />
            <p className="text-[10px] font-black uppercase tracking-widest">No Tuition Links Established</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
