import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const token =
    request.cookies.get("token")?.value || getTokenFromHeader(request);
  const path = request.nextUrl.pathname;

  const publicRoutes = [
    "/",
    "/properties",
    "/login",
    "/register",
    "/verify",
    "/forgot-password",
    "/reset-password",
    "/callback",
  ];

  const isPublicRoute = publicRoutes.some(
    (route) => path === route || path.startsWith("/properties/")
  );

  const isAuthRoute = ["/login", "/register"].some((route) =>
    path.startsWith(route)
  );

  const isUserRoute = ["/bookings", "/profile", "/review"].some((route) =>
    path.startsWith(route)
  );
  const isTenantRoute = path.startsWith("/dashboard");

  if (token && isAuthRoute) {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const redirectUrl = payload.role === "TENANT" ? "/dashboard" : "/";
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    } catch (e) {}
  }

  if (!token && (isUserRoute || isTenantRoute)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", path);
    return NextResponse.redirect(loginUrl);
  }

  if (token) {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));

      const exp = payload.exp * 1000;
      if (Date.now() >= exp) {
        const response = NextResponse.redirect(new URL("/login", request.url));
        response.cookies.delete("token");
        return response;
      }

      if (payload.role === "TENANT" && isUserRoute && path !== "/profile") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }

      if (payload.role === "USER" && isTenantRoute) {
        return NextResponse.redirect(new URL("/", request.url));
      }
    } catch (e) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

function getTokenFromHeader(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }
  return null;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};

