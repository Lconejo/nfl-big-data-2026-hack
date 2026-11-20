import type { DashboardQuery, DashboardResponse } from './types'

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
