import { displayValue, formatInteger, formatRate } from '../format'
import type { FieldZonePoint } from '../types'

interface FootballFieldProps {
  data: FieldZonePoint[]
  selectedZone: string
  loading: boolean
  onSelectZone: (zone: string) => void
}

const yardLabels: Record<string, string> = {
  own_red_zone: 'PROPIA 1–19',
  own_territory: 'PROPIA 20–39',
  midfield: 'MEDIO CAMPO',
  opponent_territory: 'RIVAL 39–21',
  opponent_red_zone: 'ZONA ROJA',
}

function intensity(rate: number): string {
  if (rate >= 20) return 'rgba(127, 29, 29, .82)'
  if (rate >= 12) return 'rgba(185, 28, 28, .68)'
  if (rate >= 7) return 'rgba(234, 88, 12, .55)'
  if (rate > 0) return 'rgba(250, 204, 21, .36)'
  return 'rgba(15, 118, 65, .18)'
}

export default function FootballField({ data, selectedZone, loading, onSelectZone }: FootballFieldProps) {
  return (
    <section className="field-card" aria-labelledby="field-title">
      <div className="field-heading">
        <div>
          <p className="eyebrow">Mapa de riesgo territorial</p>
          <h2 id="field-title">¿En qué parte del campo cambia el resultado?</h2>
          <p>Compara intentos, conversiones y pérdidas por posición inicial. Selecciona una zona para filtrar todo el tablero.</p>
        </div>
        <div className="field-legend" aria-label="Escala de riesgo">
          <span><i className="bg-emerald-700" /> Menor riesgo</span>
          <span><i className="bg-yellow-400" /> Riesgo medio</span>
          <span><i className="bg-red-800" /> Mayor riesgo</span>
        </div>
      </div>

      <div className={`football-field ${loading ? 'field-loading' : ''}`} role="group" aria-label="Zonas del campo de futbol americano">
        <div className="end-zone end-zone-left" aria-hidden="true"><span>END ZONE</span></div>
        <div className="field-zones">
          {data.map((zone, index) => {
            const selected = selectedZone === zone.key
            return (
              <button
                type="button"
                key={zone.key}
                className={`field-zone ${selected ? 'field-zone-selected' : ''}`}
                style={{ backgroundColor: intensity(zone.lossRate) }}
                onClick={() => onSelectZone(selected ? '' : zone.key)}
                aria-pressed={selected}
                aria-label={`${displayValue(zone.key)}: ${formatInteger(zone.attempts)} intentos, ${formatRate(zone.lossRate)} de pérdida`}
              >
                <span className="yard-number" aria-hidden="true">{index < 2 ? 20 + index * 20 : index === 2 ? 50 : (5 - index) * 20}</span>
                <span className="zone-name">{yardLabels[zone.key] ?? zone.label}</span>
                <strong>{formatRate(zone.lossRate)}</strong>
                <span>{formatInteger(zone.losses)} pérdidas</span>
                <span>{formatInteger(zone.attempts)} intentos</span>
                <small>{formatRate(zone.conversionRate)} conversión</small>
              </button>
            )
          })}
          <span className="midfield-mark" aria-hidden="true">NFL</span>
        </div>
        <div className="end-zone end-zone-right" aria-hidden="true"><span>END ZONE</span></div>
      </div>
      <p className="field-note">El color representa la tasa de pérdida. El porcentaje dentro de cada zona es pérdida de posesión; la muestra incluye los pases válidos del corte.</p>
    </section>
  )
}
