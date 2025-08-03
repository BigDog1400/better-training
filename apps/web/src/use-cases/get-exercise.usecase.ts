import { FileLoader } from '@/data/load';
import type { GetExercisesArgs, GetExercisesReturnArgs, Exercise } from '@/types/exercise.types';

export class GetExercisesUseCase {
  async execute(params: GetExercisesArgs): Promise<GetExercisesReturnArgs> {
    const { offset = 0, limit = 20, query = {}, sort = {} } = params;

    let exercises = await FileLoader.loadExercises();

    if (query.search) {
      const searchTerm = query.search.toLowerCase();
      exercises = exercises.filter(e => e.name.toLowerCase().includes(searchTerm));
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
