import type { WorkoutPlan } from './localStorage';
import { savePlan } from './localStorage';

// Default 3-month machine plan
const DEFAULT_3M_MACHINE_PLAN: WorkoutPlan = {
  id: '3m-machine',
  name: '3-Month Machine Plan',
  durationWeeks: 12,
  dayWorkouts: {
    1: 'FullBodyA',
    2: 'FullBodyB',
    4: 'FullBodyA',
    5: 'FullBodyB',
  },
  workouts: {
    FullBodyA: [
      {
        exerciseId: 'leg-press',
        targetReps: [12, 12, 12],
        startingWeight: 120,
        sets: 3,
      },
      {
        exerciseId: 'chest-press',
        targetReps: [12, 12, 12],
        startingWeight: 80,
        sets: 3,
      },
      {
        exerciseId: 'lat-pulldown',
        targetReps: [12, 12, 12],
        startingWeight: 70,
        sets: 3,
      },
      {
        exerciseId: 'seated-row',
        targetReps: [12, 12, 12],
        startingWeight: 60,
        sets: 3,
      },
    ],
    FullBodyB: [
      {
        exerciseId: 'leg-curl',
        targetReps: [12, 12, 12],
        startingWeight: 60,
        sets: 3,
      },
      {
        exerciseId: 'pec-deck',
        targetReps: [15, 15, 15],
        startingWeight: 50,
        sets: 3,
      },
      {
        exerciseId: 'shoulder-press',
        targetReps: [12, 12, 12],
        startingWeight: 40,
        sets: 3,
      },
      {
        exerciseId: 'hip-abduction',
        targetReps: [15, 15, 15],
        startingWeight: 50,
        sets: 3,
      },
    ],
  },
};

export function initializeDefaultPlans(): void {
  // Check if we're running on the client side
  if (typeof window === 'undefined') {
    return;
  }

  // Check if the default plan already exists in localStorage
  const existingPlan = localStorage.getItem(
    `betterTrainingPlan_${DEFAULT_3M_MACHINE_PLAN.id}`
  );

  if (!existingPlan) {
    // Save the default plan if it doesn't exist
    savePlan(DEFAULT_3M_MACHINE_PLAN);
    console.log('Default 3-month machine plan initialized in localStorage');
  }
}
