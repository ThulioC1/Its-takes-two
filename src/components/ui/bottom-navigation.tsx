'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'
import React from 'react'
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase'
import { collection, query, orderBy, limit, doc } from 'firebase/firestore'
import type { Post, UserProfile, ToDoItem, Expense, MovieSeries, Game, ImportantDate, Memory, LoveLetter, CoupleGoal } from '@/types';

type CollectionName = 'todos' | 'expenses' | 'movies' | 'games' | 'dates' | 'posts' | 'memories' | 'loveLetters' | 'goals';
type CollectionItem = ToDoItem | Expense | MovieSeries | Game | ImportantDate | Post | Memory | LoveLetter | CoupleGoal;

interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  notificationKey?: string
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
        const dateField = (notificationKey === 'posts' || notificationKey === 'loveLetters') ? 'dateTime' : 
                          (notificationKey === 'expenses' || notificationKey === 'dates' || notificationKey === 'memories') ? 'date' : 
                          'creationDate';

        return query(collection(firestore, 'couples', coupleId, collectionName), orderBy(dateField, 'desc'), limit(1));
    }, [firestore, coupleId, notificationKey]);

    const { data: lastItemData } = useCollection<CollectionItem>(lastItemQuery);

    const hasNewContent = React.useMemo(() => {
        if (!lastItemData || lastItemData.length === 0) return false;

        const lastViewDate = userProfile?.lastViewed?.[notificationKey]?.toDate();
        if (!lastViewDate) return true;
        
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
                {item.notificationKey && <NotificationIndicator notificationKey={item.notificationKey} />}
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
