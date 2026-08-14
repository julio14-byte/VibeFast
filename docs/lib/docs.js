import fs from "node:fs"
import path from "node:path"
import matter from "gray-matter"
import GithubSlugger from "github-slugger"

const DOCS_DIR = path.join(process.cwd(), "..", "docs-content")

const SECTION_LABELS = {
  instalacion: "Instalación",
  smartpos: "Cómo usar la app",
}

const SECTION_ICONS = {
  instalacion: "Rocket",
  smartpos: "Store",
}

const SECTION_DESC = {
  instalacion: "Instala y publica SmartPOS.",
  smartpos: "Uso día a día en el mostrador.",
}

function stripOrderPrefix(name) {
  return name.replace(/^(\d+)[-_]/, "")
}

function humanize(slug) {
  return slug
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function readFrontmatter(filepath) {
  const raw = fs.readFileSync(filepath, "utf8")
  const { data, content } = matter(raw)
  return { data, content }
}

export function getDocsTree() {
  if (!fs.existsSync(DOCS_DIR)) return []

  const sections = fs
    .readdirSync(DOCS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith("_") && !d.name.startsWith("."))

  return sections
    .map((dir) => {
      const sectionSlug = stripOrderPrefix(dir.name)
      const sectionDir = path.join(DOCS_DIR, dir.name)

      const files = fs
        .readdirSync(sectionDir, { withFileTypes: true })
        .filter((f) => f.isFile() && f.name.endsWith(".mdx"))

      const pages = files
        .map((f) => {
          const filepath = path.join(sectionDir, f.name)
          const { data } = readFrontmatter(filepath)
          const baseName = f.name.replace(/\.mdx$/, "")
          const pageSlug = stripOrderPrefix(baseName)
          return {
            slug: pageSlug,
            label: data.title || humanize(pageSlug),
            order: data.order ?? 999,
            description: data.description || null,
            href: `/docs/${sectionSlug}/${pageSlug}`,
          }
        })
        .sort((a, b) => a.order - b.order || a.label.localeCompare(b.label))

      return {
        slug: sectionSlug,
        label: SECTION_LABELS[sectionSlug] || humanize(sectionSlug),
        icon: SECTION_ICONS[sectionSlug] || "Folder",
        description: SECTION_DESC[sectionSlug] || null,
        order: getSectionOrder(sectionSlug),
        pages,
      }
    })
    .sort((a, b) => a.order - b.order)
}

function getSectionOrder(slug) {
  const ORDER = ["instalacion", "smartpos"]
  const idx = ORDER.indexOf(slug)
  return idx === -1 ? 999 : idx
}

export function getDocBySlug(slugArray) {
  if (!slugArray || slugArray.length === 0) return null

  const tree = getDocsTree()
  const [sectionSlug, pageSlug] = slugArray

  const section = tree.find((s) => s.slug === sectionSlug)
  if (!section) return null

  const dirEntries = fs
    .readdirSync(DOCS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
  const realSectionDir = dirEntries.find((d) => stripOrderPrefix(d.name) === sectionSlug)
  if (!realSectionDir) return null

  const sectionPath = path.join(DOCS_DIR, realSectionDir.name)
  const files = fs.readdirSync(sectionPath).filter((f) => f.endsWith(".mdx"))
  const realFile = files.find((f) => stripOrderPrefix(f.replace(/\.mdx$/, "")) === pageSlug)
  if (!realFile) return null

  const filepath = path.join(sectionPath, realFile)
  const { data, content } = readFrontmatter(filepath)

  const allPages = tree.flatMap((s) => s.pages)
  const currentIdx = allPages.findIndex((p) => p.href === `/docs/${sectionSlug}/${pageSlug}`)
  const prev = currentIdx > 0 ? allPages[currentIdx - 1] : null
  const next = currentIdx < allPages.length - 1 ? allPages[currentIdx + 1] : null

  return {
    data,
    content,
    section: { slug: sectionSlug, label: section.label },
    page: { slug: pageSlug },
    prev,
    next,
  }
}

export function getAllDocSlugs() {
  return getDocsTree().flatMap((section) =>
    section.pages.map((page) => ({
      slug: [section.slug, page.slug],
    }))
  )
}

export function getHeadings(content) {
  const slugger = new GithubSlugger()
  const headings = []
  let inFence = false

  for (const line of content.split("\n")) {
    if (/^\s*```/.test(line)) {
      inFence = !inFence
      continue
    }
    if (inFence) continue

    const match = /^(#{2,3})\s+(.*)$/.exec(line)
    if (!match) continue

    const level = match[1].length
    const text = match[2]
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      .replace(/[*_`]/g, "")
      .trim()
    if (!text) continue

    headings.push({ level, text, id: slugger.slug(text) })
  }

  return headings
}

export function getSearchIndex() {
  const tree = getDocsTree()
  return tree.flatMap((section) =>
    section.pages.map((page) => {
      const doc = getDocBySlug([section.slug, page.slug])
      const headings = doc ? getHeadings(doc.content).map((h) => h.text) : []
      const body = doc
        ? doc.content
            .replace(/```[\s\S]*?```/g, " ")
            .replace(/[#>*_`\-|]/g, " ")
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 500)
        : ""
      return {
        title: page.label,
        section: section.slug,
        sectionLabel: section.label,
        href: page.href,
        description: page.description || "",
        headings,
        body,
      }
    })
  )
}
