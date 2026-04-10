
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
import { motion, AnimatePresence } from "framer-motion";

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
  }
  
  const handleSaveMemory = async (data: Partial<Memory & { dateString?: string }>) => {
    if(!memoriesRef || !user || !user.displayName) return;

    const { dateString, ...restData } = data;
    const dataToSave: Partial<Memory> = {
        ...restData,
        image: data.image || `https://picsum.photos/seed/${Math.floor(Math.random()*100)}/400/300`,
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
    <div className="flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">Álbum de Memórias</h1>
          <p className="text-muted-foreground">Momentos eternizados do casal.</p>
        </div>
        <Button className="w-full sm:w-auto shadow-md" onClick={() => handleOpenDialog()} disabled={!coupleId}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Memória
        </Button>
      </div>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingMemory ? 'Editar Memória' : 'Nova Memória'}</DialogTitle>
          </DialogHeader>
          {isDialogOpen && <MemoryForm 
            memory={editingMemory}
            onSave={handleSaveMemory}
            onCancel={handleCloseDialog}
          />}
        </DialogContent>
      </Dialog>
      
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground animate-pulse">Revelando fotos...</p>
        </div>
      ) : sortedMemories?.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-xl border-border/60 bg-accent/10">
            <Camera className="size-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">Nenhuma memória ainda. Comecem o álbum hoje!</p>
        </div>
      ) : (
        <div className="masonry-grid">
          <AnimatePresence>
            {sortedMemories.map((memory) => (
              <motion.div
                key={memory.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="masonry-item"
              >
                <Card className="overflow-hidden group hover:shadow-xl transition-all duration-500">
                  <div className="relative aspect-auto">
                    {memory.image && (
                      <Image 
                        src={memory.image} 
                        alt={memory.description} 
                        width={600}
                        height={400}
                        className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    )}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="secondary" size="icon" className="h-8 w-8 bg-black/40 text-white hover:bg-black/60 backdrop-blur-md">
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
                  <CardContent className="p-4 space-y-3">
                    <p className="text-sm font-medium leading-relaxed">{memory.description}</p>
                    <div className="flex items-center justify-between pt-2 border-t border-border/40">
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-semibold uppercase tracking-widest">
                        <Camera className="size-3" />
                        {memory.date ? format(memory.date.toDate(), "dd/MM/yyyy", { locale: ptBR }) : ''}
                      </div>
                      {memory.location && (
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium italic">
                          <MapPin className="size-3" />
                          {memory.location}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
