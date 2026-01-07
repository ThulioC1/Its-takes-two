'use client';
import { useState, useMemo, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Heart, MessageSquare, Send, MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useCollection, useFirestore, useUser, useMemoFirebase, useDoc } from "@/firebase";
import { collection, doc, addDoc, updateDoc, deleteDoc, serverTimestamp, arrayUnion, arrayRemove } from "firebase/firestore";
import type { Post, UserProfile } from "@/types";
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

function PostForm({ post, onSave, onCancel }: { post?: Post; onSave: (content: string) => void; onCancel: () => void; }) {
  const [content, setContent] = useState(post ? post.text : '');

  const handlePublish = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (content.trim()) {
      onSave(content);
    }
  };

  return (
    <form onSubmit={handlePublish} className="grid gap-4 py-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="content" className="text-right">Conteúdo</Label>
        <Textarea id="content" name="content" className="col-span-3" value={content} onChange={(e) => setContent(e.target.value)} required />
      </div>
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button type="submit">Salvar</Button>
      </DialogFooter>
    </form>
  );
}


export default function WallPage() {
    const [newPostContent, setNewPostContent] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingPost, setEditingPost] = useState<Post | null>(null);
    const [postToEdit, setPostToEdit] = useState<Post | null>(null);

    useEffect(() => {
        if (postToEdit) {
            setEditingPost(postToEdit);
            setIsDialogOpen(true);
        }
    }, [postToEdit]);

    const firestore = useFirestore();
    const { user } = useUser();

     const userProfileRef = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user]);

    const { data: userProfile } = useDoc<UserProfile>(userProfileRef);
    const coupleId = userProfile?.coupleId;

    const postsRef = useMemoFirebase(() => {
        if (!firestore || !coupleId) return null;
        return collection(firestore, 'couples', coupleId, 'posts');

    }, [firestore, coupleId]);

    const { data: posts, isLoading } = useCollection<Post>(postsRef);

    const sortedPosts = useMemo(() => {
        if (!posts) return [];
        return [...posts].sort((a, b) => {
            const timeA = a.dateTime?.toDate?.()?.getTime() || 0;
            const timeB = b.dateTime?.toDate?.()?.getTime() || 0;
            return timeB - timeA;
        });
    }, [posts]);

    const handleCloseDialog = () => {
        setEditingPost(null);
        setPostToEdit(null);
        setIsDialogOpen(false);
    };

    const handleSavePost = async (content: string) => {
        if (!postsRef || !editingPost) return;
        const postDoc = doc(postsRef, editingPost.id);
        await updateDoc(postDoc, { text: content });
        handleCloseDialog();
    };
    
    const handlePublish = async () => {
        if (newPostContent.trim() && postsRef && user && user.displayName) {
            await addDoc(postsRef, {
                text: newPostContent,
                dateTime: serverTimestamp(),
                likes: [],
                comments: 0,
                author: {
                  uid: user.uid,
                  displayName: user.displayName,
                  photoURL: user.photoURL,
                  gender: userProfile?.gender
                }
            });
            setNewPostContent('');
        }
    };

    const handleDelete = async (id: string) => {
        if (!postsRef) return;
        const postDoc = doc(postsRef, id);
        await deleteDoc(postDoc);
    };

    const handleLike = async (post: Post) => {
        if (!postsRef || !user) return;
        const postDoc = doc(postsRef, post.id);
        const hasLiked = post.likes.includes(user.uid);
        await updateDoc(postDoc, {
            likes: hasLiked ? arrayRemove(user.uid) : arrayUnion(user.uid)
        });
    }

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Mural do Casal</h1>
        <p className="text-muted-foreground">Um espaço privado para compartilhar momentos e pensamentos.</p>
      </div>

      <Card>
        <CardContent className="p-4">
            <div className="flex gap-4">
                <Avatar>
                    <AvatarImage src={user?.photoURL || ''} />
                    <AvatarFallback>{user?.displayName?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <div className="w-full">
                    <Textarea 
                        placeholder="No que você está pensando?" 
                        className="mb-2"
                        value={newPostContent}
                        onChange={(e) => setNewPostContent(e.target.value)}
                        disabled={!user || !coupleId}
                    />
                    <Button onClick={handlePublish} disabled={!user || !coupleId || !newPostContent.trim()}>
                        <Send className="mr-2 h-4 w-4" />
                        Publicar
                    </Button>
                </div>
            </div>
        </CardContent>
      </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Editar Publicação</DialogTitle>
                </DialogHeader>
                <PostForm 
                  post={editingPost ?? undefined}
                  onSave={handleSavePost}
                  onCancel={handleCloseDialog}
                />
            </DialogContent>
        </Dialog>

      <div className="flex flex-col gap-6">
        {isLoading && <p className="text-center text-muted-foreground">Carregando mural...</p>}
        {!isLoading && sortedPosts.length === 0 && <p className="text-center text-muted-foreground">Nenhuma publicação ainda.</p>}
        {sortedPosts.map(post => {
          const isMasculino = post.author?.gender === 'Masculino';
          return (
            <Card key={post.id} className={cn(isMasculino ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-pink-50 dark:bg-pink-900/20')}>
                <CardHeader className="flex-row gap-4 items-center">
                    <Avatar>
                        <AvatarImage src={post.author?.photoURL || ''} />
                        <AvatarFallback>{post.author?.displayName?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-semibold">{post.author?.displayName}</p>
                        <p className="text-xs text-muted-foreground">
                            {post.dateTime ? formatDistanceToNow(post.dateTime.toDate(), { addSuffix: true, locale: ptBR }) : 'agora'}
                        </p>
                    </div>
                    {user?.uid === post.author?.uid && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0 ml-auto">
                                    <span className="sr-only">Abrir menu</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onSelect={() => setPostToEdit(post)}>Editar</DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(post.id)}>Deletar</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </CardHeader>
                <CardContent>
                    <p>{post.text}</p>
                </CardContent>
                <CardFooter className="gap-4">
                    <Button variant="ghost" size="sm" className="flex items-center gap-2" onClick={() => handleLike(post)}>
                        <Heart className={cn("h-4 w-4", post.likes.includes(user?.uid || '') && "fill-destructive text-destructive")}/>
                        <span>{post.likes.length} Curtir</span>
                    </Button>
                     <Button variant="ghost" size="sm" className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4"/>
                        <span>{post.comments || 0} Comentar</span>
                    </Button>
                </CardFooter>
            </Card>
        )})}
      </div>
    </div>
  );
}
