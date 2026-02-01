#!/bin/bash
# Claude Code remote session setup script
# This script runs automatically when a Claude Code remote session starts

set -e

echo "🚀 Setting up Claude Code remote session for StarFocus..."

# Install Bun if not present
if ! command -v bun &> /dev/null; then
  echo "📦 Installing Bun..."
  curl -fsSL https://bun.sh/install | bash
  export BUN_INSTALL="$HOME/.bun"
  export PATH="$BUN_INSTALL/bin:$PATH"
fi

# Determine project directory (fall back to script's parent directory)
PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/.." && pwd)}"

# Install project dependencies
echo "📦 Installing dependencies..."
cd "$PROJECT_DIR"
bun install

# Install Cypress binary (needed separately from npm package)
echo "🧪 Installing Cypress binary..."
bun cypress install

# Persist environment variables for subsequent commands
if [ -n "$CLAUDE_ENV_FILE" ]; then
  echo "📝 Persisting environment variables..."

  # Add Bun to PATH
  if [ -d "$HOME/.bun" ]; then
    echo 'export BUN_INSTALL="$HOME/.bun"' >> "$CLAUDE_ENV_FILE"
    echo 'export PATH="$BUN_INSTALL/bin:$PATH"' >> "$CLAUDE_ENV_FILE"
  fi

  # Add node_modules/.bin to PATH for local binaries (cypress, etc)
  echo 'export PATH="$PATH:./node_modules/.bin"' >> "$CLAUDE_ENV_FILE"
fi

echo "✅ Setup complete!"
exit 0
