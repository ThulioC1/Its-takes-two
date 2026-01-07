'use client';
import { useState, useMemo, useEffect } from 'react';
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
import { useCollection, useFirestore, useUser, useMemoFirebase, useDoc } from "@/firebase";
import { collection, doc, addDoc, updateDoc, deleteDoc } from "firebase/firestore";
import type { ImportantDate, UserProfile } from "@/types";
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const typeIcons: { [key: string]: React.ReactNode } = {
  'Aniversário': <Gift className="h-6 w-6 text-primary" />,
  'Viagem': <Plane className="h-6 w-6 text-blue-500" />,
  'Evento': <PartyPopper className="h-6 w-6 text-amber-500" />,
  'Casamento': <Gift className="h-6 w-6 text-pink-500" />,
  'Outro': <Gift className="h-6 w-6 text-slate-500" />,
};

function Countdown({ date }: { date: string }) {
  const [countdown, setCountdown] = useState('');

  const daysLeft = useMemo(() => {
    if (!date) return null;
    const targetDate = parseISO(date);
    const today = new Date();
    today.setHours(0,0,0,0);
    return differenceInDays(targetDate, today);
  }, [date]);

  useEffect(() => {
    if (daysLeft === null) {
      setCountdown('');
      return;
    }
    if (daysLeft < 0) {
      setCountdown('Já passou');
    } else if (daysLeft === 0) {
      setCountdown('É hoje! 🎉');
    } else if (daysLeft === 1) {
      setCountdown('É amanhã!');
    } else {
      setCountdown(`Faltam ${daysLeft} dias`);
    }
  }, [daysLeft]);

  return <p className="text-sm text-muted-foreground">{countdown}</p>;
}

function DateForm({ date, onSave, onCancel }: { date?: ImportantDate; onSave: (data: Partial<ImportantDate>) => void; onCancel: () => void; }) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(date ? parseISO(date.date) : new Date());

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: Partial<ImportantDate> = {
      title: formData.get('title') as string,
      type: formData.get('type') as string,
      observation: formData.get('observation') as string,
      date: selectedDate ? selectedDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDate, setEditingDate] = useState<ImportantDate | null>(null);
  const [dateToEdit, setDateToEdit] = useState<ImportantDate | null>(null);

  useEffect(() => {
    if (dateToEdit) {
      setEditingDate(dateToEdit);
      setIsDialogOpen(true);
    }
  }, [dateToEdit]);

  const firestore = useFirestore();
  const { user } = useUser();
  
  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile } = useDoc<UserProfile>(userProfileRef);
  const coupleId = userProfile?.coupleId;

  const datesRef = useMemoFirebase(() => {
    if (!firestore || !coupleId) return null;
    return collection(firestore, 'couples', coupleId, 'dates');
  }, [firestore, coupleId]);

  const { data: importantDates, isLoading } = useCollection<ImportantDate>(datesRef as any);

  const sortedDates = useMemo(() => {
    if (!importantDates) return [];
    return [...importantDates].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [importantDates]);


  const handleOpenDialog = (date: ImportantDate | null = null) => {
    setEditingDate(date);
    setIsDialogOpen(true);
  };
  
  const handleCloseDialog = () => {
    setEditingDate(null);
    setDateToEdit(null);
    setIsDialogOpen(false);
  }

  const handleSaveDate = async (data: Partial<ImportantDate>) => {
    if (!datesRef || !user || !user.displayName) return;
    if (editingDate) {
      const dateDoc = doc(datesRef, editingDate.id);
      await updateDoc(dateDoc, data);
    } else {
      await addDoc(datesRef, {
        ...data,
        author: {
          uid: user.uid,
          displayName: user.displayName
        }
      });
    }
    handleCloseDialog();
  };

  const handleDelete = async (id: string) => {
    if (!datesRef) return;
    const dateDoc = doc(datesRef, id);
    await deleteDoc(dateDoc);
  };


  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">Datas Importantes</h1>
          <p className="text-muted-foreground">Nunca mais esqueçam uma data especial.</p>
        </div>
        <Button className="w-full sm:w-auto" onClick={() => handleOpenDialog()} disabled={!coupleId}>
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
              date={editingDate ?? undefined}
              onSave={handleSaveDate}
              onCancel={handleCloseDialog}
            />
          </DialogContent>
        </Dialog>
      
      {isLoading && <p className="text-center text-muted-foreground">Carregando datas...</p>}
      {!isLoading && sortedDates?.length === 0 && <p className="text-center text-muted-foreground">Nenhuma data adicionada ainda.</p>}
      <TooltipProvider>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sortedDates?.map(d => (
            <Card key={d.id} className="flex flex-col">
              <CardHeader>
              <div className="flex flex-row items-center justify-between">
                  <div className="flex items-center gap-4">
                      {typeIcons[d.type] || <Gift className="h-6 w-6 text-primary" />}
                      <div>
                          <CardTitle className="font-headline">{d.title}</CardTitle>
                          <p className="text-muted-foreground text-sm">{format(parseISO(d.date), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
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
                      <DropdownMenuItem onSelect={() => setDateToEdit(d)}>Editar</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onSelect={() => handleDelete(d.id)}>Deletar</DropdownMenuItem>
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
              <CardFooter className="flex justify-between items-center">
                <Badge variant="outline">{d.type}</Badge>
                {d.author && (
                    <Tooltip>
                        <TooltipTrigger>
                            <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-xs">{d.author.displayName.charAt(0)}</AvatarFallback>
                            </Avatar>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Adicionado por: {d.author.displayName}</p>
                        </TooltipContent>
                    </Tooltip>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      </TooltipProvider>
    </div>
  );
}
