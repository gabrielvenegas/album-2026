import { COUNTRIES, getStickerCode } from '@/data/album'

export const VALID_STICKER_CODES = new Set(
  COUNTRIES.flatMap(country =>
    country.stickers.map(sticker => getStickerCode(country.code, sticker)),
  ),
)

export const ALL_STICKER_CODES = COUNTRIES.flatMap(country =>
  country.stickers.map(sticker => getStickerCode(country.code, sticker)),
)

export const STICKER_INDEX_BY_CODE = new Map(
  ALL_STICKER_CODES.map((code, index) => [code, index] as const),
)

export interface TradeProfile {
  owned: Set<string>
  duplicateCounts: Map<string, number>
  source: 'share' | 'text' | 'ai'
}

export interface SwapAction {
  give: string
  receive: string
}

function getStickerOrder(code: string): number {
  return STICKER_INDEX_BY_CODE.get(code) ?? Number.MAX_SAFE_INTEGER
}

function uniqueSortedStickerCodes(codes: Iterable<string>): string[] {
  return [...new Set(codes)].sort((a, b) => getStickerOrder(a) - getStickerOrder(b))
}

export function normalizeCode(raw: string): string {
  const code = raw
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .replace(/[-#]/g, '')
    .trim()

  if (code === '00') return code

  const cc = code.match(/^CC\s*(\d{1,2})$/)
  if (cc) return `CC${Number(cc[1])}`

  const parts = code.match(/^([A-Z]{3})\s*(\d{1,2})$/)
  if (parts) return `${parts[1]} ${Number(parts[2])}`

  return code
}

export function parseDuplicateText(text: string): Map<string, number> {
  const counts = new Map<string, number>()
  const matches =
    text
      .toUpperCase()
      .match(
        /\b(?:00|CC\s*[-#]?\s*\d{1,2}|[A-Z]{3}\s*[-#]?\s*\d{1,2})(?:\((\d+)X\)|\s+X(\d+)|X(\d+))?/g,
      ) ?? []

  for (const raw of matches) {
    const codeMatch = raw.match(
      /\b(00|CC\s*[-#]?\s*\d{1,2}|[A-Z]{3}\s*[-#]?\s*\d{1,2})\b/,
    )
    if (!codeMatch) continue

    const code = normalizeCode(codeMatch[1])
    if (!VALID_STICKER_CODES.has(code)) continue

    const countMatch = raw.match(/\((\d+)X\)|\s+X(\d+)|X(\d+)/)
    const count = countMatch ? Number(countMatch[1] ?? countMatch[2] ?? countMatch[3]) : 1
    counts.set(code, (counts.get(code) ?? 0) + count)
  }

  return counts
}

export function countCodes(codes: string[]): Map<string, number> {
  const counts = new Map<string, number>()
  for (const code of codes) {
    const normalized = normalizeCode(code)
    if (!VALID_STICKER_CODES.has(normalized)) continue
    counts.set(normalized, (counts.get(normalized) ?? 0) + 1)
  }
  return counts
}

export function buildSwapPlan(giveCodes: string[], receiveCodes: string[]): SwapAction[] {
  const give = uniqueSortedStickerCodes(giveCodes)
  const receive = uniqueSortedStickerCodes(receiveCodes)
  const limit = Math.min(give.length, receive.length)
  const swaps: SwapAction[] = []

  for (let i = 0; i < limit; i += 1) {
    swaps.push({ give: give[i], receive: receive[i] })
  }

  return swaps
}

export function createTradeShareCode(
  statuses: Record<string, string>,
  duplicateCounts: Map<string, number>,
): string {
  const ownedBits = new Uint8Array(Math.ceil(ALL_STICKER_CODES.length / 8))
  for (const [code, status] of Object.entries(statuses)) {
    if (status !== 'owned' && status !== 'duplicate') continue
    const index = STICKER_INDEX_BY_CODE.get(code)
    if (index === undefined) continue
    ownedBits[Math.floor(index / 8)] |= 1 << (index % 8)
  }

  const duplicates = [...duplicateCounts.entries()]
    .map(([code, count]) => [STICKER_INDEX_BY_CODE.get(code), count] as const)
    .filter((item): item is [number, number] => item[0] !== undefined)
    .sort(([a], [b]) => a - b)

  const payload = JSON.stringify({
    v: 1,
    o: encodeBytesAsBase64Url(ownedBits),
    d: duplicates,
  })

  return `ALBUM26:${encodeBase64Url(payload)}`
}

export function parseSharedTradeProfile(text: string): TradeProfile | null {
  const match = text.match(/ALBUM26:([A-Za-z0-9_-]+)/)
  if (!match) return null

  try {
    const payload = JSON.parse(decodeBase64Url(match[1])) as {
      v?: number
      o?: unknown
      d?: unknown
    }
    if (payload.v !== 1) return null

    const owned = new Set<string>()
    if (typeof payload.o === 'string') {
      const ownedBits = decodeBase64UrlAsBytes(payload.o)
      for (let index = 0; index < ALL_STICKER_CODES.length; index += 1) {
        const byte = ownedBits[Math.floor(index / 8)]
        if (byte & (1 << (index % 8))) owned.add(ALL_STICKER_CODES[index])
      }
    }

    const duplicateCounts = new Map<string, number>()
    if (Array.isArray(payload.d)) {
      for (const item of payload.d) {
        if (!Array.isArray(item)) continue
        const [rawIndex, rawCount] = item
        const index = Number(rawIndex)
        const count = Number(rawCount)
        const code = ALL_STICKER_CODES[index]
        if (!code || !Number.isFinite(count)) continue
        duplicateCounts.set(code, Math.max(1, Math.floor(count)))
        owned.add(code)
      }
    }

    return { owned, duplicateCounts, source: 'share' }
  } catch {
    return null
  }
}

export function createTradeApplicationCode(swaps: SwapAction[]): string {
  const payload = JSON.stringify({
    v: 2,
    s: swaps.map(swap => [swap.receive, swap.give]),
  })
  return `ALBUM26-TROCA:${encodeBase64Url(payload)}`
}

export function parseTradeApplicationCode(text: string): SwapAction[] | null {
  const match = text.match(/ALBUM26-TROCA:([A-Za-z0-9_-]+)/)
  if (!match) return null

  try {
    const payload = JSON.parse(decodeBase64Url(match[1])) as {
      v?: number
      s?: unknown
    }
    if (!Array.isArray(payload.s)) return null

    const swaps: SwapAction[] = []
    if (payload.v === 2) {
      for (const item of payload.s) {
        if (!Array.isArray(item)) continue
        const [rawGive, rawReceive] = item
        if (typeof rawGive !== 'string' || typeof rawReceive !== 'string') continue
        const give = normalizeCode(rawGive)
        const receive = normalizeCode(rawReceive)
        if (!VALID_STICKER_CODES.has(give) || !VALID_STICKER_CODES.has(receive)) continue
        swaps.push({ give, receive })
      }
    } else if (payload.v === 1) {
      for (const item of payload.s) {
        if (!Array.isArray(item)) continue
        const [rawGiveIndex, rawReceiveIndex] = item
        const give = ALL_STICKER_CODES[Number(rawGiveIndex)]
        const receive = ALL_STICKER_CODES[Number(rawReceiveIndex)]
        if (!give || !receive) continue
        swaps.push({ give, receive })
      }
    }

    return swaps.length ? swaps : null
  } catch {
    return null
  }
}

export function formatSwapSuggestionForFriend(swaps: SwapAction[]): string {
  const total = swaps.length
  const header = `Troca exata pronta: ${total} figurinha${total === 1 ? '' : 's'} para o seu álbum`
  const lines = swaps.map(s => `No seu álbum: sai ${s.receive} e entra ${s.give}`)
  return [
    header,
    '',
    ...lines,
    '',
    'Cole este código no seu app para aplicar exatamente essas trocas:',
    createTradeApplicationCode(swaps),
  ].join('\n')
}

function encodeBase64Url(value: string): string {
  return encodeBytesAsBase64Url(new TextEncoder().encode(value))
}

function encodeBytesAsBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

function decodeBase64Url(value: string): string {
  return new TextDecoder().decode(decodeBase64UrlAsBytes(value))
}

function decodeBase64UrlAsBytes(value: string): Uint8Array {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=')
  const binary = atob(padded)
  return Uint8Array.from(binary, char => char.charCodeAt(0))
}
