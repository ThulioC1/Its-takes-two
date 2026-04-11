
'use client';
import { useState, useMemo, useEffect } from 'react';
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Camera, MapPin, PlusCircle, MoreHorizontal, CalendarDays, User } from "lucide-react";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCollection, useFirestore, useUser, useMemoFirebase, useDoc } from "@/firebase";
import { collection, doc, addDoc, updateDoc, deleteDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import type { Memory, UserProfile } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

function MemoryForm({ memory, onSave, onCancel }: { memory?: Memory | null; onSave: (data: Partial<Memory & { dateString?: string }>) => void; onCancel: () => void; }) {
    const [dateValue, setDateValue] = useState<string>(
        memory?.date ? format(memory.date.toDate(), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')
    );

    useEffect(() => {
        setDateValue(memory?.date ? format(memory.date.toDate(), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'));
    }, [memory]);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data: Partial<Memory & { dateString?: string }> = {
            description: formData.get('description') as string,
            location: formData.get('location') as string,
            image: formData.get('imageUrl') as string,
            dateString: dateValue,
        };
        onSave(data);
    };

    return (
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="imageUrl" className="text-right">URL da Foto</Label>
                <Input id="imageUrl" name="imageUrl" className="col-span-3" placeholder="https://exemplo.com/foto.jpg" defaultValue={memory?.image} required />
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
                <Label htmlFor="description" className="text-right">Descrição</Label>
                <Textarea id="description" name="description" className="col-span-3" defaultValue={memory?.description} required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="location" className="text-right">Local</Label>
                <Input id="location" name="location" className="col-span-3" defaultValue={memory?.location} />
            </div>
            <DialogFooter>
                <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
                <Button type="submit">Salvar Momento</Button>
            </DialogFooter>
        </form>
    );
}

export default function MemoriesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMemory, setEditingMemory] = useState<Memory | null>(null);

  const firestore = useFirestore();
  const { user } = useUser();

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile } = useDoc<UserProfile>(userProfileRef);
  const coupleId = userProfile?.coupleId;

  const memoriesRef = useMemoFirebase(() => {
    if (!firestore || !coupleId) return null;
    return collection(firestore, 'couples', coupleId, 'memories');
  }, [firestore, coupleId]);

  const { data: memories, isLoading } = useCollection<Memory>(memoriesRef);

  const sortedMemories = useMemo(() => {
    if (!memories) return [];
    return [...memories].sort((a, b) => {
        const timeA = a.date?.toDate?.()?.getTime() || 0;
        const timeB = b.date?.toDate?.()?.getTime() || 0;
        return timeB - timeA;
    });
  }, [memories]);

  const handleOpenDialog = (memory: Memory | null = null) => {
    setEditingMemory(memory);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setEditingMemory(null);
    setIsDialogOpen(false);
  }
  
  const handleSaveMemory = async (data: Partial<Memory & { dateString?: string }>) => {
    if(!memoriesRef || !user || !user.displayName) return;

    const { dateString, ...restData } = data;
    const dataToSave: Partial<Memory> = {
        ...restData,
        image: data.image || `https://picsum.photos/seed/${Math.floor(Math.random()*100)}/600/400`,
    };

    if (dateString) {
        dataToSave.date = Timestamp.fromDate(new Date(dateString + 'T00:00:00'));
    }

    if (editingMemory) {
        const memoryDoc = doc(memoriesRef, editingMemory.id);
        await updateDoc(memoryDoc, dataToSave);
    } else {
      const newMemory = { 
        ...dataToSave,
        date: dataToSave.date || serverTimestamp(), 
        author: {
          uid: user.uid,
          displayName: user.displayName,
          photoURL: user.photoURL,
        }
      };
      await addDoc(memoriesRef, newMemory);
    }
    handleCloseDialog();
  };

  const handleDelete = async (id: string) => {
    if(!memoriesRef) return;
    const memoryDoc = doc(memoriesRef, id);
    await deleteDoc(memoryDoc);
  };

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto pb-20">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
        <div>
          <h1 className="text-3xl font-bold font-headline">Álbum de Memórias</h1>
          <p className="text-muted-foreground">Revivam cada passo da jornada de vocês.</p>
        </div>
        <Button className="w-full sm:w-auto shadow-lg hover:scale-105 transition-all" onClick={() => handleOpenDialog()} disabled={!coupleId}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Nova Memória
        </Button>
      </div>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingMemory ? 'Editar Memória' : 'Eternizar Momento'}</DialogTitle>
          </DialogHeader>
          {isDialogOpen && <MemoryForm 
            memory={editingMemory}
            onSave={handleSaveMemory}
            onCancel={handleCloseDialog}
          />}
        </DialogContent>
      </Dialog>
      
      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <Camera className="size-10 text-primary/40 animate-pulse" />
          <p className="text-muted-foreground animate-pulse font-medium">Revelando as fotos...</p>
        </div>
      ) : sortedMemories?.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-80 border-2 border-dashed rounded-3xl border-border/60 bg-accent/5">
            <div className="size-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                <Camera className="size-8 text-primary/40" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Nenhuma memória ainda</h3>
            <p className="text-muted-foreground max-w-xs text-center">Comecem a construir esse álbum hoje mesmo registrando um momento especial.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <TooltipProvider>
            <AnimatePresence>
              {sortedMemories.map((memory, index) => (
                <motion.div
                  key={memory.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="overflow-hidden group hover:shadow-2xl transition-all duration-500 border-border/40 bg-card/40 backdrop-blur-sm">
                    <div className="relative aspect-video overflow-hidden">
                      {memory.image && (
                        <Image 
                          src={memory.image} 
                          alt={memory.description} 
                          fill
                          className="object-cover transition-transform duration-1000 group-hover:scale-110"
                          data-ai-hint="couple memory"
                        />
                      )}
                      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="secondary" size="icon" className="h-9 w-9 bg-black/50 text-white hover:bg-black/70 backdrop-blur-md border-none">
                              <MoreHorizontal className="h-5 w-5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => handleOpenDialog(memory)}>Editar</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(memory.id)}>Deletar</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      
                      {/* Gradient Overlay for info */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
                      
                      <div className="absolute bottom-3 left-4 flex items-center gap-2">
                        <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2 py-1 rounded-full text-[10px] text-white font-bold uppercase tracking-wider">
                           <CalendarDays className="size-3" />
                           {memory.date ? format(memory.date.toDate(), "dd 'de' MMM, yyyy", { locale: ptBR }) : ''}
                        </div>
                        {memory.location && (
                          <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2 py-1 rounded-full text-[10px] text-white font-bold uppercase tracking-wider">
                             <MapPin className="size-3" />
                             {memory.location}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <CardContent className="p-6 space-y-4">
                      <p className="text-sm font-medium leading-relaxed text-foreground/90 italic">
                        "{memory.description}"
                      </p>
                      
                      <div className="flex items-center justify-between pt-4 border-t border-border/40">
                         <div className="flex items-center gap-3">
                            <Avatar className="h-7 w-7 border-2 border-primary/20">
                                <AvatarImage src={memory.author?.photoURL || ''} />
                                <AvatarFallback className="text-[10px]">{memory.author?.displayName?.charAt(0) || '?'}</AvatarFallback>
                            </Avatar>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                Registrado por {memory.author?.displayName.split(' ')[0]}
                            </span>
                         </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </TooltipProvider>
        </div>
      )}
    </div>
  );
}
