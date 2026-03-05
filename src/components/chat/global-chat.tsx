"use client";

import { useState, useTransition, useEffect } from 'react';
import { Send, Bot, User, Loader2, Zap, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { chatAssistantAction } from '@/app/actions';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useLocalStorage } from '@/hooks/use-local-storage';

interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  text: string;
}

export function GlobalChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [isPending, startTransition] = useTransition();
  
  // Persistent history using hydration-safe Local Storage
  const [history, setHistory] = useLocalStorage<any[]>('ai-tactical-history', []);
  
  // Local messages for the UI
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Sync LocalStorage history to UI messages on mount/change
  useEffect(() => {
    if (!history) return;
    
    const formatted = history
      .filter(m => m.role !== 'system')
      .map((m, i) => ({
        id: `h-${i}`,
        role: m.role === 'user' ? 'user' : 'ai',
        text: m.content?.[0]?.text || '',
      }));
    setMessages(formatted);
  }, [history]);

  const handleSendMessage = async () => {
    if (!question.trim()) return;

    const userMessage: ChatMessage = { id: Date.now().toString(), role: 'user', text: question };
    setMessages(prev => [...prev, userMessage]);
    setQuestion('');

    startTransition(async () => {
      try {
        const result = await chatAssistantAction({ 
          history: history, 
          message: userMessage.text 
        });
        
        // Update persistent history
        setHistory(result.history);
      } catch (error) {
        console.error('Error getting AI response:', error);
        const errorMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'ai',
          text: 'Tactical link failed. Please retry connection.',
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    });
  };

  const handleClearHistory = () => {
    setHistory([]);
    setMessages([]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="fixed bottom-6 right-6 rounded-none h-14 w-14 shadow-2xl border-2 border-primary bg-background hover:bg-primary hover:text-white transition-all z-50"
          aria-label="Open Global Chat"
        >
          <Zap className="h-6 w-6" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px] h-[70vh] flex flex-col p-0 rounded-none border-2 border-border shadow-2xl overflow-hidden">
        <DialogHeader className="p-6 pb-4 bg-secondary/5 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="font-headline text-2xl font-black uppercase italic tracking-tighter">AI Tactical Assistant</DialogTitle>
              <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Persistent Operations Link
              </DialogDescription>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none hover:bg-destructive/10 text-muted-foreground hover:text-destructive" onClick={handleClearHistory} title="Reset Matrix">
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        <div className="flex-grow overflow-hidden px-6">
          <ScrollArea className="h-full pr-4">
            <div className="space-y-4 py-4">
              {messages.length === 0 && (
                <p className="text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground py-10 opacity-40 italic">
                  Systems Ready. Awaiting Command.
                </p>
              )}
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-end space-x-2 ${
                    msg.role === 'user' ? 'justify-end' : ''
                  }`}
                >
                  {msg.role === 'ai' && (
                    <Avatar className="h-8 w-8 rounded-none border border-primary">
                      <AvatarFallback className="rounded-none bg-primary/10 text-primary"><Bot className="h-4 w-4" /></AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`max-w-[75%] rounded-none border px-4 py-2 text-sm font-medium ${
                      msg.role === 'user'
                        ? 'bg-primary text-white border-primary italic'
                        : 'bg-secondary/5 border-border'
                    }`}
                  >
                    <p>{msg.text}</p>
                  </div>
                  {msg.role === 'user' && (
                     <Avatar className="h-8 w-8 rounded-none border border-foreground">
                      <AvatarFallback className="rounded-none"><User className="h-4 w-4" /></AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              {isPending && (
                <div className="flex items-center space-x-2">
                   <Avatar className="h-8 w-8 rounded-none border border-primary">
                      <AvatarFallback className="rounded-none"><Bot className="h-4 w-4 text-primary" /></AvatarFallback>
                    </Avatar>
                  <div className="rounded-none border border-border bg-secondary/5 px-4 py-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
        <DialogFooter className="p-6 pt-4 border-t border-border bg-secondary/5">
          <div className="flex items-center gap-2 w-full">
            <Input
              placeholder="Enter operational command..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !isPending && handleSendMessage()}
              className="flex-1 rounded-none border-2 font-medium h-12"
              disabled={isPending}
            />
            <Button onClick={handleSendMessage} disabled={isPending || !question.trim()} size="icon" className="rounded-none bg-primary hover:bg-primary/90 h-12 w-12">
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
