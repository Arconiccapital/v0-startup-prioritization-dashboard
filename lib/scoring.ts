import type { Startup } from "./types"

export function scoreAllStartups(startups: Startup[]): Startup[] {
  // Sort by score (highest first) and assign ranks
  const sorted = [...startups].sort((a, b) => b.score - a.score)

  return sorted.map((startup, index) => ({
    ...startup,
    rank: index + 1,
  }))
}

export const rankStartups = scoreAllStartups
