export type Confederation =
  | "CONMEBOL"
  | "UEFA"
  | "CONCACAF"
  | "AFC"
  | "CAF"
  | "OFC"
  | "Inter";
export type Group =
  | "A"
  | "B"
  | "C"
  | "D"
  | "E"
  | "F"
  | "G"
  | "H"
  | "I"
  | "J"
  | "K"
  | "L"
  | "Extras";

export interface StickerDef {
  number: number | string;
  label: string;
  code?: string;
  isFoil?: boolean;
}

export interface Country {
  code: string;
  name: string;
  flag: string;
  confederation: Confederation;
  group: Group;
  stickers: StickerDef[];
}

function makeStickers(count = 20): StickerDef[] {
  return Array.from({ length: count }, (_, i) => ({
    number: i + 1,
    label: i === 0 ? "Escudo" : i === 1 ? "Foto oficial" : `Jogador ${i - 1}`,
    isFoil: i === 0,
  }));
}

function makeSpecialStickers(): StickerDef[] {
  return [{ number: "00", code: "00", label: "Card 00", isFoil: true }];
}

function makeFwcStickers(): StickerDef[] {
  return Array.from({ length: 19 }, (_, i) => ({
    number: i + 1,
    label: `FWC ${i + 1}`,
  }));
}

function makeCocaColaStickers(): StickerDef[] {
  return Array.from({ length: 14 }, (_, i) => ({
    number: `CC${i + 1}`,
    code: `CC${i + 1}`,
    label: `Coca-Cola ${i + 1}`,
  }));
}

// Groups A-L as listed in the Panini FIFA World Cup 2026 album.
// Each country currently has 20 sticker slots.
export const COUNTRIES: Country[] = [
  // Group A
  {
    code: "MEX",
    name: "México",
    flag: "🇲🇽",
    confederation: "CONCACAF",
    group: "A",
    stickers: makeStickers(),
  },
  {
    code: "RSA",
    name: "África do Sul",
    flag: "🇿🇦",
    confederation: "CAF",
    group: "A",
    stickers: makeStickers(),
  },
  {
    code: "KOR",
    name: "Coreia do Sul",
    flag: "🇰🇷",
    confederation: "AFC",
    group: "A",
    stickers: makeStickers(),
  },
  {
    code: "CZE",
    name: "Tchéquia",
    flag: "🇨🇿",
    confederation: "UEFA",
    group: "A",
    stickers: makeStickers(),
  },

  // Group B
  {
    code: "CAN",
    name: "Canadá",
    flag: "🇨🇦",
    confederation: "CONCACAF",
    group: "B",
    stickers: makeStickers(),
  },
  {
    code: "BIH",
    name: "Bósnia-Herzegovina",
    flag: "🇧🇦",
    confederation: "UEFA",
    group: "B",
    stickers: makeStickers(),
  },
  {
    code: "QAT",
    name: "Qatar",
    flag: "🇶🇦",
    confederation: "AFC",
    group: "B",
    stickers: makeStickers(),
  },
  {
    code: "SUI",
    name: "Suíça",
    flag: "🇨🇭",
    confederation: "UEFA",
    group: "B",
    stickers: makeStickers(),
  },

  // Group C
  {
    code: "BRA",
    name: "Brasil",
    flag: "🇧🇷",
    confederation: "CONMEBOL",
    group: "C",
    stickers: makeStickers(),
  },
  {
    code: "MAR",
    name: "Marrocos",
    flag: "🇲🇦",
    confederation: "CAF",
    group: "C",
    stickers: makeStickers(),
  },
  {
    code: "HAI",
    name: "Haiti",
    flag: "🇭🇹",
    confederation: "CONCACAF",
    group: "C",
    stickers: makeStickers(),
  },
  {
    code: "SCO",
    name: "Escócia",
    flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
    confederation: "UEFA",
    group: "C",
    stickers: makeStickers(),
  },

  // Group D
  {
    code: "USA",
    name: "Estados Unidos",
    flag: "🇺🇸",
    confederation: "CONCACAF",
    group: "D",
    stickers: makeStickers(),
  },
  {
    code: "PAR",
    name: "Paraguai",
    flag: "🇵🇾",
    confederation: "CONMEBOL",
    group: "D",
    stickers: makeStickers(),
  },
  {
    code: "AUS",
    name: "Austrália",
    flag: "🇦🇺",
    confederation: "AFC",
    group: "D",
    stickers: makeStickers(),
  },
  {
    code: "TUR",
    name: "Turquia",
    flag: "🇹🇷",
    confederation: "UEFA",
    group: "D",
    stickers: makeStickers(),
  },

  // Group E
  {
    code: "GER",
    name: "Alemanha",
    flag: "🇩🇪",
    confederation: "UEFA",
    group: "E",
    stickers: makeStickers(),
  },
  {
    code: "CUW",
    name: "Curaçao",
    flag: "🇨🇼",
    confederation: "CONCACAF",
    group: "E",
    stickers: makeStickers(),
  },
  {
    code: "CIV",
    name: "Costa do Marfim",
    flag: "🇨🇮",
    confederation: "CAF",
    group: "E",
    stickers: makeStickers(),
  },
  {
    code: "ECU",
    name: "Equador",
    flag: "🇪🇨",
    confederation: "CONMEBOL",
    group: "E",
    stickers: makeStickers(),
  },

  // Group F
  {
    code: "NED",
    name: "Holanda",
    flag: "🇳🇱",
    confederation: "UEFA",
    group: "F",
    stickers: makeStickers(),
  },
  {
    code: "JPN",
    name: "Japão",
    flag: "🇯🇵",
    confederation: "AFC",
    group: "F",
    stickers: makeStickers(),
  },
  {
    code: "SWE",
    name: "Suécia",
    flag: "🇸🇪",
    confederation: "UEFA",
    group: "F",
    stickers: makeStickers(),
  },
  {
    code: "TUN",
    name: "Tunísia",
    flag: "🇹🇳",
    confederation: "CAF",
    group: "F",
    stickers: makeStickers(),
  },

  // Group G
  {
    code: "BEL",
    name: "Bélgica",
    flag: "🇧🇪",
    confederation: "UEFA",
    group: "G",
    stickers: makeStickers(),
  },
  {
    code: "EGY",
    name: "Egito",
    flag: "🇪🇬",
    confederation: "CAF",
    group: "G",
    stickers: makeStickers(),
  },
  {
    code: "IRN",
    name: "Irã",
    flag: "🇮🇷",
    confederation: "AFC",
    group: "G",
    stickers: makeStickers(),
  },
  {
    code: "NZL",
    name: "Nova Zelândia",
    flag: "🇳🇿",
    confederation: "OFC",
    group: "G",
    stickers: makeStickers(),
  },

  // Group H
  {
    code: "ESP",
    name: "Espanha",
    flag: "🇪🇸",
    confederation: "UEFA",
    group: "H",
    stickers: makeStickers(),
  },
  {
    code: "CPV",
    name: "Cabo Verde",
    flag: "🇨🇻",
    confederation: "CAF",
    group: "H",
    stickers: makeStickers(),
  },
  {
    code: "KSA",
    name: "Arábia Saudita",
    flag: "🇸🇦",
    confederation: "AFC",
    group: "H",
    stickers: makeStickers(),
  },
  {
    code: "URU",
    name: "Uruguai",
    flag: "🇺🇾",
    confederation: "CONMEBOL",
    group: "H",
    stickers: makeStickers(),
  },

  // Group I
  {
    code: "FRA",
    name: "França",
    flag: "🇫🇷",
    confederation: "UEFA",
    group: "I",
    stickers: makeStickers(),
  },
  {
    code: "SEN",
    name: "Senegal",
    flag: "🇸🇳",
    confederation: "CAF",
    group: "I",
    stickers: makeStickers(),
  },
  {
    code: "IRQ",
    name: "Iraque",
    flag: "🇮🇶",
    confederation: "AFC",
    group: "I",
    stickers: makeStickers(),
  },
  {
    code: "NOR",
    name: "Noruega",
    flag: "🇳🇴",
    confederation: "UEFA",
    group: "I",
    stickers: makeStickers(),
  },

  // Group J
  {
    code: "ARG",
    name: "Argentina",
    flag: "🇦🇷",
    confederation: "CONMEBOL",
    group: "J",
    stickers: makeStickers(),
  },
  {
    code: "ALG",
    name: "Argélia",
    flag: "🇩🇿",
    confederation: "CAF",
    group: "J",
    stickers: makeStickers(),
  },
  {
    code: "AUT",
    name: "Áustria",
    flag: "🇦🇹",
    confederation: "UEFA",
    group: "J",
    stickers: makeStickers(),
  },
  {
    code: "JOR",
    name: "Jordânia",
    flag: "🇯🇴",
    confederation: "AFC",
    group: "J",
    stickers: makeStickers(),
  },

  // Group K
  {
    code: "POR",
    name: "Portugal",
    flag: "🇵🇹",
    confederation: "UEFA",
    group: "K",
    stickers: makeStickers(),
  },
  {
    code: "COD",
    name: "RD do Congo",
    flag: "🇨🇩",
    confederation: "CAF",
    group: "K",
    stickers: makeStickers(),
  },
  {
    code: "UZB",
    name: "Uzbequistão",
    flag: "🇺🇿",
    confederation: "AFC",
    group: "K",
    stickers: makeStickers(),
  },
  {
    code: "COL",
    name: "Colômbia",
    flag: "🇨🇴",
    confederation: "CONMEBOL",
    group: "K",
    stickers: makeStickers(),
  },

  // Group L
  {
    code: "ENG",
    name: "Inglaterra",
    flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    confederation: "UEFA",
    group: "L",
    stickers: makeStickers(),
  },
  {
    code: "CRO",
    name: "Croácia",
    flag: "🇭🇷",
    confederation: "UEFA",
    group: "L",
    stickers: makeStickers(),
  },
  {
    code: "GHA",
    name: "Gana",
    flag: "🇬🇭",
    confederation: "CAF",
    group: "L",
    stickers: makeStickers(),
  },
  {
    code: "PAN",
    name: "Panamá",
    flag: "🇵🇦",
    confederation: "CONCACAF",
    group: "L",
    stickers: makeStickers(),
  },
  {
    code: "SPC",
    name: "Especiais",
    flag: "⭐",
    confederation: "Inter",
    group: "Extras",
    stickers: makeSpecialStickers(),
  },
  {
    code: "FWC",
    name: "FIFA World Cup",
    flag: "🏆",
    confederation: "Inter",
    group: "Extras",
    stickers: makeFwcStickers(),
  },
  {
    code: "CC",
    name: "Coca-Cola",
    flag: "🥤",
    confederation: "Inter",
    group: "Extras",
    stickers: makeCocaColaStickers(),
  },
];

export const TOTAL_STICKERS = COUNTRIES.reduce(
  (sum, c) => sum + c.stickers.length,
  0,
);

export function getStickerCode(
  countryCode: string,
  sticker: StickerDef | number | string,
): string {
  if (typeof sticker === "object")
    return sticker.code ?? `${countryCode} ${sticker.number}`;
  return `${countryCode} ${sticker}`;
}

export function getCountryByCode(code: string): Country | undefined {
  return COUNTRIES.find((c) => c.code === code);
}
