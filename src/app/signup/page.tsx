'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';

import { SignupForm } from '@/components/auth/signup-form';
import { Icons } from '@/components/icons';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function SignupPage() {
    const loginImage = PlaceHolderImages.find(p => p.id === 'couple-login');
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

  return (
      <div className="w-full h-screen lg:grid lg:grid-cols-2">
        <div className="flex items-center justify-center py-12">
          <div className="mx-auto grid w-[350px] gap-8">
            <div className="grid gap-4 text-center">
              <div className="flex justify-center items-center gap-2">
                  <Icons.logo className="h-8 w-8 text-primary" />
                  <h1 className="text-3xl font-bold font-headline">It Takes Two</h1>
              </div>
              <p className="text-muted-foreground">
                Crie sua conta para começar a construir seu espaço.
              </p>
            </div>
            {isClient && <SignupForm />}
            <p className="px-8 text-center text-sm text-muted-foreground">
              Já tem uma conta?{' '}
              <Link
                href="/login"
                className="underline underline-offset-4 hover:text-primary"
              >
                Fazer login
              </Link>
            </p>
          </div>
        </div>
        <div className="hidden bg-muted lg:block">
          {loginImage && (
              <Image
                src={loginImage.imageUrl}
                alt={loginImage.description}
                width="1200"
                height="800"
                data-ai-hint={loginImage.imageHint}
                className="h-full w-full object-cover"
              />
          )}
        </div>
      </div>
  );
}
