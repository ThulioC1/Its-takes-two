'use client';
import { useState, useEffect } from 'react';
import { differenceInDays, format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Gift, PartyPopper, Plane } from "lucide-react";
import { Badge } from '@/components/ui/badge';

const importantDates = [
  { id: 1, title: 'Aniversário de Namoro', date: '2024-07-25', type: 'Aniversário', observation: 'Celebrar 5 anos juntos!' },
  { id: 2, title: 'Aniversário dele(a)', date: '2024-09-10', type: 'Aniversário' },
  { id: 3, title: 'Viagem para a Itália', date: '2024-12-15', type: 'Viagem', observation: 'Voo às 22h' },
  { id: 4, title: 'Show do Coldplay', date: '2024-10-22', type: 'Evento' },
  { id: 5, title: 'Nosso casamento', date: '2025-05-18', type: 'Casamento', observation: 'No campo' },
].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

const typeIcons: { [key: string]: React.ReactNode } = {
  'Aniversário': <Gift className="h-6 w-6 text-primary" />,
  'Viagem': <Plane className="h-6 w-6 text-blue-500" />,
  'Evento': <PartyPopper className="h-6 w-6 text-amber-500" />,
  'Casamento': <Gift className="h-6 w-6 text-pink-500" />,
};

function Countdown({ date }: { date: string }) {
  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    const targetDate = parseISO(date);
    const today = new Date();
    const daysLeft = differenceInDays(targetDate, today);

    if (daysLeft < 0) {
      setCountdown('Já passou');
    } else if (daysLeft === 0) {
      setCountdown('É hoje! 🎉');
    } else if (daysLeft === 1) {
      setCountdown('É amanhã!');
    } else {
      setCountdown(`Faltam ${daysLeft} dias`);
    }
  }, [date]);

  return <p className="text-sm text-muted-foreground">{countdown}</p>;
}

export default function DatesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">Datas Importantes</h1>
          <p className="text-muted-foreground">Nunca mais esqueçam uma data especial.</p>
        </div>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Data
        </Button>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {importantDates.map(d => (
          <Card key={d.id} className="flex flex-col">
            <CardHeader className="flex flex-row items-center gap-4">
              {typeIcons[d.type] || <Gift className="h-6 w-6 text-primary" />}
              <div>
                <CardTitle className="font-headline">{d.title}</CardTitle>
                <p className="text-muted-foreground text-sm">{format(parseISO(d.date), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
              </div>
            </CardHeader>
            <CardContent className="flex-grow">
              <Countdown date={d.date} />
              {d.observation && (
                 <p className="text-sm text-foreground mt-2 pt-2 border-t">{d.observation}</p>
              )}
            </CardContent>
            <CardFooter>
              <Badge variant="outline">{d.type}</Badge>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
