import { useEffect, useState } from 'react'
import { fetchDashboard } from './api'
import { RateComparisonChart, LossByDownChart, LossReasonsChart } from './components/DashboardCharts'
import { DecisionsTable, PlaysTable } from './components/DataTables'
import FilterPanel from './components/FilterPanel'
import SummaryCards from './components/SummaryCards'
import { formatInteger, formatRate } from './format'
import { EMPTY_QUERY } from './types'
import type { DashboardFilters, DashboardQuery, DashboardResponse } from './types'

function LoadingState() {
  return (
    <div className="mx-auto flex max-w-screen-2xl flex-col items-center justify-center px-4 py-24 text-center" role="status">
      <span className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-700" aria-hidden="true" />
      <p className="mt-4 font-semibold text-slate-800">Cargando análisis de posesiones…</p>
      <p className="mt-1 text-sm text-slate-500">Estamos preparando métricas, comparaciones y jugadas.</p>
    </div>
  )
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center" role="alert">
      <div className="rounded-2xl border border-rose-200 bg-white p-8 shadow-sm">
        <svg className="mx-auto h-10 w-10 text-rose-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path d="M12 8v5m0 3.5v.01M10.3 3.8 2.2 18a2 2 0 0 0 1.7 3h16.2a2 2 0 0 0 1.7-3L13.7 3.8a2 2 0 0 0-3.4 0Z" />
        </svg>
        <h2 className="mt-4 text-xl font-bold text-slate-950">No pudimos cargar el dashboard</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">{message}</p>
        <button type="button" onClick={onRetry} className="mt-6 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:ring-offset-2">Reintentar</button>
      </div>
    </div>
  )
}

function EmptyState({ hasFilters, onReset }: { hasFilters: boolean; onReset: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
      <svg className="mx-auto h-10 w-10 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <circle cx="11" cy="11" r="7" /><path d="m20 20-4-4M8 11h6" />
      </svg>
      <h2 className="mt-4 text-xl font-bold text-slate-900">No hay jugadas para este corte</h2>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">La API no devolvió intentos válidos con la combinación actual. Ajusta los filtros para ampliar el alcance.</p>
      {hasFilters && <button type="button" onClick={onReset} className="mt-5 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:ring-offset-2">Restablecer filtros</button>}
    </div>
  )
}

function Header({ data }: { data: DashboardResponse | null }) {
  return (
    <header className="relative overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-y-0 right-0 w-1/3 bg-emerald-800/20 [clip-path:polygon(28%_0,100%_0,100%_100%,0_100%)]" aria-hidden="true" />
      <div className="relative mx-auto flex max-w-screen-2xl flex-col gap-6 px-4 py-7 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-emerald-400/40 bg-emerald-700 shadow-lg shadow-black/20" aria-hidden="true">
            <svg viewBox="0 0 32 32" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="M7 18c2-7 8-11 17-10 1 8-3 14-11 17-4 1-7-3-6-7Z" />
              <path d="m10 22 12-11M13 17l3 3m1-7 3 3" />
            </svg>
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">NFL Big Data Bowl</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Riesgo al buscar el primero y diez</h1>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-7 gap-y-2 border-t border-white/15 pt-4 text-sm md:border-l md:border-t-0 md:pl-7 md:pt-0">
          <span className="text-slate-400">Alcance</span><strong className="text-right font-semibold text-white">{data?.meta.scope ?? 'Cargando…'}</strong>
          <span className="text-slate-400">Temporada</span><strong className="text-right font-semibold text-white">{data?.meta.season ?? '—'}</strong>
          <span className="text-slate-400">Juegos</span><strong className="text-right font-semibold text-white">{data ? formatInteger(data.meta.totalGames) : '—'}</strong>
        </div>
      </div>
      <div className="h-1 bg-emerald-600" />
    </header>
  )
}

export default function App() {
  const [query, setQuery] = useState<DashboardQuery>(EMPTY_QUERY)
  const [data, setData] = useState<DashboardResponse | null>(null)
  const [availableFilters, setAvailableFilters] = useState<DashboardFilters | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [requestVersion, setRequestVersion] = useState(0)

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

  const resetFilters = () => setQuery(EMPTY_QUERY)
  const hasFilters = Object.values(query).some(Boolean)

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <Header data={data} />

      {availableFilters && (
        <FilterPanel options={availableFilters} value={query} disabled={loading} onChange={setQuery} onReset={resetFilters} />
      )}

      {loading && !data ? <LoadingState /> : null}
      {error && !data ? <ErrorState message={error} onRetry={() => setRequestVersion((value) => value + 1)} /> : null}

      {data && (
        <main className="mx-auto max-w-screen-2xl space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {error && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900" role="alert">
              <span><strong>No se pudo actualizar el corte.</strong> {error}</span>
              <button type="button" onClick={() => setRequestVersion((value) => value + 1)} className="font-bold underline underline-offset-2">Reintentar</button>
            </div>
          )}

          {loading && <div className="h-1.5 overflow-hidden rounded-full bg-slate-200" role="status" aria-label="Actualizando resultados"><div className="h-full w-1/3 animate-pulse rounded-full bg-emerald-700" /></div>}

          {data.summary.attempts === 0 ? <EmptyState hasFilters={hasFilters} onReset={resetFilters} /> : (
            <>
              <section className="overflow-hidden rounded-2xl bg-slate-900 text-white shadow-sm" aria-labelledby="headline-title">
                <div className="border-l-4 border-emerald-500 px-5 py-6 sm:px-7">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">Hallazgo principal del corte</p>
                  <h2 id="headline-title" className="mt-2 text-2xl font-bold leading-tight sm:text-3xl">{data.headline.title}</h2>
                  <p className="mt-3 max-w-4xl leading-7 text-slate-300">{data.headline.detail}</p>
                </div>
              </section>

              <SummaryCards summary={data.summary} />

              <section aria-label="Contexto de la muestra" className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm shadow-sm sm:grid-cols-2 lg:grid-cols-4">
                <p><span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Pases totales</span><strong className="mt-1 block text-lg tabular-nums text-slate-900">{formatInteger(data.meta.totalPassPlays)}</strong></p>
                <p><span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Pases válidos</span><strong className="mt-1 block text-lg tabular-nums text-slate-900">{formatInteger(data.meta.validPassPlays)}</strong></p>
                <p><span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Jugadas filtradas</span><strong className="mt-1 block text-lg tabular-nums text-slate-900">{formatInteger(data.meta.filteredPlays)}</strong></p>
                <p><span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Intentos bajo presión</span><strong className="mt-1 block text-lg tabular-nums text-slate-900">{formatInteger(data.summary.pressuredAttempts)}</strong></p>
              </section>

              <section aria-labelledby="situations-title">
                <div className="mb-4">
                  <h2 id="situations-title" className="text-2xl font-bold tracking-tight text-slate-950">¿En qué situaciones se pierde la posesión?</h2>
                  <p className="mt-1 text-sm text-slate-600">Tasas observadas en el corte actual. Las etiquetas y muestras ayudan a interpretar cada comparación.</p>
                </div>
                <div className="grid gap-6 xl:grid-cols-2">
                  <LossByDownChart data={data.lossByDown} />
                  <LossReasonsChart data={data.lossReasons} />
                  <RateComparisonChart title="Cuarta oportunidad por distancia" description="Conversión y pérdida de posesión observadas al intentar convertir en cuarta, agrupadas por distancia." data={data.fourthByDistance} />
                  <RateComparisonChart title="Tercera oportunidad por distancia" description="Conversión y pérdida de posesión observadas en tercera, agrupadas por distancia." data={data.thirdByDistance} />
                </div>
              </section>

              <section aria-labelledby="pressure-title">
                <h2 id="pressure-title" className="sr-only">Efecto observado de la presión</h2>
                <RateComparisonChart title="Con presión frente a sin presión" description="Compara resultados según la clasificación de presión reportada para cada intento." data={data.pressureComparison} />
              </section>

              <DecisionsTable decisions={data.decisions} />
              <PlaysTable plays={data.plays} />

              <section aria-labelledby="method-title" className="grid gap-6 rounded-2xl border border-slate-300 bg-slate-50 p-5 sm:p-7 lg:grid-cols-2">
                <div>
                  <h2 id="method-title" className="text-lg font-bold text-slate-950">Metodología</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-700">El dashboard analiza únicamente jugadas de pase de las semanas 1–8 de 2021. Excluye jugadas anuladas y clasifica como pérdida una intercepción neta, un fumble recuperado por el rival o un pase fallido en cuarta oportunidad.</p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">En el corte actual se reportan {formatInteger(data.summary.turnoverOnDowns)} pérdidas por downs y una tasa total de pérdida de {formatRate(data.summary.lossRate)}.</p>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-950">Límites de interpretación</h2>
                  <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-6 text-slate-700">
                    <li>El conjunto solo contiene pases; no permite concluir si correr supera al pase ni comparar directamente con despeje o gol de campo.</li>
                    <li>Las comparaciones son descriptivas y no establecen causalidad ni sustituyen una decisión de juego.</li>
                    <li>Los filtros pueden reducir la muestra; las advertencias de la API deben considerarse antes de comparar opciones.</li>
                    <li>Las categorías dependen de la cobertura y clasificación disponibles en los datos analizados.</li>
                  </ul>
                </div>
              </section>
            </>
          )}
        </main>
      )}

      <footer className="border-t border-slate-200 bg-white px-4 py-5 text-center text-xs text-slate-500">
        Análisis descriptivo de situaciones de pase · NFL Big Data Bowl
      </footer>
    </div>
  )
}
