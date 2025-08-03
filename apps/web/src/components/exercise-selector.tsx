"use client";

import { useMemo, useState, useEffect } from "react";
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
  const [selectedExercise, setSelectedExercise] = useState<Exercise | undefined>(undefined);

  // Quick filters (dropdowns) - load from static JSON
  const [bodyparts, setBodyparts] = useState<string[]>([]);
  const [equipments, setEquipments] = useState<string[]>([]);

  const [activeBodypart, setActiveBodypart] = useState<string | null>(null);
  const [activeEquipment, setActiveEquipment] = useState<string | null>(null);

  useEffect(() => {
    // Load lists from public data
    const loadFilters = async () => {
      try {
        const [b, e] = await Promise.all([
          fetch("/data/bodyparts.json").then((r) => r.json()).catch(() => []),
          fetch("/data/equipments.json").then((r) => r.json()).catch(() => []),
        ]);
        setBodyparts((b as { name: string }[]).map((x) => x.name));
        setEquipments((e as { name: string }[]).map((x) => x.name));
      } catch {
        // ignore - filters are optional
      }
    };
    loadFilters();
  }, []);

  const searchFn = async (
    search: string,
    offset: number,
    limit: number,
  ): Promise<Exercise[]> => {
    const result = await exerciseService.getAllExercises({
      search,
      limit,
      offset,
      bodypart: activeBodypart || undefined,
      equipment: activeEquipment || undefined,
    } as any);

    return result.exercises as Exercise[];
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
      // Filters dropdowns inside the popover header
      renderFilters={
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[11px] text-muted-foreground">Bodypart</label>
              <select
                className="h-8 w-full rounded-md border bg-background px-2 text-xs"
                value={activeBodypart ?? ""}
                onChange={(e) => setActiveBodypart(e.target.value || null)}
              >
                <option value="">All</option>
                {bodyparts.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] text-muted-foreground">Equipment</label>
              <select
                className="h-8 w-full rounded-md border bg-background px-2 text-xs"
                value={activeEquipment ?? ""}
                onChange={(e) => setActiveEquipment(e.target.value || null)}
              >
                <option value="">All</option>
                {equipments.map((eq) => (
                  <option key={eq} value={eq}>
                    {eq}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      }
      // Render the selected value text
      renderText={(exercise) =>
        exercise.name
          .split(" ")
          .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ""))
          .join(" ")
      }
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
                  {exercise.name
                    .split(" ")
                    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ""))
                    .join(" ")}
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
