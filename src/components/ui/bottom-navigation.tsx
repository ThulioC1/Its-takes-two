'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'
import React from 'react'

interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  hasNotification?: boolean
}

interface BottomNavigationProps {
  navItems: NavItem[]
}

export function BottomNavigation({ navItems }: BottomNavigationProps) {
  const pathname = usePathname()

  return (
    <div className="md:hidden fixed bottom-0 left-0 z-50 w-full h-16 bg-background border-t border-border">
      <div className="relative flex overflow-x-auto h-full">
        <div className="flex flex-nowrap">
          {navItems.map(item => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex-shrink-0 relative inline-flex flex-col items-center justify-center w-20 min-w-[5rem] px-2 hover:bg-accent group',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <item.icon className="w-5 h-5 mb-1" />
                <span className="text-xs text-center break-words">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
