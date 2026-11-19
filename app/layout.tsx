import type { Metadata, Viewport } from 'next';
import {
  Noto_Sans,
  Noto_Sans_Devanagari,
  Noto_Sans_Bengali,
  Noto_Sans_Tamil,
} from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { AuthProvider } from '@/lib/auth-context';
import { I18nProvider } from '@/lib/i18n';
import { TopHeader } from '@/components/TopHeader';
import { BottomNav } from '@/components/BottomNav';
import { SplashScreen } from '@/components/SplashScreen';
import { PwaRegister } from '@/components/PwaRegister';

const notoSans = Noto_Sans({
  subsets: ['latin'],
  weight: ['400', '600', '700', '900'],
  variable: '--font-noto-sans',
  display: 'swap',
});

const notoDevanagari = Noto_Sans_Devanagari({
  subsets: ['devanagari'],
  weight: ['400', '600', '700', '900'],
  variable: '--font-noto-devanagari',
  display: 'swap',
});

const notoBengali = Noto_Sans_Bengali({
  subsets: ['bengali'],
  weight: ['400', '600', '700', '900'],
  variable: '--font-noto-bengali',
  display: 'swap',
});

const notoTamil = Noto_Sans_Tamil({
  subsets: ['tamil'],
  weight: ['400', '600', '700', '900'],
  variable: '--font-noto-tamil',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'SEVA.AI — National Scheme Assistant',
  description:
    'Simple, multilingual citizen assistant to discover and check eligibility for Indian Government schemes.',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/favicon.ico',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: '#0E2040',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${notoSans.variable} ${notoDevanagari.variable} ${notoBengali.variable} ${notoTamil.variable} font-scale-normal`}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;600;700;900&family=Noto+Sans+Bengali:wght@400;600;700;900&family=Noto+Sans+Devanagari:wght@400;600;700;900&family=Noto+Sans+Tamil:wght@400;600;700;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased bg-slate-100 dark:bg-[#07101E] text-slate-900 dark:text-slate-100 min-h-screen flex flex-col items-center">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <I18nProvider>
              {/* Centered mobile-first column: max-w-[480px] */}
              <div className="w-full max-w-[480px] mx-auto min-h-screen flex flex-col bg-white dark:bg-[#0B1120] border-x border-slate-200/60 dark:border-slate-800/60 shadow-xl relative pb-safe-bottom">
                <SplashScreen />
                <TopHeader />
                <main className="flex-1 w-full">{children}</main>
                <BottomNav />
                <PwaRegister />
              </div>
            </I18nProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
