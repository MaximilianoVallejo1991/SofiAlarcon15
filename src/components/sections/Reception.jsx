import { MapPin, Clock, Shirt } from 'lucide-react'

export default function Reception({
  lugar,
  direccion,
  hora,
  mapaEmbedUrl,
  codigoVestimenta,
}) {
  return (
    <section id="recepcion" className="section-padding max-w-4xl mx-auto">
      <div className="divider-accent" />

      <h2 className="font-script text-4xl text-center text-cta mb-10">
        Recepción
      </h2>

      {/* Details cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="glass-card text-center">
          <MapPin size={24} className="mx-auto mb-2 text-cta cursor-default" />
          <p className="text-sm text-text-muted uppercase tracking-wide">Lugar</p>
          <p className="text-text font-semibold">{lugar}</p>
          <p className="text-text-muted text-xs mt-1">{direccion}</p>
        </div>

        <div className="glass-card text-center">
          <Clock size={24} className="mx-auto mb-2 text-cta cursor-default" />
          <p className="text-sm text-text-muted uppercase tracking-wide">Hora</p>
          <p className="text-text font-semibold">{hora} hs</p>
        </div>

        <div className="glass-card text-center">
          <Shirt size={24} className="mx-auto mb-2 text-cta cursor-default" />
          <p className="text-sm text-text-muted uppercase tracking-wide">
            Vestimenta
          </p>
          <p className="text-text text-sm leading-relaxed">{codigoVestimenta}</p>
        </div>
      </div>

      {/* Map iframe */}
      {mapaEmbedUrl && (
        <div className="glass-card p-0 overflow-hidden">
          <iframe
            src={mapaEmbedUrl}
            width="100%"
            height="300"
            style={{ border: 0 }}
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title={`Mapa de ${lugar}`}
            className="w-full"
          />
          <div className="p-4 text-center">
            <p className="text-text-muted text-sm">{lugar} — {direccion}</p>
          </div>
        </div>
      )}
    </section>
  )
}
