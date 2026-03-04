
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
import { Search, Filter, Download, MessageSquare, Phone, MoreVertical, ArrowUpDown } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { LeadProfileDialog } from "@/components/leads/lead-profile-dialog";

const initialLeads = [
  { 
    id: 1, 
    name: "Alice Johnson", 
    email: "alice@example.com", 
    phone: "+1 555-0101", 
    status: "New", 
    source: "Facebook Ad", 
    date: "2024-05-20",
    billingDay: 15,
    paymentHistory: [
      { id: 'p1', date: '2024-04-15', amount: 150, status: 'paid', method: 'Visa' },
      { id: 'p2', date: '2024-03-15', amount: 150, status: 'paid', method: 'Visa' }
    ],
    savedPaymentMethods: [
      { id: 'pm1', last4: '4242', type: 'VISA', exp: '12/26', name: 'ALICE JOHNSON' }
    ]
  },
  { 
    id: 2, 
    name: "Bob Smith", 
    email: "bob@example.com", 
    phone: "+1 555-0102", 
    status: "Qualified", 
    source: "WhatsApp", 
    date: "2024-05-19",
    billingDay: 1,
    paymentHistory: [],
    savedPaymentMethods: []
  },
  { 
    id: 4, 
    name: "Diana Prince", 
    email: "diana@example.com", 
    phone: "+1 555-0104", 
    status: "Converted", 
    source: "Messenger", 
    date: "2024-05-18",
    billingDay: 5,
    paymentHistory: [
      { id: 'p3', date: '2024-05-05', amount: 200, status: 'paid', method: 'Amex' }
    ],
    savedPaymentMethods: [
      { id: 'pm2', last4: '1001', type: 'AMEX', exp: '08/27', name: 'DIANA PRINCE' }
    ]
  },
  { 
    id: 5, 
    name: "Ethan Hunt", 
    email: "ethan@example.com", 
    phone: "+1 555-0105", 
    status: "New", 
    source: "Instagram Ad", 
    date: "2024-05-18",
    billingDay: 20
  },
  { 
    id: 6, 
    name: "Fiona Apple", 
    email: "fiona@example.com", 
    phone: "+1 555-0106", 
    status: "Qualified", 
    source: "Website", 
    date: "2024-05-17",
    billingDay: 10
  },
];

export default function LeadManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const filteredLeads = useMemo(() => {
    let result = [...initialLeads].filter(lead => 
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (sortKey) {
      result.sort((a: any, b: any) => {
        if (a[sortKey] < b[sortKey]) return sortOrder === 'asc' ? -1 : 1;
        if (a[sortKey] > b[sortKey]) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [searchTerm, sortKey, sortOrder]);

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

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-l-4 border-primary pl-6">
        <div>
          <h1 className="font-headline text-4xl font-black uppercase italic tracking-tighter leading-none text-foreground">Lead Registry</h1>
          <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mt-2">Database: Analysis of High-Potential Students</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 rounded-none font-black uppercase tracking-widest text-xs px-8">
          <Download className="mr-2 h-4 w-4" /> Tactical Export
        </Button>
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
              <TableHead onClick={() => toggleSort('name')} className="cursor-pointer font-black uppercase tracking-widest text-[10px] h-14">
                Student <ArrowUpDown className="inline ml-1 h-3 w-3" />
              </TableHead>
              <TableHead className="font-black uppercase tracking-widest text-[10px]">Contact Info</TableHead>
              <TableHead className="font-black uppercase tracking-widest text-[10px]">Source</TableHead>
              <TableHead className="font-black uppercase tracking-widest text-[10px]">Status</TableHead>
              <TableHead onClick={() => toggleSort('date')} className="cursor-pointer font-black uppercase tracking-widest text-[10px]">
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
                    <span className="text-muted-foreground">{lead.email}</span>
                    <span className="font-bold">{lead.phone}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-black text-[9px] uppercase tracking-widest border-primary text-primary rounded-none">
                    {lead.source}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={`font-black uppercase tracking-widest text-[9px] rounded-none ${getStatusColor(lead.status)}`}>
                    {lead.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-[11px] font-bold uppercase tracking-tighter">{lead.date}</TableCell>
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
      </div>

      <LeadProfileDialog 
        lead={selectedLead} 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)} 
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
