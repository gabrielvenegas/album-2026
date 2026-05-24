import { describe, expect, it } from 'vitest'
import {
  ALL_STICKER_CODES,
  buildSwapPlan,
  createTradeShareCode,
  formatSwapSuggestionForFriend,
  parseDuplicateText,
  parseSharedTradeProfile,
  parseTradeApplicationCode,
} from '@/lib/trade'

describe('trade helpers', () => {
  it('parses repeated sticker text with quantities and ignores invalid fragments', () => {
    const codeA = ALL_STICKER_CODES[0]
    const codeB = ALL_STICKER_CODES[1]
    const parsed = parseDuplicateText(`${codeA} x3, ${codeB}(2x), AAA 999, no match`)

    expect(parsed.get(codeA)).toBe(3)
    expect(parsed.get(codeB)).toBe(2)
    expect(parsed.has('AAA 999')).toBe(false)
  })

  it('round-trips the shared album code with owned stickers and duplicate counts', () => {
    const ownedA = ALL_STICKER_CODES[2]
    const ownedB = ALL_STICKER_CODES[3]
    const duplicateA = ALL_STICKER_CODES[4]
    const duplicateB = ALL_STICKER_CODES[5]

    const shareCode = createTradeShareCode(
      {
        [ownedA]: 'owned',
        [ownedB]: 'duplicate',
        [duplicateA]: 'duplicate',
        [duplicateB]: 'missing',
      },
      new Map([
        [ownedB, 1],
        [duplicateA, 2],
      ]),
    )

    const profile = parseSharedTradeProfile(shareCode)

    expect(profile).not.toBeNull()
    expect(profile?.source).toBe('share')
    expect(profile?.owned.has(ownedA)).toBe(true)
    expect(profile?.owned.has(ownedB)).toBe(true)
    expect(profile?.owned.has(duplicateA)).toBe(true)
    expect(profile?.duplicateCounts.get(ownedB)).toBe(1)
    expect(profile?.duplicateCounts.get(duplicateA)).toBe(2)
  })

  it('builds a deterministic swap plan from unordered duplicate lists', () => {
    const giveOne = ALL_STICKER_CODES[7]
    const giveTwo = ALL_STICKER_CODES[5]
    const receiveOne = ALL_STICKER_CODES[11]
    const receiveTwo = ALL_STICKER_CODES[9]

    const swaps = buildSwapPlan(
      [giveOne, giveTwo, giveTwo],
      [receiveOne, receiveTwo, receiveTwo],
    )

    expect(swaps).toEqual([
      { give: giveTwo, receive: receiveTwo },
      { give: giveOne, receive: receiveOne },
    ])
  })

  it('round-trips the exchange message so the same swaps can be applied elsewhere', () => {
    const swaps = [
      { give: ALL_STICKER_CODES[13], receive: ALL_STICKER_CODES[8] },
      { give: ALL_STICKER_CODES[6], receive: ALL_STICKER_CODES[12] },
    ]
    const recipientView = swaps.map(swap => ({
      give: swap.receive,
      receive: swap.give,
    }))

    const message = formatSwapSuggestionForFriend(swaps)
    const parsed = parseTradeApplicationCode(message)

    expect(message).toContain('ALBUM26-TROCA:')
    expect(parsed).toEqual(recipientView)
  })
})
