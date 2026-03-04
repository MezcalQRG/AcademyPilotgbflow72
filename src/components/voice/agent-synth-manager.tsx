
"use client";

import { useTransition, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AgentProfileSchema, type AgentProfile } from "@/lib/synth-types";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { generateSystemPromptAction, deployAgentAction } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Bot, Sparkles, Phone, Trash2, Loader2, Save, Rocket, Plus, ChevronRight, History } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import OutboundCallTester from "./outbound-call-tester";

export function AgentSynthManager() {
  const [agents, setAgents] = useLocalStorage<AgentProfile[]>('academy-pilot-custom-agents', []);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const { toast } = useToast();
  
  const selectedAgent = agents.find(a => a.id === selectedAgentId) || null;

  const handleCreateNew = () => {
    const newAgent: AgentProfile = {
      id: crypto.randomUUID(),
      name: 'NEW TACTICAL UNIT',
      createdAt: new Date().toISOString(),
      status: 'draft',
      elevenLabs: { modelId: 'eleven_multilingual_v2' },
      twilio: {},
      systemPromptDescription: '',
      systemPrompt: '',
    };
    setAgents([newAgent, ...agents]);
    setSelectedAgentId(newAgent.id);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Unit Registry Sidebar */}
        <div className="w-full md:w-80 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-2">
              <History className="h-4 w-4 text-primary" /> Intelligence Registry
            </h3>
            <Button size="icon" variant="outline" className="h-8 w-8 rounded-none border-primary text-primary hover:bg-primary hover:text-white" onClick={handleCreateNew}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-2">
            {agents.length === 0 ? (
              <div className="p-8 border-2 border-dashed border-border text-center opacity-40">
                <Bot className="h-8 w-8 mx-auto mb-2" />
                <p className="text-[10px] font-bold uppercase">No Custom Units</p>
              </div>
            ) : (
              agents.map(agent => (
                <button
                  key={agent.id}
                  onClick={() => setSelectedAgentId(agent.id)}
                  className={`w-full group p-4 border-2 transition-all text-left flex items-center justify-between rounded-none ${
                    selectedAgentId === agent.id 
                      ? 'border-primary bg-primary/5 shadow-[4px_4px_0px_rgba(0,0,0,0.1)]' 
                      : 'border-border hover:border-muted-foreground'
                  }`}
                >
                  <div className="min-w-0">
                    <p className="font-black uppercase italic text-xs truncate">{agent.name}</p>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter">{agent.status}</p>
                  </div>
                  <ChevronRight className={`h-4 w-4 transition-transform ${selectedAgentId === agent.id ? 'translate-x-1 text-primary' : 'opacity-0'}`} />
                </button>
              ))
            )}
          </div>
        </div>

        {/* Tactical Config Area */}
        <div className="flex-1">
          {selectedAgent ? (
            <AgentSynthForm 
              key={selectedAgent.id}
              agent={selectedAgent} 
              onSave={(updated) => setAgents(agents.map(a => a.id === updated.id ? updated : a))}
              onDelete={(id) => {
                setAgents(agents.filter(a => a.id !== id));
                setSelectedAgentId(null);
              }}
            />
          ) : (
            <div className="h-full min-h-[400px] border-4 border-dashed border-border flex flex-col items-center justify-center text-center p-12 opacity-40">
              <Bot className="h-16 w-16 mb-4 text-primary" />
              <h3 className="font-headline text-xl font-black uppercase italic">Provisioning Core</h3>
              <p className="text-[10px] font-bold uppercase tracking-widest mt-2 max-w-xs">
                Select a tactical unit from the registry or initialize a new deployment to access engineering matrix
              </p>
              <Button onClick={handleCreateNew} className="mt-6 bg-primary text-white rounded-none font-black uppercase italic tracking-widest px-8">
                Initialize Unit
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AgentSynthForm({ agent, onSave, onDelete }: { agent: AgentProfile, onSave: (a: AgentProfile) => void, onDelete: (id: string) => void }) {
  const { toast } = useToast();
  const [isGenerating, startGenerate] = useTransition();
  const [isDeploying, startDeploy] = useTransition();
  const [isSaving, startSave] = useTransition();

  const form = useForm<AgentProfile>({
    resolver: zodResolver(AgentProfileSchema),
    defaultValues: agent,
  });

  const handleSave = () => {
    startSave(() => {
      onSave(form.getValues());
      toast({ title: "Profile Secured", description: "Unit configuration updated in registry." });
    });
  };

  const handleGeneratePrompt = () => {
    const desc = form.getValues("systemPromptDescription");
    if (!desc) {
      toast({ variant: "destructive", title: "Data Needed", description: "Provide a description for the AI engineer." });
      return;
    }
    startGenerate(async () => {
      const result = await generateSystemPromptAction(desc);
      if (result.systemPrompt) {
        form.setValue("systemPrompt", result.systemPrompt);
        toast({ title: "Logic Engineered", description: "New system prompt generated successfully." });
      }
    });
  };

  const handleDeploy = () => {
    startDeploy(async () => {
      const result = await deployAgentAction(form.getValues());
      if (result.success) {
        form.setValue("status", "deployed");
        if (result.data?.agentId) form.setValue("elevenLabs.agentId", result.data.agentId);
        if (result.data?.phoneNumberId) form.setValue("elevenLabs.phoneNumberId", result.data.phoneNumberId);
        onSave(form.getValues());
        toast({ title: "Unit Deployed", description: "AI Agent is now live on ElevenLabs network." });
      } else {
        toast({ variant: "destructive", title: "Deployment Failed", description: result.error });
      }
    });
  };

  return (
    <Form {...form}>
      <div className="space-y-6">
        <header className="flex items-center justify-between border-b-2 border-border pb-4">
          <div className="flex items-center gap-4">
            <h2 className="font-headline text-2xl font-black uppercase italic tracking-tighter">Unit Engineering</h2>
            <Badge className={`rounded-none font-black uppercase text-[10px] tracking-widest ${agent.status === 'deployed' ? 'bg-green-600' : 'bg-muted text-foreground'}`}>
              {agent.status}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10 text-destructive hover:bg-destructive/10 rounded-none">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-none border-4 border-border">
                <AlertDialogHeader>
                  <AlertDialogTitle className="font-black uppercase italic">Decommission Unit?</AlertDialogTitle>
                  <AlertDialogDescription className="text-xs font-bold uppercase">This action will purge the unit from the registry permanently.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-none font-black uppercase text-xs">Abort</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDelete(agent.id)} className="bg-destructive text-white rounded-none font-black uppercase text-xs">Purge Unit</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button onClick={handleSave} disabled={isSaving} className="bg-foreground text-background hover:bg-foreground/90 rounded-none font-black uppercase italic tracking-widest h-10 px-6">
              {isSaving ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
              Secure Profile
            </Button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Identity Matrix */}
          <Card className="rounded-none border-2 border-border">
            <CardHeader className="bg-secondary/5 border-b border-border">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                <Bot className="h-4 w-4 text-primary" /> Identity Matrix
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase tracking-widest">Callsign</FormLabel>
                    <FormControl><Input {...field} className="rounded-none border-2 font-black italic uppercase" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="elevenLabs.apiKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase tracking-widest">ElevenLabs Network Key</FormLabel>
                    <FormControl><Input type="password" placeholder="sk_..." {...field} value={field.value || ""} className="rounded-none border-2" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="elevenLabs.voiceId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest">Voice ID</FormLabel>
                      <FormControl><Input {...field} value={field.value || ""} className="rounded-none border-2 text-xs" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="elevenLabs.modelId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest">Model</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger className="rounded-none border-2 text-[10px] uppercase font-bold"><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent className="rounded-none">
                          <SelectItem value="eleven_multilingual_v2">Multilingual v2</SelectItem>
                          <SelectItem value="eleven_turbo_v2">Turbo v2</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Integration Link */}
          <Card className="rounded-none border-2 border-border">
            <CardHeader className="bg-secondary/5 border-b border-border">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" /> Twilio Comms Link
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <FormField
                control={form.control}
                name="twilio.accountSid"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase tracking-widest">Twilio SID</FormLabel>
                    <FormControl><Input {...field} value={field.value || ""} className="rounded-none border-2 font-mono text-[10px]" /></FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="twilio.authToken"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase tracking-widest">Auth Token</FormLabel>
                    <FormControl><Input type="password" {...field} value={field.value || ""} className="rounded-none border-2" /></FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="twilio.phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase tracking-widest">Tactical Phone Number</FormLabel>
                    <FormControl><Input placeholder="+1XXXXXXXXXX" {...field} value={field.value || ""} className="rounded-none border-2" /></FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </div>

        {/* Intelligence Matrix */}
        <Card className="rounded-none border-2 border-border">
          <CardHeader className="bg-secondary/5 border-b border-border">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> Logic Engineering Matrix
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <FormField
              control={form.control}
              name="systemPromptDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest">Behavioral Objective</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="e.g., An expert BJJ instructor qualifying leads for trial classes with a motivating tone..." 
                      className="rounded-none border-2 min-h-[80px] text-sm"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <Button type="button" onClick={handleGeneratePrompt} disabled={isGenerating} size="sm" className="mt-2 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-none border-primary font-black uppercase tracking-widest text-[9px] h-8">
                    {isGenerating ? <Loader2 className="animate-spin h-3 w-3 mr-2" /> : <Sparkles className="h-3 w-3 mr-2" />}
                    Engineer Intelligence
                  </Button>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="systemPrompt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest">Final System Logic</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="System instructions will manifest here..." 
                      className="rounded-none border-2 min-h-[200px] font-mono text-[11px] bg-muted/20"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {agent.status === 'deployed' && <OutboundCallTester agent={agent} />}

        <div className="flex justify-end pt-4">
          <Button onClick={handleDeploy} disabled={isDeploying} className="bg-primary hover:bg-primary/90 text-white rounded-none font-black uppercase italic tracking-widest h-16 px-12 text-lg shadow-xl shadow-primary/20 transition-all hover:scale-[1.02]">
            {isDeploying ? <Loader2 className="animate-spin mr-3 h-6 w-6" /> : <Rocket className="mr-3 h-6 w-6" />}
            {agent.status === 'deployed' ? 'Update Unit Deployment' : 'Authorize & Launch Unit'}
          </Button>
        </div>
      </div>
    </Form>
  );
}
