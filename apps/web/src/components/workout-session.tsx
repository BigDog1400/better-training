'use client';

import { ChevronLeft, ChevronRight, Star, Plus, Trash2, Copy, Info } from 'lucide-react';
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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
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
  // Quick entry + numpad state
  const [qWeight, setQWeight] = useState<number | ''>('');
  const [qReps, setQReps] = useState<number | ''>('');
  const [qEffort, setQEffort] = useState<number>(3);
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
      // Seed quick entry from first exercise
      if (initialLogs[0]) {
        setQWeight(initialLogs[0].sets[0]?.weight ?? '');
        setQReps(initialLogs[0].sets[0]?.reps ?? '');
        setQEffort(initialLogs[0].effort ?? 3);
      }
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
      const nextIdx = currentExerciseIndex + 1;
      setCurrentExerciseIndex(nextIdx);
      const next = logs[nextIdx];
      if (next) {
        setQWeight(next.sets[0]?.weight ?? '');
        setQReps(next.sets[0]?.reps ?? '');
        setQEffort(next.effort ?? 3);
      }
    }
  };

  const prevExercise = () => {
    if (currentExerciseIndex > 0) {
      const prevIdx = currentExerciseIndex - 1;
      setCurrentExerciseIndex(prevIdx);
      const prev = logs[prevIdx];
      if (prev) {
        setQWeight(prev.sets[0]?.weight ?? '');
        setQReps(prev.sets[0]?.reps ?? '');
        setQEffort(prev.effort ?? 3);
      }
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

  // Quick entry helpers
  const sameAsLast = () => {
    if (!currentLog) return;
    const last = currentLog.sets[currentLog.sets.length - 1];
    if (!last) return;
    setQWeight(last.weight);
    setQReps(last.reps);
    setQEffort(currentLog.effort ?? 3);
  };

  const addQuickSet = () => {
    if (!currentLog) return;
    const w = Number(qWeight) || 0;
    const r = Number(qReps) || 0;
    if (w <= 0 || r <= 0) return;

    const nextLogs = [...logs];
    nextLogs[currentExerciseIndex] = {
      ...currentLog,
      sets: [...currentLog.sets, { weight: w, reps: r }],
      effort: qEffort,
    };
    setLogs(nextLogs);
    // Prefill same for speed
    setQWeight(w);
    setQReps(r);
  };

  const removeSet = (idx: number) => {
    const next = [...logs];
    next[currentExerciseIndex] = {
      ...currentLog!,
      sets: currentLog!.sets.filter((_, i) => i !== idx),
    };
    setLogs(next);
  };

  const duplicateSet = (idx: number) => {
    const s = currentLog?.sets[idx];
    if (!s) return;
    const next = [...logs];
    next[currentExerciseIndex] = {
      ...currentLog!,
      sets: [...currentLog!.sets, { ...s }],
    };
    setLogs(next);
  };

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
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-xl">{currentExerciseData.name}</CardTitle>
                <CardDescription>{currentExerciseData.equipments.join(', ')}</CardDescription>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {currentExercise?.targetReps?.join(' / ')} reps
              </div>
            </div>
            {/* Exercise animation (if available) */}
            <div className="mt-3">
              {/* We assume each media is named by the exerciseId with .gif extension under /public/media */}
              <div className="flex justify-center">
                {/* Render at native or small size to avoid pixelation for 180x180 sources */}
                <img
                  src={`/media/${currentExercise?.exerciseId}.gif`}
                  alt={`${currentExerciseData.name} demonstration`}
                  className="h-24 w-24 rounded-md border object-contain"
                  onError={(e) => {
                    // Hide media if the gif is missing
                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="howto" className="border-none">
                <AccordionTrigger className="py-0 text-sm text-muted-foreground">
                  <div className="inline-flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    How to perform (tap to expand)
                  </div>
                </AccordionTrigger>
                <AccordionContent className="whitespace-pre-line pt-2 text-sm text-muted-foreground">
                  {currentExerciseData.instructions.join('\n')}
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <div className="space-y-3">
              {/* Quick entry row */}
              <div className="rounded-lg border p-3">
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="mb-1 block text-xs text-muted-foreground" htmlFor="qweight">
                      Weight (lb)
                    </Label>
                    <Input
                      id="qweight"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="e.g. 50"
                      value={qWeight}
                      onChange={(e) => setQWeight(Number.parseInt(e.target.value) || '')}
                      className="h-12 text-base"
                    />
                  </div>
                  <div>
                    <Label className="mb-1 block text-xs text-muted-foreground" htmlFor="qreps">
                      Reps
                    </Label>
                    <Input
                      id="qreps"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="e.g. 12"
                      value={qReps}
                      onChange={(e) => setQReps(Number.parseInt(e.target.value) || '')}
                      className="h-12 text-base"
                    />
                  </div>
                  <div className="flex items-end justify-end">
                    <Button onClick={addQuickSet} className="h-12 w-full">
                      <Plus className="mr-2 h-4 w-4" /> Add Set
                    </Button>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">
                    Last same?{' '}
                    <Button variant="link" className="h-auto px-1 text-xs" onClick={sameAsLast}>
                      Use last
                    </Button>
                  </div>
                  <RadioGroup
                    className="flex items-center gap-1"
                    value={String(qEffort)}
                    onValueChange={(v) => setQEffort(Number(v))}
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <div
                        key={n}
                        className={cn(
                          'rounded-md border px-2 py-1 text-xs',
                          qEffort === n ? 'bg-primary text-primary-foreground' : 'bg-background'
                        )}
                      >
                        <RadioGroupItem className="sr-only" value={String(n)} id={`eff-${n}`} />
                        <label htmlFor={`eff-${n}`}>{n}</label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
                <div className="mt-1 text-[11px] text-muted-foreground">
                  Effort scale: 1 = Easy, 5 = Maximum Effort
                </div>
              </div>

              {/* Logged sets list - now inline editable */}
              <div className="space-y-2">
                {/* Column headers for clarity on small devices */}
                <div className="grid grid-cols-7 items-center gap-2 px-2 text-[11px] text-muted-foreground">
                  <div className="col-span-2">Set</div>
                  <div className="col-span-2">Weight (lb)</div>
                  <div className="col-span-2">Reps</div>
                  <div className="col-span-1 text-right">Actions</div>
                </div>
                {currentLog.sets.map((set, index) => (
                  <div key={index} className="rounded-md border p-2">
                    <div className="grid grid-cols-7 items-center gap-2">
                      <div className="col-span-2 text-sm">
                        #{index + 1}
                      </div>
                      <div className="col-span-2">
                        <Label className="sr-only" htmlFor={`item-weight-${index}`}>Weight (lb)</Label>
                        <Input
                          id={`item-weight-${index}`}
                          inputMode="numeric"
                          pattern="[0-9]*"
                          className="h-9"
                          value={set.weight}
                          onChange={(e) =>
                            updateSetLog(index, 'weight', Number.parseInt(e.target.value) || 0)
                          }
                          placeholder="e.g. 50"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label className="sr-only" htmlFor={`item-reps-${index}`}>Reps</Label>
                        <Input
                          id={`item-reps-${index}`}
                          inputMode="numeric"
                          pattern="[0-9]*"
                          className="h-9"
                          value={set.reps}
                          onChange={(e) =>
                            updateSetLog(index, 'reps', Number.parseInt(e.target.value) || 0)
                          }
                          placeholder="e.g. 12"
                        />
                      </div>
                      <div className="col-span-1 flex items-center justify-end gap-1">
                        <Button size="icon" variant="ghost" aria-label="Duplicate set" onClick={() => duplicateSet(index)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" aria-label="Delete set" onClick={() => removeSet(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="text-[11px] text-muted-foreground">
                  Tip: Adjust Weight (lb) and Reps for any set directly here.
                </div>
              </div>

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

            <div className="h-16" />
            <div className="fixed inset-x-0 bottom-16 z-40">
              <div className="mx-auto max-w-xl px-4">
                <div className="rounded-xl border bg-background/95 p-2 shadow-xl backdrop-blur supports-[backdrop-filter]:bg-background/60">
                  <div className="flex items-center justify-between gap-2">
                    <Button
                      disabled={currentExerciseIndex === 0}
                      onClick={prevExercise}
                      variant="outline"
                      className="flex-1"
                    >
                      <ChevronLeft className="mr-2 h-4 w-4" />
                      Previous
                    </Button>

                    {currentExerciseIndex === workoutExercises.length - 1 ? (
                      <Button onClick={finishSession} className="flex-[1.2]">
                        Finish Workout
                      </Button>
                    ) : (
                      <Button onClick={nextExercise} className="flex-[1.2]">
                        Save & Next
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Custom numpad removed per feedback */}
    </div>
  );
}
