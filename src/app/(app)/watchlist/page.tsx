'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { PlusCircle, Clapperboard, Film, Tv, MoreHorizontal } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuPortal } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


const initialWatchlist = [
    { id: 1, name: 'Duna: Parte 2', type: 'Filme', platform: 'Max', status: 'to-watch', image: 'https://picsum.photos/seed/21/300/450' },
    { id: 2, name: 'The Bear', type: 'Série', platform: 'Star+', status: 'watching', image: 'https://picsum.photos/seed/22/300/450' },
    { id: 3, name: 'Succession', type: 'Série', platform: 'Max', status: 'watched', dateWatched: '2024-06-20', image: 'https://picsum.photos/seed/23/300/450' },
    { id: 4, name: 'Pobres Criaturas', type: 'Filme', platform: 'Star+', status: 'to-watch', image: 'https://picsum.photos/seed/24/300/450' },
    { id: 5, name: 'Fallout', type: 'Série', platform: 'Prime Video', status: 'watched', dateWatched: '2024-05-15', image: 'https://picsum.photos/seed/25/300/450' },
    { id: 6, name: 'Guerra Civil', type: 'Filme', platform: 'Cinema', status: 'to-watch', image: 'https://picsum.photos/seed/26/300/450' },
];

export default function WatchlistPage() {
  const [watchlist, setWatchlist] = useState(initialWatchlist);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const handleOpenDialog = (item: any = null) => {
    setEditingItem(item);
    setIsDialogOpen(true);
  };

  const moveItem = (id: number, newStatus: string) => {
    setWatchlist(watchlist.map(item =>
      item.id === id ? {
        ...item,
        status: newStatus,
        dateWatched: newStatus === 'watched' ? new Date().toISOString().split('T')[0] : item.dateWatched
      } : item
    ));
  };
  
  const deleteItem = (id: number) => {
    setWatchlist(watchlist.filter(item => item.id !== id));
  };
  
  const handleItemSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const type = formData.get('type') as 'Filme' | 'Série';
    const platform = formData.get('platform') as string;
    const image = formData.get('image') as string;

    if (editingItem) {
      setWatchlist(watchlist.map(item => item.id === editingItem.id ? { ...item, name, type, platform, image: image || item.image } : item));
    } else {
      const newItem = {
        id: Date.now(),
        name,
        type,
        platform,
        status: 'to-watch',
        image: image || `https://picsum.photos/seed/${Date.now()}/300/450`
      };
      setWatchlist([newItem, ...watchlist]);
    }

    setIsDialogOpen(false);
    setEditingItem(null);
  };

  const renderList = (status: string) => {
    const filteredList = watchlist.filter(item => item.status === status);
    
    if (filteredList.length === 0) {
        return <div className="col-span-full text-center text-muted-foreground py-10">Nenhum item aqui.</div>;
    }

    return filteredList.map(item => (
        <Card key={item.id} className="overflow-hidden w-full group">
            <div className="relative aspect-[2/3]">
                <Image src={item.image} alt={item.name} fill objectFit="cover" data-ai-hint="movie poster" />
                 <Badge variant="secondary" className="absolute top-2 left-2">{item.platform}</Badge>
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
                                    {item.status !== 'to-watch' && <DropdownMenuItem onClick={() => moveItem(item.id, 'to-watch')}>Para Assistir</DropdownMenuItem>}
                                    {item.status !== 'watching' && <DropdownMenuItem onClick={() => moveItem(item.id, 'watching')}>Assistindo</DropdownMenuItem>}
                                    {item.status !== 'watched' && <DropdownMenuItem onClick={() => moveItem(item.id, 'watched')}>Já Vimos</DropdownMenuItem>}
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
                    {item.type === 'Filme' ? <Film className="w-3 h-3 mr-1"/> : <Tv className="w-3 h-3 mr-1"/>}
                    <span>{item.type}</span>
                </div>
            </CardContent>
            {item.status === 'watched' && item.dateWatched && (
                <CardFooter className="p-3 pt-0 text-xs text-muted-foreground">
                    Assistido em {new Date(item.dateWatched).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
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
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto" onClick={() => handleOpenDialog()}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Item
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
                <DialogTitle>{editingItem ? 'Editar Item' : 'Adicionar à Lista'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleItemSubmit} className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">Título</Label>
                    <Input id="name" name="name" className="col-span-3" defaultValue={editingItem?.name} required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="type" className="text-right">Tipo</Label>
                    <Select name="type" defaultValue={editingItem?.type} required>
                        <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Filme">Filme</SelectItem>
                            <SelectItem value="Série">Série</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="platform" className="text-right">Onde Assistir</Label>
                    <Input id="platform" name="platform" placeholder="Netflix, cinema, etc." className="col-span-3" defaultValue={editingItem?.platform} required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="image" className="text-right">URL da Imagem</Label>
                    <Input id="image" name="image" placeholder="https://exemplo.com/poster.jpg" className="col-span-3" defaultValue={editingItem?.image}/>
                </div>
                <DialogFooter>
                    <Button type="submit">{editingItem ? 'Salvar Alterações' : 'Adicionar'}</Button>
                </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="to-watch">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="to-watch">Para Assistir</TabsTrigger>
          <TabsTrigger value="watching">Assistindo</TabsTrigger>
          <TabsTrigger value="watched">Já Vimos</TabsTrigger>
        </TabsList>
        <TabsContent value="to-watch" className="mt-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
            {renderList('to-watch')}
          </div>
        </TabsContent>
        <TabsContent value="watching" className="mt-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
             {renderList('watching')}
          </div>
        </TabsContent>
        <TabsContent value="watched" className="mt-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
            {renderList('watched')}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
    