'use client';

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { PlusCircle, Clapperboard, Film, Tv, MoreHorizontal } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuPortal } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCollection, useFirestore, useUser, useMemoFirebase, useDoc } from "@/firebase";
import { collection, doc, addDoc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import type { MovieSeries } from "@/types";

interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  coupleId: string;
}

function WatchlistForm({ item, onSave, onCancel }: { item?: MovieSeries; onSave: (data: Partial<MovieSeries>) => void; onCancel: () => void; }) {
  const handleItemSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: Partial<MovieSeries> = {
      name: formData.get('name') as string,
      type: formData.get('type') as 'Movie' | 'Series',
      platform: formData.get('platform') as string,
      link: formData.get('image') as string, // Assuming image url is used as link for now
    };
    onSave(data);
  };

  return (
    <form onSubmit={handleItemSubmit} className="grid gap-4 py-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="name" className="text-right">Título</Label>
        <Input id="name" name="name" className="col-span-3" defaultValue={item?.name} required />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="type" className="text-right">Tipo</Label>
        <Select name="type" defaultValue={item?.type} required>
          <SelectTrigger className="col-span-3">
            <SelectValue placeholder="Selecione o tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Movie">Filme</SelectItem>
            <SelectItem value="Series">Série</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="platform" className="text-right">Onde Assistir</Label>
        <Input id="platform" name="platform" placeholder="Netflix, cinema, etc." className="col-span-3" defaultValue={item?.platform} />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="image" className="text-right">URL da Imagem</Label>
        <Input id="image" name="image" placeholder="https://exemplo.com/poster.jpg" className="col-span-3" defaultValue={item?.link} />
      </div>
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button type="submit">{item ? 'Salvar Alterações' : 'Adicionar'}</Button>
      </DialogFooter>
    </form>
  );
}


export default function WatchlistPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MovieSeries | null>(null);

  const firestore = useFirestore();
  const { user } = useUser();

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile } = useDoc<UserProfile>(userProfileRef);
  const coupleId = userProfile?.coupleId;

  const watchlistRef = useMemoFirebase(() => {
    if (!firestore || !coupleId) return null;
    return collection(firestore, 'couples', coupleId, 'movies');
  }, [firestore, coupleId]);

  const { data: watchlist, isLoading } = useCollection<MovieSeries>(watchlistRef as any);
  
  const handleOpenDialog = (item: MovieSeries | null = null) => {
    setEditingItem(item);
    setIsDialogOpen(true);
  };
  
  const handleCloseDialog = () => {
    setEditingItem(null);
    setIsDialogOpen(false);
  }

  const moveItem = async (id: string, newStatus: "To Watch" | "Watching" | "Watched") => {
    if(!watchlistRef) return;
    const itemDoc = doc(watchlistRef, id);
    await updateDoc(itemDoc, {
        status: newStatus,
        dateWatched: newStatus === 'Watched' ? serverTimestamp() : null
    });
  };
  
  const deleteItem = async (id: string) => {
    if(!watchlistRef) return;
    const itemDoc = doc(watchlistRef, id);
    await deleteDoc(itemDoc);
  };
  
  const handleSaveItem = async (data: Partial<MovieSeries>) => {
    if(!watchlistRef) return;
    const fullData = {
        ...data,
        link: data.link || `https://picsum.photos/seed/${Date.now()}/300/450`
    }
    if (editingItem) {
      const itemDoc = doc(watchlistRef, editingItem.id);
      await updateDoc(itemDoc, fullData);
    } else {
      await addDoc(watchlistRef, {
        ...fullData,
        status: 'To Watch',
      });
    }

    handleCloseDialog();
  };

  const renderList = (status: "To Watch" | "Watching" | "Watched") => {
    if (isLoading) return <div className="col-span-full text-center text-muted-foreground py-10">Carregando...</div>;
    
    const filteredList = watchlist?.filter(item => item.status === status) || [];
    
    if (filteredList.length === 0) {
        return <div className="col-span-full text-center text-muted-foreground py-10">Nenhum item aqui.</div>;
    }

    return filteredList.map(item => (
        <Card key={item.id} className="overflow-hidden w-full group">
            <div className="relative aspect-[2/3]">
                <Image src={item.link || `https://picsum.photos/seed/${item.id}/300/450`} alt={item.name} fill objectFit="cover" data-ai-hint="movie poster" />
                 {item.platform && <Badge variant="secondary" className="absolute top-2 left-2">{item.platform}</Badge>}
                 <div className="absolute top-1 right-1">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-white bg-black/20 hover:bg-black/50 hover:text-white">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                         <DropdownMenuItem onClick={() => handleOpenDialog(item)}>Editar</DropdownMenuItem>
                         <DropdownMenuSub>
                            <DropdownMenuSubTrigger>Mover para</DropdownMenuSubTrigger>
                            <DropdownMenuPortal>
                                <DropdownMenuSubContent>
                                    {item.status !== 'To Watch' && <DropdownMenuItem onClick={() => moveItem(item.id, 'To Watch')}>Para Assistir</DropdownMenuItem>}
                                    {item.status !== 'Watching' && <DropdownMenuItem onClick={() => moveItem(item.id, 'Watching')}>Assistindo</DropdownMenuItem>}
                                    {item.status !== 'Watched' && <DropdownMenuItem onClick={() => moveItem(item.id, 'Watched')}>Já Vimos</DropdownMenuItem>}
                                </DropdownMenuSubContent>
                            </DropdownMenuPortal>
                         </DropdownMenuSub>
                        <DropdownMenuItem className="text-destructive" onClick={() => deleteItem(item.id)}>Deletar</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                 </div>
            </div>
            <CardContent className="p-3">
                <h3 className="font-semibold font-headline truncate text-sm">{item.name}</h3>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                    {item.type === 'Movie' ? <Film className="w-3 h-3 mr-1"/> : <Tv className="w-3 h-3 mr-1"/>}
                    <span>{item.type}</span>
                </div>
            </CardContent>
            {item.status === 'Watched' && item.dateWatched && (
                <CardFooter className="p-3 pt-0 text-xs text-muted-foreground">
                    Assistido em {item.dateWatched.toDate().toLocaleDateString('pt-BR')}
                </CardFooter>
            )}
        </Card>
    ));
}

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">Filmes & Séries</h1>
          <p className="text-muted-foreground">A lista de entretenimento do casal.</p>
        </div>
        <Button className="w-full sm:w-auto" onClick={() => handleOpenDialog()} disabled={!coupleId}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar Item
        </Button>
      </div>

       <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
                <DialogTitle>{editingItem ? 'Editar Item' : 'Adicionar à Lista'}</DialogTitle>
            </DialogHeader>
            <WatchlistForm 
              item={editingItem ?? undefined}
              onSave={handleSaveItem}
              onCancel={handleCloseDialog}
            />
          </DialogContent>
        </Dialog>

      <Tabs defaultValue="To Watch">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="To Watch">Para Assistir</TabsTrigger>
          <TabsTrigger value="Watching">Assistindo</TabsTrigger>
          <TabsTrigger value="Watched">Já Vimos</TabsTrigger>
        </TabsList>
        <TabsContent value="To Watch" className="mt-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
            {renderList('To Watch')}
          </div>
        </TabsContent>
        <TabsContent value="Watching" className="mt-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
             {renderList('Watching')}
          </div>
        </TabsContent>
        <TabsContent value="Watched" className="mt-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
            {renderList('Watched')}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
