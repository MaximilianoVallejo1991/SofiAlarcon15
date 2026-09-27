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
  // Pulses only while paused — an invitation to tap, not needed once the
  // user has already interacted and the song is audibly playing.
  //
  // No `relative` forced in here: the invite-pulse ring only needs SOME
  // positioned ancestor (relative/absolute/fixed all qualify), and the
  // Hero badge usage already passes `absolute` via `className` below —
  // adding `relative` here too put two conflicting position utilities on
  // the same element, and Tailwind's generated stylesheet order let
  // `relative` win over the caller's `absolute`, breaking the badge's
  // real bottom-right placement. Callers with no position class of their
  // own (the Navbar dock button) pass `relative` themselves instead.
  const inviteClass = playing ? '' : 'invite-pulse'
  const baseClassName = `rounded-full bg-cta text-white flex items-center justify-center shadow-md ring-2 ring-white ${wrapper} ${inviteClass} ${className}`

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
