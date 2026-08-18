/** @type {import('next').NextConfig} */
import path from "node:path"
import { fileURLToPath } from "node:url"

const monorepoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..")

const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: monorepoRoot,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
  },
  async redirects() {
    return [
      // Docs simplificadas: solo instalación + uso
      { source: "/docs/setup/quick-start", destination: "/docs/instalacion/instalacion", permanent: true },
      { source: "/docs/setup/:path*", destination: "/docs/instalacion/instalacion", permanent: true },
      { source: "/docs/intro/:path*", destination: "/docs/smartpos/como-funciona", permanent: true },
      { source: "/docs/tutoriales/:path*", destination: "/docs/smartpos/como-funciona", permanent: true },
      { source: "/docs/features/:path*", destination: "/docs/smartpos/como-funciona", permanent: true },
      { source: "/docs/componentes/:path*", destination: "/docs/smartpos/como-funciona", permanent: true },
      { source: "/docs/recetas/:path*", destination: "/docs/smartpos/como-funciona", permanent: true },
      { source: "/docs/deploy/:path*", destination: "/docs/instalacion/instalacion", permanent: true },
      { source: "/docs/configuracion/stripe", destination: "/docs/instalacion/stripe", permanent: true },
      { source: "/docs/configuracion/:path*", destination: "/docs/instalacion/instalacion", permanent: true },
      { source: "/docs/fundamentos/:path*", destination: "/docs/instalacion/instalacion", permanent: true },
      { source: "/docs/troubleshooting/:path*", destination: "/docs/instalacion/instalacion", permanent: true },
      { source: "/docs/smartpos/mcp-productos", destination: "/docs/smartpos/configuracion", permanent: true },
      { source: "/mi-negocio", destination: "/negocio", permanent: false },
      { source: "/importar", destination: "/negocio", permanent: false },
      { source: "/importar-productos", destination: "/negocio", permanent: false },
    ]
  },
}

export default nextConfig
