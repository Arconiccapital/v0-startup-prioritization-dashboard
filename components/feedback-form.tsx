"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

interface FeedbackFormProps {
  onSubmit: (
    scores: {
      team: number
      market: number
      product: number
      businessModel: number
      traction: number
      investmentReadiness: number
    },
    notes: string,
  ) => void
  onCancel: () => void
}

export function FeedbackForm({ onSubmit, onCancel }: FeedbackFormProps) {
  const [scores, setScores] = useState({
    team: 5,
    market: 5,
    product: 5,
    businessModel: 5,
    traction: 5,
    investmentReadiness: 5,
  })
  const [notes, setNotes] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(scores, notes)
    setScores({
      team: 5,
      market: 5,
      product: 5,
      businessModel: 5,
      traction: 5,
      investmentReadiness: 5,
    })
    setNotes("")
  }

  const updateScore = (field: keyof typeof scores, value: number) => {
    setScores((prev) => ({ ...prev, [field]: Math.max(1, Math.min(10, value)) }))
  }

  const criteria = [
    { key: "team" as const, label: "Team Quality", description: "Experience, skills, and execution capability" },
    { key: "market" as const, label: "Market Opportunity", description: "Market size, growth potential, and timing" },
    {
      key: "product" as const,
      label: "Product/Technology",
      description: "Innovation, differentiation, and technical moat",
    },
    {
      key: "businessModel" as const,
      label: "Business Model",
      description: "Revenue model, unit economics, and scalability",
    },
    { key: "traction" as const, label: "Traction/Metrics", description: "Growth, customer adoption, and key metrics" },
    {
      key: "investmentReadiness" as const,
      label: "Investment Readiness",
      description: "Valuation, terms, and deal structure",
    },
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-foreground">Investment Scorecard</h4>
        {criteria.map(({ key, label, description }) => (
          <div key={key} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Label className="text-sm font-medium text-foreground">{label}</Label>
                <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={scores[key]}
                  onChange={(e) => updateScore(key, Number.parseInt(e.target.value) || 1)}
                  className="w-16 text-center"
                />
                <span className="text-xs text-muted-foreground">/10</span>
              </div>
            </div>
            <div className="flex gap-1">
              {Array.from({ length: 10 }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => updateScore(key, i + 1)}
                  className={`h-2 flex-1 rounded-sm transition-colors ${i < scores[key] ? "bg-primary" : "bg-muted"}`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="pt-4 border-t border-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-foreground">Overall Score</span>
          <span className="text-2xl font-bold text-primary">
            {(Object.values(scores).reduce((a, b) => a + b, 0) / 6).toFixed(1)}/10
          </span>
        </div>
      </div>

      <div>
        <Label htmlFor="notes" className="text-sm font-medium text-foreground mb-2 block">
          Additional Notes
        </Label>
        <Textarea
          id="notes"
          placeholder="Add your thoughts, concerns, or recommendations..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="resize-none"
        />
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Submit Scorecard</Button>
      </div>
    </form>
  )
}
