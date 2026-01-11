'use client';

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { PlusCircle, Gamepad2, MoreHorizontal, Star, MessageSquare } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuPortal } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCollection, useFirestore, useUser, useMemoFirebase, useDoc } from "@/firebase";
import { collection, doc, addDoc, updateDoc, deleteDoc, serverTimestamp, Timestamp, arrayUnion, arrayRemove } from "firebase/firestore";
import type { Game, UserProfile, Review } from "@/types";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format } from 'date-fns';
import { Textarea } from "@/components/ui/textarea";

const StarRating = ({ rating, onRatingChange, readOnly = false }: { rating: number; onRatingChange?: (rating: number) => void; readOnly?: boolean }) => {
    return (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    className={`h-5 w-5 ${rating >= star ? 'text-amber-400 fill-amber-400' : 'text-gray-300'} ${!readOnly && onRatingChange ? 'cursor-pointer' : ''}`}
                    onClick={() => !readOnly && onRatingChange?.(star)}
                />
            ))}
        </div>
    );
};

function GameForm({ item, onSave, onCancel }: { item?: Game; onSave: (data: Partial<Game>) => void; onCancel: () => void; }) {
  const [startDate, setStartDate] = useState<string>('');
  const [completionDate, setCompletionDate] = useState<string>('');

  useEffect(() => {
    if (item?.startDate && item.startDate.toDate) {
      setStartDate(format(item.startDate.toDate(), 'yyyy-MM-dd'));
    } else {
      setStartDate('');
    }
    if (item?.completionDate && item.completionDate.toDate) {
      setCompletionDate(format(item.completionDate.toDate(), 'yyyy-MM-dd'));
    } else {
      setCompletionDate('');
    }
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

function ReviewSection({ item, onReviewSubmit, onReviewDelete, onUpdate }: { item: Game; onReviewSubmit: (review: Omit<Review, 'author'>) => Promise<Review | undefined>; onReviewDelete: () => Promise<void>; onUpdate: (updatedItem: Game) => void; }) {
    const { user } = useUser();
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isEditing, setIsEditing] = useState(true);

    const userReview = useMemo(() => item.reviews?.find(r => r.author.uid === user?.uid), [item.reviews, user]);

    useEffect(() => {
        if (userReview) {
            setRating(userReview.rating);
            setComment(userReview.comment);
            setIsEditing(false);
        } else {
            setRating(0);
            setComment('');
            setIsEditing(true);
        }
    }, [userReview]);

    const handleSubmit = async () => {
        const newReview = await onReviewSubmit({ rating, comment });
        if (newReview) {
            const updatedReviews = [...(item.reviews?.filter(r => r.author.uid !== user?.uid) || []), newReview];
            onUpdate({ ...item, reviews: updatedReviews });
        }
        setIsEditing(false);
    }
    
    const handleDelete = async () => {
        await onReviewDelete();
        const updatedReviews = item.reviews?.filter(r => r.author.uid !== user?.uid) || [];
        onUpdate({ ...item, reviews: updatedReviews });
        setRating(0);
        setComment('');
        setIsEditing(true);
    }

    return (
        <div className="mt-4 pt-4 border-t">
            <h4 className="font-semibold mb-3">Avaliações</h4>
             <div className="space-y-4 max-h-48 overflow-y-auto pr-2">
                {item.reviews?.filter(r => r.author.uid !== user?.uid).map(review => (
                    <div key={review.author.uid} className="flex gap-3">
                         <Avatar className="h-8 w-8">
                            <AvatarImage src={review.author.photoURL || ''} />
                            <AvatarFallback>{review.author.displayName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <div className="flex items-center gap-2">
                                <p className="font-semibold text-sm">{review.author.displayName}</p>
                                <StarRating rating={review.rating} readOnly />
                            </div>
                            <p className="text-sm text-muted-foreground italic">"{review.comment}"</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-4 pt-4 border-t">
                {userReview && !isEditing ? (
                     <div className="flex gap-3">
                         <Avatar className="h-8 w-8">
                            <AvatarImage src={userReview.author.photoURL || ''} />
                            <AvatarFallback>{userReview.author.displayName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <div className="flex items-center gap-2">
                                <p className="font-semibold text-sm">Sua avaliação</p>
                                <StarRating rating={userReview.rating} readOnly />
                            </div>
                            <p className="text-sm text-muted-foreground italic">"{userReview.comment}"</p>
                            <div className="flex gap-2">
                                <Button variant="link" size="sm" className="p-0 h-auto" onClick={() => setIsEditing(true)}>Editar</Button>
                                <Button variant="link" size="sm" className="p-0 h-auto text-destructive" onClick={handleDelete}>Excluir</Button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <Label>Sua avaliação</Label>
                        <StarRating rating={rating} onRatingChange={setRating} />
                        <Textarea placeholder="O que você achou do jogo?" value={comment} onChange={e => setComment(e.target.value)} />
                        <Button onClick={handleSubmit} size="sm" disabled={rating === 0}>Salvar Avaliação</Button>
                    </div>
                )}
            </div>
        </div>
    )
}

export default function GamesPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Game | null>(null);

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
  
  const handleOpenForm = (item: Game | null = null) => {
    setSelectedItem(item);
    setIsFormOpen(true);
  };
  
  const handleCloseForm = () => {
    setSelectedItem(null);
    setIsFormOpen(false);
  }
  
  const handleOpenDetails = (item: Game) => {
    setSelectedItem(item);
    setIsDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setSelectedItem(null);
    setIsDetailsOpen(false);
  };

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
        updateData.startDate = undefined;
        updateData.completionDate = undefined;
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

    if (startDateString) dataToSave.startDate = Timestamp.fromDate(new Date(startDateString + 'T00:00:00'));
    if (completionDateString) dataToSave.completionDate = Timestamp.fromDate(new Date(completionDateString + 'T00:00:00'));

    if (selectedItem) {
      const itemDoc = doc(gamesRef, selectedItem.id);
      await updateDoc(itemDoc, dataToSave);
    } else {
      await addDoc(gamesRef, {
        ...dataToSave,
        status: 'Para Jogar',
        reviews: [],
        creationDate: serverTimestamp(),
        author: {
            uid: user.uid,
            displayName: user.displayName,
            photoURL: user.photoURL || null,
            gender: userProfile?.gender || 'Prefiro não informar'
        }
      });
    }
    handleCloseForm();
  };

  const handleReviewSubmit = async (gameId: string, review: Omit<Review, 'author'>): Promise<Review | undefined> => {
    if (!gamesRef || !user || !userProfile) return;

    const gameDoc = doc(gamesRef, gameId);
    const currentGame = games?.find(g => g.id === gameId);
    const existingReview = currentGame?.reviews?.find(r => r.author.uid === user.uid);

    const newReview: Review = {
      author: {
        uid: user.uid,
        displayName: user.displayName || 'Usuário',
        photoURL: user.photoURL || '',
        gender: userProfile.gender,
      },
      rating: review.rating,
      comment: review.comment,
    };
    
    if (existingReview) {
      await updateDoc(gameDoc, {
        reviews: arrayRemove(existingReview)
      });
    }
    await updateDoc(gameDoc, {
      reviews: arrayUnion(newReview)
    });
    
    return newReview;
  };
  
  const handleReviewDelete = async (gameId: string) => {
    if (!gamesRef || !user) return;
    const gameDoc = doc(gamesRef, gameId);
    const currentGame = games?.find(g => g.id === gameId);
    const existingReview = currentGame?.reviews?.find(r => r.author.uid === user.uid);
    if (existingReview) {
      await updateDoc(gameDoc, {
        reviews: arrayRemove(existingReview)
      });
    }
  };

  const getAverageRating = (reviews?: Review[]) => {
    if (!reviews || reviews.length === 0) return 0;
    const total = reviews.reduce((acc, r) => acc + r.rating, 0);
    return total / reviews.length;
  }

  const renderList = (status: "Para Jogar" | "Jogando" | "Zerado") => {
    if (isLoading) return <div className="col-span-full text-center text-muted-foreground py-10">Carregando...</div>;
    
    const filteredList = games?.filter(item => item.status === status) || [];
    
    if (filteredList.length === 0) {
        return <div className="col-span-full text-center text-muted-foreground py-10">Nenhum jogo aqui.</div>;
    }

    return filteredList.map(item => {
        const averageRating = getAverageRating(item.reviews);
        return (
        <Card key={item.id} className="overflow-hidden w-full group flex flex-col">
            <div className="relative aspect-[3/4] cursor-pointer" onClick={() => handleOpenDetails(item)}>
                <Image src={item.link || `https://picsum.photos/seed/${item.id}/300/450`} alt={item.name} fill objectFit="cover" data-ai-hint="game cover" />
                 <div className="absolute top-2 left-2 right-2 flex justify-between items-start">
                    {item.platform && <Badge variant="secondary">{item.platform}</Badge>}
                 </div>
                 <div className="absolute top-1 right-1">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-white bg-black/20 hover:bg-black/50 hover:text-white" onClick={(e) => e.stopPropagation()}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                         <DropdownMenuItem onSelect={() => handleOpenForm(item)}>Editar</DropdownMenuItem>
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
            <CardContent className="p-3 flex-grow cursor-pointer" onClick={() => handleOpenDetails(item)}>
                <h3 className="font-semibold font-headline truncate text-sm">{item.name}</h3>
                <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                    {averageRating > 0 ? (
                        <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                            <span className="font-semibold">{averageRating.toFixed(1)}</span>
                        </div>
                    ) : <div />}
                    {item.reviews && item.reviews.length > 0 && (
                        <div className="flex items-center gap-1">
                            <MessageSquare className="w-4 h-4" />
                            <span>{item.reviews.length}</span>
                        </div>
                    )}
                </div>
            </CardContent>
            <CardFooter className="p-3 pt-0 text-xs text-muted-foreground flex justify-between items-center">
                 <div>
                    {item.status === 'Zerado' && item.completionDate && item.completionDate.toDate ? (
                        <span>Zerado em {format(item.completionDate.toDate(), 'dd/MM/yy')}</span>
                    ) : item.status === 'Jogando' && item.startDate && item.startDate.toDate ? (
                        <span>Iniciado em {format(item.startDate.toDate(), 'dd/MM/yy')}</span>
                    ) : <span />}
                </div>
                 {item.author && (
                    <Tooltip>
                        <TooltipTrigger>
                            <Avatar className="h-5 w-5">
                                 <AvatarImage src={item.author.photoURL || ''} />
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
    )});
}

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">Jogos</h1>
          <p className="text-muted-foreground">O que o casal está jogando?</p>
        </div>
        <Button className="w-full sm:w-auto" onClick={() => handleOpenForm()} disabled={!coupleId}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar Jogo
        </Button>
      </div>

       <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent>
            <DialogHeader>
                <DialogTitle>{selectedItem ? 'Editar Jogo' : 'Adicionar à Lista'}</DialogTitle>
            </DialogHeader>
            {isFormOpen && <GameForm 
              item={selectedItem ?? undefined}
              onSave={handleSaveItem}
              onCancel={handleCloseForm}
            />}
          </DialogContent>
        </Dialog>
        
       <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-md">
            {selectedItem && (
            <>
              <DialogHeader>
                  <div className="relative aspect-[3/4] w-full rounded-lg overflow-hidden mb-4">
                      <Image src={selectedItem.link || `https://picsum.photos/seed/${selectedItem.id}/300/450`} alt={selectedItem.name || ''} layout="fill" objectFit="cover" />
                  </div>
                  <DialogTitle className="font-headline text-2xl">{selectedItem.name}</DialogTitle>
                  <DialogDescription>{selectedItem.platform}</DialogDescription>
              </DialogHeader>
              {selectedItem.status === 'Zerado' ? (
                  <ReviewSection 
                      item={selectedItem} 
                      onReviewSubmit={(review) => handleReviewSubmit(selectedItem.id, review)}
                      onReviewDelete={() => handleReviewDelete(selectedItem.id)} 
                      onUpdate={setSelectedItem}
                  />
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Você pode adicionar uma avaliação quando o jogo for zerado.</p>
              )}
            </>
            )}
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
