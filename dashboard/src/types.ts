export interface DashboardMeta {
  scope: string
  season: number
  totalGames: number
  totalPassPlays: number
  validPassPlays: number
  filteredPlays: number
}

export interface FilterOption {
  key: string
  label: string
}

export interface DashboardFilters {
  teams: string[]
  weeks: number[]
  quarters: number[]
  downs: number[]
  distanceBuckets: FilterOption[]
  fieldZones: string[]
  scoreStates: string[]
}

export interface DashboardSummary {
  attempts: number
  losses: number
  lossRate: number
  interceptions: number
  fumblesLost: number
  turnoverOnDowns: number
  thirdAttempts: number
  thirdConversions: number
  thirdConversionRate: number
  fourthAttempts: number
  fourthConversions: number
  fourthConversionRate: number
  pressuredAttempts: number
}

export interface Headline {
  title: string
  detail: string
}

export interface PerformancePoint {
  key: string
  label: string
  attempts: number
  conversions: number
  conversionRate: number
  losses: number
  lossRate: number
}

export interface LossReason {
  key: string
  label: string
  count: number
  percentage: number
}

export interface FieldZonePoint extends PerformancePoint {}

export interface Decision {
  category: string
  option: string
  attempts: number
  conversionRate: number
  lossRate: number
  sampleWarning: string | null
}

export interface DashboardPlay {
  gameId: number | string
  playId: number | string
  week: number
  offense: string
  defense: string
  quarter: number
  clock: string
  down: number
  yardsToGo: number
  fieldZone: string
  formation: string
  coverage: string
  pressured: boolean
  lossReason: string | null
  description: string
}

export interface DashboardResponse {
  meta: DashboardMeta
  filters: DashboardFilters
  summary: DashboardSummary
  headline: Headline
  lossByDown: PerformancePoint[]
  fourthByDistance: PerformancePoint[]
  thirdByDistance: PerformancePoint[]
  pressureComparison: PerformancePoint[]
  lossReasons: LossReason[]
  decisions: Decision[]
  plays: DashboardPlay[]
}

export interface DashboardQuery {
  team: string
  week: string
  quarter: string
  down: string
  distance: string
  field_zone: string
  score_state: string
}

export const EMPTY_QUERY: DashboardQuery = {
  team: '',
  week: '',
  quarter: '',
  down: '',
  distance: '',
  field_zone: '',
  score_state: '',
}
