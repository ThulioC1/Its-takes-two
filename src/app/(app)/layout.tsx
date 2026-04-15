
'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import React, { useMemo, useState, useEffect } from 'react'
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
  User as UserIcon,
  Gamepad2,
  Heart,
  ChevronRight,
  Sun,
  Moon,
  Beer,
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
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useAuth, useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase"
import { signOut } from "firebase/auth"
import { Separator } from "@/components/ui/separator"
import { BottomNavigation } from "@/components/ui/bottom-navigation"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { collection, doc } from "firebase/firestore"
import type { UserProfile, ToDoItem, Post } from "@/types"

function UserProfileComponent() {
    const { user, isUserLoading } = useUser();
    const auth = useAuth();
    const handleLogout = () => auth && signOut(auth);

    if (isUserLoading) return null;

    return (
        <div className="flex items-center gap-3 p-2 bg-secondary/30 rounded-xl border border-border/50">
            <Avatar className="h-8 w-8 border">
                <AvatarImage src={user?.photoURL || ''} />
                <AvatarFallback>{user?.email?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs font-semibold truncate">{user?.displayName || 'Usuário'}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive transition-colors">
                <LogOut className="h-4 w-4" />
            </Button>
        </div>
    )
}

function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    setTheme(initialTheme);
    document.documentElement.classList.toggle('dark', initialTheme === 'dark');
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  return (
    <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-9 w-9 rounded-lg">
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-amber-500" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-primary" />
      <span className="sr-only">Alternar tema</span>
    </Button>
  );
}

export default function AppLayout({ children }: { children: React.React.Node }) {  
  const pathname = usePathname()
  const { user } = useUser()
  const firestore = useFirestore()

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);
  const { data: userProfile } = useDoc<UserProfile>(userProfileRef);
  const coupleId = userProfile?.coupleId;

  // Real-time notification data
  const todosRef = useMemoFirebase(() => {
    if (!firestore || !coupleId) return null;
    return collection(firestore, 'couples', coupleId, 'todos');
  }, [firestore, coupleId]);
  const { data: todos } = useCollection<ToDoItem>(todosRef);

  const pendingCount = useMemo(() => todos?.filter(t => t.status === 'Pendente').length || 0, [todos]);

  const navItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/wall", icon: Users, label: "Mural" },
    { href: "/todos", icon: ListTodo, label: "Tarefas", badge: pendingCount > 0 ? pendingCount : undefined },
    { href: "/finances", icon: CircleDollarSign, label: "Finanças" },
    { href: "/watchlist", icon: Clapperboard, label: "Cinema" },
    { href: "/games", icon: Gamepad2, label: "Games" },
    { href: "/dates", icon: CalendarHeart, label: "Datas" },
    { href: "/memories", icon: ImageIcon, label: "Memórias" },
    { href: "/messages", icon: Mail, label: "Cartas" },
    { href: "/goals", icon: Goal, label: "Metas" },
    { href: "/last-gulp", icon: Beer, label: "Último Gole" },
  ]

  return (
    <SidebarProvider>
      <div className="relative min-h-screen md:flex w-full bg-background selection:bg-primary/30 selection:text-primary-foreground">
        <Sidebar className="border-r border-border/40 bg-sidebar/95 backdrop-blur-xl md:bg-card/40">
          <SidebarHeader className="p-6">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 bg-primary flex items-center justify-center rounded-xl shadow-lg shadow-primary/20">
                <Heart className="h-5 w-5 text-white fill-current" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold font-headline leading-tight">It Takes Two</span>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent className="px-3">
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={pathname === item.href}
                    className={cn(
                      "rounded-lg transition-all duration-200 h-10 px-3 group",
                      pathname === item.href ? "bg-primary/10 text-primary shadow-sm" : "hover:bg-accent/50 text-muted-foreground"
                    )}
                  >
                    <Link href={item.href} className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3">
                          <item.icon className={cn("h-4 w-4 transition-transform group-hover:scale-110", pathname === item.href ? "text-primary" : "")} />
                          <span className="text-sm font-medium">{item.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {item.badge !== undefined && (
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                              {item.badge}
                            </span>
                          )}
                          {pathname === item.href && <ChevronRight className="h-3 w-3 animate-in fade-in slide-in-from-left-2" />}
                        </div>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
            <Separator className="my-4 mx-3 opacity-50" />
            <SidebarMenu className="px-3">
                <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === '/profile'}>
                        <Link href="/profile" className="flex items-center gap-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                            <UserIcon className="h-4 w-4" />
                            <span>Ajustes</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="p-4">
              <UserProfileComponent />
          </SidebarFooter>
        </Sidebar>
        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/40 bg-background/80 px-6 backdrop-blur-md md:px-10">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="md:hidden"/>
                <div className="md:hidden flex items-center gap-2">
                   <Heart className="size-5 text-primary fill-current" />
                   <span className="text-sm font-bold font-headline">It Takes Two</span>
                </div>
                <div className="hidden md:block text-xs font-medium text-muted-foreground uppercase tracking-widest">
                  {navItems.find(i => i.href === pathname)?.label || 'Ajustes'}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ThemeToggle />
              </div>
          </header>
          <main className="flex-1 overflow-y-auto p-6 md:p-10 pb-24 md:pb-10">
              <AnimatePresence mode="wait">
                <motion.div
                  key={pathname}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="h-full"
                >
                  {children}
                </motion.div>
              </AnimatePresence>
          </main>
        </div>
        <BottomNavigation navItems={navItems} />
      </div>
    </SidebarProvider>
  )
}
