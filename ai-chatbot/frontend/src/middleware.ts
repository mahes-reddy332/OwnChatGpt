import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Public routes
  const publicPaths = ["/login", "/signup", "/share", "/api/auth"];
  if (pathname === "/" || publicPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Check auth for protected routes
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token && !pathname.startsWith("/api/models")) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|logo.svg).*)"],
};
