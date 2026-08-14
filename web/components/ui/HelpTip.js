import { Lightbulb } from "lucide-react"

/** Consejo corto para usuarios sin experiencia en computación. */
export default function HelpTip({ children, title = "Tip" }) {
  return (
    <div
      className="help-tip flex gap-3 rounded-xl border border-info/25 bg-info/5 px-4 py-3 text-sm text-base-content/80"
      role="note"
    >
      <Lightbulb
        className="size-5 shrink-0 text-info mt-0.5"
        aria-hidden
      />
      <div>
        <p className="font-semibold text-base-content text-sm">{title}</p>
        <p className="mt-0.5 leading-relaxed">{children}</p>
      </div>
    </div>
  )
}
