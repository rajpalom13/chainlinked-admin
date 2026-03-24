import { NextResponse, type NextRequest } from "next/server"
import { verifySessionToken, COOKIE_NAME } from "@/lib/auth"

async function authenticate(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value
  if (!token) return null
  return verifySessionToken(token)
}

export async function GET(request: NextRequest) {
  const admin = await authenticate(request)
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const apiToken = process.env.SENTRY_API_TOKEN
  const org = process.env.SENTRY_ORG
  const project = process.env.SENTRY_PROJECT

  if (!apiToken || !org || !project) {
    return NextResponse.json(
      { error: "Sentry configuration missing" },
      { status: 500 }
    )
  }

  const { searchParams } = request.nextUrl
  const query = searchParams.get("query") || "is:unresolved"
  const sort = searchParams.get("sort") || "date"
  const limit = searchParams.get("limit") || "25"
  const cursor = searchParams.get("cursor") || ""

  const url = new URL(
    `https://sentry.io/api/0/projects/${org}/${project}/issues/`
  )
  url.searchParams.set("query", query)
  url.searchParams.set("sort", sort)
  url.searchParams.set("limit", limit)
  if (cursor) url.searchParams.set("cursor", cursor)

  try {
    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${apiToken}`,
      },
      next: { revalidate: 60 },
    })

    if (!response.ok) {
      const text = await response.text()
      return NextResponse.json(
        { error: `Sentry API error: ${response.status}`, details: text },
        { status: response.status }
      )
    }

    const issues = await response.json()

    return NextResponse.json({
      issues,
      link: response.headers.get("Link"),
    })
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch from Sentry", details: String(err) },
      { status: 500 }
    )
  }
}
