import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import '../index.css';
import Providers from '@/components/providers';
import { AppShell } from '@/components/app-shell';
import { I18nProvider } from '@/i18n/provider';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'better-training',
  description: 'better-training',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <I18nProvider>
          <Providers>
            {/* Twitter-like 3-column responsive shell:
              - md+: left icon nav, center content, right empty
              - mobile: content + bottom tab bar */}
          <div className="min-h-svh w-full">
            <AppShell>{children}</AppShell>
          </div>
        </Providers>
      </I18nProvider>
      </body>
    </html>
  );
}
