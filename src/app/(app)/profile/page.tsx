'use client';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useFirestore, useUser, useDoc, useMemoFirebase } from "@/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { updateProfile } from 'firebase/auth';
import type { UserProfile } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const profileSchema = z.object({
  displayName: z.string().min(2, "O nome deve ter pelo menos 2 caracteres."),
  photoURL: z.string().url("Por favor, insira uma URL válida.").or(z.literal('')),
  gender: z.enum(['Masculino', 'Feminino', 'Prefiro não informar']),
});

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const userProfileRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);
  const { data: userProfile } = useDoc<UserProfile>(userProfileRef);

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: '',
      photoURL: '',
      gender: 'Prefiro não informar',
    },
  });

  useEffect(() => {
    if (userProfile) {
      form.reset({
        displayName: userProfile?.displayName || user?.displayName || '',
        photoURL: userProfile?.photoURL || user?.photoURL || '',
        gender: userProfile?.gender || 'Prefiro não informar',
      });
    }
  }, [user, userProfile, form]);


  const onSubmit = async (values: z.infer<typeof profileSchema>) => {
    if (!user || !firestore) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Usuário ou serviço de banco de dados não encontrado.",
      });
      return;
    }

    try {
      // Update Firebase Auth profile
      await updateProfile(user, {
        displayName: values.displayName,
        photoURL: values.photoURL,
      });

      // Update Firestore user profile document
      const userDocRef = doc(firestore, 'users', user.uid);
      await updateDoc(userDocRef, {
        displayName: values.displayName,
        photoURL: values.photoURL,
        gender: values.gender,
      });
      
      toast({
        title: "Perfil atualizado!",
        description: "Suas informações foram salvas com sucesso.",
      });

    } catch (error: any) {
      console.error("Error updating profile: ", error);
      toast({
        variant: "destructive",
        title: "Erro ao atualizar perfil",
        description: error.message || "Não foi possível salvar suas alterações.",
      });
    }
  };
  
  const photoUrl = form.watch('photoURL');

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold font-headline">Meu Perfil</h1>
        <p className="text-muted-foreground">Gerencie suas informações pessoais.</p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Editar Perfil</CardTitle>
          <CardDescription>Mantenha seus dados atualizados para seu par.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="flex items-center gap-4">
                    <Avatar className="h-20 w-20">
                        <AvatarImage src={photoUrl || user?.photoURL || ''} alt={form.getValues('displayName')} />
                        <AvatarFallback>{form.getValues('displayName')?.charAt(0) || user?.displayName?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    <p className="text-sm text-muted-foreground">
                        A foto é atualizada a partir da URL fornecida abaixo.
                    </p>
                </div>

              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Seu nome" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="photoURL"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL da Foto</FormLabel>
                    <FormControl>
                      <Input placeholder="https://exemplo.com/sua-foto.jpg" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gênero</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione seu gênero" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Masculino">Masculino</SelectItem>
                        <SelectItem value="Feminino">Feminino</SelectItem>
                        <SelectItem value="Prefiro não informar">Prefiro não informar</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
