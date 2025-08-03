import type { Exercise } from '@/data/types';

export interface FilterOptions {
  search?: string;
  page?: number;
  pageSize?: number;
}

export function filterExercises(exercises: Exercise[], options: FilterOptions): Exercise[] {
  let filtered = [...exercises];

  if (options.search) {
    const searchTerm = options.search.toLowerCase();
    filtered = filtered.filter(e => e.name.toLowerCase().includes(searchTerm));
  }

  if (options.page && options.pageSize) {
    const start = (options.page - 1) * options.pageSize;
    const end = start + options.pageSize;
    filtered = filtered.slice(start, end);
  }

  return filtered;
}
