import { useRef, useState, useEffect } from 'react'
import PlayPauseButton from '../shared/PlayPauseButton'

// ponytail: parse "15 de Diciembre, 2026" → valid Date
const parseDate = (str) => {
  const months = { enero:'01', febrero:'02', marzo:'03', abril:'04', mayo:'05', junio:'06', julio:'07', agosto:'08', septiembre:'09', octubre:'10', noviembre:'11', diciembre:'12' }
  const m = str.toLowerCase().match(/(\d+)\s+de\s+(\w+)\s*,?\s*(\d{4})/)
  return m ? new Date(`${m[3]}-${months[m[2]]}-${m[1]}`) : null
}

export default function Hero({ nombre, apellido, fotoPrincipal, titulo, fecha, cancion, playing, onToggleSong, hasSong }) {
  const [daysLeft, setDaysLeft] = useState(null)
  const timerRef = useRef(null)

  // Song fields renamed on destructure — `titulo` above already means evento.titulo.
  // Playback state/toggle now lives in App.jsx; this component is presentational.
  const { titulo: cancionTitulo } = cancion || {}

  // ponytail: vanilla countdown — cheap, zero deps
  useEffect(() => {
    const target = parseDate(fecha)
    if (!target) return
    const tick = () => {
      const now = new Date()
      const diff = target.getTime() - now.getTime()
      if (diff <= 0) {
        setDaysLeft(0)
        if (timerRef.current) clearInterval(timerRef.current)
        return
      }
      setDaysLeft(Math.ceil(diff / (1000 * 60 * 60 * 24)))
    }
    tick()
    timerRef.current = setInterval(tick, 60000)
    return () => clearInterval(timerRef.current)
  }, [fecha])

  return (
    <section
      id="inicio"
      className="min-h-screen flex flex-col items-center justify-center section-padding pt-24 text-center"
    >
      {/* Photo + song toggle */}
      <div className="mb-8 relative">
        <button
          id="hero-avatar"
          type="button"
          onClick={onToggleSong}
          aria-label={hasSong ? (playing ? `Pausar canción${cancionTitulo ? `: ${cancionTitulo}` : ''}` : `Reproducir canción${cancionTitulo ? `: ${cancionTitulo}` : ''}`) : undefined}
          className={`relative w-40 h-40 sm:w-48 sm:h-48 rounded-full ring-4 ring-cta/40 shadow-lg ${hasSong ? 'cursor-pointer' : 'cursor-default'}`}
        >
          <span className="absolute inset-0 rounded-full overflow-hidden">
            {fotoPrincipal ? (
              <img
                src={fotoPrincipal}
                alt={`${nombre} ${apellido}`}
                className="w-full h-full object-cover"
              />
            ) : (
              /* CSS fallback when no photo — solid bg-white + full-opacity text-cta,
                 the previous bg-cta/10 + text-cta/40 combo was two washed-out tints of the
                 same hue and was nearly invisible */
              <span className="w-full h-full flex items-center justify-center bg-white">
                <span className="font-script text-6xl text-cta">{nombre.charAt(0)}</span>
              </span>
            )}
          </span>
          {hasSong && (
            <PlayPauseButton
              id="hero-play-badge"
              playing={playing}
              interactive={false}
              size="badge"
              className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2"
            />
          )}
        </button>
      </div>

      {/* ponytail: subtitle sourced from evento.titulo */}
      <p className="font-script text-3xl sm:text-4xl text-cta mb-2">
        {titulo}
      </p>

      {/* Name */}
      <h1 className="font-script text-5xl sm:text-6xl lg:text-7xl text-text mb-3">
        {nombre}
      </h1>
      <p className="font-serif text-2xl sm:text-3xl text-cta mb-6">{apellido}</p>

      {/* Date */}
      <p className="font-serif text-xl text-text-muted mb-4">{fecha}</p>

      {/* Countdown */}
      {daysLeft !== null && (
        <div>
          {daysLeft > 0 ? (
            <p className="text-sm text-text-muted tracking-wide">
              Faltan{' '}
              <span className="text-cta font-bold text-lg">{daysLeft}</span>{' '}
              {daysLeft === 1 ? 'día' : 'días'}
            </p>
          ) : (
            <p className="text-cta font-script text-2xl">¡El día ha llegado!</p>
          )}
        </div>
      )}
    </section>
  )
}
