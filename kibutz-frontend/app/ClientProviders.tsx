'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { SocketProvider } from './lib/SocketContext';
import ChatWidget from './components/ChatWidget';

// Pages that don't require auth check
const publicPages = ['/login', '/signup', '/forgot-password', '/reset-password', '/verify-email', '/terms', '/privacy', '/pricing', '/contact', '/support'];

export function ClientProviders({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Skip auth check on public pages
    if (publicPages.some(page => pathname?.startsWith(page)) || pathname === '/') {
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    // Validate token with a simple API call
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        if (res.status === 401) {
          // Token expired - clear auth and redirect
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          router.push(`/login?expired=true&redirect=${encodeURIComponent(pathname || '/')}`);
        }
      })
      .catch(() => {
        // Network error - don't logout, might be temporary
      });
  }, [pathname, router]);

  return (
    <SocketProvider>
      {children}
      <ChatWidget />
    </SocketProvider>
  );
}
