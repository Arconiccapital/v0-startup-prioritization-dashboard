"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Building2,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  ExternalLink,
  Loader2,
  PieChart,
  BarChart3,
  Target,
  AlertTriangle,
  CheckCircle,
} from "lucide-react"
import type { PortfolioSummary } from "@/lib/types"

interface PortfolioInvestmentWithExtras {
  id: string
  startupId: string
  investmentDate: string
  investmentAmount: number
  investmentRound?: string
  investmentType: string
  status: string
  currentValuation?: number
  currentEquityPct?: number
  equityPercentage?: number
  exitAmount?: number
  exitMultiple?: number
  exitType?: string
  boardSeat: boolean
  leadInvestor: boolean
  totalInvested: number
  currentValue?: number
  moic?: number
  startup?: {
    id: string
    name: string
    sector: string
    country: string
    description?: string
    companyInfo?: Record<string, unknown>
  }
  _count?: {
    milestones: number
    updates: number
    boardMeetings: number
    communications: number
  }
}

function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—"
  if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(1)}B`
  }
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(0)}K`
  }
  return `$${value.toFixed(0)}`
}

function formatMOIC(moic: number | null | undefined): string {
  if (moic === null || moic === undefined) return "—"
  return `${moic.toFixed(2)}x`
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
  })
}

export default function PortfolioPage() {
  const [investments, setInvestments] = useState<PortfolioInvestmentWithExtras[]>([])
  const [summary, setSummary] = useState<PortfolioSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [availableStartups, setAvailableStartups] = useState<
    Array<{ id: string; name: string; sector: string }>
  >([])
  const [newInvestment, setNewInvestment] = useState({
    startupId: "",
    investmentDate: new Date().toISOString().split("T")[0],
    investmentAmount: "",
    investmentRound: "Seed",
    investmentType: "equity",
    preMoneyValuation: "",
    postMoneyValuation: "",
    equityPercentage: "",
    leadInvestor: false,
    boardSeat: false,
    investmentThesis: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchPortfolio = useCallback(async () => {
    try {
      setLoading(true)
      const [investmentsRes, summaryRes] = await Promise.all([
        fetch(`/api/portfolio?includeStartup=true${statusFilter !== "all" ? `&status=${statusFilter}` : ""}`),
        fetch("/api/portfolio/summary"),
      ])

      if (investmentsRes.ok) {
        const data = await investmentsRes.json()
        setInvestments(data.investments)
      }

      if (summaryRes.ok) {
        const data = await summaryRes.json()
        setSummary(data.summary)
      }
    } catch (error) {
      console.error("Failed to fetch portfolio:", error)
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  const fetchAvailableStartups = async () => {
    try {
      // Fetch startups that are in Term Sheet or Closed stage but don't have a portfolio investment
      const res = await fetch("/api/startups?pipelineStage=Term Sheet&limit=100")
      if (res.ok) {
        const data = await res.json()
        setAvailableStartups(
          data.startups.map((s: { id: string; name: string; sector: string }) => ({
            id: s.id,
            name: s.name,
            sector: s.sector,
          }))
        )
      }
    } catch (error) {
      console.error("Failed to fetch available startups:", error)
    }
  }

  useEffect(() => {
    fetchPortfolio()
  }, [fetchPortfolio])

  const handleAddInvestment = async () => {
    if (!newInvestment.startupId || !newInvestment.investmentAmount) {
      alert("Please select a startup and enter an investment amount")
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch("/api/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newInvestment,
          investmentAmount: parseFloat(newInvestment.investmentAmount),
          preMoneyValuation: newInvestment.preMoneyValuation
            ? parseFloat(newInvestment.preMoneyValuation)
            : undefined,
          postMoneyValuation: newInvestment.postMoneyValuation
            ? parseFloat(newInvestment.postMoneyValuation)
            : undefined,
          equityPercentage: newInvestment.equityPercentage
            ? parseFloat(newInvestment.equityPercentage)
            : undefined,
        }),
      })

      if (res.ok) {
        setIsAddDialogOpen(false)
        setNewInvestment({
          startupId: "",
          investmentDate: new Date().toISOString().split("T")[0],
          investmentAmount: "",
          investmentRound: "Seed",
          investmentType: "equity",
          preMoneyValuation: "",
          postMoneyValuation: "",
          equityPercentage: "",
          leadInvestor: false,
          boardSeat: false,
          investmentThesis: "",
        })
        fetchPortfolio()
      } else {
        const error = await res.json()
        alert(error.error || "Failed to add investment")
      }
    } catch (error) {
      console.error("Error adding investment:", error)
      alert("Failed to add investment")
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>
      case "exited":
        return <Badge className="bg-blue-100 text-blue-800">Exited</Badge>
      case "written_off":
        return <Badge className="bg-red-100 text-red-800">Written Off</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Portfolio</h1>
          <p className="text-muted-foreground">
            Manage and track your portfolio investments
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
          setIsAddDialogOpen(open)
          if (open) fetchAvailableStartups()
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Investment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Portfolio Investment</DialogTitle>
              <DialogDescription>
                Record a new investment in your portfolio
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Company *</Label>
                  <Select
                    value={newInvestment.startupId}
                    onValueChange={(value) =>
                      setNewInvestment({ ...newInvestment, startupId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select company" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableStartups.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name} ({s.sector})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Investment Date *</Label>
                  <Input
                    type="date"
                    value={newInvestment.investmentDate}
                    onChange={(e) =>
                      setNewInvestment({
                        ...newInvestment,
                        investmentDate: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Investment Amount ($) *</Label>
                  <Input
                    type="number"
                    placeholder="500000"
                    value={newInvestment.investmentAmount}
                    onChange={(e) =>
                      setNewInvestment({
                        ...newInvestment,
                        investmentAmount: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Round</Label>
                  <Select
                    value={newInvestment.investmentRound}
                    onValueChange={(value) =>
                      setNewInvestment({
                        ...newInvestment,
                        investmentRound: value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pre-Seed">Pre-Seed</SelectItem>
                      <SelectItem value="Seed">Seed</SelectItem>
                      <SelectItem value="Series A">Series A</SelectItem>
                      <SelectItem value="Series B">Series B</SelectItem>
                      <SelectItem value="Series C">Series C</SelectItem>
                      <SelectItem value="Growth">Growth</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Pre-Money Valuation ($)</Label>
                  <Input
                    type="number"
                    placeholder="10000000"
                    value={newInvestment.preMoneyValuation}
                    onChange={(e) =>
                      setNewInvestment({
                        ...newInvestment,
                        preMoneyValuation: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Post-Money Valuation ($)</Label>
                  <Input
                    type="number"
                    placeholder="12000000"
                    value={newInvestment.postMoneyValuation}
                    onChange={(e) =>
                      setNewInvestment({
                        ...newInvestment,
                        postMoneyValuation: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ownership %</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="10"
                    value={newInvestment.equityPercentage}
                    onChange={(e) =>
                      setNewInvestment({
                        ...newInvestment,
                        equityPercentage: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Investment Type</Label>
                  <Select
                    value={newInvestment.investmentType}
                    onValueChange={(value) =>
                      setNewInvestment({
                        ...newInvestment,
                        investmentType: value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="equity">Equity</SelectItem>
                      <SelectItem value="safe">SAFE</SelectItem>
                      <SelectItem value="convertible">Convertible Note</SelectItem>
                      <SelectItem value="debt">Debt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 flex items-end gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={newInvestment.leadInvestor}
                      onChange={(e) =>
                        setNewInvestment({
                          ...newInvestment,
                          leadInvestor: e.target.checked,
                        })
                      }
                      className="rounded border-gray-300"
                    />
                    Lead Investor
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={newInvestment.boardSeat}
                      onChange={(e) =>
                        setNewInvestment({
                          ...newInvestment,
                          boardSeat: e.target.checked,
                        })
                      }
                      className="rounded border-gray-300"
                    />
                    Board Seat
                  </label>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Investment Thesis</Label>
                <Textarea
                  placeholder="Why are we investing in this company..."
                  value={newInvestment.investmentThesis}
                  onChange={(e) =>
                    setNewInvestment({
                      ...newInvestment,
                      investmentThesis: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddInvestment} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Investment"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Invested</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(summary.totalInvested)}
              </div>
              <p className="text-xs text-muted-foreground">
                Across {summary.activeInvestments + summary.exitedInvestments + summary.writtenOff} investments
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(summary.totalCurrentValue + summary.totalRealized)}
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                {summary.unrealizedGain >= 0 ? (
                  <ArrowUpRight className="h-3 w-3 text-green-600" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 text-red-600" />
                )}
                <span className={summary.unrealizedGain >= 0 ? "text-green-600" : "text-red-600"}>
                  {formatCurrency(Math.abs(summary.unrealizedGain))} unrealized
                </span>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Portfolio MOIC</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatMOIC(summary.totalMOIC)}</div>
              <p className="text-xs text-muted-foreground">
                Multiple on invested capital
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Portfolio Status</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">{summary.activeInvestments}</span>
                  <span className="text-xs text-muted-foreground">active</span>
                </div>
                <div className="flex items-center gap-1">
                  <ArrowUpRight className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">{summary.exitedInvestments}</span>
                  <span className="text-xs text-muted-foreground">exited</span>
                </div>
                <div className="flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium">{summary.writtenOff}</span>
                  <span className="text-xs text-muted-foreground">w/o</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Sector Distribution and Charts */}
      {summary && Object.keys(summary.bySector).length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                By Sector
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(summary.bySector)
                  .sort((a, b) => b[1].invested - a[1].invested)
                  .slice(0, 6)
                  .map(([sector, data]) => (
                    <div key={sector} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor: `hsl(${
                              (Object.keys(summary.bySector).indexOf(sector) * 360) /
                              Object.keys(summary.bySector).length
                            }, 70%, 50%)`,
                          }}
                        />
                        <span className="text-sm font-medium">{sector}</span>
                        <Badge variant="secondary" className="text-xs">
                          {data.count}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {formatCurrency(data.invested)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatCurrency(data.currentValue)} current
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                By Vintage Year
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(summary.byYear)
                  .sort((a, b) => parseInt(b[0]) - parseInt(a[0]))
                  .slice(0, 6)
                  .map(([year, data]) => (
                    <div key={year} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{year}</span>
                        <Badge variant="secondary" className="text-xs">
                          {data.count} deals
                        </Badge>
                      </div>
                      <div className="text-sm font-medium">
                        {formatCurrency(data.invested)}
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Portfolio Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Portfolio Companies</CardTitle>
              <CardDescription>
                {investments.length} companies in your portfolio
              </CardDescription>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="exited">Exited</SelectItem>
                <SelectItem value="written_off">Written Off</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {investments.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No investments yet</h3>
              <p className="text-muted-foreground">
                Add your first portfolio investment to get started
              </p>
              <Button
                className="mt-4"
                onClick={() => {
                  fetchAvailableStartups()
                  setIsAddDialogOpen(true)
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Investment
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Sector</TableHead>
                  <TableHead>Round</TableHead>
                  <TableHead className="text-right">Invested</TableHead>
                  <TableHead className="text-right">Current Value</TableHead>
                  <TableHead className="text-right">MOIC</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Date</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {investments.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {inv.startup?.name || "Unknown"}
                        {inv.leadInvestor && (
                          <Badge variant="outline" className="text-xs">
                            Lead
                          </Badge>
                        )}
                        {inv.boardSeat && (
                          <Badge variant="outline" className="text-xs">
                            Board
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {inv.startup?.sector || "—"}
                    </TableCell>
                    <TableCell>{inv.investmentRound || "—"}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(inv.totalInvested)}
                    </TableCell>
                    <TableCell className="text-right">
                      {inv.status === "exited" ? (
                        <span className="text-blue-600 font-medium">
                          {formatCurrency(inv.exitAmount)}
                        </span>
                      ) : inv.status === "written_off" ? (
                        <span className="text-red-600">$0</span>
                      ) : (
                        formatCurrency(inv.currentValue)
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {inv.status === "exited" ? (
                        <span
                          className={
                            (inv.exitMultiple || 0) >= 1
                              ? "text-green-600 font-medium"
                              : "text-red-600"
                          }
                        >
                          {formatMOIC(inv.exitMultiple)}
                        </span>
                      ) : inv.moic ? (
                        <span
                          className={
                            inv.moic >= 1
                              ? "text-green-600 font-medium"
                              : "text-red-600"
                          }
                        >
                          {formatMOIC(inv.moic)}
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {getStatusBadge(inv.status)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatDate(inv.investmentDate)}
                    </TableCell>
                    <TableCell>
                      <Link href={`/portfolio/${inv.id}`}>
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
