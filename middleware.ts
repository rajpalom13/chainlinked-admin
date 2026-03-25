import { NextResponse, type NextRequest } from "next/server"
// import { verifySessionToken, COOKIE_NAME } from "@/lib/auth"

export async function middleware(request: NextRequest) {
  // Auth temporarily disabled — allow all requests through
  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*"],
}
