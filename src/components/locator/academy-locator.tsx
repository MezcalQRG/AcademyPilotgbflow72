"use client";

import { useState, useCallback } from "react";
import { Academy, findFranchise, getPlaceDetails, geocodeAddress } from "@/lib/academies";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Navigation, List, SlidersHorizontal, Loader2, Zap, LayoutGrid } from "lucide-react";
import { AcademyCard } from "./academy-card";
import { AcademyDetailsDialog } from "./academy-details-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

export function AcademyLocator() {
  const [searchQuery, setSearchQuery] = useState("");
  const [radius, setRadius] = useState(20);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [selectedAcademy, setSelectedAcademy] = useState<Academy | null>(null);
  const [academies, setAcademies] = useState<Academy[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const performSearch = useCallback(async (location: {lat: number, lng: number}) => {
    setIsSearching(true);
    try {
      const results = await findFranchise(location, radius * 1609.34);
      setAcademies(results);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsSearching(false);
    }
  }, [radius]);

  const handleGeolocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = { lat: position.coords.latitude, lng: position.coords.longitude };
          setUserLocation(loc);
          setSearchQuery("CURRENT TACTICAL POS.");
          performSearch(loc);
        },
        (error) => { console.error("Geolocation error:", error); }
      );
    }
  };

  const handleFind = async () => {
    setIsSearching(true);
    if (searchQuery === "CURRENT TACTICAL POS." && userLocation) {
      await performSearch(userLocation);
      return;
    }
    if (searchQuery.trim()) {
      const geocoded = await geocodeAddress(searchQuery);
      if (geocoded) {
        setUserLocation(geocoded);
        await performSearch(geocoded);
      } else {
        setIsSearching(false);
      }
    } else {
      handleGeolocation();
    }
  };

  const handleSelectAcademy = async (academy: Academy) => {
    const details = await getPlaceDetails(academy.id);
    setSelectedAcademy(details || academy);
  };

  return (
    <div className="flex flex-col gap-12 w-full max-w-7xl mx-auto px-4">
      {/* Tactical Entry Console */}
      <div className="bg-card border-4 border-border rounded-none p-8 shadow-[12px_12px_0px_rgba(0,0,0,0.1)] relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5">
          <Zap size={200} className="rotate-12" />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end relative z-10">
          <div className="lg:col-span-6 space-y-4">
            <label className="text-[10px] font-black text-primary uppercase tracking-[0.4em] italic ml-1">Grid Coordinates (Location)</label>
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input 
                placeholder="ENTER CITY, STATE, OR ZIP..." 
                className="pl-12 h-16 bg-background border-2 border-border rounded-none focus-visible:ring-primary text-lg font-black uppercase italic"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleFind()}
              />
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleGeolocation}
                className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 hover:bg-primary/10 hover:text-primary rounded-none transition-all"
                title="Use current location"
              >
                <Navigation className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-4">
            <label className="text-[10px] font-black text-primary uppercase tracking-[0.4em] italic ml-1">Engagement Radius (MI)</label>
            <div className="flex gap-2 p-1 bg-background border-2 border-border rounded-none">
              {[10, 20, 50, 100].map((r) => (
                <Button 
                  key={r}
                  variant="ghost"
                  onClick={() => setRadius(r)}
                  className={`flex-1 h-12 rounded-none font-black italic text-sm transition-all ${radius === r ? 'bg-primary text-white shadow-lg' : 'text-muted-foreground hover:text-primary hover:bg-primary/5'}`}
                >
                  {r}
                </Button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2">
             <Button 
              className="w-full h-16 bg-primary hover:bg-primary/90 text-white font-black uppercase italic tracking-widest text-sm gap-3 rounded-none shadow-xl transition-all hover:scale-[1.02]" 
              onClick={handleFind}
              disabled={isSearching}
             >
               {isSearching ? <Loader2 className="h-6 w-6 animate-spin" /> : <SlidersHorizontal className="h-6 w-6" />}
               SCAN GRID
             </Button>
          </div>
        </div>
      </div>

      {/* Deployment Results */}
      <div className="flex flex-col gap-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-l-4 border-primary pl-6">
          <div className="space-y-1">
            <h2 className="text-4xl font-headline font-black uppercase italic tracking-tighter flex items-center gap-3">
              Fleet Registry <span className="text-primary">({academies.length})</span>
            </h2>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Intelligence: Tactical Units Deployed in Search Perimeter</p>
          </div>
          <Badge className="rounded-none bg-secondary/10 text-foreground border-2 border-border px-4 py-1.5 font-black uppercase italic text-[10px] tracking-widest">
            PROXIMITY SORT ACTIVE
          </Badge>
        </div>

        <div className="min-h-[600px]">
          {academies.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
              {academies.map((academy, index) => (
                <AcademyCard 
                  key={academy.id} 
                  academy={academy} 
                  index={index}
                  onClick={() => handleSelectAcademy(academy)}
                  isSelected={selectedAcademy?.id === academy.id}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-32 bg-card/30 rounded-none border-4 border-dashed border-border/60">
              {isSearching ? (
                <div className="space-y-6 text-center">
                  <div className="relative">
                    <div className="h-24 w-24 border-4 border-primary/20 border-t-primary rounded-none rotate-45 animate-spin mx-auto" />
                    <Zap className="h-8 w-8 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  </div>
                  <p className="text-primary font-black uppercase italic tracking-[0.3em] text-xs animate-pulse">Scanning Grid Coordinates...</p>
                </div>
              ) : (
                <div className="text-center space-y-8 max-w-sm px-6">
                  <div className="h-24 w-24 bg-secondary/10 border-2 border-border rotate-45 flex items-center justify-center mx-auto opacity-40">
                    <MapPin className="h-10 w-10 text-muted-foreground -rotate-45" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black uppercase italic tracking-tighter">Handshake Required</h3>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground leading-relaxed">
                      Initialize coordinates or activate geolocation to manifest academy units within your operational theater.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <AcademyDetailsDialog 
        academy={selectedAcademy} 
        onClose={() => setSelectedAcademy(null)} 
      />
    </div>
  );
}
