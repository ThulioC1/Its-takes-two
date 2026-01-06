'use client';
import { useState, useEffect } from 'react';
import { differenceInDays, format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Gift, PartyPopper, Plane, MoreHorizontal } from "lucide-react";
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from '@/lib/utils';
import { Calendar as CalendarIcon } from "lucide-react";


const initialDates = [
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
  'Outro': <Gift className="h-6 w-6 text-slate-500" />,
};

function Countdown({ date }: { date: string }) {
  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    const targetDate = parseISO(date);
    const today = new Date();
    today.setHours(0,0,0,0);
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

function DateForm({ date, onSave, onCancel }: { date?: any; onSave: (data: any) => void; onCancel: () => void; }) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(date ? parseISO(date.date) : new Date());

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get('title') as string,
      type: formData.get('type') as string,
      observation: formData.get('observation') as string,
      date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : new Date().toISOString().split('T')[0],
    };
    onSave(data);
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="title" className="text-right">Título</Label>
        <Input id="title" name="title" className="col-span-3" defaultValue={date?.title} required />
      </div>

       <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="date" className="text-right">Data</Label>
         <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "col-span-3 justify-start text-left font-normal",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
      </div>

      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="type" className="text-right">Tipo</Label>
         <Select name="type" defaultValue={date?.type} required>
          <SelectTrigger className="col-span-3">
            <SelectValue placeholder="Selecione o tipo" />
          </SelectTrigger>
          <SelectContent>
             {Object.keys(typeIcons).map(key => <SelectItem key={key} value={key}>{key}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="observation" className="text-right">Observação</Label>
        <Textarea id="observation" name="observation" className="col-span-3" defaultValue={date?.observation} />
      </div>
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button type="submit">Salvar</Button>
      </DialogFooter>
    </form>
  );
}


export default function DatesPage() {
  const [importantDates, setImportantDates] = useState(initialDates);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDate, setEditingDate] = useState<any>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleOpenDialog = (date: any = null) => {
    setEditingDate(date);
    setIsDialogOpen(true);
  };
  
  const handleCloseDialog = () => {
    setEditingDate(null);
    setIsDialogOpen(false);
  }

  const handleSaveDate = (data: any) => {
    if (editingDate) {
      setImportantDates(importantDates.map(d => d.id === editingDate.id ? { ...d, ...data } : d).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    } else {
      const newDate = { id: Date.now(), ...data };
      setImportantDates([...importantDates, newDate].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    }
    handleCloseDialog();
  };

  const handleDelete = (id: number) => {
    setImportantDates(importantDates.filter(d => d.id !== id));
  };


  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">Datas Importantes</h1>
          <p className="text-muted-foreground">Nunca mais esqueçam uma data especial.</p>
        </div>
        <Button className="w-full sm:w-auto" onClick={() => handleOpenDialog()}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar Data
        </Button>
      </div>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingDate ? 'Editar Data' : 'Nova Data'}</DialogTitle>
            </DialogHeader>
            <DateForm 
              date={editingDate}
              onSave={handleSaveDate}
              onCancel={handleCloseDialog}
            />
          </DialogContent>
        </Dialog>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isClient && importantDates.map(d => (
          <Card key={d.id} className="flex flex-col">
            <CardHeader>
             <div className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-4">
                    {typeIcons[d.type] || <Gift className="h-6 w-6 text-primary" />}
                    <div>
                        <CardTitle className="font-headline">{d.title}</CardTitle>
                        <p className="text-muted-foreground text-sm">{format(parseISO(d.date), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR, timeZone: 'UTC' })}</p>
                    </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Abrir menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleOpenDialog(d)}>Editar</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(d.id)}>Deletar</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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
