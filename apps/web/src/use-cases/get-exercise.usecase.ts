/* eslint-disable @typescript-eslint/no-explicit-any */
import { FileLoader } from '@/data/load';
import type { GetExercisesArgs, GetExercisesReturnArgs } from '@/types/exercise.types';
import Fuse from 'fuse.js';

export class GetExercisesUseCase {
  async execute(params: GetExercisesArgs): Promise<GetExercisesReturnArgs> {
    const { offset = 0, limit = 20, query = {}, sort = {} } = params;

    let exercises = await FileLoader.loadExercises();

    if (query.search) {
      const fuse = new Fuse(exercises, {
        keys: [
          { name: 'name', weight: 0.4 },
          { name: 'targetMuscles', weight: 0.25 },
          { name: 'bodyParts', weight: 0.2 },
          { name: 'equipments', weight: 0.15 },
          { name: 'secondaryMuscles', weight: 0.1 }
        ],
        threshold: query.searchThreshold || 0.4,
        includeScore: false,
        ignoreLocation: true,
        findAllMatches: true
      });

      exercises = fuse.search(query.search).map(result => result.item);
    }

    if (query.targetMuscles && query.targetMuscles.length > 0) {
      exercises = exercises.filter(e => e.targetMuscles.some(m => query.targetMuscles?.includes(m)));
    }

    if (query.equipments && query.equipments.length > 0) {
      exercises = exercises.filter(e => e.equipments.some(eq => query.equipments?.includes(eq)));
    }

    if (query.bodyParts && query.bodyParts.length > 0) {
      exercises = exercises.filter(e => e.bodyParts.some(bp => query.bodyParts?.includes(bp)));
    }

    if (Object.keys(sort).length > 0) {
      const [sortField, sortOrder] = Object.entries(sort)[0];
      exercises.sort((a, b) => {
        const fieldA = (a as any)[sortField];
        const fieldB = (b as any)[sortField];
        if (fieldA < fieldB) return sortOrder === 1 ? -1 : 1;
        if (fieldA > fieldB) return sortOrder === 1 ? 1 : -1;
        return 0;
      });
    }

    const totalExercises = exercises.length;
    const totalPages = Math.ceil(totalExercises / limit);
    const paginatedExercises = exercises.slice(offset, offset + limit);

    return {
      exercises: paginatedExercises,
      totalPages,
      totalExercises,
      currentPage: Math.floor(offset / limit) + 1,
    };
  }
}
