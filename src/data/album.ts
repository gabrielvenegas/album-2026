export type Confederation = 'CONMEBOL' | 'UEFA' | 'CONCACAF' | 'AFC' | 'CAF' | 'OFC' | 'Inter'
export type Group = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K' | 'L'

export interface StickerDef {
  number: number
  label: string
  isFoil?: boolean
}

export interface Country {
  code: string
  name: string
  flag: string
  confederation: Confederation
  group: Group
  stickers: StickerDef[]
}

function makeStickers(count = 20): StickerDef[] {
  return Array.from({ length: count }, (_, i) => ({
    number: i + 1,
    label: i === 0 ? 'Escudo' : i === 1 ? 'Foto oficial' : `Jogador ${i - 1}`,
    isFoil: i === 0,
  }))
}

// Groups A–L as listed in the Panini FIFA World Cup 2026 album
// Group A: México, África do Sul, Coreia do Sul, República Tcheca
// Group B: Canadá, Qatar, Suíça, Nova Zelândia
// Group C: Estados Unidos, Escócia, Haiti, Brasil
// Group D: Austrália, Turquia, Chile (+ Escócia*)
// Group E: Inglaterra, Croácia, Gana, Panamá
// Group F: França, Ucrânia, Mali (+ Nova Zelândia*)
// Group G: Alemanha, Irlanda, Jamaica, Uzbequistão
// Group H: Espanha, Romênia, Egito, Honduras
// Group I: Itália, Noruega, Costa do Marfim (+ Canadá*)
// Group J: Argentina, Argélia, Áustria, Jordânia
// Group K: Portugal, RD do Congo, Colômbia, Japão
// Group L: Holanda, Uruguai, Emirados Árabes Unidos, Fiji

export const COUNTRIES: Country[] = [
  // Group A
  { code: 'MEX', name: 'México',            flag: '🇲🇽', confederation: 'CONCACAF', group: 'A', stickers: makeStickers() },
  { code: 'RSA', name: 'África do Sul',     flag: '🇿🇦', confederation: 'CAF',      group: 'A', stickers: makeStickers() },
  { code: 'KOR', name: 'Coreia do Sul',     flag: '🇰🇷', confederation: 'AFC',      group: 'A', stickers: makeStickers() },
  { code: 'CZE', name: 'República Tcheca',  flag: '🇨🇿', confederation: 'UEFA',     group: 'A', stickers: makeStickers() },

  // Group B
  { code: 'CAN', name: 'Canadá',            flag: '🇨🇦', confederation: 'CONCACAF', group: 'B', stickers: makeStickers() },
  { code: 'QAT', name: 'Qatar',             flag: '🇶🇦', confederation: 'AFC',      group: 'B', stickers: makeStickers() },
  { code: 'SUI', name: 'Suíça',             flag: '🇨🇭', confederation: 'UEFA',     group: 'B', stickers: makeStickers() },
  { code: 'NZL', name: 'Nova Zelândia',     flag: '🇳🇿', confederation: 'OFC',      group: 'B', stickers: makeStickers() },

  // Group C
  { code: 'USA', name: 'Estados Unidos',    flag: '🇺🇸', confederation: 'CONCACAF', group: 'C', stickers: makeStickers() },
  { code: 'SCO', name: 'Escócia',           flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', confederation: 'UEFA',     group: 'C', stickers: makeStickers() },
  { code: 'HAI', name: 'Haiti',             flag: '🇭🇹', confederation: 'CONCACAF', group: 'C', stickers: makeStickers() },
  { code: 'BRA', name: 'Brasil',            flag: '🇧🇷', confederation: 'CONMEBOL', group: 'C', stickers: makeStickers() },

  // Group D
  { code: 'AUS', name: 'Austrália',         flag: '🇦🇺', confederation: 'AFC',      group: 'D', stickers: makeStickers() },
  { code: 'TUR', name: 'Turquia',           flag: '🇹🇷', confederation: 'UEFA',     group: 'D', stickers: makeStickers() },
  { code: 'CHI', name: 'Chile',             flag: '🇨🇱', confederation: 'CONMEBOL', group: 'D', stickers: makeStickers() },

  // Group E
  { code: 'ENG', name: 'Inglaterra',        flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', confederation: 'UEFA',     group: 'E', stickers: makeStickers() },
  { code: 'CRO', name: 'Croácia',           flag: '🇭🇷', confederation: 'UEFA',     group: 'E', stickers: makeStickers() },
  { code: 'GHA', name: 'Gana',              flag: '🇬🇭', confederation: 'CAF',      group: 'E', stickers: makeStickers() },
  { code: 'PAN', name: 'Panamá',            flag: '🇵🇦', confederation: 'CONCACAF', group: 'E', stickers: makeStickers() },

  // Group F
  { code: 'FRA', name: 'França',            flag: '🇫🇷', confederation: 'UEFA',     group: 'F', stickers: makeStickers() },
  { code: 'UKR', name: 'Ucrânia',           flag: '🇺🇦', confederation: 'UEFA',     group: 'F', stickers: makeStickers() },
  { code: 'MLI', name: 'Mali',              flag: '🇲🇱', confederation: 'CAF',      group: 'F', stickers: makeStickers() },

  // Group G
  { code: 'GER', name: 'Alemanha',          flag: '🇩🇪', confederation: 'UEFA',     group: 'G', stickers: makeStickers() },
  { code: 'IRL', name: 'Irlanda',           flag: '🇮🇪', confederation: 'UEFA',     group: 'G', stickers: makeStickers() },
  { code: 'JAM', name: 'Jamaica',           flag: '🇯🇲', confederation: 'CONCACAF', group: 'G', stickers: makeStickers() },
  { code: 'UZB', name: 'Uzbequistão',       flag: '🇺🇿', confederation: 'AFC',      group: 'G', stickers: makeStickers() },

  // Group H
  { code: 'ESP', name: 'Espanha',           flag: '🇪🇸', confederation: 'UEFA',     group: 'H', stickers: makeStickers() },
  { code: 'ROU', name: 'Romênia',           flag: '🇷🇴', confederation: 'UEFA',     group: 'H', stickers: makeStickers() },
  { code: 'EGY', name: 'Egito',             flag: '🇪🇬', confederation: 'CAF',      group: 'H', stickers: makeStickers() },
  { code: 'HON', name: 'Honduras',          flag: '🇭🇳', confederation: 'CONCACAF', group: 'H', stickers: makeStickers() },

  // Group I
  { code: 'ITA', name: 'Itália',            flag: '🇮🇹', confederation: 'UEFA',     group: 'I', stickers: makeStickers() },
  { code: 'NOR', name: 'Noruega',           flag: '🇳🇴', confederation: 'UEFA',     group: 'I', stickers: makeStickers() },
  { code: 'CIV', name: 'Costa do Marfim',   flag: '🇨🇮', confederation: 'CAF',      group: 'I', stickers: makeStickers() },

  // Group J
  { code: 'ARG', name: 'Argentina',         flag: '🇦🇷', confederation: 'CONMEBOL', group: 'J', stickers: makeStickers() },
  { code: 'ALG', name: 'Argélia',           flag: '🇩🇿', confederation: 'CAF',      group: 'J', stickers: makeStickers() },
  { code: 'AUT', name: 'Áustria',           flag: '🇦🇹', confederation: 'UEFA',     group: 'J', stickers: makeStickers() },
  { code: 'JOR', name: 'Jordânia',          flag: '🇯🇴', confederation: 'AFC',      group: 'J', stickers: makeStickers() },

  // Group K
  { code: 'POR', name: 'Portugal',          flag: '🇵🇹', confederation: 'UEFA',     group: 'K', stickers: makeStickers() },
  { code: 'COD', name: 'RD do Congo',       flag: '🇨🇩', confederation: 'CAF',      group: 'K', stickers: makeStickers() },
  { code: 'COL', name: 'Colômbia',          flag: '🇨🇴', confederation: 'CONMEBOL', group: 'K', stickers: makeStickers() },
  { code: 'JPN', name: 'Japão',             flag: '🇯🇵', confederation: 'AFC',      group: 'K', stickers: makeStickers() },

  // Group L
  { code: 'NED', name: 'Holanda',           flag: '🇳🇱', confederation: 'UEFA',     group: 'L', stickers: makeStickers() },
  { code: 'URU', name: 'Uruguai',           flag: '🇺🇾', confederation: 'CONMEBOL', group: 'L', stickers: makeStickers() },
  { code: 'UAE', name: 'Emirados Árabes',   flag: '🇦🇪', confederation: 'AFC',      group: 'L', stickers: makeStickers() },
  { code: 'FIJ', name: 'Fiji',              flag: '🇫🇯', confederation: 'OFC',      group: 'L', stickers: makeStickers() },
]

export const TOTAL_STICKERS = COUNTRIES.reduce((sum, c) => sum + c.stickers.length, 0)

export function getStickerCode(countryCode: string, number: number): string {
  return `${countryCode} ${number}`
}

export function getCountryByCode(code: string): Country | undefined {
  return COUNTRIES.find(c => c.code === code)
}
