"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { loadAvailablePlans, loadAppData, saveAppData } from "@/lib/localStorage";
import type { WorkoutPlan } from "@/lib/localStorage";
import { useRouter } from "next/navigation";

export function PlanSelector() {
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const availablePlans = await loadAvailablePlans();
      setPlans(availablePlans);
    } catch (error) {
      console.error("Error loading plans:", error);
    } finally {
      setLoading(false);
    }
  };

  const selectPlan = (planId: string) => {
    const appData = loadAppData();
    appData.currentPlanId = planId;
    saveAppData(appData);
    router.push("/plan/current");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Select a Training Plan</h2>
      <p className="text-muted-foreground">
        Choose from pre-built plans or create your own custom plan.
      </p>
      
      <div className="grid gap-4 md:grid-cols-2">
        {plans.map((plan) => (
          <Card key={plan.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>
                {plan.durationWeeks} weeks duration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Workout days: {Object.entries(plan.dayWorkouts).map(([day, workout]) => 
                  `${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][parseInt(day)]}: ${workout}`
                ).join(', ')}
              </p>
              <Button 
                onClick={() => selectPlan(plan.id)}
                className="w-full"
              >
                Select Plan
              </Button>
            </CardContent>
          </Card>
        ))}
        
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>Custom Plan</CardTitle>
            <CardDescription>
              Create your own personalized training plan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => router.push("/plan/create")}
              variant="outline"
              className="w-full"
            >
              Create New Plan
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
