'use client';

import { redirect } from 'next/navigation';
import { useUser } from '@/firebase';
import { useEffect } from 'react';

export default function Home() {
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    if (!isUserLoading) {
      if (user) {
        redirect('/dashboard');
      } else {
        redirect('/login');
      }
    }
  }, [user, isUserLoading]);

  // Render a loading state or nothing while redirecting
  return null;
}
