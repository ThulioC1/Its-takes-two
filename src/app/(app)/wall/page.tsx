'use client';
import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Heart, MessageSquare, Send, MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialPosts = [
    { id: 1, userId: 'user-avatar-1', name: 'Maria', content: 'Lembrando do nosso primeiro encontro hoje! Parece que foi ontem. ❤️', time: 'há 2 horas', likes: 5, comments: 2 },
    { id: 2, userId: 'user-avatar-2', name: 'João', content: 'Ansioso para o nosso jantar de sábado! Vai ser incrível.', time: 'há 1 dia', likes: 3, comments: 1 },
    { id: 3, userId: 'user-avatar-1', name: 'Maria', content: 'Conseguimos terminar a 3ª temporada de The Bear! Que série!! 🤯', time: 'há 3 dias', likes: 8, comments: 4 },
];

export default function WallPage() {
    const [posts, setPosts] = useState(initialPosts);
    const [newPostContent, setNewPostContent] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingPost, setEditingPost] = useState<any>(null);

    const userAvatar1 = PlaceHolderImages.find((p) => p.id === "user-avatar-1");
    const userAvatar2 = PlaceHolderImages.find((p) => p.id === "user-avatar-2");
    const avatars = { "user-avatar-1": userAvatar1, "user-avatar-2": userAvatar2 };

    const handleOpenDialog = (post: any = null) => {
        setEditingPost(post);
        setNewPostContent(post ? post.content : '');
        setIsDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setEditingPost(null);
        setNewPostContent('');
        setIsDialogOpen(false);
    };

    const handlePublish = (e?: React.FormEvent<HTMLFormElement>) => {
        e?.preventDefault();
        if (newPostContent.trim()) {
            if (editingPost) {
                setPosts(posts.map(p => p.id === editingPost.id ? { ...p, content: newPostContent } : p));
            } else {
                const newPost = {
                    id: Date.now(),
                    userId: 'user-avatar-1', // Assuming the current user is Maria
                    name: 'Maria',
                    content: newPostContent,
                    time: 'agora',
                    likes: 0,
                    comments: 0
                };
                setPosts([newPost, ...posts]);
            }
            handleCloseDialog();
        }
    };

    const handleDelete = (id: number) => {
        setPosts(posts.filter(p => p.id !== id));
    };

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
                    {userAvatar1 && <AvatarImage src={userAvatar1.imageUrl} />}
                    <AvatarFallback>M</AvatarFallback>
                </Avatar>
                <div className="w-full">
                    <Textarea 
                        placeholder="No que você está pensando?" 
                        className="mb-2"
                        value={newPostContent}
                        onChange={(e) => setNewPostContent(e.target.value)}
                        onFocus={() => !editingPost && setNewPostContent('')}
                    />
                    <Button onClick={() => handlePublish()}>
                        <Send className="mr-2 h-4 w-4" />
                        Publicar
                    </Button>
                </div>
            </div>
        </CardContent>
      </Card>

        <Dialog open={isDialogOpen} onOpenChange={ (isOpen) => { if (!isOpen) handleCloseDialog() }}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Editar Publicação</DialogTitle>
                </DialogHeader>
                <form onSubmit={handlePublish} className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="content" className="text-right">Conteúdo</Label>
                        <Textarea id="content" name="content" className="col-span-3" value={newPostContent} onChange={(e) => setNewPostContent(e.target.value)} required />
                    </div>
                    <DialogFooter>
                        <Button type="submit">Salvar</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>

      <div className="flex flex-col gap-6">
        {posts.map(post => (
            <Card key={post.id}>
                <CardHeader className="flex-row gap-4 items-center">
                    <Avatar>
                        {avatars[post.userId as keyof typeof avatars] && <AvatarImage src={avatars[post.userId as keyof typeof avatars]?.imageUrl} />}
                        <AvatarFallback>{post.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-semibold">{post.name}</p>
                        <p className="text-xs text-muted-foreground">{post.time}</p>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0 ml-auto">
                                <span className="sr-only">Abrir menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenDialog(post)}>Editar</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(post.id)}>Deletar</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </CardHeader>
                <CardContent>
                    <p>{post.content}</p>
                </CardContent>
                <CardFooter className="gap-4">
                    <Button variant="ghost" size="sm" className="flex items-center gap-2">
                        <Heart className="h-4 w-4"/>
                        <span>{post.likes} Curtir</span>
                    </Button>
                     <Button variant="ghost" size="sm" className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4"/>
                        <span>{post.comments} Comentar</span>
                    </Button>
                </CardFooter>
            </Card>
        ))}
      </div>
    </div>
  );
}
