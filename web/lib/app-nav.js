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
        href: "/productos",
        label: "Productos",
        hint: "Agregar o cambiar precios",
      },
      {
        href: "/inventario",
        label: "Existencias",
        hint: "Ver cuánto hay en bodega",
      },
    ],
  },
  {
    id: "people",
    title: "Clientes y facturas",
    items: [
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
        hint: "Escribe como si hablaras con alguien",
      },
      {
        href: "/agent",
        label: "Asistente",
        hint: "Te ayuda paso a paso",
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
  "/chat",
  "/agent",
  "/settings",
]

/** Todo lo demás va en «Más opciones». */
export const MOBILE_MORE_HREFS = [
  "/productos",
  "/inventario",
  "/clientes",
  "/facturacion",
]

export function flattenNavItems() {
  return NAV_SECTIONS.flatMap((s) => s.items)
}

export function findNavItem(href) {
  return flattenNavItems().find((item) => item.href === href)
}
