import { MessageCircle } from 'lucide-react'

export default function Rsvp({ telefono, mensaje }) {
  const url = `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`

  return (
    <section id="confirmar" className="section-padding max-w-2xl mx-auto text-center">
      <div className="divider-accent" />

      <h2 className="font-script text-4xl text-cta mb-4">Confirmar asistencia</h2>
      <p className="text-text-muted mb-8">
        Por favor confirmá tu asistencia hasta el 01 de octubre
      </p>

      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-cta cursor-pointer w-full sm:w-auto justify-center"
      >
        <MessageCircle size={24} />
        Confirmar por WhatsApp
      </a>
    </section>
  )
}
