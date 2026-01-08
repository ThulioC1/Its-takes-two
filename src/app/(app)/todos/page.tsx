'use client';

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, PlusCircle } from "lucide-react";
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

  const firestore = useFirestore();
  const { user } = useUser();
  
  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile } = useDoc<UserProfile>(userProfileRef);

  const coupleId = userProfile?.coupleId;

   const coupleDocRef = useMemoFirebase(() => {
        if (!firestore || !coupleId) return null;
        return doc(firestore, 'couples', coupleId);
    }, [firestore, coupleId]);
    const { data: coupleDetails } = useDoc<any>(coupleDocRef);

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
    if (editingTodo) {
        window.location.reload();
    }
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

  const sortedTodos = useMemo(() => {
    if (!todos) return [];
    return [...todos].sort((a, b) => {
      if (a.status === 'Concluído' && b.status !== 'Concluído') return 1;
      if (a.status !== 'Concluído' && b.status === 'Concluído') return -1;
      const timeA = a.creationDate?.toDate?.()?.getTime() || 0;
      const timeB = b.creationDate?.toDate?.()?.getTime() || 0;
      return timeB - timeA;
    });
  }, [todos]);
  
  const getStatus = (todo: ToDoItem) => {
    if (todo.status === 'Concluído') {
      return { label: 'Concluído', variant: 'secondary' as const, className: '' };
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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">Lista de Tarefas do Casal</h1>
          <p className="text-muted-foreground">Atividades e planos para fazerem juntos.</p>
        </div>
        <Button className="w-full sm:w-auto" onClick={() => handleOpenDialog()} disabled={!coupleId}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar Tarefa
        </Button>
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

      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {isLoading && <p className="p-4 text-center text-muted-foreground">Carregando tarefas...</p>}
            {!isLoading && sortedTodos?.length === 0 && <p className="p-4 text-center text-muted-foreground">Nenhuma tarefa encontrada. Adicione uma!</p>}
            <TooltipProvider>
              {sortedTodos?.map(todo => {
                const statusInfo = getStatus(todo);
                return (
                  <div key={todo.id} className="flex items-center p-4 gap-4 hover:bg-accent">
                    <Checkbox id={`todo-${todo.id}`} checked={todo.status === 'Concluído'} onCheckedChange={() => toggleTodoStatus(todo)}/>
                    <div className="flex-1 grid gap-1">
                      <label htmlFor={`todo-${todo.id}`} className={cn("font-medium", todo.status === 'Concluído' ? 'line-through text-muted-foreground' : '')}>
                        {todo.title}
                      </label>
                      {todo.description && <p className="text-sm text-muted-foreground">{todo.description}</p>}
                      {todo.dueDate && todo.dueDate.toDate && (
                        <p className={cn("text-xs", statusInfo.variant === 'destructive' ? 'text-destructive' : 'text-muted-foreground')}>
                          Vence em: {format(todo.dueDate.toDate(), 'dd/MM/yyyy')}
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
                    <Badge variant={statusInfo.variant} className={statusInfo.className}>
                      {statusInfo.label}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Abrir menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => handleOpenDialog(todo)}>Editar</DropdownMenuItem>
                        {todo.status !== 'Concluído' && <DropdownMenuItem onClick={() => toggleTodoStatus(todo)}>Marcar como concluído</DropdownMenuItem>}
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
    </div>
  );
}
    