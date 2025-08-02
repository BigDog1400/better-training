"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { loadAppData } from "@/lib/localStorage";
import { TITLE_TEXT } from "@/lib/constants";

export default function Home() {
  const [hasPlan, setHasPlan] = useState(false);

  useEffect(() => {
    const appData = loadAppData();
    setHasPlan(!!appData.currentPlanId);
  }, []);

  return (
    <div className="container mx-auto max-w-3xl px-4 py-6">
      <div className="text-center space-y-6">
        <pre className="overflow-x-auto font-mono text-sm">{TITLE_TEXT}</pre>
        <h1 className="text-3xl font-bold">Better Training</h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Track your gym progress with machine-based workouts, customizable plans, and smart progression recommendations.
        </p>
        
        <div className="flex flex-col gap-4 mt-8 max-w-xs mx-auto">
          {hasPlan ? (
            <>
              <Button asChild size="lg">
                <Link href="/plan/current">View Current Plan</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/workout/session">Start Workout Session</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/plan/select">Change Plan</Link>
              </Button>
            </>
          ) : (
            <>
              <Button asChild size="lg">
                <Link href="/plan/select">Select a Training Plan</Link>
              </Button>
              <p className="text-sm text-muted-foreground">or</p>
              <Button asChild variant="outline">
                <Link href="/plan/create">Create Custom Plan</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
