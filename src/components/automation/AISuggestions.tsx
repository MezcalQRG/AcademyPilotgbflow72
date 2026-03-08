
"use client";

import React, { useState } from 'react';
import { BrainCircuit, Sparkles, Loader2, Plus, Zap, Filter, MousePointer2, Settings, ArrowRight } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { receiveAutomationSuggestionsAction } from '@/app/actions';
import { type AutomationSuggestionOutput } from '@/ai/flows/receive-automation-suggestions';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface AISuggestionsProps {
  onSelect: (type: 'trigger' | 'condition' | 'action', value: any) => void;
}

export function AISuggestions({ onSelect }: AISuggestionsProps) {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<AutomationSuggestionOutput | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const result = await receiveAutomationSuggestionsAction({ context: prompt });
      setSuggestions(result);
    } catch (error) {
      console.error("AI Engineering Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button 
        variant="outline" 
        size="sm" 
        className="gap-2 rounded-none border-primary text-primary hover:bg-primary hover:text-white font-black uppercase italic text-[10px] tracking-widest h-10 px-6"
        onClick={() => setOpen(true)}
      >
        <BrainCircuit className="w-4 h-4" />
        Consult AI Architect
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[700px] bg-background border-4 border-border rounded-none max-h-[90vh] flex flex-col p-0 overflow-hidden shadow-2xl">
          <DialogHeader className="p-8 bg-primary text-white border-b-4 border-border shrink-0">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-white/10 rounded-none border-2 border-white/20">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <div>
                <DialogTitle className="font-headline text-3xl font-black uppercase italic tracking-tighter">AI Logic Architect</DialogTitle>
                <DialogDescription className="text-white/80 font-bold uppercase tracking-widest text-[10px] mt-1">
                  Engineering tactical autonomous flows through cognitive processing.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="p-8 space-y-6 border-b-2 border-border bg-secondary/5">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Strategic Goal Objective</label>
                <Textarea 
                  placeholder="e.g. When a lead is captured from Facebook with 'Elite' status, transmit tactical data to HubSpot immediately." 
                  className="bg-background border-2 border-border rounded-none resize-none h-24 font-bold p-4 focus-visible:ring-primary"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
              </div>
              
              <Button 
                className="w-full bg-primary hover:bg-primary/90 text-white font-black uppercase italic tracking-[0.2em] h-14 shadow-xl" 
                onClick={handleGenerate}
                disabled={loading || !prompt.trim()}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin mr-3" /> : <Sparkles className="w-5 h-5 mr-3" />}
                ENGAGE COGNITIVE ENGINE
              </Button>
            </div>

            {suggestions ? (
              <ScrollArea className="flex-1 p-8 bg-background">
                <div className="space-y-10 pb-10">
                  {/* TRIGGERS */}
                  <section>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary mb-4 flex items-center gap-3">
                      <Zap className="w-4 h-4 fill-current" /> Suggested Entry Protocols
                    </h4>
                    <div className="flex flex-wrap gap-3">
                      {suggestions.triggers.map((t, i) => (
                        <button 
                          key={i} 
                          className="flex items-center gap-2 bg-secondary/10 hover:bg-primary hover:text-white border-2 border-border hover:border-primary transition-all p-3 rounded-none font-black uppercase italic text-[10px] tracking-widest group"
                          onClick={() => { onSelect('trigger', t); setOpen(false); }}
                        >
                          <Plus className="w-3 h-3 opacity-50 group-hover:opacity-100" /> {t}
                        </button>
                      ))}
                    </div>
                  </section>

                  {/* CONDITIONS */}
                  <section>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary mb-4 flex items-center gap-3">
                      <Filter className="w-4 h-4" /> Recommended Logical Gates
                    </h4>
                    <div className="flex flex-wrap gap-3">
                      {suggestions.conditions.map((c, i) => (
                        <button 
                          key={i} 
                          className="flex items-center gap-2 bg-secondary/10 hover:bg-primary hover:text-white border-2 border-border hover:border-primary transition-all p-3 rounded-none font-black uppercase italic text-[10px] tracking-widest group"
                          onClick={() => { onSelect('condition', c); setOpen(false); }}
                        >
                          <Plus className="w-3 h-3 opacity-50 group-hover:opacity-100" /> {c}
                        </button>
                      ))}
                    </div>
                  </section>

                  {/* ACTION PLAN */}
                  <section>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary mb-4 flex items-center gap-3">
                      <MousePointer2 className="w-4 h-4" /> Proposed Deployment Matrix
                    </h4>
                    <div className="space-y-4">
                      {suggestions.actions.map((a, i) => (
                        <div 
                          key={i}
                          className={cn(
                            "flex items-start gap-4 p-5 rounded-none border-2 border-border hover:border-primary group cursor-pointer transition-all bg-card shadow-sm",
                            a.type === 'push' && "border-l-8 border-l-blue-600",
                            a.type === 'pull' && "border-l-8 border-l-orange-500",
                            a.type === 'utility' && "border-l-8 border-l-primary"
                          )}
                          onClick={() => { 
                            onSelect('action', { type: a.id, value: a.label }); 
                            setOpen(false); 
                          }}
                        >
                          <div className="mt-1 shrink-0 p-2 bg-secondary/5 border border-border group-hover:border-primary transition-colors">
                            {a.type === 'push' && <Zap className="w-5 h-5 text-blue-600" />}
                            {a.type === 'pull' && <Settings className="w-5 h-5 text-orange-500" />}
                            {a.type === 'utility' && <Zap className="w-5 h-5 text-primary" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-black uppercase italic group-hover:text-primary transition-colors truncate">{a.label}</span>
                              <Badge variant="outline" className="text-[8px] uppercase font-black tracking-tighter h-4 rounded-none border-border">
                                {a.type}
                              </Badge>
                            </div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase leading-relaxed line-clamp-2">{a.description}</p>
                          </div>
                          <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-all self-center group-hover:translate-x-1" />
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              </ScrollArea>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center opacity-30 italic">
                <BrainCircuit className="h-16 w-16 mb-4 text-primary" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em]">Awaiting Objective Mission Brief...</p>
              </div>
            )}
          </div>

          <DialogFooter className="p-6 bg-secondary/5 border-t-2 border-border shrink-0">
            <Button variant="ghost" className="font-black uppercase italic text-xs tracking-widest hover:text-primary rounded-none" onClick={() => setOpen(false)}>Terminate Link</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
