'use client';

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { PlusCircle, Gamepad2, MoreHorizontal } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuPortal } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCollection, useFirestore, useUser, useMemoFirebase, useDoc } from "@/firebase";
import { collection, doc, addDoc, updateDoc, deleteDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import type { Game, UserProfile } from "@/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format } from 'date-fns';

function GameForm({ item, onSave, onCancel }: { item?: Game; onSave: (data: Partial<Game>) => void; onCancel: () => void; }) {
  const [startDate, setStartDate] = useState<string>(
    item?.startDate ? format(item.startDate.toDate(), 'yyyy-MM-dd') : ''
  );
   const [completionDate, setCompletionDate] = useState<string>(
    item?.completionDate ? format(item.completionDate.toDate(), 'yyyy-MM-dd') : ''
  );

  useEffect(() => {
    setStartDate(item?.startDate ? format(item.startDate.toDate(), 'yyyy-MM-dd') : '');
    setCompletionDate(item?.completionDate ? format(item.completionDate.toDate(), 'yyyy-MM-dd') : '');
  }, [item]);
  
  const handleItemSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: Partial<Game & { startDateString?: string, completionDateString?: string }> = {
      name: formData.get('name') as string,
      platform: formData.get('platform') as string,
      link: formData.get('image') as string,
      startDateString: startDate,
      completionDateString: completionDate,
    };
    onSave(data);
  };
  
  return (
    <form onSubmit={handleItemSubmit} className="grid gap-4 py-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="name" className="text-right">Nome do Jogo</Label>
        <Input id="name" name="name" className="col-span-3" defaultValue={item?.name} required />
      </div>
       <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="platform" className="text-right">Plataforma</Label>
        <Input id="platform" name="platform" placeholder="PC, PS5, etc." className="col-span-3" defaultValue={item?.platform} />
      </div>
       <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="image" className="text-right">URL da Imagem</Label>
        <Input id="image" name="image" placeholder="https://exemplo.com/capa.jpg" className="col-span-3" defaultValue={item?.link} />
      </div>
      
      {item?.status !== 'Para Jogar' && (
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="startDate" className="text-right">Data de Início</Label>
          <Input 
            id="startDate" 
            name="startDate" 
            type="date"
            className="col-span-3" 
            value={startDate} 
            onChange={(e) => setStartDate(e.target.value)} 
          />
        </div>
      )}

      {item?.status === 'Zerado' && (
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="completionDate" className="text-right">Data de Zeramento</Label>
          <Input 
            id="completionDate" 
            name="completionDate" 
            type="date"
            className="col-span-3" 
            value={completionDate} 
            onChange={(e) => setCompletionDate(e.target.value)} 
          />
        </div>
      )}

      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button type="submit">{item ? 'Salvar Alterações' : 'Adicionar'}</Button>
      </DialogFooter>
    </form>
  );
}


export default function GamesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Game | null>(null);

  const firestore = useFirestore();
  const { user } = useUser();

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile } = useDoc<UserProfile>(userProfileRef);
  const coupleId = userProfile?.coupleId;

  const gamesRef = useMemoFirebase(() => {
    if (!firestore || !coupleId) return null;
    return collection(firestore, 'couples', coupleId, 'games');
  }, [firestore, coupleId]);

  const { data: games, isLoading } = useCollection<Game>(gamesRef);
  
  const handleOpenDialog = (item: Game | null = null) => {
    setEditingItem(item);
    setIsDialogOpen(true);
  };
  
  const handleCloseDialog = () => {
    setEditingItem(null);
    setIsDialogOpen(false);
    if (editingItem) {
        window.location.reload();
    }
  }

  const moveItem = async (id: string, newStatus: "Para Jogar" | "Jogando" | "Zerado") => {
    if(!gamesRef) return;
    const itemDoc = doc(gamesRef, id);
    const currentItem = games?.find(g => g.id === id);

    const updateData: Partial<Game> = { status: newStatus };

    if (newStatus === 'Jogando' && !currentItem?.startDate) {
        updateData.startDate = serverTimestamp() as Timestamp;
    } else if (newStatus === 'Zerado') {
        updateData.completionDate = serverTimestamp() as Timestamp;
        if (!currentItem?.startDate) {
            updateData.startDate = serverTimestamp() as Timestamp;
        }
    } else if (newStatus === 'Para Jogar') {
        updateData.startDate = null;
        updateData.completionDate = null;
    }
    await updateDoc(itemDoc, updateData);
  };
  
  const deleteItem = async (id: string) => {
    if(!gamesRef) return;
    const itemDoc = doc(gamesRef, id);
    await deleteDoc(itemDoc);
  };
  
  const handleSaveItem = async (data: Partial<Game & { startDateString?: string; completionDateString?: string }>) => {
    if(!gamesRef || !user || !user.displayName) return;
    
    const { startDateString, completionDateString, ...restOfData } = data;

    const dataToSave: any = {
      ...restOfData,
      link: data.link || `https://picsum.photos/seed/${Date.now()}/300/450`,
    };

    if (startDateString) dataToSave.startDate = Timestamp.fromDate(new Date(startDateString));
    if (completionDateString) dataToSave.completionDate = Timestamp.fromDate(new Date(completionDateString));

    if (editingItem) {
      const itemDoc = doc(gamesRef, editingItem.id);
      await updateDoc(itemDoc, dataToSave);
    } else {
      await addDoc(gamesRef, {
        ...dataToSave,
        status: 'Para Jogar',
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

  const renderList = (status: "Para Jogar" | "Jogando" | "Zerado") => {
    if (isLoading) return <div className="col-span-full text-center text-muted-foreground py-10">Carregando...</div>;
    
    const filteredList = games?.filter(item => item.status === status) || [];
    
    if (filteredList.length === 0) {
        return <div className="col-span-full text-center text-muted-foreground py-10">Nenhum jogo aqui.</div>;
    }

    return filteredList.map(item => (
        <Card key={item.id} className="overflow-hidden w-full group">
            <div className="relative aspect-[3/4]">
                <Image src={item.link || `https://picsum.photos/seed/${item.id}/300/450`} alt={item.name} fill objectFit="cover" data-ai-hint="game cover" />
                 <div className="absolute top-2 left-2 right-2 flex justify-between items-start">
                    {item.platform && <Badge variant="secondary">{item.platform}</Badge>}
                 </div>
                 <div className="absolute top-1 right-1">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-white bg-black/20 hover:bg-black/50 hover:text-white">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                         <DropdownMenuItem onSelect={() => handleOpenDialog(item)}>Editar</DropdownMenuItem>
                         <DropdownMenuSub>
                            <DropdownMenuSubTrigger>Mover para</DropdownMenuSubTrigger>
                            <DropdownMenuPortal>
                                <DropdownMenuSubContent>
                                    {item.status !== 'Para Jogar' && <DropdownMenuItem onSelect={() => moveItem(item.id, 'Para Jogar')}>Para Jogar</DropdownMenuItem>}
                                    {item.status !== 'Jogando' && <DropdownMenuItem onSelect={() => moveItem(item.id, 'Jogando')}>Jogando</DropdownMenuItem>}
                                    {item.status !== 'Zerado' && <DropdownMenuItem onSelect={() => moveItem(item.id, 'Zerado')}>Zerados</DropdownMenuItem>}
                                </DropdownMenuSubContent>
                            </DropdownMenuPortal>
                         </DropdownMenuSub>
                        <DropdownMenuItem className="text-destructive" onSelect={() => deleteItem(item.id)}>Deletar</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                 </div>
            </div>
            <CardContent className="p-3">
                <h3 className="font-semibold font-headline truncate text-sm">{item.name}</h3>
            </CardContent>
            
            <CardFooter className="p-3 pt-0 text-xs text-muted-foreground flex justify-between items-center">
                 <div>
                    {item.status === 'Zerado' && item.completionDate ? (
                        <span>Zerado em {format(item.completionDate.toDate(), 'dd/MM/yy')}</span>
                    ) : item.status === 'Jogando' && item.startDate ? (
                        <span>Iniciado em {format(item.startDate.toDate(), 'dd/MM/yy')}</span>
                    ) : <span />}
                </div>
                 {item.author && (
                    <Tooltip>
                        <TooltipTrigger>
                            <Avatar className="h-5 w-5">
                                <AvatarFallback className="text-[10px]">{item.author.displayName?.charAt(0) || '?'}</AvatarFallback>
                            </Avatar>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Adicionado por: {item.author.displayName}</p>
                        </TooltipContent>
                    </Tooltip>
                )}
            </CardFooter>
        </Card>
    ));
}

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">Jogos</h1>
          <p className="text-muted-foreground">O que o casal está jogando?</p>
        </div>
        <Button className="w-full sm:w-auto" onClick={() => handleOpenDialog()} disabled={!coupleId}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar Jogo
        </Button>
      </div>

       <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
                <DialogTitle>{editingItem ? 'Editar Jogo' : 'Adicionar à Lista'}</DialogTitle>
            </DialogHeader>
            <GameForm 
              item={editingItem ?? undefined}
              onSave={handleSaveItem}
              onCancel={handleCloseDialog}
            />
          </DialogContent>
        </Dialog>
    <TooltipProvider>
      <Tabs defaultValue="Jogando">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="Para Jogar">Para Jogar</TabsTrigger>
          <TabsTrigger value="Jogando">Jogando</TabsTrigger>
          <TabsTrigger value="Zerados">Zerados</TabsTrigger>
        </TabsList>
        <TabsContent value="Para Jogar" className="mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
            {renderList('Para Jogar')}
          </div>
        </TabsContent>
        <TabsContent value="Jogando" className="mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
             {renderList('Jogando')}
          </div>
        </TabsContent>
        <TabsContent value="Zerados" className="mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
            {renderList('Zerado')}
          </div>
        </TabsContent>
      </Tabs>
    </TooltipProvider>
    </div>
  );
}
