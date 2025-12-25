// @ts-ignore
import './globals.css';
import type { Metadata } from 'next';
import { Noto_Serif_Hebrew, Assistant } from 'next/font/google';
import { ClientProviders } from './ClientProviders';

const notoSerifHebrew = Noto_Serif_Hebrew({
  subsets: ['hebrew'],
  weight: ['400', '700'],
  variable: '--font-serif-hebrew',
});

const assistant = Assistant({
  subsets: ['hebrew'],
  weight: ['400', '600', '700'],
  variable: '--font-assistant',
});

export const metadata: Metadata = {
  title: 'Kibutz',
  description: 'מאגר הקהילות הגדול בארץ',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl" className={`${notoSerifHebrew.variable} ${assistant.variable}`} suppressHydrationWarning>
      <body className="bg-gray-100 text-right font-sans antialiased min-h-screen" suppressHydrationWarning>
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
