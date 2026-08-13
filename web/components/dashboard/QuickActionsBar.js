import Link from "next/link"
import {
  ShoppingCart,
  PackageSearch,
  Users,
  FileText,
  MessageSquare,
} from "lucide-react"

const ACTIONS = [
  { href: "/ventas", label: "Ventas", icon: ShoppingCart },
  { href: "/productos", label: "Productos", icon: PackageSearch },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/facturacion", label: "Facturación", icon: FileText },
  { href: "/chat", label: "Chat IA", icon: MessageSquare },
]

export default function QuickActionsBar() {
  return (
    <nav
      className="flex flex-wrap gap-2"
      aria-label="Acciones rápidas"
    >
      {ACTIONS.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className="btn btn-ghost btn-sm gap-2 border border-base-300/80 bg-base-100/80 hover:border-primary/40 hover:bg-primary/5"
        >
          <Icon className="size-4 opacity-70" />
          {label}
        </Link>
      ))}
    </nav>
  )
}
