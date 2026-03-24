import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/empty-state"
import { BarChartIcon } from "lucide-react"
import { PostHogTabs } from "./posthog-tabs"

export default async function PostHogAnalyticsPage() {
  const dashboardUrl = process.env.POSTHOG_DASHBOARD_URL
  const posthogApiKey = process.env.POSTHOG_API_KEY
  const posthogProjectId = process.env.POSTHOG_PROJECT_ID
  const posthogHost = "https://us.posthog.com"

  const configured = !!posthogApiKey && !!posthogProjectId

  return (
    <div className="space-y-6 px-4 lg:px-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">PostHog Analytics</h1>
        {configured && (
          <a
            href={`${posthogHost}/project/${posthogProjectId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:text-foreground underline"
          >
            Open PostHog Dashboard &rarr;
          </a>
        )}
      </div>

      {!configured ? (
        <Card>
          <CardContent className="pt-6">
            <EmptyState
              title="PostHog Not Configured"
              description="Set POSTHOG_API_KEY and POSTHOG_PROJECT_ID in .env.local to enable PostHog analytics."
              icon={<BarChartIcon className="size-12" />}
            />
          </CardContent>
        </Card>
      ) : (
        <PostHogTabs
          dashboardUrl={dashboardUrl ?? null}
          posthogHost={posthogHost}
          projectId={posthogProjectId!}
          apiKey={posthogApiKey!}
        />
      )}
    </div>
  )
}
