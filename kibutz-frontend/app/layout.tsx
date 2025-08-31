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
      <body className="bg-gray-50 text-right font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
