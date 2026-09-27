import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

export default function Gift({ introTexto, transferencia }) {
  const { banco, alias, cbu, titular } = transferencia
  const [copied, setCopied] = useState(null)

  // ponytail: clipboard.writeText, zero deps
  const handleCopy = async (text, field) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(field)
      setTimeout(() => setCopied(null), 2000)
    } catch {
      // ponytail: clipboard may fail in insecure contexts, silently ignore
    }
  }

  return (
    <section id="regalo" className="section-padding max-w-3xl mx-auto">
      <div className="divider-accent" />

      <h2 className="font-script text-4xl text-center text-cta mb-6">
        Regalo
      </h2>

      {introTexto && (
        <p className="text-center font-serif text-text text-lg leading-relaxed max-w-xl mx-auto mb-8">
          {introTexto}
        </p>
      )}

      {/* Transfer details */}
      <div className="glass-card max-w-md mx-auto">
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-cta/10">
            <span className="text-text-muted text-sm">Banco</span>
            <span className="text-text font-semibold">{banco}</span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-cta/10">
            <span className="text-text-muted text-sm">Titular</span>
            <span className="text-text font-semibold">{titular}</span>
          </div>

          {/* Alias — copyable. Border-b only when CBU also renders below it —
              otherwise alias is the last row and shouldn't carry a trailing
              divider. */}
          <div
            className={`flex justify-between items-center gap-2 py-2 ${cbu ? 'border-b border-cta/10' : ''}`}
          >
            <span className="text-text-muted text-sm shrink-0">Alias</span>
            <button
              onClick={() => handleCopy(alias, 'alias')}
              className="copyable flex items-center gap-2 min-w-0 whitespace-nowrap text-right text-text font-semibold text-xs sm:text-base focus-visible:ring-3 focus-visible:ring-cta rounded"
            >
              {alias}
              {copied === 'alias' ? (
                <Check size={16} className="text-success" />
              ) : (
                <Copy size={16} className="text-text-muted/70" />
              )}
            </button>
          </div>

          {/* CBU — copyable, only rendered when actually provided (this account
              uses an alias only). CBU is a 22-digit unbroken string with no
              natural break point; min-w-0 + break-all keep it from forcing
              the row (and the card) to overflow horizontally on narrow
              phones — a flex item's default min-width:auto otherwise refuses
              to shrink below an unbreakable token's full rendered width. */}
          {cbu && (
            <div className="flex justify-between items-center gap-2 py-2">
              <span className="text-text-muted text-sm shrink-0">CBU</span>
              <button
                onClick={() => handleCopy(cbu, 'cbu')}
                className="copyable flex items-center gap-2 min-w-0 break-all text-right text-text font-mono text-sm focus-visible:ring-3 focus-visible:ring-cta rounded"
              >
                {cbu}
                {copied === 'cbu' ? (
                  <Check size={16} className="text-success" />
                ) : (
                  <Copy size={16} className="text-text-muted/70" />
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
