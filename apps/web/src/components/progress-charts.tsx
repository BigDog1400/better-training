"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { loadAppData, loadExercises, type Exercise } from "@/lib/localStorage";
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent
} from "@/components/ui/chart";
import { 
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer
} from "recharts";

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
      const sortedLogs = [...appData.logs].sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      
      setLogs(sortedLogs);
      
      // Set default exercise to first one in the first log
      if (sortedLogs.length > 0 && sortedLogs[0].exercises.length > 0) {
        setSelectedExercise(sortedLogs[0].exercises[0].exerciseId);
      }
    } catch (error) {
      console.error("Error loading logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const getExerciseName = (exerciseId: string) => {
    const exercise = exercises.find(e => e.id === exerciseId);
    return exercise ? exercise.name : exerciseId;
  };

  // Prepare data for weight progression chart
  const weightProgressionData = () => {
    if (!selectedExercise || logs.length === 0) return [];
    
    const data: { date: string; weight: number }[] = [];
    
    logs.forEach(log => {
      log.exercises.forEach((exercise: any) => {
        if (exercise.exerciseId === selectedExercise) {
          data.push({
            date: log.date,
            weight: exercise.actualWeight
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
    
    logs.forEach(log => {
      log.exercises.forEach((exercise: any) => {
        if (exercise.exerciseId === selectedExercise) {
          data.push({
            date: log.date,
            effort: exercise.effort
          });
        }
      });
    });
    
    return data;
  };

  // Get all unique exercise IDs from logs
  const getAllExerciseIds = () => {
    const exerciseIds = new Set<string>();
    logs.forEach(log => {
      log.exercises.forEach((exercise: any) => {
        exerciseIds.add(exercise.exerciseId);
      });
    });
    return Array.from(exerciseIds);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
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
          <p className="text-sm text-muted-foreground">
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
      label: "Weight (lbs)",
      color: "hsl(var(--chart-1))",
    },
  };

  const effortChartConfig = {
    effort: {
      label: "Effort Level",
      color: "hsl(var(--chart-2))",
    },
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Progress Charts</h2>
      
      {/* Exercise Selector */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Select Exercise</label>
        <div className="flex flex-wrap gap-2">
          {exerciseOptions.map(exerciseId => (
            <button
              key={exerciseId}
              onClick={() => setSelectedExercise(exerciseId)}
              className={`px-3 py-1 rounded-full text-sm ${
                selectedExercise === exerciseId
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80"
              }`}
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
            Track your lifting weights over time for {selectedExercise ? getExerciseName(selectedExercise) : "selected exercise"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    }}
                  />
                  <YAxis 
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    domain={['dataMin - 10', 'dataMax + 10']}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <Line
                    dataKey="weight"
                    type="monotone"
                    stroke="var(--color-weight)"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">
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
            Your perceived effort (1-5 stars) over time for {selectedExercise ? getExerciseName(selectedExercise) : "selected exercise"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {effortChartData.length > 0 ? (
            <ChartContainer config={effortChartConfig} className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={effortChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    }}
                  />
                  <YAxis 
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    domain={[1, 5]}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <Line
                    dataKey="effort"
                    type="monotone"
                    stroke="var(--color-effort)"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No effort data available for this exercise
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
