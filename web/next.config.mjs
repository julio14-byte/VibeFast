/** @type {import('next').NextConfig} */
import path from "node:path"
import { fileURLToPath } from "node:url"

const monorepoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..")

const nextConfig = {
  reactStrictMode: true,
  // Incluye docs-content (fuera de web/) en el bundle serverless de Vercel.
  outputFileTracingRoot: monorepoRoot,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" }, // avatares Google
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
  },
  async redirects() {
    // Páginas de docs que se movieron de sección (reorg de la IA)
    return [
      {
        source: "/docs/fundamentos/prepara-tu-compu",
        destination: "/docs/setup/prepara-tu-compu",
        permanent: true,
      },
      // github-ssh se eliminó: el flujo con HTTPS + Cursor no necesita SSH
      {
        source: "/docs/fundamentos/github-ssh",
        destination: "/docs/setup/quick-start",
        permanent: true,
      },
      {
        source: "/docs/setup/github-ssh",
        destination: "/docs/setup/quick-start",
        permanent: true,
      },
      {
        source: "/docs/setup/instalacion",
        destination: "/docs/setup/prepara-tu-compu",
        permanent: true,
      },
      // Páginas movidas a la sección Configuración
      ...["variables-de-entorno", "google-oauth", "openai", "resend", "posthog", "stripe"].map(
        (slug) => ({
          source: `/docs/setup/${slug}`,
          destination: `/docs/configuracion/${slug}`,
          permanent: true,
        })
      ),
    ]
  },
}

export default nextConfig
