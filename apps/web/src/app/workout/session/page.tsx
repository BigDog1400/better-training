'use client';

import { WorkoutSession } from '@/components/workout-session';
import { Suspense } from 'react';

export default function WorkoutSessionPage() {
  return (
    <div className="container mx-auto max-w-3xl py-6 md:px-4">
      <Suspense fallback={<div>Loading...</div>}>
        <WorkoutSession />
      </Suspense>
    </div>
  );
}
