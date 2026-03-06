
"use client";

import { useCheckIn, CheckInProvider } from '@/context/checkin-context';
import { LiveClock } from '@/components/checkin/live-clock';
import { ClassQueue } from '@/components/checkin/class-queue';
import { CheckInQR } from '@/components/checkin/check-in-qr';
import { Badge } from '@/components/ui/badge';
import { Zap } from 'lucide-react';

function CheckInDisplayContent() {
  const { activeClass } = useCheckIn();

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      <header className="h-20 border-b-4 border-border bg-card/50 flex items-center px-12 justify-between">
        <div className="flex items-center gap-4">
          <Zap className="h-8 w-8 text-primary" />
          <div className="flex flex-col leading-none">
            <span className="font-headline text-3xl font-black tracking-tighter uppercase italic text-primary">GRACIE BARRA AI</span>
            <span className="font-headline text-sm font-bold tracking-widest uppercase">Live Dispatch Dashboard</span>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Mission Control</p>
            <p className="font-black uppercase italic">Gracie Barra HQ</p>
          </div>
          <div className="w-12 h-12 bg-primary flex items-center justify-center text-white font-black italic text-xl">GB</div>
        </div>
      </header>

      <main className="container mx-auto px-12 py-16 flex flex-col lg:flex-row lg:justify-between items-center gap-24">
        {/* Left Matrix: Ops */}
        <div className="w-full lg:w-1/2 flex flex-col items-start space-y-12 animate-in slide-in-from-left-8 duration-700">
          <div className="space-y-4">
            <Badge className="bg-primary/10 text-primary border-2 border-primary/20 rounded-none px-6 py-1.5 font-black uppercase tracking-[0.3em] text-[10px] italic">
              Operational Matrix Active
            </Badge>
            <h1 className="text-6xl lg:text-8xl font-black uppercase italic tracking-tighter leading-none">
              {activeClass?.name || 'STANDBY'}
            </h1>
            <p className="text-2xl text-muted-foreground font-bold uppercase italic tracking-tight border-l-4 border-primary pl-6">
              Command: {activeClass?.instructor || 'UNIT TBD'}
            </p>
          </div>

          <LiveClock targetTime={activeClass?.startTime} />
          
          <ClassQueue attendees={activeClass?.attendees || []} />
        </div>

        {/* Right Matrix: Link */}
        <div className="w-full lg:w-1/2 flex items-center justify-center lg:justify-end animate-in fade-in zoom-in-95 duration-1000 delay-300">
          <CheckInQR />
        </div>
      </main>
    </div>
  );
}

export default function CheckInDisplayPage() {
  return (
    <CheckInProvider>
      <CheckInDisplayContent />
    </CheckInProvider>
  );
}
