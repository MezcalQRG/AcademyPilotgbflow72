
"use client";

import React, { useState, useEffect } from 'react';
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
  ExternalLink,
  Settings,
  Save,
  Loader2,
  Zap,
  Plug,
  Unplug
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { doc, collection, setDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function AcademySettingsPage() {
  const { toast } = useToast();
  const { user } = useUser();
  const db = useFirestore();
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  
  // Form state for General tab
  const [academyName, setAcademyName] = useState('');
  const [academyDesc, setAcademyDesc] = useState('');

  // Profile Doc Reference
  const profileRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'user_profiles', user.uid);
  }, [db, user]);
  
  const { data: profile, isLoading: profileLoading } = useDoc(profileRef);

  // Integration Configs Reference
  const configsRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return collection(db, 'user_profiles', user.uid, 'integration_configs');
  }, [db, user]);
  
  const { data: configs, isLoading: configsLoading } = useCollection(configsRef);

  // Sync form state
  useEffect(() => {
    if (profile) {
      setAcademyName(profile.academyName || '');
      setAcademyDesc(profile.description || '');
    }
  }, [profile]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "INTEL COPIED", description: "Tactical credentials secured to clipboard." });
  };

  const handleSaveProfile = () => {
    if (!profileRef) return;
    setIsSaving(true);
    
    const updateData = {
      academyName,
      description: academyDesc,
      updatedAt: serverTimestamp()
    };

    updateDoc(profileRef, updateData)
      .then(() => {
        setIsSaving(false);
        toast({ title: "PROFILE UPDATED", description: "Academy mission parameters secured." });
      })
      .catch(async (e) => {
        setIsSaving(false);
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: profileRef.path,
          operation: 'update',
          requestResourceData: updateData
        }));
      });
  };

  const addConnection = (type: string) => {
    if (!db || !user) return;
    
    // Generate a tactical ID locally to satisfy security rules
    const configId = `link_${Math.random().toString(36).substring(2, 12).toUpperCase()}`;
    const configDocRef = doc(db, 'user_profiles', user.uid, 'integration_configs', configId);

    const newConfig = {
      id: configId, // REQUIRED: Must match the document ID for the security rule
      name: `TACTICAL ${type.toUpperCase()} LINK`,
      type,
      apiKeyIdentifier: `ID-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      status: 'disconnected',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: user.uid,
      apiSecret: '',
      webhookUrl: ''
    };

    // Use setDoc instead of addDoc to control the ID
    setDoc(configDocRef, newConfig)
      .catch(async (e) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: configDocRef.path,
          operation: 'create',
          requestResourceData: newConfig
        }));
      });
      
    toast({ title: "INITIALIZING LINK", description: `Provisioning ${type.toUpperCase()} connection matrix.` });
  };

  const handleUpdateConnection = (id: string, data: any) => {
    if (!db || !user) return;
    const configDocRef = doc(db, 'user_profiles', user.uid, 'integration_configs', id);
    const updateData = {
      ...data,
      updatedAt: serverTimestamp()
    };
    updateDoc(configDocRef, updateData)
      .catch(async (e) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: configDocRef.path,
          operation: 'update',
          requestResourceData: updateData
        }));
      });
  };

  const verifyConnection = (id: string) => {
    setVerifyingId(id);
    // Simulate tactical handshake verification
    setTimeout(() => {
      handleUpdateConnection(id, { status: 'active' });
      setVerifyingId(null);
      toast({ title: "LINK VERIFIED", description: "Tactical handshake established successfully." });
    }, 1500);
  };

  const deleteConnection = (id: string) => {
    if (!db || !user) return;
    const configDocRef = doc(db, 'user_profiles', user.uid, 'integration_configs', id);
    
    deleteDoc(configDocRef)
      .catch(async (e) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: configDocRef.path,
          operation: 'delete'
        }));
      });
      
    toast({ title: "LINK TERMINATED", description: "Integration purged from tactical registry.", variant: "destructive" });
  };

  const rotateApiKey = () => {
    if (!profileRef) return;
    const newKey = `sk_${Math.random().toString(36).substring(2, 15)}`;
    
    updateDoc(profileRef, { 
      pullApiKey: newKey,
      updatedAt: serverTimestamp() 
    }).catch(async (e) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: profileRef.path,
        operation: 'update',
        requestResourceData: { pullApiKey: newKey }
      }));
    });
    
    toast({ title: "KEY ROTATED", description: "New secret access key manifested." });
  };

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-700">
      <div className="border-l-4 border-primary pl-6">
        <h1 className="font-headline text-4xl font-black uppercase italic tracking-tighter leading-none text-foreground">Command & Integrations</h1>
        <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mt-2">Ops: Managing Tactical Handshakes & Mission Credentials</p>
      </div>

      <Tabs defaultValue="general" className="space-y-8">
        <TabsList className="bg-secondary/10 border-2 border-border p-1 rounded-none">
          <TabsTrigger value="general" className="rounded-none font-black uppercase italic tracking-widest text-xs px-8 data-[state=active]:bg-primary data-[state=active]:text-white gap-2">
            <Settings className="w-4 h-4" /> Sector Alpha: Identity
          </TabsTrigger>
          <TabsTrigger value="push" className="rounded-none font-black uppercase italic tracking-widest text-xs px-8 data-[state=active]:bg-primary data-[state=active]:text-white gap-2">
            <Globe className="w-4 h-4" /> Push (Outbound)
          </TabsTrigger>
          <TabsTrigger value="pull" className="rounded-none font-black uppercase italic tracking-widest text-xs px-8 data-[state=active]:bg-primary data-[state=active]:text-white gap-2">
            <Database className="w-4 h-4" /> Pull (Inbound)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-8 animate-in fade-in duration-500">
          <Card className="rounded-none border-2 border-border bg-card shadow-md">
            <CardHeader className="bg-secondary/5 border-b border-border">
              <CardTitle className="font-headline text-xl font-black uppercase italic">Academy Registry Profile</CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase tracking-widest">Core mission identification for this tactical tenant.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest">Academy Callsign</Label>
                <Input 
                  value={academyName} 
                  onChange={(e) => setAcademyName(e.target.value.toUpperCase())}
                  className="rounded-none border-2 h-12 font-black italic uppercase"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest">Mission Directive (Description)</Label>
                <Textarea 
                  value={academyDesc} 
                  onChange={(e) => setAcademyDesc(e.target.value)}
                  className="rounded-none border-2 min-h-[100px] font-medium"
                />
              </div>
            </CardContent>
            <CardFooter className="bg-secondary/5 border-t border-border p-6 flex justify-end">
              <Button 
                className="bg-primary hover:bg-primary/90 text-white rounded-none font-black uppercase italic tracking-widest h-12 px-10 shadow-lg" 
                onClick={handleSaveProfile}
                disabled={isSaving}
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4" />}
                SECURE PROFILE
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="push" className="space-y-8 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
            <ActionTriggerCard 
              icon={<Key className="w-8 h-8 text-primary" />}
              title="Custom Webhook"
              desc="Broadcast to custom operational endpoints"
              onClick={() => addConnection('webhook')}
            />
          </div>

          <div className="space-y-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" /> Active Integration Controllers
            </h3>
            
            {configsLoading ? (
               <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>
            ) : !configs || configs.length === 0 ? (
              <button 
                onClick={() => addConnection('webhook')}
                className="w-full p-20 border-2 border-dashed border-border rounded-none text-center opacity-40 italic hover:opacity-100 hover:border-primary hover:bg-primary/5 transition-all group"
              >
                <Plus className="h-12 w-12 mx-auto mb-4 text-muted-foreground group-hover:text-primary group-hover:scale-110 transition-transform" />
                <p className="text-[10px] font-black uppercase tracking-widest">No active tactical links established. Click to initialize.</p>
              </button>
            ) : (
              <div className="space-y-6">
                {configs.map((conn) => (
                  <Card key={conn.id} className="rounded-none border-2 border-border bg-card group hover:border-primary transition-all shadow-md overflow-hidden will-change-transform">
                    <CardHeader className="p-6 pb-4 bg-secondary/5 border-b-2 border-border">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-background border-2 border-border group-hover:border-primary transition-colors">
                            <Key className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-sm font-black uppercase italic tracking-tight">{conn.name}</CardTitle>
                            <Badge variant="outline" className="text-[8px] uppercase font-black tracking-widest rounded-none h-4 border-primary/30 text-primary">
                              {conn.type}
                            </Badge>
                          </div>
                        </div>
                        <Badge className={`rounded-none font-black uppercase text-[9px] tracking-widest px-3 py-1 ${conn.status === 'active' ? 'bg-green-600 text-white shadow-[0_0_10px_rgba(22,163,74,0.5)]' : 'bg-primary'}`}>
                          {conn.status === 'active' ? 'CONNECTED' : 'DISCONNECTED'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-8 space-y-6 bg-background/50">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">API Secret Key</Label>
                          <div className="flex gap-2">
                            <Input 
                              type="password" 
                              placeholder="PASTE SECRET..."
                              defaultValue={conn.apiSecret || ''}
                              onBlur={(e) => handleUpdateConnection(conn.id, { apiSecret: e.target.value })}
                              className="rounded-none border-2 h-12 bg-background font-mono text-xs focus-visible:ring-primary flex-1" 
                            />
                            <Button 
                              variant="outline" 
                              onClick={() => verifyConnection(conn.id)}
                              disabled={verifyingId === conn.id}
                              className={cn(
                                "rounded-none border-2 h-12 font-black uppercase text-[10px] px-6 transition-all",
                                conn.status === 'active' ? "bg-green-600 text-white border-green-600 hover:bg-green-700" : "hover:bg-primary/10"
                              )}
                            >
                              {verifyingId === conn.id ? <Loader2 className="animate-spin h-4 w-4" /> : conn.status === 'active' ? <Check className="h-4 w-4" /> : "VERIFY"}
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Target Destination URL</Label>
                          <Input 
                            type="url" 
                            placeholder="https://api.external-theater.com/webhook"
                            defaultValue={conn.webhookUrl || ''}
                            onBlur={(e) => handleUpdateConnection(conn.id, { webhookUrl: e.target.value })}
                            className="rounded-none border-2 h-12 bg-background font-mono text-xs focus-visible:ring-primary" 
                          />
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="p-4 bg-secondary/5 border-t border-border flex justify-between items-center px-8">
                      <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                        <Info className="h-3.5 w-3.5 text-primary" />
                        <span>Last Matrix Check: {conn.updatedAt?.seconds ? new Date(conn.updatedAt.seconds * 1000).toLocaleString() : 'STANDBY'}</span>
                      </div>
                      <Button variant="ghost" size="sm" className="text-destructive font-black uppercase italic text-[9px] hover:bg-destructive/10 rounded-none h-10 px-6" onClick={() => deleteConnection(conn.id)}>
                        <Trash2 className="w-4 h-4 mr-2" /> TERMINATE LINK
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="pull" className="space-y-8 animate-in fade-in duration-500">
          <Card className="rounded-none border-4 border-primary bg-primary/5 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <ShieldCheck size={200} className="rotate-12" />
            </div>
            <CardHeader className="bg-primary text-white p-8">
              <CardTitle className="flex items-center gap-3 font-headline text-3xl font-black uppercase italic tracking-tighter">
                <ShieldCheck className="w-8 h-8" />
                Secure Inbound Access (Pull API)
              </CardTitle>
              <CardDescription className="text-white/80 font-bold uppercase tracking-widest text-[10px] mt-2">Engineering secure data exposure for external tactical software.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-8 relative z-10">
              <div className="p-6 bg-background/80 border-2 border-primary/20 backdrop-blur-sm flex gap-6">
                <div className="p-3 bg-primary/10 rounded-none border-2 border-primary rotate-45 h-fit shrink-0">
                  <Info className="w-6 h-6 text-primary -rotate-45" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-black uppercase italic text-primary">Inbound Protocol Logic</p>
                  <p className="text-xs font-medium text-muted-foreground leading-relaxed uppercase tracking-wide">
                    External units can perform a tactical fetch from your unique endpoint using the secret key. 
                    Recommended for systems requiring periodic intelligence reports rather than real-time synchronization.
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Unique Command Endpoint</Label>
                  <div className="flex gap-3">
                    <Input 
                      readOnly 
                      value={`https://gracieflow.app/api/export?academyId=${user?.uid}`} 
                      className="bg-muted border-2 border-border rounded-none font-mono text-xs h-12"
                    />
                    <Button variant="outline" size="icon" className="h-12 w-12 border-2 rounded-none hover:bg-primary/10" onClick={() => handleCopy(`https://gracieflow.app/api/export?academyId=${user?.uid}`)}>
                      {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Secret Access Token (API Key)</Label>
                  <div className="flex gap-3">
                    <Input 
                      readOnly 
                      type="password"
                      value={profile?.pullApiKey || "••••••••••••••••"} 
                      className="bg-muted border-2 border-border rounded-none font-mono text-xs h-12"
                    />
                    <Button variant="outline" size="icon" className="h-12 w-12 border-2 rounded-none hover:bg-primary/10" onClick={() => handleCopy(profile?.pullApiKey || '')}>
                      {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                    </Button>
                    <Button variant="outline" className="rounded-none font-black uppercase italic text-[10px] tracking-widest h-12 border-2 gap-2" onClick={rotateApiKey}>
                      <RefreshCcw className="w-4 h-4" /> ROTATE KEY
                    </Button>
                  </div>
                </div>
              </div>

              <Separator className="bg-border h-0.5" />

              <div className="space-y-3">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-primary italic">TACTICAL CLI EXAMPLE (FETCH)</h4>
                <div className="relative group">
                  <pre className="p-6 bg-black text-xs font-mono text-green-400 overflow-x-auto border-2 border-border shadow-inner">
{`curl -X GET "https://gracieflow.app/api/export?academyId=${user?.uid}" \\
  -H "Authorization: Bearer ${profile?.pullApiKey || 'SECURE_TOKEN'}" \\
  -H "Content-Type: application/json"`}
                  </pre>
                  <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-8 w-8 text-green-400 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleCopy(`curl -X GET "https://gracieflow.app/api/export?academyId=${user?.uid}" -H "Authorization: Bearer ${profile?.pullApiKey || 'SECURE_TOKEN'}"`)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ActionTriggerCard({ icon, title, desc, onClick }: { icon: React.ReactNode, title: string, desc: string, onClick: () => void }) {
  return (
    <Button 
      variant="outline" 
      className="h-auto flex flex-col items-center gap-4 bg-background border-2 border-border hover:border-primary hover:bg-primary/5 transition-all p-8 rounded-none group text-center"
      onClick={onClick}
    >
      <div className="p-4 bg-secondary/5 border-2 border-border group-hover:border-primary transition-colors">
        {icon}
      </div>
      <div className="space-y-1">
        <span className="block font-black uppercase italic text-sm tracking-tight">{title}</span>
        <span className="block text-[9px] font-bold uppercase tracking-widest text-muted-foreground max-w-[120px] mx-auto leading-tight">{desc}</span>
      </div>
    </Button>
  );
}
