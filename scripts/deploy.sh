#!/bin/bash

# Deploy script for ChokePidgin
# Builds and prepares for deployment

echo "🚀 Preparing ChokePidgin for deployment..."

# Run build first
echo "📦 Building production files..."
./scripts/build.sh

if [ $? -ne 0 ]; then
    echo "❌ Build failed! Cannot deploy."
    exit 1
fi

# Create deployment package
echo "📁 Creating deployment package..."
cd public
zip -r ../chokepidgin-deploy-$(date +%Y%m%d-%H%M%S).zip .
cd ..

echo ""
echo "✅ Deployment package created!"
echo "📦 Upload the contents of ./public/ to your web server"
echo "🌐 Or use the ZIP file for easy deployment"
echo ""
echo "🔍 Files to deploy:"
ls -la public/

echo ""
echo "🌺 ChokePidgin is ready for the world!"