-- AlterTable
ALTER TABLE "Exercise" ADD COLUMN     "unilateral" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "WorkoutSet" ADD COLUMN     "weightKgRight" DOUBLE PRECISION,
ADD COLUMN     "repsRight" INTEGER;
