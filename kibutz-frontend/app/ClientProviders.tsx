'use client';

import { Suspense } from 'react';
import { SocketProvider } from './lib/SocketContext';
import ChatWidget from './components/ChatWidget';
import RouteProgress from './components/RouteProgress';

export function ClientProviders({ children }: { children: React.ReactNode }) {
  // Auth is now handled by middleware.ts - no useEffect needed here

  return (
    <SocketProvider>
      <Suspense fallback={null}>
        <RouteProgress />
      </Suspense>
      {children}
      <ChatWidget />
    </SocketProvider>
  );
}
