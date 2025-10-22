export interface ScoringWeights {
  ml: number
  llm: number
}

export interface ScoringConfig {
  weights: ScoringWeights
  batchSize?: number
  timeout?: number
}

export const DEFAULT_SCORING_CONFIG: ScoringConfig = {
  weights: { ml: 0.6, llm: 0.4 },
  batchSize: 5,
  timeout: 30000,
}
