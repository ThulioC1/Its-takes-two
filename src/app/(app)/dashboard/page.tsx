import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ListTodo,
  CalendarHeart,
  CircleDollarSign,
  Users,
  Heart,
  MessageSquare,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Image from 'next/image';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Badge } from '@/components/ui/badge';

const chartData = [
  { month: 'Janeiro', expenses: 1860 },
  { month: 'Fevereiro', expenses: 2050 },
  { month: 'Março', expenses: 2370 },
  { month: 'Abril', expenses: 1980 },
  { month: 'Maio', expenses: 2140 },
  { month: 'Junho', expenses: 2590 },
];

const chartConfig = {
  expenses: {
    label: 'Despesas',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig;

export default function DashboardPage() {
  const userAvatar1 = PlaceHolderImages.find((p) => p.id === 'user-avatar-1');
  const bannerImage = PlaceHolderImages.find((p) => p.id === 'couple-banner');

  return (
    <div className="flex flex-col gap-8">
      <div className="relative w-full h-48 md:h-64 rounded-xl overflow-hidden shadow-lg">
        {bannerImage && (
          <Image
            src={bannerImage.imageUrl}
            alt={bannerImage.description}
            data-ai-hint={bannerImage.imageHint}
            fill
            className="object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute bottom-0 left-0 p-6">
          <h1 className="text-3xl md:text-4xl font-bold text-white font-headline">
            Bem-vindos de volta!
          </h1>
          <p className="text-white/90 mt-2">
            Aqui está um resumo do seu mundo compartilhado.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium font-headline">
              Próximas Datas
            </CardTitle>
            <CalendarHeart className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                  <span className="text-sm font-bold">JUL</span>
                  <span className="text-xl font-bold">25</span>
                </div>
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-medium leading-none">
                    Aniversário de Namoro
                  </p>
                  <p className="text-sm text-muted-foreground">Em 10 dias</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                  <span className="text-sm font-bold">AGO</span>
                  <span className="text-xl font-bold">15</span>
                </div>
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-medium leading-none">
                    Viagem para a praia
                  </p>
                  <p className="text-sm text-muted-foreground">Em 31 dias</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium font-headline">
              Tarefas Pendentes
            </CardTitle>
            <ListTodo className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-2xl font-bold">3 tarefas</p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Comprar ingressos para o cinema</li>
                <li>Reservar o restaurante para sábado</li>
                <li>Planejar o fim de semana</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium font-headline">
              Mural do Casal
            </CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-start space-x-4">
              <Avatar>
                {userAvatar1 && <AvatarImage src={userAvatar1.imageUrl} />}
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
              <div className="space-y-2 flex-1">
                <p className="text-sm font-medium">Usuário 1</p>
                <p className="text-sm text-muted-foreground bg-accent p-3 rounded-lg">
                  Lembrando do nosso primeiro encontro hoje! Parece que foi
                  ontem. ❤️
                </p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                  <span className="flex items-center gap-1">
                    <Heart className="w-3 h-3" /> 5
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" /> 2
                  </span>
                  <span>há 2 horas</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-lg font-medium font-headline">
              Balanço Financeiro
            </CardTitle>
            <CardDescription>
              Despesas compartilhadas nos últimos 6 meses.
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <BarChart accessibilityLayer data={chartData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={(value) => value.slice(0, 3)}
                />
                 <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  tickFormatter={(value) => `R$${value/1000}k`}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Bar dataKey="expenses" fill="var(--color-expenses)" radius={8} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
