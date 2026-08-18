/**
 * Menú principal — textos simples para usuarios sin experiencia en computación.
 * Usado en sidebar desktop y navegación móvil.
 */

export const NAV_SECTIONS = [
  {
    id: "daily",
    title: "Tu día en la tienda",
    items: [
      {
        href: "/dashboard",
        label: "Inicio",
        hint: "Resumen de ventas y existencias",
      },
      {
        href: "/ventas",
        label: "Cobrar venta",
        hint: "Buscar productos y cobrar",
      },
      {
        href: "/cotizaciones",
        label: "Cotizaciones",
        hint: "Presupuestos por WhatsApp",
      },
      {
        href: "/precios",
        label: "Consulta de precios",
        hint: "Menudeo, mayoreo y costo",
      },
    ],
  },
  {
    id: "people",
    title: "Clientes y facturas",
    items: [
      {
        href: "/negocio",
        label: "Mi negocio",
        hint: "Datos de la ferretería y ticket",
      },
      {
        href: "/clientes",
        label: "Clientes",
        hint: "Datos para vender y facturar",
      },
      {
        href: "/facturacion",
        label: "Facturas",
        hint: "Notas electrónicas (SAT)",
      },
    ],
  },
  {
    id: "help",
    title: "Ayuda y ajustes",
    items: [
      {
        href: "/chat",
        label: "Pregúntale al chat",
        hint: "Busca productos, vende y actualiza inventario",
      },
      {
        href: "/settings",
        label: "Configuración",
        hint: "Importar lista y modo prueba",
      },
    ],
  },
]

/** Accesos rápidos en la barra inferior (móvil). */
export const MOBILE_PRIMARY_HREFS = [
  "/dashboard",
  "/ventas",
  "/precios",
  "/chat",
]

/** @deprecated Usar menú completo (MobileMenuSheet). Mantener vacío. */
export const MOBILE_MORE_HREFS = []

export function flattenNavItems() {
  return NAV_SECTIONS.flatMap((s) => s.items)
}

export function findNavItem(href) {
  return flattenNavItems().find((item) => item.href === href)
}
