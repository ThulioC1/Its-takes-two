
'use client';

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Beer, Trophy, History as HistoryIcon, Sparkles, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useFirestore, useUser, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, setDoc, addDoc, serverTimestamp, increment, updateDoc, query, where } from 'firebase/firestore';
import type { LastGulpGame, LastGulpHistory, UserProfile } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

export default function LastGulpPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  // 1. Obter o perfil do usuário logado
  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);
  const coupleId = userProfile?.coupleId;

  // 2. Escutar em tempo real todos os usuários do casal
  const membersQuery = useMemoFirebase(() => {
    if (!firestore || !coupleId) return null;
    return query(collection(firestore, 'users'), where('coupleId', '==', coupleId));
  }, [firestore, coupleId]);
  const { data: membersData, isLoading: isMembersLoading } = useCollection<UserProfile>(membersQuery);

  // 3. Mapa de membros resiliente (ID -> Perfil)
  const coupleMembers = useMemo(() => {
    const map: Record<string, UserProfile> = {};
    
    // Adiciona membros da query global
    if (membersData) {
      membersData.forEach(m => { 
        map[m.id] = m;
        if (m.uid) map[m.uid] = m;
      });
    }
    
    // Garante que o perfil atual esteja no mapa (prioridade)
    if (userProfile && user) {
      map[user.uid] = userProfile;
    }
    
    return map;
  }, [membersData, userProfile, user]);

  // 4. Estado do Jogo e Histórico
  const gameStateRef = useMemoFirebase(() => {
    if (!firestore || !coupleId) return null;
    return doc(firestore, 'couples', coupleId, 'lastGulpGame', 'state');
  }, [firestore, coupleId]);
  const { data: gameState } = useDoc<LastGulpGame>(gameStateRef);

  const historyRef = useMemoFirebase(() => {
    if (!firestore || !coupleId) return null;
    return collection(firestore, 'couples', coupleId, 'lastGulpGame', 'state', 'history');
  }, [firestore, coupleId]);
  const { data: history } = useCollection<LastGulpHistory>(historyRef);

  const sortedHistory = useMemo(() => {
    if (!history) return [];
    return [...history].sort((a, b) => (b.timestamp?.toDate?.().getTime() || 0) - (a.timestamp?.toDate?.().getTime() || 0)).slice(0, 10);
  }, [history]);

  const handleGulp = () => {
    if (!user || !gameStateRef || !historyRef || !firestore || !userProfile) return;

    const baseData = {
      lastDrinkerId: user.uid,
      lastDrinkerName: userProfile.displayName || user.displayName || 'Parceiro',
      timestamp: serverTimestamp(),
    };

    setDoc(gameStateRef, baseData, { merge: true })
      .catch(async () => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: gameStateRef.path,
          operation: 'write',
          requestResourceData: baseData
        } satisfies SecurityRuleContext));
      });

    updateDoc(gameStateRef, {
      [`scores.${user.uid}`]: increment(1)
    }).catch(async (error) => {
        if (error.code === 'not-found') {
            setDoc(gameStateRef, {
              ...baseData,
              scores: { [user.uid]: 1 }
            }, { merge: true });
        }
    });

    const historyData = {
      drinkerId: user.uid,
      drinkerName: userProfile.displayName || user.displayName || 'Parceiro',
      timestamp: serverTimestamp()
    };

    addDoc(historyRef, historyData);
  };

  const isLastDrinker = gameState?.lastDrinkerId === user?.uid;
  const lastDrinkerProfile = gameState?.lastDrinkerId ? coupleMembers[gameState.lastDrinkerId] : null;
  const isDataLoading = isProfileLoading || isMembersLoading;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="text-center space-y-2 animate-in fade-in slide-in-from-top-4 duration-700">
        <h1 className="text-4xl font-bold font-headline text-primary">O Último Gole</h1>
        <p className="text-muted-foreground italic">A prova definitiva de quem deu o último gole.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 items-start">
        {/* Card Principal */}
        <Card className="relative overflow-hidden border-primary/20 bg-card/40 backdrop-blur-xl shadow-2xl md:sticky md:top-24">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-primary" />
          <CardHeader className="text-center">
            <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Quem bebeu por último?</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-8 py-8">
            <div className="relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={gameState?.lastDrinkerId || 'none'}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="relative z-10"
                >
                  <div className={`size-56 rounded-full border-4 flex items-center justify-center bg-primary/5 transition-all duration-500 overflow-hidden ${gameState?.lastDrinkerId ? 'border-primary shadow-[0_0_30px_rgba(var(--primary),0.4)]' : 'border-primary/20'}`}>
                    {lastDrinkerProfile ? (
                      <Avatar className="size-full rounded-none">
                        <AvatarImage src={lastDrinkerProfile.photoURL || undefined} className="object-cover" />
                        <AvatarFallback className="bg-transparent flex flex-col items-center justify-center text-primary text-4xl font-bold">
                          {lastDrinkerProfile.displayName?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-center p-4">
                        {gameState?.lastDrinkerId && isDataLoading ? (
                             <div className="animate-pulse flex flex-col items-center">
                                <User className="size-16 mb-2 text-primary/20" />
                                <p className="text-[10px] uppercase font-bold text-muted-foreground">Buscando Perfil...</p>
                             </div>
                        ) : gameState?.lastDrinkerId ? (
                            <div className="flex flex-col items-center">
                                <div className="size-20 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                                    <span className="text-3xl font-bold text-primary">{gameState.lastDrinkerName?.charAt(0)}</span>
                                </div>
                                <p className="text-[10px] uppercase font-bold text-muted-foreground">{gameState.lastDrinkerName}</p>
                            </div>
                        ) : (
                            <>
                                <Beer className="size-24 text-muted-foreground/20" />
                                <p className="text-[10px] uppercase font-bold text-muted-foreground mt-2">Aguardando Primeiro Gole</p>
                            </>
                        )}
                      </div>
                    )}
                  </div>
                  {isLastDrinker && (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                      className="absolute -inset-6 border-2 border-dashed border-primary/40 rounded-full"
                    />
                  )}
                </motion.div>
              </AnimatePresence>
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 z-20">
                <Badge className="bg-primary text-primary-foreground shadow-lg px-6 py-1.5 text-[10px] font-bold uppercase tracking-widest border-none whitespace-nowrap rounded-full">
                  {gameState ? (isLastDrinker ? 'VOCÊ BEBEU!' : `${lastDrinkerProfile?.displayName?.split(' ')[0] || gameState.lastDrinkerName?.split(' ')[0]} BEBEU!`) : 'TOQUE PARA COMEÇAR'}
                </Badge>
              </div>
            </div>

            <div className="text-center space-y-1 mt-4">
              <p className="text-sm text-muted-foreground font-medium h-5">
                {gameState?.timestamp?.toDate ? (
                  <>Registrado: <span className="text-foreground">{formatDistanceToNow(gameState.timestamp.toDate(), { addSuffix: true, locale: ptBR })}</span></>
                ) : gameState?.timestamp ? 'Sincronizando...' : 'Nenhum gole registrado ainda.'}
              </p>
            </div>

            <Button
              size="lg"
              onClick={handleGulp}
              disabled={isLastDrinker || !coupleId}
              className={`w-full h-16 text-lg font-bold rounded-2xl shadow-xl transition-all active:scale-95 group ${isLastDrinker ? 'bg-secondary text-muted-foreground cursor-not-allowed' : 'bg-primary hover:bg-primary/90'}`}
            >
              {isLastDrinker ? 'Você já bebeu o último!' : 'EU BEBI O ÚLTIMO GOLE!'}
              {!isLastDrinker && <Sparkles className="ml-2 size-5 group-hover:animate-pulse" />}
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* Placar */}
          <Card className="border-none shadow-lg bg-card/60 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-bold">Placar de Goles</CardTitle>
              <Trophy className="size-5 text-amber-500 fill-amber-500/20" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {gameState?.scores && Object.keys(gameState.scores).length > 0 ? Object.entries(gameState.scores).map(([uid, score]) => {
                  const member = coupleMembers[uid];
                  const name = uid === user?.uid ? 'Você' : (member?.displayName || 'Parceiro(a)');
                  return (
                    <div key={uid} className="flex items-center justify-between p-3 rounded-xl bg-accent/20">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                          <AvatarImage src={member?.photoURL || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary font-bold">
                            {name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-semibold text-sm">{name}</span>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black font-headline text-primary">{Number(score)}</span>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Goles</span>
                      </div>
                    </div>
                  );
                }) : <p className="text-sm text-muted-foreground text-center py-4 italic">0 a 0. Quem vai abrir o placar?</p>}
              </div>
            </CardContent>
          </Card>

          {/* Histórico */}
          <Card className="border-none shadow-lg bg-card/60 backdrop-blur-sm overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-bold">Últimos Registros</CardTitle>
              <HistoryIcon className="size-5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/30">
                {sortedHistory.length > 0 ? sortedHistory.map((gulp) => {
                  const drinker = coupleMembers[gulp.drinkerId];
                  return (
                    <div key={gulp.id} className="p-4 flex items-center justify-between hover:bg-accent/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 border shadow-sm">
                          <AvatarImage src={drinker?.photoURL || undefined} />
                          <AvatarFallback className="text-[10px] bg-secondary font-bold">
                            {drinker?.displayName?.charAt(0) || gulp.drinkerName?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-semibold">{drinker?.displayName || gulp.drinkerName}</p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">Bebeu o último gole</p>
                        </div>
                      </div>
                      <span className="text-[10px] text-muted-foreground font-bold bg-accent/50 px-2 py-1 rounded-full">
                        {gulp.timestamp?.toDate ? formatDistanceToNow(gulp.timestamp.toDate(), { locale: ptBR, addSuffix: true }) : 'agora'}
                      </span>
                    </div>
                  );
                }) : <div className="p-10 text-center text-sm text-muted-foreground italic">O histórico está vazio...</div>}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
