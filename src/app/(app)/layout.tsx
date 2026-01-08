'use client'

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
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
  Bell,
} from "lucide-react"
import {
  collection,
  doc,
  writeBatch,
  query,
  where,
  limit,
  orderBy,
} from 'firebase/firestore';

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
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import type { Notification, UserProfile } from "@/types"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

export const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Painel" },
  { href: "/todos", icon: ListTodo, label: "Tarefas" },
  { href: "/finances", icon: CircleDollarSign, label: "Finanças" },
  { href: "/watchlist", icon: Clapperboard, label: "Filmes" },
  { href: "/games", icon: Gamepad2, label: "Jogos" },
  { href: "/dates", icon: CalendarHeart, label: "Datas" },
  { href: "/wall", icon: Users, label: "Mural" },
  { href: "/memories", icon: ImageIcon, label: "Memórias" },
  { href: "/messages", icon: Mail, label: "Cartas" },
  { href: "/goals", icon: Goal, label: "Metas" },
  { href: "/profile", icon: User, label: "Perfil" },
]

function NotificationBell() {
    const { user } = useUser();
    const firestore = useFirestore();
    const router = useRouter();

    const userProfileRef = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user]);

    const { data: userProfile } = useDoc<UserProfile>(userProfileRef);
    const coupleId = userProfile?.coupleId;

    const notificationsRef = useMemoFirebase(() => {
        if (!firestore || !coupleId || !user) return null;
        return query(
            collection(firestore, `couples/${coupleId}/notifications`),
            where('recipientId', '==', user.uid),
            orderBy('createdAt', 'desc'),
            limit(10)
        );
    }, [firestore, coupleId, user]);

    const { data: notifications } = useCollection<Notification>(notificationsRef);

    const unreadNotifications = notifications?.filter(n => !n.read) || [];

    const handleMarkAsRead = async () => {
        if (unreadNotifications.length === 0 || !firestore || !coupleId) return;
        const batch = writeBatch(firestore);
        unreadNotifications.forEach(n => {
            const notifRef = doc(firestore, `couples/${coupleId}/notifications/${n.id}`);
            batch.update(notifRef, { read: true });
        });
        await batch.commit();
    };
    
    const handleNotificationClick = (notification: Notification) => {
        router.push(notification.link);
    }

    return (
        <DropdownMenu onOpenChange={(open) => { if (open) handleMarkAsRead() }}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell />
                    {unreadNotifications.length > 0 && (
                        <span className="absolute top-1 right-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <div className="p-2 font-semibold">Notificações</div>
                <DropdownMenuSeparator />
                {notifications && notifications.length > 0 ? (
                    notifications.map(n => (
                        <DropdownMenuItem key={n.id} onSelect={() => handleNotificationClick(n)} className="flex items-start gap-2 whitespace-normal">
                             <Avatar className="h-8 w-8 mt-1">
                                <AvatarImage src={n.actor.photoURL} />
                                <AvatarFallback>{n.actor.displayName.charAt(0)}</AvatarFallback>
                            </Avatar>
                           <div className="flex-1">
                                <p className="text-sm">{n.text}</p>
                                <p className="text-xs text-muted-foreground">{formatDistanceToNow(n.createdAt.toDate(), { locale: ptBR, addSuffix: true })}</p>
                           </div>
                        </DropdownMenuItem>
                    ))
                ) : (
                    <div className="p-2 text-sm text-center text-muted-foreground">Nenhuma notificação.</div>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

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
                    <NotificationBell />
                    <Button variant="ghost" size="icon" onClick={handleLogout}>
                        <LogOut />
                    </Button>
                </div>
            </div>
        </>
    )
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
                    <Link href={item.href}>
                        <item.icon />
                        <span>{item.label}</span>
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
               <NotificationBell />
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
