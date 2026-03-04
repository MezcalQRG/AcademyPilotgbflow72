
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTransition } from "react";
import type { AgentProfile } from "@/lib/synth-types";
import { makeOutboundCallAction } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { PhoneCall, Loader2, Zap } from "lucide-react";

interface OutboundCallTesterProps {
  agent: AgentProfile;
}

const OutboundCallSchema = z.object({
  toNumber: z.string().min(10, { message: "Enter valid E.164 number." }),
  additionalContext: z.string().optional(),
});

export default function OutboundCallTester({ agent }: OutboundCallTesterProps) {
  const { toast } = useToast();
  const [isCalling, startCallTransition] = useTransition();

  const form = useForm<z.infer<typeof OutboundCallSchema>>({
    resolver: zodResolver(OutboundCallSchema),
    defaultValues: { toNumber: "", additionalContext: "" },
  });

  const onSubmit = (data: any) => {
    if (!agent.elevenLabs?.apiKey || !agent.elevenLabs?.agentId || !agent.elevenLabs.phoneNumberId) {
        toast({ variant: "destructive", title: "Config Missing", description: "Agent must be deployed with Twilio." });
        return;
    }

    startCallTransition(async () => {
      const result = await makeOutboundCallAction(
        agent.elevenLabs.apiKey!,
        agent.elevenLabs.agentId!,
        agent.elevenLabs.phoneNumberId!,
        data.toNumber,
        data.additionalContext
      );
      
      if (result.error) {
        toast({ variant: "destructive", title: "Call Failed", description: result.error });
      } else {
        toast({ title: "Tactical Dispatch Initiated", description: result.message });
      }
    });
  };

  return (
    <Card className="rounded-none border-2 border-border bg-background">
      <CardHeader className="bg-secondary/5 border-b border-border">
        <CardTitle className="font-headline text-lg font-black uppercase italic flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" /> Outbound Engagement Tester
        </CardTitle>
        <CardDescription className="text-[10px] font-bold uppercase tracking-widest">
          Initiate direct engagement protocols via Twilio
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="toNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest">Target Unit Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="+1XXXXXXXXXX" {...field} className="rounded-none border-2" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="additionalContext"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest">Mission Context Override</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Inject custom context for this specific interaction..."
                      className="min-h-[100px] rounded-none border-2 text-xs"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-[9px] uppercase font-bold text-muted-foreground">Injected as 'contexto_adicional' variable</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isCalling} className="w-full bg-primary hover:bg-primary/90 text-white rounded-none font-black uppercase italic tracking-widest h-12">
              {isCalling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PhoneCall className="mr-2 h-4 w-4" />}
              Dispatch Engagement
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
