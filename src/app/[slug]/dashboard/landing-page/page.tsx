
"use client";

import React, { useState, useEffect, useTransition } from 'react';
import { 
  Globe, 
  Zap, 
  ShieldCheck, 
  ExternalLink, 
  Save, 
  Loader2, 
  Layout,
  MousePointer2,
  Phone,
  Mail,
  MapPin,
  Type,
  Image as ImageIcon
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { showErrorToast } from '@/lib/client-errors';
import { doc, setDoc } from 'firebase/firestore';
import { slugify } from '@/lib/utils';
import Link from 'next/link';
import type { LandingPageData } from '@/lib/types';

export default function LandingPageManager() {
  const { toast } = useToast();
  const { user } = useUser();
  const db = useFirestore();
  const [isSaving, startTransition] = useTransition();
  
  const [formData, setFormData] = useState<Partial<LandingPageData>>({
    branchName: '',
    slug: '',
    headline: 'Jiu-Jitsu For Everyone',
    subheadline: '',
    callToAction: 'START YOUR MISSION',
    contactPhone: '',
    contactEmail: '',
    address: '',
    heroImage: '',
    isPublished: false,
  });

  const landingPageRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'user_profiles', user.uid, 'landing_page', 'config');
  }, [db, user]);
  
  const { data: config, isLoading } = useDoc(landingPageRef);

  useEffect(() => {
    if (config) {
      setFormData(prev => ({ ...prev, ...config }));
    }
  }, [config]);

  const handleInputChange = (field: keyof LandingPageData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (field === 'branchName' && !formData.slug) {
      setFormData(prev => ({ ...prev, slug: slugify(value) }));
    }
  };

  const handleDeploy = () => {
    if (!formData.branchName || !formData.slug || !user || !db) {
      toast({ variant: "destructive", title: "Incomplete Parameters", description: "Branch name and slug are required." });
      return;
    }

    startTransition(async () => {
      try {
        const payload = {
          ...formData,
          userId: user.uid,
          updatedAt: new Date().toISOString(),
        };

        // 1. Save user-specific config
        await setDoc(doc(db, 'user_profiles', user.uid, 'landing_page', 'config'), payload, { merge: true });

        // 2. Deploy to public registry matrix
        await setDoc(doc(db, 'landing_pages', formData.slug!), payload, { merge: true });

        toast({ title: "MISSION DEPLOYED", description: `Landing page is now ${formData.isPublished ? 'LIVE' : 'SECURED'} at /${formData.slug}` });
      } catch (error: any) {
        showErrorToast(toast, 'DEPLOYMENT FAILURE', error, 'Landing page deployment failed.');
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="font-headline font-black uppercase italic tracking-widest text-primary text-sm">Interfacing with Registry...</p>
      </div>
    );
  }

  const publicUrl = typeof window !== 'undefined' ? `${window.location.origin}/${formData.slug}` : `/${formData.slug}`;

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-700">
      <div className="border-l-4 border-primary pl-6">
        <h1 className="font-headline text-4xl font-black uppercase italic tracking-tighter leading-none text-foreground">Storefront Engineering</h1>
        <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mt-2">Intelligence: Deploying Branch-Specific Operational Environments</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="rounded-none border-2 border-border bg-card shadow-md overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
            <CardHeader className="bg-secondary/5 border-b-2 border-border p-8">
              <CardTitle className="font-headline text-2xl font-black uppercase italic tracking-tighter">Operational Parameters</CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase tracking-widest">Customize your branch's tactical link</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-10 bg-background/50">
              {/* Basic Identity */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest">Branch Tactical Name</Label>
                  <Input 
                    placeholder="e.g. WEST COVINA" 
                    value={formData.branchName} 
                    onChange={e => handleInputChange('branchName', e.target.value.toUpperCase())}
                    className="rounded-none border-2 h-12 font-black italic uppercase"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest">URL Matrix Slug</Label>
                  <Input 
                    placeholder="west-covina" 
                    value={formData.slug} 
                    onChange={e => handleInputChange('slug', slugify(e.target.value))}
                    className="rounded-none border-2 h-12 font-mono text-sm"
                  />
                </div>
              </div>

              <Separator className="bg-border" />

              {/* Content Engineering */}
              <div className="space-y-6">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary flex items-center gap-2">
                  <Type className="h-4 w-4" /> Content Matrix
                </h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest">Mission Headline</Label>
                    <Input 
                      value={formData.headline} 
                      onChange={e => handleInputChange('headline', e.target.value)}
                      className="rounded-none border-2 h-12 font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest">Strategic Subheadline</Label>
                    <Textarea 
                      value={formData.subheadline} 
                      onChange={e => handleInputChange('subheadline', e.target.value)}
                      className="rounded-none border-2 min-h-[80px]"
                      placeholder="Join the world's most successful team..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest">Call to Action Directive</Label>
                    <Input 
                      value={formData.callToAction} 
                      onChange={e => handleInputChange('callToAction', e.target.value.toUpperCase())}
                      className="rounded-none border-2 h-12 font-black italic uppercase"
                    />
                  </div>
                </div>
              </div>

              <Separator className="bg-border" />

              {/* Contact Intelligence */}
              <div className="space-y-6">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary flex items-center gap-2">
                  <Phone className="h-4 w-4" /> Intelligence Assets
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest">Comm Phone</Label>
                    <Input 
                      value={formData.contactPhone} 
                      onChange={e => handleInputChange('contactPhone', e.target.value)}
                      className="rounded-none border-2 h-12 font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest">Tactical Email</Label>
                    <Input 
                      value={formData.contactEmail} 
                      onChange={e => handleInputChange('contactEmail', e.target.value)}
                      className="rounded-none border-2 h-12 font-bold"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest">Operational Address</Label>
                  <Input 
                    value={formData.address} 
                    onChange={e => handleInputChange('address', e.target.value)}
                    className="rounded-none border-2 h-12 font-bold"
                  />
                </div>
              </div>

              <Separator className="bg-border" />

              <div className="flex items-center justify-between p-6 border-2 border-border bg-secondary/5">
                <div className="space-y-1">
                  <p className="font-black uppercase italic text-sm">Public Visibility Matrix</p>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Toggle live mission status in the theater of operations</p>
                </div>
                <Switch 
                  checked={formData.isPublished} 
                  onCheckedChange={val => handleInputChange('isPublished', val)}
                  className="data-[state=checked]:bg-primary"
                />
              </div>
            </CardContent>
            <CardFooter className="bg-secondary/5 border-t-2 border-border p-6">
              <Button 
                onClick={handleDeploy} 
                disabled={isSaving || !formData.branchName || !formData.slug}
                className="w-full bg-primary hover:bg-primary/90 text-white rounded-none font-black uppercase italic tracking-widest h-14 shadow-xl"
              >
                {isSaving ? <Loader2 className="animate-spin mr-3" /> : <Zap className="mr-3" />}
                DEPLOY TACTICAL STOREFRONT
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="rounded-none border-2 border-border bg-card shadow-sm">
            <CardHeader className="bg-secondary/5 border-b-2 border-border py-4">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] italic text-primary flex items-center gap-2">
                <Layout className="h-4 w-4" /> Template Core
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="aspect-video bg-muted border-2 border-border relative overflow-hidden group">
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <Badge className="bg-primary text-white font-black italic rounded-none uppercase text-[8px]">PRIMARY ALPHA</Badge>
                </div>
                <div className="p-2 space-y-1">
                  <div className="h-1 w-1/3 bg-primary" />
                  <div className="h-4 w-full bg-border" />
                  <div className="h-2 w-2/3 bg-border" />
                  <div className="grid grid-cols-2 gap-1 pt-2">
                    <div className="h-8 bg-muted border border-border" />
                    <div className="h-8 bg-muted border border-border" />
                  </div>
                </div>
              </div>
              <p className="text-[10px] font-bold text-muted-foreground leading-relaxed uppercase">
                Currently using the <span className="text-primary font-black italic">GRACIE BARRA AI PRIMARY</span> blueprint. Automated photo injection enabled.
              </p>
            </CardContent>
          </Card>

          {formData.slug && (
            <Card className="rounded-none border-2 border-primary bg-primary/5 shadow-md animate-in zoom-in-95">
              <CardHeader className="py-4 border-b border-primary/20">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" /> Secure Link
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label className="text-[9px] font-black uppercase tracking-widest opacity-60">Mission URL</Label>
                  <Input readOnly value={publicUrl} className="bg-background border-border text-[10px] font-mono rounded-none h-10" />
                </div>
                <Button asChild className="w-full bg-primary hover:bg-primary/90 text-white rounded-none font-black uppercase italic tracking-widest h-10 text-[9px]">
                  <Link href={`/${formData.slug}`} target="_blank">
                    INSPECT LIVE ENVIRONMENT <ExternalLink className="ml-2 h-3 w-3" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
