'use client'

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import React from 'react'
import {
  CalendarHeart,
  CircleDollarSign,
  Clapperboard,
  Goal,
  Image as ImageIcon,
  LayoutDashboard,
  ListTodo,
  LogOut,
  Mail,
  Users,
  User,
  Gamepad2,
  Heart,
} from "lucide-react"

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useAuth, useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from "@/firebase"
import { signOut } from "firebase/auth"
import { Separator } from "@/components/ui/separator"
import { BottomNavigation } from "@/components/ui/bottom-navigation"
import { collection, query, orderBy, limit, doc } from 'firebase/firestore';
import type { Post, UserProfile, ToDoItem, Expense, MovieSeries, Game, ImportantDate, Memory, LoveLetter, CoupleGoal } from '@/types';
import { cn } from "@/lib/utils"

type CollectionName = 'todos' | 'expenses' | 'movies' | 'games' | 'dates' | 'posts' | 'memories' | 'loveLetters' | 'goals';
type CollectionItem = ToDoItem | Expense | MovieSeries | Game | ImportantDate | Post | Memory | LoveLetter | CoupleGoal;

export const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Painel" },
  { href: "/todos", icon: ListTodo, label: "Tarefas", notificationKey: "todos" },
  { href: "/finances", icon: CircleDollarSign, label: "Finanças", notificationKey: "expenses" },
  { href: "/watchlist", icon: Clapperboard, label: "Filmes", notificationKey: "movies" },
  { href: "/games", icon: Gamepad2, label: "Jogos", notificationKey: "games" },
  { href: "/dates", icon: CalendarHeart, label: "Datas", notificationKey: "dates" },
  { href: "/wall", icon: Users, label: "Mural", notificationKey: "posts" },
  { href: "/memories", icon: ImageIcon, label: "Memórias", notificationKey: "memories" },
  { href: "/messages", icon: Mail, label: "Cartas", notificationKey: "loveLetters" },
  { href: "/goals", icon: Goal, label: "Metas", notificationKey: "goals" },
  { href: "/profile", icon: User, label: "Perfil" },
]

function UserProfile() {
    const { user, isUserLoading } = useUser();
    const auth = useAuth();

    const handleLogout = () => {
        if (auth) {
            signOut(auth);
        }
    }

    if (isUserLoading) {
        return null;
    }

    return (
        <>
            <Separator className="my-2" />
            <div className="flex items-center gap-3 p-2">
                <Avatar>
                    <AvatarImage src={user?.photoURL || ''} alt="User Avatar" />
                    <AvatarFallback>{user?.email?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col overflow-hidden">
                    <span className="font-medium truncate">{user?.displayName || 'Usuário'}</span>
                    <span className="text-xs text-muted-foreground truncate">{user?.email}</span>
                </div>
                 <div className="ml-auto flex items-center">
                    <Button variant="ghost" size="icon" onClick={handleLogout}>
                        <LogOut />
                    </Button>
                </div>
            </div>
        </>
    )
}

function NotificationIndicator({ notificationKey }: { notificationKey: string }) {
    const { user } = useUser();
    const firestore = useFirestore();

    const userProfileRef = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return doc(firestore, 'users', user.uid);
    }, [user, firestore]);
    const { data: userProfile } = useDoc<UserProfile>(userProfileRef);

    const coupleId = userProfile?.coupleId;

    const lastItemQuery = useMemoFirebase(() => {
        if (!firestore || !coupleId || !notificationKey) return null;

        const collectionName = notificationKey as CollectionName;
        // The date field varies across collections
        const dateField = (notificationKey === 'posts' || notificationKey === 'loveLetters') ? 'dateTime' : 
                          (notificationKey === 'expenses' || notificationKey === 'dates' || notificationKey === 'memories') ? 'date' : 
                          'creationDate';

        return query(collection(firestore, 'couples', coupleId, collectionName), orderBy(dateField, 'desc'), limit(1));
    }, [firestore, coupleId, notificationKey]);

    const { data: lastItemData } = useCollection<CollectionItem>(lastItemQuery);

    const hasNewContent = React.useMemo(() => {
        if (!lastItemData || lastItemData.length === 0) return false;

        const lastViewDate = userProfile?.lastViewed?.[notificationKey]?.toDate();
        if (!lastViewDate) return true; // If never viewed, show notification

        const lastItem = lastItemData[0];
        let lastItemDate: Date | undefined;

        if ('dateTime' in lastItem && lastItem.dateTime) {
            lastItemDate = lastItem.dateTime.toDate();
        } else if ('date' in lastItem && lastItem.date) {
            lastItemDate = (lastItem as Expense).date.toDate();
        } else if ('creationDate' in lastItem && lastItem.creationDate) {
            lastItemDate = lastItem.creationDate.toDate();
        }
        
        return lastItemDate && lastItemDate > lastViewDate;
    }, [lastItemData, userProfile, notificationKey]);

    if (!hasNewContent) return null;

    return (
        <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-primary ring-2 ring-background" />
    );
}

export default function AppLayout({ children }: { children: React.React.Node }) {  
  const pathname = usePathname()
  return (
    <SidebarProvider>
      <div className="relative min-h-screen md:flex">
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-2">
              <Heart className="size-7 text-primary" />
              <span className="text-lg font-semibold font-headline">It Takes Two</span>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild tooltip={item.label} isActive={pathname === item.href}>
                    <Link href={item.href} className="relative">
                        <item.icon />
                        <span>{item.label}</span>
                        {item.notificationKey && <NotificationIndicator notificationKey={item.notificationKey} />}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter>
              <UserProfile />
          </SidebarFooter>
        </Sidebar>
        <div className="flex-1">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:h-16 sm:px-6 md:hidden">
              <SidebarTrigger className="md:hidden"/>
              <div className="flex flex-1 items-center gap-2">
                 <Heart className="size-6 text-primary" />
                 <span className="text-base font-semibold font-headline">It Takes Two</span>
              </div>
          </header>
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24 md:pb-6">
              {children}
          </main>
        </div>
        <BottomNavigation navItems={navItems} />
      </div>
    </SidebarProvider>
  )
}
