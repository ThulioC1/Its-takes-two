
'use client';

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Trophy, History, Beer, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useFirestore, useUser, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, setDoc, addDoc, serverTimestamp, increment } from 'firebase/firestore';
import type { LastGulpGame, LastGulpHistory, UserProfile } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function LastGulpPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);
  const { data: userProfile } = useDoc<UserProfile>(userProfileRef);
  const coupleId = userProfile?.coupleId;

  const gameStateRef = useMemoFirebase(() => {
    if (!firestore || !coupleId) return null;
    return doc(firestore, 'couples', coupleId, 'lastGulpGame', 'state');
  }, [firestore, coupleId]);
  const { data: gameState } = useDoc<LastGulpGame>(gameStateRef);

  const historyRef = useMemoFirebase(() => {
    if (!firestore || !coupleId) return null;
    return collection(firestore, 'couples', coupleId, 'lastGulpGame', 'history');
  }, [firestore, coupleId]);
  const { data: history } = useCollection<LastGulpHistory>(historyRef);

  const sortedHistory = useMemo(() => {
    if (!history) return [];
    return [...history].sort((a, b) => (b.timestamp?.toDate?.().getTime() || 0) - (a.timestamp?.toDate?.().getTime() || 0)).slice(0, 10);
  }, [history]);

  const handleGulp = async () => {
    if (!user || !gameStateRef || !historyRef) return;

    // Update state
    setDoc(gameStateRef, {
      lastDrinkerId: user.uid,
      lastDrinkerName: user.displayName || 'Parceiro',
      timestamp: serverTimestamp(),
      scores: {
        [user.uid]: increment(1)
      }
    }, { merge: true });

    // Add to history
    addDoc(historyRef, {
      drinkerId: user.uid,
      drinkerName: user.displayName || 'Parceiro',
      timestamp: serverTimestamp()
    });
  };

  const isLastDrinker = gameState?.lastDrinkerId === user?.uid;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="text-center space-y-2 animate-in fade-in slide-in-from-top-4 duration-700">
        <h1 className="text-4xl font-bold font-headline">O Último Gole</h1>
        <p className="text-muted-foreground">A prova definitiva de quem bebeu o último gole do copo.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 items-start">
        {/* Main Game Card */}
        <Card className="relative overflow-hidden border-primary/20 bg-card/40 backdrop-blur-xl shadow-2xl md:sticky md:top-24">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-primary" />
          <CardHeader className="text-center">
            <CardTitle className="text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground">Status Atual</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-8 py-8">
            <div className="relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={gameState?.lastDrinkerId}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="relative z-10"
                >
                  <div className="size-48 rounded-full border-4 border-primary/20 flex items-center justify-center bg-primary/5">
                    <Beer className={`size-24 transition-all duration-500 ${isLastDrinker ? 'text-primary' : 'text-muted-foreground/40'}`} />
                  </div>
                  {isLastDrinker && (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                      className="absolute -inset-4 border-2 border-dashed border-primary/30 rounded-full"
                    />
                  )}
                </motion.div>
              </AnimatePresence>
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary text-white shadow-lg px-4 py-1">
                  {gameState ? (isLastDrinker ? 'VOCÊ BEBEU!' : `${gameState.lastDrinkerName} BEBEU!`) : 'COMECE A JOGAR!'}
                </Badge>
              </div>
            </div>

            <div className="text-center space-y-1">
              <p className="text-sm text-muted-foreground font-medium">
                {gameState?.timestamp ? (
                  <>Última vez: <span className="text-foreground">{formatDistanceToNow(gameState.timestamp.toDate(), { addSuffix: true, locale: ptBR })}</span></>
                ) : 'Ninguém bebeu ainda...'}
              </p>
            </div>

            <Button
              size="lg"
              onClick={handleGulp}
              disabled={isLastDrinker}
              className={`w-full h-16 text-lg font-bold rounded-2xl shadow-xl transition-all active:scale-95 ${isLastDrinker ? 'bg-secondary text-muted-foreground' : 'bg-primary hover:bg-primary/90'}`}
            >
              {isLastDrinker ? 'Você já bebeu o último!' : 'EU BEBI O ÚLTIMO GOLE!'}
              {!isLastDrinker && <Sparkles className="ml-2 size-5" />}
            </Button>
          </CardContent>
        </Card>

        {/* Stats & History */}
        <div className="space-y-6">
          {/* Placar */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Placar Geral</CardTitle>
              <Trophy className="size-5 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {gameState?.scores ? Object.entries(gameState.scores).map(([uid, score]) => (
                  <div key={uid} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`size-2 rounded-full ${uid === user?.uid ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
                      <span className="font-medium">{uid === user?.uid ? 'Você' : 'Parceiro(a)'}</span>
                    </div>
                    <span className="text-2xl font-bold font-headline">{score}</span>
                  </div>
                )) : <p className="text-sm text-muted-foreground text-center">0 a 0. Quem vai abrir o placar?</p>}
              </div>
            </CardContent>
          </Card>

          {/* Histórico */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Histórico de Guladas</CardTitle>
              <History className="size-5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/50">
                {sortedHistory.length > 0 ? sortedHistory.map((gulp) => (
                  <div key={gulp.id} className="p-4 flex items-center justify-between hover:bg-accent/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-[10px] bg-secondary">
                          {gulp.drinkerName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold">{gulp.drinkerName}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Registrou o último gole</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-medium">
                      {gulp.timestamp ? formatDistanceToNow(gulp.timestamp.toDate(), { locale: ptBR }) : 'agora'}
                    </span>
                  </div>
                )) : <div className="p-8 text-center text-sm text-muted-foreground italic">Sem registros no baú...</div>}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={`rounded-full text-[10px] font-bold uppercase tracking-widest ${className}`}>
      {children}
    </div>
  )
}
