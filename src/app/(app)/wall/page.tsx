'use client';
import { useState, useMemo, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Heart, MessageSquare, Send, MoreHorizontal, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { useCollection, useFirestore, useUser, useMemoFirebase, useDoc } from "@/firebase";
import { collection, doc, addDoc, updateDoc, deleteDoc, serverTimestamp, arrayUnion, arrayRemove, increment } from "firebase/firestore";
import type { Post, UserProfile, Comment } from "@/types";
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

function PostForm({ post, onSave, onCancel }: { post?: Post; onSave: (content: string) => void; onCancel: () => void; }) {
  const [content, setContent] = useState(post ? post.text : '');

  useEffect(() => {
    setContent(post ? post.text : '');
  }, [post]);

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

function CommentSheet({ post, open, onOpenChange }: { post: Post | null; open: boolean, onOpenChange: (open: boolean) => void }) {
    const firestore = useFirestore();
    const { user } = useUser();
    const [newComment, setNewComment] = useState('');

    const userProfileRef = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user]);
    const { data: userProfile } = useDoc<UserProfile>(userProfileRef);
    const coupleId = userProfile?.coupleId;

    const commentsRef = useMemoFirebase(() => {
        if (!firestore || !coupleId || !post) return null;
        return collection(firestore, 'couples', coupleId, 'posts', post.id, 'comments');
    }, [firestore, coupleId, post]);

    const { data: comments, isLoading } = useCollection<Comment>(commentsRef);

    const sortedComments = useMemo(() => {
        if (!comments) return [];
        return [...comments].sort((a, b) => (a.dateTime?.toDate?.().getTime() || 0) - (b.dateTime?.toDate?.().getTime() || 0));
    }, [comments]);
    
    const handleAddComment = async () => {
        if (!newComment.trim() || !commentsRef || !user || !user.displayName || !post) return;

        await addDoc(commentsRef, {
            postId: post.id,
            text: newComment,
            dateTime: serverTimestamp(),
            author: {
                uid: user.uid,
                displayName: user.displayName,
                photoURL: user.photoURL || null,
                gender: userProfile?.gender || 'Prefiro não informar'
            }
        });

        // Increment comment count
        const postRef = doc(firestore!, 'couples', coupleId!, 'posts', post.id);
        await updateDoc(postRef, { comments: increment(1) });
        
        setNewComment('');
    };

    const handleDeleteComment = async (commentId: string) => {
        if (!commentsRef || !post) return;
        await deleteDoc(doc(commentsRef, commentId));
        // Decrement comment count
        const postRef = doc(firestore!, 'couples', coupleId!, 'posts', post.id);
        await updateDoc(postRef, { comments: increment(-1) });
    };

    if (!post) return null;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="flex flex-col">
                <SheetHeader>
                    <SheetTitle>Comentários sobre o post</SheetTitle>
                </SheetHeader>
                <div className="flex-1 min-h-0">
                    <ScrollArea className="h-full pr-4">
                        <div className="space-y-4">
                            {isLoading && <p>Carregando...</p>}
                            {sortedComments.length === 0 && !isLoading && <p className="text-muted-foreground text-sm text-center py-4">Nenhum comentário ainda. Seja o primeiro!</p>}
                            {sortedComments.map(comment => (
                                <div key={comment.id} className="flex gap-3 group">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={comment.author.photoURL || undefined} />
                                        <AvatarFallback>{comment.author.displayName.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="bg-accent p-3 rounded-lg flex-1">
                                        <div className="flex items-center justify-between">
                                            <p className="font-semibold text-sm">{comment.author.displayName}</p>
                                            <span className="text-xs text-muted-foreground">
                                                {comment.dateTime ? formatDistanceToNow(comment.dateTime.toDate(), { locale: ptBR, addSuffix: true }) : 'agora mesmo'}
                                            </span>
                                        </div>
                                        <p className="text-sm">{comment.text}</p>
                                    </div>
                                    {comment.author.uid === user?.uid && (
                                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100" onClick={() => handleDeleteComment(comment.id)}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </div>
                <SheetFooter>
                    <div className="flex gap-2 w-full">
                        <Textarea placeholder="Adicione um comentário..." value={newComment} onChange={e => setNewComment(e.target.value)} rows={1} />
                        <Button onClick={handleAddComment} disabled={!newComment.trim()}>
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    )
}

export default function WallPage() {
    const [newPostContent, setNewPostContent] = useState('');
    const [isPostDialogOpen, setIsPostDialogOpen] = useState(false);
    const [editingPost, setEditingPost] = useState<Post | null>(null);
    const [isCommentSheetOpen, setIsCommentSheetOpen] = useState(false);
    const [selectedPostForComments, setSelectedPostForComments] = useState<Post | null>(null);

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

    const handleOpenPostDialog = (post: Post | null = null) => {
        setEditingPost(post);
        setIsPostDialogOpen(true);
    };
    
    const handleClosePostDialog = () => {
        setEditingPost(null);
        setIsPostDialogOpen(false);
    };
    
    const handleOpenCommentSheet = (post: Post) => {
        setSelectedPostForComments(post);
        setIsCommentSheetOpen(true);
    };

    const handleSavePost = async (content: string) => {
        if (!postsRef || !editingPost) return;
        const postDoc = doc(postsRef, editingPost.id);
        await updateDoc(postDoc, { text: content });
        handleClosePostDialog();
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
                  photoURL: user.photoURL || null,
                  gender: userProfile?.gender || 'Prefiro não informar'
                }
            });

            setNewPostContent('');
        }
    };

    const handleDelete = async (id: string) => {
        if (!postsRef) return;
        // Note: This doesn't delete sub-collections like comments. For a production app, a Cloud Function would be needed.
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

        <Dialog open={isPostDialogOpen} onOpenChange={setIsPostDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Editar Publicação</DialogTitle>
                </DialogHeader>
                <PostForm 
                  post={editingPost ?? undefined}
                  onSave={handleSavePost}
                  onCancel={handleClosePostDialog}
                />
            </DialogContent>
        </Dialog>
        
        <CommentSheet post={selectedPostForComments} open={isCommentSheetOpen} onOpenChange={setIsCommentSheetOpen} />

      <div className="flex flex-col gap-6">
        {isLoading && <p className="text-center text-muted-foreground">Carregando mural...</p>}
        {!isLoading && sortedPosts.length === 0 && <p className="text-center text-muted-foreground">Nenhuma publicação ainda.</p>}
        {sortedPosts.map(post => {
          const isMasculino = post.author?.gender === 'Masculino';
          return (
            <Card key={post.id} id={`post-${post.id}`} className={cn(isMasculino ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-pink-50 dark:bg-pink-900/20')}>
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
                                <DropdownMenuItem onSelect={() => handleOpenPostDialog(post)}>Editar</DropdownMenuItem>
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
                        <Heart className={cn("h-4 w-4", post.likes && post.likes.includes(user?.uid || '') && "fill-destructive text-destructive")}/>
                        <span>{post.likes?.length || 0} Curtir</span>
                    </Button>
                     <Button variant="ghost" size="sm" className="flex items-center gap-2" onClick={() => handleOpenCommentSheet(post)}>
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

    