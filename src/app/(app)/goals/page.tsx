'use client';
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PlusCircle, PiggyBank, HeartHandshake, User, MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from '@/components/ui/slider';


const initialGoals = [
  { id: 1, title: 'Comprar nosso apartamento', description: 'Juntar R$ 50.000 para a entrada.', progress: 75, status: 'Em andamento', type: 'Financeiro' },
  { id: 2, title: 'Viagem para o Japão', description: 'Planejar e economizar para uma viagem de 15 dias.', progress: 30, status: 'Em andamento', type: 'Financeiro' },
  { id: 3, title: 'Correr uma meia maratona juntos', description: 'Seguir o plano de treinos e completar a prova.', progress: 100, status: 'Concluído', type: 'Pessoal' },
  { id: 4, title: 'Ter um "date night" por semana', description: 'Reservar uma noite só para nós, sem distrações.', progress: 90, status: 'Em andamento', type: 'Relacionamento' },
];

const typeInfo: { [key: string]: { icon: React.ReactNode, color: string } } = {
  'Financeiro': { icon: <PiggyBank />, color: 'text-emerald-500' },
  'Pessoal': { icon: <User />, color: 'text-blue-500' },
  'Relacionamento': { icon: <HeartHandshake />, color: 'text-pink-500' },
};

function GoalForm({ goal, onSave, onCancel }: { goal?: any; onSave: (data: any) => void; onCancel: () => void; }) {
  const [progressValue, setProgressValue] = useState(goal ? goal.progress : 0);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      type: formData.get('type') as string,
      progress: progressValue,
    };
    onSave(data);
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="title" className="text-right">Título</Label>
        <Input id="title" name="title" placeholder="Qual a meta?" className="col-span-3" defaultValue={goal?.title} required />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="description" className="text-right">Descrição</Label>
        <Textarea id="description" name="description" placeholder="Detalhes da meta..." className="col-span-3" defaultValue={goal?.description} />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="type" className="text-right">Tipo</Label>
        <Select name="type" defaultValue={goal?.type} required>
          <SelectTrigger className="col-span-3">
            <SelectValue placeholder="Selecione o tipo" />
          </SelectTrigger>
          <SelectContent>
            {Object.keys(typeInfo).map(key => <SelectItem key={key} value={key}>{key}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="progress" className="text-right">Progresso</Label>
        <div className="col-span-3 flex items-center gap-4">
            <Slider id="progress" name="progress" min={0} max={100} step={5} value={[progressValue]} onValueChange={(val) => setProgressValue(val[0])} className="flex-1"/>
            <span className="text-sm font-semibold w-12 text-right">{progressValue}%</span>
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button type="submit">Salvar Meta</Button>
      </DialogFooter>
    </form>
  );
}


export default function GoalsPage() {
  const [goals, setGoals] = useState(initialGoals);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<any>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleOpenDialog = (goal: any = null) => {
    setEditingGoal(goal);
    setIsDialogOpen(true);
  };
  
  const handleCloseDialog = () => {
    setEditingGoal(null);
    setIsDialogOpen(false);
  }

  const handleSaveGoal = (data: any) => {
    if (editingGoal) {
      setGoals(goals.map(g => g.id === editingGoal.id ? { ...g, ...data, status: data.progress === 100 ? 'Concluído' : 'Em andamento' } : g));
    } else {
      const newGoal = {
        id: Date.now(),
        ...data,
        status: data.progress === 100 ? 'Concluído' : 'Em andamento',
      };
      setGoals([newGoal, ...goals]);
    }
    handleCloseDialog();
  };
  
  const handleDelete = (id: number) => {
    setGoals(goals.filter(g => g.id !== id));
  };
  
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">Metas do Casal</h1>
          <p className="text-muted-foreground">Sonhos e objetivos para conquistarem juntos.</p>
        </div>
        <Button className="w-full sm:w-auto" onClick={() => handleOpenDialog()}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar Meta
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingGoal ? 'Editar Meta' : 'Nova Meta'}</DialogTitle>
            </DialogHeader>
            <GoalForm 
              goal={editingGoal}
              onSave={handleSaveGoal}
              onCancel={handleCloseDialog}
            />
          </DialogContent>
        </Dialog>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isClient && goals.map(goal => (
          <Card key={goal.id} className="flex flex-col">
            <CardHeader>
              <div className="flex justify-between items-start">
                  <CardTitle className="font-headline text-lg pr-4">{goal.title}</CardTitle>
                  <div className="flex items-center gap-2">
                    <span className={typeInfo[goal.type]?.color}>{typeInfo[goal.type]?.icon}</span>
                     <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Abrir menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenDialog(goal)}>Editar</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(goal.id)}>Deletar</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
              </div>
              <CardDescription>{goal.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">Progresso</span>
                <span className="text-sm font-semibold">{goal.progress}%</span>
              </div>
              <Progress value={goal.progress} />
            </CardContent>
            <CardFooter className="flex justify-between">
              <Badge variant={goal.status === 'Concluído' ? 'secondary' : 'outline'}>{goal.status}</Badge>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
