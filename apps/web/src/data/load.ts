import type { Equipment, Exercise, Muscle, BodyPart } from './types'

export class FileLoader {
  private static cache = new Map<string, unknown>()

  private static async loadJSON<T>(filename: string): Promise<T> {
    const url = `/data/${filename}`

    if (this.cache.has(url)) {
      return this.cache.get(url) as T
    }

    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Failed to load ${filename}: ${response.statusText}`)
      }
      const data = await response.json() as T
      this.cache.set(url, data)
      return data
    } catch (error) {
      console.error(`❌ Error loading JSON file [${filename}]:`, error)
      throw new Error(`Could not load ${filename}`)
    }
  }

  public static loadExercises(): Promise<Exercise[]> {
    return this.loadJSON<Exercise[]>(`exercises.json`)
  }

  public static loadEquipments(): Promise<Equipment[]> {
    return this.loadJSON<Equipment[]>('equipments.json')
  }

  public static loadBodyParts(): Promise<BodyPart[]> {
    return this.loadJSON<BodyPart[]>('bodyparts.json')
  }

  public static loadMuscles(): Promise<Muscle[]> {
    return this.loadJSON<Muscle[]>('muscles.json')
  }
}
