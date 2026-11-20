export interface TeamTheme {
  name: string
  logo: string
  primary: string
  secondary: string
  accent: string
  onPrimary: string
}

const logo = (fileName: string) => `logos/${fileName}`

export const DEFAULT_THEME: TeamTheme = {
  name: 'NFL',
  logo: '',
  primary: '#013369',
  secondary: '#0b1f3a',
  accent: '#d50a0a',
  onPrimary: '#ffffff',
}

export const TEAM_THEMES: Record<string, TeamTheme> = {
  ARI: { name: 'Arizona Cardinals', logo: logo('arizona-cardinals-logo-footylogos.png'), primary: '#97233f', secondary: '#000000', accent: '#ffb612', onPrimary: '#ffffff' },
  ATL: { name: 'Atlanta Falcons', logo: logo('atlanta-falcons-logo-footylogos.png'), primary: '#a71930', secondary: '#000000', accent: '#a5acaf', onPrimary: '#ffffff' },
  BAL: { name: 'Baltimore Ravens', logo: logo('baltimore-ravens-logo-footylogos.png'), primary: '#241773', secondary: '#000000', accent: '#9e7c0c', onPrimary: '#ffffff' },
  BUF: { name: 'Buffalo Bills', logo: logo('buffalo-bills-logo-footylogos.png'), primary: '#00338d', secondary: '#c60c30', accent: '#ffffff', onPrimary: '#ffffff' },
  CAR: { name: 'Carolina Panthers', logo: logo('carolina-panthers-logo-footylogos.png'), primary: '#0085ca', secondary: '#101820', accent: '#bfc0bf', onPrimary: '#ffffff' },
  CHI: { name: 'Chicago Bears', logo: logo('chicago-bears-logo-footylogos.png'), primary: '#0b162a', secondary: '#c83803', accent: '#ffffff', onPrimary: '#ffffff' },
  CIN: { name: 'Cincinnati Bengals', logo: logo('cincinnati-bengals-logo-footylogos.png'), primary: '#fb4f14', secondary: '#000000', accent: '#ffffff', onPrimary: '#111827' },
  CLE: { name: 'Cleveland Browns', logo: logo('cleveland-browns-logo-footylogos.png'), primary: '#311d00', secondary: '#ff3c00', accent: '#ffffff', onPrimary: '#ffffff' },
  DAL: { name: 'Dallas Cowboys', logo: logo('dallas-cowboys-logo-footylogos.png'), primary: '#003594', secondary: '#041e42', accent: '#869397', onPrimary: '#ffffff' },
  DEN: { name: 'Denver Broncos', logo: logo('denver-broncos-logo-footylogos.png'), primary: '#fb4f14', secondary: '#002244', accent: '#ffffff', onPrimary: '#111827' },
  DET: { name: 'Detroit Lions', logo: logo('detroit-lions-logo-footylogos.png'), primary: '#0076b6', secondary: '#203731', accent: '#b0b7bc', onPrimary: '#ffffff' },
  GB: { name: 'Green Bay Packers', logo: logo('green-bay-packers-logo-footylogos.png'), primary: '#203731', secondary: '#ffb612', accent: '#ffffff', onPrimary: '#ffffff' },
  HOU: { name: 'Houston Texans', logo: logo('houston-texans-logo-footylogos.png'), primary: '#03202f', secondary: '#a71930', accent: '#ffffff', onPrimary: '#ffffff' },
  IND: { name: 'Indianapolis Colts', logo: logo('indianapolis-colts-logo-footylogos.png'), primary: '#002c5f', secondary: '#a2aaad', accent: '#ffffff', onPrimary: '#ffffff' },
  JAX: { name: 'Jacksonville Jaguars', logo: logo('jacksonville-jaguars-logo-footylogos.png'), primary: '#006778', secondary: '#101820', accent: '#d7a22a', onPrimary: '#ffffff' },
  KC: { name: 'Kansas City Chiefs', logo: logo('kansas-city-chiefs-logo-footylogos.png'), primary: '#e31837', secondary: '#ffb81c', accent: '#ffffff', onPrimary: '#ffffff' },
  LA: { name: 'Los Angeles Rams', logo: logo('los-angeles-rams-logo-footylogos.png'), primary: '#003594', secondary: '#ffa300', accent: '#ffffff', onPrimary: '#ffffff' },
  LAC: { name: 'Los Angeles Chargers', logo: logo('los-angeles-chargers-logo-footylogos.png'), primary: '#0080c6', secondary: '#ffc20e', accent: '#ffffff', onPrimary: '#ffffff' },
  LV: { name: 'Las Vegas Raiders', logo: logo('las-vegas-raiders-logo-footylogos.png'), primary: '#000000', secondary: '#a5acaf', accent: '#ffffff', onPrimary: '#ffffff' },
  MIA: { name: 'Miami Dolphins', logo: logo('miami-dolphins-logo-footylogos.png'), primary: '#008e97', secondary: '#fc4c02', accent: '#ffffff', onPrimary: '#ffffff' },
  MIN: { name: 'Minnesota Vikings', logo: logo('minnesota-vikings-logo-footylogos.png'), primary: '#4f2683', secondary: '#ffc62f', accent: '#ffffff', onPrimary: '#ffffff' },
  NE: { name: 'New England Patriots', logo: logo('new-england-patriots-logo-footylogos.png'), primary: '#002244', secondary: '#c60c30', accent: '#b0b7bc', onPrimary: '#ffffff' },
  NO: { name: 'New Orleans Saints', logo: logo('new-orleans-saints-logo-footylogos.png'), primary: '#101820', secondary: '#d3bc8d', accent: '#ffffff', onPrimary: '#ffffff' },
  NYG: { name: 'New York Giants', logo: logo('new-york-giants-logo-footylogos.png'), primary: '#0b2265', secondary: '#a71930', accent: '#ffffff', onPrimary: '#ffffff' },
  NYJ: { name: 'New York Jets', logo: logo('new-york-jets-logo-footylogos.png'), primary: '#125740', secondary: '#000000', accent: '#ffffff', onPrimary: '#ffffff' },
  PHI: { name: 'Philadelphia Eagles', logo: logo('philadelphia-eagles-logo-footylogos.png'), primary: '#004c54', secondary: '#a5acaf', accent: '#ffffff', onPrimary: '#ffffff' },
  PIT: { name: 'Pittsburgh Steelers', logo: logo('pittsburgh-steelers-logo-footylogos.png'), primary: '#101820', secondary: '#ffb612', accent: '#ffffff', onPrimary: '#ffffff' },
  SEA: { name: 'Seattle Seahawks', logo: logo('seattle-seahawks-logo-footylogos.png'), primary: '#002244', secondary: '#69be28', accent: '#a5acaf', onPrimary: '#ffffff' },
  SF: { name: 'San Francisco 49ers', logo: logo('san-francisco-49ers-logo-footylogos.png'), primary: '#aa0000', secondary: '#b3995d', accent: '#ffffff', onPrimary: '#ffffff' },
  TB: { name: 'Tampa Bay Buccaneers', logo: logo('tampa-bay-buccaneers-logo-footylogos.png'), primary: '#d50a0a', secondary: '#34302b', accent: '#ff7900', onPrimary: '#ffffff' },
  TEN: { name: 'Tennessee Titans', logo: logo('tennessee-titans-logo-footylogos.png'), primary: '#0c2340', secondary: '#4b92db', accent: '#c8102e', onPrimary: '#ffffff' },
  WAS: { name: 'Washington Commanders', logo: logo('washington-commanders-logo-footylogos.png'), primary: '#5a1414', secondary: '#ffb612', accent: '#ffffff', onPrimary: '#ffffff' },
}

export function getTeamTheme(team: string): TeamTheme {
  return TEAM_THEMES[team] ?? DEFAULT_THEME
}
