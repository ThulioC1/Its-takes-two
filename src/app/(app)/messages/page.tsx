'use client';
import { useState, useMemo, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Send, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCollection, useFirestore, useUser, useMemoFirebase, useDoc } from "@/firebase";
import { collection, doc, addDoc, serverTimestamp, Timestamp, updateDoc, deleteDoc } from "firebase/firestore";
import type { LoveLetter, UserProfile } from "@/types";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

function MessageForm({ message, onSave, onCancel }: { message: LoveLetter; onSave: (content: string) => void; onCancel: () => void; }) {
  const [content, setContent] = useState(message.message);

  useEffect(() => {
    setContent(message.message);
  }, [message]);

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (content.trim()) {
      onSave(content);
    }
  };

  return (
    <form onSubmit={handleSave} className="grid gap-4 py-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="content" className="text-right">Mensagem</Label>
        <Textarea id="content" name="content" className="col-span-3" value={content} onChange={(e) => setContent(e.target.value)} required />
      </div>
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button type="submit">Salvar</Button>
      </DialogFooter>
    </form>
  );
}


export default function MessagesPage() {
  const [newMessage, setNewMessage] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMessage, setEditingMessage] = useState<LoveLetter | null>(null);

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
        return timeA - timeB;
    });
  }, [messages]);

  const handleSendMessage = async () => {
    if (newMessage.trim() === "" || !messagesRef || !user || !user.displayName) return;

    await addDoc(messagesRef, {
      senderId: user.uid,
      recipientId: '', // This needs logic to determine partner's ID
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
  };

  const handleOpenDialog = (message: LoveLetter | null = null) => {
    setEditingMessage(message);
    setIsDialogOpen(true);
  };
  
  const handleCloseDialog = () => {
    setEditingMessage(null);
    setIsDialogOpen(false);
  };

  const handleSaveMessage = async (content: string) => {
    if (!messagesRef || !editingMessage) return;
    const messageDoc = doc(messagesRef, editingMessage.id);
    await updateDoc(messageDoc, { message: content });
    handleCloseDialog();
  };

  const handleDeleteMessage = async (id: string) => {
    if (!messagesRef) return;
    await deleteDoc(doc(messagesRef, id));
  }

  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.24))]">
        <div className="mb-6">
            <h1 className="text-3xl font-bold font-headline">Cartas de Amor</h1>
            <p className="text-muted-foreground">Um cantinho para mensagens e surpresas.</p>
        </div>
      
      <Card className="flex-1 flex flex-col">
        <CardContent className="p-6 flex-1 flex flex-col gap-6 overflow-y-auto">
          {isLoading && <p className="text-center text-muted-foreground">Carregando mensagens...</p>}
          {!isLoading && sortedMessages?.length === 0 && <p className="text-center text-muted-foreground">Nenhuma mensagem ainda.</p>}
          {sortedMessages?.map(message => (
            <div key={message.id} className={cn("flex items-end gap-3 group", message.senderId === user?.uid ? "justify-end" : "justify-start")}>
               {message.senderId === user?.uid && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onSelect={() => handleOpenDialog(message)}>Editar</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive" onSelect={() => handleDeleteMessage(message.id)}>Apagar</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {message.senderId !== user?.uid && (
                <Avatar className="h-8 w-8">
                  <AvatarImage src={message.author?.photoURL || ''} /> 
                  <AvatarFallback>{message.author?.displayName?.charAt(0) || 'P'}</AvatarFallback>
                </Avatar>
              )}
              <div className={cn(
                  "max-w-xs md:max-w-md rounded-2xl p-3", 
                  message.senderId === user?.uid ? "bg-primary text-primary-foreground rounded-br-none" : "bg-accent rounded-bl-none",
                  )}>
                <p className="text-sm">{message.message}</p>
                <p className={cn("text-xs mt-1 opacity-70", message.senderId === user?.uid ? "text-right" : "text-left")}>
                    {message.dateTime && message.dateTime.toDate ? message.dateTime.toDate().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}
                </p>
              </div>
              {message.senderId === user?.uid && (
                <Avatar className="h-8 w-8">
                   <AvatarImage src={user?.photoURL || ''} />
                   <AvatarFallback>{user?.displayName?.charAt(0) || 'V'}</AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
        </CardContent>
        <div className="p-4 border-t">
          <div className="relative">
            <Textarea 
                placeholder="Escreva uma carta de amor..." 
                className="pr-14"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                    if(e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                    }
                }}
                disabled={!coupleId}
            />
            <div className="absolute top-1/2 right-3 -translate-y-1/2 flex gap-1">
                <Button size="icon" onClick={handleSendMessage} disabled={!coupleId || !newMessage.trim()}><Send className="h-5 w-5"/></Button>
            </div>
          </div>
        </div>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Editar Mensagem</DialogTitle>
              </DialogHeader>
              {editingMessage && (
                <MessageForm
                    message={editingMessage}
                    onSave={handleSaveMessage}
                    onCancel={handleCloseDialog}
                />
              )}
          </DialogContent>
      </Dialog>
    </div>
  );
}
