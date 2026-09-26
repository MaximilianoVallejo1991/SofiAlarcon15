import { Play, Pause } from 'lucide-react'

const SIZE_MAP = {
  badge: { wrapper: 'w-11 h-11 sm:w-12 sm:h-12', icon: 20 },
  dock: { wrapper: 'w-10 h-10', icon: 18 },
}

// Shared visual + interaction for the song toggle. Used both as a standalone
// button (Navbar docking control) and as an aria-hidden badge nested inside
// another already-interactive element (Hero avatar button), since a <button>
// cannot be nested inside another <button>.
export default function PlayPauseButton({
  playing,
  onToggle,
  label,
  size = 'badge',
  interactive = true,
  className = '',
  id,
}) {
  const { wrapper, icon } = SIZE_MAP[size] ?? SIZE_MAP.badge
  const iconEl = playing ? <Pause size={icon} /> : <Play size={icon} />
  const baseClassName = `rounded-full bg-cta text-white flex items-center justify-center shadow-md ring-2 ring-white ${wrapper} ${className}`

  if (!interactive) {
    return (
      <span id={id} className={baseClassName} aria-hidden="true">
        {iconEl}
      </span>
    )
  }

  const suffix = label ? `: ${label}` : ''
  const ariaLabel = playing ? `Pausar canción${suffix}` : `Reproducir canción${suffix}`

  return (
    <button
      id={id}
      type="button"
      onClick={onToggle}
      aria-label={ariaLabel}
      className={`${baseClassName} cursor-pointer`}
    >
      {iconEl}
    </button>
  )
}
