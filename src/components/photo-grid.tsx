"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface PhotoGridProps {
  photoUrls: string[];
  variant?: 'standard' | 'mosaic';
}

export function PhotoGrid({ photoUrls, variant = 'standard' }: PhotoGridProps) {
  const [currentPhotos, setCurrentPhotos] = useState<string[]>([]);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    if (photoUrls.length === 0) return;

    // Tactical configuration based on visual variant
    const maxPhotos = variant === 'mosaic' ? 60 : 12;
    const maxWidth = variant === 'mosaic' ? 400 : 1024;

    // Process photo URLs to handle Google Places resource names with optimized resolution
    const formattedUrls = photoUrls.map(urlOrRef => {
      if (urlOrRef.startsWith('places/')) {
        return `https://places.googleapis.com/v1/${urlOrRef}/media?key=${apiKey}&maxWidthPx=${maxWidth}`;
      }
      return urlOrRef;
    });

    // Populate the tactical registry, looping if necessary to fill the density requirements
    let displayList = [...formattedUrls];
    while (displayList.length < maxPhotos && formattedUrls.length > 0) {
      displayList = [...displayList, ...formattedUrls];
    }
    setCurrentPhotos(displayList.slice(0, maxPhotos));

    // Dynamic rotation protocol: swap individual tiles randomly to maintain a live environment feel
    const interval = setInterval(() => {
      setCurrentPhotos(prev => {
        const next = [...prev];
        const replaceIndex = Math.floor(Math.random() * next.length);
        const unusedPhotos = formattedUrls.filter(p => !next.includes(p));
        
        if (unusedPhotos.length > 0) {
          next[replaceIndex] = unusedPhotos[Math.floor(Math.random() * unusedPhotos.length)];
        }
        return next;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [photoUrls, apiKey, variant]);

  if (currentPhotos.length === 0) {
    return (
      <div className="absolute inset-0 bg-zinc-900">
        <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/gb/1920/1080')] bg-cover bg-center opacity-40" />
        <div className="absolute inset-0 bg-black/20" />
      </div>
    );
  }

  const gridClasses = variant === 'mosaic'
    ? "grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 h-full w-full opacity-100"
    : "grid grid-cols-2 md:grid-cols-4 grid-rows-6 md:grid-rows-3 h-full w-full opacity-100";

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-zinc-950">
      <div className={gridClasses}>
        {currentPhotos.map((photo, index) => (
          <div key={`${photo}-${index}`} className="relative h-full w-full border border-white/5">
            <Image
              src={photo}
              alt="Academy Environment"
              fill
              style={{ objectFit: 'cover' }}
              className="animate-in fade-in duration-1000"
              sizes={variant === 'mosaic' ? "10vw" : "(max-width: 768px) 50vw, 25vw"}
            />
          </div>
        ))}
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40" />
      <div className="absolute inset-0 bg-black/10" />
    </div>
  );
}
