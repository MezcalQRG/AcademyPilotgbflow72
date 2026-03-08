
"use client";

import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Zap, 
  Filter, 
  Play, 
  Save, 
  Plus, 
  Trash2, 
  Globe, 
  Database, 
  HelpCircle, 
  CheckCircle2,
  Clock,
  Loader2,
  Bell,
  Settings
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AISuggestions } from '@/components/automation/AISuggestions';
import { Separator } from '@/components/ui/separator';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection } from 'firebase/firestore';

export default function NewAutomationPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useUser();
  const db = useFirestore();
  
  const [ruleName, setRuleName] = useState('UNIT PROTOCOL 01');
  const [trigger, setTrigger] = useState('');
  const [conditions, setConditions] = useState<string[]>([]);
  const [actions, setActions] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const handleAISelection = (type: 'trigger' | 'condition' | 'action', suggestion: any) => {
    if (type === 'trigger') setTrigger(suggestion);
    if (type === 'condition') setConditions([...conditions, suggestion]);
    if (type === 'action') {
      setActions([...actions, { 
        type: suggestion.type, 
        label: suggestion.value,
        config: {} 
      }]);
    }
    
    toast({
      title: "INTEL APPLIED",
      description: `AI architectural recommendation integrated: ${type.toUpperCase()}.`,
    });
  };

  const handleSave = () => {
    if (!db || !user) return;
    setIsSaving(true);
    
    const rulesRef = collection(db, 'user_profiles', user.uid, 'automation_rules');
    
    const newRule = {
      name: ruleName.toUpperCase(),
      status: 'active',
      trigger,
      conditions,
      actions,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addDocumentNonBlocking(rulesRef, newRule);
    
    toast({
      title: "PROTOCOL ESTABLISHED",
      description: "Autonomous flow has been deployed to the theater of operations.",
    });
    
    router.push('/dashboard/automations');
  };

  const renderActionIcon = (type: string) => {
    switch (type) {
      case 'push_webhook': return <Globe className="w-4 h-4 text-primary" />;
      case 'crm_upsert': return <Database className="w-4 h-4 text-primary" />;
      case 'notify_staff': return <Bell className="w-4 h-4 text-primary" />;
      case 'configure_export_endpoint': return <Settings className="w-4 h-4 text-primary" />;
      default: return <Zap className="w-4 h-4 text-primary" />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in slide-in-from-right-8 duration-700">
      <div className="flex items-center justify-between border-l-4 border-primary pl-6">
        <div className="flex items-center gap-6">
          <Link href="/dashboard/automations">
            <Button variant="ghost" size="icon" className="rounded-none border-2 h-12 w-12 hover:bg-primary hover:text-white transition-all">
              <ArrowLeft className="w-6 h-6" />
            </Button>
          </Link>
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <Input 
                value={ruleName} 
                onChange={(e) => setRuleName(e.target.value.toUpperCase())}
                className="text-3xl font-black italic uppercase bg-transparent border-none p-0 focus-visible:ring-0 w-auto min-w-[400px] tracking-tighter"
              />
              <Badge className="bg-primary/10 text-primary border-primary/20 rounded-none font-black uppercase italic text-[10px] px-3">Engineering</Badge>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Architecting Autonomous Tactical Link</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="outline" className="rounded-none font-black uppercase italic tracking-widest text-xs h-12 px-8 border-2">
            <Play className="w-4 h-4 mr-2" /> Simulate Matrix
          </Button>
          <Button 
            className="bg-primary hover:bg-primary/90 text-white rounded-none font-black uppercase italic tracking-widest h-12 px-10 shadow-xl" 
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Deploy Logic
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
        <div className="lg:col-span-3 space-y-8">
          
          {/* STEP 1: TRIGGER */}
          <Card className="rounded-none border-2 border-border bg-card relative overflow-hidden group hover:border-primary transition-all">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
            <CardHeader className="flex flex-row items-center justify-between bg-secondary/5 border-b border-border">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-3 font-black uppercase italic text-lg tracking-tight">
                  <Zap className="w-5 h-5 text-primary" /> 1. Operational Trigger
                </CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase tracking-widest">Define the mission initialization point</CardDescription>
              </div>
              <AISuggestions onSelect={handleAISelection} />
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="max-w-md space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest">Initialization Protocol</Label>
                <Select value={trigger} onValueChange={setTrigger}>
                  <SelectTrigger className="bg-background border-2 border-border rounded-none h-14 font-black uppercase italic">
                    <SelectValue placeholder="SELECT TRIGGER..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-none border-2 border-border">
                    <SelectItem value="lead.created" className="font-bold uppercase text-xs">LEAD CREATED (New Recruit)</SelectItem>
                    <SelectItem value="lead.status_changed" className="font-bold uppercase text-xs">STATUS CHANGE (Matrix Shift)</SelectItem>
                    <SelectItem value="hourly" className="font-bold uppercase text-xs">HOURLY SWEEP (Protocol Check)</SelectItem>
                    <SelectItem value="daily" className="font-bold uppercase text-xs">DAILY SYNC (Mission Brief)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* STEP 2: CONDITIONS */}
          <Card className="rounded-none border-2 border-border bg-card relative overflow-hidden group hover:border-primary transition-all">
            <div className="absolute top-0 left-0 w-1 h-full bg-muted-foreground" />
            <CardHeader className="flex flex-row items-center justify-between bg-secondary/5 border-b border-border">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-3 font-black uppercase italic text-lg tracking-tight">
                  <Filter className="w-5 h-5 text-muted-foreground" /> 2. Tactical Filters
                </CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase tracking-widest">Restrict protocol entry criteria</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="font-black uppercase tracking-widest text-[9px] hover:bg-primary/10 rounded-none h-8 px-4" onClick={() => setConditions([...conditions, ''])}>
                <Plus className="w-3 h-3 mr-2" /> ADD GATE
              </Button>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              {conditions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-border rounded-none bg-background/50 opacity-40">
                  <p className="text-[10px] font-black uppercase tracking-widest">No Tactical Filters Active</p>
                  <Button variant="link" className="text-primary text-[10px] font-black uppercase tracking-widest h-auto mt-2" onClick={() => setConditions([''])}>Initialize First Gate</Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {conditions.map((cond, idx) => (
                    <div key={idx} className="flex items-center gap-4 group">
                      <div className="flex-1 relative">
                        <Input 
                          placeholder="e.g. source == 'META_ADS'" 
                          value={cond} 
                          onChange={(e) => {
                            const newConds = [...conditions];
                            newConds[idx] = e.target.value.toUpperCase();
                            setConditions(newConds);
                          }}
                          className="bg-background border-2 border-border h-12 rounded-none font-mono text-xs uppercase"
                        />
                      </div>
                      <Button variant="ghost" size="icon" className="h-12 w-12 rounded-none text-destructive hover:bg-destructive/10" onClick={() => setConditions(conditions.filter((_, i) => i !== idx))}>
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* STEP 3: ACTIONS */}
          <Card className="rounded-none border-2 border-border bg-card relative overflow-hidden group hover:border-primary transition-all">
            <div className="absolute top-0 left-0 w-1 h-full bg-muted-foreground" />
            <CardHeader className="bg-secondary/5 border-b border-border">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-3 font-black uppercase italic text-lg tracking-tight">
                  <Play className="w-5 h-5 text-muted-foreground" /> 3. Mission Actions
                </CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase tracking-widest">Execute directives when conditions align</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              {actions.length === 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <ActionButton 
                    icon={<Globe className="w-8 h-8 text-primary" />}
                    title="Push Webhook"
                    desc="Broadcast data to tactical external URL"
                    onClick={() => setActions([...actions, { type: 'push_webhook', label: 'Tactical Webhook', config: {} }])}
                  />
                  <ActionButton 
                    icon={<Database className="w-8 h-8 text-primary" />}
                    title="CRM Sync"
                    desc="Authorize unit record in external registry"
                    onClick={() => setActions([...actions, { type: 'crm_upsert', label: 'Registry Update', config: {} }])}
                  />
                  <ActionButton 
                    icon={<Bell className="w-8 h-8 text-primary" />}
                    title="Unit Alert"
                    desc="Dispatch alert to base command staff"
                    onClick={() => setActions([...actions, { type: 'notify_staff', label: 'Command Alert', config: {} }])}
                  />
                </div>
              ) : (
                <div className="space-y-6">
                  {actions.map((action, idx) => (
                    <Accordion key={idx} type="single" collapsible className="w-full bg-background rounded-none border-2 border-border shadow-sm">
                      <AccordionItem value="config" className="border-none">
                        <AccordionTrigger className="px-6 py-4 hover:no-underline">
                          <div className="flex items-center gap-4">
                            <div className="p-2 bg-secondary/10 border border-border">
                              {renderActionIcon(action.type)}
                            </div>
                            <div className="text-left">
                              <span className="font-black uppercase italic text-sm block">Action {idx + 1}: {action.label}</span>
                              <Badge className="bg-muted text-foreground text-[8px] h-4 uppercase tracking-tighter rounded-none font-black">{action.type}</Badge>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-6 pb-6 pt-2 space-y-6">
                          <Separator className="bg-border h-0.5" />
                          <div className="grid gap-6">
                            {action.type === 'push_webhook' && (
                              <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-widest">Target Operational URL</Label>
                                <Input placeholder="https://api.external-theater.com/hooks/..." className="rounded-none border-2 h-12 bg-card font-mono text-xs" />
                              </div>
                            )}
                            {action.type === 'notify_staff' && (
                              <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-widest">Tactical Alert Level</Label>
                                <Select defaultValue="HIGH">
                                  <SelectTrigger className="rounded-none border-2 h-12 font-black italic"><SelectValue /></SelectTrigger>
                                  <SelectContent className="rounded-none">
                                    <SelectItem value="LOW">LOW PRIORITY</SelectItem>
                                    <SelectItem value="MED">STANDARD OPS</SelectItem>
                                    <SelectItem value="HIGH">CRITICAL ALERT</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                          </div>
                          <div className="flex justify-end border-t border-border pt-4">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-destructive font-black uppercase italic text-[9px] hover:bg-destructive/10 rounded-none h-8"
                              onClick={() => setActions(actions.filter((_, i) => i !== idx))}
                            >
                              Purge Action
                            </Button>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  ))}
                  <Button variant="outline" className="w-full border-dashed border-4 h-16 rounded-none font-black uppercase italic tracking-widest text-xs hover:border-primary hover:text-primary transition-all" onClick={() => setActions([...actions, { type: 'utility', label: 'New Action', config: {} }])}>
                    <Plus className="w-5 h-5 mr-3" /> Append Sequential Directive
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* SIDEBAR: INTEL BRIEFING */}
        <div className="space-y-8">
          <Card className="rounded-none border-2 border-border bg-card shadow-md">
            <CardHeader className="bg-secondary/5 border-b border-border py-4">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] italic">Protocol Manifest</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                <span className="text-muted-foreground">Status</span>
                <span className="flex items-center gap-2 text-yellow-500">
                  <Clock className="w-3 h-3" /> ARCHITECTING
                </span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                <span className="text-muted-foreground">Flow Pattern</span>
                <span className="font-black italic text-primary">
                  {actions.some(a => a.type?.includes('push')) ? 'PUSH (Outbound)' : 'LOCAL (Matrix Only)'}
                </span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                <span className="text-muted-foreground">Directives</span>
                <span className="font-black italic text-lg leading-none">{actions.length}</span>
              </div>
              <Separator className="bg-border" />
              <div className="space-y-3">
                <h5 className="text-[9px] font-black uppercase text-primary tracking-[0.3em] italic">Security Protocol</h5>
                <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span className="text-[9px] text-primary font-black uppercase tracking-widest">Academy Tenant Isolated</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-none border-2 border-border bg-card shadow-sm">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-[10px] font-black uppercase italic flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-primary" /> Engineering Support
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 text-[10px] text-muted-foreground leading-relaxed font-bold uppercase tracking-wide">
              Use <code className="text-primary bg-primary/5 px-1 font-black">{"{{lead.email}}"}</code> to inject tactical data variables. All webhooks require valid operational endpoints.
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ActionButton({ icon, title, desc, onClick }: { icon: React.ReactNode, title: string, desc: string, onClick: () => void }) {
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
