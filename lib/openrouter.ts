interface OpenRouterKeyInfo {
  usage: number
  limit: number | null
  is_free_tier: boolean
  rate_limit: {
    requests: number
    interval: string
  }
}

export async function getOpenRouterBalance(): Promise<OpenRouterKeyInfo | null> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) return null

  try {
    const res = await fetch("https://openrouter.ai/api/v1/auth/key", {
      headers: { Authorization: `Bearer ${apiKey}` },
      next: { revalidate: 300 },
    })

    if (!res.ok) return null

    const data = await res.json()
    return data.data as OpenRouterKeyInfo
  } catch {
    return null
  }
}
