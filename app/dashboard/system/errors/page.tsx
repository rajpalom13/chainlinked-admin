import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { SentryErrorsViewer } from "./sentry-errors-viewer"

export default function ErrorsPage() {
  return (
    <div className="flex flex-col gap-4 px-4 lg:px-6">
      <Card>
        <CardHeader>
          <CardTitle>Platform Errors</CardTitle>
          <CardDescription>
            Unresolved Sentry issues from the ChainLinked platform
          </CardDescription>
        </CardHeader>
      </Card>
      <SentryErrorsViewer />
    </div>
  )
}
