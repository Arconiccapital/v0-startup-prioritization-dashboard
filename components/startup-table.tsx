"use client"

import { useState, useMemo, useRef } from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
import type { Startup } from "@/lib/types"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Star } from "lucide-react"

interface StartupTableProps {
  startups: Startup[]
  onSelectStartup: (startup: Startup) => void
  onToggleShortlist?: (startupId: string, shortlisted: boolean) => void
}

type SortField = "rank" | "name" | "score" | "ml_score" | "llm_score"
type SortDirection = "asc" | "desc"

export function StartupTable({ startups, onSelectStartup, onToggleShortlist }: StartupTableProps) {
  const [sortField, setSortField] = useState<SortField>("rank")
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")
  const parentRef = useRef<HTMLDivElement>(null)

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
        case "ml_score":
          aVal = a.aiScores?.ml || 0
          bVal = b.aiScores?.ml || 0
          break
        case "llm_score":
          aVal = a.aiScores?.llm || 0
          bVal = b.aiScores?.llm || 0
          break
      }

      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDirection === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      }

      return sortDirection === "asc" ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number)
    })

    return sorted
  }, [startups, sortField, sortDirection])

  // Set up virtual scrolling
  const rowVirtualizer = useVirtualizer({
    count: sortedStartups.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 73, // Estimated row height in pixels
    overscan: 10, // Render 10 extra rows above/below viewport for smooth scrolling
  })

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
    return score.toFixed(0)
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
      {/* Virtual Scrolling Table Container */}
      <div
        ref={parentRef}
        className="rounded-lg border border-border bg-card overflow-auto"
        style={{ height: "calc(100vh - 280px)" }} // Full height minus header/filters
      >
        <Table className="min-w-[1000px] table-fixed w-full">
          <TableHeader className="sticky top-0 bg-card z-10">
            <TableRow>
              <TableHead className="w-[60px]">
                <span className="text-xs font-medium">⭐</span>
              </TableHead>
              <TableHead className="w-[80px]">
                <Button variant="ghost" size="sm" onClick={() => handleSort("rank")} className="h-7 px-2 text-xs">
                  Rank ↕
                </Button>
              </TableHead>
              <TableHead className="min-w-[300px] max-w-[500px]">
                <Button variant="ghost" size="sm" onClick={() => handleSort("name")} className="h-7 px-2 text-xs">
                  Startup ↕
                </Button>
              </TableHead>
              <TableHead className="w-[100px] text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort("llm_score")}
                  className="h-7 px-2 text-xs ml-auto"
                >
                  LLM ↕
                </Button>
              </TableHead>
              <TableHead className="w-[100px] text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort("ml_score")}
                  className="h-7 px-2 text-xs ml-auto"
                >
                  ML ↕
                </Button>
              </TableHead>
              <TableHead className="w-[200px]">Sector</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedStartups.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground text-sm">
                  No startups found matching your filters
                </TableCell>
              </TableRow>
            ) : (
              <>
                {/* Padding top to maintain scroll height */}
                {rowVirtualizer.getVirtualItems().length > 0 && (
                  <tr style={{ height: `${rowVirtualizer.getVirtualItems()[0]?.start ?? 0}px` }} />
                )}

                {/* Render only visible rows */}
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                  const startup = sortedStartups[virtualRow.index]
                  return (
                    <TableRow
                      key={startup.id}
                      data-index={virtualRow.index}
                      ref={rowVirtualizer.measureElement}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onToggleShortlist?.(startup.id, !startup.shortlisted)}
                          className="hover:scale-125 transition-transform"
                        >
                          <Star
                            className={`w-5 h-5 ${
                              startup.shortlisted
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300 hover:text-yellow-400"
                            }`}
                          />
                        </button>
                      </TableCell>
                      <TableCell className="font-medium text-sm" onClick={() => onSelectStartup(startup)}>
                        <div className="flex items-center gap-1.5">
                          {startup.rank === 1 && <span className="text-base">🏆</span>}
                          {startup.rank === 2 && <span className="text-base">🥈</span>}
                          {startup.rank === 3 && <span className="text-base">🥉</span>}
                          <span>#{startup.rank}</span>
                        </div>
                      </TableCell>
                      <TableCell className="min-w-[300px] max-w-[500px]" onClick={() => onSelectStartup(startup)}>
                        <div className="overflow-hidden">
                          <div className="font-medium text-foreground text-sm truncate">{startup.name}</div>
                          <div className="text-xs text-muted-foreground line-clamp-1">{startup.description}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right" onClick={() => onSelectStartup(startup)}>
                        <span className={`font-semibold text-sm ${getScoreColor(startup.aiScores?.llm)}`}>
                          {formatScore(startup.aiScores?.llm)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right" onClick={() => onSelectStartup(startup)}>
                        <span className={`font-semibold text-sm ${getScoreColor(startup.aiScores?.ml)}`}>
                          {formatScore(startup.aiScores?.ml)}
                        </span>
                      </TableCell>
                      <TableCell onClick={() => onSelectStartup(startup)}>
                        <Badge variant="outline" className="text-xs">
                          {startup.sector}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}

                {/* Padding bottom to maintain scroll height */}
                {rowVirtualizer.getVirtualItems().length > 0 && (
                  <tr
                    style={{
                      height: `${
                        rowVirtualizer.getTotalSize() -
                        (rowVirtualizer.getVirtualItems()[rowVirtualizer.getVirtualItems().length - 1]?.end ?? 0)
                      }px`,
                    }}
                  />
                )}
              </>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
