import Link from "next/link"
import * as LucideIcons from "lucide-react"
import { Rocket, Store, ChevronRight } from "lucide-react"
import { getDocsTree } from "@/lib/docs"

export const metadata = {
  title: "Documentación · SmartPOS",
  description: "Instala SmartPOS y aprende a usarlo en el mostrador.",
}

const CHIP_COLORS = [
  "bg-primary/10 text-primary",
  "bg-accent/10 text-accent",
  "bg-info/10 text-info",
  "bg-success/10 text-success",
  "bg-secondary/10 text-secondary",
]

function SectionIcon({ name, className }) {
  const Cmp = LucideIcons[name] || LucideIcons.Folder
  return <Cmp className={className} />
}

export default function DocsIndexPage() {
  const tree = getDocsTree()

  return (
    <div className="min-w-0">
      <h1 className="font-heading text-4xl font-bold tracking-tight md:text-5xl">
        Documentación SmartPOS
      </h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-base-content/60 md:text-xl">
        Cómo instalar la app y usarla día a día en tu ferretería o tienda.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/docs/instalacion/instalacion"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-content transition hover:opacity-90"
        >
          <Rocket className="size-4" /> Instalación
        </Link>
        <Link
          href="/docs/smartpos/como-funciona"
          className="inline-flex items-center gap-2 rounded-lg border border-base-300 px-4 py-2 text-sm font-medium transition hover:border-primary/40 hover:text-primary"
        >
          <Store className="size-4" /> Cómo usar la app
        </Link>
      </div>

      <div className="mt-10 grid gap-5 sm:grid-cols-2">
        {tree.map((section, i) => (
          <div
            key={section.slug}
            className="rounded-2xl border border-base-200 bg-base-100 p-5 transition hover:border-primary/40 hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              <span
                className={
                  "inline-flex size-9 items-center justify-center rounded-xl " +
                  CHIP_COLORS[i % CHIP_COLORS.length]
                }
              >
                <SectionIcon name={section.icon} className="size-[18px]" />
              </span>
              <h2 className="font-heading text-lg font-semibold">{section.label}</h2>
            </div>

            {section.description && (
              <p className="mt-2 text-sm text-base-content/60">{section.description}</p>
            )}

            <ul className="mt-4 space-y-1">
              {section.pages.map((page) => (
                <li key={page.href}>
                  <Link
                    href={page.href}
                    className="group/link flex items-center gap-1.5 rounded-md py-0.5 text-sm text-base-content/70 transition hover:text-primary"
                  >
                    <ChevronRight className="size-3.5 shrink-0 text-base-content/30 transition group-hover/link:text-primary" />
                    {page.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
