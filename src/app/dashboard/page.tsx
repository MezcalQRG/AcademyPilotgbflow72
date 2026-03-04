
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Megaphone, MessageSquare, TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";

const data = [
  { name: 'Mon', leads: 12, campaigns: 4 },
  { name: 'Tue', leads: 19, campaigns: 3 },
  { name: 'Wed', leads: 15, campaigns: 5 },
  { name: 'Thu', leads: 22, campaigns: 6 },
  { name: 'Fri', leads: 30, campaigns: 8 },
  { name: 'Sat', leads: 10, campaigns: 2 },
  { name: 'Sun', leads: 8, campaigns: 2 },
];

export default function DashboardOverview() {
  return (
    <div className="space-y-8">
      <div className="border-l-4 border-primary pl-6">
        <h1 className="font-headline text-4xl font-black uppercase italic tracking-tighter leading-none">Automation Overview</h1>
        <p className="text-muted-foreground font-medium uppercase tracking-widest text-[10px] mt-2">Mission Control: Monitoring Performance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard 
          title="Total Leads" 
          value="1,284" 
          change="+12.5%" 
          positive={true} 
          icon={<Users className="h-5 w-5 text-primary" />} 
        />
        <StatsCard 
          title="Ad Reach" 
          value="48.2k" 
          change="+5.2%" 
          positive={true} 
          icon={<Megaphone className="h-5 w-5 text-primary" />} 
        />
        <StatsCard 
          title="AI Conversations" 
          value="3,412" 
          change="-2.4%" 
          positive={false} 
          icon={<MessageSquare className="h-5 w-5 text-primary" />} 
        />
        <StatsCard 
          title="Conversion Rate" 
          value="8.4%" 
          change="+1.2%" 
          positive={true} 
          icon={<TrendingUp className="h-5 w-5 text-primary" />} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-card border-border shadow-md rounded-none">
          <CardHeader>
            <CardTitle className="font-headline text-xl font-black uppercase italic">Lead Generation Performance</CardTitle>
            <CardDescription className="text-[10px] uppercase font-bold tracking-widest">Captured leads across all automation channels</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} tick={{fontWeight: 'bold'}} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} tick={{fontWeight: 'bold'}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0px' }}
                  itemStyle={{ color: 'hsl(var(--foreground))', fontSize: '12px', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="leads" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorLeads)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-md rounded-none">
          <CardHeader>
            <CardTitle className="font-headline text-xl font-black uppercase italic">Recent Activity</CardTitle>
            <CardDescription className="text-[10px] uppercase font-bold tracking-widest">Latest events from your pilot</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {[
                { user: "Sarah Miller", action: "Qualified via WhatsApp", time: "2m ago", type: "chat" },
                { user: "Ad Campaign Alpha", action: "12 new leads generated", time: "15m ago", type: "ad" },
                { user: "Messenger Bot", action: "Replied to 4 inquiries", time: "1h ago", type: "chat" },
                { user: "Michael Chen", action: "Appointment booked via WhatsApp", time: "3h ago", type: "chat" },
              ].map((activity, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className={`mt-1 h-2 w-2 rounded-none rotate-45 ${activity.type === 'chat' ? 'bg-primary' : 'bg-foreground'}`} />
                  <div className="space-y-1">
                    <p className="text-sm font-black uppercase italic">{activity.user}</p>
                    <p className="text-xs text-muted-foreground font-medium">{activity.action}</p>
                    <p className="text-[10px] text-primary font-black uppercase tracking-widest">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatsCard({ title, value, change, positive, icon }: { 
  title: string, value: string, change: string, positive: boolean, icon: React.ReactNode 
}) {
  return (
    <Card className="bg-card border-border shadow-md rounded-none border-b-4 border-b-primary">
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div className="p-2 bg-secondary/10 rounded-none border border-border">
            {icon}
          </div>
          <div className={`flex items-center text-[10px] font-black uppercase tracking-widest ${positive ? 'text-green-500' : 'text-primary'}`}>
            {change}
            {positive ? <ArrowUpRight className="ml-1 h-3 w-3" /> : <ArrowDownRight className="ml-1 h-3 w-3" />}
          </div>
        </div>
        <div className="mt-4">
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{title}</p>
          <p className="text-3xl font-headline font-black italic mt-1">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
