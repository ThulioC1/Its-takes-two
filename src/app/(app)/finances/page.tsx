'use client';
import { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, MoreHorizontal, TrendingDown, CircleDollarSign } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from "@/components/ui/chart";
import { PieChart, Pie, Cell } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCollection, useFirestore, useUser, useMemoFirebase, useDoc } from "@/firebase";
import { collection, doc, addDoc, updateDoc, deleteDoc, serverTimestamp, getDocs, getDoc } from "firebase/firestore";
import type { Expense, UserProfile, CoupleDetails } from "@/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import React from 'react';

const categories = ['Alimentação', 'Lazer', 'Moradia', 'Transporte', 'Outros'];

const chartConfig = {
  value: { label: "Valor" },
  'Alimentação': { label: "Alimentação", color: "hsl(var(--chart-1))" },
  'Lazer': { label: "Lazer", color: "hsl(var(--chart-2))" },
  'Moradia': { label: "Moradia", color: "hsl(var(--chart-3))" },
  'Transporte': { label: "Transporte", color: "hsl(var(--chart-4))" },
  'Outros': { label: "Outros", color: "hsl(var(--chart-5))" },
} satisfies ChartConfig;

function ExpenseForm({ expense, onSave, onCancel, coupleMembers }: { expense?: Expense | null; onSave: (data: Partial<Expense>) => void; onCancel: () => void; coupleMembers: UserProfile[] }) {
  
  const [payer, setPayer] = useState(() => {
    if (!expense?.payer) return '';
    const member = coupleMembers.find(m => m.uid === expense.payer);
    return member ? member.displayName : expense.payer;
  });

  useEffect(() => {
    if (expense?.payer) {
      const member = coupleMembers.find(m => m.uid === expense.payer);
      setPayer(member ? member.displayName : expense.payer);
    } else {
      setPayer('');
    }
  }, [expense, coupleMembers]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const valueInput = formData.get('value') as string;
    const data: Partial<Expense> = {
      category: formData.get('category') as string,
      value: valueInput ? parseFloat(valueInput.replace(',', '.')) : 0,
      payer: payer,
      observation: formData.get('observation') as string,
    };
    onSave(data);
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="category" className="text-right">Categoria</Label>
         <Select name="category" defaultValue={expense?.category} required>
          <SelectTrigger className="col-span-3">
            <SelectValue placeholder="Selecione a categoria" />
          </SelectTrigger>
          <SelectContent>
            {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
       <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="value" className="text-right">Valor (R$)</Label>
        <Input id="value" name="value" type="text" placeholder="99,99" className="col-span-3" defaultValue={expense?.value?.toString().replace('.', ',')} required />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="payer" className="text-right">Pago por</Label>
        <Input id="payer" name="payer" placeholder="Nome de quem pagou" className="col-span-3" value={payer} onChange={(e) => setPayer(e.target.value)} required />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="observation" className="text-right">Observação</Label>
          <Input id="observation" name="observation" className="col-span-3" defaultValue={expense?.observation} />
      </div>
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button type="submit">Salvar</Button>
      </DialogFooter>
    </form>
  );
}

export default function FinancesPage() {
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [coupleMembers, setCoupleMembers] = useState<UserProfile[]>([]);
  
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
  
   useEffect(() => {
    const fetchCoupleMembers = async () => {
        if (!firestore || !coupleId) return;

        const coupleDocSnap = await getDoc(coupleDocRef as any);

        if (coupleDocSnap.exists()) {
            const memberIds = coupleDocSnap.data()?.memberIds || [];
            if (memberIds.length > 0) {
              const memberPromises = memberIds.map((id: string) => getDoc(doc(firestore, 'users', id)));
              const memberDocs = await Promise.all(memberPromises);
              const members = memberDocs.map(snap => snap.data() as UserProfile).filter(Boolean);
              setCoupleMembers(members);
            } else if (userProfile) {
               setCoupleMembers([userProfile]);
            }
        } else if (userProfile) {
            setCoupleMembers([userProfile]);
        }
    };

    fetchCoupleMembers();
  }, [firestore, coupleId, userProfile, coupleDocRef]);
  
  const expensesRef = useMemoFirebase(() => {
    if (!firestore || !coupleId) return null;
    return collection(firestore, 'couples', coupleId, 'expenses');
  }, [firestore, coupleId]);

  const { data: expenses, isLoading } = useCollection<Expense>(expensesRef);

  const coupleMembersMap = useMemo(() => {
    return coupleMembers.reduce((acc, member) => {
      acc[member.uid] = member.displayName;
      return acc;
    }, {} as Record<string, string>);
  }, [coupleMembers]);


  const sortedExpenses = useMemo(() => {
    if (!expenses) return [];
    return [...expenses].sort((a, b) => {
        const timeA = a.date?.toDate?.()?.getTime() || 0;
        const timeB = b.date?.toDate?.()?.getTime() || 0;
        return timeB - timeA;
    });
  }, [expenses]);

  const totalExpenses = useMemo(() => sortedExpenses.reduce((acc, expense) => acc + expense.value, 0), [sortedExpenses]);

  const expensesByPayer = useMemo(() => {
    return sortedExpenses.reduce((acc, expense) => {
      const payerIdOrName = expense.payer;
      acc[payerIdOrName] = (acc[payerIdOrName] || 0) + expense.value;
      return acc;
    }, {} as Record<string, number>);
  }, [sortedExpenses]);

  const topPayer = useMemo(() => {
    if (Object.keys(expensesByPayer).length === 0) return { name: 'N/A', amount: 0 };
    const topPayerIdOrName = Object.keys(expensesByPayer).reduce((a, b) => expensesByPayer[a] > expensesByPayer[b] ? a : b);
    const payerName = coupleMembersMap[topPayerIdOrName] || topPayerIdOrName;
    return {
      name: payerName,
      amount: expensesByPayer[topPayerIdOrName],
    };
  }, [expensesByPayer, coupleMembersMap]);


  const chartData = useMemo(() => {
    if (!sortedExpenses || sortedExpenses.length === 0) return [];
    return Object.entries(
      sortedExpenses.reduce((acc, { category, value }) => {
        acc[category] = (acc[category] || 0) + value;
        return acc;
      }, {} as {[key: string]: number})
    ).map(([name, value]) => ({
      name,
      value,
      fill: chartConfig[name as keyof typeof chartConfig]?.color || chartConfig.Outros.color,
    }));
  }, [sortedExpenses]);
  
  const handleOpenExpenseDialog = (expense: Expense | null = null) => {
    setEditingExpense(expense);
    setIsExpenseDialogOpen(true);
  };
  
  const handleCloseExpenseDialog = () => {
    setEditingExpense(null);
    setIsExpenseDialogOpen(false);
  }
  
  const handleSaveExpense = async (data: Partial<Expense>) => {
    if (!expensesRef || !user || !user.displayName) return;
    
    // Check if payer name matches a couple member, if so, use UID
    const payerName = data.payer || '';
    const payingMember = coupleMembers.find(m => m.displayName.toLowerCase() === payerName.toLowerCase());
    const payerValue = payingMember ? payingMember.uid : payerName;

    if (editingExpense) {
      const expenseDoc = doc(expensesRef, editingExpense.id);
      await updateDoc(expenseDoc, { ...data, payer: payerValue });
    } else {
      await addDoc(expensesRef, { 
        ...data, 
        payer: payerValue,
        date: serverTimestamp(),
        author: {
          uid: user.uid,
          displayName: user.displayName,
          photoURL: user.photoURL || null,
          gender: userProfile?.gender || 'Prefiro não informar'
        }
      });
    }
    handleCloseExpenseDialog();
  };

  const handleDelete = async (id: string) => {
    if (!expensesRef) return;
    const expenseDoc = doc(expensesRef, id);
    await deleteDoc(expenseDoc);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">Finanças do Casal</h1>
          <p className="text-muted-foreground">Controle de despesas compartilhadas.</p>
        </div>
        <Button className="w-full sm:w-auto" onClick={() => handleOpenExpenseDialog(null)} disabled={!coupleId}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar Despesa
        </Button>
      </div>

      <Dialog open={isExpenseDialogOpen} onOpenChange={setIsExpenseDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingExpense ? 'Editar Despesa' : 'Nova Despesa'}</DialogTitle>
            </DialogHeader>
            <ExpenseForm 
              expense={editingExpense} 
              onSave={handleSaveExpense}
              onCancel={handleCloseExpenseDialog}
              coupleMembers={coupleMembers || []}
            />
          </DialogContent>
        </Dialog>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Despesas (Mês)</CardTitle>
                <TrendingDown className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">R$ {totalExpenses.toFixed(2).replace('.', ',')}</div>
                <p className="text-xs text-muted-foreground">Atualizado agora</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Quem pagou mais</CardTitle>
                 <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{topPayer.name}</div>
                <p className="text-xs text-muted-foreground">R$ {topPayer.amount.toFixed(2).replace('.',',')} no total</p>
            </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Despesas Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading && <p className="text-center text-muted-foreground py-4">Carregando despesas...</p>}
            {!isLoading && sortedExpenses?.length === 0 && <p className="text-center text-muted-foreground py-4">Nenhuma despesa adicionada.</p>}
            {sortedExpenses.length > 0 && (
                <TooltipProvider>
                <Table>
                  <TableHeader>
                      <TableRow>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead className="hidden sm:table-cell">Pago por</TableHead>
                      <TableHead className="hidden md:table-cell">Data</TableHead>
                      <TableHead>Autor</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {sortedExpenses.map(expense => (
                      <TableRow key={expense.id}>
                          <TableCell className="font-medium">{expense.category}</TableCell>
                          <TableCell>R$ {expense.value.toFixed(2).replace('.', ',')}</TableCell>
                          <TableCell className="hidden sm:table-cell">
                              <Badge variant="outline">{coupleMembersMap[expense.payer] || expense.payer}</Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">{expense.date ? expense.date.toDate().toLocaleDateString('pt-BR') : ''}</TableCell>
                          <TableCell>
                            {expense.author && expense.author.displayName && (
                                <Tooltip>
                                    <TooltipTrigger>
                                        <Avatar className="h-6 w-6">
                                            <AvatarFallback className="text-xs">{expense.author.displayName?.charAt(0) || '?'}</AvatarFallback>
                                        </Avatar>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Adicionado por: {expense.author.displayName}</p>
                                    </TooltipContent>
                                </Tooltip>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                          <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Abrir menu</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                  <DropdownMenuItem onSelect={() => handleOpenExpenseDialog(expense)}>Editar</DropdownMenuItem>
                                  <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(expense.id)}>Deletar</DropdownMenuItem>
                              </DropdownMenuContent>
                              </DropdownMenu>
                          </TableCell>
                      </TableRow>
                      ))}
                  </TableBody>
                </Table>
                </TooltipProvider>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Despesas por Categoria</CardTitle>
            <CardDescription>Mês Atual</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
             {chartData.length > 0 ? (
                <ChartContainer config={chartConfig} className="mx-auto aspect-square h-[250px]">
                    <PieChart>
                        <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                        <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={60} strokeWidth={5}>
                            {chartData.map((entry) => (
                                <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                            ))}
                        </Pie>
                    </PieChart>
                </ChartContainer>
             ) : (
                <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                    <p>Sem dados para exibir o gráfico.</p>
                </div>
             )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
