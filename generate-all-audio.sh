#!/bin/bash

# ============================================
# DO NOT RUN THIS ON RAILWAY!
# Run this locally, then commit the generated files
# ============================================

echo "====================================="
echo "Audio Pre-generation Script"
echo "====================================="
echo ""
echo "⚠️  IMPORTANT: Run this LOCALLY, not on Railway!"
echo ""
echo "Steps:"
echo "1. Get ElevenLabs API working (upgrade to paid or wait for unblock)"
echo "2. Run this script locally: ./generate-all-audio.sh"
echo "3. Check audio/cache/ folder for generated MP3 files"
echo "4. Commit the audio files to Git"
echo "5. Deploy to Railway with pre-generated audio"
echo ""
echo "Current Status:"
echo "- ElevenLabs Free Tier: BLOCKED"
echo "- Fallback: Browser TTS (working)"
echo ""

# Create directories
mkdir -p audio/cache
mkdir -p audio/fallback

# Check if we have API key
if [ -z "$ELEVENLABS_API_KEY" ]; then
    echo "❌ ELEVENLABS_API_KEY not found in environment"
    echo "   Add it to .env file first"
    exit 1
fi

echo "✓ API key found"
echo ""
echo "Ready to generate audio files?"
echo "This will create ~30 audio files for common phrases"
echo ""
read -p "Press Enter to start generation (Ctrl+C to cancel)..."

# Run the Node.js generation script
node js/audio-pregeneration.js

echo ""
echo "Generation complete!"
echo "Next steps:"
echo "1. git add audio/cache/"
echo "2. git commit -m 'Add pre-generated audio files'"
echo "3. git push"
echo "4. Railway will automatically deploy with the audio files"