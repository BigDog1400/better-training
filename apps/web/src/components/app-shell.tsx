'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { loadAppData } from '@/lib/localStorage';
import { cn } from '@/lib/utils';
import { Home, CalendarDays, PlusSquare, Dumbbell, Clock, History, LineChart } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';

/**
 * Shared nav config
 */
const routes = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/plan/select', label: 'Select', icon: CalendarDays },
  { href: '/plan/create', label: 'Create', icon: PlusSquare },
  { href: '/plan/current', label: 'Current', icon: CalendarDays, requiresPlan: true },
  { href: '/workout/session', label: 'Workout', icon: Dumbbell, requiresPlan: true },
  { href: '/history', label: 'History', icon: History },
  { href: '/workout/missing', label: 'Missing', icon: Clock },
  { href: '/progress', label: 'Progress', icon: LineChart },
];

function useNavAvailability() {
  // Default to false to match SSR markup and avoid hydration mismatch.
  const [hasPlan, setHasPlan] = useState(false);

  useEffect(() => {
    // Read from localStorage only on client after mount
    const appData = loadAppData();
    setHasPlan(!!appData.currentPlanId);
  }, []);

  return { hasPlan };
}

function DesktopSideNav() {
  const pathname = usePathname();
  const { hasPlan } = useNavAvailability();

  return (
    <nav className="hidden md:flex md:flex-col gap-1 p-3">
      <div className="text-xs font-medium text-muted-foreground px-2 pb-1">Navigation</div>
      {routes.map(({ href, label, icon: Icon, requiresPlan }) => {
        const disabled = requiresPlan && !hasPlan;
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}  // keep href stable between SSR and client
            aria-disabled={disabled}
            onClick={disabled ? (e) => e.preventDefault() : undefined}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm',
              disabled
                ? 'opacity-40'
                : 'hover:bg-accent hover:text-accent-foreground',
              active && 'bg-accent text-accent-foreground'
            )}
            tabIndex={disabled ? 0 : 0}
          >
            <Icon className="h-5 w-5 shrink-0" />
            <span className="truncate">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function MobileBottomNav() {
  const pathname = usePathname();
  const { hasPlan } = useNavAvailability();

  // Choose a compact subset for bottom bar
  const bottom = [
    routes[0], // Home
    routes[3], // Current (plan)
    routes[4], // Workout
    routes[1], // Select
    routes[7], // Progress
  ];

  return (
    <nav className="md:hidden sticky bottom-0 inset-x-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <ul className="flex items-stretch justify-around">
        {bottom.map(({ href, label, icon: Icon, requiresPlan }) => {
          const disabled = requiresPlan && !hasPlan;
          const active = pathname === href;
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}  // keep href stable
                aria-disabled={disabled}
                onClick={disabled ? (e) => e.preventDefault() : undefined}
                tabIndex={0}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 py-2 text-xs',
                  disabled
                    ? 'opacity-40'
                    : 'hover:text-foreground/90',
                  active && 'text-foreground'
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/**
 * AppShell: 3-column layout on md+ screens, bottom nav on mobile
 * Left: navigation icons
 * Center: main content (children)
 * Right: reserved/empty
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto grid min-h-svh w-full max-w-[1100px] grid-cols-1 md:grid-cols-[220px_minmax(0,1fr)]">
      {/* Left nav (desktop/tablet) */}
      <aside className="hidden border-r md:block">
        <DesktopSideNav />
      </aside>

      {/* Center content */}
      <section className="flex min-h-svh flex-col">
        <main className="flex-1">
          <div className="mx-auto w-full max-w-[720px] px-4 py-4 sm:px-6 sm:py-6">
            {children}
          </div>
        </main>
        {/* Bottom nav (mobile) */}
        <MobileBottomNav />
      </section>
    </div>
  );
}
