'use client';
import { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, MoreHorizontal, TrendingUp, TrendingDown, CircleDollarSign } from "lucide-react";
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
import { collection, doc, addDoc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import type { Expense } from "@/types";

interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  coupleId: string;
}

const categories = ['Alimentação', 'Lazer', 'Moradia', 'Transporte', 'Outros'];

const chartConfig = {
  value: { label: "Valor" },
  'Alimentação': { label: "Alimentação", color: "hsl(var(--chart-1))" },
  'Lazer': { label: "Lazer", color: "hsl(var(--chart-2))" },
  'Moradia': { label: "Moradia", color: "hsl(var(--chart-3))" },
  'Transporte': { label: "Transporte", color: "hsl(var(--chart-4))" },
  'Outros': { label: "Outros", color: "hsl(var(--chart-5))" },
} satisfies ChartConfig;

function ExpenseForm({ expense, onSave, onCancel }: { expense?: Expense; onSave: (data: Partial<Expense>) => void; onCancel: () => void; }) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: Partial<Expense> = {
      category: formData.get('category') as string,
      value: parseFloat(formData.get('value') as string),
      payer: formData.get('payer') as string,
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
        <Input id="value" name="value" type="number" step="0.01" placeholder="99,99" className="col-span-3" defaultValue={expense?.value} required />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="payer" className="text-right">Pago por</Label>
         <Select name="payer" defaultValue={expense?.payer} required>
          <SelectTrigger className="col-span-3">
            <SelectValue placeholder="Selecione quem pagou" />
          </SelectTrigger>
          <SelectContent>
            {/* TODO: Make this dynamic based on couple members */}
            <SelectItem value="Usuário 1">Usuário 1</SelectItem>
            <SelectItem value="Usuário 2">Usuário 2</SelectItem>
            <SelectItem value="Ambos">Ambos</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button type="submit">Salvar</Button>
      </DialogFooter>
    </form>
  );
}

export default function FinancesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const firestore = useFirestore();
  const { user } = useUser();

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile } = useDoc<UserProfile>(userProfileRef);
  const coupleId = userProfile?.coupleId;

  const expensesRef = useMemoFirebase(() => {
    if (!firestore || !coupleId) return null;
    return collection(firestore, 'couples', coupleId, 'expenses');
  }, [firestore, coupleId]);

  const { data: expenses, isLoading } = useCollection<Expense>(expensesRef as any);

  const sortedExpenses = useMemo(() => {
    if (!expenses) return [];
    return [...expenses].sort((a, b) => b.date.toDate().getTime() - a.date.toDate().getTime());
  }, [expenses]);

  const totalExpenses = useMemo(() => sortedExpenses.reduce((acc, expense) => acc + expense.value, 0), [sortedExpenses]);

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
      fill: `var(--color-${name.toLowerCase().replace('ã', 'a')})`
    }));
  }, [sortedExpenses]);
  
  const handleOpenDialog = (expense: Expense | null = null) => {
    setEditingExpense(expense);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setEditingExpense(null);
    setIsDialogOpen(false);
  }
  
  const handleSaveExpense = async (data: Partial<Expense>) => {
    if (!expensesRef) return;
    if (editingExpense) {
      const expenseDoc = doc(expensesRef, editingExpense.id);
      await updateDoc(expenseDoc, data);
    } else {
      await addDoc(expensesRef, { ...data, date: serverTimestamp() });
    }
    handleCloseDialog();
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
          <p className="text-muted-foreground">Controle de despesas e metas financeiras compartilhadas.</p>
        </div>
        <Button className="w-full sm:w-auto" onClick={() => handleOpenDialog()} disabled={!coupleId}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar Despesa
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingExpense ? 'Editar Despesa' : 'Nova Despesa'}</DialogTitle>
            </DialogHeader>
            <ExpenseForm 
              expense={editingExpense ?? undefined} 
              onSave={handleSaveExpense}
              onCancel={handleCloseDialog}
            />
          </DialogContent>
        </Dialog>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
                <CardTitle className="text-sm font-medium">Meta de Economia</CardTitle>
                <TrendingUp className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">R$ 5.000,00</div>
                <p className="text-xs text-muted-foreground">75% concluído</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Quem pagou mais</CardTitle>
                 <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">Usuário 1</div>
                <p className="text-xs text-muted-foreground">R$ 1.200,25 a mais</p>
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
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead className="hidden sm:table-cell">Pago por</TableHead>
                    <TableHead className="hidden md:table-cell">Data</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sortedExpenses.map(expense => (
                    <TableRow key={expense.id}>
                        <TableCell className="font-medium">{expense.category}</TableCell>
                        <TableCell>R$ {expense.value.toFixed(2).replace('.', ',')}</TableCell>
                        <TableCell className="hidden sm:table-cell">
                            <Badge variant="outline">{expense.payer}</Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">{expense.date.toDate().toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell className="text-right">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Abrir menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleOpenDialog(expense)}>Editar</DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(expense.id)}>Deletar</DropdownMenuItem>
                            </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Despesas por Categoria</CardTitle>
            <CardDescription>Mês Atual</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
