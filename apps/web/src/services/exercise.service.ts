/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  FetchExerciseByIdReq,
  FilterExercisesArgs,
  GetAllExercisesArgs,
  GetExercisesArgs,
  GetExercisesByBodyPartArgs,
  GetExercisesByEquipmentArgs,
  GetExercisesByMuscleArgs,
  SearchExercisesArgs
} from '@/types/exercise.types';
import { GetExerciseByIdUseCase } from '../use-cases/get-exercise-by-id.usecase';
import { GetExercisesUseCase } from '../use-cases/get-exercise.usecase';

export class ExerciseService {
  private readonly getExercisesUseCase: GetExercisesUseCase;
  private readonly getExerciseByIdUseCase: GetExerciseByIdUseCase;

  constructor() {
    this.getExercisesUseCase = new GetExercisesUseCase();
    this.getExerciseByIdUseCase = new GetExerciseByIdUseCase();
  }

  async searchExercises(params: SearchExercisesArgs) {
    const query: GetExercisesArgs = {
      offset: params.offset,
      limit: params.limit,
      query: {
        search: params.query,
        searchThreshold: params.threshold,
      },
    };

    return this.getExercisesUseCase.execute(query);
  }

  getExerciseById = (request: FetchExerciseByIdReq) => {
    return this.getExerciseByIdUseCase.execute(request);
  }

  async getAllExercises(params: GetAllExercisesArgs & {
    muscle?: string;
    bodypart?: string;
    equipment?: string;
  }) {
    const queryFilters: Record<string, any> = {};

    if (params.search) {
      queryFilters.search = params.search;
    }

    // Map single-value shortcuts to the use case query shape
    if (params.muscle) {
      queryFilters.targetMuscles = [params.muscle];
    }
    if (params.bodypart) {
      queryFilters.bodyParts = [params.bodypart];
    }
    if (params.equipment) {
      queryFilters.equipments = [params.equipment];
    }

    const query: GetExercisesArgs = {
      offset: params.offset,
      limit: params.limit,
      query: queryFilters,
      sort: params.sort,
    };

    return this.getExercisesUseCase.execute(query);
  }

  async filterExercises(params: FilterExercisesArgs) {
    const queryFilters: any = {};

    if (params.search) {
      queryFilters.search = params.search;
    }

    if (params.targetMuscles && params.targetMuscles.length > 0) {
      queryFilters.targetMuscles = params.targetMuscles;
    }

    if (params.equipments && params.equipments.length > 0) {
      queryFilters.equipments = params.equipments;
    }

    if (params.bodyParts && params.bodyParts.length > 0) {
      queryFilters.bodyParts = params.bodyParts;
    }

    const query: GetExercisesArgs = {
      offset: params.offset,
      limit: params.limit,
      query: queryFilters,
      sort: params.sort
    };

    return this.getExercisesUseCase.execute(query);
  }

  async getExercisesByBodyPart(params: GetExercisesByBodyPartArgs) {
    const query: GetExercisesArgs = {
      offset: params.offset,
      limit: params.limit,
      query: {
        bodyParts: [params.bodyPart]
      }
    };

    return this.getExercisesUseCase.execute(query);
  }

  async getExercisesByEquipment(params: GetExercisesByEquipmentArgs) {
    const query: GetExercisesArgs = {
      offset: params.offset,
      limit: params.limit,
      query: {
        equipments: [params.equipment]
      }
    };

    return this.getExercisesUseCase.execute(query);
  }

  async getExercisesByMuscle(params: GetExercisesByMuscleArgs) {
    const query: GetExercisesArgs = {
      offset: params.offset,
      limit: params.limit,
      query: {
        targetMuscles: [params.muscle],
        includeSecondaryMuscles: params.includeSecondary
      }
    };

    return this.getExercisesUseCase.execute(query);
  }
}
