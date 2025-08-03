'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { WorkoutPlan } from '@/lib/localStorage';
import {
  loadAppData,
  loadAvailablePlans,
  saveAppData,
} from '@/lib/localStorage';

export function PlanSelector() {
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const availablePlans = await loadAvailablePlans();
      setPlans(availablePlans);
    } catch (error) {
      console.error('Error loading plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectPlan = (planId: string) => {
    const appData = loadAppData();
    appData.currentPlanId = planId;
    appData.planStartedAt = new Date().toISOString();
    saveAppData(appData);
    router.push('/plan/current');
  };

  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-gray-900 border-b-2 dark:border-gray-100" />
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
        <h3 className="font-bold text-2xl">No Plans Available</h3>
        <p className="text-muted-foreground mt-2">
          Create a new plan to get started.
        </p>
        <Button
          className="mt-4"
          onClick={() => router.push('/plan/create')}
          variant="outline"
        >
          Create New Plan
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="font-bold text-2xl">Select a Training Plan</h2>
      <p className="text-muted-foreground">
        Choose from pre-built plans or create your own custom plan.
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        {plans.map((plan) => (
          <Card className="transition-shadow hover:shadow-md" key={plan.id}>
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>
                {plan.durationWeeks} weeks duration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Workout days:{' '}
                {Object.entries(plan.dayWorkouts)
                  .map(
                    ([day, workout]) =>
                      `${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][Number.parseInt(day)]}: ${workout}`
                  )
                  .join(', ')}
              </p>
              <Button className="w-full" onClick={() => selectPlan(plan.id)}>
                Select Plan
              </Button>
            </CardContent>
          </Card>
        ))}

        <Card className="transition-shadow hover:shadow-md">
          <CardHeader>
            <CardTitle>Custom Plan</CardTitle>
            <CardDescription>
              Create your own personalized training plan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full"
              onClick={() => router.push('/plan/create')}
              variant="outline"
            >
              Create New Plan
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
