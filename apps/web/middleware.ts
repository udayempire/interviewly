import { NextRequest, NextResponse } from "next/server";

const protectedRoutes = ["/home", "/interview", "/profile"];

const authRoutes = ["/signin", "/signup"];

export default function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const token = request.cookies.get("token")?.value;

    const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));
    const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

    if (isProtectedRoute && !token) {
        const signinUrl = new URL("/signin", request.url);
        signinUrl.searchParams.set("next", pathname);
        return NextResponse.redirect(signinUrl);
    }
    if (isAuthRoute && token) {
        return NextResponse.redirect(new URL("/home", request.url));
    }
    return NextResponse.next();
};

export const config = {
    matcher: [
        // Skip Next.js internals and static files
        "/((?!_next|favicon.ico|public|fonts|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};