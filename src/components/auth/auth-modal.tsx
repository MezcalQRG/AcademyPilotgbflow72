
'use client';

import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { initiateTacticalLoginAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Shield, Zap, Mail, Loader2, UserPlus, ArrowRight } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';

interface AuthModalProps {
  mode: 'admin' | 'student';
  trigger: React.ReactNode;
}

export function AuthModal({ mode, trigger }: AuthModalProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    try {
      // Mission Direct: Dispatch magic link via the tactical server action
      const result = await initiateTacticalLoginAction(email);
      
      if (result.error) {
        throw new Error(result.error);
      }

      setIsSent(true);
      toast({
        title: "DISPATCH COMPLETE",
        description: "Secure tactical link transmitted via AWS SES.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "DISPATCH FAILURE",
        description: error.message || "Failed to transmit authentication link through the matrix.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog onOpenChange={(open) => !open && setIsSent(false)}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="rounded-none border-4 border-border bg-background shadow-2xl p-0 overflow-hidden max-w-md">
        <DialogHeader className="p-8 bg-primary text-white border-b-4 border-border">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-white" />
            <DialogTitle className="font-headline text-3xl font-black uppercase italic tracking-tighter">
              {mode === 'admin' ? 'Command Login' : 'Unit Login'}
            </DialogTitle>
          </div>
          <DialogDescription className="text-white/80 font-bold uppercase tracking-widest text-[10px] mt-2">
            Secure Handshake Required for Hub Access
          </DialogDescription>
        </DialogHeader>

        <div className="p-8 space-y-8">
          {!isSent ? (
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Tactical Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="email"
                    type="email"
                    placeholder="UNIT@EXAMPLE.COM"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="rounded-none border-2 border-border h-14 pl-12 font-bold uppercase focus-visible:ring-primary"
                    required
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-primary hover:bg-primary/90 text-white rounded-none font-black uppercase italic tracking-widest h-16 shadow-xl text-lg mt-4"
              >
                {isLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <>DISPATCH ACCESS LINK <Zap className="ml-2 h-5 w-5 fill-current" /></>
                )}
              </Button>
            </form>
          ) : (
            <div className="text-center py-10 space-y-6 animate-in fade-in zoom-in-95">
              <div className="w-20 h-20 bg-primary/10 border-4 border-primary flex items-center justify-center rotate-45 mx-auto">
                <Mail className="h-10 w-10 text-primary -rotate-45" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black uppercase italic tracking-tighter text-primary">Link Dispatched</h3>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground max-w-[200px] mx-auto">
                  Check your communication grid for the secure SES handshake link.
                </p>
              </div>
            </div>
          )}

          <div className="space-y-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><Separator className="bg-border" /></div>
              <div className="relative flex justify-center">
                <span className="bg-background px-4 text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground">New Operational Unit?</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <Button asChild variant="outline" className="rounded-none border-2 border-border h-12 font-black uppercase italic text-[10px] tracking-widest hover:bg-primary hover:text-white hover:border-primary transition-all">
                <Link href={`/checkout?mode=${mode}&step=1`}>
                  CREATE {mode === 'admin' ? 'ACADEMY' : 'STUDENT'} ACCOUNT <UserPlus className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
