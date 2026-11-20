import type { DashboardQuery, DashboardResponse, FieldZonePoint } from './types'
import { displayValue } from './format'

const FIELD_ZONES = ['own_red_zone', 'own_territory', 'midfield', 'opponent_territory', 'opponent_red_zone']

export async function fetchDashboard(
  filters: DashboardQuery,
  signal?: AbortSignal,
): Promise<DashboardResponse> {
  const params = new URLSearchParams()

  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value)
  })

  const query = params.toString()
  const response = await fetch(query ? `api/dashboard?${query}` : 'api/dashboard', {
    headers: { Accept: 'application/json' },
    signal,
  })

  if (!response.ok) {
    throw new Error(`No se pudo cargar el análisis (HTTP ${response.status}).`)
  }

  return response.json() as Promise<DashboardResponse>
}

export async function fetchFieldZones(
  filters: DashboardQuery,
  signal?: AbortSignal,
): Promise<FieldZonePoint[]> {
  const baseFilters = { ...filters, field_zone: '' }
  const responses = await Promise.all(
    FIELD_ZONES.map((field_zone) => fetchDashboard({ ...baseFilters, field_zone }, signal)),
  )

  return responses.map((response, index) => ({
    key: FIELD_ZONES[index],
    label: displayValue(FIELD_ZONES[index]),
    attempts: response.summary.attempts,
    conversions: response.summary.thirdConversions + response.summary.fourthConversions,
    conversionRate: response.summary.thirdAttempts + response.summary.fourthAttempts > 0
      ? ((response.summary.thirdConversions + response.summary.fourthConversions)
        / (response.summary.thirdAttempts + response.summary.fourthAttempts)) * 100
      : 0,
    losses: response.summary.losses,
    lossRate: response.summary.lossRate,
  }))
}
