#!/bin/bash

# Build script for ChokePidgin
# Builds production files from source

echo "🏗️ Building ChokePidgin..."

# Run the build process
node tools/build/build.js

# Check if build was successful
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Build completed successfully!"
    echo "📂 Production files are ready in ./public/"
    echo ""
    echo "🚀 To start development server:"
    echo "   ./scripts/dev-server.sh"
    echo ""
    echo "📦 To deploy, upload the ./public/ folder contents"
else
    echo ""
    echo "❌ Build failed!"
    exit 1
fi