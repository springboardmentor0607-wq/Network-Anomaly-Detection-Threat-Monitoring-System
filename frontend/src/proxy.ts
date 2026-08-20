import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const url = request.nextUrl;
  const port = url.port || (request.headers.get("host")?.includes(":8000") ? "8000" : "3000");

  // Port 8000 -> Dedicated to Cinematic Design
  if (port === "8000") {
    if (url.pathname === "/" || url.pathname === "/get-started") {
      return NextResponse.redirect(new URL("/cinematic", request.url));
    }
    if (url.pathname === "/login") {
      return NextResponse.redirect(new URL("/login-cinematic", request.url));
    }
    if (url.pathname === "/register") {
      return NextResponse.redirect(new URL("/register-cinematic", request.url));
    }
    if (url.pathname === "/dashboard") {
      return NextResponse.redirect(new URL("/dashboard-cinematic", request.url));
    }
  }

  // Port 3000 (or default) -> Dedicated to Original Design
  if (port === "3000" || (!port && !request.headers.get("host")?.includes(":8000"))) {
    if (url.pathname === "/cinematic") {
      return NextResponse.redirect(new URL("/get-started", request.url));
    }
    if (url.pathname === "/login-cinematic") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (url.pathname === "/register-cinematic") {
      return NextResponse.redirect(new URL("/register", request.url));
    }
    if (url.pathname === "/dashboard-cinematic") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, videos, etc.)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4)$).*)",
  ],
};
