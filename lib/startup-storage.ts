import type { Startup } from "./types"
import { dummyStartups } from "./dummy-data"

const STORAGE_KEY = "uploaded_startups"

export function saveUploadedStartups(startups: Startup[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(startups))
  }
}

export function getUploadedStartups(): Startup[] {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch (e) {
        console.error("[v0] Failed to parse uploaded startups:", e)
        return []
      }
    }
  }
  return []
}

export function getAllStartups(): Startup[] {
  return [...dummyStartups, ...getUploadedStartups()]
}

export function getStartupById(id: string): Startup | undefined {
  return getAllStartups().find((s) => s.id === id)
}

export function addUploadedStartup(startup: Startup) {
  const existing = getUploadedStartups()
  const updated = [...existing, startup]
  saveUploadedStartups(updated)
}

export function addUploadedStartups(startups: Startup[]) {
  const existing = getUploadedStartups()
  const updated = [...existing, ...startups]
  saveUploadedStartups(updated)
}
