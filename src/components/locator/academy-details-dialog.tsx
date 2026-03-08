"use client";

import { useState } from "react";
import { Academy } from "@/lib/academies";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Phone, Star, Globe, ExternalLink, Send, CheckCircle2, Zap } from "lucide-react";
import Image from "next/image";

interface AcademyDetailsDialogProps {
  academy: Academy | null;
  onClose: () => void;
}

export function AcademyDetailsDialog({ academy, onClose }: AcademyDetailsDialogProps) {
  const [showTrialForm, setShowTrialForm] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [isSent, setIsSent] = useState(false);
  const { toast } = useToast();
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!academy) return null;

  // Tactical Photo Resolution
  let photoUrl = `https://picsum.photos/seed/${academy.id}/600/400`;
  if (academy.photos && academy.photos.length > 0) {
    const photo = academy.photos[0];
    const photoName = typeof photo === 'string' ? photo : photo.name;
    if (photoName && photoName.startsWith('places/')) {
      photoUrl = `https://places.googleapis.com/v1/${photoName}/media?key=${apiKey}&maxWidthPx=1200`;
    } else if (typeof photo === 'string' && photo.startsWith('http')) {
      photoUrl = photo;
    }
  }

  const handleSendRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Credentials required for session scheduling.",
      });
      return;
    }
    
    setIsSent(true);
    toast({
      title: "Tactical Link Established",
      description: "Mission request received. Expect unit contact shortly.",
    });

    setTimeout(() => {
      setShowTrialForm(false);
      setIsSent(false);
      setName("");
      setPhone("");
    }, 3000);
  };

  return (
    <Dialog open={!!academy} onOpenChange={(open) => {
      if (!open) {
        onClose();
        setShowTrialForm(false);
        setIsSent(false);
      }
    }}>
      <DialogContent className="sm:max-w-xl bg-background border-4 border-border rounded-none shadow-2xl p-0 overflow-hidden">
        <div className="relative h-64 w-full border-b-4 border-border">
          <Image
            src={photoUrl}
            alt={academy.name}
            fill
            className="object-cover hover:scale-105 transition-all duration-700"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
          <div className="absolute bottom-6 left-8 right-8">
            <h2 className="text-3xl font-headline text-2xl md:text-3xl font-black text-white uppercase italic tracking-tighter leading-none drop-shadow-lg">
              {academy.name}
            </h2>
            <div className="flex items-center gap-3 mt-3">
              {academy.rating && (
                <div className="flex items-center gap-1 bg-primary px-3 py-1 rounded-none text-white text-xs font-black italic">
                  <Star className="h-3 w-3 fill-current" /> {academy.rating}
                </div>
              )}
              <div className="bg-white text-black text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-none italic">
                Operational Matrix Active
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {!showTrialForm ? (
            <>
              <div className="grid grid-cols-1 gap-6">
                <div className="flex items-start gap-6 border-l-4 border-primary pl-6">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Deployment Address</p>
                    <p className="text-lg font-black uppercase italic tracking-tight">{academy.address}</p>
                  </div>
                </div>

                {academy.phone && (
                  <div className="flex items-start gap-6 border-l-4 border-primary pl-6">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Comm Link</p>
                      <p className="text-lg font-black italic tracking-widest text-primary">{academy.phone}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 space-y-6">
                <div className="p-8 rounded-none bg-secondary/5 border-2 border-border space-y-6 relative overflow-hidden">
                  <Zap className="absolute top-0 right-0 h-32 w-32 text-primary opacity-5 rotate-12 -translate-y-8 translate-x-8" />
                  <div className="space-y-2 relative z-10">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] italic">Mission: First Visit Protocol</p>
                    <div className="flex items-center gap-6">
                      <div className="relative">
                        <span className="text-4xl font-black text-muted-foreground opacity-40 italic line-through decoration-primary decoration-4 leading-none">$20</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-7xl font-black text-primary leading-none tracking-tighter italic drop-shadow-sm">FREE</span>
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] italic">INTRO SESSION</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-wide leading-relaxed relative z-10">
                    Join the legacy. Master the art. One introductory fundamental session available for immediate deployment. Certified command structure and safe operational parameters guaranteed.
                  </p>
                  
                  <Button 
                    onClick={() => setShowTrialForm(true)}
                    className="w-full h-16 bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest italic text-sm rounded-none shadow-xl shadow-primary/20 transition-all relative z-10"
                  >
                    REQUEST FREE TRIAL CLASS
                    <Send className="ml-3 h-5 w-5" />
                  </Button>
                </div>
                
                {academy.websiteUri && (
                  <Button asChild variant="ghost" className="w-full h-10 font-black uppercase tracking-[0.3em] text-[10px] gap-2 text-muted-foreground hover:text-primary transition-colors">
                    <a href={academy.websiteUri} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3 w-3" /> ACCESS DIGITAL HUB
                    </a>
                  </Button>
                )}
              </div>
            </>
          ) : (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-2 border-l-4 border-primary pl-6">
                <h3 className="text-2xl font-headline text-2xl font-black uppercase italic tracking-tighter text-primary">Unit Provisioning</h3>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Register credentials to schedule your first introductory engagement.</p>
              </div>

              {isSent ? (
                <div className="py-16 flex flex-col items-center justify-center text-center space-y-6">
                  <div className="h-20 w-20 bg-green-600/10 border-4 border-green-600 flex items-center justify-center rotate-45">
                    <CheckCircle2 className="h-10 w-10 text-green-600 -rotate-45" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-2xl font-black uppercase italic tracking-tighter">DATA SECURED</h4>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">HANDSHAKE COMPLETE. STANDBY FOR MISSION COMM.</p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSendRequest} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">TAC CALLSIGN (FULL NAME)</Label>
                    <Input 
                      id="name" 
                      placeholder="ENTER NAME..." 
                      className="h-14 bg-background border-2 border-border rounded-none focus-visible:ring-primary font-black uppercase italic"
                      value={name}
                      onChange={(e) => setName(e.target.value.toUpperCase())}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">COMM CHANNEL (PHONE)</Label>
                    <Input 
                      id="phone" 
                      type="tel"
                      placeholder="+1 (XXX) XXX-XXXX" 
                      className="h-14 bg-background border-2 border-border rounded-none focus-visible:ring-primary font-black tracking-widest"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                  </div>
                  <div className="pt-6 flex gap-4">
                    <Button 
                      type="button"
                      variant="outline" 
                      className="flex-1 h-14 rounded-none font-black uppercase italic text-xs border-2"
                      onClick={() => setShowTrialForm(false)}
                    >
                      ABORT
                    </Button>
                    <Button 
                      type="submit"
                      className="flex-[2] h-14 bg-primary hover:bg-primary/90 text-white rounded-none font-black uppercase italic tracking-widest text-xs shadow-xl"
                    >
                      ESTABLISH LINK
                    </Button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
