'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { loadAppData } from '@/lib/localStorage';

export function Navigation() {
  const appData = loadAppData();
  const hasPlan = !!appData.currentPlanId;

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <Button asChild variant="outline">
            <Link href="/">Home</Link>
          </Button>

          <Button asChild variant="outline">
            <Link href="/plan/select">Select Plan</Link>
          </Button>

          <Button asChild variant="outline">
            <Link href="/plan/create">Create Plan</Link>
          </Button>

          <Button asChild disabled={!hasPlan} variant="outline">
            <Link href="/plan/current">Current Plan</Link>
          </Button>

          <Button asChild disabled={!hasPlan} variant="outline">
            <Link href="/workout/session">Start Workout</Link>
          </Button>

          <Button asChild variant="outline">
            <Link href="/history">History</Link>
          </Button>

          <Button asChild variant="outline">
            <Link href="/workout/missing">Missing Sessions</Link>
          </Button>

          <Button asChild variant="outline">
            <Link href="/progress">Progress</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
