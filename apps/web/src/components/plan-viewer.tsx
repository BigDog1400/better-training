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
import {
  type Exercise,
  loadAppData,
  loadPlan,
  type WorkoutPlan,
} from '@/lib/localStorage';
import { FileLoader } from '@/data/load';

export function PlanViewer() {
  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadPlanData();
  }, []);

  const loadPlanData = async () => {
    try {
      const appData = loadAppData();

      if (!appData.currentPlanId) {
        router.push('/plan/select');
        return;
      }

      // Load plan
      const planData = await loadPlan(appData.currentPlanId);
      if (!planData) {
        router.push('/plan/select');
        return;
      }

      setPlan(planData);

      // Load exercises
      const exercisesData = await FileLoader.loadExercises();
      setExercises(exercisesData);
    } catch (error) {
      console.error('Error loading plan data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getExerciseDetails = (exerciseId: string) => {
    return exercises.find((e) => e.exerciseId === exerciseId) || null;
  };

  const startWorkout = () => {
    router.push('/workout/session');
  };

  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-gray-900 border-b-2 dark:border-gray-100" />
      </div>
    );
  }

  if (!plan) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Active Plan</CardTitle>
          <CardDescription>
            Please select or create a training plan to view details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => router.push('/plan/select')}>
            Select Plan
          </Button>
        </CardContent>
      </Card>
    );
  }

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const scheduleDays = Object.entries(plan.dayWorkouts)
    .map(([day, workout]) => `${dayNames[Number.parseInt(day)]}: ${workout}`)
    .join(', ');

  return (
    <div className="space-y-6">
      <h2 className="font-bold text-2xl">Current Plan</h2>

      <Card>
        <CardHeader>
          <CardTitle>{plan.name}</CardTitle>
          <CardDescription>{plan.durationWeeks} weeks duration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-muted-foreground text-sm">
            Workout days: {scheduleDays}
          </div>

          <div className="space-y-4">
            {Object.entries(plan.workouts).map(([workoutName, exercises]) => (
              <div className="space-y-2" key={workoutName}>
                <h3 className="font-medium text-lg">{workoutName}</h3>
                <div className="space-y-2">
                  {exercises.map((exercise, index) => {
                    const exerciseDetails = getExerciseDetails(
                      exercise.exerciseId
                    );
                    return (
                      <div
                        className="flex items-center justify-between rounded-lg bg-muted p-3"
                        key={index}
                      >
                        <div>
                          <h4 className="font-medium">
                            {exerciseDetails?.name || exercise.exerciseId}
                          </h4>
                          <p className="text-muted-foreground text-sm">
                            {exercise.targetReps.join(' / ')} reps @{' '}
                            {exercise.startingWeight} lbs
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <Button className="w-full" onClick={startWorkout}>
              Start Workout Session
            </Button>
            <Button
              className="w-full"
              onClick={() => router.push('/history')}
              variant="outline"
            >
              View History
            </Button>
            <Button
              className="w-full"
              onClick={() => router.push('/workout/missing')}
              variant="outline"
            >
              Missing Sessions
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
