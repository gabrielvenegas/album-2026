import grupoAImages from "@/data/grupo-a-images.json";
import grupoBImages from "@/data/grupo-b-images.json";
import grupoCImages from "@/data/grupo-c-images.json";
import grupoDImages from "@/data/grupo-d-images.json";
import grupoEImages from "@/data/grupo-e-images.json";
import grupoFImages from "@/data/grupo-f-images.json";
import grupoGImages from "@/data/grupo-g-images.json";
import grupoHImages from "@/data/grupo-h-images.json";
import grupoIImages from "@/data/grupo-i-images.json";
import grupoJImages from "@/data/grupo-j-images.json";
import grupoKImages from "@/data/grupo-k-images.json";
import grupoLImages from "@/data/grupo-l-images.json";
import { PLAYER_ROSTERS } from "@/data/players";

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
  image?: string;
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
  return Array.from({ length: count }, (_, i) => {
    const number = i + 1;
    if (number === 1) {
      return { number, label: "Escudo", isFoil: true };
    }
    if (number === 13) {
      return { number, label: "Foto oficial" };
    }
    const playerNum = number < 13 ? number - 1 : number - 2;
    return { number, label: `Jogador ${playerNum}` };
  });
}

function makePlayerStickers(players: readonly string[]): StickerDef[] {
  const roster = [...players];
  while (roster.length < 18) {
    roster.push(`Jogador ${roster.length + 1}`);
  }
  return [
    { number: 1, label: "Escudo", isFoil: true },
    ...roster.slice(0, 11).map((label, i) => ({ number: i + 2, label })),
    { number: 13, label: "Foto oficial" },
    ...roster.slice(11, 18).map((label, i) => ({ number: i + 14, label })),
  ];
}

function stickersFor(code: string): StickerDef[] {
  const players = PLAYER_ROSTERS[code];
  return players ? makePlayerStickers(players) : makeStickers();
}

function withImages(
  stickers: StickerDef[],
  images: Partial<Record<number, string>>,
): StickerDef[] {
  return stickers.map((s) => {
    const n = typeof s.number === "number" ? s.number : Number(s.number);
    const image = images[n];
    return image ? { ...s, image } : s;
  });
}

const GRUPO_A_CODES = ["MEX", "RSA", "KOR", "CZE"] as const;
const GRUPO_B_CODES = ["CAN", "BIH", "QAT", "SUI"] as const;
const GRUPO_C_CODES = ["BRA", "MAR", "HAI", "SCO"] as const;
const GRUPO_D_CODES = ["USA", "PAR", "AUS", "TUR"] as const;
const GRUPO_E_CODES = ["GER", "CUW", "CIV", "ECU"] as const;
const GRUPO_F_CODES = ["NED", "JPN", "SWE", "TUN"] as const;
const GRUPO_G_CODES = ["BEL", "EGY", "IRN", "NZL"] as const;
const GRUPO_H_CODES = ["ESP", "CPV", "KSA", "URU"] as const;
const GRUPO_I_CODES = ["FRA", "SEN", "IRQ", "NOR"] as const;
const GRUPO_J_CODES = ["ARG", "ALG", "AUT", "JOR"] as const;
const GRUPO_K_CODES = ["POR", "COD", "UZB", "COL"] as const;
const GRUPO_L_CODES = ["ENG", "CRO", "GHA", "PAN"] as const;

const GRUPO_E_TO_L_IMAGES = {
  E: grupoEImages,
  F: grupoFImages,
  G: grupoGImages,
  H: grupoHImages,
  I: grupoIImages,
  J: grupoJImages,
  K: grupoKImages,
  L: grupoLImages,
} as const;

type GrupoEtoL = keyof typeof GRUPO_E_TO_L_IMAGES;

const GRUPO_E_TO_L_CODES = {
  E: GRUPO_E_CODES,
  F: GRUPO_F_CODES,
  G: GRUPO_G_CODES,
  H: GRUPO_H_CODES,
  I: GRUPO_I_CODES,
  J: GRUPO_J_CODES,
  K: GRUPO_K_CODES,
  L: GRUPO_L_CODES,
} as const;

function grupoImageMap(
  manifest: Record<string, Record<string, string>>,
  code: string,
): Partial<Record<number, string>> {
  const raw = manifest[code.toLowerCase()];
  if (!raw) return {};
  return Object.fromEntries(
    Object.entries(raw).map(([slot, path]) => [Number(slot), path]),
  );
}

function stickersForGrupoA(code: (typeof GRUPO_A_CODES)[number]): StickerDef[] {
  return withImages(stickersFor(code), grupoImageMap(grupoAImages, code));
}

function stickersForGrupoB(code: (typeof GRUPO_B_CODES)[number]): StickerDef[] {
  return withImages(stickersFor(code), grupoImageMap(grupoBImages, code));
}

function stickersForGrupoC(code: (typeof GRUPO_C_CODES)[number]): StickerDef[] {
  return withImages(stickersFor(code), grupoImageMap(grupoCImages, code));
}

function stickersForGrupoD(code: (typeof GRUPO_D_CODES)[number]): StickerDef[] {
  return withImages(stickersFor(code), grupoImageMap(grupoDImages, code));
}

function stickersForGrupoEtoL<G extends GrupoEtoL>(
  group: G,
  code: (typeof GRUPO_E_TO_L_CODES)[G][number],
): StickerDef[] {
  return withImages(
    stickersFor(code),
    grupoImageMap(GRUPO_E_TO_L_IMAGES[group], code),
  );
}

function stickersForGrupoE(code: (typeof GRUPO_E_CODES)[number]): StickerDef[] {
  return stickersForGrupoEtoL("E", code);
}
function stickersForGrupoF(code: (typeof GRUPO_F_CODES)[number]): StickerDef[] {
  return stickersForGrupoEtoL("F", code);
}
function stickersForGrupoG(code: (typeof GRUPO_G_CODES)[number]): StickerDef[] {
  return stickersForGrupoEtoL("G", code);
}
function stickersForGrupoH(code: (typeof GRUPO_H_CODES)[number]): StickerDef[] {
  return stickersForGrupoEtoL("H", code);
}
function stickersForGrupoI(code: (typeof GRUPO_I_CODES)[number]): StickerDef[] {
  return stickersForGrupoEtoL("I", code);
}
function stickersForGrupoJ(code: (typeof GRUPO_J_CODES)[number]): StickerDef[] {
  return stickersForGrupoEtoL("J", code);
}
function stickersForGrupoK(code: (typeof GRUPO_K_CODES)[number]): StickerDef[] {
  return stickersForGrupoEtoL("K", code);
}
function stickersForGrupoL(code: (typeof GRUPO_L_CODES)[number]): StickerDef[] {
  return stickersForGrupoEtoL("L", code);
}

function makeSpecialStickers(): StickerDef[] {
  return [{ number: "00", code: "00", label: "Card 00", isFoil: true }];
}

function makeFwcStickers(): StickerDef[] {
  return Array.from({ length: 19 }, (_, i) => ({
    number: i + 1,
    code: `FWC ${i + 1}`,
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
// Each country has 20 slots: 1 = escudo, 13 = foto da seleção, demais = jogadores.
export const COUNTRIES: Country[] = [
  // Group A
  {
    code: "MEX",
    name: "México",
    flag: "🇲🇽",
    confederation: "CONCACAF",
    group: "A",
    stickers: stickersForGrupoA("MEX"),
  },
  {
    code: "RSA",
    name: "África do Sul",
    flag: "🇿🇦",
    confederation: "CAF",
    group: "A",
    stickers: stickersForGrupoA("RSA"),
  },
  {
    code: "KOR",
    name: "Coreia do Sul",
    flag: "🇰🇷",
    confederation: "AFC",
    group: "A",
    stickers: stickersForGrupoA("KOR"),
  },
  {
    code: "CZE",
    name: "Tchéquia",
    flag: "🇨🇿",
    confederation: "UEFA",
    group: "A",
    stickers: stickersForGrupoA("CZE"),
  },

  // Group B
  {
    code: "CAN",
    name: "Canadá",
    flag: "🇨🇦",
    confederation: "CONCACAF",
    group: "B",
    stickers: stickersForGrupoB("CAN"),
  },
  {
    code: "BIH",
    name: "Bósnia-Herzegovina",
    flag: "🇧🇦",
    confederation: "UEFA",
    group: "B",
    stickers: stickersForGrupoB("BIH"),
  },
  {
    code: "QAT",
    name: "Qatar",
    flag: "🇶🇦",
    confederation: "AFC",
    group: "B",
    stickers: stickersForGrupoB("QAT"),
  },
  {
    code: "SUI",
    name: "Suíça",
    flag: "🇨🇭",
    confederation: "UEFA",
    group: "B",
    stickers: stickersForGrupoB("SUI"),
  },

  // Group C
  {
    code: "BRA",
    name: "Brasil",
    flag: "🇧🇷",
    confederation: "CONMEBOL",
    group: "C",
    stickers: stickersForGrupoC("BRA"),
  },
  {
    code: "MAR",
    name: "Marrocos",
    flag: "🇲🇦",
    confederation: "CAF",
    group: "C",
    stickers: stickersForGrupoC("MAR"),
  },
  {
    code: "HAI",
    name: "Haiti",
    flag: "🇭🇹",
    confederation: "CONCACAF",
    group: "C",
    stickers: stickersForGrupoC("HAI"),
  },
  {
    code: "SCO",
    name: "Escócia",
    flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
    confederation: "UEFA",
    group: "C",
    stickers: stickersForGrupoC("SCO"),
  },

  // Group D
  {
    code: "USA",
    name: "Estados Unidos",
    flag: "🇺🇸",
    confederation: "CONCACAF",
    group: "D",
    stickers: stickersForGrupoD("USA"),
  },
  {
    code: "PAR",
    name: "Paraguai",
    flag: "🇵🇾",
    confederation: "CONMEBOL",
    group: "D",
    stickers: stickersForGrupoD("PAR"),
  },
  {
    code: "AUS",
    name: "Austrália",
    flag: "🇦🇺",
    confederation: "AFC",
    group: "D",
    stickers: stickersForGrupoD("AUS"),
  },
  {
    code: "TUR",
    name: "Turquia",
    flag: "🇹🇷",
    confederation: "UEFA",
    group: "D",
    stickers: stickersForGrupoD("TUR"),
  },

  // Group E
  {
    code: "GER",
    name: "Alemanha",
    flag: "🇩🇪",
    confederation: "UEFA",
    group: "E",
    stickers: stickersForGrupoE("GER"),
  },
  {
    code: "CUW",
    name: "Curaçao",
    flag: "🇨🇼",
    confederation: "CONCACAF",
    group: "E",
    stickers: stickersForGrupoE("CUW"),
  },
  {
    code: "CIV",
    name: "Costa do Marfim",
    flag: "🇨🇮",
    confederation: "CAF",
    group: "E",
    stickers: stickersForGrupoE("CIV"),
  },
  {
    code: "ECU",
    name: "Equador",
    flag: "🇪🇨",
    confederation: "CONMEBOL",
    group: "E",
    stickers: stickersForGrupoE("ECU"),
  },

  // Group F
  {
    code: "NED",
    name: "Holanda",
    flag: "🇳🇱",
    confederation: "UEFA",
    group: "F",
    stickers: stickersForGrupoF("NED"),
  },
  {
    code: "JPN",
    name: "Japão",
    flag: "🇯🇵",
    confederation: "AFC",
    group: "F",
    stickers: stickersForGrupoF("JPN"),
  },
  {
    code: "SWE",
    name: "Suécia",
    flag: "🇸🇪",
    confederation: "UEFA",
    group: "F",
    stickers: stickersForGrupoF("SWE"),
  },
  {
    code: "TUN",
    name: "Tunísia",
    flag: "🇹🇳",
    confederation: "CAF",
    group: "F",
    stickers: stickersForGrupoF("TUN"),
  },

  // Group G
  {
    code: "BEL",
    name: "Bélgica",
    flag: "🇧🇪",
    confederation: "UEFA",
    group: "G",
    stickers: stickersForGrupoG("BEL"),
  },
  {
    code: "EGY",
    name: "Egito",
    flag: "🇪🇬",
    confederation: "CAF",
    group: "G",
    stickers: stickersForGrupoG("EGY"),
  },
  {
    code: "IRN",
    name: "Irã",
    flag: "🇮🇷",
    confederation: "AFC",
    group: "G",
    stickers: stickersForGrupoG("IRN"),
  },
  {
    code: "NZL",
    name: "Nova Zelândia",
    flag: "🇳🇿",
    confederation: "OFC",
    group: "G",
    stickers: stickersForGrupoG("NZL"),
  },

  // Group H
  {
    code: "ESP",
    name: "Espanha",
    flag: "🇪🇸",
    confederation: "UEFA",
    group: "H",
    stickers: stickersForGrupoH("ESP"),
  },
  {
    code: "CPV",
    name: "Cabo Verde",
    flag: "🇨🇻",
    confederation: "CAF",
    group: "H",
    stickers: stickersForGrupoH("CPV"),
  },
  {
    code: "KSA",
    name: "Arábia Saudita",
    flag: "🇸🇦",
    confederation: "AFC",
    group: "H",
    stickers: stickersForGrupoH("KSA"),
  },
  {
    code: "URU",
    name: "Uruguai",
    flag: "🇺🇾",
    confederation: "CONMEBOL",
    group: "H",
    stickers: stickersForGrupoH("URU"),
  },

  // Group I
  {
    code: "FRA",
    name: "França",
    flag: "🇫🇷",
    confederation: "UEFA",
    group: "I",
    stickers: stickersForGrupoI("FRA"),
  },
  {
    code: "SEN",
    name: "Senegal",
    flag: "🇸🇳",
    confederation: "CAF",
    group: "I",
    stickers: stickersForGrupoI("SEN"),
  },
  {
    code: "IRQ",
    name: "Iraque",
    flag: "🇮🇶",
    confederation: "AFC",
    group: "I",
    stickers: stickersForGrupoI("IRQ"),
  },
  {
    code: "NOR",
    name: "Noruega",
    flag: "🇳🇴",
    confederation: "UEFA",
    group: "I",
    stickers: stickersForGrupoI("NOR"),
  },

  // Group J
  {
    code: "ARG",
    name: "Argentina",
    flag: "🇦🇷",
    confederation: "CONMEBOL",
    group: "J",
    stickers: stickersForGrupoJ("ARG"),
  },
  {
    code: "ALG",
    name: "Argélia",
    flag: "🇩🇿",
    confederation: "CAF",
    group: "J",
    stickers: stickersForGrupoJ("ALG"),
  },
  {
    code: "AUT",
    name: "Áustria",
    flag: "🇦🇹",
    confederation: "UEFA",
    group: "J",
    stickers: stickersForGrupoJ("AUT"),
  },
  {
    code: "JOR",
    name: "Jordânia",
    flag: "🇯🇴",
    confederation: "AFC",
    group: "J",
    stickers: stickersForGrupoJ("JOR"),
  },

  // Group K
  {
    code: "POR",
    name: "Portugal",
    flag: "🇵🇹",
    confederation: "UEFA",
    group: "K",
    stickers: stickersForGrupoK("POR"),
  },
  {
    code: "COD",
    name: "RD do Congo",
    flag: "🇨🇩",
    confederation: "CAF",
    group: "K",
    stickers: stickersForGrupoK("COD"),
  },
  {
    code: "UZB",
    name: "Uzbequistão",
    flag: "🇺🇿",
    confederation: "AFC",
    group: "K",
    stickers: stickersForGrupoK("UZB"),
  },
  {
    code: "COL",
    name: "Colômbia",
    flag: "🇨🇴",
    confederation: "CONMEBOL",
    group: "K",
    stickers: stickersForGrupoK("COL"),
  },

  // Group L
  {
    code: "ENG",
    name: "Inglaterra",
    flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    confederation: "UEFA",
    group: "L",
    stickers: stickersForGrupoL("ENG"),
  },
  {
    code: "CRO",
    name: "Croácia",
    flag: "🇭🇷",
    confederation: "UEFA",
    group: "L",
    stickers: stickersForGrupoL("CRO"),
  },
  {
    code: "GHA",
    name: "Gana",
    flag: "🇬🇭",
    confederation: "CAF",
    group: "L",
    stickers: stickersForGrupoL("GHA"),
  },
  {
    code: "PAN",
    name: "Panamá",
    flag: "🇵🇦",
    confederation: "CONCACAF",
    group: "L",
    stickers: stickersForGrupoL("PAN"),
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
