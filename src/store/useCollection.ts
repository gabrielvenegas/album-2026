import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type StickerStatus = 'missing' | 'owned' | 'duplicate'
export type StickerVariant = 'purple' | 'bronze' | 'silver' | 'gold'

interface CollectionState {
  statuses: Record<string, StickerStatus>
  dupCounts: Record<string, number>
  variantStatuses: Record<string, Partial<Record<StickerVariant, boolean>>>
  apiKey: string

  setStatus: (code: string, status: StickerStatus) => void
  cycleStatus: (code: string) => void
  incrementDup: (code: string) => void
  decrementDup: (code: string) => void
  setDuplicateCopies: (code: string, copies: number) => void
  toggleVariant: (code: string, variant: StickerVariant) => void
  markMultiple: (codes: string[], status: StickerStatus) => void
  setApiKey: (key: string) => void
  resetCountry: (countryCode: string, stickerCodes: string[]) => void
  resetAll: () => void
  exportData: () => string
  importData: (json: string) => void
}

export const useCollection = create<CollectionState>()(
  persist(
    (set, get) => ({
      statuses: {},
      dupCounts: {},
      variantStatuses: {},
      apiKey: '',

      setStatus(code, status) {
        set(s => {
          const statuses = { ...s.statuses, [code]: status }
          const dupCounts = { ...s.dupCounts }
          if (status !== 'duplicate') delete dupCounts[code]
          else if (!dupCounts[code]) dupCounts[code] = 2
          return { statuses, dupCounts }
        })
      },

      cycleStatus(code) {
        const current = get().statuses[code] ?? 'missing'
        const next: StickerStatus =
          current === 'missing' ? 'owned' : current === 'owned' ? 'duplicate' : 'missing'
        get().setStatus(code, next)
      },

      incrementDup(code) {
        set(s => ({
          dupCounts: { ...s.dupCounts, [code]: (s.dupCounts[code] ?? 2) + 1 },
        }))
      },

      setDuplicateCopies(code, copies) {
        const normalized = Math.max(0, Math.floor(copies))
        if (normalized === 0) {
          get().setStatus(code, 'owned')
          return
        }
        set(s => ({
          statuses: { ...s.statuses, [code]: 'duplicate' },
          dupCounts: { ...s.dupCounts, [code]: normalized + 1 },
        }))
      },

      toggleVariant(code, variant) {
        set(s => {
          const current = s.variantStatuses[code] ?? {}
          const next = { ...current, [variant]: !current[variant] }
          if (!next[variant]) delete next[variant]
          const variantStatuses = { ...s.variantStatuses }
          if (Object.keys(next).length) variantStatuses[code] = next
          else delete variantStatuses[code]
          return { variantStatuses }
        })
      },

      decrementDup(code) {
        const count = get().dupCounts[code] ?? 2
        if (count <= 2) {
          get().setStatus(code, 'owned')
        } else {
          set(s => ({ dupCounts: { ...s.dupCounts, [code]: count - 1 } }))
        }
      },

      markMultiple(codes, status) {
        set(s => {
          const statuses = { ...s.statuses }
          const dupCounts = { ...s.dupCounts }
          for (const code of codes) {
            if (status === 'duplicate' && statuses[code] === 'duplicate') {
              dupCounts[code] = (dupCounts[code] ?? 2) + 1
            } else if (status === 'duplicate' && statuses[code] === 'owned') {
              statuses[code] = 'duplicate'
              if (!dupCounts[code]) dupCounts[code] = 2
            } else if (status === 'owned' && statuses[code] !== 'owned') {
              statuses[code] = 'owned'
              delete dupCounts[code]
            } else if (status === 'missing') {
              statuses[code] = 'missing'
              delete dupCounts[code]
            } else if (status === 'duplicate' && statuses[code] !== 'duplicate') {
              statuses[code] = 'duplicate'
              dupCounts[code] = 2
            } else {
              statuses[code] = status
            }
          }
          return { statuses, dupCounts }
        })
      },

      setApiKey(key) {
        set({ apiKey: key })
      },

      resetCountry(_, stickerCodes) {
        set(s => {
          const statuses = { ...s.statuses }
          const dupCounts = { ...s.dupCounts }
          const variantStatuses = { ...s.variantStatuses }
          for (const code of stickerCodes) {
            delete statuses[code]
            delete dupCounts[code]
            delete variantStatuses[code]
          }
          return { statuses, dupCounts, variantStatuses }
        })
      },

      resetAll() {
        set({ statuses: {}, dupCounts: {}, variantStatuses: {} })
      },

      exportData() {
        const { statuses, dupCounts, variantStatuses } = get()
        return JSON.stringify({ statuses, dupCounts, variantStatuses }, null, 2)
      },

      importData(json) {
        try {
          const data = JSON.parse(json) as {
            statuses: Record<string, StickerStatus>
            dupCounts: Record<string, number>
            variantStatuses?: Record<string, Partial<Record<StickerVariant, boolean>>>
          }
          set({
            statuses: data.statuses ?? {},
            dupCounts: data.dupCounts ?? {},
            variantStatuses: data.variantStatuses ?? {},
          })
        } catch {
          // ignore malformed
        }
      },
    }),
    { name: 'album-collection' }
  )
)

export function useStickerStatus(code: string): StickerStatus {
  return useCollection(s => s.statuses[code] ?? 'missing')
}

export function useStickerVariants(code: string): Partial<Record<StickerVariant, boolean>> {
  return useCollection(s => s.variantStatuses[code] ?? {})
}

export function useCountryStats(codes: string[]) {
  const statuses = useCollection(s => s.statuses)
  let owned = 0, duplicates = 0
  for (const code of codes) {
    const st = statuses[code] ?? 'missing'
    if (st === 'owned') owned++
    else if (st === 'duplicate') { owned++; duplicates++ }
  }
  return { owned, duplicates, missing: codes.length - owned }
}
