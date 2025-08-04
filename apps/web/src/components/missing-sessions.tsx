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
import { loadAppData, loadPlan, type WorkoutPlan } from '@/lib/localStorage';

interface MissingSession {
  date: string;
  workoutType: string;
}

export function MissingSessions() {
  const [missingSessions, setMissingSessions] = useState<MissingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    findMissingSessions();
  }, []);

  const findMissingSessions = async () => {
    try {
      const appData = loadAppData();
      if (!appData.currentPlanId) {
        setLoading(false);
        return;
      }

      const plan = await loadPlan(appData.currentPlanId);
      if (!plan) {
        setLoading(false);
        return;
      }

      const today = new Date();
      const startDate = appData.planStartedAt
        ? new Date(appData.planStartedAt)
        : today;

      const loggedDates = new Set(appData.logs.map((log) => log.date));
      const missing: MissingSession[] = [];

      for (let d = startDate; d <= today; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        const dayOfWeek = d.getDay();
        const workoutType = plan.dayWorkouts[dayOfWeek];

        if (workoutType && !loggedDates.has(dateStr)) {
          missing.push({ date: dateStr, workoutType });
        }
      }

      setMissingSessions(missing);
    } catch (error) {
      console.error('Error finding missing sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const logMissingSession = (date: string) => {
    router.push(`/workout/session?date=${date}`);
  };

  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-gray-900 border-b-2 dark:border-gray-100" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Missing Workout Sessions</CardTitle>
        <CardDescription>
          Here are your scheduled workouts that you haven&apos;t logged since you
          started your plan.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {missingSessions.length === 0 ? (
          <p>No missing sessions found. Great job staying on track!</p>
        ) : (
          <div className="space-y-2">
            {missingSessions.map((session, index) => (
              <div
                className="flex items-center justify-between rounded-lg bg-muted p-3"
                key={index}
              >
                <div>
                  <h4 className="font-medium">{session.workoutType}</h4>
                  <p className="text-muted-foreground text-sm">
                    {session.date}
                  </p>
                </div>
                <Button onClick={() => logMissingSession(session.date)}>
                  Log Session
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
