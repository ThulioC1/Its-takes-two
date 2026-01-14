'use client';

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, PlusCircle, ArrowDownUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCollection, useFirestore, useUser, useMemoFirebase, useDoc } from "@/firebase";
import { collection, doc, addDoc, updateDoc, deleteDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import type { ToDoItem, UserProfile } from "@/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { format, isPast, isToday } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function TodoForm({ todo, onSave, onCancel }: { todo?: ToDoItem; onSave: (data: Partial<ToDoItem & { dueDateString?: string }>) => void; onCancel: () => void; }) {
  const [dueDate, setDueDate] = useState<string>('');

  useEffect(() => {
    if (todo?.dueDate && todo.dueDate.toDate) {
      setDueDate(format(todo.dueDate.toDate(), 'yyyy-MM-dd'));
    } else {
      setDueDate('');
    }
  }, [todo]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: Partial<ToDoItem & { dueDateString?: string }> = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      dueDateString: dueDate,
    };
    onSave(data);
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="title" className="text-right">Título</Label>
        <Input id="title" name="title" placeholder="O que vocês vão fazer?" className="col-span-3" defaultValue={todo?.title} required />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="description" className="text-right">Descrição</Label>
        <Textarea id="description" name="description" placeholder="Detalhes extras..." className="col-span-3" defaultValue={todo?.description} />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="dueDate" className="text-right">Vencimento</Label>
        <Input 
          id="dueDate" 
          name="dueDate" 
          type="date" 
          className="col-span-3" 
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
      </div>
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button type="submit">Salvar Tarefa</Button>
      </DialogFooter>
    </form>
  );
}

export default function TodosPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<ToDoItem | null>(null);
  const [sortOrder, setSortOrder] = useState('creationDate');

  const firestore = useFirestore();
  const { user } = useUser();
  
  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile } = useDoc<UserProfile>(userProfileRef);
  const coupleId = userProfile?.coupleId;

  const todosRef = useMemoFirebase(() => {
    if (!firestore || !coupleId) return null;
    return collection(firestore, 'couples', coupleId, 'todos');
  }, [firestore, coupleId]);

  const { data: todos, isLoading } = useCollection<ToDoItem>(todosRef);

  const handleOpenDialog = (todo: ToDoItem | null = null) => {
    setEditingTodo(todo);
    setIsDialogOpen(true);
  };
  
  const handleCloseDialog = () => {
    setEditingTodo(null);
    setIsDialogOpen(false);
  }

  const handleSaveTodo = async (data: Partial<ToDoItem & { dueDateString?: string }>) => {
    if (!todosRef || !user || !user.displayName) return;

    const { dueDateString, ...restData } = data;
    
    const dataToSave: Partial<ToDoItem> = {
      ...restData,
      dueDate: dueDateString ? Timestamp.fromDate(new Date(dueDateString + 'T00:00:00')) : null,
    };
    
    if (editingTodo) {
      const todoDoc = doc(todosRef, editingTodo.id);
      await updateDoc(todoDoc, dataToSave);
    } else {
      await addDoc(todosRef, {
        ...dataToSave,
        status: 'Pendente',
        creationDate: serverTimestamp(),
        author: {
          uid: user.uid,
          displayName: user.displayName,
          photoURL: user.photoURL,
        }
      });
    }
    handleCloseDialog();
  };

  const handleDeleteTodo = async (id: string) => {
    if (!todosRef) return;
    const todoDoc = doc(todosRef, id);
    await deleteDoc(todoDoc);
  };
  
  const toggleTodoStatus = async (todo: ToDoItem) => {
    if (!todosRef) return;
    const todoDoc = doc(todosRef, todo.id);
    const isCompleted = todo.status === 'Concluído';
    await updateDoc(todoDoc, {
        status: isCompleted ? 'Pendente' : 'Concluído',
        completionDate: isCompleted ? null : serverTimestamp()
    });
};

  const { pendingTodos, completedTodos } = useMemo(() => {
    if (!todos) return { pendingTodos: [], completedTodos: [] };
    
    const pending = todos.filter(t => t.status === 'Pendente').sort((a, b) => {
        if (sortOrder === 'dueDate') {
            const dateA = a.dueDate?.toDate()?.getTime() || Infinity;
            const dateB = b.dueDate?.toDate()?.getTime() || Infinity;
            return dateA - dateB; // Closest due date first
        }
        // Default to creationDate
        const timeA = a.creationDate?.toDate?.()?.getTime() || 0;
        const timeB = b.creationDate?.toDate?.()?.getTime() || 0;
        return timeB - timeA; // Newest first
    });

    const completed = todos.filter(t => t.status === 'Concluído').sort((a,b) => {
        const timeA = a.completionDate?.toDate?.()?.getTime() || 0;
        const timeB = b.completionDate?.toDate?.()?.getTime() || 0;
        return timeB - timeA;
    });

    return { pendingTodos: pending, completedTodos: completed };
  }, [todos, sortOrder]);
  
  const getStatusBadge = (todo: ToDoItem) => {
    if (todo.status === 'Concluído') {
      return null;
    }
    if (todo.dueDate && todo.dueDate.toDate) {
      const dueDate = todo.dueDate.toDate();
      if (isToday(dueDate)) {
        return { label: 'Vence hoje', variant: 'default' as const, className: 'bg-amber-500/20 text-amber-600 border-amber-500/20 hover:bg-amber-500/30' };
      }
      if (isPast(dueDate)) {
        return { label: 'Vencido', variant: 'destructive' as const, className: '' };
      }
    }
    return { label: 'No prazo', variant: 'default' as const, className: 'bg-primary/20 text-primary-foreground border-primary/20' };
  };

  const renderTodoList = (list: ToDoItem[]) => {
      if (isLoading) return <p className="p-4 text-center text-muted-foreground">Carregando tarefas...</p>;
      if (list.length === 0) return <p className="p-4 text-center text-muted-foreground">Nenhuma tarefa aqui.</p>;

      return (
        <Card>
            <CardContent className="p-0">
                <div className="divide-y divide-border">
                    <TooltipProvider>
                    {list.map(todo => {
                        const statusBadge = getStatusBadge(todo);
                        return (
                        <div key={todo.id} className="flex items-center p-4 gap-4 hover:bg-accent">
                            <Checkbox id={`todo-${todo.id}`} checked={todo.status === 'Concluído'} onCheckedChange={() => toggleTodoStatus(todo)}/>
                            <div className="flex-1 grid gap-1">
                            <label htmlFor={`todo-${todo.id}`} className={cn("font-medium", todo.status === 'Concluído' ? 'line-through text-muted-foreground' : '')}>
                                {todo.title}
                            </label>
                            {todo.description && <p className="text-sm text-muted-foreground">{todo.description}</p>}
                             {todo.dueDate && todo.dueDate.toDate && todo.status !== 'Concluído' && (
                                <p className={cn("text-xs", statusBadge?.variant === 'destructive' ? 'text-destructive' : 'text-muted-foreground')}>
                                Vence em: {format(todo.dueDate.toDate(), 'dd/MM/yyyy')}
                                </p>
                            )}
                            {todo.completionDate && todo.completionDate.toDate && todo.status === 'Concluído' && (
                                <p className="text-xs text-muted-foreground">
                                Concluído em: {format(todo.completionDate.toDate(), 'dd/MM/yyyy')}
                                </p>
                            )}
                            </div>
                            {todo.author && (
                            <Tooltip>
                                <TooltipTrigger>
                                <Avatar className="h-6 w-6">
                                    <AvatarFallback className="text-xs">{todo.author.displayName.charAt(0)}</AvatarFallback>
                                </Avatar>
                                </TooltipTrigger>
                                <TooltipContent>
                                <p>Adicionado por: {todo.author.displayName}</p>
                                </TooltipContent>
                            </Tooltip>
                            )}
                            {statusBadge && (
                                <Badge variant={statusBadge.variant} className={statusBadge.className}>
                                    {statusBadge.label}
                                </Badge>
                            )}
                            <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Abrir menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onSelect={() => handleOpenDialog(todo)}>Editar</DropdownMenuItem>
                                {todo.status !== 'Concluído' ? 
                                    <DropdownMenuItem onClick={() => toggleTodoStatus(todo)}>Marcar como concluído</DropdownMenuItem> :
                                    <DropdownMenuItem onClick={() => toggleTodoStatus(todo)}>Marcar como pendente</DropdownMenuItem>
                                }
                                <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteTodo(todo.id)}>Deletar</DropdownMenuItem>
                            </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                        )
                    })}
                    </TooltipProvider>
                </div>
            </CardContent>
        </Card>
      );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">Lista de Tarefas do Casal</h1>
          <p className="text-muted-foreground">Atividades e planos para fazerem juntos.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full sm:w-auto">
                        <ArrowDownUp className="mr-2 h-4 w-4" />
                        Ordenar
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuLabel>Ordenar por</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuRadioGroup value={sortOrder} onValueChange={setSortOrder}>
                        <DropdownMenuRadioItem value="creationDate">Data de Adição</DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="dueDate">Data de Vencimento</DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                </DropdownMenuContent>
            </DropdownMenu>
            <Button className="w-full sm:w-auto" onClick={() => handleOpenDialog()} disabled={!coupleId}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Adicionar Tarefa
            </Button>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTodo ? 'Editar Tarefa' : 'Nova Tarefa'}</DialogTitle>
            </DialogHeader>
            <TodoForm 
              todo={editingTodo ?? undefined}
              onSave={handleSaveTodo}
              onCancel={handleCloseDialog}
            />
          </DialogContent>
        </Dialog>
        
        <Tabs defaultValue="pending">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="pending">Pendentes</TabsTrigger>
                <TabsTrigger value="completed">Concluídas</TabsTrigger>
            </TabsList>
            <TabsContent value="pending" className="mt-6">
                {renderTodoList(pendingTodos)}
            </TabsContent>
            <TabsContent value="completed" className="mt-6">
                {renderTodoList(completedTodos)}
            </TabsContent>
        </Tabs>
    </div>
  );
}
