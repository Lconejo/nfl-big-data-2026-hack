import { useEffect, useState, type CSSProperties } from 'react'
import { fetchDashboard, fetchFieldZones } from './api'
import { RateComparisonChart, LossByDownChart, LossReasonsChart } from './components/DashboardCharts'
import { DecisionsTable, PlaysTable } from './components/DataTables'
import FilterPanel from './components/FilterPanel'
import FootballField from './components/FootballField'
import SummaryCards from './components/SummaryCards'
import TeamLogo from './components/TeamLogo'
import { formatInteger, formatRate } from './format'
import { DEFAULT_THEME, getTeamTheme } from './teamThemes'
import { EMPTY_QUERY } from './types'
import type { DashboardFilters, DashboardQuery, DashboardResponse, FieldZonePoint } from './types'

function LoadingState() {
  return (
    <div className="mx-auto flex max-w-screen-2xl flex-col items-center justify-center px-4 py-24 text-center" role="status">
      <span className="football-loader" aria-hidden="true" />
      <p className="mt-5 font-bold text-slate-900">Revisando la jugada…</p>
      <p className="mt-1 text-sm text-slate-500">Preparamos métricas, zonas del campo y situaciones.</p>
    </div>
  )
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center" role="alert">
      <div className="rounded-2xl border border-red-200 bg-white p-8 shadow-sm">
        <span className="mx-auto block text-4xl" aria-hidden="true">🏈</span>
        <h2 className="mt-4 text-xl font-black text-slate-950">La jugada quedó incompleta</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">{message}</p>
        <button type="button" onClick={onRetry} className="team-button mt-6">Reintentar</button>
      </div>
    </div>
  )
}

function EmptyState({ hasFilters, onReset }: { hasFilters: boolean; onReset: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
      <span className="text-4xl" aria-hidden="true">🏈</span>
      <h2 className="mt-4 text-xl font-black text-slate-900">No hay jugadas para este corte</h2>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">Ajusta los filtros para ampliar la muestra.</p>
      {hasFilters && <button type="button" onClick={onReset} className="team-button mt-5">Restablecer filtros</button>}
    </div>
  )
}

function Header({ data, team }: { data: DashboardResponse | null; team: string }) {
  const theme = getTeamTheme(team)
  return (
    <header className="scoreboard-header text-white">
      <div className="stadium-lights" aria-hidden="true" />
      <div className="relative mx-auto max-w-screen-2xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="scoreboard-topline">
          <span>NFL BIG DATA BOWL</span>
          <span>SEMANA 1–8 · TEMPORADA {data?.meta.season ?? '2021'}</span>
          <span>ANÁLISIS EN VIVO</span>
        </div>
        <div className="mt-5 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-center gap-4 sm:gap-6">
            <div className="team-logo-shell">
              <TeamLogo team={team} theme={theme} className="h-16 w-16 sm:h-20 sm:w-20" />
            </div>
            <div className="min-w-0">
              <p className="team-kicker">{team ? `${theme.name} · ${team}` : 'TODOS LOS EQUIPOS'}</p>
              <h1 className="mt-1 max-w-3xl text-3xl font-black uppercase leading-none tracking-tight sm:text-4xl lg:text-5xl">Riesgo al buscar el primero y diez</h1>
              <p className="mt-2 text-sm text-white/70">Lee el campo. Compara la situación. Decide con datos.</p>
            </div>
          </div>
          <div className="scoreboard-stats">
            <p><span>ALCANCE</span><strong>{data?.meta.scope ?? 'Cargando…'}</strong></p>
            <p><span>JUEGOS</span><strong>{data ? formatInteger(data.meta.totalGames) : '—'}</strong></p>
            <p><span>JUGADAS</span><strong>{data ? formatInteger(data.meta.filteredPlays) : '—'}</strong></p>
          </div>
        </div>
      </div>
      <div className="team-stripe"><span /><span /></div>
    </header>
  )
}

export default function App() {
  const [query, setQuery] = useState<DashboardQuery>(EMPTY_QUERY)
  const [data, setData] = useState<DashboardResponse | null>(null)
  const [fieldZones, setFieldZones] = useState<FieldZonePoint[]>([])
  const [availableFilters, setAvailableFilters] = useState<DashboardFilters | null>(null)
  const [loading, setLoading] = useState(true)
  const [fieldLoading, setFieldLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [requestVersion, setRequestVersion] = useState(0)
  const theme = getTeamTheme(query.team)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError(null)

    fetchDashboard(query, controller.signal)
      .then((response) => {
        setData(response)
        setAvailableFilters((current) => current ?? response.filters)
      })
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === 'AbortError') return
        setError(reason instanceof Error ? reason.message : 'Ocurrió un error inesperado al consultar la API.')
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [query, requestVersion])

  useEffect(() => {
    const controller = new AbortController()
    setFieldLoading(true)
    fetchFieldZones(query, controller.signal)
      .then(setFieldZones)
      .catch((reason: unknown) => {
        if (!(reason instanceof DOMException && reason.name === 'AbortError')) setFieldZones([])
      })
      .finally(() => {
        if (!controller.signal.aborted) setFieldLoading(false)
      })
    return () => controller.abort()
  }, [query.team, query.week, query.quarter, query.down, query.distance, query.score_state, requestVersion])

  const resetFilters = () => setQuery(EMPTY_QUERY)
  const hasFilters = Object.values(query).some(Boolean)
  const themeStyle = {
    '--team-primary': theme.primary,
    '--team-secondary': theme.secondary,
    '--team-accent': theme.accent,
    '--team-on-primary': theme.onPrimary,
    '--nfl-primary': DEFAULT_THEME.primary,
  } as CSSProperties

  return (
    <div className="app-shell min-h-screen text-slate-900" style={themeStyle}>
      <Header data={data} team={query.team} />

      {availableFilters && (
        <FilterPanel options={availableFilters} value={query} disabled={loading} onChange={setQuery} onReset={resetFilters} />
      )}

      {loading && !data ? <LoadingState /> : null}
      {error && !data ? <ErrorState message={error} onRetry={() => setRequestVersion((value) => value + 1)} /> : null}

      {data && (
        <main className="mx-auto max-w-screen-2xl space-y-7 px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
          {error && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900" role="alert">
              <span><strong>No se pudo actualizar el corte.</strong> {error}</span>
              <button type="button" onClick={() => setRequestVersion((value) => value + 1)} className="font-bold underline underline-offset-2">Reintentar</button>
            </div>
          )}

          {loading && <div className="h-1.5 overflow-hidden rounded-full bg-slate-200" role="status" aria-label="Actualizando resultados"><div className="loading-bar h-full w-1/3 rounded-full" /></div>}

          {data.summary.attempts === 0 ? <EmptyState hasFilters={hasFilters} onReset={resetFilters} /> : (
            <>
              <section className="headline-card" aria-labelledby="headline-title">
                <div>
                  <p className="eyebrow text-white/70">LECTURA RÁPIDA DEL CORTE</p>
                  <h2 id="headline-title">{data.headline.title}</h2>
                  <p>{data.headline.detail}</p>
                </div>
                <span className="headline-rate">{formatRate(data.summary.lossRate)}<small>RIESGO</small></span>
              </section>

              <SummaryCards summary={data.summary} />

              {fieldZones.length > 0 && (
                <FootballField
                  data={fieldZones}
                  selectedZone={query.field_zone}
                  loading={fieldLoading}
                  onSelectZone={(field_zone) => setQuery((current) => ({ ...current, field_zone }))}
                />
              )}

              <section aria-labelledby="situations-title">
                <div className="section-heading">
                  <p className="eyebrow">SCOUTING REPORT</p>
                  <h2 id="situations-title">Situaciones que ponen en riesgo la posesión</h2>
                  <p>Las tasas corresponden al corte actual. Consulta la muestra antes de comparar.</p>
                </div>
                <div className="grid gap-6 xl:grid-cols-2">
                  <LossByDownChart data={data.lossByDown} />
                  <LossReasonsChart data={data.lossReasons} />
                  <RateComparisonChart title="Cuarta oportunidad por distancia" description="Conversión y pérdida al intentar convertir en cuarta, agrupadas por distancia." data={data.fourthByDistance} />
                  <RateComparisonChart title="Tercera oportunidad por distancia" description="Conversión y pérdida en tercera, agrupadas por distancia." data={data.thirdByDistance} />
                </div>
              </section>

              <RateComparisonChart title="Con presión frente a sin presión" description="Compara resultados según la clasificación de presión reportada para cada intento." data={data.pressureComparison} />

              <DecisionsTable decisions={data.decisions} />
              <PlaysTable plays={data.plays} />

              <section aria-labelledby="method-title" className="method-card">
                <div>
                  <p className="eyebrow">CÓMO LEER LOS DATOS</p>
                  <h2 id="method-title">Metodología</h2>
                  <p>El dashboard analiza jugadas de pase de las semanas 1–8 de 2021. Excluye jugadas anuladas y clasifica como pérdida una intercepción neta, un fumble recuperado por el rival o un pase fallido en cuarta oportunidad.</p>
                  <p>En este corte se reportan {formatInteger(data.summary.turnoverOnDowns)} pérdidas por downs y una tasa total de {formatRate(data.summary.lossRate)}.</p>
                </div>
                <div>
                  <p className="eyebrow">LÍMITES</p>
                  <h2>Interpretación responsable</h2>
                  <ul>
                    <li>El conjunto solo contiene pases; no compara directamente carrera, despeje o gol de campo.</li>
                    <li>Las asociaciones son descriptivas y no demuestran causalidad.</li>
                    <li>Una muestra pequeña requiere cautela antes de comparar opciones.</li>
                  </ul>
                </div>
              </section>
            </>
          )}
        </main>
      )}

      <footer className="border-t border-slate-800 bg-slate-950 px-4 py-6 text-center text-xs font-semibold uppercase tracking-widest text-slate-400">
        NFL Big Data Bowl · Análisis descriptivo de situaciones de pase
      </footer>
    </div>
  )
}
