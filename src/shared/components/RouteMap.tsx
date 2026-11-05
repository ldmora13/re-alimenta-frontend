import { MapPin } from 'lucide-react'

export function RouteMap({
  originLabel = 'Origen',
  destinationLabel = 'Destino',
  caption = 'Ruta estimada · 18 min',
}: {
  originLabel?: string
  destinationLabel?: string
  caption?: string
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-line bg-[#ede9dc]">
      <svg viewBox="0 0 620 250" role="img" aria-label="Mapa esquemático de la ruta" className="block h-auto w-full">
        <rect width="620" height="250" fill="#EDE9DC" />
        <g stroke="#DDD6C5" strokeWidth="16" strokeLinecap="round">
          <path d="M-20 58H640M-20 152H640M96 -20V270M252 -20V270M408 -20V270M546 -20V270" />
        </g>
        <g stroke="#E7E1D2" strokeWidth="4">
          <path d="M-20 104H640M-20 204H640M174 -20V270M330 -20V270M476 -20V270" />
        </g>
        <path
          d="M126 186 C 196 150, 224 170, 286 118 S 418 86, 486 62"
          fill="none"
          stroke="#1E5B43"
          strokeWidth="4.5"
          strokeDasharray="1 9"
          strokeLinecap="round"
        />
        <circle cx="126" cy="186" r="10" fill="#1E5B43" stroke="#FFFCF5" strokeWidth="4" />
        <circle cx="486" cy="62" r="10" fill="#D99A2B" stroke="#FFFCF5" strokeWidth="4" />
        <g fontFamily="Inter,sans-serif" fontSize="10.5" fill="#3B443E">
          <rect x="72" y="204" width="110" height="24" rx="12" fill="#FFFCF5" stroke="#E0D8C8" />
          <text x="127" y="220" textAnchor="middle">
            {originLabel}
          </text>
          <rect x="424" y="24" width="124" height="24" rx="12" fill="#FFFCF5" stroke="#E0D8C8" />
          <text x="486" y="40" textAnchor="middle">
            {destinationLabel}
          </text>
        </g>
      </svg>
      <span className="absolute right-3 bottom-3 inline-flex items-center gap-1.5 rounded-full border border-line bg-surface/95 px-2.5 py-1 text-[10.5px] text-ink-2">
        <MapPin className="h-3 w-3 text-green" />
        {caption}
      </span>
    </div>
  )
}
