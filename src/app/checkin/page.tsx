"use client";

import { CheckInProvider, useCheckIn } from '@/context/checkin-context';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Loader2, Zap } from 'lucide-react';

function CheckInContent() {
  const { checkIn, activeClass } = useCheckIn();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    setLoading(true);
    
    setTimeout(() => {
      checkIn(name);
      setLoading(false);
      setSuccess(true);
      setTimeout(() => router.push('/'), 3000);
    }, 1500);
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-primary">
        <div className="text-center space-y-6 text-white animate-in zoom-in-95 duration-500">
          <CheckCircle2 className="w-32 h-32 mx-auto drop-shadow-xl" />
          <h1 className="text-7xl font-black italic uppercase tracking-tighter">OSS!</h1>
          <p className="text-xl font-bold uppercase tracking-widest opacity-80">
            Mission Accepted.<br/>REPORT TO THE MATS.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="absolute inset-0 opacity-5 pointer-events-none overflow-hidden">
        <Zap size={800} className="text-primary -rotate-12 absolute -top-40 -left-40" />
      </div>

      <Card className="w-full max-w-md rounded-none border-4 border-border shadow-[12px_12px_0px_rgba(0,0,0,0.1)] relative z-10 bg-card">
        <CardHeader className="text-center bg-secondary/5 border-b-4 border-border p-8">
          <div className="w-16 h-16 bg-primary flex items-center justify-center text-white mx-auto mb-4 p-2">
            <img 
              src="https://graciebarra.com/wp-content/uploads/2025/07/logos-barra-shield.svg" 
              alt="GB Shield" 
              className="w-full h-full object-contain brightness-0 invert"
            />
          </div>
          <CardTitle className="text-4xl font-black italic uppercase tracking-tighter">Unit Check-In</CardTitle>
          <p className="text-primary font-black uppercase tracking-widest text-[10px] mt-2">
            Protocol: {activeClass?.name || 'Class Enrollment'}
          </p>
        </CardHeader>
        <CardContent className="p-8">
          <form onSubmit={handleCheckIn} className="space-y-8">
            <div className="space-y-3">
              <Label htmlFor="name" className="text-[10px] uppercase font-black tracking-[0.3em] text-muted-foreground">
                Tactical Callsign (Full Name)
              </Label>
              <Input
                id="name"
                placeholder="ENTER NAME..."
                value={name}
                onChange={(e) => setName(e.target.value.toUpperCase())}
                className="h-14 bg-background border-2 border-border rounded-none focus-visible:ring-primary text-lg font-black uppercase italic"
                autoFocus
              />
            </div>
            <Button 
              type="submit" 
              className="w-full h-16 text-xl font-black uppercase italic tracking-widest rounded-none bg-primary hover:bg-primary/90 shadow-xl"
              disabled={loading || !name}
            >
              {loading ? (
                <Loader2 className="w-8 h-8 animate-spin" />
              ) : (
                'ESTABLISH PRESENCE'
              )}
            </Button>
            <p className="text-center text-[9px] text-muted-foreground uppercase font-black tracking-widest opacity-60">
              By engaging, you confirm readiness for high-intensity training.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CheckInPage() {
  return (
    <CheckInProvider>
      <CheckInContent />
    </CheckInProvider>
  );
}
