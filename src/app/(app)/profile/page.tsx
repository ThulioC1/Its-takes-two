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
import { doc, updateDoc, writeBatch, deleteDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { updateProfile } from 'firebase/auth';
import type { UserProfile, CoupleDetails } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const profileSchema = z.object({
  displayName: z.string().min(2, "O nome deve ter pelo menos 2 caracteres."),
  photoURL: z.string().url("Por favor, insira uma URL válida.").or(z.literal('')),
  gender: z.enum(['Masculino', 'Feminino', 'Prefiro não informar']),
  relationshipStartDate: z.string().optional(),
});

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isUnlinking, setIsUnlinking] = useState(false);

  const userProfileRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);
  const { data: userProfile } = useDoc<UserProfile>(userProfileRef);

  const coupleId = userProfile?.coupleId;
  const isLinked = userProfile && user && userProfile.coupleId !== user.uid;

  const coupleDocRef = useMemoFirebase(() => {
    if (!firestore || !coupleId) return null;
    return doc(firestore, 'couples', coupleId);
  }, [firestore, coupleId]);
  const { data: coupleDetails } = useDoc<CoupleDetails>(coupleDocRef);

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: '',
      photoURL: '',
      gender: 'Prefiro não informar',
      relationshipStartDate: '',
    },
  });

  useEffect(() => {
    if (userProfile) {
      form.reset({
        displayName: userProfile?.displayName || user?.displayName || '',
        photoURL: userProfile?.photoURL || user?.photoURL || '',
        gender: userProfile?.gender || 'Prefiro não informar',
        relationshipStartDate: userProfile?.relationshipStartDate || '',
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
      const batch = writeBatch(firestore);
      
      const userDocRef = doc(firestore, 'users', user.uid);
      batch.update(userDocRef, {
        displayName: values.displayName,
        photoURL: values.photoURL,
        gender: values.gender,
        relationshipStartDate: values.relationshipStartDate || null,
      });
      
      await batch.commit();
      
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

  const handleUnlink = async () => {
    if (!isLinked || !user || !firestore || !coupleId || !coupleDetails) return;

    setIsUnlinking(true);
    try {
      const batch = writeBatch(firestore);

      // Reset current user's coupleId
      const currentUserRef = doc(firestore, 'users', user.uid);
      batch.update(currentUserRef, { coupleId: user.uid });

      // Find and reset partner's coupleId
      const partnerId = coupleDetails.memberIds.find(id => id !== user.uid);
      if (partnerId) {
        const partnerRef = doc(firestore, 'users', partnerId);
        batch.update(partnerRef, { coupleId: partnerId });
      }

      // Delete the couple document
      const coupleDocToDeleteRef = doc(firestore, 'couples', coupleId);
      batch.delete(coupleDocToDeleteRef);

      await batch.commit();

      toast({
        title: "Contas desvinculadas",
        description: "A conexão foi removida.",
      });

    } catch (error: any) {
      console.error("Error unlinking accounts: ", error);
      toast({
        variant: "destructive",
        title: "Erro ao desvincular",
        description: error.message || "Não foi possível remover a conexão.",
      });
    } finally {
        setIsUnlinking(false);
    }
  }
  
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
                     <Select onValueChange={field.onChange} value={field.value}>
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
               <FormField
                control={form.control}
                name="relationshipStartDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Início do Relacionamento</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
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
      {isLinked && (
          <Card className="max-w-2xl border-destructive">
            <CardHeader>
                <CardTitle>Zona de Perigo</CardTitle>
                <CardDescription>Ações irreversíveis que afetam sua conta de casal.</CardDescription>
            </CardHeader>
            <CardContent>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" disabled={isUnlinking}>
                            {isUnlinking ? 'Desvinculando...' : 'Desvincular do parceiro(a)'}
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Esta ação é irreversível. Isso irá desvincular permanentemente sua conta da do seu parceiro e deletar todos os dados compartilhados (tarefas, finanças, memórias, etc.).
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={handleUnlink}>Sim, desvincular</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
                <p className="text-sm text-muted-foreground mt-2">
                    Ao desvincular, todos os dados compartilhados serão perdidos. Suas contas individuais serão preservadas, mas a conexão entre elas será removida.
                </p>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
