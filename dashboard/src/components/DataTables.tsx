import { displayValue, formatInteger, formatRate } from '../format'
import type { DashboardPlay, Decision } from '../types'

export function DecisionsTable({ decisions }: { decisions: Decision[] }) {
  return (
    <section aria-labelledby="decisions-title" className="table-card rounded-2xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 p-4 sm:p-6">
        <h2 id="decisions-title" className="text-xl font-bold text-slate-950">Decisiones observadas y resultados</h2>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">Compara opciones registradas dentro del alcance filtrado. Las asociaciones describen la muestra y no demuestran que una decisión cause el resultado.</p>
      </div>
      {decisions.length === 0 ? (
        <p className="p-8 text-center text-sm text-slate-500">No hay decisiones comparables para este corte.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
              <tr>
                <th scope="col" className="px-5 py-3.5 font-semibold">Categoría</th>
                <th scope="col" className="px-5 py-3.5 font-semibold">Opción observada</th>
                <th scope="col" className="px-5 py-3.5 text-right font-semibold">Muestra</th>
                <th scope="col" className="px-5 py-3.5 text-right font-semibold">Conversión</th>
                <th scope="col" className="px-5 py-3.5 text-right font-semibold">Pérdida</th>
                <th scope="col" className="px-5 py-3.5 font-semibold">Lectura de muestra</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {decisions.map((decision, index) => (
                <tr key={`${decision.category}-${decision.option}-${index}`} className="align-top hover:bg-slate-50/80">
                  <td className="px-5 py-4 font-semibold text-slate-900">{decision.category}</td>
                  <td className="px-5 py-4 text-slate-800">{decision.option}</td>
                  <td className="px-5 py-4 text-right tabular-nums text-slate-700">n={formatInteger(decision.attempts)}</td>
                  <td className="px-5 py-4 text-right font-semibold tabular-nums text-emerald-800">{formatRate(decision.conversionRate)}</td>
                  <td className="px-5 py-4 text-right font-semibold tabular-nums text-rose-800">{formatRate(decision.lossRate)}</td>
                  <td className="px-5 py-4">
                    {decision.sampleWarning ? (
                      <span className="inline-flex rounded-md border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-semibold leading-5 text-amber-900">Advertencia: {decision.sampleWarning}</span>
                    ) : (
                      <span className="text-xs text-slate-500">Sin advertencia reportada</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

export function PlaysTable({ plays }: { plays: DashboardPlay[] }) {
  return (
    <section aria-labelledby="plays-title" className="table-card rounded-2xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 p-4 sm:p-6">
        <h2 id="plays-title" className="text-xl font-bold text-slate-950">Jugadas del corte</h2>
        <p className="mt-1 text-sm text-slate-600">Detalle auditable de las jugadas devueltas por el análisis.</p>
      </div>
      {plays.length === 0 ? (
        <p className="p-8 text-center text-sm text-slate-500">No se devolvieron jugadas para este corte.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] border-collapse text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
              <tr>
                <th scope="col" className="px-4 py-3.5 font-semibold">Semana / juego</th>
                <th scope="col" className="px-4 py-3.5 font-semibold">Situación</th>
                <th scope="col" className="px-4 py-3.5 font-semibold">Equipos</th>
                <th scope="col" className="px-4 py-3.5 font-semibold">Contexto</th>
                <th scope="col" className="px-4 py-3.5 font-semibold">Presión</th>
                <th scope="col" className="px-4 py-3.5 font-semibold">Resultado</th>
                <th scope="col" className="px-4 py-3.5 font-semibold">Descripción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {plays.map((play) => (
                <tr key={`${play.gameId}-${play.playId}`} className="align-top hover:bg-slate-50/80">
                  <td className="whitespace-nowrap px-4 py-4 text-slate-700">
                    <span className="block font-semibold text-slate-900">Semana {play.week}</span>
                    <span className="text-xs">Juego {play.gameId} · jugada {play.playId}</span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-slate-700">
                    <span className="block font-semibold text-slate-900">{play.down}.ª y {play.yardsToGo}</span>
                    <span className="text-xs">Q{play.quarter} · {play.clock}</span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-slate-700"><strong className="text-slate-900">{play.offense}</strong> vs. {play.defense}</td>
                  <td className="px-4 py-4 text-slate-700">
                    <span className="block">{displayValue(play.fieldZone)}</span>
                    <span className="block text-xs">{displayValue(play.formation)} · {displayValue(play.coverage)}</span>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${play.pressured ? 'border-amber-300 bg-amber-50 text-amber-900' : 'border-slate-300 bg-slate-50 text-slate-700'}`}>
                      {play.pressured ? 'Con presión' : 'Sin presión'}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    {play.lossReason ? <span className="font-semibold text-rose-800">{play.lossReason}</span> : <span className="text-slate-500">Sin pérdida reportada</span>}
                  </td>
                  <td className="max-w-md px-4 py-4 leading-6 text-slate-700">{displayValue(play.description)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
