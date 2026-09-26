export default function Gallery({ imagenes }) {
  if (!imagenes || imagenes.length === 0) return null

  return (
    <section id="galeria" className="section-padding max-w-6xl mx-auto">
      <div className="divider-accent" />

      <h2 className="font-script text-4xl text-center text-cta mb-10">
        Galería
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {imagenes.map((src, i) => (
          <a
            key={i}
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-lg overflow-hidden shadow-card hover:shadow-glass transition-shadow duration-200 cursor-pointer"
          >
            <img
              src={src}
              alt={`Galería — foto ${i + 1}`}
              className="w-full aspect-square object-cover"
              loading="lazy"
            />
          </a>
        ))}
      </div>
    </section>
  )
}
