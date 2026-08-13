import { z } from "zod"

/**
 * Convierte un JSON Schema básico (OpenAI tools) a Zod para registerTool de MCP.
 */
export function jsonSchemaToZodShape(schema) {
  if (!schema?.properties) return {}

  const shape = {}
  const required = new Set(schema.required ?? [])

  for (const [key, prop] of Object.entries(schema.properties)) {
    let field

    switch (prop.type) {
      case "string":
        field = z.string()
        break
      case "number":
        field = z.number()
        break
      case "integer":
        field = z.number().int()
        break
      case "boolean":
        field = z.boolean()
        break
      default:
        field = z.any()
    }

    if (prop.description) {
      field = field.describe(prop.description)
    }

    if (!required.has(key)) {
      field = field.optional()
    }

    shape[key] = field
  }

  return shape
}
