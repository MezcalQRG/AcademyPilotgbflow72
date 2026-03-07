
"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface PhotoGridProps {
  photoUrls: string[];
}

export function PhotoGrid({ photoUrls }: PhotoGridProps) {
  const [currentPhotos, setCurrentPhotos] = useState<string[]>([]);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    if (photoUrls.length === 0) return;

    // Use up to 12 photos for the grid
    const formattedUrls = photoUrls.map(urlOrRef => {
      // Handle potential Places API (New) photo resource names
      if (urlOrRef.startsWith('places/')) {
        return `https://places.googleapis.com/v1/${urlOrRef}/media?key=${apiKey}&maxWidthPx=1024`;
      }
      return urlOrRef;
    });

    setCurrentPhotos(formattedUrls.slice(0, 12));

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
  }, [photoUrls, apiKey]);

  if (currentPhotos.length === 0) {
    return (
      <div className="absolute inset-0 bg-black">
        <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/gb/1920/1080')] bg-cover bg-center opacity-30 blur-sm" />
        <div className="absolute inset-0 bg-black/60" />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-black">
      <div className="grid grid-cols-2 md:grid-cols-4 grid-rows-6 md:grid-rows-3 h-full w-full opacity-40">
        {currentPhotos.map((photo, index) => (
          <div key={`${photo}-${index}`} className="relative h-full w-full border border-white/5">
            <Image
              src={photo}
              alt="Academy Environment"
              fill
              style={{ objectFit: 'cover' }}
              className="animate-in fade-in duration-1000"
              sizes="(max-width: 768px) 50vw, 25vw"
            />
          </div>
        ))}
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />
      <div className="absolute inset-0 bg-black/40" />
    </div>
  );
}
