'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'
import React from 'react'
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase'
import { collection, query, orderBy, limit, doc } from 'firebase/firestore'
import type { Post, UserProfile } from '@/types';

interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  hasNotification?: boolean
}

function WallNotificationIndicator() {
    const { user } = useUser();
    const firestore = useFirestore();

    const userProfileRef = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return doc(firestore, 'users', user.uid);
    }, [user, firestore]);
    const { data: userProfile } = useDoc<UserProfile>(userProfileRef);

    const coupleId = userProfile?.coupleId;

    const lastPostQuery = useMemoFirebase(() => {
        if (!firestore || !coupleId) return null;
        return query(collection(firestore, 'couples', coupleId, 'posts'), orderBy('dateTime', 'desc'), limit(1));
    }, [firestore, coupleId]);

    const { data: lastPostData } = useCollection<Post>(lastPostQuery);

    const hasNewPost = React.useMemo(() => {
        if (!lastPostData || lastPostData.length === 0) return false;

        const lastViewDate = userProfile?.lastWallView?.toDate();
        if (!lastViewDate) return true; // If never viewed wall, show notification

        const lastPostDate = lastPostData[0].dateTime.toDate();
        
        return lastPostDate > lastViewDate;
    }, [lastPostData, userProfile]);

    if (!hasNewPost) return null;

    return (
        <span className="absolute top-1 right-5 block h-2 w-2 rounded-full bg-primary ring-2 ring-background" />
    );
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
                {item.hasNotification && <WallNotificationIndicator />}
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
