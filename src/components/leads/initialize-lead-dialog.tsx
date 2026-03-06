
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
import { Zap } from "lucide-react";
import { addDocumentNonBlocking, useUser, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  firstName: z.string().min(2, "Required"),
  lastName: z.string().min(2, "Required"),
  email: z.string().email("Invalid email"),
  phoneNumber: z.string().min(10, "Required"),
});

export function InitializeLeadDialog({ isOpen, onOpenChange }: { isOpen: boolean; onOpenChange: (open: boolean) => void }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  // Aligning path with security rules: /user_profiles/{userId}/leads
  const leadsRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'user_profiles', user.uid, 'leads');
  }, [firestore, user]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!leadsRef) return;

    const leadData = {
      ...values,
      qualificationStatus: "New",
      sourceType: "Manual",
      sourceEntityId: "manual_entry",
      capturedAt: new Date().toISOString(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      userId: user?.uid,
      tags: ["trial"], // Operational Tag: Identifying as Trial Unit per Command
      // Initialize with empty structures to prevent profile crashes
      billingDay: Math.floor(Math.random() * 28) + 1, // Random default billing day
      paymentHistory: [],
      savedPaymentMethods: [],
      notes: "Initial enrollment complete. Tactical briefing pending.",
    };

    addDocumentNonBlocking(leadsRef, leadData);

    toast({
      title: "UNIT INITIALIZED",
      description: `${values.firstName} ${values.lastName} has been added to the tactical matrix with TRIAL status.`,
    });
    
    form.reset();
    onOpenChange(false);
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
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest">Email Address</FormLabel>
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
              <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90 text-white rounded-none font-black uppercase italic tracking-widest h-14 shadow-xl">
                Commit to Matrix
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
