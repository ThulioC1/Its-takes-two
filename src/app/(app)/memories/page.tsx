'use client';
import { useState, useMemo, useEffect } from 'react';
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Camera, MapPin, PlusCircle, MoreHorizontal } from "lucide-react";
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
                <Button type="submit">Salvar</Button>
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
    if (editingMemory) {
        window.location.reload();
    }
  }
  
  const handleSaveMemory = async (data: Partial<Memory & { dateString?: string }>) => {
    if(!memoriesRef || !user || !user.displayName) return;

    const { dateString, ...restData } = data;
    const dataToSave: Partial<Memory> = {
        ...restData,
        image: data.image || `https://picsum.photos/seed/${Math.floor(Math.random()*100)}/400/300`,
    };

    if (dateString) {
        // The date comes in as 'YYYY-MM-DD', but the new Date() constructor needs to be careful with timezones.
        // Adding 'T00:00:00' makes it parse as local time, avoiding timezone shifts.
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
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">Álbum de Memórias</h1>
          <p className="text-muted-foreground">Uma linha do tempo dos seus momentos mais especiais.</p>
        </div>
        <Button className="w-full sm:w-auto" onClick={() => handleOpenDialog()} disabled={!coupleId}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Memória
        </Button>
      </div>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingMemory ? 'Editar Memória' : 'Nova Memória'}</DialogTitle>
          </DialogHeader>
          <MemoryForm 
            memory={editingMemory}
            onSave={handleSaveMemory}
            onCancel={handleCloseDialog}
          />
        </DialogContent>
      </Dialog>
      
      {isLoading && <p className="text-center text-muted-foreground">Carregando memórias...</p>}
      {!isLoading && sortedMemories?.length === 0 && <p className="text-center text-muted-foreground pt-10">Nenhuma memória adicionada.</p>}

      <div className="relative pl-6 after:absolute after:inset-y-0 after:left-8 after:w-px after:bg-border md:pl-0 md:after:left-1/2 md:after:-translate-x-1/2">
        {sortedMemories?.map((memory, index) => {
          const authorInitial = memory.author?.displayName?.charAt(0) || '?';
          return (
            <div key={memory.id} className="relative grid md:grid-cols-[1fr_auto_1fr] md:gap-x-12 mb-12">
              {/* Card */}
              <div className={`flex items-center w-full md:max-w-md ${index % 2 === 0 ? 'md:order-3 md:justify-start' : 'md:order-1 md:justify-end'}`}>
                  <Card className="w-full">
                      <CardHeader className="p-0">
                          <div className="relative aspect-video w-full overflow-hidden rounded-t-lg">
                              {memory.image ? (
                                  <Image 
                                      src={memory.image} 
                                      alt={memory.description} 
                                      fill 
                                      className="object-cover"
                                      data-ai-hint="couple memory"
                                  />
                              ) : <div className="bg-muted w-full h-full flex items-center justify-center">Sem foto</div> }
                          </div>
                      </CardHeader>
                      <CardContent className="p-4">
                          <CardDescription>{memory.description}</CardDescription>
                      </CardContent>
                  </Card>
              </div>

              {/* Icon */}
              <div className="absolute top-1/2 -translate-y-1/2 left-[-36px] md:static md:order-2 md:transform-none">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-background border-2 border-primary shadow-md z-10">
                  <Camera className="w-5 h-5 text-primary" />
                </div>
              </div>
              
              {/* Date & Actions */}
               <div className={`flex items-center mt-4 md:mt-0 w-full md:max-w-md ${index % 2 === 0 ? 'md:order-1 md:justify-end' : 'md:order-3 md:justify-start'}`}>
                  <div className={`p-4 w-full flex justify-between items-center ${index % 2 === 0 ? 'md:text-right' : ''}`}>
                      <div>
                        <p className="font-semibold text-lg font-headline">{memory.date ? format(memory.date.toDate(), "dd 'de' MMMM, yyyy", { locale: ptBR }) : ''}</p>
                        {memory.location && (
                            <div className={`flex items-center text-muted-foreground mt-1 ${index % 2 === 0 ? 'md:justify-end' : ''}`}>
                                <MapPin className="w-4 h-4 mr-1"/>
                                <span>{memory.location}</span>
                            </div>
                        )}
                      </div>
                       <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Abrir menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => handleOpenDialog(memory)}>Editar</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(memory.id)}>Deletar</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                  </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
