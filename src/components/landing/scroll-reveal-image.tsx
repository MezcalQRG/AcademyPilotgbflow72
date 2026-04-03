"use client";

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

/**
 * ScrollRevealImage - A tactical component that reveals an image with 
 * a fade-in and slide-up effect triggered by scroll visibility.
 * Can be positioned bottom-right, bottom-left, or top-left (with overlap).
 */
interface ScrollRevealImageProps {
  src: string;
  alt: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-left';
  maxWidth?: string;
}

export function ScrollRevealImage({ 
  src, 
  alt, 
  position = 'bottom-right',
  maxWidth = 'max-w-2xl'
}: ScrollRevealImageProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Tactical Implementation: Intersection Observer for dynamic visibility toggle
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Toggle visibility state based on viewport intersection
        setIsVisible(entry.isIntersecting);
      },
      { 
        threshold: 0.1, // 10% visible threshold
        rootMargin: '0px 0px -50px 0px' 
      }
    );

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  // Determine the base classes for the specific tactical positions
  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return "top-0 left-0";
      case 'bottom-left':
        return "bottom-0 left-0";
      case 'bottom-right':
      default:
        return "bottom-0 right-0";
    }
  };

  // Determine the target transform state
  // top-left uses a negative Y translation to overlap the section above
  const getTransformClasses = () => {
    if (!isVisible) return "opacity-0 translate-y-[50px]";
    
    if (position === 'top-left') {
      return "opacity-100 -translate-y-1/2";
    }
    
    return "opacity-100 translate-y-0";
  };

  return (
    <div
      ref={ref}
      className={cn(
        "absolute w-full transition-all duration-700 ease-out pointer-events-none z-0",
        getPositionClasses(),
        maxWidth,
        getTransformClasses()
      )}
    >
      <div className="relative aspect-[1200/600] w-full">
        <Image
          src={src}
          alt={alt}
          fill
          className={cn(
            "object-contain",
            position === 'bottom-right' ? "object-right-bottom" : "object-left-bottom"
          )}
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </div>
    </div>
  );
}
