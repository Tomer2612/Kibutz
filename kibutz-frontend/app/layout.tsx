// @ts-expect-error - Next.js handles CSS imports at runtime
import './globals.css';
import type { Metadata } from 'next';

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
    <html lang="he" dir="rtl">
      <body className="bg-gray-100 text-right font-sans antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
