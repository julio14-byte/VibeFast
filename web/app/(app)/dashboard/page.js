import Link from "next/link"
import {
  LayoutDashboard,
  PackageSearch,
  ShoppingCart,
  FileText,
  Users,
  MessageSquare,
  Bot,
} from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import config from "@/config"

export const metadata = { title: "Inicio · SmartPOS" }
export const dynamic = "force-dynamic"

const MODULES = [
  {
    href: "/ventas",
    label: "Ventas",
    desc: "Punto de venta y tickets",
    icon: ShoppingCart,
    color: "bg-primary/10 text-primary",
  },
  {
    href: "/productos",
    label: "Productos",
    desc: "Catálogo y precios",
    icon: PackageSearch,
    color: "bg-info/10 text-info",
  },
  {
    href: "/inventario",
    label: "Inventario",
    desc: "Stock y búsqueda",
    icon: LayoutDashboard,
    color: "bg-success/10 text-success",
  },
  {
    href: "/clientes",
    label: "Clientes",
    desc: "RFC y facturación",
    icon: Users,
    color: "bg-secondary/10 text-secondary",
  },
  {
    href: "/facturacion",
    label: "Facturación",
    desc: "CFDI 4.0 y PAC",
    icon: FileText,
    color: "bg-warning/10 text-warning",
  },
  {
    href: "/chat",
    label: "Chat",
    desc: "Asistente con IA",
    icon: MessageSquare,
    color: "bg-accent/10 text-accent",
  },
]

export default async function DashboardPage() {
  const supabase = await createClient()
  const { count: productos } = await supabase
    .from("productos")
    .select("*", { count: "exact", head: true })
  const { count: clientes } = await supabase
    .from("clientes")
    .select("*", { count: "exact", head: true })
  const { count: ventasHoy } = await supabase
    .from("ventas")
    .select("*", { count: "exact", head: true })
    .gte("created_at", new Date().toISOString().slice(0, 10))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {config.app.name}
        </h1>
        <p className="mt-1 text-sm text-base-content/70">
          Panel de tu ferretería — ventas, inventario y facturación.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-box border border-base-200 bg-base-100 p-4">
          <p className="text-sm text-base-content/60">Productos</p>
          <p className="text-2xl font-bold tabular-nums">{productos ?? 0}</p>
        </div>
        <div className="rounded-box border border-base-200 bg-base-100 p-4">
          <p className="text-sm text-base-content/60">Clientes</p>
          <p className="text-2xl font-bold tabular-nums">{clientes ?? 0}</p>
        </div>
        <div className="rounded-box border border-base-200 bg-base-100 p-4">
          <p className="text-sm text-base-content/60">Ventas hoy</p>
          <p className="text-2xl font-bold tabular-nums">{ventasHoy ?? 0}</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {MODULES.map(({ href, label, desc, icon: Icon, color }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-4 rounded-box border border-base-200 bg-base-100 p-4 hover:border-primary/30 hover:shadow-sm transition"
          >
            <div className={`rounded-lg p-3 ${color}`}>
              <Icon className="size-6" />
            </div>
            <div>
              <p className="font-semibold">{label}</p>
              <p className="text-sm text-base-content/60">{desc}</p>
            </div>
          </Link>
        ))}
        <Link
          href="/agent"
          className="flex items-center gap-4 rounded-box border border-base-200 bg-base-100 p-4 hover:border-primary/30 hover:shadow-sm transition"
        >
          <div className="rounded-lg p-3 bg-neutral/10 text-neutral">
            <Bot className="size-6" />
          </div>
          <div>
            <p className="font-semibold">Agente</p>
            <p className="text-sm text-base-content/60">Automatización IA</p>
          </div>
        </Link>
      </div>
    </div>
  )
}
