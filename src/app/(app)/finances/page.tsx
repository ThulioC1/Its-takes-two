'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, MoreHorizontal, TrendingUp, TrendingDown, CircleDollarSign } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from "@/components/ui/chart";
import { PieChart, Pie, Cell } from "recharts";
import { Badge } from "@/components/ui/badge";

const expenses = [
  { id: 1, category: 'Alimentação', value: 350.75, payer: 'Usuário 1', date: '2024-07-12' },
  { id: 2, category: 'Lazer', value: 120.00, payer: 'Usuário 2', date: '2024-07-10' },
  { id: 3, category: 'Moradia', value: 1800.00, payer: 'Ambos', date: '2024-07-05' },
  { id: 4, category: 'Transporte', value: 85.50, payer: 'Usuário 1', date: '2024-07-02' },
];

const chartData = [
  { name: 'Alimentação', value: 850.75, fill: 'var(--color-food)' },
  { name: 'Lazer', value: 420.00, fill: 'var(--color-leisure)' },
  { name: 'Moradia', value: 1800.00, fill: 'var(--color-housing)' },
  { name: 'Transporte', value: 215.50, fill: 'var(--color-transport)' },
  { name: 'Outros', value: 300.00, fill: 'var(--color-other)' },
];

const chartConfig = {
  value: { label: "Valor" },
  food: { label: "Alimentação", color: "hsl(var(--chart-1))" },
  leisure: { label: "Lazer", color: "hsl(var(--chart-2))" },
  housing: { label: "Moradia", color: "hsl(var(--chart-3))" },
  transport: { label: "Transporte", color: "hsl(var(--chart-4))" },
  other: { label: "Outros", color: "hsl(var(--chart-5))" },
} satisfies ChartConfig;

export default function FinancesPage() {
  const totalExpenses = expenses.reduce((acc, expense) => acc + expense.value, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">Finanças do Casal</h1>
          <p className="text-muted-foreground">Controle de despesas e metas financeiras compartilhadas.</p>
        </div>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Despesa
        </Button>
      </div>
      
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Despesas (Julho)</CardTitle>
                <TrendingDown className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">R$ {totalExpenses.toFixed(2).replace('.', ',')}</div>
                <p className="text-xs text-muted-foreground">-2.1% em relação ao mês passado</p>
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Pago por</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map(expense => (
                  <TableRow key={expense.id}>
                    <TableCell className="font-medium">{expense.category}</TableCell>
                    <TableCell>R$ {expense.value.toFixed(2).replace('.', ',')}</TableCell>
                    <TableCell>
                        <Badge variant="outline">{expense.payer}</Badge>
                    </TableCell>
                    <TableCell>{new Date(expense.date).toLocaleDateString('pt-BR')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Despesas por Categoria</CardTitle>
            <CardDescription>Julho 2024</CardDescription>
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
