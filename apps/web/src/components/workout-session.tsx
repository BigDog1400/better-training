"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { loadAppData, saveAppData, loadPlan, loadExercises, type Exercise, type WorkoutExercise, getSuggestedWeight, type WorkoutPlan, type AppData } from "@/lib/localStorage";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";

// Helper function to determine the next workout
const getNextWorkoutType = (plan: WorkoutPlan, appData: AppData, date: Date, startDayOffset = 0): string | null => {
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
  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExercise[]>([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [logs, setLogs] = useState<ExerciseLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);
  const [nextWorkout, setNextWorkout] = useState<{ name: string; exercises: WorkoutExercise[] } | null>(null);
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
        router.push("/");
        return;
      }

      // Load plan
      const plan = await loadPlan(appData.currentPlanId);
      if (!plan) {
        router.push("/");
        return;
      }

      const sessionDateStr = searchParams.get('date');
      const sessionDate = sessionDateStr ? new Date(sessionDateStr) : new Date();
      
      // Get next workout type
      const nextWorkoutType = getNextWorkoutType(plan, appData, sessionDate, 0);
      if (!nextWorkoutType) {
        // Handle case where no workout is scheduled
        router.push("/"); // Or a page indicating no workout
        return;
      }
      setWorkoutType(nextWorkoutType);

      // Check if workout for the session date is already done
      const dateStr = sessionDate.toISOString().split('T')[0];
      const todaysLog = appData.logs.find(log => log.date === dateStr && log.workoutType === nextWorkoutType);
      if (todaysLog) {
        setAlreadyCompleted(true);
        
        // Find next workout for sneak peak
        const nextDate = new Date(sessionDate);
        nextDate.setDate(nextDate.getDate() + 1);
        const nextWorkoutTypeAfter = getNextWorkoutType(plan, appData, nextDate, 0);
        if (nextWorkoutTypeAfter) {
          const nextWorkoutExercises = plan.workouts[nextWorkoutTypeAfter] || [];
          setNextWorkout({ name: nextWorkoutTypeAfter, exercises: nextWorkoutExercises });
        }
        
        setLoading(false);
        return;
      }
      
      // Get workout exercises with suggestions
      const exercisesData = await loadExercises();
      setExercises(exercisesData);
      
      // Use the determined workout type
      const workoutExercisesData = plan.workouts[nextWorkoutType] || [];
      setWorkoutExercises(workoutExercisesData);
      
      // Initialize logs with suggested weights
      const initialLogs = workoutExercisesData.map(exercise => {
        // Find last log for this exercise to get suggestion
        const lastSession = appData.logs
          .filter(log => log.workoutType === nextWorkoutType)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .find(() => true);
        
        const lastExerciseLog = lastSession?.exercises.find(log => log.exerciseId === exercise.exerciseId);
        const suggestedWeight = lastExerciseLog ? getSuggestedWeight(lastExerciseLog) : exercise.startingWeight;
        
        return {
          exerciseId: exercise.exerciseId,
          targetReps: exercise.targetReps,
          targetWeight: suggestedWeight,
          sets: exercise.targetReps.map(reps => ({ reps, weight: suggestedWeight })),
          effort: 3,
          notes: ""
        };
      });
      
      setLogs(initialLogs);
    } catch (error) {
      console.error("Error initializing workout session:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateLog = (field: keyof ExerciseLog, value: any) => {
    const newLogs = [...logs];
    (newLogs[currentExerciseIndex] as any)[field] = value;
    setLogs(newLogs);
  };

  const updateSetLog = (setIndex: number, field: keyof SetLog, value: number) => {
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
      workoutType: workoutType || "Unknown",
      exercises: logs
    };
    
    // Add to logs
    appData.logs.push(sessionLog);
    appData.lastSessionDate = sessionLog.date;
    
    // Save to localStorage
    saveAppData(appData);
    
    // Redirect to history page
    router.push("/history");
  };

  const currentExercise = workoutExercises[currentExerciseIndex];
  const currentExerciseData = currentExercise ? exercises.find(e => e.id === currentExercise.exerciseId) : null;
  const currentLog = logs[currentExerciseIndex];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
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
            <Button onClick={() => router.push("/history")}>
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
                  <div key={index} className="flex justify-between items-center p-2 bg-muted rounded-lg">
                    <h4 className="font-medium">{exercises.find(e => e.id === exercise.exerciseId)?.name || exercise.exerciseId}</h4>
                    <p className="text-sm text-muted-foreground">
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

  if (!currentPlanId || !workoutType || workoutExercises.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Active Plan</CardTitle>
          <CardDescription>
            Please select or create a training plan to start a workout session.
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Workout Session</h2>
        <div className="text-sm text-muted-foreground">
          Exercise {currentExerciseIndex + 1} of {workoutExercises.length}
        </div>
      </div>
      
      {currentExerciseData && currentLog && (
        <Card>
          <CardHeader>
            <CardTitle>{currentExerciseData.name}</CardTitle>
            <CardDescription>
              {currentExerciseData.machine}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {currentExerciseData.instructions}
              </p>
            </div>
            
      
            <div className="space-y-4">
              {currentLog.sets.map((set, index) => (
                <div key={index} className="grid grid-cols-2 gap-4 items-center">
                  <div className="space-y-2">
                    <Label htmlFor={`weight-${index}`}>Weight (lbs)</Label>
                    <Input
                      id={`weight-${index}`}
                      type="number"
                      value={set.weight}
                      onChange={(e) => updateSetLog(index, 'weight', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`reps-${index}`}>Reps</Label>
                    <Input
                      id={`reps-${index}`}
                      type="number"
                      value={set.reps}
                      onChange={(e) => updateSetLog(index, 'reps', parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>
              ))}
              
              <div className="space-y-2">
                <Label>Effort Level</Label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <Button
                      key={level}
                      variant="ghost"
                      size="icon"
                      onClick={() => updateLog('effort', level)}
                      className={currentLog.effort >= level ? "text-yellow-500" : "text-gray-300"}
                    >
                      <Star className="h-6 w-6 fill-current" />
                    </Button>
                  ))}
                </div>
                <div className="text-xs text-muted-foreground">
                  1 = Easy, 5 = Maximum Effort
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={currentLog.notes}
                  onChange={(e) => updateLog('notes', e.target.value)}
                  placeholder="How did that feel? Any observations?"
                />
              </div>
            </div>
            
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={prevExercise}
                disabled={currentExerciseIndex === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              
              {currentExerciseIndex === workoutExercises.length - 1 ? (
                <Button onClick={finishSession}>
                  Finish Workout
                </Button>
              ) : (
                <Button onClick={nextExercise}>
                  Next Exercise
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
