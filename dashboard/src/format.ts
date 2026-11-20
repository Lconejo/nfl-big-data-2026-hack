export const integerFormatter = new Intl.NumberFormat('es-MX', {
  maximumFractionDigits: 0,
})

export const decimalFormatter = new Intl.NumberFormat('es-MX', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

export function formatInteger(value: number): string {
  return integerFormatter.format(value)
}

export function formatRate(value: number): string {
  return `${decimalFormatter.format(value)}%`
}

const valueLabels: Record<string, string> = {
  own_red_zone: 'Yarda propia 1–19',
  own_territory: 'Territorio propio 20–39',
  midfield: 'Medio campo 40–60',
  opponent_territory: 'Territorio rival 39–21',
  opponent_red_zone: 'Zona roja rival',
  trailing: 'Perdiendo',
  tied: 'Empatado',
  leading: 'Ganando',
}

export function displayValue(value: string | null | undefined): string {
  if (!value || !value.trim()) return 'No disponible'
  return valueLabels[value] ?? value
}
