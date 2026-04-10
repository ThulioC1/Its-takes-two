
'use client';
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Send, Mail, Heart, ArrowLeft, Trash2, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCollection, useFirestore, useUser, useMemoFirebase, useDoc } from "@/firebase";
import { collection, doc, addDoc, serverTimestamp, updateDoc, deleteDoc } from "firebase/firestore";
import type { LoveLetter, UserProfile } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

function LetterPaper({ message, onBack }: { message: LoveLetter; onBack: () => void }) {
  return (
    <div className="animate-in fade-in zoom-in duration-500 flex flex-col items-center max-w-2xl mx-auto w-full">
      <Button variant="ghost" onClick={onBack} className="self-start mb-4 group text-muted-foreground hover:text-primary">
        <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
        Voltar para o Baú
      </Button>
      
      <div className="relative w-full min-h-[600px] bg-white shadow-2xl rounded-sm p-8 md:p-16 overflow-y-auto border-t-[12px] border-primary/10">
        {/* Paper Texture Overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/paper.png')]" />
        
        <div className="flex justify-between items-start mb-12">
          <div className="space-y-1">
            <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold">De:</p>
            <p className="font-cursive text-2xl text-primary">{message.author.displayName}</p>
          </div>
          <div className="text-right">
             <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold">Data:</p>
             <p className="text-sm font-medium text-slate-500">{message.dateTime ? format(message.dateTime.toDate(), "dd 'de' MMMM, yyyy", { locale: ptBR }) : 'Hoje'}</p>
          </div>
        </div>

        <div className="font-cursive text-2xl md:text-3xl leading-[1.6] text-slate-800 whitespace-pre-wrap py-4 italic">
          {message.message}
        </div>

        <div className="mt-20 flex justify-center">
          <Heart className="text-primary/20 fill-primary/10 size-12 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  const [isWriting, setIsWriting] = useState(false);
  const [selectedLetter, setSelectedLetter] = useState<LoveLetter | null>(null);
  const [newMessage, setNewMessage] = useState("");

  const firestore = useFirestore();
  const { user } = useUser();

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile } = useDoc<UserProfile>(userProfileRef);
  const coupleId = userProfile?.coupleId;

  const messagesRef = useMemoFirebase(() => {
    if (!firestore || !coupleId) return null;
    return collection(firestore, 'couples', coupleId, 'loveLetters');
  }, [firestore, coupleId]);

  const { data: messages, isLoading } = useCollection<LoveLetter>(messagesRef);

  const sortedMessages = useMemo(() => {
    if (!messages) return [];
    return [...messages].sort((a, b) => {
        const timeA = a.dateTime?.toDate?.()?.getTime() || 0;
        const timeB = b.dateTime?.toDate?.()?.getTime() || 0;
        return timeB - timeA;
    });
  }, [messages]);

  const handleSendMessage = async () => {
    if (newMessage.trim() === "" || !messagesRef || !user || !user.displayName) return;

    await addDoc(messagesRef, {
      senderId: user.uid,
      recipientId: '', 
      message: newMessage,
      dateTime: serverTimestamp(),
      author: {
        uid: user.uid,
        displayName: user.displayName,
        photoURL: user.photoURL || null,
        gender: userProfile?.gender || 'Prefiro não informar',
      }
    });
    setNewMessage("");
    setIsWriting(false);
  };

  const handleDeleteLetter = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!messagesRef) return;
    await deleteDoc(doc(messagesRef, id));
    if (selectedLetter?.id === id) setSelectedLetter(null);
  };

  if (selectedLetter) {
    return <LetterPaper message={selectedLetter} onBack={() => setSelectedLetter(null)} />;
  }

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">Baú de Cartas</h1>
          <p className="text-muted-foreground">Onde cada palavra guardada é um pedaço da nossa história.</p>
        </div>
        <Button onClick={() => setIsWriting(true)} disabled={!coupleId} className="shadow-lg hover:scale-105 transition-all">
          <Mail className="mr-2 h-4 w-4" />
          Escrever Nova Carta
        </Button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="animate-bounce"><Mail className="size-12 text-primary/40" /></div>
          <p className="text-muted-foreground animate-pulse">Organizando os envelopes...</p>
        </div>
      ) : sortedMessages.length === 0 ? (
        <Card className="border-dashed py-20 bg-accent/20">
            <CardContent className="flex flex-col items-center text-center">
                <Mail className="size-16 text-muted-foreground/30 mb-4" />
                <h3 className="text-xl font-semibold mb-2">O baú está vazio</h3>
                <p className="text-muted-foreground max-w-xs">Que tal ser a primeira pessoa a deixar uma lembrança hoje?</p>
            </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {sortedMessages.map((letter) => (
            <div 
              key={letter.id} 
              onClick={() => setSelectedLetter(letter)}
              className="group cursor-pointer"
            >
              <div className="relative bg-white border border-border/60 shadow-sm hover:shadow-xl transition-all duration-500 rounded-xl overflow-hidden aspect-[4/3] flex flex-col justify-between group-hover:-translate-y-2">
                {/* Top Border Band */}
                <div className="absolute top-0 left-0 w-full h-[6px] bg-primary/20" />
                
                {/* Header Content */}
                <div className="p-6 pb-0 flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <Mail className="size-4 text-primary" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
                        {letter.senderId === user?.uid ? 'SUA PARA O PAR' : `DE: ${letter.author.displayName.split(' ')[0]}`}
                    </span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 text-destructive hover:bg-destructive/10 transition-opacity"
                    onClick={(e) => handleDeleteLetter(e, letter.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>

                {/* Central Sealed Heart */}
                <div className="flex flex-col items-center justify-center flex-1">
                    <div className="relative flex items-center justify-center">
                        {/* Glow effect */}
                        <div className="absolute size-14 bg-primary/10 rounded-full blur-xl animate-pulse" />
                        {/* Outer heart (ring) */}
                        <div className="absolute size-12 rounded-full border-2 border-primary/10 flex items-center justify-center">
                           <div className="size-8 rounded-full border border-primary/20 flex items-center justify-center" />
                        </div>
                        {/* Main heart */}
                        <Heart className="size-8 text-primary fill-primary relative z-10 transition-transform duration-300 group-hover:scale-110" />
                    </div>
                </div>

                {/* Footer Content */}
                <div className="px-6 pb-6">
                  <div className="h-px w-full bg-slate-100 mb-4" />
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 text-[10px] font-medium text-slate-400 uppercase tracking-widest">
                      <Calendar className="size-3" />
                      {letter.dateTime ? format(letter.dateTime.toDate(), 'dd/MM/yy') : 'RECENTE'}
                    </div>
                    <span className="text-[10px] font-bold text-primary uppercase tracking-[0.15em] group-hover:underline transition-all">
                        ABRIR CARTA
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={isWriting} onOpenChange={setIsWriting}>
        <DialogContent className="sm:max-w-xl p-0 overflow-hidden border-none bg-transparent shadow-none">
          <DialogHeader className="sr-only">
            <DialogTitle>Escrever Nova Carta de Amor</DialogTitle>
          </DialogHeader>
          <div className="bg-white rounded-sm shadow-2xl overflow-hidden flex flex-col h-[550px]">
            <div className="p-4 bg-primary/90 text-primary-foreground flex justify-between items-center backdrop-blur-sm">
              <span className="font-bold font-headline uppercase tracking-widest text-[10px]">Escrevendo uma carta de amor</span>
              <Heart className="size-4 fill-current" />
            </div>
            
            <div className="flex-1 relative p-8 md:p-12">
               <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/paper.png')]" />
               <div className="flex justify-between mb-6 border-b border-slate-100 pb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Para seu par...</span>
                  <span className="text-[10px] text-slate-400 font-medium">{format(new Date(), 'dd/MM/yyyy')}</span>
               </div>
               <Textarea 
                 placeholder="Deixe seu coração falar..." 
                 className="h-full border-none focus-visible:ring-0 text-xl font-cursive leading-relaxed bg-transparent resize-none placeholder:text-slate-300 italic"
                 value={newMessage}
                 onChange={(e) => setNewMessage(e.target.value)}
               />
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
               <Button variant="ghost" onClick={() => setIsWriting(false)} className="text-slate-500">Descartar</Button>
               <Button onClick={handleSendMessage} disabled={!newMessage.trim()} className="px-8 shadow-md">
                 <Send className="mr-2 h-4 w-4" />
                 Enviar Selada
               </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
