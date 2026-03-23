import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { EmptyState } from "@/components/empty-state"
import { BarChartIcon } from "lucide-react"

export default async function PostHogAnalyticsPage() {
  const dashboardUrl = process.env.POSTHOG_DASHBOARD_URL

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">PostHog Analytics</h1>

      <Card>
        <CardHeader>
          <CardTitle>PostHog Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          {dashboardUrl ? (
            <iframe
              src={dashboardUrl}
              className="h-[800px] w-full rounded-lg border-0"
              title="PostHog Dashboard"
              allow="fullscreen"
            />
          ) : (
            <EmptyState
              title="PostHog not configured"
              description="Set the POSTHOG_DASHBOARD_URL environment variable to embed your PostHog dashboard here."
              icon={<BarChartIcon className="size-12" />}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
