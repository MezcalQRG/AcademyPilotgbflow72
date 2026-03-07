"use client";

import { useCheckIn } from '@/context/checkin-context';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Award, Trophy, Target, TrendingUp, Flame, Ban, Zap, Star, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { PhotoGrid } from '@/components/photo-grid';
import { getAcademyPhotos } from '@/app/actions';

export default function StudentDashboard() {
  const { currentUser, hasScanned } = useCheckIn();
  const [photos, setPhotos] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    async function loadPhotos() {
      if (!hasScanned) {
        const academyPhotos = await getAcademyPhotos("310 S Glendora Ave West Covina 91790");
        setPhotos(academyPhotos);
      }
    }
    loadPhotos();
  }, [hasScanned]);

  if (!hasScanned) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background text-center relative overflow-hidden">
        {/* Tactical Background Matrix */}
        <div className="absolute inset-0 z-0">
          <PhotoGrid photoUrls={photos} />
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />
        </div>

        <div className="relative z-10 space-y-8 animate-in fade-in zoom-in-95 duration-700">
          <div className="w-24 h-24 bg-primary/10 border-4 border-primary flex items-center justify-center rotate-45 animate-pulse mx-auto">
            <Ban className="w-10 h-10 text-primary -rotate-45" />
          </div>
          <div className="space-y-4 max-w-md mx-auto">
            <h1 className="text-4xl font-black uppercase italic tracking-tighter text-foreground drop-shadow-md">Handshake Required</h1>
            <p className="text-muted-foreground font-bold uppercase tracking-widest text-[10px] bg-background/80 py-2 px-4 border border-border inline-block">
              Operational data encrypted. Please scan the academy matrix to initialize your dashboard.
            </p>
            <button 
              onClick={() => router.push('/student/scan')}
              className="w-full bg-primary hover:bg-primary/90 text-white font-black uppercase italic h-16 tracking-[0.2em] shadow-2xl transition-transform hover:scale-105 active:scale-95"
            >
              ENGAGE SCANNER
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-12 max-w-6xl space-y-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-l-8 border-primary pl-10">
        <div>
          <Badge className="mb-4 bg-primary text-white font-black uppercase italic tracking-widest rounded-none">
            LEVEL 42 TACTICAL UNIT
          </Badge>
          <h1 className="text-6xl font-black tracking-tighter uppercase italic leading-none">{currentUser.name}</h1>
          <p className="text-xl text-muted-foreground font-black uppercase italic tracking-widest mt-2">
            {currentUser.belt} BELT // {currentUser.stripes} STRIPES
          </p>
        </div>
        <div className="flex items-center gap-8 bg-card p-6 border-4 border-border shadow-[8px_8px_0px_rgba(0,0,0,0.1)]">
          <div className="text-center">
            <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">MISSIONS</div>
            <div className="text-4xl font-black italic">{currentUser.classesAttended}</div>
          </div>
          <div className="w-1 h-12 bg-border"></div>
          <div className="text-center">
            <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">STREAK</div>
            <div className="text-4xl font-black italic text-primary flex items-center gap-2">
              <Flame className="w-8 h-8 fill-current" /> {currentUser.streak}
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="md:col-span-2 rounded-none border-4 border-border bg-card shadow-lg">
          <CardHeader className="bg-secondary/5 border-b-2 border-border">
            <CardTitle className="flex items-center gap-3 font-headline text-xl font-black uppercase italic">
              <Target className="w-6 h-6 text-primary" /> Active Directives
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-10">
            {currentUser.goals.map((goal) => (
              <div key={goal.title} className="space-y-4">
                <div className="flex justify-between items-end">
                  <span className="text-xs font-black uppercase tracking-[0.2em]">{goal.title}</span>
                  <span className="text-lg font-black italic text-primary">{goal.current} / {goal.target}</span>
                </div>
                <div className="h-4 w-full bg-secondary/10 border-2 border-border p-0.5">
                  <div 
                    className="h-full bg-primary shadow-[0_0_15px_rgba(225,29,72,0.4)]" 
                    style={{ width: `${(goal.current / goal.target) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-none border-4 border-border bg-card shadow-lg">
          <CardHeader className="bg-secondary/5 border-b-2 border-border">
            <CardTitle className="flex items-center gap-3 font-headline text-xl font-black uppercase italic">
              <Award className="w-6 h-6 text-primary" /> Commendations
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 gap-4">
              {currentUser.badges.map((badge) => (
                <div key={badge} className="flex flex-col items-center justify-center p-4 bg-secondary/5 border-2 border-border group hover:border-primary transition-all">
                  <Trophy className="w-8 h-8 text-primary mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-[9px] font-black text-center uppercase leading-tight tracking-tighter">{badge}</span>
                </div>
              ))}
              <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-border opacity-30">
                <Star className="w-8 h-8 mb-2" />
                <span className="text-[9px] font-black uppercase">LOCKED</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-3 rounded-none border-4 border-border bg-card shadow-lg">
          <CardHeader className="bg-secondary/5 border-b-2 border-border">
            <CardTitle className="flex items-center gap-3 font-headline text-xl font-black uppercase italic">
              <TrendingUp className="w-6 h-6 text-primary" /> Tactical Mat Trend
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="h-48 w-full flex items-end justify-between gap-4">
              {[45, 60, 30, 90, 120, 45, 80].map((h, i) => (
                <div key={i} className="flex-1 bg-primary/10 border-2 border-border hover:border-primary transition-all relative group h-full flex flex-col justify-end">
                  <div className="bg-primary shadow-xl" style={{ height: `${(h / 120) * 100}%` }} />
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-black px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap italic">
                    {h} MINS
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest px-2">
              <span>MON</span><span>TUE</span><span>WED</span><span>THU</span><span>FRI</span><span>SAT</span><span>SUN</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
