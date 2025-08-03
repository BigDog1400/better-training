"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { loadAppData, loadPlan, loadExercises, type Exercise, type WorkoutPlan } from "@/lib/localStorage";
import { useRouter } from "next/navigation";

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
        router.push("/plan/select");
        return;
      }

      // Load plan
      const planData = await loadPlan(appData.currentPlanId);
      if (!planData) {
        router.push("/plan/select");
        return;
      }

      setPlan(planData);
      
      // Load exercises
      const exercisesData = await loadExercises();
      setExercises(exercisesData);
    } catch (error) {
      console.error("Error loading plan data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getExerciseDetails = (exerciseId: string) => {
    return exercises.find(e => e.id === exerciseId) || null;
  };

  const startWorkout = () => {
    router.push("/workout/session");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
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
          <Button onClick={() => router.push("/plan/select")}>
            Select Plan
          </Button>
        </CardContent>
      </Card>
    );
  }

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const scheduleDays = Object.entries(plan.dayWorkouts)
    .map(([day, workout]) => `${dayNames[parseInt(day)]}: ${workout}`)
    .join(', ');

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Current Plan</h2>
      
      <Card>
        <CardHeader>
          <CardTitle>{plan.name}</CardTitle>
          <CardDescription>
            {plan.durationWeeks} weeks duration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Workout days: {scheduleDays}
          </div>
          
          <div className="space-y-4">
            {Object.entries(plan.workouts).map(([workoutName, exercises]) => (
              <div key={workoutName} className="space-y-2">
                <h3 className="font-medium text-lg">{workoutName}</h3>
                <div className="space-y-2">
                  {exercises.map((exercise, index) => {
                    const exerciseDetails = getExerciseDetails(exercise.exerciseId);
                    return (
                      <div key={index} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                        <div>
                          <h4 className="font-medium">{exerciseDetails?.name || exercise.exerciseId}</h4>
                          <p className="text-sm text-muted-foreground">
                            {exercise.targetReps.join(' / ')} reps @ {exercise.startingWeight} lbs
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button onClick={startWorkout} className="w-full">
              Start Workout Session
            </Button>
            <Button onClick={() => router.push('/history')} className="w-full" variant="outline">
              View History
            </Button>
            <Button onClick={() => router.push('/workout/missing')} className="w-full" variant="outline">
              Missing Sessions
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
