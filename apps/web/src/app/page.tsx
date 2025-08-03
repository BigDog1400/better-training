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
    <div className="container mx-auto max-w-3xl px-4 py-6">
      <div className="space-y-6 text-center">
        <pre className="overflow-x-auto font-mono text-sm">{TITLE_TEXT}</pre>
        <h1 className="font-bold text-3xl">Better Training</h1>
        <p className="mx-auto max-w-md text-muted-foreground">
          Track your gym progress with machine-based workouts, customizable
          plans, and smart progression recommendations.
        </p>

        <div className="mx-auto mt-8 flex max-w-xs flex-col gap-4">
          {hasPlan ? (
            <>
              <Button asChild size="lg">
                <Link href="/plan/current">View Current Plan</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/workout/session">Start Workout Session</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/plan/select">Change Plan</Link>
              </Button>
            </>
          ) : (
            <>
              <Button asChild size="lg">
                <Link href="/plan/select">Select a Training Plan</Link>
              </Button>
              <p className="text-muted-foreground text-sm">or</p>
              <Button asChild variant="outline">
                <Link href="/plan/create">Create Custom Plan</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
