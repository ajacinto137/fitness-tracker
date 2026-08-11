import type { Exercise } from "@prisma/client";
import type { ExerciseFormValues } from "@/components/lifting/ExerciseFormSheet";
import { apiSend, ClientApiError } from "@/lib/client-fetch";

/**
 * Single source of truth for creating an exercise from the client. Every
 * create-exercise entry point (library, active workout, routine builder)
 * calls this instead of duplicating the fetch + error handling.
 */
export async function createExercise(values: ExerciseFormValues): Promise<Exercise> {
  try {
    const { exercise } = await apiSend<{ exercise: Exercise }>("/api/exercises", "POST", values);
    return exercise;
  } catch (err) {
    throw new Error(err instanceof ClientApiError ? err.message : "Unable to create exercise.");
  }
}
