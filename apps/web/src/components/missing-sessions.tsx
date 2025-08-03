"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { loadAppData, loadPlan, type WorkoutPlan } from "@/lib/localStorage";
import { useRouter } from "next/navigation";

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

      const today = new Date()
      const startDate = appData.planStartedAt ? new Date(appData.planStartedAt) : today;

      const loggedDates = new Set(appData.logs.map(log => log.date));
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
      console.error("Error finding missing sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  const logMissingSession = (date: string) => {
    router.push(`/workout/session?date=${date}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Missing Workout Sessions</CardTitle>
        <CardDescription>
          Here are your scheduled workouts that you haven't logged since you started your plan.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {missingSessions.length === 0 ? (
          <p>No missing sessions found. Great job staying on track!</p>
        ) : (
          <div className="space-y-2">
            {missingSessions.map((session, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <div>
                  <h4 className="font-medium">{session.workoutType}</h4>
                  <p className="text-sm text-muted-foreground">{session.date}</p>
                </div>
                <Button onClick={() => logMissingSession(session.date)}>Log Session</Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
