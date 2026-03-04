
"use client";

import { useState, useTransition, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Loader2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: Date;
}

interface LeadChatProps {
  leadId: string | number;
  leadName: string;
}

export function LeadChat({ leadId, leadName }: LeadChatProps) {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isSending, startTransition] = useTransition();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollViewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if (scrollViewport) {
        scrollViewport.scrollTop = scrollViewport.scrollHeight;
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  const handleSendMessage = () => {
    if (!message.trim()) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'agent',
      text: message,
      timestamp: new Date(),
    };
    
    setChatHistory(prev => [...prev, newMessage]);
    setMessage('');

    // Simulate lead response
    setTimeout(() => {
      const leadResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'user',
        text: `Oss! Thanks for the info regarding ${message.substring(0, 15)}...`,
        timestamp: new Date(),
      };
      setChatHistory(prev => [...prev, leadResponse]);
    }, 1500);
  };

  useEffect(() => {
    if (chatHistory.length === 0) {
      setChatHistory([
        {
          id: 'init',
          sender: 'user',
          text: 'Hello, I saw the GB1 Fundamentals ad. Do you have morning classes?',
          timestamp: new Date(Date.now() - 3600000),
        }
      ]);
    }
  }, []);

  return (
    <Card className="flex flex-col h-[500px] rounded-none border-2 border-border bg-card shadow-sm">
      <CardHeader className="bg-secondary/5 border-b border-border py-4">
        <CardTitle className="font-headline text-lg font-black uppercase italic tracking-tighter flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          Tactical Comms: {leadName}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow overflow-hidden p-0 bg-background/50">
        <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {chatHistory.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-end gap-2 ${
                  msg.sender === 'agent' ? 'justify-end' : ''
                }`}
              >
                {msg.sender === 'user' && (
                  <Avatar className="h-8 w-8 rounded-none border border-border">
                    <AvatarFallback className="rounded-none bg-secondary/10 font-bold text-[10px]">{leadName.charAt(0)}</AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`max-w-[80%] p-3 text-sm rounded-none border-2 ${
                    msg.sender === 'agent'
                      ? 'bg-primary text-white border-primary italic shadow-[2px_2px_0px_rgba(0,0,0,0.1)]'
                      : 'bg-card border-border font-medium'
                  }`}
                >
                  <p>{msg.text}</p>
                  <p className={`text-[9px] mt-1 font-black uppercase tracking-widest ${msg.sender === 'agent' ? 'text-white/70' : 'text-muted-foreground'}`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                 {msg.sender === 'agent' && (
                  <Avatar className="h-8 w-8 rounded-none border border-primary">
                    <AvatarFallback className="rounded-none bg-primary/10 text-primary font-black italic">GB</AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
      <div className="border-t-2 border-border p-4 bg-secondary/5">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Type tactical response..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            className="rounded-none border-2 h-12 bg-background font-medium"
          />
          <Button onClick={handleSendMessage} disabled={!message.trim()} size="icon" className="rounded-none h-12 w-12 bg-primary hover:bg-primary/90">
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
