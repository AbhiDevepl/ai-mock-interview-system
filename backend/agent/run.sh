#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# ── Load env ──────────────────────────────────────────────────────────────────
if [ -f ".env" ]; then
  echo "⚙️  Loading environment variables..."
  set -o allexport
  source .env
  set +o allexport
fi

# ── Validate required env vars ───────────────────────────────────────────────
REQUIRED_VARS=(
  VIDEOSDK_API_KEY
  VIDEOSDK_SECRET_KEY
  GOOGLE_API_KEY
  SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY
)

for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var:-}" ]; then
    echo "❌ Missing required env var: $var"
    echo "   Add it to agent/.env before starting."
    exit 1
  fi
done

# ── Ensure uv is installed ────────────────────────────────────────────────────
if ! command -v uv &>/dev/null; then
  echo "❌ uv is not installed. Install it: https://astral.sh/uv"
  exit 1
fi

# ── Ensure virtual environment + dependencies ─────────────────────────────────
if [ ! -d ".venv" ]; then
  echo "⚡ Creating virtual environment (Python 3.12+)..."
  uv venv --python 3.12
fi

echo "📦 Installing / syncing dependencies..."
uv pip install -r requirements.txt --quiet

# ── Start the FastAPI server ──────────────────────────────────────────────────
echo ""
echo "======================================="
echo "🤖 AI Interview Agent — FastAPI Server"
echo "   Listening on http://0.0.0.0:8000"
echo "======================================="
echo ""

exec uv run uvicorn main:app --host 0.0.0.0 --port 8000 --log-level info