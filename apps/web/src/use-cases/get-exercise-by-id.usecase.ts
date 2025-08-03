import { FileLoader } from '@/data/load';
import type { FetchExerciseByIdReq, Exercise } from '@/types/exercise.types';

export class GetExerciseByIdUseCase {
  async execute(request: FetchExerciseByIdReq): Promise<Exercise | null> {
    const exercises = await FileLoader.loadExercises();
    const exercise = exercises.find(e => e.exerciseId === request.exerciseId);
    return exercise || null;
  }
}
