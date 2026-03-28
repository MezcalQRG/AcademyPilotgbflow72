"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { CreditCard, Calendar, User, ShieldCheck, Mail, Phone } from "lucide-react";

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 10 }, (_, i) => (currentYear + i).toString().slice(-2));
const months = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));

const normalizedEmailField = z
  .string()
  .trim()
  .toLowerCase()
  .email({ message: "Invalid tactical email" });

const normalizedPhoneField = z
  .string()
  .trim()
  .transform((value) => value.replace(/[^\d+]/g, ''))
  .refine((value) => /^\+?[1-9]\d{8,14}$/.test(value), { message: 'Use E.164 format (+14155552671)' });

const paymentMethodSchema = z.object({
  cardholderName: z.string().trim().min(2, { message: "Required (Min 2 chars)" }),
  email: normalizedEmailField,
  phoneNumber: normalizedPhoneField,
  cardNumber: z.string().min(13).max(19).regex(/^\d+$/),
  expiryMonth: z.string().min(1),
  expiryYear: z.string().min(1),
  cvv: z.string().min(3).max(4).regex(/^\d+$/),
  cardType: z.enum(["visa", "mastercard", "amex", "discover", "other"]).optional(),
});

export type PaymentMethodFormData = z.infer<typeof paymentMethodSchema>;

interface PaymentMethodFormProps {
  onSubmit: (data: PaymentMethodFormData) => void;
  onCancel: () => void;
  initialData?: any;
  isEditing?: boolean;
}

export function PaymentMethodForm({ onSubmit, onCancel, initialData, isEditing = false }: PaymentMethodFormProps) {
  const form = useForm<PaymentMethodFormData>({
    resolver: zodResolver(paymentMethodSchema),
    defaultValues: {
      cardholderName: initialData?.cardholderName || "",
      email: initialData?.email || "",
      phoneNumber: initialData?.phoneNumber || "",
      cardNumber: "",
      expiryMonth: initialData?.expiryMonth || "",
      expiryYear: initialData?.expiryYear || "",
      cvv: "",
      cardType: initialData?.cardType || "other",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="cardholderName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                  <User className="h-3 w-3" /> Cardholder Matrix Name
                </FormLabel>
                <FormControl>
                  <Input placeholder="JANE DOE" {...field} className="rounded-none border-2 font-bold uppercase h-10 text-xs focus-visible:ring-primary" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                    <Mail className="h-3 w-3" /> Tactical Email
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="UNIT@EXAMPLE.COM" {...field} className="rounded-none border-2 font-bold h-10 text-xs focus-visible:ring-primary" />
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
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                    <Phone className="h-3 w-3" /> Comm Link (Phone)
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="+1 XXX XXX XXXX" {...field} className="rounded-none border-2 font-bold h-10 text-xs focus-visible:ring-primary" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator className="bg-border h-0.5" />

        <div className="space-y-4">
          <FormField
            control={form.control}
            name="cardNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                  <CreditCard className="h-3 w-3" /> Primary Card Number
                </FormLabel>
                <FormControl>
                  <Input placeholder="XXXX XXXX XXXX XXXX" {...field} className="rounded-none border-2 font-mono h-10 text-xs focus-visible:ring-primary" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="expiryMonth"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest">EXP Month</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="rounded-none border-2 h-10 text-xs"><SelectValue placeholder="MM" /></SelectTrigger>
                    </FormControl>
                    <SelectContent className="rounded-none border-2 border-border">
                      {months.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="expiryYear"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest">EXP Year</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="rounded-none border-2 h-10 text-xs"><SelectValue placeholder="YY" /></SelectTrigger>
                    </FormControl>
                    <SelectContent className="rounded-none border-2 border-border">
                      {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cvv"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest">CVV</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="***" {...field} className="rounded-none border-2 font-mono h-10 text-xs focus-visible:ring-primary" />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button type="button" variant="outline" onClick={onCancel} className="rounded-none font-black uppercase italic tracking-widest border-2 text-[10px] h-12 flex-1">Abort</Button>
          <Button type="submit" className="rounded-none font-black uppercase italic tracking-widest bg-primary hover:bg-primary/90 text-white text-[10px] h-12 flex-[2] shadow-lg">Secure Link</Button>
        </div>
      </form>
    </Form>
  );
}
