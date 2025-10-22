"use client"

import { useMemo } from "react"
import type { Startup } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface AnalyticsDashboardProps {
  startups: Startup[]
}

export function AnalyticsDashboard({ startups }: AnalyticsDashboardProps) {
  const analytics = useMemo(() => {
    // Score distribution
    const scoreRanges = {
      excellent: startups.filter((s) => (s.score || 0) >= 80).length,
      good: startups.filter((s) => (s.score || 0) >= 60 && (s.score || 0) < 80).length,
      fair: startups.filter((s) => (s.score || 0) >= 40 && (s.score || 0) < 60).length,
      poor: startups.filter((s) => (s.score || 0) < 40).length,
    }

    // Sector distribution
    const sectorCounts = startups.reduce(
      (acc, startup) => {
        acc[startup.sector] = (acc[startup.sector] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    // Stage distribution
    const stageCounts = startups.reduce(
      (acc, startup) => {
        acc[startup.stage] = (acc[startup.stage] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    // Average scores by sector
    const sectorScores = startups.reduce(
      (acc, startup) => {
        if (!acc[startup.sector]) {
          acc[startup.sector] = { total: 0, count: 0 }
        }
        acc[startup.sector].total += startup.score || 0
        acc[startup.sector].count += 1
        return acc
      },
      {} as Record<string, { total: number; count: number }>,
    )

    // Top performers
    const topPerformers = [...startups].sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 5)

    // Average score
    const avgScore = startups.reduce((sum, s) => sum + (s.score || 0), 0) / startups.length

    return {
      scoreRanges,
      sectorCounts,
      stageCounts,
      sectorScores,
      topPerformers,
      avgScore,
    }
  }, [startups])

  const formatScore = (score: number) => score.toFixed(1)

  const sectorData = Object.entries(analytics.sectorCounts).map(([sector, count]) => ({
    sector,
    count,
    avgScore: (analytics.sectorScores[sector].total / analytics.sectorScores[sector].count).toFixed(1),
  }))

  const stageData = Object.entries(analytics.stageCounts).map(([stage, count]) => ({
    stage,
    count,
  }))

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <span className="text-muted-foreground">📈</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatScore(analytics.avgScore)}</div>
            <p className="text-xs text-muted-foreground">Across all {startups.length} startups</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Performer</CardTitle>
            <span className="text-muted-foreground">🏆</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.topPerformers[0]?.name || "-"}</div>
            <p className="text-xs text-muted-foreground">
              Score: {formatScore(analytics.topPerformers[0]?.score || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Startups</CardTitle>
            <span className="text-muted-foreground">📊</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{startups.length}</div>
            <p className="text-xs text-muted-foreground">In your portfolio</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Score Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Score Distribution</CardTitle>
            <CardDescription>Breakdown of startups by score range</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950">
                <span className="font-medium">Excellent (80-100)</span>
                <span className="text-2xl font-bold">{analytics.scoreRanges.excellent}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950">
                <span className="font-medium">Good (60-79)</span>
                <span className="text-2xl font-bold">{analytics.scoreRanges.good}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-950">
                <span className="font-medium">Fair (40-59)</span>
                <span className="text-2xl font-bold">{analytics.scoreRanges.fair}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-950">
                <span className="font-medium">Poor (0-39)</span>
                <span className="text-2xl font-bold">{analytics.scoreRanges.poor}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sector Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Average Score by Sector</CardTitle>
            <CardDescription>Performance comparison across sectors</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {sectorData.map((item) => (
                <div key={item.sector} className="flex items-center justify-between p-2 border-b">
                  <div>
                    <div className="font-medium text-sm">{item.sector}</div>
                    <div className="text-xs text-muted-foreground">{item.count} startups</div>
                  </div>
                  <div className="text-lg font-bold">{item.avgScore}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Stage Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Startups by Stage</CardTitle>
            <CardDescription>Distribution across funding stages</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stageData.map((item) => (
                <div key={item.stage} className="flex items-center justify-between p-2 border-b">
                  <span className="font-medium text-sm">{item.stage}</span>
                  <span className="text-lg font-bold">{item.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Performers */}
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Performers</CardTitle>
            <CardDescription>Highest scoring startups</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.topPerformers.map((startup, index) => (
                <div key={startup.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-primary/10">
                      {index === 0 ? (
                        <span className="text-yellow-500">🏆</span>
                      ) : (
                        <span className="text-sm font-semibold text-primary">#{index + 1}</span>
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{startup.name}</div>
                      <div className="text-xs text-muted-foreground">{startup.sector}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-sm">{formatScore(startup.score || 0)}</div>
                    <div className="text-xs text-muted-foreground">{startup.stage}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
