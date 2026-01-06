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
  useSidebar,
} from "@/components/ui/sidebar"
import { Icons } from "@/components/icons"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { PlaceHolderImages } from "@/lib/placeholder-images"
import { Separator } from "@/components/ui/separator"
import { FirebaseClientProvider } from "@/firebase"

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Painel" },
  { href: "/todos", icon: ListTodo, label: "Lista de Tarefas" },
  { href: "/finances", icon: CircleDollarSign, label: "Finanças do Casal" },
  { href: "/watchlist", icon: Clapperboard, label: "Filmes & Séries" },
  { href: "/dates", icon: CalendarHeart, label: "Datas Importantes" },
  { href: "/wall", icon: Users, label: "Mural do Casal" },
  { href: "/memories", icon: ImageIcon, label: "Álbum de Memórias" },
  { href: "/messages", icon: Mail, label: "Cartas de Amor" },
  { href: "/goals", icon: Goal, label: "Metas do Casal" },
]

export default function AppLayout({ children }: { children: React.React.Node }) {
  const userAvatar1 = PlaceHolderImages.find((p) => p.id === "user-avatar-1")
  
  return (
    <FirebaseClientProvider>
      <SidebarProvider>
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
              <Separator className="my-2" />
              <div className="flex items-center gap-3 p-2">
                  <Avatar>
                      {userAvatar1 && <AvatarImage src={userAvatar1.imageUrl} alt="User Avatar" />}
                      <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col overflow-hidden">
                      <span className="font-medium truncate">Usuário</span>
                      <span className="text-xs text-muted-foreground truncate">usuario@email.com</span>
                  </div>
                  <Button variant="ghost" size="icon" className="ml-auto" asChild>
                      <Link href="/login">
                          <LogOut />
                      </Link>
                  </Button>
              </div>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
          <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:h-16 sm:px-6">
              <SidebarTrigger className="md:hidden"/>
              <div className="flex-1">
                  {/* Header content can go here, like a search bar */}
              </div>
          </header>
          <main className="flex-1 overflow-y-auto p-4 sm:p-6">
              {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </FirebaseClientProvider>
  )
}
