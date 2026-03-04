
"use client";

import { useState } from "react";
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
import { Search, Filter, Download, MessageSquare, Phone, MoreVertical } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const initialLeads = [
  { id: 1, name: "Alice Johnson", email: "alice@example.com", phone: "+1 555-0101", status: "New", source: "Facebook Ad", date: "2024-05-20" },
  { id: 2, name: "Bob Smith", email: "bob@example.com", phone: "+1 555-0102", status: "Qualified", source: "WhatsApp", date: "2024-05-19" },
  { id: 4, name: "Diana Prince", email: "diana@example.com", phone: "+1 555-0104", status: "Converted", source: "Messenger", date: "2024-05-18" },
  { id: 5, name: "Ethan Hunt", email: "ethan@example.com", phone: "+1 555-0105", status: "New", source: "Instagram Ad", date: "2024-05-18" },
  { id: 6, name: "Fiona Apple", email: "fiona@example.com", phone: "+1 555-0106", status: "Qualified", source: "Website", date: "2024-05-17" },
];

export default function LeadManagement() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredLeads = initialLeads.filter(lead => 
    lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-l-4 border-primary pl-6">
        <div>
          <h1 className="font-headline text-4xl font-black uppercase italic tracking-tighter leading-none">Lead Management</h1>
          <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mt-2">Database: Reviewing Potential Students</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 rounded-none font-black uppercase tracking-widest text-xs px-8">
          <Download className="mr-2 h-4 w-4" /> Export CSV
        </Button>
      </div>

      <div className="flex items-center gap-4 bg-card p-4 rounded-none border border-border shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search leads by name or email..." 
            className="pl-10 bg-background border-border rounded-none focus-visible:ring-primary"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" className="rounded-none font-black uppercase tracking-widest text-xs border-black hover:bg-black hover:text-white">
          <Filter className="mr-2 h-4 w-4" /> Filter
        </Button>
      </div>

      <div className="bg-card rounded-none border border-border overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-secondary/5">
            <TableRow className="border-b-2 border-b-border">
              <TableHead className="font-black uppercase tracking-widest text-[10px]">Student Name</TableHead>
              <TableHead className="font-black uppercase tracking-widest text-[10px]">Contact Info</TableHead>
              <TableHead className="font-black uppercase tracking-widest text-[10px]">Source</TableHead>
              <TableHead className="font-black uppercase tracking-widest text-[10px]">Status</TableHead>
              <TableHead className="font-black uppercase tracking-widest text-[10px]">Captured Date</TableHead>
              <TableHead className="text-right font-black uppercase tracking-widest text-[10px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLeads.map((lead) => (
              <TableRow key={lead.id} className="hover:bg-secondary/5 border-b border-border">
                <TableCell className="font-black uppercase italic">{lead.name}</TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1 text-[11px] font-medium">
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
                <TableCell className="text-muted-foreground text-[11px] font-bold uppercase">{lead.date}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary rounded-none">
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
                      <DropdownMenuContent align="end" className="rounded-none border-2 border-border">
                        <DropdownMenuItem className="font-bold uppercase text-[10px] tracking-widest">View Details</DropdownMenuItem>
                        <DropdownMenuItem className="font-bold uppercase text-[10px] tracking-widest">Edit Lead</DropdownMenuItem>
                        <DropdownMenuItem className="text-primary font-bold uppercase text-[10px] tracking-widest">Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function getStatusColor(status: string) {
  switch (status) {
    case 'New': return 'bg-blue-500 text-white';
    case 'Qualified': return 'bg-green-600 text-white';
    case 'Contacted': return 'bg-yellow-500 text-black';
    case 'Converted': return 'bg-primary text-white';
    case 'Lost': return 'bg-black text-white';
    default: return 'bg-secondary text-foreground';
  }
}
