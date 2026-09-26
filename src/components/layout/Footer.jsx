import { Heart } from 'lucide-react'

export default function Footer({ padres, copyright }) {
  return (
    <footer className="bg-surface/70 backdrop-blur-md border-t border-cta/10 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto text-center space-y-6">


        {/* Divider with heart */}
        <div className="flex items-center justify-center gap-3 text-cta/40">
          <div className="h-px w-12 bg-cta/20" />
          <Heart size={16} className="text-cta" />
          <div className="h-px w-12 bg-cta/20" />
        </div>

        <p className="text-text-muted text-sm">{copyright}</p>
      </div>
    </footer>
  )
}
