// Types for our application
export interface Exercise {
  id: string;
  name: string;
  machine: string;
  muscle: string;
  instructions: string;
}

export interface WorkoutExercise {
  exerciseId: string;
  targetReps: number[];
  startingWeight: number;
  sets: number;
}

export interface WorkoutPlan {
  id: string;
  name: string;
  durationWeeks: number;
  // Map days (0-6) to workout names
  dayWorkouts: {
    [day: number]: string;
  };
  workouts: {
    [key: string]: WorkoutExercise[];
  };
}

export interface SetLog {
  reps: number;
  weight: number;
}

export interface ExerciseLog {
  exerciseId: string;
  targetReps: number[];
  targetWeight: number;
  sets: SetLog[];
  effort: number;
  notes: string;
}

export interface WorkoutSessionLog {
  date: string;
  workoutType: string;
  exercises: ExerciseLog[];
}

export interface AppData {
  currentPlanId: string | null;
  planStartedAt: string | null;
  lastSessionDate: string | null;
  logs: WorkoutSessionLog[];
}

const STORAGE_KEY = 'betterTrainingData';

// Load exercises from public/data/exercises.json
export async function loadExercises(): Promise<Exercise[]> {
  try {
    const response = await fetch('/data/exercises.json');
    if (!response.ok) {
      throw new Error(`Failed to load exercises: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error loading exercises:', error);
    return [];
  }
}

// Load a specific plan from localStorage
export async function loadPlan(planId: string): Promise<WorkoutPlan | null> {
  // Check if we're running on the client side
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const data = localStorage.getItem(`betterTrainingPlan_${planId}`);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error(`Error loading plan ${planId} from localStorage:`, error);
    return null;
  }

  return null;
}

// Load all available plans from localStorage
export async function loadAvailablePlans(): Promise<WorkoutPlan[]> {
  // Check if we're running on the client side
  if (typeof window === 'undefined') {
    return [];
  }

  const plans: WorkoutPlan[] = [];

  // Get all items from localStorage that start with 'betterTrainingPlan_'
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('betterTrainingPlan_')) {
      try {
        const planData = localStorage.getItem(key);
        if (planData) {
          const plan = JSON.parse(planData);
          plans.push(plan);
        }
      } catch (error) {
        console.error(`Error parsing plan from key ${key}:`, error);
      }
    }
  }

  return plans;
}

// LocalStorage operations
export function loadAppData(): AppData {
  // Check if we're running on the client side
  if (typeof window === 'undefined') {
    // Return default structure during server-side rendering
    return {
      currentPlanId: null,
      planStartedAt: null,
      lastSessionDate: null,
      logs: [],
    };
  }

  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading app data from localStorage:', error);
  }

  // Return default structure if nothing found or error
  return {
    currentPlanId: null,
    planStartedAt: null,
    lastSessionDate: null,
    logs: [],
  };
}

export function saveAppData(data: AppData): void {
  // Check if we're running on the client side
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving app data to localStorage:', error);
  }
}

// Save a plan to localStorage
export function savePlan(plan: WorkoutPlan): void {
  // Check if we're running on the client side
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(`betterTrainingPlan_${plan.id}`, JSON.stringify(plan));
  } catch (error) {
    console.error(`Error saving plan ${plan.id} to localStorage:`, error);
  }
}

// Smart weight recommendation logic
export function getSuggestedWeight(lastLog: ExerciseLog): number {
  const lastSet = lastLog.sets[lastLog.sets.length - 1];
  if (!lastSet) return lastLog.targetWeight;

  const { reps, weight } = lastSet;
  const targetReps =
    lastLog.targetReps[lastLog.sets.length - 1] || lastLog.targetReps[0];
  const repRatio = reps / targetReps;

  if (repRatio >= 1 && lastLog.effort <= 3) {
    return Math.round(weight * 1.05); // +5%
  }
  if (repRatio >= 1 && lastLog.effort === 4) {
    return weight; // keep
  }
  if (repRatio < 0.8 || lastLog.effort === 5) {
    return Math.round(weight * 0.95); // -5%
  }
  return weight;
}

// Get the next workout based on the current plan and schedule
export function getNextWorkout(plan: WorkoutPlan): string | null {
  // Get today's day (0 = Sunday, 1 = Monday, etc.)
  const today = new Date().getDay();

  // Check if there's a workout scheduled for today
  if (plan.dayWorkouts[today]) {
    return plan.dayWorkouts[today];
  }

  // If not, look for the next scheduled workout
  for (let i = 1; i <= 7; i++) {
    const nextDay = (today + i) % 7;
    if (plan.dayWorkouts[nextDay]) {
      return plan.dayWorkouts[nextDay];
    }
  }

  // If no workouts are scheduled, return null
  return null;
}

// Get suggested weights for all exercises in a workout based on last session
export function getWorkoutSuggestions(
  plan: WorkoutPlan,
  workoutType: string,
  logs: WorkoutSessionLog[]
): WorkoutExercise[] {
  const workoutExercises = plan.workouts[workoutType] || [];

  // Find the last session of this workout type
  const lastSession = logs
    .filter((log) => log.workoutType === workoutType)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .find(() => true);

  if (!lastSession) {
    // No previous session, return starting weights
    return workoutExercises;
  }

  // Map exercises with suggested weights based on last session
  return workoutExercises.map((exercise) => {
    const lastExerciseLog = lastSession.exercises.find(
      (log) => log.exerciseId === exercise.exerciseId
    );

    if (lastExerciseLog) {
      const suggestedWeight = getSuggestedWeight(lastExerciseLog);
      return {
        ...exercise,
        startingWeight: suggestedWeight,
      };
    }

    // No previous log for this exercise, keep original starting weight
    return exercise;
  });
}
