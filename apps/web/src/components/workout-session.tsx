'use client';

import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  type AppData,
  type Exercise,
  getSuggestedWeight,
  loadAppData,
  loadPlan,
  saveAppData,
  type WorkoutExercise,
  type WorkoutPlan,
} from '@/lib/localStorage';
import { FileLoader } from '@/data/load';

// Helper function to determine the next workout
const getNextWorkoutType = (
  plan: WorkoutPlan,
  appData: AppData,
  date: Date,
  startDayOffset = 0
): string | null => {
  const dayOfWeek = date.getDay();

  // Start searching from today + offset
  for (let i = startDayOffset; i < 7 + startDayOffset; i++) {
    const nextDay = (dayOfWeek + i) % 7;
    if (plan.dayWorkouts[nextDay]) {
      return plan.dayWorkouts[nextDay];
    }
  }

  return null;
};

interface SetLog {
  reps: number;
  weight: number;
}

interface ExerciseLog {
  exerciseId: string;
  targetReps: number[];
  targetWeight: number;
  sets: SetLog[];
  effort: number;
  notes: string;
}

export function WorkoutSession() {
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);
  const [workoutType, setWorkoutType] = useState<string | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExercise[]>(
    []
  );
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [logs, setLogs] = useState<ExerciseLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);
  const [nextWorkout, setNextWorkout] = useState<{
    name: string;
    exercises: WorkoutExercise[];
  } | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    initializeSession();
  }, [searchParams]);

  const initializeSession = async () => {
    try {
      const appData = loadAppData();
      setCurrentPlanId(appData.currentPlanId);

      if (!appData.currentPlanId) {
        router.push('/');
        return;
      }

      // Load plan
      const plan = await loadPlan(appData.currentPlanId);
      if (!plan) {
        router.push('/');
        return;
      }

      const exercisesData = await FileLoader.loadExercises();
      setExercises(exercisesData);

      const sessionDateStr = searchParams.get('date');
      const sessionDate = sessionDateStr
        ? new Date(sessionDateStr)
        : new Date();

      // Get next workout type
      const nextWorkoutType = getNextWorkoutType(plan, appData, sessionDate, 0);
      if (!nextWorkoutType) {
        // Handle case where no workout is scheduled
        router.push('/'); // Or a page indicating no workout
        return;
      }
      setWorkoutType(nextWorkoutType);

      // Check if workout for the session date is already done
      const dateStr = sessionDate.toISOString().split('T')[0];
      const todaysLog = appData.logs.find(
        (log) => log.date === dateStr && log.workoutType === nextWorkoutType
      );
      if (todaysLog) {
        setAlreadyCompleted(true);

        // Find next workout for sneak peak
        const nextDate = new Date(sessionDate);
        nextDate.setDate(nextDate.getDate() + 1);
        const nextWorkoutTypeAfter = getNextWorkoutType(
          plan,
          appData,
          nextDate,
          0
        );
        if (nextWorkoutTypeAfter) {
          const nextWorkoutExercises =
            plan.workouts[nextWorkoutTypeAfter] || [];
          setNextWorkout({
            name: nextWorkoutTypeAfter,
            exercises: nextWorkoutExercises,
          });
        }

        setLoading(false);
        return;
      }

      // Use the determined workout type
      const workoutExercisesData = plan.workouts[nextWorkoutType] || [];
      setWorkoutExercises(workoutExercisesData);

      // Initialize logs with suggested weights
      const initialLogs = workoutExercisesData.map((exercise) => {
        // Find last log for this exercise to get suggestion
        const lastSession = appData.logs
          .filter((log) => log.workoutType === nextWorkoutType)
          .sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          )
          .find(() => true);

        const lastExerciseLog = lastSession?.exercises.find(
          (log) => log.exerciseId === exercise.exerciseId
        );
        const suggestedWeight = lastExerciseLog
          ? getSuggestedWeight(lastExerciseLog)
          : exercise.startingWeight;

        return {
          exerciseId: exercise.exerciseId,
          targetReps: exercise.targetReps,
          targetWeight: suggestedWeight,
          sets: exercise.targetReps.map((reps) => ({
            reps,
            weight: suggestedWeight,
          })),
          effort: 3,
          notes: '',
        };
      });

      setLogs(initialLogs);
    } catch (error) {
      console.error('Error initializing workout session:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateLog = (field: keyof ExerciseLog, value: any) => {
    const newLogs = [...logs];
    (newLogs[currentExerciseIndex] as any)[field] = value;
    setLogs(newLogs);
  };

  const updateSetLog = (
    setIndex: number,
    field: keyof SetLog,
    value: number
  ) => {
    const newLogs = [...logs];
    newLogs[currentExerciseIndex].sets[setIndex][field] = value;
    setLogs(newLogs);
  };

  const nextExercise = () => {
    if (currentExerciseIndex < workoutExercises.length - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
    }
  };

  const prevExercise = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(currentExerciseIndex - 1);
    }
  };

  const finishSession = () => {
    const appData = loadAppData();
    const sessionDateStr = searchParams.get('date');
    const sessionDate = sessionDateStr ? new Date(sessionDateStr) : new Date();

    // Create workout session log
    const sessionLog = {
      date: sessionDate.toISOString().split('T')[0],
      workoutType: workoutType || 'Unknown',
      exercises: logs,
    };

    // Add to logs
    appData.logs.push(sessionLog);
    appData.lastSessionDate = sessionLog.date;

    // Save to localStorage
    saveAppData(appData);

    // Redirect to history page
    router.push('/history');
  };

  const currentExercise = workoutExercises[currentExerciseIndex];
  const currentExerciseData = currentExercise
    ? exercises.find((e) => e.exerciseId === currentExercise.exerciseId)
    : null;
  const currentLog = logs[currentExerciseIndex];

  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-gray-900 border-b-2 dark:border-gray-100" />
      </div>
    );
  }

  if (alreadyCompleted) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Workout Already Completed</CardTitle>
            <CardDescription>
              You have already completed the workout for today. Great job!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/history')}>
              View History
            </Button>
          </CardContent>
        </Card>

        {nextWorkout && (
          <Card>
            <CardHeader>
              <CardTitle>Next Workout: {nextWorkout.name}</CardTitle>
              <CardDescription>
                Here's a sneak peek of your next session.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {nextWorkout.exercises.map((exercise, index) => (
                  <div
                    className="flex items-center justify-between rounded-lg bg-muted p-2"
                    key={index}
                  >
                    <h4 className="font-medium">
                      {exercises.find((e) => e.exerciseId === exercise.exerciseId)
                        ?.name || exercise.exerciseId}
                    </h4>
                    <p className="text-muted-foreground text-sm">
                      {exercise.targetReps.join(' / ')} reps
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  if (!(currentPlanId && workoutType) || workoutExercises.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Active Plan</CardTitle>
          <CardDescription>
            Please select or create a training plan to start a workout session.
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-2xl">Workout Session</h2>
        <div className="text-muted-foreground text-sm">
          Exercise {currentExerciseIndex + 1} of {workoutExercises.length}
        </div>
      </div>

      {currentExerciseData && currentLog && (
        <Card>
          <CardHeader>
            <CardTitle>{currentExerciseData.name}</CardTitle>
            <CardDescription>{currentExerciseData.equipments.join(', ')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <p className="text-muted-foreground text-sm">
                {currentExerciseData.instructions.join('\n')}
              </p>
            </div>

            <div className="space-y-4">
              {currentLog.sets.map((set, index) => (
                <div
                  className="grid grid-cols-2 items-center gap-4"
                  key={index}
                >
                  <div className="space-y-2">
                    <Label htmlFor={`weight-${index}`}>Weight (lbs)</Label>
                    <Input
                      id={`weight-${index}`}
                      onChange={(e) =>
                        updateSetLog(
                          index,
                          'weight',
                          Number.parseInt(e.target.value) || 0
                        )
                      }
                      type="number"
                      value={set.weight}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`reps-${index}`}>Reps</Label>
                    <Input
                      id={`reps-${index}`}
                      onChange={(e) =>
                        updateSetLog(
                          index,
                          'reps',
                          Number.parseInt(e.target.value) || 0
                        )
                      }
                      type="number"
                      value={set.reps}
                    />
                  </div>
                </div>
              ))}

              <div className="space-y-2">
                <Label>Effort Level</Label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <Button
                      className={
                        currentLog.effort >= level
                          ? 'text-yellow-500'
                          : 'text-gray-300'
                      }
                      key={level}
                      onClick={() => updateLog('effort', level)}
                      size="icon"
                      variant="ghost"
                    >
                      <Star className="h-6 w-6 fill-current" />
                    </Button>
                  ))}
                </div>
                <div className="text-muted-foreground text-xs">
                  1 = Easy, 5 = Maximum Effort
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  onChange={(e) => updateLog('notes', e.target.value)}
                  placeholder="How did that feel? Any observations?"
                  value={currentLog.notes}
                />
              </div>
            </div>

            <div className="flex justify-between">
              <Button
                disabled={currentExerciseIndex === 0}
                onClick={prevExercise}
                variant="outline"
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>

              {currentExerciseIndex === workoutExercises.length - 1 ? (
                <Button onClick={finishSession}>Finish Workout</Button>
              ) : (
                <Button onClick={nextExercise}>
                  Next Exercise
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
