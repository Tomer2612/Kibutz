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
  title: {
    default: 'Kibutz - מאגר הקהילות הגדול בארץ',
    template: '%s | Kibutz',
  },
  description: 'הצטרפו לקהילות מקצועיות, למדו מהמומחים הטובים ביותר, והתחברו עם אנשים בעלי תחומי עניין משותפים. Kibutz - הבית של הקהילות המובילות בישראל.',
  keywords: ['קהילות', 'קורסים', 'לימודים', 'רשת חברתית', 'ישראל', 'community', 'courses'],
  authors: [{ name: 'Kibutz' }],
  creator: 'Kibutz',
  metadataBase: new URL('https://kibutz.co.il'),
  openGraph: {
    type: 'website',
    locale: 'he_IL',
    url: 'https://kibutz.co.il',
    siteName: 'Kibutz',
    title: 'Kibutz - מאגר הקהילות הגדול בארץ',
    description: 'הצטרפו לקהילות מקצועיות, למדו מהמומחים הטובים ביותר, והתחברו עם אנשים בעלי תחומי עניין משותפים.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Kibutz - מאגר הקהילות הגדול בארץ',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kibutz - מאגר הקהילות הגדול בארץ',
    description: 'הצטרפו לקהילות מקצועיות, למדו מהמומחים הטובים ביותר, והתחברו עם אנשים בעלי תחומי עניין משותפים.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
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
