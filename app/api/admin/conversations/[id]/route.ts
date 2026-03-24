import { NextResponse, type NextRequest } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/client"
import { verifySessionToken, COOKIE_NAME } from "@/lib/auth"

async function authenticate(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value
  if (!token) return null
  return verifySessionToken(token)
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await authenticate(request)
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  const { data, error } = await supabaseAdmin
    .from("compose_conversations")
    .select("id, messages, created_at, updated_at")
    .eq("id", id)
    .single()

  if (error || !data) {
    return NextResponse.json(
      { error: "Conversation not found" },
      { status: 404 }
    )
  }

  return NextResponse.json(data)
}
