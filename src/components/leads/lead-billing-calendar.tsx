
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { CalendarCheck2, ShieldCheck } from "lucide-react";

interface LeadBillingCalendarProps {
  lead: {
    id: number;
    billingDay?: number;
    paymentHistory?: any[];
  };
}

export function LeadBillingCalendar({ lead }: LeadBillingCalendarProps) {
  const [currentDisplayMonth, setCurrentDisplayMonth] = useState<Date>(new Date());
  const [calendarModifiers, setCalendarModifiers] = useState({});
  const [calendarModifierClassNames, setCalendarModifierClassNames] = useState({});

  useEffect(() => {
    const year = currentDisplayMonth.getFullYear();
    const month = currentDisplayMonth.getMonth();

    const billingDays: Date[] = [];
    if (lead.billingDay) {
      const date = new Date(year, month, lead.billingDay);
      if (date.getFullYear() === year && date.getMonth() === month) {
        billingDays.push(date);
      }
    }

    const paidDays: Date[] = lead.paymentHistory
      ?.filter(p => p.status === 'paid')
      .map(p => new Date(p.date))
      .filter(d => d.getFullYear() === year && d.getMonth() === month) || [];

    setCalendarModifiers({
      billingDay: billingDays,
      paidDay: paidDays,
      today: new Date(),
    });

    setCalendarModifierClassNames({
      billingDay: '!bg-primary !text-white rounded-none font-black italic border-2 border-primary',
      paidDay: '!bg-green-600 !text-white rounded-none border-2 border-green-700',
      today: 'border-2 border-foreground rounded-none shadow-[2px_2px_0px_rgba(0,0,0,0.1)]',
    });

  }, [lead.billingDay, lead.paymentHistory, currentDisplayMonth]);

  return (
    <Card className="rounded-none border-2 border-border shadow-sm overflow-hidden">
      <CardHeader className="bg-secondary/5 border-b border-border py-4">
        <CardTitle className="font-headline text-sm font-black uppercase italic tracking-widest flex items-center gap-2">
          <CalendarCheck2 className="h-4 w-4 text-primary" />
          Enrollment Billing Hub
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center p-6 bg-background/50">
        <Calendar
          month={currentDisplayMonth}
          onMonthChange={setCurrentDisplayMonth}
          modifiers={calendarModifiers}
          modifiersClassNames={calendarModifierClassNames}
          className="rounded-none border-2 border-border p-2 bg-background"
          numberOfMonths={1}
        />
        <div className="mt-6 space-y-2 w-full text-[10px] font-black uppercase tracking-widest text-muted-foreground border-t border-border pt-4">
            <div className="flex items-center gap-3">
                <span className="h-3 w-3 bg-primary border border-primary shadow-[1px_1px_0px_rgba(0,0,0,0.1)]"></span>
                <span>Scheduled Billing Cycle</span>
            </div>
            <div className="flex items-center gap-3">
                <span className="h-3 w-3 bg-green-600 border border-green-700 shadow-[1px_1px_0px_rgba(0,0,0,0.1)]"></span>
                <span>Confirmed Tuition Received</span>
            </div>
             <div className="flex items-center gap-3">
                <span className="h-3 w-3 border-2 border-foreground"></span>
                <span>Current Tactical Date</span>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
