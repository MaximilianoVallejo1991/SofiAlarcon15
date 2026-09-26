import { useEffect, useRef, useState } from 'react'
import { Camera, ImageOff } from 'lucide-react'

// ponytail: this is a SECOND, dedicated Cloudinary account — separate from the main
// site's `dc3kybsmr` account (background image, gallery, song MP3). Isolating unsigned
// guest uploads here means a flood of guest photos can never eat into the main site's
// quota. The `invitados_15` preset (configured directly in the Cloudinary dashboard, not
// here) already enforces: folder `invitados`, image-only formats (video blocked),
// c_limit,w_1600,h_1600,q_auto incoming transform (caps storage per photo), AWS
// Rekognition auto-moderation, and force-tags every upload with `invitados-15`.
const CLOUD_NAME = 'y4dyry1a'
const UPLOAD_PRESET = 'invitados_15'
const TAG = 'invitados-15'
const WIDGET_SCRIPT_SRC = 'https://upload-widget.cloudinary.com/global/all.js'
const LIST_URL = `https://res.cloudinary.com/${CLOUD_NAME}/image/list/${TAG}.json`
const MAX_THUMBNAILS = 3

// ponytail: the public /image/list/<tag>.json endpoint does NOT return a secure_url
// field (unlike the Upload/Admin APIs) — only public_id/version/format/type. The
// delivery URL has to be built by hand from those pieces.
function toThumbnailUrl({ public_id: publicId, version, format }) {
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/w_400,h_400,c_fill,q_auto/v${version}/${publicId}.${format}`
}

export default function GuestPhotos({ mensaje }) {
  const [scriptReady, setScriptReady] = useState(false)
  const [photos, setPhotos] = useState([])
  const [photosStatus, setPhotosStatus] = useState('loading') // loading | ready | empty | error
  const widgetRef = useRef(null)

  // ponytail: widget script loaded dynamically, scoped to this component only — no
  // static <script> in index.html, so pages/sections that never render GuestPhotos
  // never pay for it.
  useEffect(() => {
    if (window.cloudinary) {
      setScriptReady(true)
      return
    }
    const script = document.createElement('script')
    script.src = WIDGET_SCRIPT_SRC
    script.async = true
    script.onload = () => setScriptReady(true)
    // ponytail: CDN blocked/offline guest — button just stays disabled, no crash on click
    script.onerror = () => setScriptReady(false)
    document.body.appendChild(script)
  }, [])

  useEffect(() => {
    fetchLatestPhotos()
  }, [])

  const fetchLatestPhotos = () => {
    setPhotosStatus('loading')
    fetch(LIST_URL)
      .then((res) => {
        // ponytail: a 404 here means "no resources yet" — the CURRENT real state for a
        // brand-new tag with zero uploads. Expected, not an error.
        if (!res.ok) {
          setPhotos([])
          setPhotosStatus('empty')
          return null
        }
        return res.json()
      })
      .then((data) => {
        if (!data) return
        const resources = Array.isArray(data.resources) ? data.resources : []
        if (resources.length === 0) {
          setPhotos([])
          setPhotosStatus('empty')
          return
        }
        const latest = [...resources]
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, MAX_THUMBNAILS)
        setPhotos(latest)
        setPhotosStatus('ready')
      })
      .catch(() => {
        // ponytail: network failure or unexpected response shape — degrade silently,
        // this hits a real external API at runtime, not a local asset
        setPhotos([])
        setPhotosStatus('error')
      })
  }

  const openWidget = () => {
    if (!window.cloudinary) return
    if (!widgetRef.current) {
      widgetRef.current = window.cloudinary.createUploadWidget(
        {
          cloudName: CLOUD_NAME,
          uploadPreset: UPLOAD_PRESET,
          sources: ['local', 'camera'],
          multiple: true,
          // ponytail: no widget-side `tags` here on purpose — the preset itself already
          // force-tags every upload with `invitados-15`. Passing tags in the widget
          // config too risks the widget's tag list replacing rather than merging with
          // the preset's own tag, so we trust the preset alone.
        },
        (error, result) => {
          if (!error && result && result.event === 'success') {
            fetchLatestPhotos()
          }
        }
      )
    }
    widgetRef.current.open()
  }

  return (
    <section id="fotos" className="section-padding max-w-2xl mx-auto text-center">
      <div className="divider-accent" />

      <h2 className="font-script text-4xl text-cta mb-4">Compartí tus fotos</h2>

      {mensaje && <p className="text-text-muted leading-relaxed mb-8">{mensaje}</p>}

      <div className="glass-card max-w-sm mx-auto flex flex-col items-center gap-6">
        <button
          type="button"
          onClick={openWidget}
          disabled={!scriptReady}
          className="btn-cta cursor-pointer w-full sm:w-auto justify-center disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Camera size={24} />
          Subí tus fotos
        </button>

        {photosStatus === 'ready' && photos.length > 0 && (
          <div className="grid grid-cols-3 gap-2 w-full">
            {photos.map((photo) => (
              <img
                key={photo.public_id}
                src={toThumbnailUrl(photo)}
                alt="Foto compartida por un invitado"
                className="w-full aspect-square object-cover rounded-lg shadow-card"
                loading="lazy"
              />
            ))}
          </div>
        )}

        {photosStatus === 'empty' && (
          <p className="text-text-muted text-sm flex items-center gap-2">
            <ImageOff size={18} aria-hidden="true" />
            Todavía no hay fotos — ¡sé el primero!
          </p>
        )}
      </div>
    </section>
  )
}
