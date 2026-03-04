"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CampaignCreator from "@/components/ad-genius/campaign-creator";
import CampaignsViewer from "@/components/ad-genius/campaigns-viewer";
import { Megaphone, History } from "lucide-react";

export default function AdCampaignTool() {
  return (
    <div className="space-y-12">
      <div className="border-l-4 border-primary pl-6">
        <h1 className="font-headline text-4xl font-black uppercase italic tracking-tighter leading-none">Ad Deployment Engine</h1>
        <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mt-2">Pilot: Generating AI-Optimized Creative</p>
      </div>

      <Tabs defaultValue="creator" className="w-full">
        <TabsList className="bg-secondary/10 border-2 border-border p-1 rounded-none mb-8">
          <TabsTrigger value="creator" className="rounded-none font-black uppercase italic tracking-widest text-xs px-8 data-[state=active]:bg-primary data-[state=active]:text-white">
            <Megaphone className="mr-2 h-4 w-4" /> New Campaign
          </TabsTrigger>
          <TabsTrigger value="history" className="rounded-none font-black uppercase italic tracking-widest text-xs px-8 data-[state=active]:bg-primary data-[state=active]:text-white">
            <History className="mr-2 h-4 w-4" /> Live Registry
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="creator" className="animate-in fade-in duration-500">
          <CampaignCreator />
        </TabsContent>
        
        <TabsContent value="history" className="animate-in fade-in duration-500">
          <CampaignsViewer />
        </TabsContent>
      </Tabs>
    </div>
  );
}
