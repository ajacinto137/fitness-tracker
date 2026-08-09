import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}

/**
 * Resolves the current authenticated user's id, or throws a 401 ApiError.
 *
 * JWT sessions aren't re-checked against the database on every request, so
 * a session cookie can outlive the User row it points to (account deleted,
 * database reseeded, etc). Verifying the id still resolves to a real user
 * here — before it reaches any query — stops a stale id from tripping a
 * foreign-key constraint (e.g. UserSettings_userId_fkey) downstream.
 */
export async function requireUserId(): Promise<string> {
  const session = await auth();
  const sessionUserId = session?.user?.id;
  if (!sessionUserId) {
    throw new ApiError(401, "You must be signed in.");
  }

  const user = await prisma.user.findUnique({
    where: { id: sessionUserId },
    select: { id: true },
  });
  if (!user) {
    throw new ApiError(401, "Your session has expired. Please sign in again.");
  }

  return user.id;
}

/**
 * Wraps a route handler so unexpected errors never leak raw database or
 * server details to the client — they're logged server-side instead.
 */
export function withErrorHandling<T>(fn: () => Promise<T>): Promise<T | NextResponse> {
  return fn().catch((err) => {
    if (err instanceof ApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    if (err instanceof ZodError) {
      const message = err.issues[0]?.message ?? "Invalid input.";
      return NextResponse.json({ error: message }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  });
}
