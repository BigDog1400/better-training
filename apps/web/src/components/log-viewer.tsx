'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { type Exercise, loadAppData, loadExercises } from '@/lib/localStorage';

interface LogViewerProps {
  limit?: number; // Show only the last N sessions
}

function exportToCSV(logs: any[], exercises: Exercise[]) {
  // Create a map of exercise IDs to names for quick lookup
  const exerciseMap = new Map(exercises.map((ex) => [ex.id, ex.name]));

  // CSV header
  const headers = [
    'Date',
    'Workout Type',
    'Exercise',
    'Set',
    'Target Reps',
    'Target Weight',
    'Actual Reps',
    'Actual Weight',
    'Effort',
    'Notes',
  ];

  // CSV rows
  const rows: string[] = [];

  logs.forEach((log) => {
    log.exercises.forEach((exercise: any) => {
      exercise.sets.forEach((set: any, index: number) => {
        rows.push(
          [
            log.date,
            log.workoutType,
            exerciseMap.get(exercise.exerciseId) || exercise.exerciseId,
            index + 1,
            exercise.targetReps[index] || exercise.targetReps[0],
            exercise.targetWeight,
            set.reps,
            set.weight,
            exercise.effort,
            `"${exercise.notes.replace(/"/g, '""')}"`, // Escape quotes in notes
          ].join(',')
        );
      });
    });
  });

  // Combine headers and rows
  const csvContent = [headers.join(','), ...rows].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'workout_logs.csv');
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function LogViewer({ limit }: LogViewerProps) {
  const [logs, setLogs] = useState<any[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const appData = loadAppData();
      const exercisesData = await loadExercises();
      setExercises(exercisesData);

      // Sort logs by date (newest first)
      const sortedLogs = [...appData.logs].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      // Apply limit if specified
      const limitedLogs = limit ? sortedLogs.slice(0, limit) : sortedLogs;
      setLogs(limitedLogs);
    } catch (error) {
      console.error('Error loading logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getExerciseName = (exerciseId: string) => {
    const exercise = exercises.find((e) => e.id === exerciseId);
    return exercise ? exercise.name : exerciseId;
  };

  const calculateProgressScore = (exercise: any) => {
    const totalActualReps = exercise.sets.reduce(
      (sum: number, set: any) => sum + set.reps,
      0
    );
    const totalTargetReps = exercise.targetReps.reduce(
      (sum: number, reps: number) => sum + reps,
      0
    );
    if (totalTargetReps === 0) return 0;
    const repRatio = totalActualReps / totalTargetReps;
    // Simple progress score: rep ratio * effort (normalized)
    const score = Math.round(repRatio * (exercise.effort / 5) * 100);
    return score;
  };

  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-gray-900 border-b-2 dark:border-gray-100" />
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>No Workout History</CardTitle>
              <CardDescription>
                You haven't completed any workout sessions yet.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Start a workout session to begin tracking your progress!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-2xl">Workout History</h2>
        {logs.length > 0 && (
          <Button
            onClick={() => exportToCSV(logs, exercises)}
            variant="outline"
          >
            Export to CSV
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {logs.map((log, index) => (
          <Card key={index}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{log.workoutType}</CardTitle>
                  <CardDescription>{log.date}</CardDescription>
                </div>
                <div className="text-muted-foreground text-sm">
                  {log.exercises.length} exercises
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {log.exercises.map((exercise: any, exIndex: number) => {
                  const progressScore = calculateProgressScore(exercise);

                  return (
                    <div
                      className="border-b pb-3 last:border-b-0 last:pb-0"
                      key={exIndex}
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">
                          {getExerciseName(exercise.exerciseId)}
                        </h3>
                        <span className="text-muted-foreground text-sm">
                          Score: {progressScore}%
                        </span>
                      </div>

                      {exercise.sets.map((set: any, setIndex: number) => (
                        <div
                          className="mt-2 grid grid-cols-3 gap-2 text-sm"
                          key={setIndex}
                        >
                          <div className="rounded bg-muted p-2">
                            <div className="text-muted-foreground">
                              Set {setIndex + 1} Target
                            </div>
                            <div>
                              {exercise.targetReps[setIndex] ||
                                exercise.targetReps[0]}{' '}
                              reps @ {exercise.targetWeight} lbs
                            </div>
                          </div>

                          <div className="rounded bg-muted p-2">
                            <div className="text-muted-foreground">
                              Set {setIndex + 1} Actual
                            </div>
                            <div>
                              {set.reps} reps @ {set.weight} lbs
                            </div>
                          </div>

                          <div className="rounded bg-muted p-2">
                            <div className="text-muted-foreground">Effort</div>
                            <div>{exercise.effort}/5 stars</div>
                          </div>
                        </div>
                      ))}

                      {exercise.notes && (
                        <div className="mt-2 text-sm">
                          <div className="text-muted-foreground">Notes:</div>
                          <div>{exercise.notes}</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
