import { useNavigate } from 'react-router-dom'
import { Country, getStickerCode } from '@/data/album'
import { useCountryStats } from '@/store/useCollection'
import { ProgressRing } from './ProgressRing'

interface Props {
  country: Country
}

export function CountryCard({ country }: Props) {
  const navigate = useNavigate()
  const codes = country.stickers.map(s => getStickerCode(country.code, s))
  const { owned, duplicates, missing } = useCountryStats(codes)
  const total = country.stickers.length
  const pct = Math.round((owned / total) * 100)

  return (
    <button
      onClick={() => navigate(`/paises/${country.code}`)}
      className="chip-press flex flex-col items-center gap-2 bg-surface border border-border rounded-2xl p-3 text-left w-full"
    >
      <div className="relative">
        <ProgressRing percent={pct} size={52} stroke={3} />
        <span className="absolute inset-0 flex items-center justify-center text-xl" style={{ marginTop: 2 }}>
          {country.flag}
        </span>
      </div>
      <div className="w-full text-center">
        <p className="text-[11px] font-semibold text-text leading-tight truncate">{country.name}</p>
        <p className="text-[9px] text-muted mt-0.5">{country.group === 'Extras' ? 'Extras' : `Gr. ${country.group}`} · {pct}%</p>
      </div>
      {(missing > 0 || duplicates > 0) && (
        <div className="flex gap-1.5 flex-wrap justify-center">
          {missing > 0 && (
            <span className="text-[9px] bg-missing/20 text-muted px-1.5 py-0.5 rounded-full">
              -{missing}
            </span>
          )}
          {duplicates > 0 && (
            <span className="text-[9px] bg-duplicate/15 text-duplicate px-1.5 py-0.5 rounded-full">
              x{duplicates}
            </span>
          )}
        </div>
      )}
    </button>
  )
}
