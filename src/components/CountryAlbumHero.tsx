import { useCallback } from 'react'
import { Check } from 'lucide-react'
import { getStickerCode, type StickerDef } from '@/data/album'
import { useCollection, useStickerStatus } from '@/store/useCollection'

interface Props {
  countryCode: string
  emblem?: StickerDef
  teamPhoto?: StickerDef
}

export function CountryAlbumHero({ countryCode, emblem, teamPhoto }: Props) {
  if (!emblem && !teamPhoto) return null

  return (
    <div className="album-feature">
      {emblem && (
        <FeatureSlot
          countryCode={countryCode}
          sticker={emblem}
          variant="emblem"
        />
      )}
      {teamPhoto && (
        <FeatureSlot
          countryCode={countryCode}
          sticker={teamPhoto}
          variant="team"
        />
      )}
    </div>
  )
}

function FeatureSlot({
  countryCode,
  sticker,
  variant,
}: {
  countryCode: string
  sticker: StickerDef
  variant: 'emblem' | 'team'
}) {
  const code = getStickerCode(countryCode, sticker)
  const status = useStickerStatus(code)
  const { cycleStatus, confirmBeforeSelect, dupCounts } = useCollection()
  const count = dupCounts[code] ?? 2

  const handleClick = useCallback(() => {
    if (confirmBeforeSelect) {
      const nextLabel =
        status === 'missing'
          ? 'coletada'
          : status === 'owned'
            ? 'repetida'
            : 'faltando'
      if (!window.confirm(`Marcar ${code} como ${nextLabel}?`)) return
    }
    cycleStatus(code)
  }, [code, confirmBeforeSelect, cycleStatus, status])

  const isMissing = status === 'missing'
  const statusClass =
    status === 'owned'
      ? 'border-owned/40'
      : status === 'duplicate'
        ? 'border-duplicate/45'
        : 'border-dashed border-white/15'

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`album-feature-slot chip-press ${statusClass} ${
        variant === 'emblem' ? 'album-feature-slot--emblem' : 'album-feature-slot--team'
      } ${sticker.isFoil ? 'ring-1 ring-gold/30' : ''}`}
    >
      {sticker.image ? (
        variant === 'team' ? (
          <img
            src={sticker.image}
            alt={sticker.label}
            draggable={false}
            className={`album-feature-team-img ${isMissing ? 'opacity-45 saturate-50' : ''}`}
          />
        ) : (
          <span
            aria-hidden="true"
            className={`album-feature-art ${isMissing ? 'opacity-45 saturate-50' : ''}`}
            style={{ backgroundImage: `url(${JSON.stringify(sticker.image)})` }}
          />
        )
      ) : (
        <span className="album-feature-placeholder">{sticker.label}</span>
      )}

      {isMissing && (
        <span className="pointer-events-none absolute inset-0 bg-black/35" />
      )}

      <span className="album-feature-code">{code}</span>

      {status === 'owned' && (
        <span className="album-feature-badge bg-owned text-white">
          <Check size={10} strokeWidth={3} />
        </span>
      )}
      {status === 'duplicate' && (
        <span className="album-feature-badge bg-duplicate text-white text-[9px] font-black">
          x{count}
        </span>
      )}
    </button>
  )
}
