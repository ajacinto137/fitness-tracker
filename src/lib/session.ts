import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * Resolves the current session to a verified Prisma User.id, for use in
 * Server Components (pages/layouts).
 *
 * Sessions use the JWT strategy, so a signed-in cookie is never re-checked
 * against the database — it just carries whatever `id` was in the token at
 * sign-in. If that User row is later deleted (account removal, a reseeded
 * dev database, etc.) the cookie still "authenticates" successfully even
 * though session.user.id no longer refers to a real user. Passing that id
 * straight into a query — e.g. `userSettings.upsert({ create: { userId } })`
 * — then trips the UserSettings_userId_fkey constraint.
 *
 * This checks the id against the database once per request and sends the
 * user back to login if it no longer resolves, instead of letting a stale
 * id reach a query.
 */
export async function requireSessionUserId(): Promise<string> {
  const session = await auth();
  const sessionUserId = session?.user?.id;
  if (!sessionUserId) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: sessionUserId },
    select: { id: true },
  });
  if (!user) {
    redirect("/login");
  }

  return user.id;
}
