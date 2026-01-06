import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, PlusCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const todos = [
  { id: 1, title: 'Assistir ao novo filme da Marvel', description: 'Comprar pipoca e refri!', status: 'Pendente', created: '2024-07-10' },
  { id: 2, title: 'Jantar romântico no sábado', description: 'Reservar mesa no restaurante italiano.', status: 'Pendente', created: '2024-07-09' },
  { id: 3, title: 'Planejar viagem de férias', description: 'Pesquisar destinos na Europa.', status: 'Em andamento', created: '2024-07-05' },
  { id: 4, title: 'Passeio no parque', description: 'Levar a cesta de piquenique.', status: 'Concluído', created: '2024-07-01', completed: '2024-07-03' },
];

export default function TodosPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">Lista de Tarefas do Casal</h1>
          <p className="text-muted-foreground">Atividades e planos para fazerem juntos.</p>
        </div>
        <Dialog>
            <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Adicionar Tarefa
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Nova Tarefa</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="title" className="text-right">Título</Label>
                        <Input id="title" placeholder="O que vocês vão fazer?" className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="description" className="text-right">Descrição</Label>
                        <Textarea id="description" placeholder="Detalhes extras..." className="col-span-3" />
                    </div>
                </div>
                <DialogFooter>
                    <Button type="submit">Salvar Tarefa</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {todos.map(todo => (
              <div key={todo.id} className="flex items-center p-4 gap-4 hover:bg-accent">
                <Checkbox id={`todo-${todo.id}`} checked={todo.status === 'Concluído'} />
                <div className="flex-1 grid gap-1">
                  <label htmlFor={`todo-${todo.id}`} className={`font-medium ${todo.status === 'Concluído' ? 'line-through text-muted-foreground' : ''}`}>
                    {todo.title}
                  </label>
                  <p className="text-sm text-muted-foreground">{todo.description}</p>
                   <p className="text-xs text-muted-foreground">
                    Criado em: {new Date(todo.created).toLocaleDateString('pt-BR')}
                    {todo.completed && ` | Concluído em: ${new Date(todo.completed).toLocaleDateString('pt-BR')}`}
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
                    <DropdownMenuItem>Editar</DropdownMenuItem>
                    <DropdownMenuItem>Marcar como concluído</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">Deletar</DropdownMenuItem>
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
