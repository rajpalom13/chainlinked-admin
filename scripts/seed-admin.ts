// Usage: npx tsx scripts/seed-admin.ts <username> <password>
import { createClient } from "@supabase/supabase-js"
import bcrypt from "bcryptjs"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function main() {
  const [username, password] = process.argv.slice(2)

  if (!username || !password) {
    console.error("Usage: npx tsx scripts/seed-admin.ts <username> <password>")
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const hash = await bcrypt.hash(password, 12)

  const { error } = await supabase.from("admin_users").insert({
    username,
    password_hash: hash,
  })

  if (error) {
    console.error("Failed to create admin:", error.message)
    process.exit(1)
  }

  console.log(`Admin user "${username}" created successfully.`)
}

main()
