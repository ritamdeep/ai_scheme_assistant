import type { Metadata, Viewport } from 'next';
// Locally bundled fontsource fonts (Zero external network requests during build/runtime)
import '@fontsource/noto-sans/400.css';
import '@fontsource/noto-sans/500.css';
import '@fontsource/noto-sans/600.css';
import '@fontsource/noto-sans/700.css';

import '@fontsource/noto-sans-devanagari/400.css';
import '@fontsource/noto-sans-devanagari/500.css';
import '@fontsource/noto-sans-devanagari/600.css';
import '@fontsource/noto-sans-devanagari/700.css';

import '@fontsource/noto-sans-bengali/400.css';
import '@fontsource/noto-sans-bengali/500.css';
import '@fontsource/noto-sans-bengali/600.css';
import '@fontsource/noto-sans-bengali/700.css';

import '@fontsource/noto-sans-tamil/400.css';
import '@fontsource/noto-sans-tamil/500.css';
import '@fontsource/noto-sans-tamil/600.css';
import '@fontsource/noto-sans-tamil/700.css';

import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { AuthProvider } from '@/lib/auth-context';
import { I18nProvider } from '@/lib/i18n';
import { TopHeader } from '@/components/TopHeader';
import { BottomNav } from '@/components/BottomNav';
import { SplashScreen } from '@/components/SplashScreen';
import { PwaRegister } from '@/components/PwaRegister';

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
      className="font-scale-normal"
    >
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
