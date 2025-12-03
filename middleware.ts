import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth

  // Public routes that don't require authentication
  const publicRoutes = [
    "/auth/login",
    "/auth/signup",
    "/api/auth",
    "/api/startups", // API routes should be accessible
    "/api/shortlist", // Handles its own authentication
    "/api/enrich",
    "/api/ai-assistant",
    "/api/filter-ai", // AI filter endpoint
    "/api/generate-outreach", // Founder outreach message generation
    "/api/portfolio", // Portfolio management endpoints
    "/api/founders", // Founders list endpoint
  ]

  // Check if current path is public
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route))

  // If user is not logged in and trying to access protected route
  if (!isLoggedIn && !isPublicRoute) {
    const loginUrl = new URL("/auth/login", req.url)
    return NextResponse.redirect(loginUrl)
  }

  // If user is logged in and trying to access auth pages, redirect to home
  if (isLoggedIn && (pathname.startsWith("/auth/login") || pathname.startsWith("/auth/signup"))) {
    const homeUrl = new URL("/", req.url)
    return NextResponse.redirect(homeUrl)
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
