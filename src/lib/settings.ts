import { cache } from "react";
import { prisma } from "@/lib/prisma";

/**
 * Fetches (or lazily creates) the current user's settings row.
 *
 * Wrapped in React's `cache()` so that within a single request, the layout
 * (which needs colorScheme to render the theme wrapper) and the page itself
 * (which typically also needs units) share one query instead of two.
 */
export const getUserSettings = cache(async (userId: string) => {
  return prisma.userSettings.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });
});
