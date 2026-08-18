import Link from "next/link"
import { ArrowRight, Sparkles, LayoutDashboard, MessageSquare, Bot } from "lucide-react"
import config from "@/config"

const MOCK_NAV = [
  { label: "Dashboard", icon: LayoutDashboard, active: true },
  { label: "Chat", icon: MessageSquare },
  { label: "Agente", icon: Bot },
]

export default function Hero() {
  const { eyebrow, title, subtitle, cta, ctaSecondary } = config.landing.hero

  return (
    <section className="relative overflow-hidden">
      {/* Fondo: cuadrícula + glows de marca */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(75%_60%_at_50%_0%,#000,transparent)]"
        aria-hidden
      >
        <div className="hero-grid absolute inset-0 opacity-70" />
        <div className="absolute left-1/2 top-[-8rem] size-[640px] -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute right-[8%] top-[3rem] size-[360px] rounded-full bg-accent/15 blur-3xl" />
      </div>

      <div className="mx-auto max-w-4xl px-4 pt-20 pb-10 text-center md:pt-28">
        {eyebrow && (
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-base-300 bg-base-100/70 px-3 py-1 text-xs font-medium text-base-content/70 backdrop-blur">
            <Sparkles className="size-3.5 text-primary" />
            {eyebrow}
          </div>
        )}

        <h1 className="text-balance text-4xl font-bold tracking-tight md:text-6xl">{title}</h1>

        <p className="mx-auto mt-6 max-w-2xl text-balance text-lg leading-relaxed text-base-content/70 md:text-xl">
          {subtitle}
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link href={cta.href} className="btn btn-accent btn-lg">
            {cta.label}
            <ArrowRight className="size-4" />
          </Link>
          {ctaSecondary && (
            <Link href={ctaSecondary.href} className="btn btn-ghost btn-lg">
              {ctaSecondary.label}
            </Link>
          )}
        </div>

        <p className="mt-4 text-sm text-base-content/50">Gratis para empezar · sin tarjeta</p>
      </div>

      {/* Mockup de producto (navegador con la app dentro) */}
      <div className="mx-auto max-w-5xl px-4 pb-20 md:pb-28">
        <div className="mockup-browser border border-base-300 bg-base-100 shadow-2xl shadow-primary/10">
          <div className="mockup-browser-toolbar">
            <div className="input border border-base-300 text-base-content/50">
              https://{config.app.domain}/dashboard
            </div>
          </div>

          <div className="grid gap-4 border-t border-base-200 bg-base-200 p-4 sm:grid-cols-[168px_1fr] sm:p-6">
            {/* Sidebar */}
            <aside className="hidden rounded-xl bg-base-100 p-3 sm:block">
              <div className="mb-3 flex items-center gap-2 px-1">
                <span className="inline-flex size-6 items-center justify-center rounded-md bg-primary text-primary-content">
                  <svg viewBox="0 0 24 24" fill="none" className="size-[62%]">
                    <path
                      d="M3.5 12 H7 L10.5 18 L15.5 6 H20.5"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <span className="text-sm font-bold">{config.brand.logoText}</span>
              </div>
              <ul className="space-y-1">
                {MOCK_NAV.map(({ label, icon: Icon, active }) => (
                  <li
                    key={label}
                    className={
                      "flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm " +
                      (active
                        ? "bg-primary/10 font-medium text-primary"
                        : "text-base-content/60")
                    }
                  >
                    <Icon className="size-4" />
                    {label}
                  </li>
                ))}
              </ul>
            </aside>

            {/* Contenido */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="h-6 w-40 rounded-md bg-base-300" />
                <span className="btn btn-primary btn-sm pointer-events-none">Nuevo</span>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="rounded-xl border border-base-200 bg-base-100 p-4">
                    <div className="mb-3 size-8 rounded-lg bg-primary/15" />
                    <div className="mb-2 h-3 w-3/4 rounded bg-base-300" />
                    <div className="h-3 w-1/2 rounded bg-base-200" />
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-base-200 bg-base-100 p-4">
                <div className="flex items-center gap-2 text-xs font-medium text-base-content/50">
                  <Sparkles className="size-3.5 text-accent" />
                  Asistente AI
                </div>
                <div className="mt-3 space-y-2">
                  <div className="h-3 w-full rounded bg-base-200" />
                  <div className="h-3 w-5/6 rounded bg-base-200" />
                  <div className="h-3 w-2/3 rounded bg-base-200" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
