"use client";

import { Academy } from "@/lib/academies";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Phone, Star, ChevronRight, Navigation } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";

interface AcademyCardProps {
  academy: Academy;
  onClick: (academy: Academy) => void;
  isSelected?: boolean;
  index: number;
}

export function AcademyCard({ academy, onClick, isSelected, index }: AcademyCardProps) {
  const distanceMiles = academy.distance ? (academy.distance / 1609.34).toFixed(1) : null;
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // Tactical Photo Resolution
  let photoUrl = `https://picsum.photos/seed/${academy.id}/600/400`;
  if (academy.photos && academy.photos.length > 0) {
    const photo = academy.photos[0];
    const photoName = typeof photo === 'string' ? photo : photo.name;
    if (photoName && photoName.startsWith('places/')) {
      photoUrl = `https://places.googleapis.com/v1/${photoName}/media?key=${apiKey}&maxWidthPx=800`;
    } else if (typeof photo === 'string' && photo.startsWith('http')) {
      photoUrl = photo;
    }
  }

  return (
    <Card 
      className={`cursor-pointer transition-all duration-300 hover:border-primary/50 group overflow-hidden relative rounded-none border-2 ${isSelected ? 'border-primary bg-primary/5 shadow-[8px_8px_0px_rgba(225,29,72,0.1)]' : 'border-border bg-card'}`}
      onClick={() => onClick(academy)}
    >
      <div className="absolute top-0 right-0 w-1/2 h-32 opacity-50 group-hover:opacity-90 transition-opacity duration-500 pointer-events-none overflow-hidden">
        <Image 
          src={photoUrl} 
          alt=""
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-card/90 via-card/20 to-transparent" />
      </div>

      <div className="absolute top-0 left-0 w-12 h-12 bg-primary flex items-center justify-center border-r-2 border-b-2 border-primary z-10">
        <span className="text-white font-black italic text-lg">#{index + 1}</span>
      </div>

      <CardContent className="p-6 pt-10 relative z-20">
        <div className="flex justify-between items-start mb-4">
          <h3 className="font-headline font-black text-xl group-hover:text-primary transition-colors leading-tight pr-4 uppercase italic tracking-tighter">
            {academy.name}
          </h3>
          <div className="flex flex-col items-end gap-2 shrink-0">
            {academy.rating && (
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 gap-1 font-black rounded-none px-2 py-0.5 text-[10px]">
                <Star className="h-3 w-3 fill-current" /> {academy.rating}
              </Badge>
            )}
            {distanceMiles && (
              <Badge variant="outline" className="border-border text-muted-foreground font-bold gap-1 bg-background rounded-none text-[9px]">
                <Navigation className="h-3 w-3" /> {distanceMiles} MI
              </Badge>
            )}
          </div>
        </div>
        
        <div className="space-y-3 text-sm text-muted-foreground">
          <div className="flex items-start gap-3">
            <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
            <span className="font-bold uppercase tracking-tight leading-snug">{academy.address}</span>
          </div>
          
          {academy.phone && (
            <div className="flex items-center gap-3 py-1 px-3 bg-secondary/5 border-2 border-border rounded-none w-fit">
              <Phone className="h-4 w-4 shrink-0 text-primary" />
              <span className="font-black italic text-foreground tracking-widest text-xs">{academy.phone}</span>
            </div>
          )}
        </div>

        <div className="mt-6 pt-4 border-t-2 border-border flex justify-between items-center">
          <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] italic">
            TACTICAL UNIT READY
          </span>
          <span className="text-foreground text-xs font-black flex items-center gap-1 group-hover:gap-2 transition-all uppercase italic">
            ACCESS MATRIX <ChevronRight className="h-3 w-3 text-primary" />
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
