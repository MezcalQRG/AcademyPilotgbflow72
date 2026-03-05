
"use client";

import { useState, useMemo } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Filter, Download, MessageSquare, Phone, MoreVertical, ArrowUpDown, Loader2, UserPlus } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { LeadProfileDialog } from "@/components/leads/lead-profile-dialog";
import { InitializeLeadDialog } from "@/components/leads/initialize-lead-dialog";
import { useCollection, useUser, useMemoFirebase, useFirestore } from "@/firebase";
import { collection } from "firebase/firestore";

export default function LeadManagement() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isInitDialogOpen, setIsInitDialogOpen] = useState(false);

  // Memoize the collection reference
  const leadsRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'users', user.uid, 'leads');
  }, [firestore, user]);

  const { data: leads, isLoading: isLeadsLoading } = useCollection(leadsRef);

  const filteredLeads = useMemo(() => {
    if (!leads) return [];
    let result = [...leads].filter(lead => 
      lead.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (sortKey) {
      result.sort((a: any, b: any) => {
        if (a[sortKey] < b[sortKey]) return sortOrder === 'asc' ? -1 : 1;
        if (a[sortKey] > b[sortKey]) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [leads, searchTerm, sortKey, sortOrder]);

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const handleLeadClick = (lead: any) => {
    setSelectedLead(lead);
    setIsProfileOpen(true);
  };

  if (isUserLoading || isLeadsLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-l-4 border-primary pl-6">
        <div>
          <h1 className="font-headline text-4xl font-black uppercase italic tracking-tighter leading-none text-foreground">Lead Registry</h1>
          <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mt-2">Database: Live Tactical Analysis</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => setIsInitDialogOpen(true)} 
            variant="outline" 
            className="rounded-none font-black uppercase tracking-widest text-xs px-6 border-primary text-primary hover:bg-primary hover:text-white"
          >
            <UserPlus className="mr-2 h-4 w-4" /> Initialize Lead
          </Button>
          <Button className="bg-primary hover:bg-primary/90 rounded-none font-black uppercase tracking-widest text-xs px-8">
            <Download className="mr-2 h-4 w-4" /> Tactical Export
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4 bg-card p-4 rounded-none border border-border shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search leads by name or email..." 
            className="pl-10 bg-background border-border rounded-none focus-visible:ring-primary h-12 text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" className="rounded-none font-black uppercase tracking-widest text-xs border-foreground hover:bg-foreground hover:text-background h-12">
          <Filter className="mr-2 h-4 w-4" /> Status Filter
        </Button>
      </div>

      <div className="bg-card rounded-none border border-border overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-secondary/5">
            <TableRow className="border-b-2 border-b-border">
              <TableHead onClick={() => toggleSort('firstName')} className="cursor-pointer font-black uppercase tracking-widest text-[10px] h-14">
                Student <ArrowUpDown className="inline ml-1 h-3 w-3" />
              </TableHead>
              <TableHead className="font-black uppercase tracking-widest text-[10px]">Contact Info</TableHead>
              <TableHead className="font-black uppercase tracking-widest text-[10px]">Source</TableHead>
              <TableHead className="font-black uppercase tracking-widest text-[10px]">Status</TableHead>
              <TableHead onClick={() => toggleSort('capturedAt')} className="cursor-pointer font-black uppercase tracking-widest text-[10px]">
                Captured <ArrowUpDown className="inline ml-1 h-3 w-3" />
              </TableHead>
              <TableHead className="text-right font-black uppercase tracking-widest text-[10px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLeads.map((lead) => (
              <TableRow key={lead.id} className="hover:bg-secondary/5 border-b border-border group transition-colors">
                <TableCell>
                  <button 
                    onClick={() => handleLeadClick(lead)}
                    className="font-black uppercase italic text-sm hover:text-primary transition-all text-left underline underline-offset-4 decoration-primary/30 decoration-dashed hover:decoration-primary"
                  >
                    {lead.firstName} {lead.lastName}
                  </button>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1 text-[11px] font-medium uppercase">
                    <span className="text-muted-foreground">{lead.email}</span>
                    <span className="font-bold">{lead.phoneNumber}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-black text-[9px] uppercase tracking-widest border-primary text-primary rounded-none">
                    {lead.sourceType}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={`font-black uppercase tracking-widest text-[9px] rounded-none ${getStatusColor(lead.qualificationStatus)}`}>
                    {lead.qualificationStatus}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-[11px] font-bold uppercase tracking-tighter">
                  {lead.capturedAt ? new Date(lead.capturedAt).toLocaleDateString() : 'N/A'}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary rounded-none" onClick={() => handleLeadClick(lead)}>
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary rounded-none">
                      <Phone className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-none border-2 border-border bg-background">
                        <DropdownMenuItem onClick={() => handleLeadClick(lead)} className="font-bold uppercase text-[10px] tracking-widest cursor-pointer">Detailed Profile</DropdownMenuItem>
                        <DropdownMenuItem className="font-bold uppercase text-[10px] tracking-widest cursor-pointer">Edit Matrix</DropdownMenuItem>
                        <DropdownMenuItem className="text-primary font-bold uppercase text-[10px] tracking-widest cursor-pointer">Archive Unit</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filteredLeads.length === 0 && (
          <div className="text-center py-20 opacity-40">
            <Search className="h-12 w-12 mx-auto mb-4 text-primary" />
            <p className="font-headline text-xl font-black uppercase italic">No Strategic Leads Found</p>
            <p className="text-[10px] font-bold uppercase tracking-widest mt-2">Initialize a lead or adjust your filters to view tactical data</p>
          </div>
        )}
      </div>

      <LeadProfileDialog 
        lead={selectedLead} 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)} 
      />

      <InitializeLeadDialog 
        isOpen={isInitDialogOpen} 
        onOpenChange={setIsInitDialogOpen} 
      />
    </div>
  );
}

function getStatusColor(status: string) {
  switch (status) {
    case 'New': return 'bg-blue-600 text-white';
    case 'Qualified': return 'bg-green-600 text-white';
    case 'Contacted': return 'bg-yellow-500 text-black';
    case 'Converted': return 'bg-primary text-white shadow-[2px_2px_0px_rgba(0,0,0,0.2)]';
    default: return 'bg-muted text-foreground';
  }
}
