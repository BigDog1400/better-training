/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2, Copy } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { useFieldArray, useForm, type FieldArrayWithId } from 'react-hook-form';
import { z } from 'zod';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  type Exercise,
  loadAppData,
  saveAppData,
} from '@/lib/localStorage';
import { FileLoader } from '@/data/load';
import { ExerciseSelector } from './exercise-selector';

// Zod Schemas for form validation
const planExerciseSchema = z.object({
  exerciseId: z.string(),
  name: z.string(),
  targetMuscles: z.array(z.string()),
  equipments: z.array(z.string()),
  targetReps: z.array(z.number().min(1)),
  startingWeight: z.number().min(0),
  sets: z.number().min(1),
});

const workoutDaySchema = z.object({
  day: z.number().min(0).max(6),
  workoutName: z.string().min(1, 'Workout name is required'),
  exercises: z.array(planExerciseSchema),
});

const planBuilderSchema = z.object({
  planName: z.string().min(1, 'Plan name is required'),
  durationWeeks: z.number().min(1).max(52),
  workoutDays: z.array(workoutDaySchema).min(1, 'At least one workout day is required'),
});

type PlanBuilderFormValues = z.infer<typeof planBuilderSchema>;
type PlanExercise = z.infer<typeof planExerciseSchema>;

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function PlanBuilder() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const form = useForm<PlanBuilderFormValues>({
    resolver: zodResolver(planBuilderSchema),
    defaultValues: {
      planName: '',
      durationWeeks: 12,
      workoutDays: [
        { day: 1, workoutName: 'Mon Workout', exercises: [] },
        { day: 2, workoutName: 'Tue Workout', exercises: [] },
        { day: 4, workoutName: 'Thu Workout', exercises: [] },
        { day: 5, workoutName: 'Fri Workout', exercises: [] },
      ],
    },
  });

  const { fields: workoutDays, append, remove, update } = useFieldArray({
    control: form.control,
    name: 'workoutDays',
  });

  // Mobile speed helpers
  const [defaultSets, setDefaultSets] = useState(3);
  const [defaultReps, setDefaultReps] = useState(12);
  const [defaultWeight, setDefaultWeight] = useState(50);

  useEffect(() => {
    loadExercisesData();
  }, []);

  const loadExercisesData = async () => {
    try {
      const exerciseData = await FileLoader.loadExercises();
      setExercises(exerciseData);
    } catch (error) {
      console.error('Error loading exercises:', error);
    } finally {
      setLoading(false);
    }
  };

  const addExerciseToWorkoutDay = (dayIndex: number, exercise: Exercise) => {
    if (exercise) {
      const workoutDay = form.getValues(`workoutDays.${dayIndex}`);
      const newExercise: PlanExercise = {
        ...exercise,
        targetReps: Array(defaultSets).fill(defaultReps),
        startingWeight: defaultWeight,
        sets: defaultSets,
      };
      update(dayIndex, {
        ...workoutDay,
        exercises: [...workoutDay.exercises, newExercise],
      });
    }
  };


  const copyExercisesToWorkoutDay = (
    sourceDayIndex: number,
    targetDayIndex: number
  ) => {
    const sourceExercises = form.getValues(`workoutDays.${sourceDayIndex}.exercises`);
    const targetWorkoutDay = form.getValues(`workoutDays.${targetDayIndex}`);
    update(targetDayIndex, {
      ...targetWorkoutDay,
      exercises: sourceExercises.map((exercise) => ({ ...exercise })),
    });
  };

  const onSubmit = (data: PlanBuilderFormValues) => {
    // Generate a unique ID for the plan
    const planId = data.planName
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');

    // Create the plan structure
    const workouts: { [key: string]: any[] } = {};
    data.workoutDays.forEach((workoutDay) => {
      if (!workouts[workoutDay.workoutName]) {
        workouts[workoutDay.workoutName] = [];
      }
      workoutDay.exercises.forEach((exercise) => {
        workouts[workoutDay.workoutName].push({
          exerciseId: exercise.exerciseId,
          targetReps: exercise.targetReps,
          startingWeight: exercise.startingWeight,
          sets: exercise.sets,
        });
      });
    });

    const plan = {
      id: planId,
      name: data.planName,
      durationWeeks: data.durationWeeks,
      dayWorkouts: data.workoutDays.reduce(
        (acc, workoutDay) => {
          acc[workoutDay.day] = workoutDay.workoutName;
          return acc;
        },
        {} as { [day: number]: string }
      ),
      workouts,
    };

    // Save to localStorage
    const appData = loadAppData();
    appData.currentPlanId = planId;

    try {
      localStorage.setItem(
        `betterTrainingPlan_${planId}`,
        JSON.stringify(plan)
      );
      saveAppData(appData);
      router.push('/plan/current');
    } catch (error) {
      console.error('Error saving plan:', error);
      alert('Error saving plan');
    }
  };

  const addWorkoutDay = () => {
    const currentDays = form.getValues('workoutDays').map((wd) => wd.day);
    const availableDays = [0, 1, 2, 3, 4, 5, 6].filter(
      (day) => !currentDays.includes(day)
    );

    if (availableDays.length > 0) {
      append({
        day: availableDays[0],
        workoutName: 'New Workout',
        exercises: [],
      });
    }
  };

  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-gray-900 border-b-2 dark:border-gray-100" />
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <h2 className="font-bold text-2xl">
        <FormattedMessage
          id="m6Xoby"
          defaultMessage="Create Custom Plan"
        />
      </h2>

      <Card>
        <CardHeader>
          <CardTitle>Plan Details</CardTitle>
          <CardDescription>
            Set up your training plan configuration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick presets for mobile: defaults that apply to newly added exercises */}
          <div className="rounded-lg border p-3">
            <div className="mb-2 text-xs font-medium text-foreground">Defaults for new exercises</div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="mb-1 block text-xs" htmlFor="defSets">Sets</Label>
                <Input
                  id="defSets"
                  type="number"
                  inputMode="numeric"
                  min="1"
                  className="h-10"
                  value={defaultSets}
                  onChange={(e) => setDefaultSets(Number.parseInt(e.target.value) || 1)}
                />
              </div>
              <div>
                <Label className="mb-1 block text-xs" htmlFor="defReps">Reps</Label>
                <Input
                  id="defReps"
                  type="number"
                  inputMode="numeric"
                  min="1"
                  className="h-10"
                  value={defaultReps}
                  onChange={(e) => setDefaultReps(Number.parseInt(e.target.value) || 1)}
                />
              </div>
              <div>
                <Label className="mb-1 block text-xs" htmlFor="defWeight">Weight (lb)</Label>
                <Input
                  id="defWeight"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  className="h-10"
                  value={defaultWeight}
                  onChange={(e) => setDefaultWeight(Number.parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground">These values are used when you tap to add an exercise.</div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="planName">Plan Name</Label>
            <Input
              id="planName"
              placeholder="e.g., My Custom Plan"
              {...form.register('planName')}
            />
            {form.formState.errors.planName && (
              <p className="text-sm text-red-500">{form.formState.errors.planName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="durationWeeks">Duration (weeks)</Label>
            <Input
              id="durationWeeks"
              max="52"
              min="1"
              type="number"
              {...form.register('durationWeeks', { valueAsNumber: true })}
            />
            {form.formState.errors.durationWeeks && (
              <p className="text-sm text-red-500">{form.formState.errors.durationWeeks.message}</p>
            )}
          </div>

          <div className="space-y-4">
            <Label>Workout Schedule</Label>
            {workoutDays.map((workoutDay, index) => (
              <div className="flex items-center gap-2" key={workoutDay.id}>
                <Select
                  onValueChange={(value) => {
                    const dayIndex = dayNames.indexOf(value);
                    if (dayIndex !== -1) {
                      update(index, { ...workoutDay, day: dayIndex });
                    }
                  }}
                  value={dayNames[workoutDay.day]}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {dayNames.map((day) => (
                      <SelectItem key={day} value={day}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input
                  className="flex-1"
                  placeholder="Workout name"
                  {...form.register(`workoutDays.${index}.workoutName`)}
                />

                <Button
                  onClick={() => remove(index)}
                  size="icon"
                  variant="ghost"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
             {form.formState.errors.workoutDays && (
              <p className="text-sm text-red-500">{form.formState.errors.workoutDays.message}</p>
            )}

            <Button onClick={addWorkoutDay} size="sm" variant="outline" type="button">
              <Plus className="mr-2 h-4 w-4" />
              Add Workout Day
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add Exercises</CardTitle>
          <CardDescription>
            Select exercises and set target reps and starting weights
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-6">
            {workoutDays.map((workoutDay, dayIndex) => (
              <WorkoutDayCard
                key={workoutDay.id}
                dayIndex={dayIndex}
                workoutDay={workoutDay}
                form={form}
                addExerciseToWorkoutDay={addExerciseToWorkoutDay}
                copyExercisesToWorkoutDay={copyExercisesToWorkoutDay}
              />
            ))}
          </div>

          <Button className="w-full" type="submit">
            Save Plan
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}

import type { UseFormReturn } from 'react-hook-form';

interface WorkoutDayCardProps {
  dayIndex: number;
  workoutDay: FieldArrayWithId<PlanBuilderFormValues, "workoutDays", "id">;
  form: UseFormReturn<PlanBuilderFormValues>;
  addExerciseToWorkoutDay: (dayIndex: number, exercise: Exercise) => void;
  copyExercisesToWorkoutDay: (sourceDayIndex: number, targetDayIndex: number) => void;
}

function WorkoutDayCard({
  dayIndex,
  workoutDay,
  form,
  addExerciseToWorkoutDay,
  copyExercisesToWorkoutDay,
}: WorkoutDayCardProps) {
  const { fields: exercises, remove: removeExercise } = useFieldArray({
    control: form.control,
    name: `workoutDays.${dayIndex}.exercises`,
  });

  return (
    <div
      className="space-y-4 rounded-lg border bg-card p-4 shadow-sm"
      key={workoutDay.id}
    >
      <div className="flex items-center gap-2">
        <span className="font-medium text-lg">
          {dayNames[workoutDay.day]}:
        </span>
        <Input
          className="h-8 flex-1 font-medium text-lg"
          type="text"
          {...form.register(`workoutDays.${dayIndex}.workoutName`)}
        />
      </div>

      <div className="space-y-2">
        <Label className="text-foreground">Add Exercise</Label>
        <ExerciseSelector
          onSelect={(exercise) => addExerciseToWorkoutDay(dayIndex, exercise)}
          selectedIds={exercises.map((e) => e.exerciseId)}
        />
        <div className="mt-2 flex flex-wrap gap-2">
          {dayIndex > 0 && form.getValues(`workoutDays.${dayIndex - 1}.exercises`)?.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs"
              onClick={() => copyExercisesToWorkoutDay(dayIndex - 1, dayIndex)}
              type="button"
            >
              <Copy className="mr-1 h-3 w-3" />
              Copy from previous day
            </Button>
          )}
          <span className="text-[11px] text-muted-foreground">
            New exercises use your Defaults (Sets/Reps/Weight) above.
          </span>
        </div>
      </div>

      {form.getValues('workoutDays').length > 1 && (
        <div className="flex flex-wrap gap-2">
          <Label className="w-full">Copy to Day</Label>
          {form.getValues('workoutDays').map(
            (targetDay, targetIndex) =>
              dayIndex !== targetIndex && (
                <Button
                  className="h-8 text-xs"
                  key={targetDay.day}
                  onClick={() => copyExercisesToWorkoutDay(dayIndex, targetIndex)}
                  size="sm"
                  variant="outline"
                  type="button"
                >
                  {dayNames[targetDay.day]}: {targetDay.workoutName}
                </Button>
              )
          )}
        </div>
      )}

      {exercises.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-foreground font-medium text-sm">Added Exercises</h4>
          <div className="space-y-2">
            {exercises.map((exercise, exerciseIndex) => (
              <div
                className="flex flex-col gap-3 rounded-lg border bg-background p-3 shadow-sm sm:flex-row sm:items-center"
                key={exercise.id}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-foreground font-medium text-sm">
                    {exercise.name}
                  </p>
                  <p className="truncate text-muted-foreground text-xs">
                    {exercise.equipments.join(', ')} • {exercise.targetMuscles.join(', ')}
                  </p>
                  <div className="mt-2 grid grid-cols-3 gap-2 sm:items-center">
                    <div className="flex items-center gap-1">
                      <Input
                        className="h-10 w-20 text-base bg-card border-foreground/20 text-foreground tracking-wide text-center sm:w-24"
                        min="1"
                        inputMode="numeric"
                        type="number"
                        {...form.register(`workoutDays.${dayIndex}.exercises.${exerciseIndex}.sets`, { valueAsNumber: true })}
                      />
                      <span className="text-foreground/80 text-xs">sets</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Input
                        className="h-10 w-24 text-base bg-card border-foreground/20 text-foreground tracking-wide"
                        min="1"
                        inputMode="numeric"
                        type="number"
                        {...form.register(`workoutDays.${dayIndex}.exercises.${exerciseIndex}.targetReps.0`, { valueAsNumber: true })}
                      />
                      <span className="text-foreground/80 text-xs">reps</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Input
                        className="h-10 w-24 text-base bg-card border-foreground/20 text-foreground tracking-wide text-center sm:w-28"
                        min="0"
                        inputMode="decimal"
                        type="number"
                        {...form.register(`workoutDays.${dayIndex}.exercises.${exerciseIndex}.startingWeight`, { valueAsNumber: true })}
                      />
                      <span className="text-foreground/80 text-xs">lb</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-shrink-0 items-center gap-2 self-start sm:self-auto">
                  <Button
                    className="h-8 w-8 text-foreground"
                    onClick={() => removeExercise(exerciseIndex)}
                    size="icon"
                    variant="ghost"
                    type="button"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
