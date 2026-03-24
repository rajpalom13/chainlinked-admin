const POSTHOG_API_KEY = process.env.POSTHOG_API_KEY
const POSTHOG_PROJECT_ID = process.env.POSTHOG_PROJECT_ID
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST?.replace('/ingest', '') || "https://us.posthog.com"

export async function posthogQuery(query: string): Promise<unknown> {
  if (!POSTHOG_API_KEY || !POSTHOG_PROJECT_ID) return null

  const res = await fetch(
    `${POSTHOG_HOST}/api/projects/${POSTHOG_PROJECT_ID}/query/`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${POSTHOG_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: { kind: "HogQLQuery", query } }),
      next: { revalidate: 300 },
    }
  )

  if (!res.ok) return null
  return res.json()
}
