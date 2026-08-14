import Link from "next/link"
import {
  ShoppingCart,
  PackageSearch,
  Users,
  FileText,
  MessageSquare,
  Bot,
  Settings,
} from "lucide-react"

const ACTIONS = [
  {
    href: "/ventas",
    label: "Cobrar venta",
    icon: ShoppingCart,
    hint: "Vender ahora",
  },
  {
    href: "/productos",
    label: "Productos",
    icon: PackageSearch,
    hint: "Precios y catálogo",
  },
  {
    href: "/chat",
    label: "Pregúntale",
    icon: MessageSquare,
    hint: "Chat de ayuda",
  },
  {
    href: "/agent",
    label: "Asistente",
    icon: Bot,
    hint: "Paso a paso",
  },
  {
    href: "/settings",
    label: "Ajustes",
    icon: Settings,
    hint: "Importar lista",
  },
  {
    href: "/clientes",
    label: "Clientes",
    icon: Users,
    hint: "Datos de clientes",
  },
  {
    href: "/facturacion",
    label: "Facturas",
    icon: FileText,
    hint: "Notas SAT",
  },
]

export default function QuickActionsBar() {
  return (
    <nav
      className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none sm:flex-wrap sm:overflow-visible"
      aria-label="Acciones rápidas"
    >
      {ACTIONS.map(({ href, label, icon: Icon, hint }) => (
        <Link
          key={href}
          href={href}
          title={hint}
          className="btn btn-ghost btn-sm gap-2 shrink-0 border border-base-300/80 bg-base-100/80 touch-manipulation min-h-11 hover:border-primary/40 hover:bg-primary/5"
        >
          <Icon className="size-4 opacity-70" />
          <span className="text-sm">{label}</span>
        </Link>
      ))}
    </nav>
  )
}
