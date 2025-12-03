"use client"

import { useState, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import { useVirtualizer } from "@tanstack/react-virtual"
import type { Founder } from "@/lib/types"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ExternalLink, Mail, Building2, GraduationCap, Briefcase, User } from "lucide-react"

interface FoundersTableProps {
  founders: Founder[]
  onSelectCompany: (companyId: string) => void
  onGenerateOutreach: (founder: Founder) => void
}

type SortField = "name" | "companyName" | "companyRank" | "companySector"
type SortDirection = "asc" | "desc"

export function FoundersTable({ founders, onSelectCompany, onGenerateOutreach }: FoundersTableProps) {
  const router = useRouter()
  const [sortField, setSortField] = useState<SortField>("companyRank")
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")
  const parentRef = useRef<HTMLDivElement>(null)

  const handleSelectFounder = (founder: Founder) => {
    router.push(`/founder/${founder.id}`)
  }

  // Sort founders
  const sortedFounders = useMemo(() => {
    const sorted = [...founders]

    sorted.sort((a, b) => {
      let aVal: number | string = 0
      let bVal: number | string = 0

      switch (sortField) {
        case "name":
          aVal = a.name.toLowerCase()
          bVal = b.name.toLowerCase()
          break
        case "companyName":
          aVal = a.companyName.toLowerCase()
          bVal = b.companyName.toLowerCase()
          break
        case "companyRank":
          aVal = a.companyRank || 9999
          bVal = b.companyRank || 9999
          break
        case "companySector":
          aVal = a.companySector.toLowerCase()
          bVal = b.companySector.toLowerCase()
          break
      }

      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDirection === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      }

      return sortDirection === "asc" ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number)
    })

    return sorted
  }, [founders, sortField, sortDirection])

  // Set up virtual scrolling
  const rowVirtualizer = useVirtualizer({
    count: sortedFounders.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 72, // Estimated row height
    overscan: 10,
  })

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const truncateText = (text: string | null, maxLength: number = 60) => {
    if (!text) return "—"
    if (text.length <= maxLength) return text
    return text.slice(0, maxLength) + "..."
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Virtual Scrolling Table Container */}
        <div
          ref={parentRef}
          className="rounded-lg border border-border bg-card overflow-auto"
          style={{ height: "calc(100vh - 280px)" }}
        >
          <Table className="min-w-[1200px] table-fixed w-full">
            <TableHeader className="sticky top-0 bg-card z-10">
              <TableRow>
                <TableHead className="w-[80px]">
                  <Button variant="ghost" size="sm" onClick={() => handleSort("companyRank")} className="h-7 px-2 text-xs">
                    Rank ↕
                  </Button>
                </TableHead>
                <TableHead className="w-[180px]">
                  <Button variant="ghost" size="sm" onClick={() => handleSort("name")} className="h-7 px-2 text-xs">
                    Founder ↕
                  </Button>
                </TableHead>
                <TableHead className="w-[200px]">
                  <Button variant="ghost" size="sm" onClick={() => handleSort("companyName")} className="h-7 px-2 text-xs">
                    Company ↕
                  </Button>
                </TableHead>
                <TableHead className="w-[120px]">
                  <Button variant="ghost" size="sm" onClick={() => handleSort("companySector")} className="h-7 px-2 text-xs">
                    Sector ↕
                  </Button>
                </TableHead>
                <TableHead className="w-[250px]">
                  <div className="flex items-center gap-1 text-xs font-medium">
                    <GraduationCap className="w-3.5 h-3.5" />
                    Education
                  </div>
                </TableHead>
                <TableHead className="w-[250px]">
                  <div className="flex items-center gap-1 text-xs font-medium">
                    <Briefcase className="w-3.5 h-3.5" />
                    Experience
                  </div>
                </TableHead>
                <TableHead className="w-[120px] text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedFounders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground text-sm">
                    No founders found matching your filters
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
                    const founder = sortedFounders[virtualRow.index]
                    return (
                      <TableRow
                        key={founder.id}
                        data-index={virtualRow.index}
                        ref={rowVirtualizer.measureElement}
                        className="hover:bg-muted/50 transition-colors"
                      >
                        <TableCell className="font-medium text-sm">
                          <div className="flex items-center gap-1.5">
                            {founder.companyRank === 1 && <span className="text-base">🏆</span>}
                            {founder.companyRank === 2 && <span className="text-base">🥈</span>}
                            {founder.companyRank === 3 && <span className="text-base">🥉</span>}
                            <span className="text-muted-foreground">
                              {founder.companyRank ? `#${founder.companyRank}` : "—"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <button
                            onClick={() => handleSelectFounder(founder)}
                            className="text-left py-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group"
                          >
                            <div className="flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-muted-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                              <span className="font-medium text-sm group-hover:underline">{founder.name}</span>
                            </div>
                            <div className="text-xs text-muted-foreground">{founder.role}</div>
                          </button>
                        </TableCell>
                        <TableCell>
                          <button
                            onClick={() => onSelectCompany(founder.companyId)}
                            className="text-left hover:text-blue-600 dark:hover:text-blue-400 transition-colors group"
                          >
                            <div className="flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-muted-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                              <span className="font-medium text-sm group-hover:underline">{founder.companyName}</span>
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5">{founder.companyCountry}</div>
                          </button>
                        </TableCell>
                        <TableCell>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge variant="outline" className="text-xs max-w-[120px] truncate cursor-help">
                                {founder.companySector.length > 20
                                  ? founder.companySector.slice(0, 20) + "..."
                                  : founder.companySector}
                              </Badge>
                            </TooltipTrigger>
                            {founder.companySector.length > 20 && (
                              <TooltipContent side="bottom" className="max-w-[300px]">
                                <p className="text-sm">{founder.companySector}</p>
                              </TooltipContent>
                            )}
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          {founder.education ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="text-xs text-muted-foreground cursor-help line-clamp-2">
                                  {truncateText(founder.education)}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent side="bottom" className="max-w-[400px]">
                                <p className="text-sm">{founder.education}</p>
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {founder.priorExperience ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="text-xs text-muted-foreground cursor-help line-clamp-2">
                                  {truncateText(founder.priorExperience)}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent side="bottom" className="max-w-[400px]">
                                <p className="text-sm">{founder.priorExperience}</p>
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
                            {founder.linkedIn && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <a
                                    href={founder.linkedIn}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1.5 rounded hover:bg-muted transition-colors"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <ExternalLink className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                  </a>
                                </TooltipTrigger>
                                <TooltipContent>View LinkedIn</TooltipContent>
                              </Tooltip>
                            )}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onGenerateOutreach(founder)}
                                  className="h-7 px-2"
                                >
                                  <Mail className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Generate Outreach</TooltipContent>
                            </Tooltip>
                          </div>
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
    </TooltipProvider>
  )
}
