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
import { collection, query, orderBy, limit } from 'firebase/firestore';
import type { Post, UserProfile } from '@/types';
import { cn } from "@/lib/utils"

export const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Painel" },
  { href: "/todos", icon: ListTodo, label: "Tarefas" },
  { href: "/finances", icon: CircleDollarSign, label: "Finanças" },
  { href: "/watchlist", icon: Clapperboard, label: "Filmes" },
  { href: "/games", icon: Gamepad2, label: "Jogos" },
  { href: "/dates", icon: CalendarHeart, label: "Datas" },
  { href: "/wall", icon: Users, label: "Mural", notificationKey: "wall" },
  { href: "/memories", icon: ImageIcon, label: "Memórias" },
  { href: "/messages", icon: Mail, label: "Cartas" },
  { href: "/goals", icon: Goal, label: "Metas" },
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

    const lastPostQuery = useMemoFirebase(() => {
        if (!firestore || !coupleId || notificationKey !== 'wall') return null;
        return query(collection(firestore, 'couples', coupleId, 'posts'), orderBy('dateTime', 'desc'), limit(1));
    }, [firestore, coupleId, notificationKey]);

    const { data: lastPostData } = useCollection<Post>(lastPostQuery);

    const hasNewContent = React.useMemo(() => {
        if (notificationKey === 'wall') {
            if (!lastPostData || lastPostData.length === 0 || !userProfile?.lastWallView) {
                // If there's a post but user has never viewed the wall, show notification
                return lastPostData && lastPostData.length > 0 && !userProfile?.lastWallView;
            }
            const lastPostDate = lastPostData[0].dateTime?.toDate();
            const lastViewDate = userProfile.lastWallView.toDate();
            return lastPostDate > lastViewDate;
        }
        return false;
    }, [lastPostData, userProfile, notificationKey]);

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
