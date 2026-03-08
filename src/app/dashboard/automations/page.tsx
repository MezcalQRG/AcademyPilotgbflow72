
"use client";

import React, { useState } from 'react';
import { 
  Zap, 
  MoreHorizontal, 
  Play, 
  RotateCcw, 
  Edit2, 
  Trash2, 
  ChevronDown,
  Search,
  Filter,
  BrainCircuit,
  Loader2
} from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import Link from 'next/link';
import { useCollection, useUser, useFirestore, useMemoFirebase, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';

export default function AutomationsPage() {
  const { user } = useUser();
  const db = useFirestore();
  const [search, setSearch] = useState('');

  // Path aligned with security rules: /user_profiles/{userId}/automations
  // Note: Added 'automationRules' to backend.json or using standard path
  const rulesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return collection(db, 'user_profiles', user.uid, 'automation_rules');
  }, [db, user]);

  const { data: rules, isLoading } = useCollection(rulesQuery);

  const toggleStatus = (id: string, currentStatus: string) => {
    if (!db || !user) return;
    const ruleRef = doc(db, 'user_profiles', user.uid, 'automation_rules', id);
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    updateDocumentNonBlocking(ruleRef, { status: newStatus, updatedAt: new Date().toISOString() });
  };

  const deleteRule = (id: string) => {
    if (!db || !user) return;
    const ruleRef = doc(db, 'user_profiles', user.uid, 'automation_rules', id);
    deleteDocumentNonBlocking(ruleRef);
  };

  const filteredRules = rules?.filter(r => r.name.toLowerCase().includes(search.toLowerCase())) || [];

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-l-4 border-primary pl-6">
        <div>
          <h1 className="font-headline text-4xl font-black uppercase italic tracking-tighter leading-none text-foreground">Automation Matrix</h1>
          <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mt-2">Ops: Engineering Autonomous Workflows</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/automations/new">
            <Button className="bg-primary hover:bg-primary/90 text-white rounded-none font-black uppercase italic tracking-widest h-12 px-8 shadow-xl">
              <Zap className="w-4 h-4 fill-current mr-2" />
              Initialize Protocol
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-4 bg-card/40 p-4 rounded-none border border-border shadow-sm">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search active protocols..." 
            className="pl-10 bg-background border-border rounded-none h-12 font-medium"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" className="rounded-none font-black uppercase tracking-widest text-xs h-12 gap-2 border-border">
          <Filter className="w-4 h-4" />
          Category Filter
        </Button>
      </div>

      <div className="rounded-none border-2 border-border bg-card shadow-md overflow-hidden">
        {isLoading ? (
          <div className="p-20 flex justify-center">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
          </div>
        ) : filteredRules.length === 0 ? (
          <div className="p-20 text-center space-y-4 opacity-40">
            <Zap className="h-16 w-16 mx-auto text-primary" />
            <h3 className="font-headline text-xl font-black uppercase italic">No Protocols Registered</h3>
            <p className="text-[10px] font-bold uppercase tracking-widest">Initialize your first autonomous flow to begin operation</p>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-secondary/5 border-b-2 border-border">
              <TableRow>
                <TableHead className="w-[400px] font-black uppercase italic tracking-widest text-[10px] h-14">Operational Logic</TableHead>
                <TableHead className="font-black uppercase italic tracking-widest text-[10px]">Status</TableHead>
                <TableHead className="font-black uppercase italic tracking-widest text-[10px]">Last Transmission</TableHead>
                <TableHead className="text-right font-black uppercase italic tracking-widest text-[10px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRules.map((rule) => (
                <TableRow key={rule.id} className="hover:bg-primary/5 transition-all group border-b border-border">
                  <TableCell className="py-6">
                    <div className="flex flex-col gap-1">
                      <span className="font-black uppercase italic text-lg leading-none">{rule.name}</span>
                      <span className="text-[9px] text-muted-foreground font-black uppercase tracking-widest">ID: {rule.id.substring(0, 12)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Switch 
                        checked={rule.status === 'active'} 
                        onCheckedChange={() => toggleStatus(rule.id, rule.status)}
                        className="data-[state=checked]:bg-primary"
                      />
                      <Badge 
                        className={`rounded-none font-black uppercase text-[9px] tracking-widest px-3 py-1 ${rule.status === 'active' ? 'bg-primary text-white shadow-[4px_4px_0px_rgba(0,0,0,0.1)]' : 'bg-muted text-foreground'}`}
                      >
                        {rule.status}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">
                    {rule.lastRunAt ? new Date(rule.lastRunAt).toLocaleString() : 'STANDBY'}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-none hover:bg-primary/10">
                          <MoreHorizontal className="w-5 h-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-none border-2 border-border bg-background w-56">
                        <DropdownMenuLabel className="font-black uppercase italic text-[10px] tracking-widest p-3">Protocol Controls</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="gap-3 p-3 font-bold uppercase text-[10px] tracking-widest cursor-pointer">
                          <Play className="w-4 h-4 text-primary" /> Execute Test
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-3 p-3 font-bold uppercase text-[10px] tracking-widest cursor-pointer">
                          <Edit2 className="w-4 h-4 text-primary" /> Modify Matrix
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="gap-3 p-3 font-black uppercase text-[10px] tracking-widest cursor-pointer text-primary" onClick={() => deleteRule(rule.id)}>
                          <Trash2 className="w-4 h-4" /> Decommission
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
