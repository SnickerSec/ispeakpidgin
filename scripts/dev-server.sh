#!/bin/bash

# Development server script for ChokePidgin
# Serves the public folder on localhost:8080

echo "🌺 Starting ChokePidgin development server..."

# Kill any existing server on port 8080
echo "🔄 Checking for existing servers..."
pkill -f "http.server 8080" 2>/dev/null || true

# Wait a moment for cleanup
sleep 1

# Start the development server
echo "🚀 Starting server on http://localhost:8080"
echo "📂 Serving from: ./public/"
echo ""
echo "Available pages:"
echo "  🏠 Home: http://localhost:8080/"
echo "  📚 Dictionary: http://localhost:8080/dictionary.html"
echo "  🏝️ Ask a Local: http://localhost:8080/ask-local.html"
echo ""
echo "Development tools:"
echo "  🧪 Migration Test: http://localhost:8080/../tools/testing/test-migration.html"
echo "  🔧 Migration Tools: http://localhost:8080/../tools/migration/migrate-data.html"
echo ""
echo "Press Ctrl+C to stop the server"
echo "================================"

cd public && python3 -m http.server 8080