"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { loadExercises, type Exercise, saveAppData, loadAppData } from "@/lib/localStorage";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";

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
  const [planName, setPlanName] = useState("");
  const [durationWeeks, setDurationWeeks] = useState(12);
  const [workoutDays, setWorkoutDays] = useState<WorkoutDay[]>([
    { day: 1, workoutName: "Mon Workout", exercises: [] },
    { day: 2, workoutName: "Tue Workout", exercises: [] },
    { day: 4, workoutName: "Thu Workout", exercises: [] },
    { day: 5, workoutName: "Fri Workout", exercises: [] }
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
      console.error("Error loading exercises:", error);
    } finally {
      setLoading(false);
    }
  };

  const addExerciseToWorkoutDay = (dayIndex: number, exerciseId: string) => {
    const exercise = exercises.find(e => e.id === exerciseId);
    if (exercise) {
      setWorkoutDays(workoutDays.map((workoutDay, index) => 
        index === dayIndex 
          ? { 
              ...workoutDay, 
              exercises: [
                ...workoutDay.exercises,
                {
                  ...exercise,
                  targetReps: [12, 12, 12],
                  startingWeight: 50,
                  sets: 3
                }
              ]
            }
          : workoutDay
      ));
    }
  };

  const removeExerciseFromWorkoutDay = (dayIndex: number, exerciseId: string) => {
    setWorkoutDays(workoutDays.map((workoutDay, index) => 
      index === dayIndex 
        ? { 
            ...workoutDay, 
            exercises: workoutDay.exercises.filter(e => e.id !== exerciseId)
          }
        : workoutDay
    ));
  };

  const copyExercisesToWorkoutDay = (sourceDayIndex: number, targetDayIndex: number) => {
    const sourceExercises = workoutDays[sourceDayIndex].exercises;
    setWorkoutDays(workoutDays.map((workoutDay, index) => 
      index === targetDayIndex 
        ? { 
            ...workoutDay, 
            exercises: sourceExercises.map(exercise => ({
              ...exercise
            }))
          }
        : workoutDay
    ));
  };

  const updateExerciseTarget = (dayIndex: number, exerciseId: string, field: 'targetReps' | 'startingWeight' | 'sets', value: number) => {
    setWorkoutDays(workoutDays.map((workoutDay, index) => 
      index === dayIndex 
        ? { 
            ...workoutDay, 
            exercises: workoutDay.exercises.map(exercise => 
              exercise.id === exerciseId 
                ? { ...exercise, [field]: field === 'targetReps' ? Array(exercise.sets).fill(value) : value }
                : exercise
            )
          }
        : workoutDay
    ));
  };

  const savePlan = () => {
    if (!planName.trim() || workoutDays.every(wd => wd.exercises.length === 0)) {
      alert("Please enter a plan name and add at least one exercise to any workout day");
      return;
    }

    // Generate a unique ID for the plan
    const planId = planName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    
    // Create the plan structure
    const workouts: { [key: string]: any[] } = {};
    
    // Build workouts object from workoutDays
    workoutDays.forEach(workoutDay => {
      if (!workouts[workoutDay.workoutName]) {
        workouts[workoutDay.workoutName] = [];
      }
      
      // Add exercises to workout
      workoutDay.exercises.forEach(exercise => {
        workouts[workoutDay.workoutName].push({
          exerciseId: exercise.id,
          targetReps: exercise.targetReps,
          startingWeight: exercise.startingWeight,
          sets: exercise.sets
        });
      });
    });
    
    const plan = {
      id: planId,
      name: planName,
      durationWeeks,
      dayWorkouts: workoutDays.reduce((acc, workoutDay) => {
        acc[workoutDay.day] = workoutDay.workoutName;
        return acc;
      }, {} as { [day: number]: string }),
      workouts
    };

    // Save to localStorage
    const appData = loadAppData();
    appData.currentPlanId = planId;
    
    // Save the plan to a file (in a real app, this would be saved to the filesystem)
    // For now, we'll just save it in localStorage with a special key
    try {
      localStorage.setItem(`betterTrainingPlan_${planId}`, JSON.stringify(plan));
      saveAppData(appData);
      router.push("/plan/current");
    } catch (error) {
      console.error("Error saving plan:", error);
      alert("Error saving plan");
    }
  };

  const updateWorkoutDay = (dayIndex: number, workoutName: string) => {
    setWorkoutDays(workoutDays.map((workoutDay, index) => 
      index === dayIndex 
        ? { ...workoutDay, workoutName: workoutName.trim() }
        : workoutDay
    ));
  };

  const addWorkoutDay = () => {
    const availableDays = [0, 1, 2, 3, 4, 5, 6].filter(day => 
      !workoutDays.some(wd => wd.day === day)
    );
    
    if (availableDays.length > 0) {
      setWorkoutDays([
        ...workoutDays,
        { day: availableDays[0], workoutName: "New Workout", exercises: [] }
      ]);
    }
  };

  const removeWorkoutDay = (dayIndex: number) => {
    setWorkoutDays(workoutDays.filter((_, index) => index !== dayIndex));
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Create Custom Plan</h2>
      
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
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              placeholder="e.g., My Custom Plan"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="durationWeeks">Duration (weeks)</Label>
            <Input
              id="durationWeeks"
              type="number"
              min="1"
              max="52"
              value={durationWeeks}
              onChange={(e) => setDurationWeeks(parseInt(e.target.value) || 12)}
            />
          </div>
          
          <div className="space-y-4">
            <Label>Workout Schedule</Label>
            {workoutDays.map((workoutDay, index) => (
              <div key={index} className="flex items-center gap-2">
                <Select value={dayNames[workoutDay.day]} onValueChange={(value) => {
                  const dayIndex = dayNames.indexOf(value);
                  if (dayIndex !== -1) {
                    setWorkoutDays(workoutDays.map((wd, i) => 
                      i === index ? { ...wd, day: dayIndex } : wd
                    ));
                  }
                }}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {dayNames.map(day => (
                      <SelectItem key={day} value={day}>{day}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Input
                  value={workoutDay.workoutName}
                  onChange={(e) => updateWorkoutDay(index, e.target.value)}
                  placeholder="Workout name"
                  className="flex-1"
                />
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeWorkoutDay(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            
            <Button onClick={addWorkoutDay} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
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
              <div key={dayIndex} className="space-y-4 p-4 border rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-lg">{dayNames[workoutDay.day]}:</span>
                  <Input
                    type="text"
                    value={workoutDay.workoutName}
                    onChange={(e) => updateWorkoutDay(dayIndex, e.target.value)}
                    className="h-8 text-lg font-medium flex-1"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Add Exercise</Label>
                  <Select onValueChange={(value) => addExerciseToWorkoutDay(dayIndex, value)} >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select an exercise to add" />
                    </SelectTrigger>
                    <SelectContent>
                      {exercises
                        .filter(e => !workoutDay.exercises.some(pe => pe.id === e.id))
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
                    {workoutDays.map((targetDay, targetIndex) => (
                      dayIndex !== targetIndex && (
                        <Button
                          key={targetIndex}
                          variant="outline"
                          size="sm"
                          onClick={() => copyExercisesToWorkoutDay(dayIndex, targetIndex)}
                          className="h-8 text-xs"
                        >
                          {dayNames[targetDay.day]}: {targetDay.workoutName}
                        </Button>
                      )
                    ))}
                  </div>
                )}
                
                {workoutDay.exercises.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Added Exercises</h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {workoutDay.exercises.map((exercise) => (
                        <div key={exercise.id} className="flex items-center gap-3 p-2 bg-background rounded border">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{exercise.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{exercise.machine} • {exercise.muscle}</p>
                          </div>
                          
                          <div className="flex gap-2 items-center flex-shrink-0">
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                min="1"
                                value={exercise.sets}
                                onChange={(e) => updateExerciseTarget(dayIndex, exercise.id, 'sets', parseInt(e.target.value) || 3)}
                                className="h-8 w-12 text-xs"
                                placeholder="Sets"
                              />
                              <span className="text-xs text-muted-foreground">sets</span>
                            </div>
                            
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                min="1"
                                value={exercise.targetReps[0] || 12}
                                onChange={(e) => updateExerciseTarget(dayIndex, exercise.id, 'targetReps', parseInt(e.target.value) || 12)}
                                className="h-8 w-12 text-xs"
                                placeholder="Reps"
                              />
                              <span className="text-xs text-muted-foreground">reps</span>
                            </div>
                            
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                min="1"
                                value={exercise.startingWeight}
                                onChange={(e) => updateExerciseTarget(dayIndex, exercise.id, 'startingWeight', parseInt(e.target.value) || 50)}
                                className="h-8 w-12 text-xs"
                                placeholder="Weight"
                              />
                              <span className="text-xs text-muted-foreground">lbs</span>
                            </div>
                            
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeExerciseFromWorkoutDay(dayIndex, exercise.id)}
                              className="h-8 w-8"
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
          

          
          <Button onClick={savePlan} className="w-full">
            Save Plan
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
