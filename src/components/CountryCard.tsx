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
  const isComplete = pct === 100

  return (
    <button
      onClick={() => navigate(`/paises/${country.code}`)}
      className="chip-press sticker-tile relative flex min-h-[138px] w-full flex-col items-center gap-2 overflow-hidden rounded-xl p-2.5 text-left"
    >
      <span className="absolute left-2 top-2 rounded-md bg-white/10 px-1.5 py-0.5 text-[9px] font-black text-text">
        {country.code}
      </span>
      <span className="absolute right-2 top-2 rounded-md bg-gold px-1.5 py-0.5 text-[9px] font-black text-[#071011]">
        {pct}%
      </span>

      <div className="relative mt-5">
        <ProgressRing
          percent={pct}
          size={58}
          stroke={4}
          color={isComplete ? '#00d675' : '#ffb238'}
          trackColor="rgba(23,33,29,0.14)"
        />
        <span className="absolute inset-0 flex items-center justify-center text-xl" style={{ marginTop: 2 }}>
          {country.flag}
        </span>
      </div>

      <div className="w-full text-center">
        <p className="text-[12px] font-black leading-tight text-text line-clamp-2">{country.name}</p>
        <p className="mt-0.5 text-[9px] font-bold uppercase tracking-wide text-muted">
          {country.group === 'Extras' ? 'Extras' : `Grupo ${country.group}`}
        </p>
      </div>

      {(missing > 0 || duplicates > 0) && (
        <div className="mt-auto flex flex-wrap justify-center gap-1.5">
          {missing > 0 && (
            <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[9px] font-black text-muted">
              -{missing}
            </span>
          )}
          {duplicates > 0 && (
            <span className="rounded-md bg-duplicate px-1.5 py-0.5 text-[9px] font-black text-white">
              x{duplicates}
            </span>
          )}
        </div>
      )}
    </button>
  )
}
