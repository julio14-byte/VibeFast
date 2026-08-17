import {
  LayoutDashboard,
  ShoppingCart,
  PackageSearch,
  Boxes,
  Users,
  FileText,
  MessageSquare,
  Bot,
  Settings,
  ClipboardList,
} from "lucide-react"

export const NAV_ICONS = {
  "/dashboard": LayoutDashboard,
  "/ventas": ShoppingCart,
  "/cotizaciones": ClipboardList,
  "/productos": PackageSearch,
  "/inventario": Boxes,
  "/clientes": Users,
  "/facturacion": FileText,
  "/chat": MessageSquare,
  "/agent": Bot,
  "/settings": Settings,
}

/** Etiquetas cortas para la barra inferior móvil. */
export function navShortLabel(href, fallback = "") {
  const map = {
    "/dashboard": "Inicio",
    "/ventas": "Cobrar",
    "/cotizaciones": "Cotiz.",
    "/chat": "Chat",
    "/settings": "Ajustes",
    "/productos": "Productos",
    "/inventario": "Existencias",
    "/clientes": "Clientes",
    "/facturacion": "Facturas",
    "/agent": "Asistente",
  }
  return map[href] ?? fallback
}
