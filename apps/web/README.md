# Better-Training Gym Tracker

A fully local, mobile-friendly SPA for tracking gym progress with machine-based workouts.

## Features

- **Customizable Training Plans**: Select from predefined plans or create your own with target reps and weights
- **Step-by-Step Workout Logging**: Interactive interface for logging each exercise with actual weight, reps, effort, and notes
- **Smart Weight Progression**: Algorithm that suggests next workout weights based on previous session performance
- **Progress Tracking with Charts**: Visualize your progression trends over time
- **Mobile-First Design**: Optimized for mobile devices with responsive layout
- **Dark Mode Support**: Toggle between light and dark themes
- **Local Storage Only**: All data persists locally in the browser - no backend required
- **CSV Export**: Export your workout history for backup or analysis

## Getting Started

1. Select a training plan or create a custom one
2. Start workout sessions to log your progress
3. View your history and progress charts over time

## Routes

- `/` - Homepage with quick start options
- `/plan/select` - Browse and select training plans
- `/plan/create` - Create custom training plans
- `/plan/current` - View your current plan details
- `/workout/session` - Log workout sessions
- `/history` - View workout history
- `/progress` - View progression charts

## Data Structure

All data is stored in localStorage with the following structure:
- Training plans with workout schedules and exercises
- Workout logs with actual performance data
- Current plan selection and workout progression

## Technical Stack

- Next.js 15 with App Router
- Tailwind CSS for styling
- shadcn/ui components
- Recharts for data visualization
- TypeScript for type safety
