#!/usr/bin/env bash
set -euo pipefail

# Resolve script directory (works from anywhere)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Load env variables safely
if [ -f "../.env" ]; then
  export $(grep -v '^#' ../.env | xargs)
fi

# Ensure uv is installed
if ! command -v uv &> /dev/null; then
  echo "❌ uv is not installed. Install it: https://astral.sh/uv"
  exit 1
fi

# Ensure virtual environment exists
if [ ! -d ".venv" ]; then
  echo "⚡ Creating virtual environment..."
  uv venv
fi

# Install dependencies (fast + idempotent)
echo "📦 Syncing dependencies..."
uv pip install -r requirements.txt

# Run the agent
echo "🚀 Starting AI Interview Agent..."
exec uv run interview_agent.py