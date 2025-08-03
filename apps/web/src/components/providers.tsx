'use client';

import { ThemeProvider } from './theme-provider';
import { Toaster } from './ui/sonner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient()

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      disableTransitionOnChange
      enableSystem={false}
    >
      {children}
      <Toaster richColors />
    </ThemeProvider>
    </QueryClientProvider>
  );
}
