'use client';

import React, { useState, useTransition } from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createCampaignAction, enhanceImageAction, testConnectionAction, getAdImagesAction } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AdPreview from './ad-preview';
import { Building, KeyRound, Image as ImageIcon, Wand2, Loader2, Sparkles, Plug, Unplug, CheckCircle2, LibraryBig } from 'lucide-react';
import type { CampaignStructure, AdImage } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';

const campaignSchema = z.object({
  adAccountID: z.string().min(1, 'Ad Account ID is required.'),
  apiKey: z.string().min(1, 'API Key is required.'),
  pageID: z.string().min(1, 'Facebook Page ID is required.'),
  businessInformation: z.string().min(50, 'Please provide at least 50 characters about your academy.'),
  enhancementPrompt: z.string().optional(),
});

type CampaignFormValues = z.infer<typeof campaignSchema>;

export default function CampaignCreator() {
  const [generatePending, startGenerateTransition] = useTransition();
  const [enhancePending, startEnhanceTransition] = useTransition();
  const [testConnectionPending, startTestConnectionTransition] = useTransition();
  
  const [campaignData, setCampaignData] = useState<CampaignStructure | null>(null);
  const [uploadedImageUri, setUploadedImageUri] = useState<string | null>(null);
  const [selectedExistingImages, setSelectedExistingImages] = useState<AdImage[]>([]);
  const [adImages, setAdImages] = useState<AdImage[]>([]);
  const [isAutopilot, setIsAutopilot] = useState(false);

  const [connectionStatus, setConnectionStatus] = useState({
    isConnected: false,
    isTesting: false,
    accountName: '',
  });

  const { toast } = useToast();
  const { register, handleSubmit, getValues, watch, formState: { errors } } = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignSchema),
    mode: "onChange",
  });

  const formValues = watch();
  const finalImageUris = [...selectedExistingImages.map(img => img.url), ...(uploadedImageUri ? [uploadedImageUri] : [])];

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => setUploadedImageUri(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleTestConnection = () => {
    const { adAccountID, apiKey } = getValues();
    setConnectionStatus(prev => ({ ...prev, isTesting: true }));
    startTestConnectionTransition(async () => {
      const result = await testConnectionAction({ adAccountID, apiKey });
      if (result.status === 'success') {
        setConnectionStatus({ isConnected: true, accountName: result.data!.accountName, isTesting: false });
        const imagesResult = await getAdImagesAction({ adAccountID, apiKey });
        if (imagesResult.status === 'success') setAdImages(imagesResult.data!);
      } else {
        setConnectionStatus(prev => ({ ...prev, isTesting: false }));
        toast({ variant: "destructive", title: "Connection Failed", description: result.message });
      }
    });
  };

  const onFormSubmit = (data: CampaignFormValues) => {
    if (finalImageUris.length === 0) {
        toast({ variant: "destructive", title: "Image required" });
        return;
    }
    startGenerateTransition(async () => {
        const result = await createCampaignAction({ ...data, imageURIs: finalImageUris, isAutopilot });
        if (result.status === 'success') {
          setCampaignData(result.data!);
        } else {
           toast({ variant: "destructive", title: "Generation Failed", description: result.message });
        }
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-8">
        <Card className="rounded-none border-2 border-border">
          <CardHeader className="flex flex-row items-center gap-4 bg-secondary/5">
            <KeyRound className="w-8 h-8 text-primary" />
            <div>
              <CardTitle className="font-headline uppercase italic">Step 1: Meta Credentials</CardTitle>
              <CardDescription className="text-[10px] uppercase font-bold tracking-widest">Connect your academy's ad account</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest">Ad Account ID</Label>
              <Input {...register('adAccountID')} placeholder="act_XXXXXXXXX" className="rounded-none border-2" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest">Facebook Page ID</Label>
              <Input {...register('pageID')} placeholder="1234567890" className="rounded-none border-2" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest">Access Token</Label>
              <Input type="password" {...register('apiKey')} className="rounded-none border-2" />
            </div>
            <Button type="button" onClick={handleTestConnection} disabled={connectionStatus.isTesting} className="w-full bg-primary hover:bg-primary/90 text-white rounded-none font-black uppercase italic tracking-widest h-12">
              {connectionStatus.isTesting ? <Loader2 className="animate-spin" /> : <Plug className="mr-2 h-4 w-4" />}
              {connectionStatus.isConnected ? "Account Connected" : "Verify Connection"}
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-none border-2 border-border">
          <CardHeader className="flex flex-row items-center gap-4 bg-secondary/5">
            <Building className="w-8 h-8 text-primary" />
            <div>
              <CardTitle className="font-headline uppercase italic">Step 2: Academy Info</CardTitle>
              <CardDescription className="text-[10px] uppercase font-bold tracking-widest">What are we promoting today?</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <Textarea {...register('businessInformation')} placeholder="Describe your program, target audience, and key benefits..." rows={6} className="rounded-none border-2" />
          </CardContent>
        </Card>

        <Card className="rounded-none border-2 border-border">
          <CardHeader className="flex flex-row items-center gap-4 bg-secondary/5">
            <ImageIcon className="w-8 h-8 text-primary" />
            <div>
              <CardTitle className="font-headline uppercase italic">Step 3: Creative Assets</CardTitle>
              <CardDescription className="text-[10px] uppercase font-bold tracking-widest">Upload or select training photos</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <Input type="file" accept="image/*" onChange={handleImageUpload} className="rounded-none border-2" />
            
            {adImages.length > 0 && (
              <ScrollArea className="w-full whitespace-nowrap">
                <div className="flex space-x-4 pb-4">
                  {adImages.map((image) => (
                    <button type="button" key={image.hash} onClick={() => setSelectedExistingImages([image])} className={cn("shrink-0 rounded-none border-2", selectedExistingImages[0]?.hash === image.hash ? "border-primary" : "border-transparent")}>
                      <div className="relative w-32 h-32">
                        <Image src={image.url} alt="Library" fill className="object-cover" />
                      </div>
                    </button>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        <Button type="submit" disabled={generatePending || !connectionStatus.isConnected} className="w-full bg-primary hover:bg-primary/90 text-white rounded-none font-black uppercase italic tracking-widest h-16 text-xl">
          {generatePending ? <Loader2 className="animate-spin mr-2" /> : <Wand2 className="mr-2" />}
          Generate High-Performance Campaign
        </Button>
      </form>

      <div className="sticky top-24">
        {campaignData ? (
          <AdPreview 
            campaign={campaignData} 
            images={finalImageUris}
            imageHashes={selectedExistingImages.map(i => i.hash)}
            adAccountID={formValues.adAccountID}
            apiKey={formValues.apiKey}
            pageID={formValues.pageID}
            isAutopilot={isAutopilot}
          />
        ) : (
          <div className="border-4 border-dashed border-border p-12 flex flex-col items-center justify-center text-center opacity-40">
            <Megaphone className="h-20 w-20 mb-6 text-primary" />
            <h3 className="font-headline text-2xl font-black uppercase italic">Deployment Hub</h3>
            <p className="font-bold text-[10px] uppercase tracking-widest">Configure your campaign to unlock preview</p>
          </div>
        )}
      </div>
    </div>
  );
}

import { Megaphone } from 'lucide-react';
