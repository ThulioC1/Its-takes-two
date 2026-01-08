'use client'

import Link from "next/link"
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
import { Icons } from "@/components/icons"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useAuth, useUser } from "@/firebase"
import { signOut } from "firebase/auth"
import { Separator } from "@/components/ui/separator"
import { BottomNavigation } from "@/components/ui/bottom-navigation"

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
                <Button variant="ghost" size="icon" className="ml-auto" onClick={handleLogout}>
                    <LogOut />
                </Button>
            </div>
        </>
    )
}

export default function AppLayout({ children }: { children: React.React.Node }) {  
  return (
    <SidebarProvider>
      <div className="relative min-h-screen md:flex">
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-2">
              <Icons.logo className="size-7 text-primary" />
              <span className="text-lg font-semibold font-headline">It Takes Two</span>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild tooltip={item.label}>
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
              <div className="flex-1">
                  {/* Header content can go here, like a search bar */}
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
