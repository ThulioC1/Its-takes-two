import { redirect } from 'next/navigation';

export default function Home() {
  // For now, we redirect to the login page.
  // In a real app, you'd check for an active session.
  // If a session exists, redirect to '/dashboard'.
  redirect('/login');
}
