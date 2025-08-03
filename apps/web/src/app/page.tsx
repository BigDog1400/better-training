'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { TITLE_TEXT } from '@/lib/constants';
import { loadAppData } from '@/lib/localStorage';

export default function Home() {
  const [hasPlan, setHasPlan] = useState(false);

  useEffect(() => {
    const appData = loadAppData();
    setHasPlan(!!appData.currentPlanId);
  }, []);

  return (
    <div className="flex min-h-[calc(100svh-56px)] items-center justify-center">
      <div className="mx-auto w-full max-w-[480px] px-4 py-8 text-center">
        <div className="space-y-6">
          <pre className="overflow-x-auto font-mono text-xs sm:text-sm leading-tight text-muted-foreground">
            {TITLE_TEXT}
          </pre>

          <div className="space-y-2">
            <h1 className="font-bold text-2xl sm:text-3xl">Better Training</h1>
            <p className="mx-auto max-w-[28rem] text-sm text-muted-foreground">
              Track your progress with machine-based workouts, simple plans, and smart progression.
            </p>
          </div>

          <div className="mx-auto mt-6 flex w-full max-w-[320px] flex-col gap-3">
            {hasPlan ? (
              <>
                <Button asChild size="lg" className="h-12">
                  <Link href="/plan/current">View Current Plan</Link>
                </Button>
                <Button asChild variant="outline" className="h-12">
                  <Link href="/workout/session">Start Workout</Link>
                </Button>
                <Button asChild variant="outline" className="h-12">
                  <Link href="/plan/select">Change Plan</Link>
                </Button>
              </>
            ) : (
              <>
                <Button asChild size="lg" className="h-12">
                  <Link href="/plan/select">Select a Training Plan</Link>
                </Button>
                <div className="text-muted-foreground text-xs">or</div>
                <Button asChild variant="outline" className="h-12">
                  <Link href="/plan/create">Create Custom Plan</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
