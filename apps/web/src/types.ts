export type Perspective = {
  id: string
  actor_reference: string
  actor_type: string
  geography: string
  zone: string
  summary: string
  position: string
  salience: number
  valid_from?: string | null
}

export type Framing = {
  id: string
  perspective_id: string
  dimension: string
  label: string
}

export type Source = {
  id: string
  publisher: string
  organization?: string | null
  source_type: string
  url: string
  published_at?: string | null
  language?: string | null
  country?: string | null
  region?: string | null
  freshness?: string
  metadata?: Record<string, unknown>
}

export type Observation = {
  id: string
  source_id: string
  extracted_signal: string
  geography?: string
  language?: string
}

export type Snapshot = {
  id: string
  timestamp: string
  observation_count: number
  source_count: number
  actor_count: number
  geography_count: number
  perspective_count: number
  framing_distribution: Record<string, number>
  position_distribution: Record<string, number>
  metrics: Record<string, number>
  uncertainty: number
}

export type Insight = {
  id: string
  text: string
  confidence: number
  coverage: number
  generated_at: string
}

export type Signal = {
  id: string
  signal_type: string
  confidence: number
  timestamp: string
  rationale?: string
}

export type Change = {
  id: string
  change_type?: string
  dimension?: string
  confidence?: number
  timestamp?: string
  rationale?: string
}

export type LiveBundle = {
  schema_version: string
  domain: "PERSPECTIVE"
  corpus_kind: "LIVE_RESEARCH"
  research_issue: {
    repository: string
    number: number
    url: string
    state_at_promotion?: string
    lineage?: string
  }
  phenomenon: {
    id: string
    title: string
    description: string
    zone?: string
    keywords?: string[]
    created_at?: string
  }
  sources: Source[]
  observations: Observation[]
  perspectives: Perspective[]
  framings: Framing[]
  reactions: Array<Record<string, unknown>>
  signals: Signal[]
  changes: Change[]
  perspective_snapshots: Snapshot[]
  insights: Insight[]
  methodologies: Array<{
    id: string
    name: string
    version: string
    description?: string
  }>
}
