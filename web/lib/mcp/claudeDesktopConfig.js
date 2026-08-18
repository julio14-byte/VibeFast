/**
 * Config JSON para Claude Desktop (stdio + mcp-remote).
 * @see https://github.com/geelen/mcp-remote
 */
export function buildClaudeDesktopMcpConfig(mcpUrl, apiKey) {
  const rawKey = apiKey.startsWith("spos_")
    ? apiKey
    : apiKey.replace(/^Bearer\s+/i, "")

  return {
    mcpServers: {
      "smartpos-productos": {
        command: "npx",
        args: [
          "-y",
          "mcp-remote@latest",
          mcpUrl,
          "--transport",
          "http-only",
          "--header",
          "Authorization:${SMARTPOS_TOKEN}",
        ],
        env: {
          SMARTPOS_TOKEN: `Bearer ${rawKey}`,
          PATH: process.env.PATH || "/usr/local/bin:/usr/bin:/bin",
        },
      },
    },
  }
}

export function buildClaudeDesktopMcpConfigJson(mcpUrl, apiKey) {
  return JSON.stringify(buildClaudeDesktopMcpConfig(mcpUrl, apiKey), null, 2)
}
