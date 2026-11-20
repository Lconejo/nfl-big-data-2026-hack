import { useEffect, useState } from 'react'
import type { TeamTheme } from '../teamThemes'

interface TeamLogoProps {
  team: string
  theme: TeamTheme
  className?: string
}

export default function TeamLogo({ team, theme, className = '' }: TeamLogoProps) {
  const [failed, setFailed] = useState(false)

  useEffect(() => setFailed(false), [theme.logo])

  if (!theme.logo || failed) {
    return (
      <span
        className={`team-logo-fallback ${className}`}
        role="img"
        aria-label={team ? `Logo no disponible para ${theme.name}` : 'Escudo NFL'}
        title={theme.logo ? 'Logo no disponible' : 'NFL'}
      >
        {team || 'NFL'}
      </span>
    )
  }

  return (
    <img
      src={theme.logo}
      alt={`Logo de ${theme.name}`}
      className={`object-contain ${className}`}
      onError={() => setFailed(true)}
    />
  )
}
