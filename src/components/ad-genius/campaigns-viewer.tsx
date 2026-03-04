'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';
import { getCampaignsAction } from '@/app/actions';
import type { Campaign } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search, Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const campaignsSchema = z.object({
  adAccountID: z.string().min(1, 'Ad Account ID required'),
  apiKey: z.string().min(1, 'Token required'),
});

export default function CampaignsViewer() {
  const [isPending, startTransition] = useTransition();
  const [campaigns, setCampaigns] = useState<Campaign[] | null>(null);
  const { toast } = useToast();
  const { register, handleSubmit } = useForm<z.infer<typeof campaignsSchema>>({
    resolver: zodResolver(campaignsSchema)
  });

  const onFormSubmit = (data: any) => {
    startTransition(async () => {
      const result = await getCampaignsAction(data);
      if (result.status === 'success') setCampaigns(result.data!);
      else toast({ variant: "destructive", title: "Fetch Failed" });
    });
  };

  return (
    <div className="space-y-12">
      <Card className="rounded-none border-2 border-border max-w-xl mx-auto">
        <CardHeader className="bg-secondary/5">
          <CardTitle className="font-headline uppercase italic">Campaign Database</CardTitle>
          <CardDescription className="text-[10px] uppercase font-bold tracking-widest">Fetch live data from your Meta account</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest">Ad Account ID</Label>
              <Input {...register('adAccountID')} className="rounded-none border-2" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest">Access Token</Label>
              <Input type="password" {...register('apiKey')} className="rounded-none border-2" />
            </div>
            <Button type="submit" disabled={isPending} className="w-full bg-primary rounded-none font-black uppercase italic tracking-widest h-12">
              {isPending ? <Loader2 className="animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
              Fetch Live Campaigns
            </Button>
          </form>
        </CardContent>
      </Card>

      {campaigns && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map(c => (
            <Card key={c.id} className="rounded-none border-2 border-border overflow-hidden">
              <CardHeader className="bg-secondary/5 border-b border-border">
                <CardTitle className="text-sm font-black uppercase italic truncate">{c.name}</CardTitle>
                <div className="flex justify-between items-center pt-2">
                  <Badge className="font-black uppercase text-[9px] rounded-none">{c.status}</Badge>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">{c.objective}</span>
                </div>
              </CardHeader>
              <CardContent className="p-6 flex flex-col items-center justify-center min-h-[120px] text-center">
                <Activity className="h-8 w-8 text-primary mb-2" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Monitoring Active...</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
