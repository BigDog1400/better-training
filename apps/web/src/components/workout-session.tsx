"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { loadAppData, saveAppData, loadPlan, loadExercises, type Exercise, type WorkoutExercise, getSuggestedWeight } from "@/lib/localStorage";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";

interface ExerciseLog {
  exerciseId: string;
  targetReps: number;
  targetWeight: number;
  actualWeight: number;
  actualReps: number;
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
  const router = useRouter();

  useEffect(() => {
    initializeSession();
  }, []);

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

      // Get next workout type (simplified logic)
      setWorkoutType("FullBodyA"); // Default for now
      
      // Get workout exercises with suggestions
      const exercisesData = await loadExercises();
      setExercises(exercisesData);
      
      // For demo purposes, we'll use FullBodyA
      const workoutExercisesData = plan.workouts["FullBodyA"] || [];
      setWorkoutExercises(workoutExercisesData);
      
      // Initialize logs with suggested weights
      const initialLogs = workoutExercisesData.map(exercise => {
        // Find last log for this exercise to get suggestion
        const lastSession = appData.logs
          .filter(log => log.workoutType === "FullBodyA")
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .find(() => true);
        
        const lastExerciseLog = lastSession?.exercises.find(log => log.exerciseId === exercise.exerciseId);
        const suggestedWeight = lastExerciseLog ? getSuggestedWeight(lastExerciseLog) : exercise.startingWeight;
        
        return {
          exerciseId: exercise.exerciseId,
          targetReps: exercise.targetReps,
          targetWeight: suggestedWeight,
          actualWeight: suggestedWeight,
          actualReps: exercise.targetReps,
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
    
    // Create workout session log
    const sessionLog = {
      date: new Date().toISOString().split('T')[0],
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
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Target Reps</Label>
                <div className="p-2 bg-muted rounded-md text-center font-medium">
                  {currentLog.targetReps}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Target Weight</Label>
                <div className="p-2 bg-muted rounded-md text-center font-medium">
                  {currentLog.targetWeight} lbs
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="actualWeight">Actual Weight (lbs)</Label>
                <Input
                  id="actualWeight"
                  type="number"
                  value={currentLog.actualWeight}
                  onChange={(e) => updateLog('actualWeight', parseInt(e.target.value) || 0)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="actualReps">Actual Reps</Label>
                <Input
                  id="actualReps"
                  type="number"
                  value={currentLog.actualReps}
                  onChange={(e) => updateLog('actualReps', parseInt(e.target.value) || 0)}
                />
              </div>
              
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
