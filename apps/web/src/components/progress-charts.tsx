'use client';

import { useEffect, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { type Exercise, loadAppData, loadExercises } from '@/lib/localStorage';

export function ProgressCharts() {
  const [logs, setLogs] = useState<any[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const appData = loadAppData();
      const exercisesData = await loadExercises();
      setExercises(exercisesData);

      // Sort logs by date (oldest first for charting)
      const sortedLogs = [...appData.logs].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      setLogs(sortedLogs);

      // Set default exercise to first one in the first log
      if (sortedLogs.length > 0 && sortedLogs[0].exercises.length > 0) {
        setSelectedExercise(sortedLogs[0].exercises[0].exerciseId);
      }
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

  // Prepare data for weight progression chart
  const weightProgressionData = () => {
    if (!selectedExercise || logs.length === 0) return [];

    const data: { date: string; weight: number }[] = [];

    logs.forEach((log) => {
      log.exercises.forEach((exercise: any) => {
        if (exercise.exerciseId === selectedExercise) {
          data.push({
            date: log.date,
            weight: exercise.actualWeight,
          });
        }
      });
    });

    return data;
  };

  // Prepare data for effort chart
  const effortData = () => {
    if (!selectedExercise || logs.length === 0) return [];

    const data: { date: string; effort: number }[] = [];

    logs.forEach((log) => {
      log.exercises.forEach((exercise: any) => {
        if (exercise.exerciseId === selectedExercise) {
          data.push({
            date: log.date,
            effort: exercise.effort,
          });
        }
      });
    });

    return data;
  };

  // Get all unique exercise IDs from logs
  const getAllExerciseIds = () => {
    const exerciseIds = new Set<string>();
    logs.forEach((log) => {
      log.exercises.forEach((exercise: any) => {
        exerciseIds.add(exercise.exerciseId);
      });
    });
    return Array.from(exerciseIds);
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
          <CardTitle>No Progress Data</CardTitle>
          <CardDescription>
            Complete workout sessions to start tracking your progress.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Your progress charts will appear here once you have workout history.
          </p>
        </CardContent>
      </Card>
    );
  }

  const exerciseOptions = getAllExerciseIds();
  const chartData = weightProgressionData();
  const effortChartData = effortData();

  const chartConfig = {
    weight: {
      label: 'Weight (lbs)',
      color: 'hsl(var(--chart-1))',
    },
  };

  const effortChartConfig = {
    effort: {
      label: 'Effort Level',
      color: 'hsl(var(--chart-2))',
    },
  };

  return (
    <div className="space-y-6">
      <h2 className="font-bold text-2xl">Progress Charts</h2>

      {/* Exercise Selector */}
      <div className="space-y-2">
        <label className="font-medium text-sm">Select Exercise</label>
        <div className="flex flex-wrap gap-2">
          {exerciseOptions.map((exerciseId) => (
            <button
              className={`rounded-full px-3 py-1 text-sm ${
                selectedExercise === exerciseId
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
              }`}
              key={exerciseId}
              onClick={() => setSelectedExercise(exerciseId)}
            >
              {getExerciseName(exerciseId)}
            </button>
          ))}
        </div>
      </div>

      {/* Weight Progression Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Weight Progression</CardTitle>
          <CardDescription>
            Track your lifting weights over time for{' '}
            {selectedExercise
              ? getExerciseName(selectedExercise)
              : 'selected exercise'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ChartContainer className="h-64 w-full" config={chartConfig}>
              <ResponsiveContainer height="100%" width="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    axisLine={false}
                    dataKey="date"
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return date.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      });
                    }}
                    tickLine={false}
                    tickMargin={8}
                  />
                  <YAxis
                    axisLine={false}
                    domain={['dataMin - 10', 'dataMax + 10']}
                    tickLine={false}
                    tickMargin={8}
                  />
                  <ChartTooltip
                    content={<ChartTooltipContent hideLabel />}
                    cursor={false}
                  />
                  <Line
                    activeDot={{ r: 6 }}
                    dataKey="weight"
                    dot={{ r: 4 }}
                    stroke="var(--color-weight)"
                    strokeWidth={2}
                    type="monotone"
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <p className="py-8 text-center text-muted-foreground text-sm">
              No weight data available for this exercise
            </p>
          )}
        </CardContent>
      </Card>

      {/* Effort Level Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Effort Level</CardTitle>
          <CardDescription>
            Your perceived effort (1-5 stars) over time for{' '}
            {selectedExercise
              ? getExerciseName(selectedExercise)
              : 'selected exercise'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {effortChartData.length > 0 ? (
            <ChartContainer className="h-64 w-full" config={effortChartConfig}>
              <ResponsiveContainer height="100%" width="100%">
                <LineChart data={effortChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    axisLine={false}
                    dataKey="date"
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return date.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      });
                    }}
                    tickLine={false}
                    tickMargin={8}
                  />
                  <YAxis
                    axisLine={false}
                    domain={[1, 5]}
                    tickLine={false}
                    tickMargin={8}
                  />
                  <ChartTooltip
                    content={<ChartTooltipContent hideLabel />}
                    cursor={false}
                  />
                  <Line
                    activeDot={{ r: 6 }}
                    dataKey="effort"
                    dot={{ r: 4 }}
                    stroke="var(--color-effort)"
                    strokeWidth={2}
                    type="monotone"
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <p className="py-8 text-center text-muted-foreground text-sm">
              No effort data available for this exercise
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
