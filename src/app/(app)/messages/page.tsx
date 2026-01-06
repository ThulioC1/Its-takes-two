import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Calendar, Send } from "lucide-react";
import { cn } from "@/lib/utils";

const messages = [
  { id: 1, userId: 'user-avatar-2', text: 'Oi, meu amor! Só passando para dizer que te amo e estou com saudades. ❤️', timestamp: '10:30 AM', sent: true },
  { id: 2, userId: 'user-avatar-1', text: 'Oi, vida! Também te amo muito. Que tal um cinema hoje à noite?', timestamp: '10:32 AM', sent: false },
  { id: 3, userId: 'user-avatar-2', text: 'Adorei a ideia! Combinado! 😘', timestamp: '10:33 AM', sent: true },
  { id: 4, userId: 'user-avatar-1', text: 'Essa mensagem está agendada para o seu aniversário. Quero que saiba que você é a pessoa mais incrível que já conheci e sou muito feliz ao seu lado. Feliz dia!', timestamp: 'Agendada para 10/09', sent: false, scheduled: true },
];

export default function MessagesPage() {
  const userAvatar1 = PlaceHolderImages.find((p) => p.id === "user-avatar-1");
  const userAvatar2 = PlaceHolderImages.find((p) => p.id === "user-avatar-2");
  const avatars = { "user-avatar-1": userAvatar1, "user-avatar-2": userAvatar2 };

  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.24))]">
        <div className="mb-6">
            <h1 className="text-3xl font-bold font-headline">Cartas de Amor</h1>
            <p className="text-muted-foreground">Um cantinho para mensagens e surpresas.</p>
        </div>
      
      <Card className="flex-1 flex flex-col">
        <CardContent className="p-6 flex-1 flex flex-col gap-6 overflow-y-auto">
          {messages.map(message => (
            <div key={message.id} className={cn("flex items-end gap-3", message.sent ? "justify-end" : "justify-start")}>
              {!message.sent && (
                <Avatar className="h-8 w-8">
                  {avatars[message.userId as keyof typeof avatars] && <AvatarImage src={avatars[message.userId as keyof typeof avatars]?.imageUrl} />}
                  <AvatarFallback>{'U'}</AvatarFallback>
                </Avatar>
              )}
              <div className={cn(
                  "max-w-xs md:max-w-md rounded-2xl p-3", 
                  message.sent ? "bg-primary text-primary-foreground rounded-br-none" : "bg-accent rounded-bl-none",
                  message.scheduled && "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300"
                  )}>
                <p className="text-sm">{message.text}</p>
                <p className={cn("text-xs mt-1 opacity-70", message.sent ? "text-right" : "text-left")}>{message.timestamp}</p>
              </div>
              {message.sent && (
                <Avatar className="h-8 w-8">
                   {avatars[message.userId as keyof typeof avatars] && <AvatarImage src={avatars[message.userId as keyof typeof avatars]?.imageUrl} />}
                  <AvatarFallback>{'V'}</AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
        </CardContent>
        <div className="p-4 border-t">
          <div className="relative">
            <Textarea placeholder="Escreva uma carta de amor..." className="pr-24"/>
            <div className="absolute top-1/2 right-3 -translate-y-1/2 flex gap-1">
                <Button variant="ghost" size="icon"><Calendar className="h-5 w-5"/></Button>
                <Button size="icon"><Send className="h-5 w-5"/></Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
