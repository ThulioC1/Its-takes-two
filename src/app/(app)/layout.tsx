'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
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
  ChevronRight,
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
import { useAuth, useUser } from "@/firebase"
import { signOut } from "firebase/auth"
import { Separator } from "@/components/ui/separator"
import { BottomNavigation } from "@/components/ui/bottom-navigation"
import { cn } from "@/lib/utils"

export const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/wall", icon: Users, label: "Mural" },
  { href: "/todos", icon: ListTodo, label: "Tarefas" },
  { href: "/finances", icon: CircleDollarSign, label: "Finanças" },
  { href: "/watchlist", icon: Clapperboard, label: "Cinema" },
  { href: "/games", icon: Gamepad2, label: "Games" },
  { href: "/dates", icon: CalendarHeart, label: "Datas" },
  { href: "/memories", icon: ImageIcon, label: "Memórias" },
  { href: "/messages", icon: Mail, label: "Cartas" },
  { href: "/goals", icon: Goal, label: "Metas" },
]

function UserProfile() {
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
                <span className="text-[10px] text-muted-foreground truncate uppercase tracking-tighter">Premium Account</span>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive">
                <LogOut className="h-4 w-4" />
            </Button>
        </div>
    )
}

export default function AppLayout({ children }: { children: React.React.Node }) {  
  const pathname = usePathname()
  return (
    <SidebarProvider>
      <div className="relative min-h-screen md:flex w-full bg-background">
        <Sidebar className="border-r border-border/40 bg-card/40 backdrop-blur-xl">
          <SidebarHeader className="p-6">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 bg-primary flex items-center justify-center rounded-xl shadow-lg shadow-primary/20">
                <Heart className="h-5 w-5 text-primary-foreground fill-current" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold font-headline leading-tight">It Takes Two</span>
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-[0.2em]">Partner OS</span>
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
                      "rounded-lg transition-all duration-200 h-10 px-3",
                      pathname === item.href ? "bg-primary/10 text-primary shadow-sm" : "hover:bg-accent/50 text-muted-foreground"
                    )}
                  >
                    <Link href={item.href} className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3">
                          <item.icon className={cn("h-4 w-4", pathname === item.href ? "text-primary" : "")} />
                          <span className="text-sm font-medium">{item.label}</span>
                        </div>
                        {pathname === item.href && <ChevronRight className="h-3 w-3" />}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
            <Separator className="my-4 mx-3 opacity-50" />
            <SidebarMenu className="px-3">
                <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === '/profile'}>
                        <Link href="/profile" className="flex items-center gap-3 text-sm font-medium text-muted-foreground">
                            <User className="h-4 w-4" />
                            <span>Ajustes</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="p-4">
              <UserProfile />
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
              <div className="flex items-center gap-4">
                 <Button variant="outline" size="sm" className="hidden sm:flex rounded-full px-4 h-8 text-[10px] font-bold uppercase tracking-widest bg-card/50">
                    Sync Status: OK
                 </Button>
              </div>
          </header>
          <main className="flex-1 overflow-y-auto p-6 md:p-10 pb-24 md:pb-10">
              {children}
          </main>
        </div>
        <BottomNavigation navItems={navItems} />
      </div>
    </SidebarProvider>
  )
}