#!/usr/bin/env bash
# Arregla "Authentication failed" / ECONNREFUSED vscode-git al hacer git push.
# Uso: bash scripts/fix-git-push.sh

set -euo pipefail

echo "→ Verificando GitHub CLI..."
if ! command -v gh >/dev/null 2>&1; then
  echo "Instala GitHub CLI: https://cli.github.com/"
  echo "  Ubuntu/Debian: sudo apt install gh"
  exit 1
fi

echo "→ Login en GitHub (sigue las instrucciones en pantalla)..."
gh auth login -h github.com -p https -w

echo "→ Configurando Git para usar gh como credential helper..."
gh auth setup-git

echo "→ Probando acceso al repo..."
gh repo view julio14-byte/VibeFast --json name -q .name || {
  echo "No tienes acceso al repo. Verifica que eres colaborador o usa tu fork."
  exit 1
}

REMOTE="$(git remote get-url origin 2>/dev/null || true)"
if [[ "$REMOTE" == *"@github.com"* ]] || [[ "$REMOTE" == *"x-access-token"* ]]; then
  echo "→ Normalizando remote origin a HTTPS limpio..."
  git remote set-url origin https://github.com/julio14-byte/VibeFast.git
fi

echo ""
echo "✓ Listo. Ahora ejecuta:"
echo "  git push origin main"
