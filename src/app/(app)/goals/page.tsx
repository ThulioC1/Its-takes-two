import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PlusCircle, Target, PiggyBank, HeartHandshake, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const goals = [
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

export default function GoalsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">Metas do Casal</h1>
          <p className="text-muted-foreground">Sonhos e objetivos para conquistarem juntos.</p>
        </div>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Meta
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {goals.map(goal => (
          <Card key={goal.id} className="flex flex-col">
            <CardHeader>
              <div className="flex justify-between items-start">
                  <CardTitle className="font-headline text-lg">{goal.title}</CardTitle>
                  <span className={typeInfo[goal.type].color}>{typeInfo[goal.type].icon}</span>
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
              <Button variant="ghost" size="sm">Atualizar</Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
