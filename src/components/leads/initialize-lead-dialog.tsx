
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Zap, Loader2 } from "lucide-react";
import { useUser } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

const formSchema = z.object({
  firstName: z.string().min(2, "Required"),
  lastName: z.string().min(2, "Required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phoneNumber: z.string().min(10, "Required"),
});

export function InitializeLeadDialog({ isOpen, onOpenChange }: { isOpen: boolean; onOpenChange: (open: boolean) => void }) {
  const { user } = useUser();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) return;
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          userId: user.uid,
          qualificationStatus: "New",
          sourceType: "Manual",
          sourceEntityId: "manual_entry",
          capturedAt: new Date().toISOString(),
          tags: ["trial"],
          billingDay: Math.floor(Math.random() * 28) + 1,
          paymentHistory: [],
          savedPaymentMethods: [],
          notes: "Initial enrollment complete. Tactical briefing pending.",
        }),
      });

      if (!response.ok) throw new Error('Handshake failed');

      toast({
        title: "UNIT INITIALIZED",
        description: `${values.firstName} ${values.lastName} has been added to the tactical matrix.`,
      });
      
      form.reset();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "INITIALIZATION FAILURE",
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-none border-4 border-border bg-background shadow-2xl p-0 overflow-hidden max-w-lg">
        <DialogHeader className="p-8 bg-primary text-white border-b-4 border-border">
          <div className="flex items-center gap-3">
            <Zap className="h-8 w-8 text-white rotate-12" />
            <DialogTitle className="font-headline text-3xl font-black uppercase italic tracking-tighter">
              Lead Initialization
            </DialogTitle>
          </div>
          <DialogDescription className="text-white/80 font-bold uppercase tracking-widest text-[10px] mt-2">
            Protocol: Manual Enrollment Matrix (TAG: TRIAL)
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="p-8 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase tracking-widest">First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="JOHN" {...field} className="rounded-none border-2 font-bold uppercase" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase tracking-widest">Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="DOE" {...field} className="rounded-none border-2 font-bold uppercase" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest">Email Address (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="UNIT@EXAMPLE.COM" {...field} className="rounded-none border-2 font-bold uppercase" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest">Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="+1 555-0000" {...field} className="rounded-none border-2 font-bold" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="pt-4 flex gap-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1 rounded-none font-black uppercase italic border-2 h-14">
                Abort
              </Button>
              <Button type="submit" disabled={isSubmitting} className="flex-[2] bg-primary hover:bg-primary/90 text-white rounded-none font-black uppercase italic tracking-widest h-14 shadow-xl">
                {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : null}
                Commit to Matrix
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
