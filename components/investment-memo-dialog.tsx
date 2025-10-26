"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Download, X } from "lucide-react"

interface InvestmentMemoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  companyName: string
  memoContent: string
}

export function InvestmentMemoDialog({ open, onOpenChange, companyName, memoContent }: InvestmentMemoDialogProps) {
  const handleDownload = () => {
    const blob = new Blob([memoContent], { type: "text/markdown" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${companyName.replace(/\s+/g, "_")}_Investment_Memo_${new Date().toISOString().split("T")[0]}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Convert markdown-style headers to HTML for better display
  const formatContent = (content: string) => {
    return content.split("\n").map((line, i) => {
      if (line.startsWith("## ")) {
        return (
          <h2 key={i} className="text-xl font-semibold mt-6 mb-3 text-foreground border-b pb-2">
            {line.replace("## ", "")}
          </h2>
        )
      } else if (line.startsWith("**") && line.endsWith("**")) {
        return (
          <p key={i} className="font-semibold text-foreground mt-3 mb-1">
            {line.replace(/\*\*/g, "")}
          </p>
        )
      } else if (line.trim().startsWith("-")) {
        return (
          <li key={i} className="ml-6 text-muted-foreground mb-1">
            {line.trim().substring(1).trim()}
          </li>
        )
      } else if (line.trim().match(/^\d+\./)) {
        return (
          <li key={i} className="ml-6 text-muted-foreground mb-1 list-decimal">
            {line
              .trim()
              .replace(/^\d+\./, "")
              .trim()}
          </li>
        )
      } else if (line.trim() === "") {
        return <div key={i} className="h-2" />
      } else if (line.trim() === "---") {
        return <hr key={i} className="my-4 border-border" />
      } else {
        return (
          <p key={i} className="text-muted-foreground mb-2 leading-relaxed">
            {line}
          </p>
        )
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl">Investment Memo</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">{companyName}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        <ScrollArea className="flex-1 px-6 py-4">
          <div className="prose prose-sm max-w-none">{formatContent(memoContent)}</div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
