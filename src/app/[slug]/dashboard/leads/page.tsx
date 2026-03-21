"use client";

import { useState, useMemo, useEffect } from "react";
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
import { useParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

export default function LeadManagement() {
  const params = useParams();
  const tenantSlug = params?.slug as string;
  const { toast } = useToast();

  const [leads, setLeads] = useState<any[]>([]);
  const [isLeadsLoading, setIsLeadsLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isInitDialogOpen, setIsInitDialogOpen] = useState(false);

  // Data Fetching via the Secure Next.js Orchestrator Proxy
  useEffect(() => {
    async function fetchLeads() {
      if (!tenantSlug) return;
      setIsLeadsLoading(true);
      try {
        const response = await fetch('/api/orchestrator', { // Updated to use the new secure proxy route
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'GET_LEADS', // The Orchestrator action
            payload: {
              tenantSlug: tenantSlug, // Mandatory for tenant isolation
              limit: 100 // Example filter
            }
          })
        });

        if (!response.ok) {
           const errData = await response.json();
           throw new Error(errData.error || 'Network response was not ok');
        }
        
        const data = await response.json();
        
        if (data.success && data.leads) {
          setLeads(data.leads);
        } else {
           console.error("Backend error:", data.error);
           toast({ title: "Error fetching leads", description: data.error, variant: "destructive" });
        }
      } catch (error: any) {
        console.error("Failed to fetch leads:", error);
        toast({ title: "Connection Error", description: error.message || "Could not reach the tactical backend.", variant: "destructive" });
      } finally {
        setIsLeadsLoading(false);
      }
    }

    fetchLeads();
  }, [tenantSlug, toast]);

  const filteredLeads = useMemo(() => {
    let result = [...leads].filter(lead => 
      lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.clase?.toLowerCase().includes(searchTerm.toLowerCase())
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

  if (isLeadsLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="font-headline font-black uppercase italic tracking-widest text-primary text-sm">Interfacing with Tactical Backend...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header and Controls */}
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
            placeholder="Search leads by name, phone, or class..." 
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
              <TableHead onClick={() => toggleSort('name')} className="cursor-pointer font-black uppercase tracking-widest text-[10px] h-14">
                Student <ArrowUpDown className="inline ml-1 h-3 w-3" />
              </TableHead>
              <TableHead className="font-black uppercase tracking-widest text-[10px]">Contact Info</TableHead>
              <TableHead className="font-black uppercase tracking-widest text-[10px]">Source & Class</TableHead>
              <TableHead className="font-black uppercase tracking-widest text-[10px]">Processing Status</TableHead>
              <TableHead onClick={() => toggleSort('createdAt')} className="cursor-pointer font-black uppercase tracking-widest text-[10px]">
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
                    {lead.name}
                  </button>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1 text-[11px] font-medium uppercase">
                    <span className="font-bold">{lead.phone}</span>
                  </div>
                </TableCell>
                <TableCell>
                   <div className="flex flex-col gap-1">
                      <Badge variant="outline" className="font-black text-[9px] uppercase tracking-widest border-primary text-primary rounded-none w-fit">
                        {lead.source || 'Manual'}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground uppercase">{lead.clase}</span>
                   </div>
                </TableCell>
                <TableCell>
                  <Badge className={`font-black uppercase tracking-widest text-[9px] rounded-none ${lead.processed ? 'bg-green-600 text-white' : 'bg-yellow-500 text-black'}`}>
                    {lead.processed ? 'Processed' : 'Pending Callback'}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-[11px] font-bold uppercase tracking-tighter">
                  {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : 'N/A'}
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