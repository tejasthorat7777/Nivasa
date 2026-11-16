#!/bin/bash
# Nivasa Backend Startup Script
# Usage: ./start.sh [development|production]

set -e

echo "=== Nivasa Backend Deployment ==="

# Check for .env file
if [ ! -f .env ]; then
    echo "⚠️  .env file not found, using .env.example"
    cp .env.example .env
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install --production
fi

# Build TypeScript if dist doesn't exist or is outdated
if [ ! -d "dist" ] || [ "$1" = "development" ]; then
    echo "🔨 Building TypeScript..."
    npm run build
fi

# Start the server
echo "🚀 Starting server on port $PORT..."
node dist/index.js