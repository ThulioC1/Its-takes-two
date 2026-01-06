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

const initialTodos = [
  { id: 1, title: 'Assistir ao novo filme da Marvel', description: 'Comprar pipoca e refri!', status: 'Pendente', created: '2024-07-10' },
  { id: 2, title: 'Jantar romântico no sábado', description: 'Reservar mesa no restaurante italiano.', status: 'Pendente', created: '2024-07-09' },
  { id: 3, title: 'Planejar viagem de férias', description: 'Pesquisar destinos na Europa.', status: 'Em andamento', created: '2024-07-05' },
  { id: 4, title: 'Passeio no parque', description: 'Levar a cesta de piquenique.', status: 'Concluído', created: '2024-07-01', completed: '2024-07-03' },
];

function TodoForm({ todo, onSave, onCancel }: { todo?: any; onSave: (data: any) => void; onCancel: () => void; }) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
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
  const [todos, setTodos] = useState(initialTodos);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<any>(null);

  const handleOpenDialog = (todo: any = null) => {
    setEditingTodo(todo);
    setIsDialogOpen(true);
  };
  
  const handleCloseDialog = () => {
    setEditingTodo(null);
    setIsDialogOpen(false);
  }

  const handleSaveTodo = (data: any) => {
    if (editingTodo) {
      setTodos(todos.map(t => t.id === editingTodo.id ? { ...t, ...data } : t));
    } else {
      const newTodo = {
        id: Date.now(),
        ...data,
        status: 'Pendente',
        created: new Date().toISOString().split('T')[0],
      };
      setTodos([newTodo, ...todos]);
    }
    handleCloseDialog();
  };

  const handleDeleteTodo = (id: number) => {
    setTodos(todos.filter(t => t.id !== id));
  };
  
  const toggleTodoStatus = (id: number) => {
    setTodos(todos.map(todo => {
        if (todo.id === id) {
            const isCompleted = todo.status === 'Concluído';
            return {
                ...todo,
                status: isCompleted ? 'Pendente' : 'Concluído',
                completed: isCompleted ? undefined : new Date().toISOString().split('T')[0]
            };
        }
        return todo;
    }));
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
              todo={editingTodo} 
              onSave={handleSaveTodo}
              onCancel={handleCloseDialog}
            />
          </DialogContent>
        </Dialog>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {todos.map(todo => (
              <div key={todo.id} className="flex items-center p-4 gap-4 hover:bg-accent">
                <Checkbox id={`todo-${todo.id}`} checked={todo.status === 'Concluído'} onCheckedChange={() => toggleTodoStatus(todo.id)}/>
                <div className="flex-1 grid gap-1">
                  <label htmlFor={`todo-${todo.id}`} className={`font-medium ${todo.status === 'Concluído' ? 'line-through text-muted-foreground' : ''}`}>
                    {todo.title}
                  </label>
                  <p className="text-sm text-muted-foreground">{todo.description}</p>
                  <p className="text-xs text-muted-foreground">
                    Criado em: {new Date(todo.created).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                    {todo.completed && ` | Concluído em: ${new Date(todo.completed).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}`}
                  </p>
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
                    {todo.status !== 'Concluído' && <DropdownMenuItem onClick={() => toggleTodoStatus(todo.id)}>Marcar como concluído</DropdownMenuItem>}
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
