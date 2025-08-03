"use client";

import { useMemo, useState } from "react";
import { ExerciseService } from "@/services/exercise.service";
import type { Exercise } from "@/types/exercise.types";
import ComboBox from "@/components/ui/combobox";
interface ExerciseSelectorProps {
  onSelect: (exercise: Exercise) => void;
  // Optional: keep the picker open after selecting so users can rapid-add multiple
  keepOpen?: boolean;
  // IDs already added to the current workout day, to visually mark them in the list
  selectedIds?: string[];
}

export function ExerciseSelector({ onSelect, keepOpen = true, selectedIds = [] }: ExerciseSelectorProps) {
  const exerciseService = useMemo(() => new ExerciseService(), []);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | undefined>(
    undefined,
  );

  const searchFn = async (
    search: string,
    offset: number,
    limit: number,
  ): Promise<Exercise[]> => {
    const result = await exerciseService.getAllExercises({
      search,
      limit,
      offset,
    });
    return result.exercises;
  };

  const handleSelect = (exercise: Exercise) => {
    setSelectedExercise(keepOpen ? undefined : exercise);
    onSelect(exercise);
  };

  return (
    <ComboBox<Exercise>
      title="Exercise"
      value={selectedExercise}
      valueKey="exerciseId"
      keepOpen={keepOpen}
      // Render the selected value text
      renderText={(exercise) => exercise.name}
      // Render each item with a small preview and "Added" indicator if already in the day
      renderOption={(exercise: Exercise) => {
        const isAdded = selectedIds.includes(exercise.exerciseId);
        return (
          <div className="flex items-center gap-3">
            <img
              src={`/media/${exercise.exerciseId}.gif`}
              alt={`${exercise.name} preview`}
              className="h-10 w-10 flex-shrink-0 rounded-md border object-contain"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <div className="truncate text-sm font-medium text-foreground">
                  {exercise.name}
                </div>
                {isAdded && (
                  <span
                    className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-green-500/15 text-green-600 ring-1 ring-green-600/20 dark:text-green-400"
                    aria-label="Already added"
                    title="Already added"
                  >
                    ✓
                  </span>
                )}
              </div>
              <div className="truncate text-xs text-muted-foreground">
                {(exercise.equipments?.join(", ") || "—") +
                  " • " +
                  (exercise.targetMuscles?.join(", ") || "—")}
              </div>
            </div>
          </div>
        );
      }}
      searchFn={searchFn}
      onChange={handleSelect}
      debounce={50}
    />
  );
}
