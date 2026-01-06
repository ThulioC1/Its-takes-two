'use client';
import { useState, useEffect } from 'react';
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Camera, MapPin, PlusCircle, MoreHorizontal } from "lucide-react";
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const initialMemories = [
  { id: 1, imageId: 'memory-1', imageUrl: PlaceHolderImages.find(p => p.id === 'memory-1')?.imageUrl, description: 'Nosso primeiro pôr do sol na praia juntos. Inesquecível!', date: '2023-01-15T12:00:00.000Z', location: 'Praia do Rosa, SC' },
  { id: 2, imageId: 'memory-2', imageUrl: PlaceHolderImages.find(p => p.id === 'memory-2')?.imageUrl, description: 'Noite de fondue e vinho em Campos do Jordão.', date: '2023-06-28T12:00:00.000Z', location: 'Campos do Jordão, SP' },
  { id: 3, imageId: 'memory-3', imageUrl: PlaceHolderImages.find(p => p.id === 'memory-3')?.imageUrl, description: 'Explorando as ruas coloridas de Buenos Aires.', date: '2022-11-05T12:00:00.000Z', location: 'Buenos Aires, Argentina' },
].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

function MemoryForm({ memory, onSave, onCancel }: { memory?: any; onSave: (data: any) => void; onCancel: () => void; }) {
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data = {
            description: formData.get('description') as string,
            location: formData.get('location') as string,
            imageUrl: formData.get('imageUrl') as string,
        };
        onSave(data);
    };

    return (
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="imageUrl" className="text-right">URL da Foto</Label>
                <Input id="imageUrl" name="imageUrl" className="col-span-3" placeholder="https://exemplo.com/foto.jpg" defaultValue={memory?.imageUrl} />
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
  const [memories, setMemories] = useState(initialMemories);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMemory, setEditingMemory] = useState<any>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleOpenDialog = (memory: any = null) => {
    setEditingMemory(memory);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setEditingMemory(null);
    setIsDialogOpen(false);
  }
  
  const handleSaveMemory = (data: any) => {
    if (editingMemory) {
      setMemories(memories.map(m => m.id === editingMemory.id ? { ...m, ...data, imageUrl: data.imageUrl || m.imageUrl } : m));
    } else {
      const newMemory = { 
        id: Date.now(), 
        imageId: `memory-${Date.now()}`,
        ...data,
        date: new Date().toISOString(), 
        imageUrl: data.imageUrl || `https://picsum.photos/seed/${Math.floor(Math.random()*100)}/400/300`,
      };
      setMemories([newMemory, ...memories].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    }
    handleCloseDialog();
  };

  const handleDelete = (id: number) => {
    setMemories(memories.filter(m => m.id !== id));
  };


  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">Álbum de Memórias</h1>
          <p className="text-muted-foreground">Uma linha do tempo dos seus momentos mais especiais.</p>
        </div>
        <Button className="w-full sm:w-auto" onClick={() => handleOpenDialog()}>
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

      <div className="relative pl-6 after:absolute after:inset-y-0 after:left-8 after:w-px after:bg-border md:pl-0 md:after:left-1/2 md:after:-translate-x-1/2">
        {isClient && memories.map((memory, index) => {
          return (
            <div key={memory.id} className="relative grid md:grid-cols-[1fr_auto_1fr] md:gap-x-12 mb-12">
              {/* Card */}
              <div className={`flex items-center w-full md:max-w-md ${index % 2 === 0 ? 'md:order-3 md:justify-start' : 'md:order-1 md:justify-end'}`}>
                  <Card className="w-full">
                      <CardHeader className="p-0">
                          <div className="relative aspect-video w-full overflow-hidden rounded-t-lg">
                              {memory.imageUrl ? (
                                  <Image 
                                      src={memory.imageUrl} 
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
                        <p className="font-semibold text-lg font-headline">{format(parseISO(memory.date), "dd 'de' MMMM, yyyy", { locale: ptBR, timeZone: 'UTC' })}</p>
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
                            <DropdownMenuItem onClick={() => handleOpenDialog(memory)}>Editar</DropdownMenuItem>
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
