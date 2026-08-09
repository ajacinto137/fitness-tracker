import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const PUBLIC_PATHS = ["/login", "/register"];

// Proxy runs on the Node.js runtime (default since Next.js 16), so a direct
// Prisma call here is fine — no Edge-runtime workaround needed.
export default auth(async (req) => {
  const { pathname } = req.nextUrl;

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  const isApiAuth = pathname.startsWith("/api/auth");

  if (isApiAuth) {
    return NextResponse.next();
  }

  // A JWT session cookie is never re-checked against the database by
  // default — it's cryptographically valid as long as it hasn't expired,
  // even if the User row it points to was deleted (account removal, a
  // reseeded dev database, etc). Treating that as "authenticated" here let a
  // stale id flow into pages/routes and trip foreign-key constraints
  // downstream, and — without this check — also caused a redirect loop:
  // this proxy would bounce a stale session away from /login as "already
  // signed in" while the destination page's own DB check bounced it right
  // back to /login. Verifying against the database here keeps both layers
  // agreeing on what a valid session is.
  let sessionUserExists = false;
  if (req.auth?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: req.auth.user.id },
      select: { id: true },
    });
    sessionUserExists = !!user;
  }

  if (isPublic) {
    if (sessionUserExists) {
      return NextResponse.redirect(new URL("/weight", req.url));
    }
    return NextResponse.next();
  }

  if (!sessionUserExists) {
    const loginUrl = new URL("/login", req.url);
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
    }
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
