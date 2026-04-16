
'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  ListTodo,
  CalendarHeart,
  Users,
  Heart,
  MessageSquare,
  Copy,
  Check,
  TrendingUp,
  Mail,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { format, differenceInDays, startOfToday, isValid, isPast, isToday } from 'date-fns';
import { useCollection, useFirestore, useUser, useMemoFirebase, useDoc } from "@/firebase";
import { doc, collection, writeBatch, getDoc, setDoc } from 'firebase/firestore';
import type { ToDoItem, ImportantDate, Post, Expense, UserProfile, LoveLetter } from "@/types";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';
import { Skeleton } from '@/components/ui/skeleton';

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
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  const isLinked = userProfile && user && userProfile.coupleId !== user.uid;

  const handleLinkCouple = async () => {
    if (!partnerCode.trim() || !user || !firestore) return;
    setIsLinking(true);
    const partnerId = partnerCode.trim();
    const partnerProfileRef = doc(firestore, 'users', partnerId);
    
    try {
      const partnerDoc = await getDoc(partnerProfileRef);
      if (!partnerDoc.exists()) throw new Error("Código do parceiro(a) não encontrado.");
      
      const newCoupleId = partnerDoc.data().coupleId;
      if (!newCoupleId) throw new Error("Parceiro(a) não possui um código de casal válido.");
      
      const batch = writeBatch(firestore);
      
      // Atualiza o perfil do usuário atual
      const currentUserProfileRef = doc(firestore, 'users', user.uid);
      batch.update(currentUserProfileRef, { coupleId: newCoupleId });
      
      // Atualiza o documento central do casal com ambos os IDs
      const coupleDocRef = doc(firestore, "couples", newCoupleId);
      batch.set(coupleDocRef, { 
        memberIds: [user.uid, partnerId],
        updatedAt: serverTimestamp() 
      }, { merge: true });
      
      await batch.commit();
      toast({ title: 'Casal vinculado!', description: 'Contas conectadas com sucesso.' });
    } catch (error: any) {
      const permissionError = new FirestorePermissionError({
          path: `users/${user.uid} or couples/${partnerCode.trim()}`,
          operation: 'write',
          requestResourceData: { coupleId: partnerCode.trim() },
      });
      errorEmitter.emit('permission-error', permissionError);
      toast({ variant: 'destructive', title: 'Erro ao vincular', description: error.message });
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
  
  if (isProfileLoading) return <Skeleton className="h-48 w-full rounded-xl" />;
  if (isLinked) return null;

  return (
    <Card className="md:col-span-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <CardHeader>
        <CardTitle>Conecte seu Par</CardTitle>
        <p className="text-muted-foreground text-sm">Vincule sua conta para compartilhar o mural, finanças e metas.</p>
      </CardHeader>
      <CardContent className="grid md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Seu Código</h3>
          <div className="flex gap-2">
            <Input readOnly value={userProfile?.coupleId || user?.uid || ''} className="bg-secondary/50 border-none" />
            <Button variant="secondary" size="icon" onClick={copyToClipboard} className="shrink-0">
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </div>
        <div className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Vincular Código</h3>
          <div className="flex gap-2">
            <Input placeholder="Insira o código aqui" value={partnerCode} onChange={(e) => setPartnerCode(e.target.value)} className="bg-secondary/50 border-none" />
            <Button onClick={handleLinkCouple} disabled={isLinking} className="shadow-sm">
              {isLinking ? 'Conectando...' : 'Vincular'}
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
  const isLinked = useMemo(() => userProfile && user && userProfile.coupleId !== user.uid, [user, userProfile]);

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

  const lettersRef = useMemoFirebase(() => {
    if (!firestore || !coupleId) return null;
    return collection(firestore, 'couples', coupleId, 'loveLetters');
  }, [firestore, coupleId]);
  const { data: letters } = useCollection<LoveLetter>(lettersRef);

  const daysTogether = useMemo(() => {
    if (!userProfile?.relationshipStartDate) return null;
    const today = startOfToday();
    const startDate = new Date(userProfile.relationshipStartDate + 'T00:00:00');
    if (isNaN(startDate.getTime())) return null;
    return Math.max(0, differenceInDays(today, startDate));
  }, [userProfile]);
  
  const upcomingDates = useMemo(() => {
    if (!dates) return [];
    const today = startOfToday();
    return dates
      .filter(d => d.status === 'active' || d.status === undefined)
      .map(d => {
        const baseDate = new Date(d.date + 'T00:00:00');
        if (!isValid(baseDate)) return null;
        let next = new Date(baseDate);
        if (d.repeat === 'yearly') {
            next.setFullYear(today.getFullYear());
            if (isPast(next) && !isToday(next)) next.setFullYear(today.getFullYear() + 1);
        } else if (d.repeat === 'monthly') {
            next = new Date(today.getFullYear(), today.getMonth(), baseDate.getDate());
            if (isPast(next) && !isToday(next)) next.setMonth(today.getMonth() + 1);
        }
        if (d.repeat === 'none' && isPast(baseDate) && !isToday(baseDate)) return null;
        return {...d, daysLeft: differenceInDays(next, today), nextOccurrence: next};
      })
      .filter((d): d is any => d !== null)
      .sort((a, b) => a.daysLeft - b.daysLeft)
      .slice(0, 3);
  }, [dates]);

  const pendingTodos = useMemo(() => (todos || []).filter(t => t.status !== 'Concluído'), [todos]);
  const latestPost = useMemo(() => (posts || []).sort((a, b) => (b.dateTime?.toDate?.().getTime() || 0) - (a.dateTime?.toDate?.().getTime() || 0))[0], [posts]);
  const latestLetter = useMemo(() => (letters || []).sort((a, b) => (b.dateTime?.toDate?.().getTime() || 0) - (a.dateTime?.toDate?.().getTime() || 0))[0], [letters]);
  
  const chartData = useMemo(() => {
    if (!expenses) return [];
    const data = expenses.reduce((acc, e) => {
        const month = format(e.date?.toDate() || new Date(), 'MMM');
        acc[month] = (acc[month] || 0) + e.value;
        return acc;
    }, {} as Record<string, number>);
    return Object.entries(data).map(([month, expenses]) => ({ month, expenses }));
  }, [expenses]);

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
        <div>
          <h1 className="text-4xl font-bold font-headline tracking-tight">Bom dia, {user?.displayName?.split(' ')[0]}</h1>
          <p className="text-muted-foreground mt-1">Aqui está o que está acontecendo no seu mundo compartilhado.</p>
        </div>
        {isLinked && daysTogether !== null && (
          <div className="flex items-center gap-3 bg-primary/10 px-4 py-2 rounded-full border border-primary/20">
            <Heart className="w-4 h-4 text-primary fill-primary" />
            <span className="text-sm font-semibold text-primary">{daysTogether} dias de jornada</span>
          </div>
        )}
      </div>

      <div className="bento-grid">
        <CoupleLinker />

        {/* Bento: Upcoming Dates (4 cols) */}
        <Link href="/dates" className="md:col-span-4 group h-full">
          <Card className="h-full group-hover:bg-accent/50">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Próximas Datas</CardTitle>
              <CalendarHeart className="w-5 h-5 text-primary" />
            </CardHeader>
            <CardContent className="space-y-4">
              {upcomingDates.length > 0 ? upcomingDates.map(d => (
                <div key={d.id} className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-secondary flex flex-col items-center justify-center font-bold text-xs shrink-0">
                    <span className="text-[10px] uppercase text-muted-foreground">{format(d.nextOccurrence, 'MMM')}</span>
                    <span>{format(d.nextOccurrence, 'dd')}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{d.title}</p>
                    <p className="text-xs text-muted-foreground">{d.daysLeft === 0 ? 'Hoje' : `Em ${d.daysLeft} dias`}</p>
                  </div>
                </div>
              )) : <p className="text-sm text-muted-foreground py-2">Tudo calmo por enquanto.</p>}
            </CardContent>
          </Card>
        </Link>

        {/* Bento: Latest Mural (4 cols) */}
        <Link href="/wall" className="md:col-span-4 group h-full">
          <Card className="h-full group-hover:bg-accent/50 overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Último no Mural</CardTitle>
              <Users className="w-5 h-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {latestPost ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6 border">
                      <AvatarImage src={latestPost.author.photoURL} />
                      <AvatarFallback>{latestPost.author.displayName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-medium">{latestPost.author.displayName}</span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">"{latestPost.text}"</p>
                  <div className="flex gap-3 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {latestPost.likes?.length || 0}</span>
                    <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {latestPost.comments || 0}</span>
                  </div>
                </div>
              ) : <p className="text-sm text-muted-foreground py-2">Nenhum post recente.</p>}
            </CardContent>
          </Card>
        </Link>

        {/* Bento: Love Letters (4 cols) */}
        <Link href="/messages" className="md:col-span-4 group h-full">
          <Card className="h-full group-hover:bg-accent/50 overflow-hidden border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Cartas de Amor</CardTitle>
              <Mail className="w-5 h-5 text-primary" />
            </CardHeader>
            <CardContent>
              {latestLetter ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                        <Heart className="size-3 text-primary fill-primary" />
                    </div>
                    <span className="text-xs font-medium">De: {latestLetter.author.displayName}</span>
                  </div>
                  <p className="text-sm text-muted-foreground italic line-clamp-2 leading-relaxed">
                    "{latestLetter.message}"
                  </p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                    {latestLetter.dateTime ? format(latestLetter.dateTime.toDate(), 'dd/MM/yy') : 'Recente'}
                  </p>
                </div>
              ) : <p className="text-sm text-muted-foreground py-2">O baú está esperando por você.</p>}
            </CardContent>
          </Card>
        </Link>

        {/* Bento: Quick Tasks (4 cols) */}
        <Link href="/todos" className="md:col-span-4 group h-full">
          <Card className="h-full group-hover:bg-accent/50">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Tarefas Ativas</CardTitle>
              <ListTodo className="w-5 h-5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-3xl font-bold tracking-tight">{pendingTodos.length}</p>
              <div className="space-y-2">
                {pendingTodos.slice(0, 2).map(t => (
                  <div key={t.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="w-1 h-1 rounded-full bg-primary" />
                    <span className="truncate">{t.title}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Link>
        </Link>

        {/* Bento: Finances Chart (8 cols) */}
        <Link href="/finances" className="md:col-span-8 group">
          <Card className="group-hover:border-primary/30 h-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Visão Financeira</CardTitle>
                <CardDescription>Resumo mensal de despesas</CardDescription>
              </div>
              <TrendingUp className="w-5 h-5 text-emerald-500" />
            </CardHeader>
            <CardContent className="h-[200px] mt-4">
              <ChartContainer config={chartConfig} className="h-full w-full">
                <BarChart data={chartData}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis hide />
                  <ChartTooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} content={<ChartTooltipContent />} />
                  <Bar dataKey="expenses" fill="var(--color-expenses)" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
