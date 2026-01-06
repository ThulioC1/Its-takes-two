'use client';

import { useState } from "react";
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
import { useCollection, useFirestore, useUser, useMemoFirebase } from "@/firebase";
import { collection, doc, addDoc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import type { ToDoItem } from "@/types";

function TodoForm({ todo, onSave, onCancel }: { todo?: ToDoItem; onSave: (data: Partial<ToDoItem>) => void; onCancel: () => void; }) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: Partial<ToDoItem> = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
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
  const coupleId = user?.uid; // Placeholder for couple ID logic

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

  const handleSaveTodo = async (data: Partial<ToDoItem>) => {
    if (!todosRef) return;
    if (editingTodo) {
      const todoDoc = doc(todosRef, editingTodo.id);
      await updateDoc(todoDoc, data);
    } else {
      await addDoc(todosRef, {
        ...data,
        status: 'Pendente',
        creationDate: serverTimestamp(),
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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">Lista de Tarefas do Casal</h1>
          <p className="text-muted-foreground">Atividades e planos para fazerem juntos.</p>
        </div>
        <Button className="w-full sm:w-auto" onClick={() => handleOpenDialog()}>
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
            {!isLoading && todos?.length === 0 && <p className="p-4 text-center text-muted-foreground">Nenhuma tarefa encontrada. Adicione uma!</p>}
            {todos?.map(todo => (
              <div key={todo.id} className="flex items-center p-4 gap-4 hover:bg-accent">
                <Checkbox id={`todo-${todo.id}`} checked={todo.status === 'Concluído'} onCheckedChange={() => toggleTodoStatus(todo)}/>
                <div className="flex-1 grid gap-1">
                  <label htmlFor={`todo-${todo.id}`} className={`font-medium ${todo.status === 'Concluído' ? 'line-through text-muted-foreground' : ''}`}>
                    {todo.title}
                  </label>
                  <p className="text-sm text-muted-foreground">{todo.description}</p>
                  {todo.creationDate && (
                    <p className="text-xs text-muted-foreground">
                      Criado em: {new Date(todo.creationDate.toDate()).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                      {todo.completionDate && ` | Concluído em: ${new Date(todo.completionDate.toDate()).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}`}
                    </p>
                  )}
                </div>
                <Badge variant={todo.status === 'Concluído' ? 'secondary' : (todo.status === 'Em andamento' ? 'outline' : 'default')}
                    className={todo.status === 'Concluído' ? '' : 'bg-primary/20 text-primary-foreground border-primary/20'}>
                    {todo.status}
                </Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Abrir menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleOpenDialog(todo)}>Editar</DropdownMenuItem>
                    {todo.status !== 'Concluído' && <DropdownMenuItem onClick={() => toggleTodoStatus(todo)}>Marcar como concluído</DropdownMenuItem>}
                    <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteTodo(todo.id)}>Deletar</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
