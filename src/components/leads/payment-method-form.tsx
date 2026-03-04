
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
import { CreditCard, Calendar, User, ShieldCheck } from "lucide-react";

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 10 }, (_, i) => (currentYear + i).toString().slice(-2));
const months = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));

const paymentMethodSchema = z.object({
  cardholderName: z.string().min(2, { message: "Required (Min 2 chars)" }),
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
        <FormField
          control={form.control}
          name="cardholderName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[10px] font-black uppercase tracking-widest">Cardholder Matrix Name</FormLabel>
              <FormControl>
                <Input placeholder="JANE DOE" {...field} className="rounded-none border-2 font-bold uppercase" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="cardNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[10px] font-black uppercase tracking-widest">Primary Card Number</FormLabel>
              <FormControl>
                <Input placeholder="XXXX XXXX XXXX XXXX" {...field} className="rounded-none border-2 font-mono" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="expiryMonth"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] font-black uppercase tracking-widest">EXP Month</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="rounded-none border-2"><SelectValue placeholder="MM" /></SelectTrigger>
                  </FormControl>
                  <SelectContent className="rounded-none">
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
                    <SelectTrigger className="rounded-none border-2"><SelectValue placeholder="YY" /></SelectTrigger>
                  </FormControl>
                  <SelectContent className="rounded-none">
                    {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="cvv"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[10px] font-black uppercase tracking-widest">Secure CVV Code</FormLabel>
              <FormControl>
                <Input type="password" placeholder="***" {...field} className="rounded-none border-2 font-mono" />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button type="button" variant="outline" onClick={onCancel} className="rounded-none font-black uppercase italic tracking-widest border-2">Abort</Button>
          <Button type="submit" className="rounded-none font-black uppercase italic tracking-widest bg-primary hover:bg-primary/90 text-white">Secure Link</Button>
        </div>
      </form>
    </Form>
  );
}
