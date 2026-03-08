
'use client';

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Key, 
  Globe, 
  Database, 
  Copy, 
  Check, 
  Plus, 
  Trash2, 
  RefreshCcw, 
  Info,
  Save,
  Loader2,
  Zap,
  Eye,
  EyeOff,
  Cpu,
  Smartphone,
  Facebook,
  Map as MapIcon,
  Brain,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  useUser, 
  useFirestore, 
  useDoc, 
  useCollection, 
  useMemoFirebase,
} from '@/firebase';
import { doc, collection } from 'firebase/firestore';

export default function AcademySettingsPage() {
  const { toast } = useToast();
  const { user } = useUser();
  const db = useFirestore();
  const [copied, setCopied] = useState(false);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  
  // Handshake Form State
  const [initApiKey, setInitApiKey] = useState('');
  const [initCrmUrl, setInitCrmUrl] = useState('');
  const [isInitialVerifying, setIsInitialVerifying] = useState(false);
  
  // Profile Doc Reference (for Pull API)
  const profileRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'user_profiles', user.uid);
  }, [db, user]);
  const { data: profile } = useDoc(profileRef);

  // Integration Configs Reference
  const configsRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return collection(db, 'user_profiles', user.uid, 'integration_configs');
  }, [db, user]);
  const { data: configs, isLoading: configsLoading } = useCollection(configsRef);

  const toggleKeyVisibility = (id: string) => {
    setShowKeys(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleUpdateVendorCredential = async (vendorId: string, name: string, data: any) => {
    if (!user) return;
    
    try {
      const response = await fetch('/api/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          userId: user.uid,
          configId: vendorId,
          name: name,
        }),
      });

      if (!response.ok) throw new Error('Failed to update credential matrix');

      toast({ title: "CREDENTIAL SECURED", description: `${name} matrix updated.` });
    } catch (error: any) {
      toast({ variant: "destructive", title: "UPDATE FAILURE", description: error.message });
    }
  };

  const handleInitialVerify = async () => {
    if (!initApiKey || !initCrmUrl || !user) return;
    setIsInitialVerifying(true);
    try {
      // Simulate real-world external handshake
      const response = await fetch(initCrmUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handshake: true })
      });

      if (response.ok) {
        const id = `webhook_${Math.random().toString(36).substring(7)}`;
        await handleUpdateVendorCredential(id, "CUSTOM WEBHOOK LINK", { apiSecret: initApiKey, webhookUrl: initCrmUrl, type: 'webhook' });
        setInitApiKey('');
        setInitCrmUrl('');
      } else {
        toast({ variant: "destructive", title: "HANDSHAKE REJECTED", description: `Target returned status ${response.status}` });
      }
    } catch (e) {
      toast({ variant: "destructive", title: "LINK FAILURE", description: "Operational endpoint unreachable." });
    } finally {
      setIsInitialVerifying(false);
    }
  };

  const deleteConnection = async (id: string) => {
    if (!user) return;
    try {
      const response = await fetch(`/api/integrations?userId=${user.uid}&configId=${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Deletion blocked by security matrix');
      toast({ title: "LINK TERMINATED", variant: "destructive" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "PURGE FAILURE", description: error.message });
    }
  };

  const rotatePullKey = async () => {
    if (!user) return;
    const newKey = `sk_${Math.random().toString(36).substring(2, 15)}`;
    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid, pullApiKey: newKey }),
      });
      if (!response.ok) throw new Error('Key rotation failed');
      toast({ title: "KEY ROTATED" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "ROTATION FAILURE", description: error.message });
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-700">
      <div className="border-l-4 border-primary pl-6">
        <h1 className="font-headline text-4xl font-black uppercase italic tracking-tighter leading-none text-foreground">Command & Integrations</h1>
        <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mt-2">Ops: Managing Tactical Handshakes & Vendor Credentials</p>
      </div>

      <Tabs defaultValue="push" className="space-y-8">
        <TabsList className="bg-secondary/10 border-2 border-border p-1 rounded-none flex-wrap h-auto">
          <TabsTrigger value="push" className="rounded-none font-black uppercase italic tracking-widest text-xs px-8 data-[state=active]:bg-primary data-[state=active]:text-white gap-2 h-12">
            <Globe className="w-4 h-4" /> Push Protocols
          </TabsTrigger>
          <TabsTrigger value="pull" className="rounded-none font-black uppercase italic tracking-widest text-xs px-8 data-[state=active]:bg-primary data-[state=active]:text-white gap-2 h-12">
            <Database className="w-4 h-4" /> Pull Access
          </TabsTrigger>
          <TabsTrigger value="vendors" className="rounded-none font-black uppercase italic tracking-widest text-xs px-8 data-[state=active]:bg-primary data-[state=active]:text-white gap-2 h-12">
            <Key className="w-4 h-4" /> Vendor Credentials
          </TabsTrigger>
        </TabsList>

        <TabsContent value="push" className="space-y-8 animate-in fade-in duration-500">
          <div className="space-y-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" /> Active Outbound Links
            </h3>
            
            {configs?.filter(c => c.type === 'webhook').map(conn => (
              <Card key={conn.id} className="rounded-none border-2 border-border bg-card shadow-md overflow-hidden">
                <CardHeader className="p-6 pb-4 bg-secondary/5 border-b-2 border-border flex flex-row items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-background border-2 border-border">
                      <Globe className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-black uppercase italic tracking-tight">{conn.name}</CardTitle>
                      <Badge className="rounded-none font-black uppercase text-[8px] bg-primary/10 text-primary border-primary/20">WEBHOOK</Badge>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 rounded-none" onClick={() => deleteConnection(conn.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="p-8 space-y-4 bg-background/50 text-xs font-mono">
                  <div className="grid gap-4">
                    <div>
                      <Label className="text-[9px] font-black uppercase mb-1 block">Operational URL</Label>
                      <Input readOnly value={conn.webhookUrl} className="rounded-none border-2 h-10 bg-muted/20" />
                    </div>
                    <div>
                      <Label className="text-[9px] font-black uppercase mb-1 block">API Secret</Label>
                      <Input readOnly type="password" value={conn.apiSecret} className="rounded-none border-2 h-10 bg-muted/20" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            <Card className="rounded-none border-2 border-border bg-card shadow-md overflow-hidden">
              <CardHeader className="p-6 pb-4 bg-secondary/5 border-b-2 border-border">
                <CardTitle className="text-sm font-black uppercase italic tracking-tight">Protocol Initialization Matrix</CardTitle>
              </CardHeader>
              <CardContent className="p-12 space-y-8 bg-background/50">
                <div className="max-w-md mx-auto space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Target API Secret</Label>
                      <Input type="password" value={initApiKey} onChange={e => setInitApiKey(e.target.value)} className="rounded-none border-2 h-12" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest ml-1">CRM Target URL</Label>
                      <Input type="url" value={initCrmUrl} onChange={e => setInitCrmUrl(e.target.value)} className="rounded-none border-2 h-12" />
                    </div>
                  </div>
                  <Button 
                    onClick={handleInitialVerify} 
                    disabled={isInitialVerifying || !initApiKey || !initCrmUrl}
                    className="w-full bg-primary hover:bg-primary/90 text-white rounded-none font-black uppercase italic h-16 shadow-xl"
                  >
                    {isInitialVerifying ? <Loader2 className="animate-spin mr-3" /> : <Zap className="mr-3" />}
                    VERIFY & INITIALIZE LINK
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="pull" className="space-y-8 animate-in fade-in duration-500">
          <Card className="rounded-none border-4 border-primary bg-primary/5 shadow-xl relative overflow-hidden">
            <CardHeader className="bg-primary text-white p-8">
              <CardTitle className="flex items-center gap-3 font-headline text-3xl font-black uppercase italic tracking-tighter">
                <ShieldCheck className="w-8 h-8" />
                Secure Inbound Access (Pull API)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8 relative z-10">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest">Command Endpoint</Label>
                  <Input readOnly value={`https://gracieflow.app/api/export?academyId=${user?.uid}`} className="bg-muted border-2 rounded-none font-mono text-xs h-12" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest">Secret Access Token</Label>
                  <div className="flex gap-3">
                    <Input readOnly type="password" value={profile?.pullApiKey || "••••••••••••••••"} className="bg-muted border-2 rounded-none font-mono text-xs h-12" />
                    <Button variant="outline" className="rounded-none border-2 h-12 px-6 font-black uppercase text-[10px]" onClick={rotatePullKey}>
                      ROTATE KEY
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vendors" className="space-y-12 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <VendorCard 
              id="vendor_elevenlabs"
              title="ElevenLabs Voice Link"
              desc="Tactical AI speech synthesis credentials."
              icon={<Cpu className="w-6 h-6 text-primary" />}
              fields={[{ label: "API Key", key: "apiKey", placeholder: "sk_...", type: "password" }]}
              onUpdate={(data: any) => handleUpdateVendorCredential("vendor_elevenlabs", "ELEVENLABS LINK", { ...data, type: 'vendor' })}
              existingData={configs?.find(c => c.id === 'vendor_elevenlabs')}
            />
            <VendorCard 
              id="vendor_twilio"
              title="Twilio Communication Matrix"
              desc="Secure SID and Auth Token for direct comms link."
              icon={<Smartphone className="w-6 h-6 text-primary" />}
              fields={[
                { label: "Account SID", key: "accountSid", placeholder: "AC...", type: "text" },
                { label: "Auth Token", key: "authToken", placeholder: "Paste token...", type: "password" }
              ]}
              onUpdate={(data: any) => handleUpdateVendorCredential("vendor_twilio", "TWILIO LINK", { ...data, type: 'vendor' })}
              existingData={configs?.find(c => c.id === 'vendor_twilio')}
            />
            {/* ... other vendor cards follow same pattern */}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function VendorCard({ id, title, desc, icon, fields, onUpdate, existingData }: any) {
  const [localData, setLocalData] = useState<any>(existingData || {});
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  const handleFieldChange = (key: string, val: string) => {
    setLocalData((prev: any) => ({ ...prev, [key]: val }));
  };

  return (
    <Card className="rounded-none border-2 border-border bg-card shadow-md flex flex-col group hover:border-primary transition-all">
      <CardHeader className="bg-secondary/5 border-b-2 border-border p-6">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-background border-2 border-border group-hover:border-primary transition-colors">
            {icon}
          </div>
          <div>
            <CardTitle className="text-sm font-black uppercase italic tracking-tight">{title}</CardTitle>
            <CardDescription className="text-[8px] uppercase font-bold tracking-widest text-muted-foreground">{desc}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-4 flex-1 bg-background/50">
        {fields.map((f: any) => (
          <div key={f.key} className="space-y-1.5">
            <Label className="text-[9px] font-black uppercase tracking-widest ml-1">{f.label}</Label>
            <div className="relative">
              <Input 
                type={f.type === 'password' && !showKeys[f.key] ? 'password' : 'text'}
                placeholder={f.placeholder}
                value={localData[f.key] || ''}
                onChange={e => handleFieldChange(f.key, e.target.value)}
                className="rounded-none border-2 h-10 bg-background font-mono text-xs pr-10 focus-visible:ring-primary"
              />
              {f.type === 'password' && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-transparent"
                  onClick={() => setShowKeys(prev => ({ ...prev, [f.key]: !prev[f.key] }))}
                >
                  {showKeys[f.key] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </Button>
              )}
            </div>
          </div>
        ))}
      </CardContent>
      <CardFooter className="p-4 bg-secondary/5 border-t border-border">
        <Button 
          className="w-full bg-primary hover:bg-primary/90 text-white rounded-none font-black uppercase italic tracking-widest text-[10px] h-10 gap-2"
          onClick={() => onUpdate(localData)}
        >
          <Zap className="w-3 h-3 fill-current" />
          Update Matrix Link
        </Button>
      </CardFooter>
    </Card>
  );
}
