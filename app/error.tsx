"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to error reporting service
    console.error("[Error Boundary]", error)
  }, [error])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="p-8 max-w-md w-full">
        <div className="text-center space-y-4">
          <div className="text-6xl">⚠️</div>
          <h2 className="text-2xl font-bold">Something went wrong!</h2>
          <p className="text-muted-foreground">
            {error.message || "An unexpected error occurred. Please try again."}
          </p>
          {error.digest && (
            <p className="text-xs text-muted-foreground">Error ID: {error.digest}</p>
          )}
          <div className="flex gap-3 justify-center pt-4">
            <Button
              onClick={() => reset()}
              variant="default"
            >
              Try Again
            </Button>
            <Button
              onClick={() => (window.location.href = "/")}
              variant="outline"
            >
              Go Home
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
