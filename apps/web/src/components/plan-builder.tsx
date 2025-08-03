'use client';

import { Plus, Trash2 } from 'lucide-react';
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
  loadExercises,
  saveAppData,
} from '@/lib/localStorage';

interface PlanExercise extends Exercise {
  targetReps: number[];
  startingWeight: number;
  sets: number;
}

interface WorkoutDay {
  day: number;
  workoutName: string;
  exercises: PlanExercise[];
}

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function PlanBuilder() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [planName, setPlanName] = useState('');
  const [durationWeeks, setDurationWeeks] = useState(12);
  const [workoutDays, setWorkoutDays] = useState<WorkoutDay[]>([
    { day: 1, workoutName: 'Mon Workout', exercises: [] },
    { day: 2, workoutName: 'Tue Workout', exercises: [] },
    { day: 4, workoutName: 'Thu Workout', exercises: [] },
    { day: 5, workoutName: 'Fri Workout', exercises: [] },
  ]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadExercisesData();
  }, []);

  const loadExercisesData = async () => {
    try {
      const exerciseData = await loadExercises();
      setExercises(exerciseData);
    } catch (error) {
      console.error('Error loading exercises:', error);
    } finally {
      setLoading(false);
    }
  };

  const addExerciseToWorkoutDay = (dayIndex: number, exerciseId: string) => {
    const exercise = exercises.find((e) => e.id === exerciseId);
    if (exercise) {
      setWorkoutDays(
        workoutDays.map((workoutDay, index) =>
          index === dayIndex
            ? {
                ...workoutDay,
                exercises: [
                  ...workoutDay.exercises,
                  {
                    ...exercise,
                    targetReps: [12, 12, 12],
                    startingWeight: 50,
                    sets: 3,
                  },
                ],
              }
            : workoutDay
        )
      );
    }
  };

  const removeExerciseFromWorkoutDay = (
    dayIndex: number,
    exerciseId: string
  ) => {
    setWorkoutDays(
      workoutDays.map((workoutDay, index) =>
        index === dayIndex
          ? {
              ...workoutDay,
              exercises: workoutDay.exercises.filter(
                (e) => e.id !== exerciseId
              ),
            }
          : workoutDay
      )
    );
  };

  const copyExercisesToWorkoutDay = (
    sourceDayIndex: number,
    targetDayIndex: number
  ) => {
    const sourceExercises = workoutDays[sourceDayIndex].exercises;
    setWorkoutDays(
      workoutDays.map((workoutDay, index) =>
        index === targetDayIndex
          ? {
              ...workoutDay,
              exercises: sourceExercises.map((exercise) => ({
                ...exercise,
              })),
            }
          : workoutDay
      )
    );
  };

  const updateExerciseTarget = (
    dayIndex: number,
    exerciseId: string,
    field: 'targetReps' | 'startingWeight' | 'sets',
    value: number
  ) => {
    setWorkoutDays(
      workoutDays.map((workoutDay, index) =>
        index === dayIndex
          ? {
              ...workoutDay,
              exercises: workoutDay.exercises.map((exercise) =>
                exercise.id === exerciseId
                  ? {
                      ...exercise,
                      [field]:
                        field === 'targetReps'
                          ? Array(exercise.sets).fill(value)
                          : value,
                    }
                  : exercise
              ),
            }
          : workoutDay
      )
    );
  };

  const savePlan = () => {
    if (
      !planName.trim() ||
      workoutDays.every((wd) => wd.exercises.length === 0)
    ) {
      alert(
        'Please enter a plan name and add at least one exercise to any workout day'
      );
      return;
    }

    // Generate a unique ID for the plan
    const planId = planName
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');

    // Create the plan structure
    const workouts: { [key: string]: any[] } = {};

    // Build workouts object from workoutDays
    workoutDays.forEach((workoutDay) => {
      if (!workouts[workoutDay.workoutName]) {
        workouts[workoutDay.workoutName] = [];
      }

      // Add exercises to workout
      workoutDay.exercises.forEach((exercise) => {
        workouts[workoutDay.workoutName].push({
          exerciseId: exercise.id,
          targetReps: exercise.targetReps,
          startingWeight: exercise.startingWeight,
          sets: exercise.sets,
        });
      });
    });

    const plan = {
      id: planId,
      name: planName,
      durationWeeks,
      dayWorkouts: workoutDays.reduce(
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

    // Save the plan to a file (in a real app, this would be saved to the filesystem)
    // For now, we'll just save it in localStorage with a special key
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

  const updateWorkoutDay = (dayIndex: number, workoutName: string) => {
    setWorkoutDays(
      workoutDays.map((workoutDay, index) =>
        index === dayIndex
          ? { ...workoutDay, workoutName: workoutName.trim() }
          : workoutDay
      )
    );
  };

  const addWorkoutDay = () => {
    const availableDays = [0, 1, 2, 3, 4, 5, 6].filter(
      (day) => !workoutDays.some((wd) => wd.day === day)
    );

    if (availableDays.length > 0) {
      setWorkoutDays([
        ...workoutDays,
        { day: availableDays[0], workoutName: 'New Workout', exercises: [] },
      ]);
    }
  };

  const removeWorkoutDay = (dayIndex: number) => {
    setWorkoutDays(workoutDays.filter((_, index) => index !== dayIndex));
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-gray-900 border-b-2 dark:border-gray-100" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="font-bold text-2xl">Create Custom Plan</h2>

      <Card>
        <CardHeader>
          <CardTitle>Plan Details</CardTitle>
          <CardDescription>
            Set up your training plan configuration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="planName">Plan Name</Label>
            <Input
              id="planName"
              onChange={(e) => setPlanName(e.target.value)}
              placeholder="e.g., My Custom Plan"
              value={planName}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="durationWeeks">Duration (weeks)</Label>
            <Input
              id="durationWeeks"
              max="52"
              min="1"
              onChange={(e) =>
                setDurationWeeks(Number.parseInt(e.target.value) || 12)
              }
              type="number"
              value={durationWeeks}
            />
          </div>

          <div className="space-y-4">
            <Label>Workout Schedule</Label>
            {workoutDays.map((workoutDay, index) => (
              <div className="flex items-center gap-2" key={index}>
                <Select
                  onValueChange={(value) => {
                    const dayIndex = dayNames.indexOf(value);
                    if (dayIndex !== -1) {
                      setWorkoutDays(
                        workoutDays.map((wd, i) =>
                          i === index ? { ...wd, day: dayIndex } : wd
                        )
                      );
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
                  onChange={(e) => updateWorkoutDay(index, e.target.value)}
                  placeholder="Workout name"
                  value={workoutDay.workoutName}
                />

                <Button
                  onClick={() => removeWorkoutDay(index)}
                  size="icon"
                  variant="ghost"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}

            <Button onClick={addWorkoutDay} size="sm" variant="outline">
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
              <div
                className="space-y-4 rounded-lg border bg-muted/50 p-4"
                key={dayIndex}
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-lg">
                    {dayNames[workoutDay.day]}:
                  </span>
                  <Input
                    className="h-8 flex-1 font-medium text-lg"
                    onChange={(e) => updateWorkoutDay(dayIndex, e.target.value)}
                    type="text"
                    value={workoutDay.workoutName}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Add Exercise</Label>
                  <Select
                    onValueChange={(value) =>
                      addExerciseToWorkoutDay(dayIndex, value)
                    }
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select an exercise to add" />
                    </SelectTrigger>
                    <SelectContent>
                      {exercises
                        .filter(
                          (e) =>
                            !workoutDay.exercises.some((pe) => pe.id === e.id)
                        )
                        .map((exercise) => (
                          <SelectItem key={exercise.id} value={exercise.id}>
                            {exercise.name} ({exercise.muscle})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {workoutDays.length > 1 && (
                  <div className="flex flex-wrap gap-2">
                    <Label className="w-full">Copy to Day</Label>
                    {workoutDays.map(
                      (targetDay, targetIndex) =>
                        dayIndex !== targetIndex && (
                          <Button
                            className="h-8 text-xs"
                            key={targetIndex}
                            onClick={() =>
                              copyExercisesToWorkoutDay(dayIndex, targetIndex)
                            }
                            size="sm"
                            variant="outline"
                          >
                            {dayNames[targetDay.day]}: {targetDay.workoutName}
                          </Button>
                        )
                    )}
                  </div>
                )}

                {workoutDay.exercises.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Added Exercises</h4>
                    <div className="max-h-60 space-y-2 overflow-y-auto">
                      {workoutDay.exercises.map((exercise) => (
                        <div
                          className="flex items-center gap-3 rounded border bg-background p-2"
                          key={exercise.id}
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-sm">
                              {exercise.name}
                            </p>
                            <p className="truncate text-muted-foreground text-xs">
                              {exercise.machine} • {exercise.muscle}
                            </p>
                          </div>

                          <div className="flex flex-shrink-0 items-center gap-2">
                            <div className="flex items-center gap-1">
                              <Input
                                className="h-8 w-12 text-xs"
                                min="1"
                                onChange={(e) =>
                                  updateExerciseTarget(
                                    dayIndex,
                                    exercise.id,
                                    'sets',
                                    Number.parseInt(e.target.value) || 3
                                  )
                                }
                                placeholder="Sets"
                                type="number"
                                value={exercise.sets}
                              />
                              <span className="text-muted-foreground text-xs">
                                sets
                              </span>
                            </div>

                            <div className="flex items-center gap-1">
                              <Input
                                className="h-8 w-12 text-xs"
                                min="1"
                                onChange={(e) =>
                                  updateExerciseTarget(
                                    dayIndex,
                                    exercise.id,
                                    'targetReps',
                                    Number.parseInt(e.target.value) || 12
                                  )
                                }
                                placeholder="Reps"
                                type="number"
                                value={exercise.targetReps[0] || 12}
                              />
                              <span className="text-muted-foreground text-xs">
                                reps
                              </span>
                            </div>

                            <div className="flex items-center gap-1">
                              <Input
                                className="h-8 w-12 text-xs"
                                min="1"
                                onChange={(e) =>
                                  updateExerciseTarget(
                                    dayIndex,
                                    exercise.id,
                                    'startingWeight',
                                    Number.parseInt(e.target.value) || 50
                                  )
                                }
                                placeholder="Weight"
                                type="number"
                                value={exercise.startingWeight}
                              />
                              <span className="text-muted-foreground text-xs">
                                lbs
                              </span>
                            </div>

                            <Button
                              className="h-8 w-8"
                              onClick={() =>
                                removeExerciseFromWorkoutDay(
                                  dayIndex,
                                  exercise.id
                                )
                              }
                              size="icon"
                              variant="ghost"
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
            ))}
          </div>

          <Button className="w-full" onClick={savePlan}>
            Save Plan
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
