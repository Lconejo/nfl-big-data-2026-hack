import { displayValue } from '../format'
import type { DashboardFilters, DashboardQuery } from '../types'

interface FilterPanelProps {
  options: DashboardFilters
  value: DashboardQuery
  disabled: boolean
  onChange: (next: DashboardQuery) => void
  onReset: () => void
}

interface SelectFieldProps {
  id: keyof DashboardQuery
  label: string
  value: string
  options: Array<{ value: string; label: string }>
  disabled: boolean
  onChange: (key: keyof DashboardQuery, value: string) => void
}

function SelectField({ id, label, value, options, disabled, onChange }: SelectFieldProps) {
  return (
    <label className="block min-w-0" htmlFor={id}>
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">{label}</span>
      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(id, event.target.value)}
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 disabled:cursor-not-allowed disabled:bg-slate-100"
      >
        <option value="">Todos</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  )
}

export default function FilterPanel({ options, value, disabled, onChange, onReset }: FilterPanelProps) {
  const update = (key: keyof DashboardQuery, nextValue: string) => {
    onChange({ ...value, [key]: nextValue })
  }

  const hasFilters = Object.values(value).some(Boolean)

  return (
    <section aria-labelledby="filters-title" className="border-b border-slate-200 bg-white shadow-sm">
      <div className="mx-auto max-w-screen-2xl px-4 py-5 sm:px-6 lg:px-8">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="filters-title" className="text-base font-bold text-slate-900">Filtros del análisis</h2>
            <p className="mt-1 text-sm text-slate-600">Cada selección actualiza todas las métricas y jugadas.</p>
          </div>
          <button
            type="button"
            onClick={onReset}
            disabled={disabled || !hasFilters}
            className="rounded-lg border border-slate-300 px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-45"
          >
            Restablecer filtros
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
          <SelectField id="team" label="Equipo" value={value.team} disabled={disabled} onChange={update} options={options.teams.map((item) => ({ value: item, label: item }))} />
          <SelectField id="week" label="Semana" value={value.week} disabled={disabled} onChange={update} options={options.weeks.map((item) => ({ value: String(item), label: String(item) }))} />
          <SelectField id="quarter" label="Cuarto" value={value.quarter} disabled={disabled} onChange={update} options={options.quarters.map((item) => ({ value: String(item), label: String(item) }))} />
          <SelectField id="down" label="Down" value={value.down} disabled={disabled} onChange={update} options={options.downs.map((item) => ({ value: String(item), label: String(item) }))} />
          <SelectField id="distance" label="Distancia" value={value.distance} disabled={disabled} onChange={update} options={options.distanceBuckets.map((item) => ({ value: item.key, label: item.label }))} />
          <SelectField id="field_zone" label="Zona del campo" value={value.field_zone} disabled={disabled} onChange={update} options={options.fieldZones.map((item) => ({ value: item, label: displayValue(item) }))} />
          <SelectField id="score_state" label="Marcador" value={value.score_state} disabled={disabled} onChange={update} options={options.scoreStates.map((item) => ({ value: item, label: displayValue(item) }))} />
        </div>
      </div>
    </section>
  )
}
