'use client';

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { PlusCircle, Film, Tv, MoreHorizontal, Star, ArrowDownUp, MessageSquare } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuPortal, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCollection, useFirestore, useUser, useMemoFirebase, useDoc } from "@/firebase";
import { collection, doc, addDoc, updateDoc, deleteDoc, serverTimestamp, Timestamp, arrayUnion, arrayRemove } from "firebase/firestore";
import type { MovieSeries, UserProfile, Review } from "@/types";
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


function WatchlistForm({ item, onSave, onCancel }: { item?: MovieSeries; onSave: (data: Partial<MovieSeries>) => void; onCancel: () => void; }) {
  const [itemType, setItemType] = useState(item?.type);
  const [watchedDate, setWatchedDate] = useState<string>('');

  useEffect(() => {
    setItemType(item?.type);
    if (item?.dateWatched && item.dateWatched.toDate) {
      setWatchedDate(format(item.dateWatched.toDate(), 'yyyy-MM-dd'));
    } else {
      setWatchedDate('');
    }
  }, [item]);
  
  const handleItemSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: Partial<MovieSeries & { dateWatchedString?: string }> = {
      name: formData.get('name') as string,
      type: formData.get('type') as 'Movie' | 'Series',
      platform: formData.get('platform') as string,
      link: formData.get('image') as string,
      season: itemType === 'Series' ? parseInt(formData.get('season') as string, 10) : undefined,
      episode: itemType === 'Series' ? parseInt(formData.get('episode') as string, 10) : undefined,
      dateWatchedString: watchedDate,
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
        <Select name="type" defaultValue={item?.type} required onValueChange={(value) => setItemType(value as 'Movie' | 'Series')}>
          <SelectTrigger className="col-span-3">
            <SelectValue placeholder="Selecione o tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Movie">Filme</SelectItem>
            <SelectItem value="Series">Série</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {itemType === 'Series' && (
        <>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="season" className="text-right">Temporada</Label>
            <Input id="season" name="season" type="number" className="col-span-3" defaultValue={item?.season ?? ''} />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="episode" className="text-right">Episódio</Label>
            <Input id="episode" name="episode" type="number" className="col-span-3" defaultValue={item?.episode ?? ''} />
          </div>
        </>
      )}

      {item?.status === 'Watched' && (
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="dateWatched" className="text-right">Data Assistido</Label>
          <Input 
            id="dateWatched" 
            name="dateWatched" 
            type="date"
            className="col-span-3" 
            value={watchedDate} 
            onChange={(e) => setWatchedDate(e.target.value)} 
          />
        </div>
      )}

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

function ReviewSection({ item, onReviewSubmit, onReviewDelete, onUpdate }: { item: MovieSeries; onReviewSubmit: (review: Omit<Review, 'author'>) => Promise<Review | undefined>; onReviewDelete: () => Promise<void>; onUpdate: (updatedItem: MovieSeries) => void; }) {
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
                        <Textarea placeholder="O que você achou?" value={comment} onChange={e => setComment(e.target.value)} />
                        <Button onClick={handleSubmit} size="sm" disabled={rating === 0}>Salvar Avaliação</Button>
                    </div>
                )}
            </div>
        </div>
    )
}

export default function WatchlistPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MovieSeries | null>(null);
  const [sortOrder, setSortOrder] = useState('dateWatched');

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

  const { data: watchlist, isLoading } = useCollection<MovieSeries>(watchlistRef);
  
  const sortedWatchlist = useMemo(() => {
    if (!watchlist) return [];
    return [...watchlist].sort((a, b) => {
        if (sortOrder === 'dateWatched') {
            const dateA = a.dateWatched?.toDate?.()?.getTime() || 0;
            const dateB = b.dateWatched?.toDate?.()?.getTime() || 0;
            return dateB - dateA; // Most recent first
        }
        if (sortOrder === 'alphabetical') {
            return a.name.localeCompare(b.name);
        }
        if (sortOrder === 'rating') {
            const ratingA = a.reviews?.length ? a.reviews.reduce((acc, r) => acc + r.rating, 0) / a.reviews.length : 0;
            const ratingB = b.reviews?.length ? b.reviews.reduce((acc, r) => acc + r.rating, 0) / b.reviews.length : 0;
            return ratingB - ratingA; // Higher rating first
        }
        return 0;
    });
  }, [watchlist, sortOrder]);

  const handleOpenForm = (item: MovieSeries | null = null) => {
    setSelectedItem(item);
    setIsFormOpen(true);
  };
  
  const handleCloseForm = () => {
    setSelectedItem(null);
    setIsFormOpen(false);
  };

  const handleOpenDetails = (item: MovieSeries) => {
    setSelectedItem(item);
    setIsDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setSelectedItem(null);
    setIsDetailsOpen(false);
  };

  const moveItem = async (id: string, newStatus: "To Watch" | "Watching" | "Watched") => {
    if(!watchlistRef) return;
    const itemDoc = doc(watchlistRef, id);
    const updateData: {status: string, dateWatched?: Timestamp | null} = { status: newStatus };
    if (newStatus === 'Watched') {
        updateData.dateWatched = serverTimestamp() as Timestamp;
    } else {
        updateData.dateWatched = null;
    }
    await updateDoc(itemDoc, updateData);
  };
  
  const deleteItem = async (id: string) => {
    if(!watchlistRef) return;
    const itemDoc = doc(watchlistRef, id);
    await deleteDoc(itemDoc);
  };
  
  const handleSaveItem = async (data: Partial<MovieSeries & { dateWatchedString?: string }>) => {
    if(!watchlistRef || !user || !user.displayName) return;

    const { dateWatchedString, ...restOfData } = data;

    const dataToSave: Partial<MovieSeries> = {
      ...restOfData,
      link: data.link || `https://picsum.photos/seed/${Date.now()}/300/450`,
    };

    if (data.type === 'Series') {
      dataToSave.season = !isNaN(data.season as number) ? data.season : undefined;
      dataToSave.episode = !isNaN(data.episode as number) ? data.episode : undefined;
    } else {
      dataToSave.season = undefined;
      dataToSave.episode = undefined;
    }

    if (dateWatchedString) {
      dataToSave.dateWatched = Timestamp.fromDate(new Date(dateWatchedString + 'T00:00:00'));
    } else if (selectedItem && selectedItem.status === 'Watched') {
       // do nothing to keep the existing date if field is cleared
    } else {
       dataToSave.dateWatched = null;
    }

    if (selectedItem) {
      await updateDoc(doc(watchlistRef, selectedItem.id), dataToSave as any);
    } else {
      await addDoc(watchlistRef, {
        ...dataToSave,
        status: 'To Watch',
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

  const handleReviewSubmit = async (itemId: string, review: Omit<Review, 'author'>): Promise<Review | undefined> => {
    if (!watchlistRef || !user || !userProfile) return;

    const itemDoc = doc(watchlistRef, itemId);
    const currentItem = watchlist?.find(i => i.id === itemId);
    const existingReview = currentItem?.reviews?.find(r => r.author.uid === user.uid);

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
      await updateDoc(itemDoc, {
        reviews: arrayRemove(existingReview)
      });
    }
     await updateDoc(itemDoc, {
      reviews: arrayUnion(newReview)
    });
    
    return newReview;
  };
  
  const handleReviewDelete = async (itemId: string) => {
    if (!watchlistRef || !user) return;
    const itemDoc = doc(watchlistRef, itemId);
    const currentItem = watchlist?.find(i => i.id === itemId);
    const existingReview = currentItem?.reviews?.find(r => r.author.uid === user.uid);
    if (existingReview) {
      await updateDoc(itemDoc, {
        reviews: arrayRemove(existingReview)
      });
    }
  };

  const getAverageRating = (reviews?: Review[]) => {
    if (!reviews || reviews.length === 0) return 0;
    const total = reviews.reduce((acc, r) => acc + r.rating, 0);
    return total / reviews.length;
  }


  const renderList = (status: "To Watch" | "Watching" | "Watched") => {
    if (isLoading) return <div className="col-span-full text-center text-muted-foreground py-10">Carregando...</div>;
    
    const filteredList = sortedWatchlist?.filter(item => item.status === status) || [];
    
    if (filteredList.length === 0) {
        return <div className="col-span-full text-center text-muted-foreground py-10">Nenhum item aqui.</div>;
    }

    return filteredList.map(item => {
        const averageRating = getAverageRating(item.reviews);
        return (
        <Card key={item.id} className="overflow-hidden w-full group flex flex-col">
            <div className="relative aspect-[2/3] cursor-pointer" onClick={() => handleOpenDetails(item)}>
                <Image src={item.link || `https://picsum.photos/seed/${item.id}/300/450`} alt={item.name} fill objectFit="cover" data-ai-hint="movie poster" />
                 <div className="absolute top-2 left-2 right-2 flex justify-between items-start">
                    {item.platform && <Badge variant="secondary">{item.platform}</Badge>}
                    {item.type === 'Series' && item.status === 'Watching' && (item.season || item.episode) && (
                        <Badge variant="default">
                            {item.season && `T${item.season}`}
                            {item.season && item.episode && ':'}
                            {item.episode && `E${item.episode}`}
                        </Badge>
                    )}
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
                                    {item.status !== 'To Watch' && <DropdownMenuItem onSelect={() => moveItem(item.id, 'To Watch')}>Para Assistir</DropdownMenuItem>}
                                    {item.status !== 'Watching' && <DropdownMenuItem onSelect={() => moveItem(item.id, 'Watching')}>Assistindo</DropdownMenuItem>}
                                    {item.status !== 'Watched' && <DropdownMenuItem onSelect={() => moveItem(item.id, 'Watched')}>Já Vimos</DropdownMenuItem>}
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
                    <div className="flex items-center">
                        {item.type === 'Movie' ? <Film className="w-3 h-3 mr-1"/> : <Tv className="w-3 h-3 mr-1"/>}
                        <span>{item.type}</span>
                    </div>
                     <div className="flex items-center gap-2">
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
                </div>
            </CardContent>
            
            <CardFooter className="p-3 pt-0 text-xs text-muted-foreground flex justify-between items-center">
                 <div>
                    {item.status === 'Watched' && item.dateWatched && item.dateWatched.toDate ? (
                        <span>Visto em {format(item.dateWatched.toDate(), 'dd/MM/yy')}</span>
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
          <h1 className="text-3xl font-bold font-headline">Filmes & Séries</h1>
          <p className="text-muted-foreground">A lista de entretenimento do casal.</p>
        </div>
        <div className="flex gap-2">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                        <ArrowDownUp className="mr-2 h-4 w-4" />
                        Ordenar
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuLabel>Ordenar por</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuRadioGroup value={sortOrder} onValueChange={setSortOrder}>
                        <DropdownMenuRadioItem value="dateWatched">Data (Mais recentes)</DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="alphabetical">Ordem Alfabética</DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="rating">Nota (Maior)</DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                </DropdownMenuContent>
            </DropdownMenu>
            <Button className="w-full sm:w-auto" onClick={() => handleOpenForm()} disabled={!coupleId}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Adicionar Item
            </Button>
        </div>
      </div>

       <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent>
            <DialogHeader>
                <DialogTitle>{selectedItem ? 'Editar Item' : 'Adicionar à Lista'}</DialogTitle>
            </DialogHeader>
            {isFormOpen && <WatchlistForm 
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
                  <div className="relative aspect-[2/3] w-full rounded-lg overflow-hidden mb-4">
                      <Image src={selectedItem.link || `https://picsum.photos/seed/${selectedItem.id}/300/450`} alt={selectedItem.name || ''} layout="fill" objectFit="cover" />
                  </div>
                  <DialogTitle className="font-headline text-2xl">{selectedItem.name}</DialogTitle>
                  <DialogDescription>{selectedItem.platform}</DialogDescription>
              </DialogHeader>
              {selectedItem.status === 'Watched' ? (
                <ReviewSection 
                  item={selectedItem} 
                  onReviewSubmit={(review) => handleReviewSubmit(selectedItem.id, review)} 
                  onReviewDelete={() => handleReviewDelete(selectedItem.id)}
                  onUpdate={setSelectedItem}
                />
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Você pode adicionar uma avaliação quando o item for assistido.</p>
              )}
            </>
            )}
          </DialogContent>
        </Dialog>

    <TooltipProvider>
      <Tabs defaultValue="To Watch">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="To Watch">Para Assistir</TabsTrigger>
          <TabsTrigger value="Watching">Assistindo</TabsTrigger>
          <TabsTrigger value="Watched">Já Vimos</TabsTrigger>
        </TabsList>
        <TabsContent value="To Watch" className="mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
            {renderList('To Watch')}
          </div>
        </TabsContent>
        <TabsContent value="Watching" className="mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
             {renderList('Watching')}
          </div>
        </TabsContent>
        <TabsContent value="Watched" className="mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
            {renderList('Watched')}
          </div>
        </TabsContent>
      </Tabs>
    </TooltipProvider>
    </div>
  );
}
