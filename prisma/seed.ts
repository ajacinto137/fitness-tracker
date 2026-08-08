import { PrismaClient, MuscleGroup } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Deterministic PRNG so seeded data (and the demo charts) look the same every run.
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(42);

const LB_TO_KG = 0.45359237;
const kg = (lb: number) => lb * LB_TO_KG;

function daysAgo(n: number): Date {
  const d = new Date();
  d.setUTCHours(12, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - n);
  return d;
}

async function main() {
  const email = "test@example.com";
  const passwordHash = await bcrypt.hash("password123", 12);

  await prisma.user.deleteMany({ where: { email } });

  const user = await prisma.user.create({
    data: {
      email,
      name: "Test User",
      passwordHash,
      settings: { create: { units: "LB" } },
    },
  });

  console.log(`Created user ${user.email}`);

  // ---- Exercise library ----
  const exerciseDefs: { name: string; muscleGroup: MuscleGroup; description?: string }[] = [
    { name: "Bench Press", muscleGroup: "CHEST", description: "Barbell bench press, flat." },
    { name: "Squat", muscleGroup: "LEGS", description: "Barbell back squat." },
    { name: "Deadlift", muscleGroup: "BACK", description: "Conventional barbell deadlift." },
    { name: "Overhead Press", muscleGroup: "SHOULDERS", description: "Standing barbell press." },
    { name: "Barbell Row", muscleGroup: "BACK", description: "Bent-over barbell row." },
    { name: "Lat Pulldown", muscleGroup: "BACK", description: "Cable lat pulldown." },
    { name: "Bicep Curl", muscleGroup: "BICEPS", description: "Standing dumbbell curl." },
    { name: "Tricep Pushdown", muscleGroup: "TRICEPS", description: "Cable tricep pushdown." },
  ];

  const exercises: Record<string, { id: string }> = {};
  for (const def of exerciseDefs) {
    const exercise = await prisma.exercise.create({
      data: { userId: user.id, name: def.name, muscleGroup: def.muscleGroup, description: def.description },
    });
    exercises[def.name] = exercise;
  }
  console.log(`Created ${exerciseDefs.length} exercises`);

  // ---- Routines ----
  const pushDay = await prisma.workoutRoutine.create({
    data: {
      userId: user.id,
      name: "Push Day",
      exercises: {
        create: [
          { exerciseId: exercises["Bench Press"].id, order: 0, targetSets: 3, targetReps: 8 },
          { exerciseId: exercises["Overhead Press"].id, order: 1, targetSets: 3, targetReps: 10 },
          { exerciseId: exercises["Tricep Pushdown"].id, order: 2, targetSets: 3, targetReps: 12 },
        ],
      },
    },
  });

  const pullDay = await prisma.workoutRoutine.create({
    data: {
      userId: user.id,
      name: "Pull Day",
      exercises: {
        create: [
          { exerciseId: exercises["Barbell Row"].id, order: 0, targetSets: 3, targetReps: 10 },
          { exerciseId: exercises["Lat Pulldown"].id, order: 1, targetSets: 3, targetReps: 10 },
          { exerciseId: exercises["Bicep Curl"].id, order: 2, targetSets: 3, targetReps: 12 },
        ],
      },
    },
  });

  const legDay = await prisma.workoutRoutine.create({
    data: {
      userId: user.id,
      name: "Leg Day",
      exercises: {
        create: [
          { exerciseId: exercises["Squat"].id, order: 0, targetSets: 4, targetReps: 6 },
          { exerciseId: exercises["Deadlift"].id, order: 1, targetSets: 3, targetReps: 5 },
        ],
      },
    },
  });

  console.log("Created routines: Push Day, Pull Day, Leg Day");

  // ---- Sample workouts over the last 8 weeks (3x/week, rotating routines) ----
  const routineRotation = [
    { routine: pushDay, exercises: ["Bench Press", "Overhead Press", "Tricep Pushdown"] },
    { routine: pullDay, exercises: ["Barbell Row", "Lat Pulldown", "Bicep Curl"] },
    { routine: legDay, exercises: ["Squat", "Deadlift"] },
  ];

  const startingWeightLb: Record<string, number> = {
    "Bench Press": 135,
    "Overhead Press": 75,
    "Tricep Pushdown": 40,
    "Barbell Row": 115,
    "Lat Pulldown": 90,
    "Bicep Curl": 25,
    Squat: 155,
    Deadlift: 175,
  };

  const totalSessions = 24; // 8 weeks x 3 sessions
  for (let session = totalSessions - 1; session >= 0; session--) {
    const rotation = routineRotation[(totalSessions - 1 - session) % 3];
    const dayOffset = session * 2 + Math.floor(rand() * 1);
    const startedAt = daysAgo(dayOffset);
    const weekIndex = Math.floor((totalSessions - 1 - session) / 3);

    const workout = await prisma.workout.create({
      data: {
        userId: user.id,
        routineId: rotation.routine.id,
        name: rotation.routine.name,
        startedAt,
        finishedAt: new Date(startedAt.getTime() + (45 + rand() * 20) * 60000),
      },
    });

    for (let oi = 0; oi < rotation.exercises.length; oi++) {
      const exerciseName = rotation.exercises[oi];
      const baseWeight = startingWeightLb[exerciseName];
      const progressedWeight = baseWeight + weekIndex * (baseWeight * 0.02) + rand() * 5;

      const we = await prisma.workoutExercise.create({
        data: { workoutId: workout.id, exerciseId: exercises[exerciseName].id, order: oi },
      });

      const setCount = 3;
      for (let s = 0; s < setCount; s++) {
        const weightLb = Math.round((progressedWeight - s * 2.5) / 2.5) * 2.5;
        const reps = 6 + Math.floor(rand() * 5);
        await prisma.workoutSet.create({
          data: {
            workoutExerciseId: we.id,
            setNumber: s + 1,
            weightKg: kg(weightLb),
            reps,
            completed: true,
          },
        });
      }
    }
  }
  console.log(`Created ${totalSessions} sample workouts`);

  // ---- Personal records derived from the seeded workouts ----
  for (const exerciseName of Object.keys(exercises)) {
    const workoutExercises = await prisma.workoutExercise.findMany({
      where: { exerciseId: exercises[exerciseName].id, workout: { userId: user.id } },
      include: { sets: true, workout: true },
    });

    let bestWeight = { value: 0, reps: 0, workoutId: "" };
    let bestOneRm = { value: 0, workoutId: "" };

    for (const we of workoutExercises) {
      for (const set of we.sets) {
        if (set.weightKg > bestWeight.value) {
          bestWeight = { value: set.weightKg, reps: set.reps, workoutId: we.workoutId };
        }
        const oneRm = set.weightKg * (1 + set.reps / 30);
        if (oneRm > bestOneRm.value) {
          bestOneRm = { value: oneRm, workoutId: we.workoutId };
        }
      }
    }

    if (bestWeight.value > 0) {
      await prisma.personalRecord.create({
        data: {
          userId: user.id,
          exerciseId: exercises[exerciseName].id,
          type: "HEAVIEST_WEIGHT",
          value: bestWeight.value,
          reps: bestWeight.reps,
          workoutId: bestWeight.workoutId,
        },
      });
      await prisma.personalRecord.create({
        data: {
          userId: user.id,
          exerciseId: exercises[exerciseName].id,
          type: "ESTIMATED_1RM",
          value: bestOneRm.value,
          workoutId: bestOneRm.workoutId,
        },
      });
    }
  }
  console.log("Recorded personal records");

  // ---- Body weight entries over the last 60 days ----
  let weightLb = 185;
  const weightEntries = [];
  for (let d = 59; d >= 0; d--) {
    weightLb += (rand() - 0.55) * 0.6;
    const date = daysAgo(d);
    date.setUTCHours(0, 0, 0, 0);
    weightEntries.push({
      userId: user.id,
      weightKg: kg(Math.round(weightLb * 10) / 10),
      date,
    });
  }
  await prisma.bodyWeightEntry.createMany({ data: weightEntries });
  console.log(`Created ${weightEntries.length} body weight entries`);

  console.log("\nSeed complete.");
  console.log(`Login with: ${email} / password123`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
