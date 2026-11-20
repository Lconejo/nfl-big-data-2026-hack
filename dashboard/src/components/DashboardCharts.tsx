import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatInteger, formatRate } from '../format'
import type { LossReason, PerformancePoint } from '../types'

interface RateComparisonChartProps {
  title: string
  description: string
  data: PerformancePoint[]
}

interface LossRateChartProps {
  data: PerformancePoint[]
}

const chartText = { fill: '#526071', fontSize: 12, fontWeight: 600 }
const gridColor = '#dbe2ea'
const reasonColors = ['var(--team-primary)', '#b91c1c', '#ea580c', '#d97706', 'var(--team-secondary)', '#64748b']

function ChartShell({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <article className="chart-card min-w-0 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
      <div className="mb-5 border-l-4 pl-3" style={{ borderColor: 'var(--team-primary)' }}>
        <h3 className="text-lg font-black uppercase tracking-tight text-slate-950">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
      </div>
      {children}
    </article>
  )
}

function EmptyChart() {
  return <div className="flex h-64 items-center justify-center rounded-xl bg-slate-50 px-6 text-center text-sm text-slate-500">No hay observaciones para esta visualización.</div>
}

export function RateComparisonChart({ title, description, data }: RateComparisonChartProps) {
  const height = Math.max(270, data.length * 54)

  return (
    <ChartShell title={title} description={description}>
      {data.length === 0 ? <EmptyChart /> : (
        <>
          <div style={{ height }} className="w-full" aria-label={`${title}. Comparación de tasas en porcentaje.`} role="img">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" margin={{ top: 8, right: 18, bottom: 8, left: 6 }} accessibilityLayer>
                <CartesianGrid stroke={gridColor} strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tickFormatter={(value) => `${value}%`} tick={chartText} />
                <YAxis type="category" dataKey="label" width={92} tick={chartText} />
                <Tooltip
                  cursor={{ fill: '#f1f5f9' }}
                  formatter={(value, name) => [formatRate(Number(value)), name === 'conversionRate' ? 'Conversión' : 'Pérdida']}
                  labelFormatter={(label) => String(label)}
                />
                <Legend formatter={(value) => value === 'conversionRate' ? 'Conversión' : 'Pérdida de posesión'} />
                <Bar dataKey="conversionRate" fill="var(--team-primary)" name="conversionRate" radius={[0, 3, 3, 0]} />
                <Bar dataKey="lossRate" fill="#b91c1c" name="lossRate" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {data.map((point) => (
              <div key={point.key} className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-700">
                <span className="font-semibold text-slate-900">{point.label}:</span>{' '}
                conversión {formatRate(point.conversionRate)}; pérdida {formatRate(point.lossRate)}; n={formatInteger(point.attempts)}.
              </div>
            ))}
          </div>
        </>
      )}
    </ChartShell>
  )
}

export function LossByDownChart({ data }: LossRateChartProps) {
  return (
    <ChartShell title="Riesgo de pérdida por down" description="Frecuencia observada de pérdidas de posesión en cada down, con el número de intentos como contexto.">
      {data.length === 0 ? <EmptyChart /> : (
        <>
          <div className="h-72 w-full" aria-label="Tasa de pérdida de posesión por down" role="img">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 8, right: 10, bottom: 8, left: 0 }} accessibilityLayer>
                <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={chartText} />
                <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} tick={chartText} width={46} />
                <Tooltip formatter={(value) => [formatRate(Number(value)), 'Pérdida de posesión']} />
                <Bar dataKey="lossRate" fill="#b91c1c" name="Pérdida de posesión" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-3 flex flex-wrap gap-2 text-xs text-slate-700" aria-label="Detalle de riesgo por down">
            {data.map((point) => <li key={point.key} className="rounded-full bg-rose-50 px-3 py-1.5"><strong>{point.label}</strong>: {formatRate(point.lossRate)} · n={formatInteger(point.attempts)}</li>)}
          </ul>
        </>
      )}
    </ChartShell>
  )
}

export function LossReasonsChart({ data }: { data: LossReason[] }) {
  return (
    <ChartShell title="Cómo termina la posesión" description="Distribución de los motivos reportados entre las pérdidas de posesión del corte actual.">
      {data.length === 0 ? <EmptyChart /> : (
        <div className="grid items-center gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(180px,0.9fr)]">
          <div className="h-64 w-full" aria-label="Gráfica de dona con los motivos de pérdida" role="img">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart accessibilityLayer>
                <Pie data={data} dataKey="count" nameKey="label" innerRadius="55%" outerRadius="82%" paddingAngle={2} stroke="#ffffff" strokeWidth={2}>
                  {data.map((reason, index) => <Cell key={reason.key} fill={reasonColors[index % reasonColors.length]} />)}
                </Pie>
                <Tooltip formatter={(value) => [formatInteger(Number(value)), 'Pérdidas']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="space-y-2" aria-label="Detalle de motivos de pérdida">
            {data.map((reason, index) => (
              <li key={reason.key} className="flex items-start justify-between gap-3 rounded-lg bg-slate-50 p-2.5 text-sm">
                <span className="flex min-w-0 items-center gap-2 font-medium text-slate-800">
                  <span className="mt-0.5 h-3 w-3 shrink-0 rounded-sm border border-black/15" style={{ backgroundColor: reasonColors[index % reasonColors.length] }} aria-hidden="true" />
                  <span>{reason.label}</span>
                </span>
                <span className="shrink-0 text-right tabular-nums text-slate-600">{formatInteger(reason.count)} · {formatRate(reason.percentage)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </ChartShell>
  )
}
