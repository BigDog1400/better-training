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
      renderText={(exercise) => exercise.name}
      searchFn={searchFn}
      onChange={handleSelect}
      debounce={50}
    />
  );
}
