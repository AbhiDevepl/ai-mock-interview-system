#!/usr/bin/env bash
set -euo pipefail

# Move to script directory (safe execution from anywhere)
cd "$(dirname "$0")"

echo "==============================="
echo "🚀 Starting Application"
echo "==============================="

# Check Node.js
if ! command -v node >/dev/null 2>&1; then
  echo "❌ Node.js is not installed."
  exit 1
fi

# Load environment variables (basic support)
if [ -f ".env" ]; then
  echo "⚙️ Loading environment variables..."
  export $(grep -v '^#' .env | xargs)
fi

# Install dependencies if missing
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm install
fi

# Build only if needed
if [ ! -d ".next" ]; then
  echo "🏗️ Building application..."
  npm run build
else
  echo "⚡ Build exists, skipping build..."
fi

# Start server
echo "🌐 Starting server..."
exec npm run start