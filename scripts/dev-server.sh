#!/bin/bash

# Development server script for ChokePidgin
# Serves the public folder on localhost:8080

echo "🌺 Starting ChokePidgin development server..."

# Kill any existing server on port 8080
echo "🔄 Checking for existing servers..."
pkill -f "http.server 8080" 2>/dev/null || true

# Wait a moment for cleanup
sleep 1

# Start the development server (using Express to support API)
echo "🚀 Starting Express server on http://localhost:3000"
echo "📂 Serving from: ./public/"
echo ""
echo "Available pages:"
echo "  🏠 Home: http://localhost:3000/"
echo "  📚 Dictionary: http://localhost:3000/dictionary.html"
echo "  🏝️ Ask a Local: http://localhost:3000/ask-local.html"
echo ""
echo "Note: Ensure you have run 'npm run build' first to generate the public folder."
echo ""
echo "Press Ctrl+C to stop the server"
echo "================================"

npm start