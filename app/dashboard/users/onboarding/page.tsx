import { supabaseAdmin } from "@/lib/supabase/client"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"

async function getOnboardingFunnel() {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [
    { count: signedUp },
    { count: onboardingComplete },
    linkedInData,
    firstPostData,
    firstScheduledData,
    activeData,
  ] = await Promise.all([
    supabaseAdmin.from("profiles").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("profiles").select("*", { count: "exact", head: true }).eq("onboarding_completed", true),
    supabaseAdmin.from("linkedin_tokens").select("user_id"),
    supabaseAdmin.from("generated_posts").select("user_id"),
    supabaseAdmin.from("scheduled_posts").select("user_id"),
    supabaseAdmin.from("generated_posts").select("user_id").gte("created_at", weekAgo),
  ])

  const linkedInConnected = new Set(linkedInData.data?.map((r) => r.user_id)).size
  const firstPostGenerated = new Set(firstPostData.data?.map((r) => r.user_id)).size
  const firstPostScheduled = new Set(firstScheduledData.data?.map((r) => r.user_id)).size
  const active7d = new Set(activeData.data?.map((r) => r.user_id)).size

  const total = signedUp ?? 1

  return [
    { label: "Signed Up", count: signedUp ?? 0, pct: 100 },
    { label: "Onboarding Complete", count: onboardingComplete ?? 0, pct: Math.round(((onboardingComplete ?? 0) / total) * 100) },
    { label: "LinkedIn Connected", count: linkedInConnected, pct: Math.round((linkedInConnected / total) * 100) },
    { label: "First Post Generated", count: firstPostGenerated, pct: Math.round((firstPostGenerated / total) * 100) },
    { label: "First Post Scheduled", count: firstPostScheduled, pct: Math.round((firstPostScheduled / total) * 100) },
    { label: "Active (7d)", count: active7d, pct: Math.round((active7d / total) * 100) },
  ]
}

export default async function OnboardingFunnelPage() {
  const steps = await getOnboardingFunnel()

  return (
    <div className="flex flex-col gap-4 px-4 lg:px-6">
      <div>
        <h1 className="text-2xl font-semibold">Onboarding Funnel</h1>
        <p className="text-sm text-muted-foreground">
          User progression through key activation steps
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Funnel Steps</CardTitle>
          <CardDescription>
            Percentage of total users who reached each step
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {steps.map((step) => (
              <div key={step.label} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{step.label}</span>
                  <span className="text-muted-foreground">
                    {step.count.toLocaleString()} ({step.pct}%)
                  </span>
                </div>
                <div className="h-8 w-full rounded-md bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-md bg-primary transition-all"
                    style={{ width: `${step.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
