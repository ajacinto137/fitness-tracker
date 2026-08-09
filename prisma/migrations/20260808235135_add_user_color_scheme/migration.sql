-- CreateEnum
CREATE TYPE "ColorScheme" AS ENUM ('VIBRANT', 'NEON_LIME', 'ELECTRIC_OCEAN', 'NEON_SUNSET', 'ULTRAVIOLET');

-- AlterTable
ALTER TABLE "UserSettings" ADD COLUMN     "colorScheme" "ColorScheme" NOT NULL DEFAULT 'VIBRANT';
