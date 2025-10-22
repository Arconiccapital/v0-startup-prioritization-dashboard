"use client"

import { useState, useMemo } from "react"
import type { Startup } from "@/lib/types"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface StartupTableProps {
  startups: Startup[]
  onSelectStartup: (startup: Startup) => void
}

type SortField = "rank" | "name" | "score"
type SortDirection = "asc" | "desc"

export function StartupTable({ startups, onSelectStartup }: StartupTableProps) {
  const [sortField, setSortField] = useState<SortField>("rank")
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")

  // Sort startups
  const sortedStartups = useMemo(() => {
    const sorted = [...startups]

    sorted.sort((a, b) => {
      let aVal: number | string = 0
      let bVal: number | string = 0

      switch (sortField) {
        case "rank":
          aVal = a.rank || 0
          bVal = b.rank || 0
          break
        case "name":
          aVal = a.name
          bVal = b.name
          break
        case "score":
          aVal = a.score || 0
          bVal = b.score || 0
          break
      }

      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDirection === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      }

      return sortDirection === "asc" ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number)
    })

    return sorted
  }, [startups, sortField, sortDirection])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const formatScore = (score?: number) => {
    if (score === undefined) return "-"
    return score.toFixed(1)
  }

  const getScoreColor = (score?: number) => {
    if (!score) return "text-muted-foreground"
    if (score >= 80) return "text-green-600 dark:text-green-400"
    if (score >= 60) return "text-blue-600 dark:text-blue-400"
    if (score >= 40) return "text-yellow-600 dark:text-yellow-400"
    return "text-orange-600 dark:text-orange-400"
  }

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="rounded-lg border border-border bg-card overflow-x-auto">
        <Table className="min-w-[900px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">
                <Button variant="ghost" size="sm" onClick={() => handleSort("rank")} className="h-7 px-2 text-xs">
                  Rank ↕
                </Button>
              </TableHead>
              <TableHead className="min-w-[300px]">
                <Button variant="ghost" size="sm" onClick={() => handleSort("name")} className="h-7 px-2 text-xs">
                  Startup ↕
                </Button>
              </TableHead>
              <TableHead className="w-[150px]">Sector</TableHead>
              <TableHead className="w-[120px]">Stage</TableHead>
              <TableHead className="w-[100px] text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort("score")}
                  className="h-7 px-2 text-xs ml-auto"
                >
                  Score ↕
                </Button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedStartups.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground text-sm">
                  No startups found matching your filters
                </TableCell>
              </TableRow>
            ) : (
              sortedStartups.map((startup) => (
                <TableRow
                  key={startup.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => onSelectStartup(startup)}
                >
                  <TableCell className="font-medium text-sm">
                    <div className="flex items-center gap-1.5">
                      {startup.rank === 1 && <span className="text-base">🏆</span>}
                      {startup.rank === 2 && <span className="text-base">🥈</span>}
                      {startup.rank === 3 && <span className="text-base">🥉</span>}
                      <span>#{startup.rank}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium text-foreground text-sm">{startup.name}</div>
                      <div className="text-xs text-muted-foreground line-clamp-1">{startup.description}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {startup.sector}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">
                      {startup.stage}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={`font-bold text-base ${getScoreColor(startup.score)}`}>
                      {formatScore(startup.score)}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
