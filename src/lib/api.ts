import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/auth";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}

/** Resolves the current authenticated user's id, or throws a 401 ApiError. */
export async function requireUserId(): Promise<string> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    throw new ApiError(401, "You must be signed in.");
  }
  return userId;
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
