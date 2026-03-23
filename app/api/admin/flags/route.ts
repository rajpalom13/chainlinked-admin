import { NextResponse, type NextRequest } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/client"
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

  const { data, error } = await supabaseAdmin
    .from("feature_flags")
    .select("*")
    .order("name")

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const admin = await authenticate(request)
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { name, description } = body

  if (!name || typeof name !== "string") {
    return NextResponse.json(
      { error: "Name is required" },
      { status: 400 }
    )
  }

  const { data, error } = await supabaseAdmin
    .from("feature_flags")
    .insert({
      name,
      description: description ?? null,
      enabled: false,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
