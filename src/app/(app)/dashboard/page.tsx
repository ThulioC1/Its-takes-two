'use client';
import { useState, useEffect, useMemo } from 'react';
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
  Copy,
  Check,
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
import { useCollection, useFirestore, useUser, useMemoFirebase, useDoc } from "@/firebase";
import { doc, collection, setDoc, query, where, writeBatch, getDoc } from 'firebase/firestore';
import type { ToDoItem, ImportantDate, Post, Expense, UserProfile } from "@/types";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';

const chartConfig = {
  expenses: {
    label: 'Despesas',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig;

function CoupleLinker() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [partnerCode, setPartnerCode] = useState('');
  const [isLinking, setIsLinking] = useState(false);
  const [copied, setCopied] = useState(false);

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);
  const { data: userProfile } = useDoc<UserProfile>(userProfileRef);

  const isLinked = userProfile && user && userProfile.coupleId !== user.uid;

  const handleLinkCouple = async () => {
    if (!partnerCode.trim() || !user || !firestore) return;
    
    setIsLinking(true);
    
    const partnerId = partnerCode.trim();
    const partnerProfileRef = doc(firestore, 'users', partnerId);
    
    try {
      const partnerDoc = await getDoc(partnerProfileRef);
      if (!partnerDoc.exists()) {
        throw new Error("Código do parceiro(a) não encontrado.");
      }

      // The new shared coupleId will be the partner's original coupleId
      const newCoupleId = partnerDoc.data().coupleId;
      if (!newCoupleId) {
        throw new Error("Parceiro(a) não possui um código de casal válido.");
      }
  
      // Use a batch to ensure atomicity
      const batch = writeBatch(firestore);
      
      const currentUserProfileRef = doc(firestore, 'users', user.uid);

      // Using set with merge will create the doc if it doesn't exist, or update it if it does.
      const currentUserData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        coupleId: newCoupleId,
      };
      batch.set(currentUserProfileRef, currentUserData, { merge: true });

      // Create the couple document to signify the link
      const coupleDocRef = doc(firestore, "couples", newCoupleId);
      batch.set(coupleDocRef, { memberIds: [user.uid, partnerId], createdAt: new Date() }, { merge: true });
  
      await batch.commit();
      
      toast({
        title: 'Casal vinculado com sucesso!',
        description: 'Agora vocês estão conectados. A página será recarregada.',
      });
  
      setTimeout(() => window.location.reload(), 2000);
  
    } catch (error: any) {
      console.error("Error linking couple:", error);
  
      const permissionError = new FirestorePermissionError({
          path: `users/${user.uid} or users/${partnerId}`,
          operation: 'write',
          requestResourceData: { coupleId: partnerCode.trim() },
      });
      errorEmitter.emit('permission-error', permissionError);
      
      toast({
        variant: 'destructive',
        title: 'Erro ao vincular',
        description: error.message || 'Não foi possível vincular as contas. Verifique o código e as permissões de segurança.',
      });
    } finally {
      setIsLinking(false);
    }
  };

  const copyToClipboard = () => {
    if (user?.uid) {
      const codeToCopy = userProfile?.coupleId || user.uid;
      navigator.clipboard.writeText(codeToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  
  if (isLinked) {
    return (
      <Alert>
        <Users className="h-4 w-4" />
        <AlertTitle>Vocês estão conectados!</AlertTitle>
        <AlertDescription>
          Seu mundo compartilhado está pronto.
        </AlertDescription>
      </Alert>
    );
  }

  // If user is not linked, show the linking interface.
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-headline">Conecte-se com seu par</CardTitle>
        <p className="text-muted-foreground text-sm">Para compartilhar o aplicativo, um de vocês deve compartilhar o código e o outro deve inseri-lo.</p>
      </CardHeader>
      <CardContent className="grid md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <h3 className="font-semibold">1. Compartilhe seu código</h3>
          <p className="text-sm text-muted-foreground">Envie o código abaixo para seu parceiro(a).</p>
          <div className="flex gap-2">
            <Input readOnly value={userProfile?.coupleId || user?.uid || ''} className="bg-muted" />
            <Button variant="outline" size="icon" onClick={copyToClipboard}>
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </div>
        <div className="space-y-3">
          <h3 className="font-semibold">2. Insira o código do seu par</h3>
          <p className="text-sm text-muted-foreground">Se você recebeu um código, insira-o aqui.</p>
          <div className="flex gap-2">
            <Input placeholder="Código do parceiro(a)" value={partnerCode} onChange={(e) => setPartnerCode(e.target.value)} />
            <Button onClick={handleLinkCouple} disabled={isLinking}>
              {isLinking ? 'Vinculando...' : 'Vincular'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


export default function DashboardPage() {
  const firestore = useFirestore();
  const { user } = useUser();

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile } = useDoc<UserProfile>(userProfileRef);
  const coupleId = userProfile?.coupleId;

  const datesRef = useMemoFirebase(() => {
    if (!firestore || !coupleId) return null;
    return collection(firestore, 'couples', coupleId, 'dates');
  }, [firestore, coupleId]);
  const { data: dates } = useCollection<ImportantDate>(datesRef);

  const todosRef = useMemoFirebase(() => {
    if (!firestore || !coupleId) return null;
    return collection(firestore, 'couples', coupleId, 'todos');
  }, [firestore, coupleId]);
  const { data: todos } = useCollection<ToDoItem>(todosRef);

  const postsRef = useMemoFirebase(() => {
    if (!firestore || !coupleId) return null;
    return collection(firestore, 'couples', coupleId, 'posts');
  }, [firestore, coupleId]);
  const { data: posts } = useCollection<Post>(postsRef);

  const expensesRef = useMemoFirebase(() => {
    if (!firestore || !coupleId) return null;
    return collection(firestore, 'couples', coupleId, 'expenses');
  }, [firestore, coupleId]);
  const { data: expenses } = useCollection<Expense>(expensesRef);


  const userAvatar1 = PlaceHolderImages.find((p) => p.id === 'user-avatar-1');
  const bannerImage = PlaceHolderImages.find((p) => p.id === 'couple-banner');

  const upcomingDates = useMemo(() => {
    if (!dates) return [];
    return dates
      .map(d => ({...d, daysLeft: differenceInDays(parseISO(d.date), new Date())}))
      .filter(d => d.daysLeft >= 0)
      .sort((a, b) => a.daysLeft - b.daysLeft)
      .slice(0, 2);
  }, [dates]);

  const pendingTodos = useMemo(() => {
    if (!todos) return [];
    return todos.filter(t => t.status !== 'Concluído');
  }, [todos]);

  const latestPost = useMemo(() => {
    if (!posts || posts.length === 0) return null;
    // Firestore Timestamps need to be converted for sorting
    const sorted = [...posts].sort((a, b) => {
        const timeA = a.dateTime?.toDate?.()?.getTime() || 0;
        const timeB = b.dateTime?.toDate?.()?.getTime() || 0;
        return timeB - timeA;
    });
    return sorted[0];
  }, [posts]);
  
  const chartData = useMemo(() => {
    if (!expenses) return [];
    const monthlyExpenses = expenses.reduce((acc, expense) => {
        // Ensure date is a Timestamp and convert it
        const date = expense.date?.toDate ? expense.date.toDate() : new Date();
        const month = format(date, 'MMM');
        acc[month] = (acc[month] || 0) + expense.value;
        return acc;
    }, {} as Record<string, number>);
    return Object.entries(monthlyExpenses).map(([month, expenses]) => ({ month, expenses }));
  }, [expenses]);


  return (
    <div className="flex flex-col gap-8">
       <CoupleLinker />

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
                {latestPost && latestPost.dateTime ? (
                    <div className="flex items-start space-x-4">
                    <Avatar>
                        <AvatarFallback>{latestPost.author?.displayName?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="space-y-2 flex-1 min-w-0">
                        <p className="text-sm font-medium">{latestPost.author?.displayName}</p>
                        <p className="text-sm text-muted-foreground bg-accent p-3 rounded-lg truncate">
                        {latestPost.text}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                        <span className="flex items-center gap-1">
                            <Heart className="w-3 h-3" /> {latestPost.likes?.length || 0}
                        </span>
                        <span className="flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" /> {latestPost.comments || 0}
                        </span>
                        <span>{latestPost.dateTime ? format(latestPost.dateTime.toDate(), 'dd/MM/yy') : ''}</span>
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
