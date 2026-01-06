'use client';
import { useState, useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCollection, useFirestore, useUser, useMemoFirebase, useDoc } from "@/firebase";
import { collection, doc, addDoc, serverTimestamp } from "firebase/firestore";
import type { LoveLetter } from "@/types";

// NOTE: This is a placeholder for a real user profile fetching logic
const userAvatars: { [key: string]: string } = {
  'user-1': 'https://images.unsplash.com/photo-1615538785945-6625ccdb4b25?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwyfHxwb3J0cmFpdCUyMHdvbWFufGVufDB8fHx8MTc2NzY5OTA5OXww&ixlib=rb-4.1.0&q=80&w=1080',
  'user-2': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw5fHxwb3J0cmFpdCUyMG1hbnxlbnwwfHx8fDE3Njc1OTUwOTN8MA&ixlib=rb-4.1.0&q=80&w=1080',
};

interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  coupleId: string;
}

export default function MessagesPage() {
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

  const { data: messages, isLoading } = useCollection<LoveLetter>(messagesRef as any);

  const sortedMessages = useMemo(() => {
    if (!messages) return [];
    return [...messages].sort((a, b) => a.timestamp.toDate().getTime() - b.timestamp.toDate().getTime());
  }, [messages]);

  const handleSendMessage = async () => {
    if (newMessage.trim() === "" || !messagesRef || !user) return;

    await addDoc(messagesRef, {
      userId: user.uid,
      text: newMessage,
      timestamp: serverTimestamp(),
      sent: true,
      scheduled: false,
    });
    setNewMessage("");
  };

  // NOTE: A real scheduling feature would require a backend (Cloud Functions).
  // This is a placeholder to show the UI.
  const handleScheduleMessage = async () => {
    if (newMessage.trim() === "" || !messagesRef || !user) return;

    await addDoc(messagesRef, {
      userId: user.uid,
      text: newMessage,
      timestamp: serverTimestamp(),
      sent: true,
      scheduled: true,
      scheduledDate: serverTimestamp(), // Placeholder
    });
    setNewMessage("");
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
            <div key={message.id} className={cn("flex items-end gap-3", message.userId === user?.uid ? "justify-end" : "justify-start")}>
              {message.userId !== user?.uid && (
                <Avatar className="h-8 w-8">
                  {/* Placeholder for partner's avatar */}
                  <AvatarImage src={userAvatars['user-1']} /> 
                  <AvatarFallback>{'P'}</AvatarFallback>
                </Avatar>
              )}
              <div className={cn(
                  "max-w-xs md:max-w-md rounded-2xl p-3", 
                  message.userId === user?.uid ? "bg-primary text-primary-foreground rounded-br-none" : "bg-accent rounded-bl-none",
                  message.scheduled && "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300"
                  )}>
                <p className="text-sm">{message.text}</p>
                <p className={cn("text-xs mt-1 opacity-70", message.userId === user?.uid ? "text-right" : "text-left")}>
                    {message.scheduled ? `Agendada (em breve)` : message.timestamp?.toDate().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              {message.userId === user?.uid && (
                <Avatar className="h-8 w-8">
                   <AvatarImage src={user?.photoURL || userAvatars['user-2']} />
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
                className="pr-24"
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
                <Button variant="ghost" size="icon" onClick={handleScheduleMessage} disabled={!coupleId}><Calendar className="h-5 w-5"/></Button>
                <Button size="icon" onClick={handleSendMessage} disabled={!coupleId}><Send className="h-5 w-5"/></Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
