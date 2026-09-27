import { useEffect, useRef, useState } from 'react'
import { Menu, X } from 'lucide-react'
import PlayPauseButton from '../shared/PlayPauseButton'

// FFT size for the live waveform trace. This drives getByteTimeDomainData's
// sample count directly (not frequencyBinCount, which is fftSize/2 and only
// applies to frequency-domain data) -- 1024 samples across the navbar's
// width reads as a smooth continuous line rather than a jagged polyline.
const WAVE_FFT_SIZE = 1024
// Visual amplification of the raw waveform -- most music sits well under
// full-scale amplitude, so the untouched signal barely deviates from the
// centerline. This is purely a display gain, it doesn't touch the audio.
const WAVE_GAIN = 1.4
// How much each frame's rendered value moves toward the newly-read raw
// sample (0-1). Lower = smoother/calmer motion, trailing behind the actual
// signal slightly; higher = snappier, closer to the raw (jumpier) waveform.
// smoothingTimeConstant on the AnalyserNode does NOT apply to time-domain
// data (confirmed against MDN -- it only smooths getByteFrequencyData), so
// this has to be done by hand, frame over frame, here.
const WAVE_SMOOTHING = 0.2

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

export default function Navbar({ sections, playing, onToggleSong, hasSong, analyserRef }) {
  const [open, setOpen] = useState(false)
  const [docked, setDocked] = useState(false)
  // Real on-screen horizontal center of the Hero avatar, in viewport px.
  // Null until measured — the docked button stays unrendered until then, so
  // it can never flash at a wrong (assumed-centered) position.
  const [dockCenterX, setDockCenterX] = useState(null)

  // Canvas the live frequency-bar visualizer draws into.
  const canvasRef = useRef(null)
  // requestAnimationFrame handle for the live draw loop, so it can be
  // cancelled the moment playback stops or the component unmounts instead
  // of running forever in the background.
  const rafRef = useRef(null)

  // ponytail: close mobile menu on link click
  const handleClick = () => setOpen(false)

  // Docks a mini play/pause button once the Hero avatar has scrolled up past
  // the navbar's bottom edge (64px = h-16), and undocks it again on scroll
  // back up. rootMargin shrinks the intersection viewport by the navbar's
  // own height so "isIntersecting: false" means the avatar is now behind it.
  // The intersection trigger watches the big avatar circle (#hero-avatar) --
  // that's the right reference for WHEN to dock/undock.
  //
  // Positioning note: WHERE to dock is a different question, and measuring
  // #hero-avatar for that was the actual bug -- the visible play/pause badge
  // sits at the avatar circle's bottom-right corner (absolute bottom-1
  // right-1), not at the circle's center, so the docked button landed
  // visibly left of where the badge really was on screen. Measure
  // #hero-play-badge (the badge itself) instead, so the X coordinate matches
  // exactly what the user actually sees before it docks.
  useEffect(() => {
    if (!hasSong) {
      setDocked(false)
      return
    }

    const avatar = document.getElementById('hero-avatar')
    const badge = document.getElementById('hero-play-badge')
    if (!avatar || !badge) return

    const measure = () => {
      const rect = badge.getBoundingClientRect()
      setDockCenterX(rect.left + rect.width / 2)
    }
    measure()

    let resizeTimer
    const handleResize = () => {
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(measure, 150)
    }
    window.addEventListener('resize', handleResize)

    let observer
    if (typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(
        ([entry]) => setDocked(!entry.isIntersecting),
        { rootMargin: '-64px 0px 0px 0px', threshold: 0 }
      )
      observer.observe(avatar)
    }

    return () => {
      window.removeEventListener('resize', handleResize)
      clearTimeout(resizeTimer)
      observer?.disconnect()
    }
  }, [hasSong])

  // Sizes the canvas's internal pixel buffer to match its on-screen CSS
  // size (scaled by devicePixelRatio for crisp bars on hi-dpi screens), and
  // re-runs on resize so bars never stretch or blur.
  useEffect(() => {
    if (!hasSong) return
    const canvas = canvasRef.current
    if (!canvas) return

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      canvas.width = canvas.clientWidth * dpr
      canvas.height = canvas.clientHeight * dpr
    }
    resize()

    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [hasSong])

  // Live, music-reactive visualizer. Reads the real-time waveform (time
  // domain, not frequency) from the shared AnalyserNode (created once in
  // App.jsx on first play, wired as source -> analyser -> destination) and
  // draws it as a single continuous line that moves above and below the
  // navbar's centerline with the actual audio signal, redrawn every frame
  // via requestAnimationFrame. Nothing here is precomputed -- every frame
  // reflects the audio's live state.
  //
  // Time-domain data (getByteTimeDomainData) is used instead of frequency
  // data on purpose: frequency-bin values are magnitudes (always >= 0), so
  // they can only ever grow bars upward from a baseline. Time-domain values
  // oscillate around 128 (silence), which is what actually produces a wave
  // that moves both above and below a centerline.
  //
  // The loop only ever runs while a song is actually playing -- it starts
  // when `playing` becomes true and is cancelled via cancelAnimationFrame
  // the moment it becomes false or the component unmounts, so no CPU/
  // battery is spent animating a canvas nobody can perceive changing.
  //
  // Reduced-motion note: this produces continuous motion tied to music
  // transients (up to 60 redraws/second) -- exactly the class of motion
  // reduced-motion guidance is concerned about. It is also purely
  // decorative: play/pause state is already conveyed non-animatedly by the
  // Hero button and the docked mini play/pause button, so suppressing it
  // loses no information. For that reason, `prefers-reduced-motion: reduce`
  // suppresses the live draw loop entirely (falls through to the static
  // idle baseline below) even while the song is playing.
  useEffect(() => {
    const canvas = canvasRef.current
    const analyser = analyserRef?.current
    if (!playing || !analyser || !canvas || prefersReducedMotion()) return

    analyser.fftSize = WAVE_FFT_SIZE
    const ctx = canvas.getContext('2d')
    const bufferLength = analyser.fftSize
    const dataArray = new Uint8Array(bufferLength)
    // Holds each point's smoothed y-offset (-1..1) across frames, so the
    // line eases toward new samples instead of jumping straight to them --
    // this is the actual "less violent" fix, not just a lower gain.
    const smoothed = new Float32Array(bufferLength)
    const rootStyle = getComputedStyle(document.documentElement)
    const waveColor = rootStyle.getPropertyValue('--color-rose').trim() || '#9B3B4B'

    const draw = () => {
      analyser.getByteTimeDomainData(dataArray)
      const { width, height } = canvas
      const midY = height / 2
      const sliceWidth = width / (bufferLength - 1)

      for (let i = 0; i < bufferLength; i++) {
        const raw = (dataArray[i] - 128) / 128 // -1..1, 0 = silence
        smoothed[i] += (raw - smoothed[i]) * WAVE_SMOOTHING
      }

      ctx.clearRect(0, 0, width, height)
      ctx.strokeStyle = waveColor
      ctx.lineWidth = 2
      ctx.lineJoin = 'round'
      ctx.beginPath()

      // Quadratic-through-midpoints smoothing: draws a curve through the
      // midpoint of each pair of samples instead of straight segments
      // between the raw points, rounding off what would otherwise be sharp
      // corners at every sample.
      let x = 0
      let prevX = 0
      let prevY = midY + smoothed[0] * midY * WAVE_GAIN
      ctx.moveTo(prevX, prevY)
      for (let i = 1; i < bufferLength; i++) {
        x = i * sliceWidth
        const y = midY + smoothed[i] * midY * WAVE_GAIN
        const midX = (prevX + x) / 2
        const midYPoint = (prevY + y) / 2
        ctx.quadraticCurveTo(prevX, prevY, midX, midYPoint)
        prevX = x
        prevY = y
      }
      ctx.lineTo(prevX, prevY)

      ctx.stroke()
      rafRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [playing, analyserRef])

  // Idle state: whenever there's no active draw loop (paused, no song, or
  // reduced-motion suppressing the live animation), paint a single flat,
  // low baseline once instead of leaving the canvas blank or frozen
  // mid-bar from the last playing frame -- the same "quiet but present"
  // idle affordance this project uses elsewhere for audio-adjacent UI
  // (e.g. GuestPhotos renders nothing rather than a broken empty widget;
  // this visualizer's equivalent inert state is a flat line, not a blank
  // canvas or a frozen mid-animation frame).
  useEffect(() => {
    if (playing && !prefersReducedMotion()) return
    const canvas = canvasRef.current
    if (!canvas || !hasSong) return

    const ctx = canvas.getContext('2d')
    const rootStyle = getComputedStyle(document.documentElement)
    const idleColor = rootStyle.getPropertyValue('--color-ink-muted').trim() || '#415A66'
    const { width, height } = canvas
    ctx.clearRect(0, 0, width, height)
    ctx.fillStyle = `${idleColor}4D`
    // Centered on the same midline the active wave oscillates around, so
    // starting/stopping playback doesn't jump the line's vertical position.
    const lineHeight = Math.max(2, height * 0.08)
    ctx.fillRect(0, height / 2 - lineHeight / 2, width, lineHeight)
  }, [playing, hasSong])

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-cta/10">
      {/* Live, music-reactive frequency visualizer, rendered behind the
          nav's own content (negative z-index) so brand text/links stay
          legible on top of it. A <canvas> is used instead of per-bar DOM
          nodes because this redraws up to 60 times per second while a song
          plays -- restyling dozens of individual elements every animation
          frame would be far too expensive for that rate. Only mounted when
          there's a song at all — consistent with the docked-button guard
          just below and the project's established graceful-empty-state
          discipline elsewhere. */}
      {hasSong && (
        <canvas
          ref={canvasRef}
          className="absolute inset-x-0 bottom-0 h-[24px] w-full overflow-hidden pointer-events-none -z-10"
          aria-hidden="true"
        />
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative flex items-center justify-between h-16">
          {/* ponytail: brand text, could be logo later */}
          <span className="font-script text-2xl text-cta cursor-default">
            15
          </span>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {sections.map((s) => (
              <a
                key={s.href}
                href={s.href}
                className="px-3 py-2 text-sm text-text-muted hover:text-cta rounded-md transition-colors duration-200 cursor-pointer"
              >
                {s.label}
              </a>
            ))}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden p-2 rounded-md text-text-muted hover:text-cta transition-colors duration-200 cursor-pointer focus-visible:ring-3 focus-visible:ring-cta"
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile dropdown */}
        {open && (
          <div className="md:hidden pb-4 flex flex-col gap-1 border-t border-cta/10 pt-2">
            {sections.map((s) => (
              <a
                key={s.href}
                href={s.href}
                onClick={handleClick}
                className="px-3 py-2 text-sm text-text-muted hover:text-cta rounded-md transition-colors duration-200 cursor-pointer"
              >
                {s.label}
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Docked mini play/pause button. Rendered AFTER the max-w-6xl content
          wrapper on purpose -- it was previously placed before it, and with
          neither element setting an explicit z-index, the later sibling
          (the content wrapper's full-width flex row) painted on top and
          silently ate every click meant for this button, even though it
          was visually behind nothing. Later DOM position now wins the
          stacking order without needing an explicit z-index at all.
          `position: fixed` (viewport-relative, NOT relative to the navbar's
          own padded/max-widthed container) at the Hero avatar's REAL
          measured X coordinate, and at y=64px — the navbar's bottom
          border-b line (h-16). `translate(-50%, -50%)` centers the button
          exactly ON that point, straddling the dividing line half above/
          half below, at the same X the badge occupies in Hero — so there
          is zero lateral jump on dock. Scale is folded into the same inline
          `transform` (not a Tailwind scale-* class) because an inline
          `style.transform` would otherwise override any class-based
          transform entirely. */}
      {hasSong && dockCenterX !== null && (
        <div
          className={`fixed transition-all duration-300 ${
            docked ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
          style={{
            left: `${dockCenterX}px`,
            top: '64px',
            transform: `translate(-50%, -50%) scale(${docked ? 1 : 0.75})`,
          }}
        >
          <PlayPauseButton playing={playing} onToggle={onToggleSong} size="dock" className="relative" />
        </div>
      )}
    </nav>
  )
}
