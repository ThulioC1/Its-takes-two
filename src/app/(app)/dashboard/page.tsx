'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ListTodo,
  CalendarHeart,
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
import { differenceInDays, format, parseISO } from 'date-fns';

const chartConfig = {
  expenses: {
    label: 'Despesas',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig;


interface DashboardProps {
  dates?: any[];
  todos?: any[];
  posts?: any[];
  expenses?: any[];
}

export default function DashboardPage({ dates: initialDates = [], todos: initialTodos = [], posts: initialPosts = [], expenses: initialExpenses = [] }: DashboardProps) {
  const [isClient, setIsClient] = useState(false);
  const [dates, setDates] = useState(initialDates);
  const [todos, setTodos] = useState(initialTodos);
  const [posts, setPosts] = useState(initialPosts);
  const [expenses, setExpenses] = useState(initialExpenses);
  
  useEffect(() => {
    setIsClient(true);
    // In a real app, you would fetch this data from your backend
    // For now, we simulate this by setting it from props
    setDates(initialDates);
    setTodos(initialTodos);
    setPosts(initialPosts);
    setExpenses(initialExpenses);
  }, [initialDates, initialTodos, initialPosts, initialExpenses]);

  const userAvatar1 = PlaceHolderImages.find((p) => p.id === 'user-avatar-1');
  const bannerImage = PlaceHolderImages.find((p) => p.id === 'couple-banner');

  const upcomingDates = dates
    .map(d => ({...d, daysLeft: differenceInDays(parseISO(d.date), new Date())}))
    .filter(d => d.daysLeft >= 0)
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 2);

  const pendingTodos = todos.filter(t => t.status !== 'Concluído');

  const latestPost = posts[0];
  
  const monthlyExpenses = expenses.reduce((acc, expense) => {
    const month = format(parseISO(expense.date), 'MMM');
    acc[month] = (acc[month] || 0) + expense.value;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(monthlyExpenses).map(([month, expenses]) => ({ month, expenses }));

  if (!isClient) {
    return null; // Or a loading skeleton
  }

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
        <Link href="/dates" className="flex">
            <Card className="lg:col-span-1 w-full hover:border-primary/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium font-headline">
                Próximas Datas
                </CardTitle>
                <CalendarHeart className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                {upcomingDates.length > 0 ? upcomingDates.map(d => (
                    <div key={d.id} className="flex items-center">
                    <div className="flex flex-col h-10 w-10 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                        <span className="text-xs font-bold uppercase">{format(parseISO(d.date), 'MMM')}</span>
                        <span className="text-lg font-bold">{format(parseISO(d.date), 'dd')}</span>
                    </div>
                    <div className="ml-4 space-y-1">
                        <p className="text-sm font-medium leading-none">
                        {d.title}
                        </p>
                        <p className="text-sm text-muted-foreground">
                            {d.daysLeft === 0 ? 'É hoje! 🎉' : `Em ${d.daysLeft} dias`}
                        </p>
                    </div>
                    </div>
                )) : (
                    <p className="text-sm text-muted-foreground">Nenhuma data próxima.</p>
                )}
                </div>
            </CardContent>
            </Card>
        </Link>

        <Link href="/todos" className="flex">
            <Card className="lg:col-span-1 w-full hover:border-primary/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium font-headline">
                Tarefas Pendentes
                </CardTitle>
                <ListTodo className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                <p className="text-2xl font-bold">{pendingTodos.length} {pendingTodos.length === 1 ? 'tarefa' : 'tarefas'}</p>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    {pendingTodos.slice(0,3).map(t => <li key={t.id}>{t.title}</li>)}
                </ul>
                </div>
            </CardContent>
            </Card>
        </Link>
        
        <Link href="/wall" className="flex">
            <Card className="lg:col-span-1 w-full hover:border-primary/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium font-headline">
                Mural do Casal
                </CardTitle>
                <Users className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                {latestPost ? (
                    <div className="flex items-start space-x-4">
                    <Avatar>
                        {userAvatar1 && <AvatarImage src={userAvatar1.imageUrl} />}
                        <AvatarFallback>{latestPost.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="space-y-2 flex-1 min-w-0">
                        <p className="text-sm font-medium">{latestPost.name}</p>
                        <p className="text-sm text-muted-foreground bg-accent p-3 rounded-lg truncate">
                        {latestPost.content}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                        <span className="flex items-center gap-1">
                            <Heart className="w-3 h-3" /> {latestPost.likes}
                        </span>
                        <span className="flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" /> {latestPost.comments}
                        </span>
                        <span>{latestPost.time}</span>
                        </div>
                    </div>
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground">Nenhuma publicação ainda.</p>
                )}
            </CardContent>
            </Card>
        </Link>
        
        <Link href="/finances" className="lg:col-span-3 flex">
            <Card className="w-full">
            <CardHeader>
                <CardTitle className="text-lg font-medium font-headline">
                Balanço Financeiro
                </CardTitle>
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
        </Link>
      </div>
    </div>
  );
}
