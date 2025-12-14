'use client';

import { SocketProvider } from './lib/SocketContext';
import ChatWidget from './components/ChatWidget';

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <SocketProvider>
      {children}
      <ChatWidget />
    </SocketProvider>
  );
}
