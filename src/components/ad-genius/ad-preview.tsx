"use client";

import React, { useState, useTransition, useEffect } from "react";
import Image from "next/image";
import { format } from "date-fns";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { CampaignStructure } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, Loader2, Check, Globe, Building, CalendarIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { publishCampaignAction } from "@/app/actions";
import { CALL_TO_ACTION_TYPES } from "@/lib/meta-options";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext, type CarouselApi } from "@/components/ui/carousel";

interface AdPreviewProps {
  campaign: CampaignStructure;
  images: string[];
  imageHashes?: string[];
  adAccountID: string;
  apiKey: string;
  pageID: string;
  isAutopilot: boolean;
}

export default function AdPreview({ campaign, images, imageHashes, adAccountID, apiKey, pageID, isAutopilot }: AdPreviewProps) {
  const [isPosting, startPostingTransition] = useTransition();
  const [isPosted, setIsPosted] = useState(false);
  const { toast } = useToast();
  
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentTextIndex, setCurrentTextIndex] = useState(0);

  const [budgetType, setBudgetType] = useState<'daily' | 'lifetime'>('daily');
  const [dailyBudget, setDailyBudget] = useState(10);
  const [lifetimeBudget, setLifetimeBudget] = useState(500);
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(() => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date;
  });

  const [targetingType, setTargetingType] = useState<'country' | 'radius'>('country');
  const [targetingCountry, setTargetingCountry] = useState('US');
  const [ageRange, setAgeRange] = useState([18, 65]);
  const [address, setAddress] = useState('');
  const [radius, setRadius] = useState(10);
  const [distanceUnit, setDistanceUnit] = useState<'mile' | 'kilometer'>('mile');
  const [callToActionType, setCallToActionType] = useState(campaign.callToActionType);
  const [callToActionLink, setCallToActionLink] = useState('https://www.facebook.com');

  useEffect(() => {
    if (!carouselApi) return;
    const onSelect = () => setCurrentTextIndex(carouselApi.selectedScrollSnap() % campaign.adCreativeTexts.length);
    carouselApi.on('select', onSelect);
    return () => { carouselApi.off('select', onSelect); }
  }, [carouselApi, campaign]);

  const handlePost = () => {
    startPostingTransition(async () => {
        let targetingPayload: any = { age_min: ageRange[0], age_max: ageRange[1] };
        if (targetingType === 'country') {
            targetingPayload.geo_locations = { countries: [targetingCountry] };
        } else {
            targetingPayload.geo_locations = { custom_locations: [{ address_string: address, radius, distance_unit: distanceUnit }] };
        }

        const result = await publishCampaignAction({
            adAccountID, apiKey, pageID,
            campaignName: campaign.campaignName,
            adSetName: campaign.adSetName,
            adCreativeTexts: campaign.adCreativeTexts,
            imageURI: images.find(img => img.startsWith('data:')),
            imageHashes,
            isAutopilot,
            budgetType,
            dailyBudget: budgetType === 'daily' ? dailyBudget : undefined,
            lifetimeBudget: budgetType === 'lifetime' ? lifetimeBudget : undefined,
            startTime: budgetType === 'lifetime' ? startDate?.toISOString() : undefined,
            endTime: budgetType === 'lifetime' ? endDate?.toISOString() : undefined,
            targeting: targetingPayload,
            campaignObjective: campaign.campaignObjective,
            optimizationGoal: campaign.optimizationGoal,
            callToActionType,
            callToActionLink,
        });

        if (result.status === 'success') {
            setIsPosted(true);
            toast({ title: "Ad Posted!", description: result.message });
        } else {
            toast({ variant: "destructive", title: "Failed to post ad", description: result.message });
        }
    });
  };

  return (
    <Card className="shadow-xl rounded-none border-2 border-border">
      <CardHeader className="bg-secondary/5 border-b border-border">
        <CardTitle className="font-headline uppercase italic">Campaign Preview</CardTitle>
        <div className="flex flex-wrap gap-2 pt-2">
            <Badge variant="outline" className="font-bold text-[10px] uppercase">{campaign.campaignObjective.replace('OUTCOME_', '')}</Badge>
            <Badge variant="outline" className="font-bold text-[10px] uppercase">Goal: {campaign.optimizationGoal}</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="border border-border rounded-none overflow-hidden bg-background">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
                <div className="w-10 h-10 bg-primary flex items-center justify-center">
                    <Building className="w-5 h-5 text-white" />
                </div>
                <div>
                    <p className="font-black uppercase italic text-sm leading-none">Academia Pilot</p>
                    <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground flex items-center gap-1">
                        Sponsored <Globe className="w-3 h-3"/>
                    </p>
                </div>
            </div>
            <p className="text-sm mb-3 whitespace-pre-wrap font-medium">{campaign.adCreativeTexts[currentTextIndex]}</p>
          </div>

          <Carousel setApi={setCarouselApi} className="w-full">
            <CarouselContent>
              {images.map((imgSrc, index) => (
                <CarouselItem key={index}>
                  <div className="relative aspect-[1200/628] bg-muted">
                    <Image src={imgSrc} alt="Preview" fill className="object-cover" />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            {images.length > 1 && (
              <>
                <CarouselPrevious className="left-4" />
                <CarouselNext className="right-4" />
              </>
            )}
          </Carousel>
          
          <div className="p-3 bg-secondary/10 flex justify-between items-center border-t border-border">
            <span className="text-[10px] font-black uppercase tracking-widest">your-academy.com</span>
            <Button size="sm" className="bg-primary hover:bg-primary/90 text-white rounded-none font-bold uppercase text-[10px]" disabled={callToActionType === 'NONE'}>
                {callToActionType !== 'NONE' ? callToActionType.replace(/_/g, ' ') : 'Learn More'}
            </Button>
          </div>
        </div>
      </CardContent>
      <CardFooter className="bg-secondary/5 p-6 border-t border-border">
        <Button 
            onClick={handlePost} 
            disabled={isPosting || isPosted || !adAccountID || !apiKey || !pageID}
            className="w-full bg-primary hover:bg-primary/90 text-white rounded-none font-black uppercase italic tracking-widest h-14"
        >
            {isPosting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : isPosted ? <Check className="mr-2 h-5 w-5" /> : <Send className="mr-2 h-5 w-5" />}
            {isPosted ? "Campaign Launched" : "Launch Meta Campaign"}
        </Button>
      </CardFooter>
    </Card>
  );
}
