import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const bodyWeightEntrySchema = z.object({
  weight: z.number().positive("Weight must be greater than 0").max(2000),
  date: z.string().refine((v) => !Number.isNaN(Date.parse(v)), "Enter a valid date"),
  note: z.string().trim().max(500).optional().nullable(),
});

export const muscleGroups = [
  "CHEST",
  "BACK",
  "SHOULDERS",
  "BICEPS",
  "TRICEPS",
  "LEGS",
  "GLUTES",
  "CORE",
  "OTHER",
] as const;

export const exerciseSchema = z.object({
  name: z.string().trim().min(1, "Exercise name is required").max(100),
  muscleGroup: z.enum(muscleGroups),
  description: z.string().trim().max(1000).optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
});

export const routineExerciseSchema = z.object({
  exerciseId: z.string().min(1),
  order: z.number().int().min(0),
  targetSets: z.number().int().positive().max(50).optional().nullable(),
  targetReps: z.number().int().positive().max(200).optional().nullable(),
});

export const routineSchema = z.object({
  name: z.string().trim().min(1, "Routine name is required").max(100),
  exercises: z.array(routineExerciseSchema).default([]),
});

export const setSchema = z.object({
  weight: z.number().min(0, "Weight cannot be negative").max(2000),
  reps: z.number().int().min(0, "Reps cannot be negative").max(999),
  completed: z.boolean(),
});

export const unitsSchema = z.enum(["LB", "KG"]);

export const colorSchemeSchema = z.enum([
  "VIBRANT",
  "NEON_LIME",
  "ELECTRIC_OCEAN",
  "NEON_SUNSET",
  "ULTRAVIOLET",
]);
