"use client";

import { useMemo, useState } from "react";
import { ExerciseService } from "@/services/exercise.service";
import type { Exercise } from "@/types/exercise.types";
import ComboBox from "@/components/ui/combobox";

interface ExerciseSelectorProps {
  onSelect: (exercise: Exercise) => void;
}

export function ExerciseSelector({ onSelect }: ExerciseSelectorProps) {
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
    setSelectedExercise(exercise);
    onSelect(exercise);
  };

  return (
    <ComboBox<Exercise>
      title="Exercise"
      value={selectedExercise}
      valueKey="exerciseId"
      // Render the selected value text
      renderText={(exercise) => exercise.name}
      // Render each item with a small preview
      renderOption={(exercise: Exercise) => (
        <div className="flex items-center gap-3">
          <img
            src={`/media/${exercise.exerciseId}.gif`}
            alt={`${exercise.name} preview`}
            className="h-10 w-10 flex-shrink-0 rounded-md border object-contain"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-foreground">
              {exercise.name}
            </div>
            <div className="truncate text-xs text-muted-foreground">
              {(exercise.equipments?.join(", ") || "—") +
                " • " +
                (exercise.targetMuscles?.join(", ") || "—")}
            </div>
          </div>
        </div>
      )}
      searchFn={searchFn}
      onChange={handleSelect}
      debounce={50}
    />
  );
}
