'use client';
import { useState, useMemo, useEffect } from 'react';
import { differenceInDays, format, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Gift, PartyPopper, Plane, MoreHorizontal, Repeat } from "lucide-react";
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

const repeatOptions = {
    'none': 'Não repetir',
    'monthly': 'Mensalmente',
    'yearly': 'Anualmente'
}

function Countdown({ date }: { date: string }) {
    const [countdownText, setCountdownText] = useState('');

    const daysLeft = useMemo(() => {
        if (!date) return null;
        const targetDate = parseISO(date);
        if (!isValid(targetDate)) return null;
        const today = new Date();
        today.setHours(0,0,0,0);
        return differenceInDays(targetDate, today);
    }, [date]);

    useEffect(() => {
        if (daysLeft === null) {
            setCountdownText('');
            return;
        }
        if (daysLeft < 0) {
            setCountdownText('Já passou');
        } else if (daysLeft === 0) {
            setCountdownText('É hoje! 🎉');
        } else if (daysLeft === 1) {
            setCountdownText('É amanhã!');
        } else {
            setCountdownText(`Faltam ${daysLeft} dias`);
        }
    }, [daysLeft]);

    return <p className="text-sm text-muted-foreground">{countdownText}</p>;
}

function DateForm({ date, onSave, onCancel }: { date?: ImportantDate | null; onSave: (data: Partial<ImportantDate>) => void; onCancel: () => void; }) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('');
  const [observation, setObservation] = useState('');
  const [dateValue, setDateValue] = useState('');
  const [repeat, setRepeat] = useState<'none' | 'monthly' | 'yearly'>('none');

  useEffect(() => {
    setTitle(date?.title || '');
    setType(date?.type || '');
    setObservation(date?.observation || '');
    setDateValue(date?.date || format(new Date(), 'yyyy-MM-dd'));
    setRepeat(date?.repeat || 'none');
  }, [date]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!dateValue) return;

    const data: Partial<ImportantDate> = {
      title,
      type,
      observation,
      date: dateValue,
      repeat,
    };
    onSave(data);
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="title" className="text-right">Título</Label>
        <Input id="title" name="title" className="col-span-3" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>

       <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="date" className="text-right">Data</Label>
        <Input 
            id="date"
            name="date"
            type="date"
            className="col-span-3"
            value={dateValue}
            onChange={(e) => setDateValue(e.target.value)}
            required
        />
      </div>

      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="type" className="text-right">Tipo</Label>
         <Select name="type" value={type} onValueChange={setType} required>
          <SelectTrigger className="col-span-3">
            <SelectValue placeholder="Selecione o tipo" />
          </SelectTrigger>
          <SelectContent>
             {Object.keys(typeIcons).map(key => <SelectItem key={key} value={key}>{key}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

       <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="repeat" className="text-right">Repetir</Label>
         <Select name="repeat" value={repeat} onValueChange={(v) => setRepeat(v as any)} required>
          <SelectTrigger className="col-span-3">
            <SelectValue placeholder="Selecione a recorrência" />
          </SelectTrigger>
          <SelectContent>
             {Object.entries(repeatOptions).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="observation" className="text-right">Observação</Label>
        <Textarea id="observation" name="observation" className="col-span-3" value={observation} onChange={(e) => setObservation(e.target.value)} />
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

  const { data: importantDates, isLoading } = useCollection<ImportantDate>(datesRef);

  const sortedDates = useMemo(() => {
    if (!importantDates) return [];
    return [...importantDates].sort((a, b) => {
        if (!a.date || !b.date) return 0;
        const dateA = parseISO(a.date);
        const dateB = parseISO(b.date);
        if (!isValid(dateA) || !isValid(dateB)) return 0;
        return dateA.getTime() - dateB.getTime();
    });
  }, [importantDates]);

  const handleOpenDialog = (date: ImportantDate | null = null) => {
    setEditingDate(date);
    setIsDialogOpen(true);
  };
  
  const handleCloseDialog = () => {
    setEditingDate(null);
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
          displayName: user.displayName,
          photoURL: user.photoURL || null,
          gender: userProfile?.gender || 'Prefiro não informar'
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
        <Button className="w-full sm:w-auto" onClick={() => handleOpenDialog(null)} disabled={!coupleId}>
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
      
      {isLoading && <p className="text-center text-muted-foreground">Carregando datas...</p>}
      {!isLoading && sortedDates?.length === 0 && <p className="text-center text-muted-foreground">Nenhuma data adicionada ainda.</p>}
      <TooltipProvider>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sortedDates?.map(d => {
            if (!d.date) return null;
            const parsedDate = parseISO(d.date);
            if (!isValid(parsedDate)) return null;

            return (
              <Card key={d.id} className="flex flex-col">
                <CardHeader>
                <div className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-4">
                        {typeIcons[d.type] || <Gift className="h-6 w-6 text-primary" />}
                        <div>
                            <CardTitle className="font-headline">{d.title}</CardTitle>
                            <p className="text-muted-foreground text-sm">{format(parsedDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
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
                        <DropdownMenuItem onSelect={() => handleOpenDialog(d)}>Editar</DropdownMenuItem>
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
                    <div>
                        <Badge variant="outline">{d.type}</Badge>
                        {d.repeat && d.repeat !== 'none' && (
                            <Badge variant="secondary" className="ml-2">
                                <Repeat className="h-3 w-3 mr-1" />
                                {repeatOptions[d.repeat]}
                            </Badge>
                        )}
                    </div>
                  {d.author && d.author.displayName && (
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
            );
          })}
        </div>
      </TooltipProvider>
    </div>
  );
}
