import { formatInteger, formatRate } from '../format'
import type { DashboardSummary } from '../types'

interface SummaryCardsProps {
  summary: DashboardSummary
}

interface CardProps {
  label: string
  value: string
  detail: string
  emphasis?: 'default' | 'risk' | 'success'
}

const accents = {
  default: 'summary-default',
  risk: 'summary-risk',
  success: 'summary-success',
}

function Card({ label, value, detail, emphasis = 'default' }: CardProps) {
  return (
    <article className={`summary-card rounded-xl border border-slate-200 border-t-4 bg-white p-4 ${accents[emphasis]}`}>
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold tabular-nums text-slate-950">{value}</p>
      <p className="mt-1 text-xs leading-5 text-slate-600">{detail}</p>
    </article>
  )
}

export default function SummaryCards({ summary }: SummaryCardsProps) {
  return (
    <section aria-labelledby="summary-title">
      <h2 id="summary-title" className="sr-only">Indicadores principales</h2>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <Card label="Intentos" value={formatInteger(summary.attempts)} detail="Pases válidos del corte" />
        <Card label="Pérdidas" value={formatInteger(summary.losses)} detail={`${formatRate(summary.lossRate)} de los intentos`} emphasis="risk" />
        <Card label="Intercepciones" value={formatInteger(summary.interceptions)} detail="Posesiones terminadas por intercepción" emphasis="risk" />
        <Card label="Fumbles perdidos" value={formatInteger(summary.fumblesLost)} detail="Balones sueltos recuperados por el rival" emphasis="risk" />
        <Card label="Conversión en 3.ª" value={formatRate(summary.thirdConversionRate)} detail={`${formatInteger(summary.thirdConversions)} de ${formatInteger(summary.thirdAttempts)} intentos`} emphasis="success" />
        <Card label="Conversión en 4.ª" value={formatRate(summary.fourthConversionRate)} detail={`${formatInteger(summary.fourthConversions)} de ${formatInteger(summary.fourthAttempts)} intentos`} emphasis="success" />
      </div>
    </section>
  )
}
