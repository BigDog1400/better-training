import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import '../index.css';
import Header from '@/components/header';
import Providers from '@/components/providers';

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
        <Providers>
          {/* App viewport wrapper: centers and constrains content like a mobile app */}
          <div className="min-h-svh w-full flex items-stretch justify-center bg-background">
            <div className="flex min-h-svh w-full max-w-[560px] flex-col">
              {/* Top header kept minimal */}
              <Header />
              {/* Main content grows and scrolls behind sticky bottom navs if any */}
              <main className="flex-1 overflow-y-auto">
                <div className="px-4 py-4 sm:px-6 sm:py-6">{children}</div>
              </main>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
