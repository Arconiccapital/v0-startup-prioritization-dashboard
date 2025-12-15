"use client"

import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { PIPELINE_STAGES, type PipelineStage } from "@/lib/types"

interface StageNavigationProps {
  currentStage: PipelineStage
  onStageChange?: (stage: PipelineStage) => void
  className?: string
}

// Get stage index for comparison
function getStageIndex(stage: PipelineStage): number {
  return PIPELINE_STAGES.findIndex(s => s.id === stage)
}

export function StageNavigation({ currentStage, onStageChange, className }: StageNavigationProps) {
  const currentIndex = getStageIndex(currentStage)

  return (
    <div className={cn("w-full", className)}>
      {/* Progress bar background */}
      <div className="relative">
        {/* Connector line */}
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-muted" />
        <div
          className="absolute top-4 left-0 h-0.5 bg-green-500 transition-all duration-300"
          style={{ width: `${(currentIndex / (PIPELINE_STAGES.length - 1)) * 100}%` }}
        />

        {/* Stage buttons */}
        <div className="relative flex justify-between">
          {PIPELINE_STAGES.map((stage, index) => {
            const isPast = index < currentIndex
            const isCurrent = index === currentIndex
            const isFuture = index > currentIndex

            return (
              <button
                key={stage.id}
                onClick={() => onStageChange?.(stage.id)}
                className="flex flex-col items-center group"
              >
                {/* Circle indicator */}
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center transition-all border-2 bg-background",
                    isPast && "bg-green-500 border-green-500 text-white",
                    isCurrent && "border-blue-600 bg-blue-600 text-white shadow-lg scale-110",
                    isFuture && "border-muted-foreground/30 text-muted-foreground/50"
                  )}
                >
                  {isPast ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <span className="text-xs font-bold">{index + 1}</span>
                  )}
                </div>

                {/* Label */}
                <span
                  className={cn(
                    "mt-2 text-xs font-medium text-center max-w-[80px] leading-tight",
                    isPast && "text-green-700 dark:text-green-400",
                    isCurrent && "text-blue-700 dark:text-blue-400 font-semibold",
                    isFuture && "text-muted-foreground/60"
                  )}
                >
                  {stage.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
