import { useRef, useState } from 'react'
import invitacion from './data/invitacion.json'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import Hero from './components/sections/Hero'
import Reception from './components/sections/Reception'
import Gallery from './components/sections/Gallery'
import Gift from './components/sections/Gift'
import Rsvp from './components/sections/Rsvp'
import GuestPhotos from './components/sections/GuestPhotos'

export default function App() {
  const { quinceanera, evento, fiesta, codigoVestimenta, regalo, cancion, fotosInvitados, rsvp, familia, navegacion, footer } = invitacion

  const audioRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const hasSong = Boolean(cancion?.url)

  // Web Audio graph for the navbar's live frequency visualizer. Created
  // lazily (on first play, inside a user-gesture handler) rather than on
  // mount, because browsers block AudioContext output until a user gesture
  // has occurred. `sourceNodeRef` doubles as the "already created" guard:
  // `createMediaElementSource` may be called AT MOST ONCE for the entire
  // lifetime of a given <audio> element -- a second call on the same
  // element throws -- so `ensureAudioGraph` must never run its creation
  // branch twice, even across React re-renders or StrictMode's dev-mode
  // double-invoke.
  const audioContextRef = useRef(null)
  const analyserRef = useRef(null)
  const sourceNodeRef = useRef(null)

  const ensureAudioGraph = () => {
    if (sourceNodeRef.current || !audioRef.current) return

    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    if (!AudioContextClass) return

    const context = new AudioContextClass()
    const analyser = context.createAnalyser()
    // Small FFT on purpose: this feeds a thin strip of ~16 bars, not a dense
    // spectrum display, so a large fftSize would just be wasted resolution.
    analyser.fftSize = 64

    const source = context.createMediaElementSource(audioRef.current)
    // CRITICAL: the source must be routed all the way to `destination` (via
    // the analyser, which passes audio through unmodified) or the song goes
    // silent -- createMediaElementSource re-routes the element's output into
    // the Web Audio graph, and nothing plays through the speakers again
    // unless something in that graph is explicitly connected onward to
    // `context.destination`.
    source.connect(analyser)
    analyser.connect(context.destination)

    audioContextRef.current = context
    analyserRef.current = analyser
    sourceNodeRef.current = source
  }

  // Single persistent audio instance, owned here instead of inside Hero, so
  // playback survives regardless of which UI (Hero's big button or the
  // Navbar's docked mini-player) is currently visible.
  const toggleSong = () => {
    if (!hasSong || !audioRef.current) return
    const audio = audioRef.current
    if (audio.paused) {
      ensureAudioGraph()
      // Resuming must happen inside this same user-gesture-triggered
      // handler -- browsers suspend a freshly created AudioContext until a
      // gesture explicitly resumes it.
      audioContextRef.current?.resume()
      audio.play().catch(() => setPlaying(false))
    } else {
      audio.pause()
    }
  }

  return (
    <>
      <Navbar
        sections={navegacion}
        playing={playing}
        onToggleSong={toggleSong}
        hasSong={hasSong}
        analyserRef={analyserRef}
      />

      <main>
        <Hero
          nombre={quinceanera.nombre}
          apellido={quinceanera.apellido}
          fotoPrincipal={quinceanera.fotoPrincipal}
          titulo={evento.titulo}
          fecha={evento.fecha}
          cancion={cancion}
          playing={playing}
          onToggleSong={toggleSong}
          hasSong={hasSong}
        />

        <Reception
          lugar={fiesta.lugar}
          direccion={fiesta.direccion}
          hora={fiesta.hora}
          mapaEmbedUrl={fiesta.mapaEmbedUrl}
          codigoVestimenta={codigoVestimenta}
        />

        <Gallery imagenes={quinceanera.galeria} />

        <Gift introTexto={regalo.introTexto} transferencia={regalo.transferencia} />

        <Rsvp telefono={rsvp.telefono} mensaje={rsvp.mensaje} />

        <GuestPhotos mensaje={fotosInvitados.mensaje} />
      </main>

      <Footer padres={familia.padres} copyright={footer.copyright} />

      {hasSong && (
        <audio
          ref={audioRef}
          src={cancion.url}
          crossOrigin="anonymous"
          preload="none"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
        />
      )}
    </>
  )
}
